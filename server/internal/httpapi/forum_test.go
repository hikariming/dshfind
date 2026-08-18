package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

const testWebOrigin = "https://dshfind.test"

func TestPluginDiscussionIsPublicAndCacheable(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.discussion = store.PluginDiscussion{
		FullName: "Owner/Repo", Up: 3, Down: 1,
		Comments: []store.ForumPost{{ID: 7, BodyMD: "很好用", Kind: "comment", CreatedAt: "2026-08-18T00:00:00Z"}},
	}

	// 路径大小写不敏感,但落到 store 的必须是快照里的规范写法
	rec := do(t, s, http.MethodGet, "/v1/plugins/owner/repo/discussion", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("discussion status = %d, want 200", rec.Code)
	}
	if forum.readFullName != "Owner/Repo" {
		t.Errorf("store queried with %q, want canonical Owner/Repo", forum.readFullName)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Allow-Origin = %q, want * (公开读要能被任何来源直连)", got)
	}
	if rec.Header().Get("ETag") == "" || !strings.Contains(rec.Header().Get("Cache-Control"), "s-maxage") {
		t.Errorf("discussion is not cacheable: %#v", rec.Header())
	}
	var body store.PluginDiscussion
	decodeJSON(t, rec, &body)
	if body.Up != 3 || body.Down != 1 || len(body.Comments) != 1 {
		t.Errorf("discussion body = %#v", body)
	}
}

func TestDiscussionRejectsUnknownPlugin(t *testing.T) {
	s, _ := newForumTestServer(t)
	rec := do(t, s, http.MethodGet, "/v1/plugins/nobody/nothing/discussion", "", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("unknown plugin status = %d, want 404", rec.Code)
	}
}

func TestCommentRequiresSessionAndSiteOrigin(t *testing.T) {
	s, forum := newForumTestServer(t)
	payload := `{"body_md":"装不上,报错 ENOENT"}`

	// 未登录
	rec := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin, strings.NewReader(payload))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("anonymous comment status = %d, want 401", rec.Code)
	}
	// 登录了,但请求来自第三方站点(SameSite=Lax 下跨站 POST 仍会带上 Cookie)
	rec = do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", "https://evil.example",
		strings.NewReader(payload), sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("cross-site comment status = %d, want 403", rec.Code)
	}
	// 没有 Origin 头的裸请求同样挡掉
	rec = do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", "",
		strings.NewReader(payload), sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("origin-less comment status = %d, want 403", rec.Code)
	}
	if forum.commentCount != 0 {
		t.Fatalf("被拒的请求仍然写入了 %d 条评论", forum.commentCount)
	}
}

func TestCommentStoresAuthorSnapshotAndNormalizedLocale(t *testing.T) {
	s, forum := newForumTestServer(t)
	rec := do(t, s, http.MethodPost, "/v1/plugins/Owner/Repo/comments", testWebOrigin,
		strings.NewReader(`{"body_md":"  很好用  ","kind":"issue","locale":"xx"}`), sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusCreated {
		t.Fatalf("comment status = %d, want 201", rec.Code)
	}
	if forum.lastBody != "很好用" {
		t.Errorf("body_md = %q, want trimmed", forum.lastBody)
	}
	if forum.lastKind != store.PostKindIssue {
		t.Errorf("kind = %q, want issue", forum.lastKind)
	}
	if forum.lastLocale != "zh" {
		t.Errorf("locale = %q, want fallback zh", forum.lastLocale)
	}
	if forum.lastAuthor.Login != "mias" || forum.lastFullName != "Owner/Repo" {
		t.Errorf("author/plugin = %#v %q", forum.lastAuthor, forum.lastFullName)
	}
}

func TestCommentValidationLimits(t *testing.T) {
	s, forum := newForumTestServer(t)
	cookie := sessionCookie(t, s, "mias")

	cases := []struct {
		name string
		body string
	}{
		{"empty", `{"body_md":"   "}`},
		{"oversized", `{"body_md":"` + strings.Repeat("a", maxCommentBytes+1) + `"}`},
		{"link farm", `{"body_md":"` + strings.Repeat("https://spam.example ", maxCommentLinks+1) + `"}`},
		{"bad kind", `{"body_md":"hi","kind":"spam"}`},
		{"broken json", `{`},
	}
	for _, tc := range cases {
		rec := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin, strings.NewReader(tc.body), cookie)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("%s status = %d, want 400", tc.name, rec.Code)
		}
	}
	if forum.commentCount != 0 {
		t.Fatalf("非法请求写进了 %d 条评论", forum.commentCount)
	}
}

func TestVoteIsOnePerUserAndRevocable(t *testing.T) {
	s, forum := newForumTestServer(t)
	cookie := sessionCookie(t, s, "mias")

	rec := do(t, s, http.MethodPut, "/v1/plugins/owner/repo/vote", testWebOrigin,
		strings.NewReader(`{"verdict":"up"}`), cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("vote status = %d, want 200", rec.Code)
	}
	var voted voteResponse
	decodeJSON(t, rec, &voted)
	if voted.MyVote == nil || *voted.MyVote != store.VerdictUp || voted.Up != 1 {
		t.Errorf("vote body = %#v", voted)
	}
	if rec.Header().Get("Cache-Control") != "private, no-store" {
		t.Errorf("投票响应可被共享缓存留存: %q", rec.Header().Get("Cache-Control"))
	}

	// 改票:同一个人不会变成两票
	do(t, s, http.MethodPut, "/v1/plugins/owner/repo/vote", testWebOrigin,
		strings.NewReader(`{"verdict":"down"}`), cookie)
	if forum.votes["mias"] != store.VerdictDown || len(forum.votes) != 1 {
		t.Errorf("votes = %#v, want single flipped vote", forum.votes)
	}

	rec = do(t, s, http.MethodDelete, "/v1/plugins/owner/repo/vote", testWebOrigin, nil, cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("unvote status = %d, want 200", rec.Code)
	}
	decodeJSON(t, rec, &voted)
	if voted.MyVote != nil || len(forum.votes) != 0 {
		t.Errorf("撤票后仍留下 %#v / %#v", voted.MyVote, forum.votes)
	}

	rec = do(t, s, http.MethodPut, "/v1/plugins/owner/repo/vote", testWebOrigin,
		strings.NewReader(`{"verdict":"maybe"}`), cookie)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("非法 verdict status = %d, want 400", rec.Code)
	}
}

func TestMyVoteNeedsCredentialsAndIsNeverShared(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.votes["mias"] = store.VerdictUp

	rec := do(t, s, http.MethodGet, "/v1/me/plugin-votes/owner/repo", testWebOrigin, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("anonymous my-vote status = %d, want 401", rec.Code)
	}
	rec = do(t, s, http.MethodGet, "/v1/me/plugin-votes/owner/repo", "https://evil.example", nil, sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("cross-site my-vote status = %d, want 403", rec.Code)
	}

	rec = do(t, s, http.MethodGet, "/v1/me/plugin-votes/owner/repo", testWebOrigin, nil, sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusOK {
		t.Fatalf("my-vote status = %d, want 200", rec.Code)
	}
	if rec.Header().Get("Cache-Control") != "private, no-store" {
		t.Errorf("个人投票可被共享缓存留存: %q", rec.Header().Get("Cache-Control"))
	}
	if rec.Header().Get("Access-Control-Allow-Credentials") != "true" ||
		rec.Header().Get("Access-Control-Allow-Origin") != testWebOrigin {
		t.Errorf("credentialed CORS headers = %#v", rec.Header())
	}
	var body struct {
		MyVote *string `json:"my_vote"`
	}
	decodeJSON(t, rec, &body)
	if body.MyVote == nil || *body.MyVote != store.VerdictUp {
		t.Errorf("my_vote = %#v", body.MyVote)
	}
}

func TestOnlyAuthorCanDeleteOwnPost(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.postOwners = map[int64]string{1: "mias", 2: "someone-else"}

	rec := do(t, s, http.MethodDelete, "/v1/forum/posts/1", testWebOrigin, nil, sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusNoContent {
		t.Fatalf("delete own post status = %d, want 204", rec.Code)
	}
	// 别人的帖子和不存在的帖子回同一个 404,不给探测 id 的机会
	for _, id := range []string{"2", "999"} {
		rec = do(t, s, http.MethodDelete, "/v1/forum/posts/"+id, testWebOrigin, nil, sessionCookie(t, s, "mias"))
		if rec.Code != http.StatusNotFound {
			t.Errorf("delete post %s status = %d, want 404", id, rec.Code)
		}
	}
	if len(forum.deleted) != 1 || forum.deleted[0] != 1 {
		t.Errorf("deleted = %#v, want only own post", forum.deleted)
	}
}

func TestForumWriteRateLimitIsPerUserAndHourly(t *testing.T) {
	s, _ := newForumTestServer(t)
	// 每小时 5 条、允许连发 2 条
	s.cfg.ForumCommentRatePerHour = 5
	s.cfg.ForumCommentBurst = 2
	cookie := sessionCookie(t, s, "mias")

	for i := range 2 {
		rec := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin,
			strings.NewReader(`{"body_md":"ok"}`), cookie)
		if rec.Code != http.StatusCreated {
			t.Fatalf("comment %d status = %d, want 201", i, rec.Code)
		}
	}
	rec := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin,
		strings.NewReader(`{"body_md":"third"}`), cookie)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("third comment status = %d, want 429", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("429 没有给出 Retry-After")
	}
	// 换个账号不受别人的额度影响
	other := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin,
		strings.NewReader(`{"body_md":"ok"}`), sessionCookie(t, s, "someone-else"))
	if other.Code != http.StatusCreated {
		t.Fatalf("另一个用户被别人的额度挡住了: %d", other.Code)
	}
}

func TestCredentialedPreflightRejectsForeignOrigins(t *testing.T) {
	s, _ := newForumTestServer(t)

	rec := do(t, s, http.MethodOptions, "/v1/plugins/owner/repo/comments", "https://evil.example", nil)
	if rec.Code != http.StatusForbidden {
		t.Errorf("foreign preflight status = %d, want 403", rec.Code)
	}
	rec = do(t, s, http.MethodOptions, "/v1/plugins/owner/repo/comments", testWebOrigin, nil)
	if rec.Code != http.StatusNoContent || rec.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("site preflight = %d %#v", rec.Code, rec.Header())
	}
	// 公开读的预检仍是宽松的 *
	rec = do(t, s, http.MethodOptions, "/v1/plugins/owner/repo/discussion", "https://anyone.example", nil)
	if rec.Code != http.StatusNoContent || rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("public preflight = %d %#v", rec.Code, rec.Header())
	}
}

// --- helpers ---

func newForumTestServer(t *testing.T) (*Server, *fakeForumStore) {
	t.Helper()
	pluginCache := cache.New(nil)
	plugin := store.Plugin{FullName: "Owner/Repo"}
	pluginCache.Seed(&cache.Snapshot{
		Plugins:    []store.Plugin{plugin},
		ByFullName: map[string]*store.Plugin{"owner/repo": &plugin},
	})

	s := New(&config.Config{
		WebURL:                  testWebOrigin,
		APIPublicURL:            "https://api.dshfind.test",
		AuthSecret:              "0123456789abcdef0123456789abcdef",
		GlobalRatePerMin:        6000,
		GlobalRateBurst:         600,
		IPRatePerMin:            600,
		IPRateBurst:             600,
		AnonRatePerMin:          600,
		AnonRateBurst:           600,
		AuthRatePerMin:          600,
		AuthRateBurst:           600,
		AuthGlobalRatePerMin:    6000,
		AuthGlobalRateBurst:     6000,
		ForumCommentRatePerHour: 60,
		ForumCommentBurst:       30,
		ForumVoteRatePerHour:    60,
		ForumVoteBurst:          30,
		RateLimitMaxBuckets:     100,
	}, pluginCache, nil, audit.New(nil), ratelimit.New(100))

	forum := newFakeForumStore()
	s.forum = forum
	return s, forum
}

func do(t *testing.T, s *Server, method, path, origin string, body *strings.Reader, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var request *http.Request
	if body == nil {
		request = httptest.NewRequest(method, "https://api.dshfind.test"+path, nil)
	} else {
		request = httptest.NewRequest(method, "https://api.dshfind.test"+path, body)
		request.Header.Set("Content-Type", "application/json")
	}
	if origin != "" {
		request.Header.Set("Origin", origin)
	}
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, request)
	return rec
}

func sessionCookie(t *testing.T, s *Server, login string) *http.Cookie {
	t.Helper()
	token, err := s.signSession(sessionUser{Login: login})
	if err != nil {
		t.Fatal(err)
	}
	return &http.Cookie{Name: sessionCookieName, Value: token}
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, dst any) {
	t.Helper()
	if err := json.Unmarshal(rec.Body.Bytes(), dst); err != nil {
		t.Fatalf("decode response %q: %v", rec.Body.String(), err)
	}
}

// fakeForumStore 只保留断言需要的状态:投票语义、写入次数与调用参数。
type fakeForumStore struct {
	discussion   store.PluginDiscussion
	votes        map[string]string
	postOwners   map[int64]string
	deleted      []int64
	commentCount int
	readFullName string
	lastFullName string
	lastLocale   string
	lastBody     string
	lastKind     string
	lastAuthor   store.Author
}

func newFakeForumStore() *fakeForumStore {
	return &fakeForumStore{votes: map[string]string{}, postOwners: map[int64]string{}}
}

func (f *fakeForumStore) PluginDiscussion(_ context.Context, fullName string, _ int) (store.PluginDiscussion, error) {
	f.readFullName = fullName
	return f.discussion, nil
}

func (f *fakeForumStore) PluginVoteCounts(context.Context, string) (int, int, error) {
	up, down := 0, 0
	for _, verdict := range f.votes {
		if verdict == store.VerdictUp {
			up++
		} else {
			down++
		}
	}
	return up, down, nil
}

func (f *fakeForumStore) PluginVote(_ context.Context, _, login string) (string, error) {
	return f.votes[login], nil
}

func (f *fakeForumStore) SetPluginVote(_ context.Context, _, login, verdict string) error {
	f.votes[login] = verdict
	return nil
}

func (f *fakeForumStore) ClearPluginVote(_ context.Context, _, login string) error {
	delete(f.votes, login)
	return nil
}

func (f *fakeForumStore) AddPluginComment(_ context.Context, fullName, locale string, author store.Author, bodyMD, kind string) (store.ForumPost, error) {
	f.commentCount++
	f.lastFullName, f.lastLocale, f.lastBody, f.lastKind, f.lastAuthor = fullName, locale, bodyMD, kind, author
	return store.ForumPost{ID: int64(f.commentCount), BodyMD: bodyMD, Kind: kind, Author: author}, nil
}

func (f *fakeForumStore) SoftDeletePost(_ context.Context, id int64, login string) error {
	if f.postOwners[id] != login {
		return store.ErrPostNotFound
	}
	f.deleted = append(f.deleted, id)
	delete(f.postOwners, id)
	return nil
}

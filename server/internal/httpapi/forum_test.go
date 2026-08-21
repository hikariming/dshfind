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

// --- BBS（Phase 2）---

func TestThreadListIsPublicAndFiltered(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.threads = []store.Thread{
		{Slug: "a", Board: store.BoardGeneral, Title: "综合", Locale: "zh"},
		{Slug: "b", Board: store.BoardHelp, Title: "help", Locale: "en"},
		{Slug: "c", Board: store.BoardPlugin, Title: "Owner/Repo", Locale: "zh"},
	}

	rec := do(t, s, http.MethodGet, "/v1/forum/threads", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want 200", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Allow-Origin = %q, want *", got)
	}
	if rec.Header().Get("ETag") == "" || !strings.Contains(rec.Header().Get("Cache-Control"), "s-maxage") {
		t.Errorf("列表不可缓存: %#v", rec.Header())
	}
	var page threadListResponse
	decodeJSON(t, rec, &page)
	// 不带 board = 总板块混排，插件讨论也在里面（冷启动期内容少也不显得空）
	if len(page.Items) != 3 || page.BoardCounts[store.BoardPlugin] != 1 {
		t.Errorf("默认视图 = %#v", page)
	}
	if page.PerPage != threadsPerPageDef || page.Page != 1 {
		t.Errorf("分页缺省值 = %d/%d", page.Page, page.PerPage)
	}

	rec = do(t, s, http.MethodGet, "/v1/forum/threads?board=help&locale=en&page=2&per_page=999", "", nil)
	decodeJSON(t, rec, &page)
	if forum.listBoard != store.BoardHelp || forum.listLocale != "en" {
		t.Errorf("过滤参数没传到 store: %q/%q", forum.listBoard, forum.listLocale)
	}
	if forum.listLimit != threadsPerPageMax || forum.listOffset != threadsPerPageMax {
		t.Errorf("per_page 没有被夹到上限: limit=%d offset=%d", forum.listLimit, forum.listOffset)
	}

	// 拼错的过滤条件退化成"不过滤"，不能把页面变成空列表
	do(t, s, http.MethodGet, "/v1/forum/threads?board=nope&locale=xx", "", nil)
	if forum.listBoard != "" || forum.listLocale != "" {
		t.Errorf("非法过滤没有被忽略: %q/%q", forum.listBoard, forum.listLocale)
	}
}

func TestThreadDetailReturns404ForUnknownSlug(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.threads = []store.Thread{{Slug: "hello-1234", Title: "hello"}}

	rec := do(t, s, http.MethodGet, "/v1/forum/threads/hello-1234", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("thread status = %d, want 200", rec.Code)
	}
	if rec.Code = do(t, s, http.MethodGet, "/v1/forum/threads/nope", "", nil).Code; rec.Code != http.StatusNotFound {
		t.Errorf("unknown thread status = %d, want 404", rec.Code)
	}
}

func TestCreateThreadRequiresSessionAndSiteOrigin(t *testing.T) {
	s, forum := newForumTestServer(t)
	payload := `{"board":"general","title":"标题","body_md":"正文"}`

	rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin, strings.NewReader(payload))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("anonymous thread status = %d, want 401", rec.Code)
	}
	rec = do(t, s, http.MethodPost, "/v1/forum/threads", "https://evil.example",
		strings.NewReader(payload), sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("cross-site thread status = %d, want 403", rec.Code)
	}
	if len(forum.threads) != 0 {
		t.Fatalf("被拒的请求写入了 %d 个帖子", len(forum.threads))
	}
}

func TestCreateThreadStoresTrimmedFieldsAndNormalizedLocale(t *testing.T) {
	s, forum := newForumTestServer(t)
	rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(`{"board":"dev","title":"  写插件的三个坑  ","body_md":"  # 正文  ","locale":"xx"}`),
		sessionCookie(t, s, "mias"))
	if rec.Code != http.StatusCreated {
		t.Fatalf("create thread status = %d, want 201 (%s)", rec.Code, rec.Body.String())
	}
	if forum.lastThread.Title != "写插件的三个坑" || forum.lastThread.BodyMD != "# 正文" {
		t.Errorf("标题/正文没有 trim: %#v", forum.lastThread)
	}
	if forum.lastThread.Locale != "zh" || forum.lastThread.Author.Login != "mias" {
		t.Errorf("locale/author = %q/%q", forum.lastThread.Locale, forum.lastThread.Author.Login)
	}
	if rec.Header().Get("Cache-Control") != "private, no-store" {
		t.Errorf("发帖响应可被共享缓存留存: %q", rec.Header().Get("Cache-Control"))
	}
}

func TestCreateThreadValidationLimits(t *testing.T) {
	s, forum := newForumTestServer(t)
	cookie := sessionCookie(t, s, "mias")

	cases := []struct {
		name string
		body string
		want int
	}{
		{"unknown board", `{"board":"nope","title":"t","body_md":"b"}`, http.StatusBadRequest},
		// plugin 板不能手动发帖：插件讨论帖只由首条评论按确定性 slug 建出来，
		// 否则同一个插件会有两个讨论帖，详情页只认得其中一个。
		{"plugin board", `{"board":"plugin","title":"t","body_md":"b"}`, http.StatusBadRequest},
		{"empty title", `{"board":"general","title":"  ","body_md":"b"}`, http.StatusBadRequest},
		{"long title", `{"board":"general","title":"` + strings.Repeat("标", maxThreadTitleRunes+1) + `","body_md":"b"}`, http.StatusBadRequest},
		{"empty body", `{"board":"general","title":"t","body_md":""}`, http.StatusBadRequest},
		{"oversized body", `{"board":"general","title":"t","body_md":"` + strings.Repeat("a", maxThreadBodyBytes+1) + `"}`, http.StatusBadRequest},
		{"link farm", `{"board":"general","title":"t","body_md":"` + strings.Repeat("https://spam.example ", maxThreadBodyLinks+1) + `"}`, http.StatusBadRequest},
		{"broken json", `{`, http.StatusBadRequest},
	}
	for _, tc := range cases {
		rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin, strings.NewReader(tc.body), cookie)
		if rec.Code != tc.want {
			t.Errorf("%s status = %d, want %d", tc.name, rec.Code, tc.want)
		}
	}
	if len(forum.threads) != 0 {
		t.Fatalf("非法请求写进了 %d 个帖子", len(forum.threads))
	}

	// 一篇 SEO 长文（远超评论的 10KB）必须能发出去
	long := `{"board":"general","title":"长文","body_md":"` + strings.Repeat("a", maxCommentBytes+1) + `"}`
	if rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin, strings.NewReader(long), cookie); rec.Code != http.StatusCreated {
		t.Errorf("长文被挡住了: %d %s", rec.Code, rec.Body.String())
	}
}

func TestCustomSlugIsNormalizedOrRejected(t *testing.T) {
	s, forum := newForumTestServer(t)
	cookie := sessionCookie(t, s, "mias")

	rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(`{"board":"general","title":"写插件的三个坑","body_md":"b","slug":"DSH Plugin Guide!"}`),
		cookie)
	if rec.Code != http.StatusCreated {
		t.Fatalf("custom slug status = %d, want 201 (%s)", rec.Code, rec.Body.String())
	}
	if forum.lastThread.Slug != "dsh-plugin-guide" {
		t.Errorf("slug = %q, want dsh-plugin-guide", forum.lastThread.Slug)
	}

	// 填了但一个 ASCII 字母数字都没有：必须报错，不能静默换成别的地址
	rec = do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(`{"board":"general","title":"标题","body_md":"b","slug":"纯中文"}`), cookie)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("非 ASCII 自定义 slug status = %d, want 400", rec.Code)
	}

	// 不填则由 store 从标题生成
	rec = do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(`{"board":"general","title":"标题","body_md":"b"}`), cookie)
	if rec.Code != http.StatusCreated || forum.lastThread.Slug == "" {
		t.Errorf("默认 slug = %d %q", rec.Code, forum.lastThread.Slug)
	}
}

func TestAnnounceBoardIsMaintainerOnly(t *testing.T) {
	s, forum := newForumTestServer(t)
	payload := `{"board":"announce","title":"公告","body_md":"内容"}`

	rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(payload), sessionCookie(t, s, "someone-else"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("普通用户发公告 status = %d, want 403", rec.Code)
	}
	// 名单大小写不敏感：GitHub login 本身就不区分大小写
	rec = do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(payload), sessionCookie(t, s, "MIAS"))
	if rec.Code != http.StatusCreated {
		t.Errorf("维护者发公告 status = %d, want 201", rec.Code)
	}
	if len(forum.threads) != 1 {
		t.Errorf("公告写入次数 = %d, want 1", len(forum.threads))
	}
}

func TestThreadReplyRespectsLockAndLimits(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.threads = []store.Thread{
		{Slug: "open", Author: store.Author{Login: "mias"}},
		{Slug: "locked", IsLocked: true},
	}
	cookie := sessionCookie(t, s, "mias")

	rec := do(t, s, http.MethodPost, "/v1/forum/threads/open/posts", testWebOrigin,
		strings.NewReader(`{"body_md":"  同意  "}`), cookie)
	if rec.Code != http.StatusCreated {
		t.Fatalf("reply status = %d, want 201", rec.Code)
	}
	if len(forum.replies) != 1 || forum.replies[0] != "同意" {
		t.Errorf("replies = %#v, want trimmed", forum.replies)
	}

	for _, tc := range []struct {
		name, slug, body string
		want             int
	}{
		{"locked", "locked", `{"body_md":"hi"}`, http.StatusConflict},
		{"missing", "nope", `{"body_md":"hi"}`, http.StatusNotFound},
		{"empty", "open", `{"body_md":"  "}`, http.StatusBadRequest},
		{"oversized", "open", `{"body_md":"` + strings.Repeat("a", maxCommentBytes+1) + `"}`, http.StatusBadRequest},
		{"link farm", "open", `{"body_md":"` + strings.Repeat("https://spam.example ", maxCommentLinks+1) + `"}`, http.StatusBadRequest},
	} {
		rec := do(t, s, http.MethodPost, "/v1/forum/threads/"+tc.slug+"/posts", testWebOrigin, strings.NewReader(tc.body), cookie)
		if rec.Code != tc.want {
			t.Errorf("reply %s status = %d, want %d", tc.name, rec.Code, tc.want)
		}
	}
	if len(forum.replies) != 1 {
		t.Fatalf("非法回帖写进了 %d 条", len(forum.replies))
	}
}

func TestOnlyAuthorCanDeleteOwnThread(t *testing.T) {
	s, forum := newForumTestServer(t)
	forum.threads = []store.Thread{
		{Slug: "mine", Author: store.Author{Login: "mias"}},
		{Slug: "theirs", Author: store.Author{Login: "someone-else"}},
	}
	cookie := sessionCookie(t, s, "mias")

	if rec := do(t, s, http.MethodDelete, "/v1/forum/threads/mine", testWebOrigin, nil, cookie); rec.Code != http.StatusNoContent {
		t.Fatalf("delete own thread status = %d, want 204", rec.Code)
	}
	for _, slug := range []string{"theirs", "nope"} {
		if rec := do(t, s, http.MethodDelete, "/v1/forum/threads/"+slug, testWebOrigin, nil, cookie); rec.Code != http.StatusNotFound {
			t.Errorf("delete %s status = %d, want 404", slug, rec.Code)
		}
	}
	if len(forum.deletedThreads) != 1 || forum.deletedThreads[0] != "mine" {
		t.Errorf("deletedThreads = %#v", forum.deletedThreads)
	}
}

func TestThreadWriteHasItsOwnHourlyQuota(t *testing.T) {
	s, _ := newForumTestServer(t)
	s.cfg.ForumThreadRatePerHour = 5
	s.cfg.ForumThreadBurst = 2
	cookie := sessionCookie(t, s, "mias")

	for i := range 2 {
		rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
			strings.NewReader(`{"board":"general","title":"t","body_md":"b"}`), cookie)
		if rec.Code != http.StatusCreated {
			t.Fatalf("thread %d status = %d, want 201", i, rec.Code)
		}
	}
	rec := do(t, s, http.MethodPost, "/v1/forum/threads", testWebOrigin,
		strings.NewReader(`{"board":"general","title":"t","body_md":"b"}`), cookie)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("third thread status = %d, want 429", rec.Code)
	}
	// 发帖额度用尽不该顺带封掉评论：两者是独立的桶
	if reply := do(t, s, http.MethodPost, "/v1/plugins/owner/repo/comments", testWebOrigin,
		strings.NewReader(`{"body_md":"ok"}`), cookie); reply.Code != http.StatusCreated {
		t.Errorf("发帖限流误伤了评论: %d", reply.Code)
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
		ForumThreadRatePerHour:  60,
		ForumThreadBurst:        30,
		ForumAdminLogins:        []string{"mias"},
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

	threads        []store.Thread
	lastThread     store.Thread
	replies        []string
	deletedThreads []string
	listBoard      string
	listLocale     string
	listLimit      int
	listOffset     int
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

func (f *fakeForumStore) ListThreads(_ context.Context, board, locale string, limit, offset int) (store.ThreadPage, error) {
	f.listBoard, f.listLocale, f.listLimit, f.listOffset = board, locale, limit, offset
	page := store.ThreadPage{Items: []store.ThreadSummary{}, BoardCounts: map[string]int{}}
	for _, t := range f.threads {
		page.BoardCounts[t.Board]++
		if (board == "" || t.Board == board) && (locale == "" || t.Locale == locale) {
			page.Items = append(page.Items, store.ThreadSummary{
				Slug: t.Slug, Board: t.Board, Title: t.Title, Locale: t.Locale,
			})
		}
	}
	page.Total = len(page.Items)
	return page, nil
}

func (f *fakeForumStore) ThreadBySlug(_ context.Context, slug string, _ int) (store.Thread, error) {
	for _, t := range f.threads {
		if t.Slug == slug {
			return t, nil
		}
	}
	return store.Thread{}, store.ErrThreadNotFound
}

func (f *fakeForumStore) CreateThread(_ context.Context, input store.NewThread) (store.Thread, error) {
	slug := input.Slug
	if slug == "" {
		slug = "slug-" + input.Title
	}
	thread := store.Thread{
		Slug: slug, Board: input.Board, Title: input.Title, BodyMD: input.BodyMD,
		Locale: input.Locale, Author: input.Author, Posts: []store.ForumPost{},
	}
	f.threads = append(f.threads, thread)
	f.lastThread = thread
	return thread, nil
}

func (f *fakeForumStore) AddThreadPost(_ context.Context, slug string, author store.Author, bodyMD string) (store.ForumPost, error) {
	for i := range f.threads {
		if f.threads[i].Slug != slug {
			continue
		}
		if f.threads[i].IsLocked {
			return store.ForumPost{}, store.ErrThreadLocked
		}
		f.replies = append(f.replies, bodyMD)
		return store.ForumPost{ID: int64(len(f.replies)), BodyMD: bodyMD, Author: author}, nil
	}
	return store.ForumPost{}, store.ErrThreadNotFound
}

func (f *fakeForumStore) SoftDeleteThread(_ context.Context, slug, login string) error {
	for i, t := range f.threads {
		if t.Slug == slug && t.Author.Login == login {
			f.threads = append(f.threads[:i], f.threads[i+1:]...)
			f.deletedThreads = append(f.deletedThreads, slug)
			return nil
		}
	}
	return store.ErrThreadNotFound
}

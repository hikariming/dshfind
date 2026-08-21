package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/dsh-external/dshfind/server/internal/store"
)

// 插件讨论（docs/bbs-design.md Phase 1）。读走公开链、可缓存、不含任何调用者
// 身份；写走 sessionWrite（Origin 白名单 + 会话 + 每用户限额）。
//
// 与设计文档的一处偏差：文档设想 GET discussion 带 cookie 时顺便返回 myVote。
// 那做不到——公开读要 Access-Control-Allow-Origin: *，而浏览器不会给 `*` 的
// 响应发 Cookie。所以"我投了什么"拆成 /v1/me/plugin-votes/{owner}/{repo}，
// 只有已登录用户会多发这一个请求，公开读因此还能整份进缓存。

// forumStore 是社区功能用到的存储操作。抽成接口只为一件事：HTTP 层的鉴权、
// CSRF、限流与参数校验能在没有 Turso 的情况下测到；SQL 本身仍由 e2e 覆盖。
type forumStore interface {
	PluginDiscussion(ctx context.Context, fullName string, limit int) (store.PluginDiscussion, error)
	PluginVoteCounts(ctx context.Context, fullName string) (int, int, error)
	PluginVote(ctx context.Context, fullName, login string) (string, error)
	SetPluginVote(ctx context.Context, fullName, login, verdict string) error
	ClearPluginVote(ctx context.Context, fullName, login string) error
	AddPluginComment(ctx context.Context, fullName, locale string, author store.Author, bodyMD, kind string) (store.ForumPost, error)
	SoftDeletePost(ctx context.Context, id int64, login string) error

	ListThreads(ctx context.Context, board, locale string, limit, offset int) (store.ThreadPage, error)
	ThreadBySlug(ctx context.Context, slug string, limit int) (store.Thread, error)
	CreateThread(ctx context.Context, input store.NewThread) (store.Thread, error)
	AddThreadPost(ctx context.Context, slug string, author store.Author, bodyMD string) (store.ForumPost, error)
	SoftDeleteThread(ctx context.Context, slug, login string) error
}

const (
	maxCommentBytes        = 10 << 10 // 10KB，够写一段带代码块的反馈
	maxCommentLinks        = 5        // 链接农场的门槛，正常反馈贴不了这么多
	discussionCommentLimit = 200
	maxRequestBodyBytes    = 128 << 10

	// 主题帖的额度比评论宽得多：BBS 要能放下一篇长文（10KB 只有约 3300 个
	// 汉字，写不完一篇正经文章），文中的参考链接自然也不止 5 条。
	maxThreadBodyBytes  = 64 << 10
	maxThreadBodyLinks  = 20
	maxThreadTitleRunes = 200

	threadPostLimit   = 500 // 单帖回复上限，超出的分页留给 Phase 3
	threadsPerPageMax = 50
	threadsPerPageDef = 20
)

type commentRequest struct {
	BodyMD string `json:"body_md"`
	Kind   string `json:"kind"`
	Locale string `json:"locale"`
}

type voteRequest struct {
	Verdict string `json:"verdict"`
}

type voteResponse struct {
	Up     int     `json:"up"`
	Down   int     `json:"down"`
	MyVote *string `json:"my_vote"`
}

// GET /v1/plugins/{owner}/{repo}/discussion —— 票数 + 评论流，公开只读。
func (s *Server) handlePluginDiscussion(w http.ResponseWriter, r *http.Request) {
	fullName, ok := s.resolvePluginFullName(w, r)
	if !ok {
		return
	}
	discussion, err := s.forum.PluginDiscussion(r.Context(), fullName, discussionCommentLimit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to load discussion", 0)
		return
	}
	writeCacheableJSON(w, r, http.StatusOK, discussion, publicDiscussionCacheControl)
}

// GET /v1/me/plugin-votes/{owner}/{repo} —— 当前会话在这个插件上的投票。
func (s *Server) handleMyPluginVote(w http.ResponseWriter, r *http.Request) {
	if !s.setCredentialedCORS(w, r) {
		writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
		return
	}
	user, ok := s.verifySession(cookieValue(r, sessionCookieName))
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "sign in with GitHub first", 0)
		return
	}
	fullName, ok := s.resolvePluginFullName(w, r)
	if !ok {
		return
	}
	verdict, err := s.forum.PluginVote(r.Context(), fullName, user.Login)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to load vote", 0)
		return
	}
	// 个人数据：任何共享缓存都不许留下副本。
	w.Header().Set("Cache-Control", "private, no-store")
	writeJSON(w, http.StatusOK, map[string]any{"my_vote": optionalString(verdict)})
}

// POST /v1/plugins/{owner}/{repo}/comments —— 发一条评论或"反馈有问题"。
func (s *Server) handlePluginComment(w http.ResponseWriter, r *http.Request, author store.Author) {
	fullName, ok := s.resolvePluginFullName(w, r)
	if !ok {
		return
	}
	var payload commentRequest
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	body := strings.TrimSpace(payload.BodyMD)
	if body == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md is required", 0)
		return
	}
	if len(body) > maxCommentBytes {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md exceeds 10KB", 0)
		return
	}
	if countLinks(body) > maxCommentLinks {
		writeError(w, http.StatusBadRequest, "bad_request", "too many links in one comment", 0)
		return
	}
	kind := payload.Kind
	if kind == "" {
		kind = store.PostKindComment
	}
	if kind != store.PostKindComment && kind != store.PostKindIssue {
		writeError(w, http.StatusBadRequest, "bad_request", "kind must be comment or issue", 0)
		return
	}

	post, err := s.forum.AddPluginComment(r.Context(), fullName, normalizeLocale(payload.Locale), author, body, kind)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to save comment", 0)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"post": post})
}

// PUT /v1/plugins/{owner}/{repo}/vote —— 投票或改票（每人一票）。
func (s *Server) handlePluginVote(w http.ResponseWriter, r *http.Request, author store.Author) {
	fullName, ok := s.resolvePluginFullName(w, r)
	if !ok {
		return
	}
	var payload voteRequest
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.Verdict != store.VerdictUp && payload.Verdict != store.VerdictDown {
		writeError(w, http.StatusBadRequest, "bad_request", "verdict must be up or down", 0)
		return
	}
	if err := s.forum.SetPluginVote(r.Context(), fullName, author.Login, payload.Verdict); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to save vote", 0)
		return
	}
	s.writeVoteCounts(w, r, fullName, optionalString(payload.Verdict))
}

// DELETE /v1/plugins/{owner}/{repo}/vote —— 撤票。
func (s *Server) handlePluginUnvote(w http.ResponseWriter, r *http.Request, author store.Author) {
	fullName, ok := s.resolvePluginFullName(w, r)
	if !ok {
		return
	}
	if err := s.forum.ClearPluginVote(r.Context(), fullName, author.Login); err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to clear vote", 0)
		return
	}
	s.writeVoteCounts(w, r, fullName, nil)
}

// DELETE /v1/forum/posts/{id} —— 只能删自己的帖子，软删除。
func (s *Server) handleDeletePost(w http.ResponseWriter, r *http.Request, author store.Author) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid post id", 0)
		return
	}
	switch err := s.forum.SoftDeletePost(r.Context(), id, author.Login); {
	case err == nil:
		w.WriteHeader(http.StatusNoContent)
	case errors.Is(err, store.ErrPostNotFound):
		// 别人的帖子与不存在的帖子回同一个 404，不给探测 id 的机会。
		writeError(w, http.StatusNotFound, "not_found", "post not found", 0)
	default:
		writeError(w, http.StatusInternalServerError, "internal", "failed to delete post", 0)
	}
}

// --- BBS（docs/bbs-design.md Phase 2）---

type threadRequest struct {
	Board  string `json:"board"`
	Title  string `json:"title"`
	BodyMD string `json:"body_md"`
	Locale string `json:"locale"`
	// 选填的自定义 URL 片段。中文标题自动生成不出可读的 slug（路由层只吃
	// ASCII，见 store.NormalizeSlug），写文章的人可以自己指定一个带关键词的。
	Slug string `json:"slug"`
}

type replyRequest struct {
	BodyMD string `json:"body_md"`
}

type threadListResponse struct {
	Items       []store.ThreadSummary `json:"items"`
	Total       int                   `json:"total"`
	Page        int                   `json:"page"`
	PerPage     int                   `json:"per_page"`
	BoardCounts map[string]int        `json:"board_counts"`
	Boards      []string              `json:"boards"`
}

// GET /v1/forum/threads?board=&locale=&page=&per_page= —— 板块列表，公开只读。
// board / locale 缺省或非法都当作"不过滤"：总板块混排是首页的默认视图，
// 一个拼错的查询参数不该把页面变成空列表。
func (s *Server) handleListThreads(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	board := filterBoard(q.Get("board"))
	locale := filterLocale(q.Get("locale"))
	page := positiveInt(q.Get("page"), 1)
	perPage := positiveInt(q.Get("per_page"), threadsPerPageDef)
	if perPage > threadsPerPageMax {
		perPage = threadsPerPageMax
	}

	result, err := s.forum.ListThreads(r.Context(), board, locale, perPage, (page-1)*perPage)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to list threads", 0)
		return
	}
	writeCacheableJSON(w, r, http.StatusOK, threadListResponse{
		Items: result.Items, Total: result.Total, Page: page, PerPage: perPage,
		BoardCounts: result.BoardCounts, Boards: store.PostableBoards,
	}, publicDiscussionCacheControl)
}

// GET /v1/forum/threads/{slug} —— 帖子正文 + 全部回复，公开只读。
func (s *Server) handleThreadDetail(w http.ResponseWriter, r *http.Request) {
	thread, err := s.forum.ThreadBySlug(r.Context(), r.PathValue("slug"), threadPostLimit)
	switch {
	case errors.Is(err, store.ErrThreadNotFound):
		writeError(w, http.StatusNotFound, "not_found", "thread not found", 0)
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "internal", "failed to load thread", 0)
		return
	}
	writeCacheableJSON(w, r, http.StatusOK, thread, publicDiscussionCacheControl)
}

// POST /v1/forum/threads —— 发新主题帖。
func (s *Server) handleCreateThread(w http.ResponseWriter, r *http.Request, author store.Author) {
	var payload threadRequest
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	board := strings.TrimSpace(payload.Board)
	if !store.IsPostableBoard(board) {
		writeError(w, http.StatusBadRequest, "bad_request", "unknown board", 0)
		return
	}
	// 公告板只有站点维护者能发；其余板块人人可发。名单是 GitHub login，
	// 与 ADMIN_TOKEN 分开——那是给脚本用的，不该为了发一条公告交出去。
	if board == store.BoardAnnounce && !s.isForumAdmin(author.Login) {
		writeError(w, http.StatusForbidden, "forbidden", "only maintainers can post announcements", 0)
		return
	}

	title := strings.TrimSpace(payload.Title)
	if title == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "title is required", 0)
		return
	}
	if utf8.RuneCountInString(title) > maxThreadTitleRunes {
		writeError(w, http.StatusBadRequest, "bad_request", "title is too long", 0)
		return
	}
	body := strings.TrimSpace(payload.BodyMD)
	if body == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md is required", 0)
		return
	}
	if len(body) > maxThreadBodyBytes {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md exceeds 64KB", 0)
		return
	}
	if countLinks(body) > maxThreadBodyLinks {
		writeError(w, http.StatusBadRequest, "bad_request", "too many links in one post", 0)
		return
	}

	// 自定义 slug 填了就必须能用：静默退回标题生成的地址，作者会以为自己
	// 设的链接生效了，等发现时文章已经带着别的 URL 被抓走了。
	slug := store.NormalizeSlug(payload.Slug)
	if strings.TrimSpace(payload.Slug) != "" && slug == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "slug must contain latin letters or digits", 0)
		return
	}

	thread, err := s.forum.CreateThread(r.Context(), store.NewThread{
		Board:  board,
		Title:  title,
		BodyMD: body,
		Locale: normalizeLocale(payload.Locale),
		Slug:   slug,
		Author: author,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to create thread", 0)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	writeJSON(w, http.StatusCreated, map[string]any{"thread": thread})
}

// POST /v1/forum/threads/{slug}/posts —— 回帖。
func (s *Server) handleThreadReply(w http.ResponseWriter, r *http.Request, author store.Author) {
	var payload replyRequest
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	body := strings.TrimSpace(payload.BodyMD)
	if body == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md is required", 0)
		return
	}
	if len(body) > maxCommentBytes {
		writeError(w, http.StatusBadRequest, "bad_request", "body_md exceeds 10KB", 0)
		return
	}
	if countLinks(body) > maxCommentLinks {
		writeError(w, http.StatusBadRequest, "bad_request", "too many links in one reply", 0)
		return
	}

	post, err := s.forum.AddThreadPost(r.Context(), r.PathValue("slug"), author, body)
	switch {
	case errors.Is(err, store.ErrThreadNotFound):
		writeError(w, http.StatusNotFound, "not_found", "thread not found", 0)
		return
	case errors.Is(err, store.ErrThreadLocked):
		writeError(w, http.StatusConflict, "locked", "thread is locked", 0)
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "internal", "failed to save reply", 0)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	writeJSON(w, http.StatusCreated, map[string]any{"post": post})
}

// DELETE /v1/forum/threads/{slug} —— 作者删自己的主题帖（软删除）。
func (s *Server) handleDeleteThread(w http.ResponseWriter, r *http.Request, author store.Author) {
	switch err := s.forum.SoftDeleteThread(r.Context(), r.PathValue("slug"), author.Login); {
	case err == nil:
		w.WriteHeader(http.StatusNoContent)
	case errors.Is(err, store.ErrThreadNotFound):
		// 与删回复一致：别人的帖子和不存在的帖子回同一个 404。
		writeError(w, http.StatusNotFound, "not_found", "thread not found", 0)
	default:
		writeError(w, http.StatusInternalServerError, "internal", "failed to delete thread", 0)
	}
}

func (s *Server) isForumAdmin(login string) bool {
	for _, admin := range s.cfg.ForumAdminLogins {
		if strings.EqualFold(admin, login) {
			return true
		}
	}
	return false
}

// filterBoard / filterLocale 把查询参数收敛到白名单；空串 = 不过滤。
func filterBoard(raw string) string {
	if raw == store.BoardPlugin || store.IsPostableBoard(raw) {
		return raw
	}
	return ""
}

func filterLocale(raw string) string {
	switch raw {
	case "zh", "en", "ja", "ko":
		return raw
	default:
		return ""
	}
}

func positiveInt(raw string, def int) int {
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		return def
	}
	return n
}

func (s *Server) writeVoteCounts(w http.ResponseWriter, r *http.Request, fullName string, myVote *string) {
	up, down, err := s.forum.PluginVoteCounts(r.Context(), fullName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal", "failed to load votes", 0)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	writeJSON(w, http.StatusOK, voteResponse{Up: up, Down: down, MyVote: myVote})
}

// resolvePluginFullName 把路径上的 owner/repo 校成插件快照里的规范写法。
// 插件必须真实存在，否则任何人都能凭空造出讨论帖。
func (s *Server) resolvePluginFullName(w http.ResponseWriter, r *http.Request) (string, bool) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return "", false
	}
	p, ok := snap.ByFullName[strings.ToLower(r.PathValue("owner")+"/"+r.PathValue("repo"))]
	if !ok {
		writeError(w, http.StatusNotFound, "not_found", "plugin not found", 0)
		return "", false
	}
	return p.FullName, true
}

func decodeJSONBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(io.LimitReader(r.Body, maxRequestBodyBytes)).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid JSON body", 0)
		return false
	}
	return true
}

func countLinks(body string) int {
	lower := strings.ToLower(body)
	return strings.Count(lower, "http://") + strings.Count(lower, "https://")
}

func normalizeLocale(raw string) string {
	switch raw {
	case "zh", "en", "ja", "ko":
		return raw
	default:
		return "zh"
	}
}

func optionalString(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}

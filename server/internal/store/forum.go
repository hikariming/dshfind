package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
)

// 社区数据层（docs/bbs-design.md）。插件讨论与 BBS 共用 forum_threads /
// forum_posts：插件的首条评论会自动建一个 board='plugin' 的隐式帖子，
// 评论就是它的回复。作者信息按会话快照存列，不建 users 表。

// ErrPostNotFound 表示帖子不存在、已删除，或不属于请求者。三种情况对外
// 一律同一个错误：不能让人靠错误信息探测别人的帖子 id。
var ErrPostNotFound = errors.New("post not found")

// ErrThreadNotFound 同理，用于按 slug 找主题帖。
var ErrThreadNotFound = errors.New("thread not found")

// ErrThreadLocked 表示帖子被锁，不再接受回复。
var ErrThreadLocked = errors.New("thread is locked")

const (
	VerdictUp   = "up"
	VerdictDown = "down"

	PostKindComment = "comment"
	PostKindIssue   = "issue"

	BoardGeneral  = "general"
	BoardHelp     = "help"
	BoardDev      = "dev"
	BoardAnnounce = "announce"
	BoardPlugin   = "plugin"
)

// PostableBoards 是 v1 硬编码的可发帖板块（docs/bbs-design.md §4）。
// plugin 不在其中——插件讨论帖只由首条评论自动创建，不允许手动往里发主题，
// 否则同一个插件会出现两个讨论帖，详情页只认 PluginThreadSlug 那一个。
var PostableBoards = []string{BoardGeneral, BoardHelp, BoardDev, BoardAnnounce}

// IsPostableBoard 校验发帖目标板块。announce 的额外准入（仅管理员）在 HTTP 层，
// 这里只管板块名合法。
func IsPostableBoard(board string) bool {
	for _, b := range PostableBoards {
		if b == board {
			return true
		}
	}
	return false
}

// Author 是发帖时从会话 JWT 快照下来的作者信息。
type Author struct {
	Login  string  `json:"login"`
	Name   *string `json:"name"`
	Avatar *string `json:"avatar"`
}

type ForumPost struct {
	ID        int64  `json:"id"`
	BodyMD    string `json:"body_md"`
	Kind      string `json:"kind"`
	Author    Author `json:"author"`
	CreatedAt string `json:"created_at"`
}

type PluginDiscussion struct {
	FullName string      `json:"full_name"`
	Up       int         `json:"up"`
	Down     int         `json:"down"`
	Comments []ForumPost `json:"comments"`
}

// PluginDiscussion 读插件的票数与评论流。公开只读，不带任何调用者身份——
// "我投了什么" 由 PluginVote 单独查，好让这个响应能进 CDN 缓存。
func (s *Store) PluginDiscussion(ctx context.Context, fullName string, limit int) (PluginDiscussion, error) {
	discussion := PluginDiscussion{FullName: fullName, Comments: []ForumPost{}}

	up, down, err := s.PluginVoteCounts(ctx, fullName)
	if err != nil {
		return PluginDiscussion{}, err
	}
	discussion.Up, discussion.Down = up, down

	rows, err := s.db.QueryContext(ctx,
		`SELECT p.id, p.body_md, p.kind, p.author_login, p.author_name, p.author_avatar, p.created_at
		   FROM forum_posts p
		   JOIN forum_threads t ON t.id = p.thread_id
		  WHERE t.plugin_full_name = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL
		  ORDER BY p.created_at ASC, p.id ASC
		  LIMIT ?`, fullName, limit)
	if err != nil {
		return PluginDiscussion{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var post ForumPost
		if err := rows.Scan(&post.ID, &post.BodyMD, &post.Kind, &post.Author.Login,
			&post.Author.Name, &post.Author.Avatar, &post.CreatedAt); err != nil {
			return PluginDiscussion{}, err
		}
		discussion.Comments = append(discussion.Comments, post)
	}
	return discussion, rows.Err()
}

func (s *Store) PluginVoteCounts(ctx context.Context, fullName string) (up, down int, err error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT verdict, COUNT(*) FROM plugin_votes WHERE full_name = ? GROUP BY verdict`, fullName)
	if err != nil {
		return 0, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var verdict string
		var count int
		if err := rows.Scan(&verdict, &count); err != nil {
			return 0, 0, err
		}
		switch verdict {
		case VerdictUp:
			up = count
		case VerdictDown:
			down = count
		}
	}
	return up, down, rows.Err()
}

// PluginVote 返回该用户对这个插件的投票；没投过返回空字符串。
func (s *Store) PluginVote(ctx context.Context, fullName, login string) (string, error) {
	var verdict string
	err := s.db.QueryRowContext(ctx,
		`SELECT verdict FROM plugin_votes WHERE full_name = ? AND user_login = ?`,
		fullName, login).Scan(&verdict)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return verdict, nil
}

// SetPluginVote 每人一票：再投就是改票，主键冲突直接覆盖。
func (s *Store) SetPluginVote(ctx context.Context, fullName, login, verdict string) error {
	if verdict != VerdictUp && verdict != VerdictDown {
		return fmt.Errorf("非法投票值 %q", verdict)
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO plugin_votes (full_name, user_login, verdict, created_at)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(full_name, user_login)
		 DO UPDATE SET verdict = excluded.verdict, created_at = excluded.created_at`,
		fullName, login, verdict, nowRFC3339())
	return err
}

func (s *Store) ClearPluginVote(ctx context.Context, fullName, login string) error {
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM plugin_votes WHERE full_name = ? AND user_login = ?`, fullName, login)
	return err
}

// AddPluginComment 写一条插件评论；该插件还没有讨论帖时顺手建出隐式帖子。
// 建帖用 ON CONFLICT DO NOTHING + 回查 id，两个人同时发首条评论也不会有一方失败。
func (s *Store) AddPluginComment(ctx context.Context, fullName, locale string, author Author, bodyMD, kind string) (ForumPost, error) {
	if kind != PostKindComment && kind != PostKindIssue {
		return ForumPost{}, fmt.Errorf("非法评论类型 %q", kind)
	}
	now := nowRFC3339()

	threadID, err := s.ensurePluginThread(ctx, fullName, locale, author, now)
	if err != nil {
		return ForumPost{}, err
	}

	res, err := s.db.ExecContext(ctx,
		`INSERT INTO forum_posts (thread_id, body_md, kind, author_login, author_name, author_avatar, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		threadID, bodyMD, kind, author.Login, author.Name, author.Avatar, now)
	if err != nil {
		return ForumPost{}, err
	}
	id, _ := res.LastInsertId()

	// reply_count / last_post_at 是列表页免 JOIN 的冗余计数，算错也不影响正确性。
	if _, err := s.db.ExecContext(ctx,
		`UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = ? WHERE id = ?`,
		now, threadID); err != nil {
		return ForumPost{}, err
	}

	return ForumPost{
		ID: id, BodyMD: bodyMD, Kind: kind, Author: author, CreatedAt: now,
	}, nil
}

func (s *Store) ensurePluginThread(ctx context.Context, fullName, locale string, author Author, now string) (int64, error) {
	slug := PluginThreadSlug(fullName)
	if _, err := s.db.ExecContext(ctx,
		`INSERT INTO forum_threads (slug, board, title, author_login, author_name, author_avatar, locale, plugin_full_name, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(slug) DO NOTHING`,
		slug, BoardPlugin, fullName, author.Login, author.Name, author.Avatar, locale, fullName, now); err != nil {
		return 0, err
	}
	var id int64
	if err := s.db.QueryRowContext(ctx,
		`SELECT id FROM forum_threads WHERE slug = ?`, slug).Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

// PluginThreadSlug 是插件讨论帖的确定性 slug——同一个插件永远落到同一个帖子，
// 不需要额外的查找表，也就不会因为并发写出两个讨论帖。
//
// 末尾的 hash 后缀不是装饰：可读部分把 / 和 . 都压成 -，光靠它 "a/b-c" 与
// "a-b/c" 会撞成同一个 slug，两个插件的评论就混进一个帖子了。
func PluginThreadSlug(fullName string) string {
	normalized := strings.ToLower(fullName)
	var b strings.Builder
	b.WriteString("plugin-")
	for _, r := range normalized {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		default:
			b.WriteByte('-')
		}
	}
	sum := sha256.Sum256([]byte(normalized))
	b.WriteByte('-')
	b.WriteString(hex.EncodeToString(sum[:])[:8])
	return b.String()
}

// SoftDeletePost 只允许作者本人删自己的帖子；软删除留痕，审计走 audit 包。
func (s *Store) SoftDeletePost(ctx context.Context, id int64, login string) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE forum_posts SET deleted_at = ?
		  WHERE id = ? AND author_login = ? AND deleted_at IS NULL`,
		nowRFC3339(), id, login)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrPostNotFound
	}
	return nil
}

func nowRFC3339() string { return time.Now().UTC().Format(time.RFC3339) }

// --- BBS（docs/bbs-design.md Phase 2）---
//
// 与插件讨论共用 forum_threads / forum_posts：区别只在 plugin_full_name 是否为空。
// 因此列表默认混排两者，插件讨论天然是 BBS 的一个板块，冷启动期不至于空着。

// ThreadSummary 是列表页要的字段；正文只带一段摘要，列表不传全文。
type ThreadSummary struct {
	Slug           string  `json:"slug"`
	Board          string  `json:"board"`
	Title          string  `json:"title"`
	Excerpt        string  `json:"excerpt"`
	Author         Author  `json:"author"`
	Locale         string  `json:"locale"`
	PluginFullName *string `json:"plugin_full_name"`
	ReplyCount     int     `json:"reply_count"`
	LastPostAt     string  `json:"last_post_at"`
	IsPinned       bool    `json:"is_pinned"`
	IsLocked       bool    `json:"is_locked"`
	CreatedAt      string  `json:"created_at"`
}

// Thread 是帖子页要的完整数据：主题帖正文 + 全部回复。
type Thread struct {
	Slug           string      `json:"slug"`
	Board          string      `json:"board"`
	Title          string      `json:"title"`
	BodyMD         string      `json:"body_md"`
	Author         Author      `json:"author"`
	Locale         string      `json:"locale"`
	PluginFullName *string     `json:"plugin_full_name"`
	ReplyCount     int         `json:"reply_count"`
	LastPostAt     string      `json:"last_post_at"`
	IsPinned       bool        `json:"is_pinned"`
	IsLocked       bool        `json:"is_locked"`
	CreatedAt      string      `json:"created_at"`
	Posts          []ForumPost `json:"posts"`
}

// ThreadPage 是一页列表 + 供板块 chips 显示的各板块计数。
type ThreadPage struct {
	Items       []ThreadSummary `json:"items"`
	Total       int             `json:"total"`
	BoardCounts map[string]int  `json:"board_counts"`
}

// 列表摘要的截断长度。SQLite 的 substr 按字符计，中文不会被截成半个字。
const threadExcerptChars = 300

// ListThreads 按板块 / 语言分页读帖子列表。board / locale 传空串表示不过滤——
// SQL 里用 `? = ” OR col = ?` 而不是拼字符串，参数化的形状始终一致。
func (s *Store) ListThreads(ctx context.Context, board, locale string, limit, offset int) (ThreadPage, error) {
	page := ThreadPage{Items: []ThreadSummary{}, BoardCounts: map[string]int{}}

	rows, err := s.db.QueryContext(ctx,
		`SELECT slug, board, title, substr(body_md, 1, ?), author_login, author_name, author_avatar,
		        locale, plugin_full_name, reply_count, COALESCE(last_post_at, created_at),
		        is_pinned, is_locked, created_at
		   FROM forum_threads
		  WHERE deleted_at IS NULL
		    AND (? = '' OR board = ?)
		    AND (? = '' OR locale = ?)
		  ORDER BY is_pinned DESC, COALESCE(last_post_at, created_at) DESC, id DESC
		  LIMIT ? OFFSET ?`,
		threadExcerptChars, board, board, locale, locale, limit, offset)
	if err != nil {
		return ThreadPage{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			t              ThreadSummary
			pinned, locked sql.NullInt64
			pluginFullName sql.NullString
		)
		if err := rows.Scan(&t.Slug, &t.Board, &t.Title, &t.Excerpt, &t.Author.Login,
			&t.Author.Name, &t.Author.Avatar, &t.Locale, &pluginFullName, &t.ReplyCount,
			&t.LastPostAt, &pinned, &locked, &t.CreatedAt); err != nil {
			return ThreadPage{}, err
		}
		// Turso 的 INTEGER 列回来是整数，直接 Scan 进 bool 会因驱动差异翻车，
		// 沿用 plugins.go 的写法过一道 NullInt64。
		t.IsPinned, t.IsLocked = pinned.Int64 != 0, locked.Int64 != 0
		if pluginFullName.Valid {
			t.PluginFullName = &pluginFullName.String
		}
		page.Items = append(page.Items, t)
	}
	if err := rows.Err(); err != nil {
		return ThreadPage{}, err
	}

	if err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM forum_threads
		  WHERE deleted_at IS NULL AND (? = '' OR board = ?) AND (? = '' OR locale = ?)`,
		board, board, locale, locale).Scan(&page.Total); err != nil {
		return ThreadPage{}, err
	}

	// 板块计数只受语言过滤影响：点某个板块的 chip 时，其他 chip 上的数字不该跟着变 0。
	countRows, err := s.db.QueryContext(ctx,
		`SELECT board, COUNT(*) FROM forum_threads
		  WHERE deleted_at IS NULL AND (? = '' OR locale = ?) GROUP BY board`, locale, locale)
	if err != nil {
		return ThreadPage{}, err
	}
	defer countRows.Close()
	for countRows.Next() {
		var name string
		var count int
		if err := countRows.Scan(&name, &count); err != nil {
			return ThreadPage{}, err
		}
		page.BoardCounts[name] = count
	}
	return page, countRows.Err()
}

// ThreadBySlug 读一个帖子及其回复。找不到 / 已软删除都是 ErrThreadNotFound。
func (s *Store) ThreadBySlug(ctx context.Context, slug string, limit int) (Thread, error) {
	var (
		t              Thread
		pinned, locked sql.NullInt64
		pluginFullName sql.NullString
		id             int64
	)
	err := s.db.QueryRowContext(ctx,
		`SELECT id, slug, board, title, body_md, author_login, author_name, author_avatar,
		        locale, plugin_full_name, reply_count, COALESCE(last_post_at, created_at),
		        is_pinned, is_locked, created_at
		   FROM forum_threads WHERE slug = ? AND deleted_at IS NULL`, slug).
		Scan(&id, &t.Slug, &t.Board, &t.Title, &t.BodyMD, &t.Author.Login, &t.Author.Name,
			&t.Author.Avatar, &t.Locale, &pluginFullName, &t.ReplyCount, &t.LastPostAt,
			&pinned, &locked, &t.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Thread{}, ErrThreadNotFound
	}
	if err != nil {
		return Thread{}, err
	}
	t.IsPinned, t.IsLocked = pinned.Int64 != 0, locked.Int64 != 0
	if pluginFullName.Valid {
		t.PluginFullName = &pluginFullName.String
	}

	posts, err := s.threadPosts(ctx, id, limit)
	if err != nil {
		return Thread{}, err
	}
	t.Posts = posts
	return t, nil
}

func (s *Store) threadPosts(ctx context.Context, threadID int64, limit int) ([]ForumPost, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, body_md, kind, author_login, author_name, author_avatar, created_at
		   FROM forum_posts
		  WHERE thread_id = ? AND deleted_at IS NULL
		  ORDER BY created_at ASC, id ASC
		  LIMIT ?`, threadID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := []ForumPost{}
	for rows.Next() {
		var post ForumPost
		if err := rows.Scan(&post.ID, &post.BodyMD, &post.Kind, &post.Author.Login,
			&post.Author.Name, &post.Author.Avatar, &post.CreatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, rows.Err()
}

// NewThread 是建帖的入参。Slug 选填——留空就从标题生成。
type NewThread struct {
	Board  string
	Title  string
	BodyMD string
	Locale string
	Slug   string
	Author Author
}

// CreateThread 发一个新主题帖。
//
// slug 的唯一性交给数据库的唯一约束，撞了换个随机后缀重试；不做"先查再插"
// 那种有竞态的判重。作者自定义的 slug 先按原样试一次——他要的就是那个干净的
// 地址——被占了才退回加后缀。
func (s *Store) CreateThread(ctx context.Context, input NewThread) (Thread, error) {
	if !IsPostableBoard(input.Board) {
		return Thread{}, fmt.Errorf("非法板块 %q", input.Board)
	}

	readable := NormalizeSlug(input.Slug)
	custom := readable != ""
	if !custom {
		readable = NormalizeSlug(input.Title)
	}
	if readable == "" {
		readable = "t" // 标题里一个 ASCII 字母数字都没有（纯中文标题）时的兜底
	}
	now := nowRFC3339()

	for attempt := range 5 {
		slug := readable
		if attempt > 0 || !custom {
			suffix, err := randomSuffix()
			if err != nil {
				return Thread{}, err
			}
			slug = readable + "-" + suffix
		}
		// last_post_at 在建帖时就写上：列表按它排序，留空会让新帖沉到底部。
		res, err := s.db.ExecContext(ctx,
			`INSERT INTO forum_threads
			   (slug, board, title, body_md, author_login, author_name, author_avatar, locale, last_post_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(slug) DO NOTHING`,
			slug, input.Board, input.Title, input.BodyMD, input.Author.Login,
			input.Author.Name, input.Author.Avatar, input.Locale, now, now)
		if err != nil {
			return Thread{}, err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			continue // slug 撞了（后缀是随机的，重试一次几乎必然成功）
		}
		return Thread{
			Slug: slug, Board: input.Board, Title: input.Title, BodyMD: input.BodyMD,
			Author: input.Author, Locale: input.Locale, LastPostAt: now,
			CreatedAt: now, Posts: []ForumPost{},
		}, nil
	}
	return Thread{}, fmt.Errorf("连续 5 次都没能为 %q 生成可用的 slug", input.Title)
}

// AddThreadPost 回帖。锁帖与不存在分开报，前者是用户能理解的状态。
func (s *Store) AddThreadPost(ctx context.Context, slug string, author Author, bodyMD string) (ForumPost, error) {
	var (
		id     int64
		locked sql.NullInt64
	)
	err := s.db.QueryRowContext(ctx,
		`SELECT id, is_locked FROM forum_threads WHERE slug = ? AND deleted_at IS NULL`, slug).
		Scan(&id, &locked)
	if errors.Is(err, sql.ErrNoRows) {
		return ForumPost{}, ErrThreadNotFound
	}
	if err != nil {
		return ForumPost{}, err
	}
	if locked.Int64 != 0 {
		return ForumPost{}, ErrThreadLocked
	}

	now := nowRFC3339()
	res, err := s.db.ExecContext(ctx,
		`INSERT INTO forum_posts (thread_id, body_md, kind, author_login, author_name, author_avatar, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, bodyMD, PostKindComment, author.Login, author.Name, author.Avatar, now)
	if err != nil {
		return ForumPost{}, err
	}
	postID, _ := res.LastInsertId()

	if _, err := s.db.ExecContext(ctx,
		`UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = ? WHERE id = ?`,
		now, id); err != nil {
		return ForumPost{}, err
	}
	return ForumPost{ID: postID, BodyMD: bodyMD, Kind: PostKindComment, Author: author, CreatedAt: now}, nil
}

// SoftDeleteThread 只允许作者删自己发的主题帖。插件讨论帖排除在外——它的
// author_login 只是碰巧第一个评论的人，让他一删就带走全插件的评论显然不对。
func (s *Store) SoftDeleteThread(ctx context.Context, slug, login string) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE forum_threads SET deleted_at = ?
		  WHERE slug = ? AND author_login = ? AND deleted_at IS NULL AND plugin_full_name IS NULL`,
		nowRFC3339(), slug, login)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrThreadNotFound
	}
	return nil
}

// 可读部分的上限。再长对 SEO 没有增益，只会让 URL 在分享时被截断。
const threadSlugMaxChars = 48

// NormalizeSlug 把任意文本收敛成 URL 里的可读片段：只留 ASCII 小写字母与数字，
// 其余一律压成单个连字符。返回空串表示这段文本里没有可用字符。
//
// 只留 ASCII 是被逼出来的，不是审美选择：带中文的动态路由段在 Next 的路由匹配
// 里会直接 404（编码与未编码两种写法都试过），帖子页根本跑不到。于是纯中文标题
// 会落到 "t-<后缀>"——作者要带关键词的地址，就在发帖时填自定义 slug。
func NormalizeSlug(raw string) string {
	var b strings.Builder
	count := 0
	lastDash := true // 前导连字符直接吃掉
	for _, r := range strings.ToLower(raw) {
		if count >= threadSlugMaxChars {
			break
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			count++
			lastDash = false
			continue
		}
		if !lastDash {
			b.WriteByte('-')
			count++
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func randomSuffix() (string, error) {
	var buf [4]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", fmt.Errorf("生成 slug 后缀: %w", err)
	}
	return hex.EncodeToString(buf[:]), nil
}

package store

import (
	"context"
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

const (
	VerdictUp   = "up"
	VerdictDown = "down"

	PostKindComment = "comment"
	PostKindIssue   = "issue"

	BoardPlugin = "plugin"
)

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

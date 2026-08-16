package store

import (
	"context"
	"database/sql"
	"encoding/json"
)

// Plugin 是对外 /v1/plugins* 的响应主体(snake_case)。
// 字段口径对齐 Next 端 src/lib/plugins-db.ts 与 plugins 表。
type Plugin struct {
	FullName     string   `json:"full_name"`
	Name         string   `json:"name"`
	Owner        string   `json:"owner"`
	URL          string   `json:"url"`
	Description  string   `json:"description"`
	Tags         []string `json:"tags"`
	Language     string   `json:"language"`
	Stars        int      `json:"stars"`
	Contributors *int     `json:"contributors"`
	PushedAt     string   `json:"pushed_at"`
	Archived     bool     `json:"archived"`
	Category     string   `json:"category"`
	Score        *int     `json:"score"`
	Grade        string   `json:"grade"`
	IsFeatured   bool     `json:"is_featured"`
	IsOfficial   bool     `json:"is_official"`
	IsInsider    bool     `json:"is_insider"`
	Install      Install  `json:"install"`
	FirstSeenAt  string   `json:"first_seen_at"`
	LastSyncedAt string   `json:"last_synced_at"`
}

// Install 聚合安装信息。cmd 是生效命令:运营手工核对的 install_cmd 优先,
// 否则用探测推导的 install_cmd_auto;source 标注取的是哪边。
type Install struct {
	Cmd           *string `json:"cmd"`
	Source        string  `json:"source"` // manual / auto / ""(无可用命令)
	Kind          *string `json:"kind"`   // release|npm|git|build-required|not-installable,null=未探测
	PkgName       *string `json:"pkg_name"`
	NpmPublished  bool    `json:"npm_published"`
	ReleaseTgzURL string  `json:"release_tgz_url,omitempty"`
	ReleaseTag    string  `json:"release_tag,omitempty"`
}

type I18nEntry struct {
	Description *string  `json:"description,omitempty"`
	Intro       *string  `json:"intro,omitempty"`
	Highlights  []string `json:"highlights,omitempty"`
	UpdatedAt   string   `json:"updated_at"`
}

type SnapshotRow struct {
	Date         string `json:"date"`
	Stars        int    `json:"stars"`
	Contributors *int   `json:"contributors"`
	PushedAt     string `json:"pushed_at,omitempty"`
}

// 展示口径与排序都必须与 Next 端保持一致:
// suggest 依赖这个行序做优先级(featured → stars → name),不再二次排序。
const loadPluginsSQL = `
SELECT full_name, name, owner, url, description, tags, language,
       stars, contributors, pushed_at, archived, category, score,
       is_featured, is_insider, is_official, first_seen_at, last_synced_at,
       install_cmd, install_kind, install_cmd_auto, pkg_name,
       npm_published, release_tgz_url, release_tag
FROM plugins
WHERE is_present = 1 AND is_offtopic = 0
ORDER BY is_featured DESC, stars DESC, full_name`

func (s *Store) LoadAllPlugins(ctx context.Context) ([]Plugin, error) {
	rows, err := s.db.QueryContext(ctx, loadPluginsSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Plugin
	for rows.Next() {
		var (
			p                                  Plugin
			tags                               sql.NullString
			description, language, pushedAt    sql.NullString
			category, firstSeen, lastSynced    sql.NullString
			contributors, score                sql.NullInt64
			archived, featured, insider, offic sql.NullInt64
			installCmd, installKind, cmdAuto   sql.NullString
			pkgName, tgzURL, relTag            sql.NullString
			npmPub                             sql.NullInt64
		)
		if err := rows.Scan(
			&p.FullName, &p.Name, &p.Owner, &p.URL, &description, &tags, &language,
			&p.Stars, &contributors, &pushedAt, &archived, &category, &score,
			&featured, &insider, &offic, &firstSeen, &lastSynced,
			&installCmd, &installKind, &cmdAuto, &pkgName,
			&npmPub, &tgzURL, &relTag,
		); err != nil {
			return nil, err
		}
		p.Description = description.String
		p.Language = language.String
		p.PushedAt = pushedAt.String
		p.Category = category.String
		p.FirstSeenAt = firstSeen.String
		p.LastSyncedAt = lastSynced.String
		p.Archived = archived.Int64 != 0
		p.IsFeatured = featured.Int64 != 0
		p.IsInsider = insider.Int64 != 0
		p.IsOfficial = offic.Int64 != 0
		if contributors.Valid {
			v := int(contributors.Int64)
			p.Contributors = &v
		}
		if score.Valid {
			v := int(score.Int64)
			p.Score = &v
			p.Grade = gradeOf(v)
		}
		p.Tags = parseTags(tags.String)
		p.Install = buildInstall(installCmd, cmdAuto, installKind, pkgName, npmPub, tgzURL, relTag)
		out = append(out, p)
	}
	return out, rows.Err()
}

// 等级线与 scripts/lib/scoring.mjs 一致:S≥85 A≥70 B≥55,其余 C。
func gradeOf(score int) string {
	switch {
	case score >= 85:
		return "S"
	case score >= 70:
		return "A"
	case score >= 55:
		return "B"
	default:
		return "C"
	}
}

func parseTags(raw string) []string {
	if raw == "" {
		return []string{}
	}
	var tags []string
	if err := json.Unmarshal([]byte(raw), &tags); err != nil || tags == nil {
		return []string{}
	}
	return tags
}

func buildInstall(manual, auto, kind, pkgName sql.NullString, npmPub sql.NullInt64, tgzURL, relTag sql.NullString) Install {
	inst := Install{
		NpmPublished:  npmPub.Int64 != 0,
		ReleaseTgzURL: tgzURL.String,
		ReleaseTag:    relTag.String,
	}
	if kind.Valid && kind.String != "" {
		k := kind.String
		inst.Kind = &k
	}
	if pkgName.Valid && pkgName.String != "" {
		n := pkgName.String
		inst.PkgName = &n
	}
	switch {
	case manual.Valid && manual.String != "":
		c := manual.String
		inst.Cmd, inst.Source = &c, "manual"
	case auto.Valid && auto.String != "":
		c := auto.String
		inst.Cmd, inst.Source = &c, "auto"
	}
	return inst
}

func (s *Store) PluginI18n(ctx context.Context, fullName string) (map[string]I18nEntry, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT locale, description, intro, highlights, updated_at FROM plugin_i18n WHERE full_name = ?`,
		fullName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]I18nEntry{}
	for rows.Next() {
		var locale, updatedAt string
		var desc, intro, highlights sql.NullString
		if err := rows.Scan(&locale, &desc, &intro, &highlights, &updatedAt); err != nil {
			return nil, err
		}
		e := I18nEntry{UpdatedAt: updatedAt}
		if desc.Valid {
			e.Description = &desc.String
		}
		if intro.Valid {
			e.Intro = &intro.String
		}
		if highlights.Valid && highlights.String != "" {
			_ = json.Unmarshal([]byte(highlights.String), &e.Highlights)
		}
		out[locale] = e
	}
	return out, rows.Err()
}

func (s *Store) PluginSnapshots(ctx context.Context, fullName string) ([]SnapshotRow, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT snapshot_date, stars, contributors, pushed_at FROM plugin_snapshots
		 WHERE full_name = ? ORDER BY snapshot_date`,
		fullName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []SnapshotRow
	for rows.Next() {
		var r SnapshotRow
		var contributors sql.NullInt64
		var pushedAt sql.NullString
		if err := rows.Scan(&r.Date, &r.Stars, &contributors, &pushedAt); err != nil {
			return nil, err
		}
		if contributors.Valid {
			v := int(contributors.Int64)
			r.Contributors = &v
		}
		r.PushedAt = pushedAt.String
		out = append(out, r)
	}
	return out, rows.Err()
}

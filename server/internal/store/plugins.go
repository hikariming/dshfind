package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
)

// Plugin 是对外 /v1/plugins* 的响应主体(snake_case)。
// 字段口径对齐 Next 端 src/lib/plugins-db.ts 与 plugins 表。
type Plugin struct {
	FullName string `json:"full_name"`
	Name     string `json:"name"`
	Owner    string `json:"owner"`
	// URL 是旧 REST 字段；RepositoryURL 是语义明确的兼容新增字段，二者值相同。
	URL           string   `json:"url"`
	RepositoryURL string   `json:"repository_url"`
	Description   string   `json:"description"`
	Tags          []string `json:"tags"`
	Language      string   `json:"language"`
	Stars         int      `json:"stars"`
	Contributors  *int     `json:"contributors"`
	PushedAt      *string  `json:"pushed_at"`
	Archived      bool     `json:"archived"`
	Category      string   `json:"category"`
	Score         *int     `json:"score"`
	// Grade 只在 score 已生成时存在；未评分的插件必须以 JSON null 表示，而不是空字符串。
	Grade *string `json:"grade"`
	// ScoredAt/ScoreVersion 让外部消费者判断评分的新鲜度与算法口径；评分明细仍不公开。
	ScoredAt     *string `json:"scored_at"`
	ScoreVersion *string `json:"score_version"`
	IsFeatured   bool    `json:"is_featured"`
	IsOfficial   bool    `json:"is_official"`
	IsInsider    bool    `json:"is_insider"`
	// IsRisky 是运营手工标的风险/可疑项目(假冒官方仓库等):仍收录但列表沉底,
	// RiskNote 为风险说明(如被假冒的官方仓库链接),无标记时为 null。
	IsRisky  bool    `json:"is_risky"`
	RiskNote *string `json:"risk_note"`
	// IsPlugin 三态:true=确认是 DSH 插件(package.json 含 dsh.bundle),
	// false=确认非插件(探测判定 not-installable 或人工标记),nil=未探测/未知。
	IsPlugin     *bool   `json:"is_plugin"`
	Install      Install `json:"install"`
	FirstSeenAt  *string `json:"first_seen_at"`
	LastSyncedAt *string `json:"last_synced_at"`
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
	// ProbedAt 是安装探测成功写入此结论的时间；无探测记录时为 null。
	ProbedAt *string `json:"probed_at"`
}

type I18nEntry struct {
	Description *string  `json:"description,omitempty"`
	Intro       *string  `json:"intro,omitempty"`
	Highlights  []string `json:"highlights,omitempty"`
	UpdatedAt   string   `json:"updated_at"`
}

type SnapshotRow struct {
	Date         string  `json:"date"`
	Stars        int     `json:"stars"`
	Contributors *int    `json:"contributors"`
	PushedAt     *string `json:"pushed_at"`
}

// 展示口径与排序都必须与 Next 端保持一致:
// suggest 依赖这个行序做优先级(风险沉底 → featured → stars → name),不再二次排序。
const loadPluginsSQL = `
SELECT full_name, name, owner, url, description, tags, language,
       stars, contributors, pushed_at, archived, category, score, scored_at, score_version,
       is_featured, is_insider, is_official, is_risky, risk_note, first_seen_at, last_synced_at,
       install_cmd, install_kind, install_cmd_auto, pkg_name,
       npm_published, release_tgz_url, release_tag, install_probed_at, is_plugin
FROM plugins
WHERE is_present = 1 AND is_offtopic = 0
ORDER BY is_risky ASC, is_featured DESC, stars DESC, full_name`

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
			scoredAt, scoreVersion             sql.NullString
			archived, featured, insider, offic sql.NullInt64
			risky                              sql.NullInt64
			riskNote                           sql.NullString
			installCmd, installKind, cmdAuto   sql.NullString
			pkgName, tgzURL, relTag, probedAt  sql.NullString
			npmPub                             sql.NullInt64
			isPlugin                           sql.NullInt64
		)
		if err := rows.Scan(
			&p.FullName, &p.Name, &p.Owner, &p.URL, &description, &tags, &language,
			&p.Stars, &contributors, &pushedAt, &archived, &category, &score, &scoredAt, &scoreVersion,
			&featured, &insider, &offic, &risky, &riskNote, &firstSeen, &lastSynced,
			&installCmd, &installKind, &cmdAuto, &pkgName,
			&npmPub, &tgzURL, &relTag, &probedAt, &isPlugin,
		); err != nil {
			return nil, err
		}
		p.Description = description.String
		p.RepositoryURL = p.URL
		p.Language = language.String
		if pushedAt.Valid && pushedAt.String != "" {
			p.PushedAt = &pushedAt.String
		}
		p.Category = category.String
		if firstSeen.Valid && firstSeen.String != "" {
			p.FirstSeenAt = &firstSeen.String
		}
		if lastSynced.Valid && lastSynced.String != "" {
			p.LastSyncedAt = &lastSynced.String
		}
		p.Archived = archived.Int64 != 0
		p.IsFeatured = featured.Int64 != 0
		p.IsInsider = insider.Int64 != 0
		p.IsOfficial = offic.Int64 != 0
		p.IsRisky = risky.Int64 != 0
		if isPlugin.Valid {
			v := isPlugin.Int64 != 0
			p.IsPlugin = &v
		}
		if riskNote.Valid && riskNote.String != "" {
			p.RiskNote = &riskNote.String
		}
		if contributors.Valid {
			v := int(contributors.Int64)
			p.Contributors = &v
		}
		if score.Valid {
			v := int(score.Int64)
			p.Score = &v
			grade := gradeOf(v)
			p.Grade = &grade
		}
		if scoredAt.Valid && scoredAt.String != "" {
			p.ScoredAt = &scoredAt.String
		}
		if scoreVersion.Valid && scoreVersion.String != "" {
			p.ScoreVersion = &scoreVersion.String
		}
		p.Tags = parseTags(tags.String)
		p.Install = buildInstall(installCmd, cmdAuto, installKind, pkgName, npmPub, tgzURL, relTag, probedAt)
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

func buildInstall(manual, auto, kind, pkgName sql.NullString, npmPub sql.NullInt64, tgzURL, relTag, probedAt sql.NullString) Install {
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
	if probedAt.Valid && probedAt.String != "" {
		inst.ProbedAt = &probedAt.String
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
	all, err := s.PluginI18nBatch(ctx, []string{fullName})
	if err != nil {
		return nil, err
	}
	return all[fullName], nil
}

// PluginI18nBatch 让 GraphQL 的 connection 在一次 Turso 查询中取得整页翻译，
// 避免每个 Plugin 都额外发一次网络请求。
func (s *Store) PluginI18nBatch(ctx context.Context, fullNames []string) (map[string]map[string]I18nEntry, error) {
	names := uniquePluginNames(fullNames)
	out := make(map[string]map[string]I18nEntry, len(names))
	if len(names) == 0 {
		return out, nil
	}
	args := make([]any, len(names))
	for i, name := range names {
		args[i] = name
		out[name] = map[string]I18nEntry{}
	}
	rows, err := s.db.QueryContext(ctx,
		fmt.Sprintf(`SELECT full_name, locale, description, intro, highlights, updated_at
                   FROM plugin_i18n WHERE full_name IN (%s)`, sqlPlaceholders(len(names))),
		args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var fullName, locale, updatedAt string
		var desc, intro, highlights sql.NullString
		if err := rows.Scan(&fullName, &locale, &desc, &intro, &highlights, &updatedAt); err != nil {
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
		out[fullName][locale] = e
	}
	return out, rows.Err()
}

func (s *Store) PluginSnapshots(ctx context.Context, fullName string) ([]SnapshotRow, error) {
	all, err := s.PluginSnapshotsBatch(ctx, []string{fullName})
	if err != nil {
		return nil, err
	}
	return all[fullName], nil
}

// PluginSnapshotsBatch 与翻译同理：单个 connection 页最多两次 Turso 查询，而不随
// nodes 数线性增加。
func (s *Store) PluginSnapshotsBatch(ctx context.Context, fullNames []string) (map[string][]SnapshotRow, error) {
	names := uniquePluginNames(fullNames)
	out := make(map[string][]SnapshotRow, len(names))
	if len(names) == 0 {
		return out, nil
	}
	args := make([]any, len(names))
	for i, name := range names {
		args[i] = name
		out[name] = []SnapshotRow{}
	}
	rows, err := s.db.QueryContext(ctx,
		fmt.Sprintf(`SELECT full_name, snapshot_date, stars, contributors, pushed_at FROM plugin_snapshots
                   WHERE full_name IN (%s) ORDER BY full_name, snapshot_date`, sqlPlaceholders(len(names))),
		args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var fullName string
		var r SnapshotRow
		var contributors sql.NullInt64
		var pushedAt sql.NullString
		if err := rows.Scan(&fullName, &r.Date, &r.Stars, &contributors, &pushedAt); err != nil {
			return nil, err
		}
		if contributors.Valid {
			v := int(contributors.Int64)
			r.Contributors = &v
		}
		if pushedAt.Valid && pushedAt.String != "" {
			r.PushedAt = &pushedAt.String
		}
		out[fullName] = append(out[fullName], r)
	}
	return out, rows.Err()
}

func uniquePluginNames(fullNames []string) []string {
	out := make([]string, 0, len(fullNames))
	seen := make(map[string]struct{}, len(fullNames))
	for _, fullName := range fullNames {
		if fullName == "" {
			continue
		}
		if _, ok := seen[fullName]; ok {
			continue
		}
		seen[fullName] = struct{}{}
		out = append(out, fullName)
	}
	return out
}

func sqlPlaceholders(count int) string {
	return strings.TrimRight(strings.Repeat("?,", count), ",")
}

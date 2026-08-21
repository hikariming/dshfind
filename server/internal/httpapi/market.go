package httpapi

import (
	"encoding/base64"
	"errors"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
)

// 本文件实现 deepseek-harness-desktop 社区市场的「标准目录源」契约
// (dsh-community-market/docs/catalog-provider-contract.md):
//   - GET /market/manifest.json  静态 manifest(catalog-source.schema.json)
//   - GET /market/v1/plugins     契约分页端点(catalog-provider-page.schema.json)
// 两个 schema 都是 additionalProperties:false,因此这里用独立的白名单响应类型,
// 绝不复用 /v1/plugins、/v1/catalog 的响应形状(桌面端内置 adapter 依赖它们)。

const (
	marketDefaultLimit = 50
	marketMaxLimit     = 100
	marketSummaryMax   = 1000
)

// marketManifestJSON 是静态 manifest。transport.endpoint 必须与它被服务的
// origin 一致(api.dshfind.com 443),且路径以 /v1/plugins 结尾。
const marketManifestJSON = `{
  "manifestVersion": "1.0.0",
  "providerId": "com.dshfind.catalog",
  "name": "dshfind Plugin Catalog",
  "description": "Community catalog of DeepSeek Harness plugins indexed by dshfind.",
  "homepage": "https://dshfind.com",
  "attribution": { "name": "dshfind", "url": "https://dshfind.com" },
  "transport": { "kind": "https-json", "endpoint": "https://api.dshfind.com/market/v1/plugins", "method": "GET" },
  "query": { "supported": ["q", "category", "cursor", "limit"], "defaultLimit": 50, "maxLimit": 100, "sorts": [] }
}
`

// 以下正则逐项对齐 catalog-provider-page.schema.json 的 pattern(RE2 无负向断言,
// httpsUri 的 authority 校验由 validMarketHTTPSURL 手工完成)。
var (
	marketIDPattern   = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$`)
	npmNamePattern    = regexp.MustCompile(`^(?:@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*$`)
	categoryIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9._:-]*$`)
)

type marketPluginsResponse struct {
	SchemaVersion string         `json:"schemaVersion"`
	GeneratedAt   string         `json:"generatedAt"`
	Revision      string         `json:"revision"`
	Items         []marketItem   `json:"items"`
	Page          marketPageInfo `json:"page"`
}

type marketPageInfo struct {
	NextCursor string `json:"nextCursor,omitempty"`
	Total      int    `json:"total"`
}

type marketItem struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	DisplayName   string            `json:"displayName"`
	Summary       string            `json:"summary"`
	Repository    *marketRepository `json:"repository,omitempty"`
	Package       *marketPackage    `json:"package,omitempty"`
	Publisher     *marketPublisher  `json:"publisher,omitempty"`
	Categories    []string          `json:"categories,omitempty"`
	LatestVersion string            `json:"latestVersion,omitempty"`
	UpdatedAt     string            `json:"updatedAt,omitempty"`
}

type marketRepository struct {
	URL string `json:"url"`
}

type marketPackage struct {
	Registry string `json:"registry"`
	Name     string `json:"name"`
}

type marketPublisher struct {
	Name string `json:"name"`
	URL  string `json:"url,omitempty"`
}

// GET /market/manifest.json —— 静态 manifest,内容恒定,给 5 分钟级缓存。
func (s *Server) handleMarketManifest(w http.ResponseWriter, r *http.Request) {
	writeCacheableText(w, r, http.StatusOK, marketManifestJSON, "application/json; charset=utf-8", publicSchemaCacheControl)
}

// GET /market/v1/plugins —— 契约分页:只含 is_plugin 确认的插件,按 full_name
// 升序固定排序,游标绑定快照版本,快照变更后旧游标收到 409(stale_data),
// 客户端据此从头重新同步。
func (s *Server) handleMarketPlugins(w http.ResponseWriter, r *http.Request) {
	snap := s.cache.Get()
	if snap == nil {
		writeError(w, http.StatusServiceUnavailable, "internal", "plugin cache not loaded yet", 0)
		return
	}
	q := r.URL.Query()
	limit := clampInt(parseIntOr(q.Get("limit"), marketDefaultLimit), 1, marketMaxLimit)

	offset := 0
	if raw := q.Get("cursor"); raw != "" {
		version, off, err := decodeMarketCursor(raw)
		if err != nil {
			writeError(w, http.StatusBadRequest, "bad_request", "invalid cursor", 0)
			return
		}
		if version != snap.Version {
			writeError(w, http.StatusConflict, "stale_data", "data version changed; restart pagination without cursor", 0)
			return
		}
		offset = off
	}

	keyword := strings.ToLower(strings.TrimSpace(q.Get("q")))
	category := q.Get("category")
	filtered := make([]store.Plugin, 0, len(snap.Plugins))
	for i := range snap.Plugins {
		p := &snap.Plugins[i]
		// 只要确认是插件的条目;未知(nil)与确认非插件都排除,契约端点不做猜测。
		if p.IsPlugin == nil || !*p.IsPlugin {
			continue
		}
		if category != "" && p.Category != category {
			continue
		}
		if keyword != "" &&
			!strings.Contains(strings.ToLower(p.Name), keyword) &&
			!strings.Contains(strings.ToLower(p.Description), keyword) {
			continue
		}
		filtered = append(filtered, *p)
	}
	sort.Slice(filtered, func(i, j int) bool { return filtered[i].FullName < filtered[j].FullName })

	total := len(filtered)
	if offset > total {
		offset = total
	}
	end := min(offset+limit, total)

	items := make([]marketItem, 0, end-offset)
	for i := offset; i < end; i++ {
		if item, ok := buildMarketItem(&filtered[i]); ok {
			items = append(items, item)
		}
	}

	page := marketPageInfo{Total: total}
	if end < total {
		page.NextCursor = encodeMarketCursor(snap.Version, end)
	}

	writeCacheableJSON(w, r, http.StatusOK, marketPluginsResponse{
		SchemaVersion: "1.0.0",
		GeneratedAt:   snap.AsOf.Format(time.RFC3339),
		Revision:      snap.Version,
		Items:         items,
		Page:          page,
	}, publicDataCacheControl)
}

// buildMarketItem 把一条快照记录映射为契约 item。返回 false 表示该记录无法
// 满足 schema 的必填约束(如 id 不合法、repository/package 皆缺),整项跳过,
// 保证响应一定过 schema 校验。
func buildMarketItem(p *store.Plugin) (marketItem, bool) {
	id := p.FullName
	if len(id) > 160 || !marketIDPattern.MatchString(id) {
		return marketItem{}, false
	}
	name := truncateRunes(plainMarketText(p.Name), 160)
	if name == "" {
		name = truncateRunes(plainMarketText(p.FullName), 160)
	}
	if name == "" {
		return marketItem{}, false
	}
	summary := truncateRunes(plainMarketText(p.Description), marketSummaryMax)
	if summary == "" {
		summary = truncateRunes(name, 120)
	}

	item := marketItem{
		ID:          id,
		Name:        name,
		DisplayName: truncateRunes(name, 120),
		Summary:     summary,
	}

	repoURL := p.RepositoryURL
	if repoURL == "" {
		repoURL = p.URL
	}
	if validMarketHTTPSURL(repoURL) {
		item.Repository = &marketRepository{URL: repoURL}
	}

	if p.Category != "" && len(p.Category) <= 64 && categoryIDPattern.MatchString(p.Category) {
		item.Categories = []string{p.Category}
	}

	if owner := truncateRunes(plainMarketText(p.Owner), 120); owner != "" {
		pub := &marketPublisher{Name: owner}
		if u := "https://github.com/" + p.Owner; validMarketHTTPSURL(u) {
			pub.URL = u
		}
		item.Publisher = pub
	}

	if p.PushedAt != nil {
		if ts, err := time.Parse(time.RFC3339, *p.PushedAt); err == nil {
			item.UpdatedAt = ts.Format(time.RFC3339)
		}
	}

	// npm 安装信息门控:npm_desktop_installable 为真(探测侧已判定该包能通过
	// 桌面端 npm preview 全部复核)才输出 package/latestVersion(桌面端据此
	// 决定是否给一键安装);包名/版本 pattern 作为防御保留。
	if p.NpmDesktopInstallable && p.NpmLatestVersion != nil && *p.NpmLatestVersion != "" {
		if pkg := p.Install.PkgName; pkg != nil && len(*pkg) <= 214 && npmNamePattern.MatchString(*pkg) {
			item.Package = &marketPackage{Registry: "npm", Name: *pkg}
			item.LatestVersion = truncateRunes(*p.NpmLatestVersion, 64)
		}
	}

	// schema anyOf:repository 与 package 至少其一。
	if item.Repository == nil && item.Package == nil {
		return marketItem{}, false
	}
	return item, true
}

// plainMarketText 剔除 schema plainText pattern 禁止的控制字符与 bidi 控制符。
func plainMarketText(s string) string {
	return strings.TrimSpace(strings.Map(func(r rune) rune {
		switch {
		case r < 0x20, r >= 0x7F && r <= 0x9F,
			r >= 0x202A && r <= 0x202E,
			r >= 0x2066 && r <= 0x2069:
			return -1
		}
		return r
	}, s))
}

// truncateRunes 按码点截断(schema maxLength 以字符计),避免切断多字节字符。
func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}

// validMarketHTTPSURL 手工实现 schema httpsUri pattern:https 前缀、无 fragment、
// authority 段不含 @ 与 :(即无 userinfo、无端口号,也就是 443)。
func validMarketHTTPSURL(u string) bool {
	if u == "" || len(u) > 2048 || !strings.HasPrefix(u, "https://") || strings.Contains(u, "#") {
		return false
	}
	rest := u[len("https://"):]
	authority := rest
	if i := strings.IndexAny(authority, "/?"); i >= 0 {
		authority = authority[:i]
	}
	return authority != "" && !strings.ContainsAny(authority, "@:")
}

// 游标 = base64url("<snapshotVersion>:<offset>"),RawURLEncoding 无填充,
// 可直接进 query 参数。version 自身含冒号(sha256:...),解码时按最后一个冒号切分。
func encodeMarketCursor(version string, offset int) string {
	return base64.RawURLEncoding.EncodeToString([]byte(version + ":" + strconv.Itoa(offset)))
}

var errInvalidMarketCursor = errors.New("invalid market cursor")

func decodeMarketCursor(cursor string) (string, int, error) {
	raw, err := base64.RawURLEncoding.DecodeString(cursor)
	if err != nil {
		return "", 0, errInvalidMarketCursor
	}
	s := string(raw)
	i := strings.LastIndexByte(s, ':')
	if i <= 0 || i == len(s)-1 {
		return "", 0, errInvalidMarketCursor
	}
	offset, err := strconv.Atoi(s[i+1:])
	if err != nil || offset < 0 {
		return "", 0, errInvalidMarketCursor
	}
	return s[:i], offset, nil
}

package httpapi

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	sessionCookieName   = "dshfind_session"
	signedInCookieName  = "dshfind_signed_in"
	oauthStateCookie    = "dshfind_oauth_state"
	oauthReturnCookie   = "dshfind_oauth_return_to"
	oauthVerifierCookie = "dshfind_oauth_verifier"
	oauthStateLifetime  = 10 * time.Minute
	sessionLifetime     = 7 * 24 * time.Hour
)

var authNow = time.Now

// sessionUser 是签进 JWT 的全部身份信息：站点对所有 GitHub 账号开放，
// 登录只用来认人（顶栏头像、后续的提交/收藏），不承载任何权限位。
type sessionUser struct {
	Login  string  `json:"login"`
	Name   *string `json:"name"`
	Avatar *string `json:"avatar"`
}

type sessionClaims struct {
	sessionUser
	IssuedAt  int64 `json:"iat"`
	ExpiresAt int64 `json:"exp"`
}

type githubUser struct {
	Login     string  `json:"login"`
	Name      *string `json:"name"`
	AvatarURL *string `json:"avatar_url"`
}

// handleGitHubLogin 开始 OAuth 授权。state 和回跳路径都只放在 api 域名的短时
// HttpOnly cookie 内；GitHub 回调只能消费同一浏览器刚刚发起的登录。
func (s *Server) handleGitHubLogin(w http.ResponseWriter, r *http.Request) {
	returnTo := validReturnTo(r.URL.Query().Get("return_to"))
	if !s.oauthConfigured() {
		s.redirectLoginError(w, r, returnTo, "not_configured")
		return
	}

	state, err := randomState()
	if err != nil {
		s.redirectLoginError(w, r, returnTo, "oauth_unavailable")
		return
	}
	verifier, err := randomState()
	if err != nil {
		s.redirectLoginError(w, r, returnTo, "oauth_unavailable")
		return
	}

	http.SetCookie(w, s.oauthCookie(oauthStateCookie, state, oauthStateLifetime))
	http.SetCookie(w, s.oauthCookie(oauthReturnCookie, returnTo, oauthStateLifetime))
	http.SetCookie(w, s.oauthCookie(oauthVerifierCookie, verifier, oauthStateLifetime))

	// 不申请任何 scope：GitHub 只会给到公开资料（login / name / avatar），
	// 授权页因此显示的是最轻的一档权限，任何人都能放心点同意。
	q := url.Values{
		"client_id":             {s.cfg.GitHubClientID},
		"redirect_uri":          {s.oauthCallbackURL()},
		"state":                 {state},
		"code_challenge":        {pkceChallenge(verifier)},
		"code_challenge_method": {"S256"},
	}
	http.Redirect(w, r, "https://github.com/login/oauth/authorize?"+q.Encode(), http.StatusFound)
}

// handleGitHubCallback 完成 code 换 token 与身份读取，之后签发与 Next.js jose
// 完全兼容的 HS256 JWT。GitHub access token 不落库、不写 Cookie。
// 登录对所有 GitHub 账号开放，这里不做任何成员/名单校验。
func (s *Server) handleGitHubCallback(w http.ResponseWriter, r *http.Request) {
	returnTo := validReturnTo(cookieValue(r, oauthReturnCookie))

	if !s.oauthConfigured() {
		s.redirectOAuthCallbackError(w, r, returnTo, "not_configured")
		return
	}
	state := r.URL.Query().Get("state")
	verifier := cookieValue(r, oauthVerifierCookie)
	if state == "" || verifier == "" || !constantTimeStringEqual(state, cookieValue(r, oauthStateCookie)) {
		s.redirectOAuthCallbackError(w, r, returnTo, "invalid_state")
		return
	}
	if r.URL.Query().Get("error") != "" {
		s.redirectOAuthCallbackError(w, r, returnTo, "oauth_denied")
		return
	}
	code := r.URL.Query().Get("code")
	if code == "" {
		s.redirectOAuthCallbackError(w, r, returnTo, "invalid_callback")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	accessToken, err := s.exchangeGitHubCode(ctx, code, verifier)
	if err != nil {
		s.redirectOAuthCallbackError(w, r, returnTo, "token_exchange_failed")
		return
	}
	user, err := s.fetchGitHubUser(ctx, accessToken)
	if err != nil || user.Login == "" {
		s.redirectOAuthCallbackError(w, r, returnTo, "user_fetch_failed")
		return
	}
	token, err := s.signSession(sessionUser{
		Login: user.Login, Name: user.Name, Avatar: user.AvatarURL,
	})
	if err != nil {
		s.redirectOAuthCallbackError(w, r, returnTo, "oauth_unavailable")
		return
	}
	s.clearOAuthCookies(w)
	http.SetCookie(w, s.sessionCookie(token, int(sessionLifetime.Seconds())))
	http.SetCookie(w, s.signedInCookie("1", int(sessionLifetime.Seconds())))
	http.Redirect(w, r, s.frontendURL(returnTo), http.StatusFound)
}

// handleAuthMe 保留原 /api/auth/me 的能力，但由 API 直接提供。只有配置的前端 Origin
// 能带 Cookie 读取；公开数据 API 仍维持 CORS * 与无凭据语义。
func (s *Server) handleAuthMe(w http.ResponseWriter, r *http.Request) {
	if !s.setAuthCORS(w, r) {
		writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
		return
	}
	user, ok := s.verifySession(cookieValue(r, sessionCookieName))
	if !ok {
		writeJSON(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleAuthMePreflight(w http.ResponseWriter, r *http.Request) {
	if !s.setAuthCORS(w, r) {
		writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
		return
	}
	h := w.Header()
	h.Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
	w.WriteHeader(http.StatusNoContent)
}

// handleLogout 只允许配置的 Web Origin 触发，防止第三方站点用跨站 form 强制用户退出。
func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Origin") != s.cfg.WebURL {
		writeError(w, http.StatusForbidden, "forbidden", "origin is not allowed", 0)
		return
	}
	returnTo := validReturnTo(r.URL.Query().Get("return_to"))
	http.SetCookie(w, s.sessionCookie("", -1))
	http.SetCookie(w, s.signedInCookie("", -1))
	http.Redirect(w, r, s.frontendURL(returnTo), http.StatusSeeOther)
}

func (s *Server) oauthConfigured() bool {
	return s.cfg.GitHubClientID != "" && s.cfg.GitHubClientSecret != "" && s.cfg.AuthSecret != ""
}

func (s *Server) oauthCallbackURL() string { return s.cfg.APIPublicURL + "/auth/github/callback" }

func (s *Server) frontendURL(returnTo string) string {
	base, _ := url.Parse(s.cfg.WebURL)
	target, _ := url.Parse(validReturnTo(returnTo))
	return base.ResolveReference(target).String()
}

func (s *Server) loginErrorURL(returnTo, code string) string {
	target := &url.URL{Path: "/" + localeFromReturnTo(returnTo) + "/login"}
	q := target.Query()
	q.Set("error", code)
	target.RawQuery = q.Encode()
	return s.frontendURL(target.String())
}

func (s *Server) redirectLoginError(w http.ResponseWriter, r *http.Request, returnTo, code string) {
	http.Redirect(w, r, s.loginErrorURL(returnTo, code), http.StatusFound)
}

func (s *Server) redirectOAuthCallbackError(w http.ResponseWriter, r *http.Request, returnTo, code string) {
	s.clearOAuthCookies(w)
	s.redirectLoginError(w, r, returnTo, code)
}

func (s *Server) oauthCookie(name, value string, lifetime time.Duration) *http.Cookie {
	return &http.Cookie{
		Name: name, Value: value, Path: "/auth/github", HttpOnly: true,
		Secure: s.secureCookies(), SameSite: http.SameSiteLaxMode,
		MaxAge: int(lifetime.Seconds()), Expires: authNow().Add(lifetime),
	}
}

func (s *Server) clearOAuthCookies(w http.ResponseWriter) {
	for _, name := range []string{oauthStateCookie, oauthReturnCookie, oauthVerifierCookie} {
		cookie := s.oauthCookie(name, "", 0)
		cookie.MaxAge = -1
		cookie.Expires = time.Unix(1, 0)
		http.SetCookie(w, cookie)
	}
}

func (s *Server) sessionCookie(value string, maxAge int) *http.Cookie {
	cookie := &http.Cookie{
		Name: sessionCookieName, Value: value, Path: "/", HttpOnly: true,
		Secure: s.secureCookies(), SameSite: http.SameSiteLaxMode, MaxAge: maxAge,
	}
	if s.cfg.AuthCookieDomain != "" {
		cookie.Domain = s.cfg.AuthCookieDomain
	}
	if maxAge > 0 {
		cookie.Expires = authNow().Add(time.Duration(maxAge) * time.Second)
	} else {
		cookie.Expires = time.Unix(1, 0)
	}
	return cookie
}

// signedInCookie 与 session cookie 永远成对设置/清除。它不含任何凭据，只是给
// 浏览器 JS 看的一面旗：会话 cookie 是 httpOnly，前端读不到，只能问
// /api/auth/me 并把答案缓存到 sessionStorage。没有这面旗，登录成功跳回站内时
// 那份缓存还是登录前的"未登录"，整站会继续显示未登录——用户看到的就是
// "点了登录没反应"。有了它，前端知道该丢掉旧答案重查。
func (s *Server) signedInCookie(value string, maxAge int) *http.Cookie {
	cookie := s.sessionCookie(value, maxAge)
	cookie.Name = signedInCookieName
	cookie.HttpOnly = false
	return cookie
}

func (s *Server) secureCookies() bool {
	base, err := url.Parse(s.cfg.APIPublicURL)
	return err == nil && base.Scheme == "https"
}

func (s *Server) setAuthCORS(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	if origin != s.cfg.WebURL {
		return false
	}
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", origin)
	h.Set("Access-Control-Allow-Credentials", "true")
	h.Add("Vary", "Origin")
	return true
}

func (s *Server) exchangeGitHubCode(ctx context.Context, code, verifier string) (string, error) {
	form := url.Values{
		"client_id":     {s.cfg.GitHubClientID},
		"client_secret": {s.cfg.GitHubClientSecret},
		"code":          {code},
		"code_verifier": {verifier},
		"redirect_uri":  {s.oauthCallbackURL()},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://github.com/login/oauth/access_token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.githubHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub token endpoint: %s", resp.Status)
	}
	var body struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 64<<10)).Decode(&body); err != nil || body.AccessToken == "" {
		return "", fmt.Errorf("GitHub token response invalid: %w", err)
	}
	return body.AccessToken, nil
}

func (s *Server) fetchGitHubUser(ctx context.Context, accessToken string) (githubUser, error) {
	var user githubUser
	if err := s.githubJSON(ctx, "https://api.github.com/user", accessToken, &user); err != nil {
		return githubUser{}, err
	}
	return user, nil
}

func (s *Server) githubJSON(ctx context.Context, endpoint, accessToken string, dst any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("User-Agent", "dshfind-api")
	resp, err := s.githubHTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub API %s: %s", endpoint, resp.Status)
	}
	return json.NewDecoder(io.LimitReader(resp.Body, 256<<10)).Decode(dst)
}

func (s *Server) signSession(user sessionUser) (string, error) {
	if s.cfg.AuthSecret == "" {
		return "", fmt.Errorf("AUTH_SECRET is not configured")
	}
	now := authNow().UTC()
	header, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		return "", err
	}
	payload, err := json.Marshal(sessionClaims{
		sessionUser: user, IssuedAt: now.Unix(), ExpiresAt: now.Add(sessionLifetime).Unix(),
	})
	if err != nil {
		return "", err
	}
	encodedHeader := base64.RawURLEncoding.EncodeToString(header)
	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	signingInput := encodedHeader + "." + encodedPayload
	mac := hmac.New(sha256.New, []byte(s.cfg.AuthSecret))
	_, _ = mac.Write([]byte(signingInput))
	return signingInput + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

func (s *Server) verifySession(token string) (sessionUser, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 || s.cfg.AuthSecret == "" {
		return sessionUser{}, false
	}
	header, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return sessionUser{}, false
	}
	var protected struct {
		Algorithm string `json:"alg"`
	}
	if json.Unmarshal(header, &protected) != nil || protected.Algorithm != "HS256" {
		return sessionUser{}, false
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return sessionUser{}, false
	}
	mac := hmac.New(sha256.New, []byte(s.cfg.AuthSecret))
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	if !hmac.Equal(signature, mac.Sum(nil)) {
		return sessionUser{}, false
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return sessionUser{}, false
	}
	var claims sessionClaims
	if json.Unmarshal(payload, &claims) != nil || claims.Login == "" || claims.ExpiresAt <= authNow().Unix() {
		return sessionUser{}, false
	}
	return claims.sessionUser, true
}

func randomState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func constantTimeStringEqual(a, b string) bool {
	if len(a) != len(b) || len(a) == 0 {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

func cookieValue(r *http.Request, name string) string {
	cookie, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func validReturnTo(raw string) string {
	if raw == "" {
		return "/"
	}
	u, err := url.Parse(raw)
	if err != nil || u.IsAbs() || u.Host != "" || !strings.HasPrefix(u.Path, "/") || strings.HasPrefix(raw, "//") || strings.Contains(raw, "\\") || strings.Contains(u.Path, "\\") {
		return "/"
	}
	return raw
}

func localeFromReturnTo(returnTo string) string {
	path, _ := url.Parse(validReturnTo(returnTo))
	part := strings.Split(strings.TrimPrefix(path.Path, "/"), "/")[0]
	for _, locale := range []string{"zh", "en", "ja", "ko"} {
		if part == locale {
			return locale
		}
	}
	return "zh"
}

package httpapi

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
)

func TestGitHubOAuthRunsInAPIAndIssuesSharedSession(t *testing.T) {
	restoreNow := authNow
	authNow = func() time.Time { return time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC) }
	t.Cleanup(func() { authNow = restoreNow })

	s := newAuthTestServer(t)
	s.githubHTTPClient = &http.Client{Transport: githubTransport{t: t, body: map[string]string{
		"POST github.com/login/oauth/access_token": `{"access_token":"github-access-token"}`,
		"GET api.github.com/user":                  `{"login":"mias","name":"Mias","avatar_url":"https://avatars.example/mias"}`,
	}}}

	start := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github?return_to=%2Fzh%2Fplugins%3Ftag%3Dgo", nil)
	startRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(startRec, start)
	if startRec.Code != http.StatusFound {
		t.Fatalf("start status = %d, want 302", startRec.Code)
	}
	location, err := url.Parse(startRec.Header().Get("Location"))
	if err != nil || location.Host != "github.com" || location.Path != "/login/oauth/authorize" {
		t.Fatalf("start Location = %q, want GitHub authorization URL", startRec.Header().Get("Location"))
	}
	state := location.Query().Get("state")
	if state == "" || location.Query().Get("redirect_uri") != "https://api.dshfind.test/auth/github/callback" || location.Query().Get("code_challenge_method") != "S256" || location.Query().Get("code_challenge") == "" {
		t.Fatalf("start query = %s, want state, PKCE, and API callback", location.RawQuery)
	}
	// 站点对所有人开放：授权页只能要公开资料，多申请一个 scope 都是登录门槛。
	if location.Query().Has("scope") {
		t.Errorf("start query = %s, want no OAuth scope", location.RawQuery)
	}
	cookies := startRec.Result().Cookies()
	if len(cookies) != 3 {
		t.Fatalf("start cookies = %d, want state, return_to, and verifier", len(cookies))
	}
	var verifier string
	for _, cookie := range cookies {
		if cookie.Name == oauthVerifierCookie {
			verifier = cookie.Value
		}
	}
	if verifier == "" || location.Query().Get("code_challenge") != pkceChallenge(verifier) {
		t.Fatal("authorization request PKCE challenge does not match stored verifier")
	}

	callback := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github/callback?code=oauth-code&state="+url.QueryEscape(state), nil)
	for _, cookie := range cookies {
		callback.AddCookie(cookie)
	}
	callbackRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(callbackRec, callback)
	if callbackRec.Code != http.StatusFound {
		t.Fatalf("callback status = %d, want 302", callbackRec.Code)
	}
	if got := callbackRec.Header().Get("Location"); got != "https://dshfind.test/zh/plugins?tag=go" {
		t.Errorf("callback Location = %q", got)
	}
	var session *http.Cookie
	for _, cookie := range callbackRec.Result().Cookies() {
		if cookie.Name == sessionCookieName {
			session = cookie
		}
	}
	if session == nil || !session.HttpOnly || !session.Secure || session.Domain != "dshfind.test" {
		t.Fatalf("session cookie = %#v, want secure shared-domain cookie", session)
	}
	user, ok := s.verifySession(session.Value)
	if !ok || user.Login != "mias" || user.Name == nil || *user.Name != "Mias" {
		t.Errorf("issued session = %#v, ok=%v", user, ok)
	}
}

func TestAuthRoutesHaveDedicatedRateLimit(t *testing.T) {
	s := newAuthTestServer(t)
	s.cfg.AuthRatePerMin = 60
	s.cfg.AuthRateBurst = 1
	s.cfg.AuthGlobalRatePerMin = 60
	s.cfg.AuthGlobalRateBurst = 10

	request := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github", nil)
	request.RemoteAddr = "203.0.113.8:1234"
	first := httptest.NewRecorder()
	s.Handler().ServeHTTP(first, request)
	if first.Code != http.StatusFound {
		t.Fatalf("first OAuth start status = %d, want 302", first.Code)
	}

	request = httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github", nil)
	request.RemoteAddr = "203.0.113.8:1234"
	second := httptest.NewRecorder()
	s.Handler().ServeHTTP(second, request)
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second OAuth start status = %d, want 429", second.Code)
	}
}

func TestGitHubOAuthRejectsStateAndExternalReturnURL(t *testing.T) {
	s := newAuthTestServer(t)
	badReturn := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github?return_to=https%3A%2F%2Fevil.example", nil)
	badReturnRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(badReturnRec, badReturn)
	if location := badReturnRec.Header().Get("Location"); !strings.Contains(location, "github.com/login/oauth/authorize") {
		t.Fatalf("unexpected start Location = %q", location)
	}
	var state *http.Cookie
	for _, cookie := range badReturnRec.Result().Cookies() {
		if cookie.Name == oauthStateCookie {
			state = cookie
		}
	}
	if state == nil {
		t.Fatal("OAuth start did not set state cookie")
	}
	callback := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/github/callback?code=x&state=not-the-state", nil)
	callback.AddCookie(state)
	callbackRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(callbackRec, callback)
	if got := callbackRec.Header().Get("Location"); got != "https://dshfind.test/zh/login?error=invalid_state" {
		t.Errorf("invalid state Location = %q", got)
	}
}

func TestAuthMeAndLogoutUseStrictOrigin(t *testing.T) {
	s := newAuthTestServer(t)
	token, err := s.signSession(sessionUser{Login: "mias"})
	if err != nil {
		t.Fatal(err)
	}

	me := httptest.NewRequest(http.MethodGet, "https://api.dshfind.test/auth/me", nil)
	me.Header.Set("Origin", "https://dshfind.test")
	me.AddCookie(&http.Cookie{Name: sessionCookieName, Value: token})
	meRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(meRec, me)
	if meRec.Code != http.StatusOK || meRec.Header().Get("Access-Control-Allow-Origin") != "https://dshfind.test" || meRec.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("auth me status/headers = %d %#v", meRec.Code, meRec.Header())
	}

	forbidden := httptest.NewRequest(http.MethodPost, "https://api.dshfind.test/auth/logout", nil)
	forbidden.Header.Set("Origin", "https://evil.example")
	forbiddenRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(forbiddenRec, forbidden)
	if forbiddenRec.Code != http.StatusForbidden {
		t.Errorf("foreign logout status = %d, want 403", forbiddenRec.Code)
	}

	logout := httptest.NewRequest(http.MethodPost, "https://api.dshfind.test/auth/logout?return_to=%2Fen%2Flogin", nil)
	logout.Header.Set("Origin", "https://dshfind.test")
	logoutRec := httptest.NewRecorder()
	s.Handler().ServeHTTP(logoutRec, logout)
	if logoutRec.Code != http.StatusSeeOther || logoutRec.Header().Get("Location") != "https://dshfind.test/en/login" {
		t.Errorf("logout response = %d %q", logoutRec.Code, logoutRec.Header().Get("Location"))
	}
	cleared := logoutRec.Result().Cookies()[0]
	if cleared.Name != sessionCookieName || cleared.MaxAge >= 0 || cleared.Domain != "dshfind.test" {
		t.Errorf("cleared cookie = %#v", cleared)
	}
}

func newAuthTestServer(t *testing.T) *Server {
	t.Helper()
	return New(&config.Config{
		WebURL:               "https://dshfind.test",
		APIPublicURL:         "https://api.dshfind.test",
		AuthCookieDomain:     "dshfind.test",
		AuthSecret:           "0123456789abcdef0123456789abcdef",
		GitHubClientID:       "github-client-id",
		GitHubClientSecret:   "github-client-secret",
		AuthRatePerMin:       60,
		AuthRateBurst:        20,
		AuthGlobalRatePerMin: 600,
		AuthGlobalRateBurst:  100,
		RateLimitMaxBuckets:  100,
	}, nil, nil, nil, ratelimit.New(100))
}

type githubTransport struct {
	t    *testing.T
	body map[string]string
}

func (g githubTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	g.t.Helper()
	key := req.Method + " " + req.URL.Host + req.URL.Path
	body, ok := g.body[key]
	if !ok {
		g.t.Errorf("unexpected GitHub request: %s", key)
		return &http.Response{StatusCode: http.StatusNotFound, Status: "404 Not Found", Body: io.NopCloser(strings.NewReader("{}")), Header: make(http.Header), Request: req}, nil
	}
	if req.URL.Host == "github.com" && req.Header.Get("Content-Type") != "application/x-www-form-urlencoded" {
		g.t.Errorf("token request Content-Type = %q", req.Header.Get("Content-Type"))
	}
	if req.URL.Host == "github.com" {
		form, err := io.ReadAll(req.Body)
		if err != nil {
			g.t.Errorf("read token request body: %v", err)
		} else if values, err := url.ParseQuery(string(form)); err != nil || values.Get("code") != "oauth-code" || values.Get("client_secret") != "github-client-secret" || values.Get("code_verifier") == "" || values.Get("redirect_uri") != "https://api.dshfind.test/auth/github/callback" {
			g.t.Errorf("token request form = %q, parse error = %v", form, err)
		}
	}
	return &http.Response{
		StatusCode: http.StatusOK, Status: "200 OK", Header: http.Header{"Content-Type": {"application/json"}},
		Body: io.NopCloser(strings.NewReader(body)), Request: req,
	}, nil
}

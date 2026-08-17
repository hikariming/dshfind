package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/dsh-external/dshfind/server/internal/audit"
	"github.com/dsh-external/dshfind/server/internal/cache"
	"github.com/dsh-external/dshfind/server/internal/config"
	"github.com/dsh-external/dshfind/server/internal/httpapi"
	"github.com/dsh-external/dshfind/server/internal/ratelimit"
	"github.com/dsh-external/dshfind/server/internal/store"
)

// TestTursoBackedAPIEndToEnd starts the real Go HTTP router over an existing
// Turso database. It is intentionally opt-in and read-only: no migration is
// run and the audit worker is not started, so it cannot alter the shared DB.
// Set DSHFIND_E2E_TURSO_URL and DSHFIND_E2E_TURSO_AUTH_TOKEN to run it.
func TestTursoBackedAPIEndToEnd(t *testing.T) {
	databaseURL := normalizeE2ETursoURL(os.Getenv("DSHFIND_E2E_TURSO_URL"))
	token := os.Getenv("DSHFIND_E2E_TURSO_AUTH_TOKEN")
	if databaseURL == "" || token == "" {
		t.Skip("set DSHFIND_E2E_TURSO_URL and DSHFIND_E2E_TURSO_AUTH_TOKEN to run read-only Turso E2E")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	st, err := store.Open(databaseURL, token)
	if err != nil {
		t.Fatalf("open configured Turso database: %v", err)
	}
	defer st.Close()
	pluginCache := cache.New(st)
	if err := pluginCache.Refresh(ctx); err != nil {
		t.Fatalf("load plugin cache from Turso: %v", err)
	}
	if snapshot := pluginCache.Get(); snapshot == nil || len(snapshot.Plugins) == 0 {
		t.Fatal("Turso plugin cache is empty; cannot validate public data paths")
	}

	cfg := &config.Config{
		GlobalRatePerMin: 6000, GlobalRateBurst: 500,
		IPRatePerMin: 240, IPRateBurst: 60,
		AnonRatePerMin: 30, AnonRateBurst: 10,
		SuggestRatePerMin: 60, SuggestRateBurst: 20,
		GraphQLRatePerMin: 60, GraphQLRateBurst: 20, GraphQLRateCost: 10,
		KeyRatePerMin: 120, KeyRateBurst: 30,
		AuthRatePerMin: 60, AuthRateBurst: 20,
		AuthGlobalRatePerMin: 1800, AuthGlobalRateBurst: 100,
		RateLimitMaxBuckets: 65_536,
		WebURL:              "https://dshfind.test", APIPublicURL: "https://api.dshfind.test",
		AuthCookieDomain: "dshfind.test", AuthSecret: "0123456789abcdef0123456789abcdef",
		GitHubClientID: "test-client", GitHubClientSecret: "test-secret", GitHubOrg: "dsh-external",
	}
	server := httpapi.New(cfg, pluginCache, st, audit.New(st), ratelimit.New(cfg.RateLimitMaxBuckets))
	if err := server.ReloadKeys(ctx); err != nil {
		t.Fatalf("load API keys from Turso: %v", err)
	}
	httpServer := httptest.NewServer(server.Handler())
	defer httpServer.Close()

	response := e2eRequest(t, http.DefaultClient, http.MethodGet, httpServer.URL+"/healthz", nil)
	if response.StatusCode != http.StatusOK {
		t.Fatalf("health status = %d, want 200", response.StatusCode)
	}
	var health struct {
		Status        string `json:"status"`
		PluginsLoaded int    `json:"plugins_loaded"`
	}
	decodeE2EJSON(t, response, &health)
	if health.Status != "ok" || health.PluginsLoaded == 0 {
		t.Fatalf("health = %#v, want loaded plugins", health)
	}

	response = e2eRequest(t, http.DefaultClient, http.MethodGet, httpServer.URL+"/v1/plugins?per_page=1", nil)
	if response.StatusCode != http.StatusOK {
		t.Fatalf("list status = %d, want 200", response.StatusCode)
	}
	etag := response.Header.Get("ETag")
	if etag == "" {
		t.Fatal("list response omitted ETag")
	}
	var list struct {
		Data []struct {
			FullName string `json:"full_name"`
		} `json:"data"`
	}
	decodeE2EJSON(t, response, &list)
	if len(list.Data) != 1 || list.Data[0].FullName == "" {
		t.Fatalf("list = %#v, want one plugin", list)
	}
	fullName := list.Data[0].FullName

	response = e2eRequest(t, http.DefaultClient, http.MethodGet, httpServer.URL+"/v1/plugins?per_page=1", http.Header{"If-None-Match": {etag}})
	if response.StatusCode != http.StatusNotModified {
		response.Body.Close()
		t.Fatalf("conditional list status = %d, want 304", response.StatusCode)
	}
	response.Body.Close()

	response = e2eRequest(t, http.DefaultClient, http.MethodGet, httpServer.URL+"/v1/suggest?q="+url.QueryEscape(fullName), nil)
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		t.Fatalf("suggest status = %d, want 200", response.StatusCode)
	}
	var suggest struct {
		Items []struct {
			ID string `json:"id"`
		} `json:"items"`
	}
	decodeE2EJSON(t, response, &suggest)
	if len(suggest.Items) == 0 || suggest.Items[0].ID != fullName {
		t.Fatalf("suggest = %#v, want %q", suggest, fullName)
	}

	query := `query($name: ID!) { plugin(fullName: $name) { fullName repositoryUrl } }`
	variables, err := json.Marshal(map[string]string{"name": fullName})
	if err != nil {
		t.Fatal(err)
	}
	graphURL := httpServer.URL + "/graphql?query=" + url.QueryEscape(query) + "&variables=" + url.QueryEscape(string(variables))
	response = e2eRequest(t, http.DefaultClient, http.MethodGet, graphURL, nil)
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		t.Fatalf("GraphQL status = %d, want 200", response.StatusCode)
	}
	var graph struct {
		Data struct {
			Plugin struct {
				FullName      string `json:"fullName"`
				RepositoryURL string `json:"repositoryUrl"`
			} `json:"plugin"`
		} `json:"data"`
	}
	decodeE2EJSON(t, response, &graph)
	if graph.Data.Plugin.FullName != fullName || graph.Data.Plugin.RepositoryURL == "" {
		t.Fatalf("GraphQL plugin = %#v, want %q and repository URL", graph.Data.Plugin, fullName)
	}

	if serviceKey := os.Getenv("BACKEND_API_KEY"); serviceKey != "" {
		response = e2eRequest(t, http.DefaultClient, http.MethodGet, httpServer.URL+"/v1/plugins?per_page=1", http.Header{"X-Api-Key": {serviceKey}})
		if response.StatusCode != http.StatusOK {
			response.Body.Close()
			t.Fatalf("Vercel service-key list status = %d, want 200", response.StatusCode)
		}
		response.Body.Close()
	} else {
		t.Log("BACKEND_API_KEY unset: skipped Vercel service-key request")
	}

	noRedirect := &http.Client{CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	response = e2eRequest(t, noRedirect, http.MethodGet, httpServer.URL+"/auth/github?return_to=%2Fzh", nil)
	if response.StatusCode != http.StatusFound || !strings.HasPrefix(response.Header.Get("Location"), "https://github.com/login/oauth/authorize?") {
		response.Body.Close()
		t.Fatalf("OAuth entry = %d %q, want GitHub redirect", response.StatusCode, response.Header.Get("Location"))
	}
	response.Body.Close()
}

func normalizeE2ETursoURL(raw string) string {
	if rest, ok := strings.CutPrefix(raw, "libsql://"); ok {
		return "https://" + rest
	}
	return raw
}

func e2eRequest(t *testing.T, client *http.Client, method, endpoint string, headers http.Header) *http.Response {
	t.Helper()
	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	for key, values := range headers {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}
	response, err := client.Do(req)
	if err != nil {
		t.Fatalf("request %s %s: %v", method, endpoint, err)
	}
	return response
}

func decodeE2EJSON(t *testing.T, response *http.Response, target any) {
	t.Helper()
	defer response.Body.Close()
	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decode response JSON: %v", err)
	}
}

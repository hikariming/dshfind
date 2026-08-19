package store

import (
	"database/sql"
	"testing"
)

func ns(v string) sql.NullString { return sql.NullString{String: v, Valid: true} }
func ni(v int64) sql.NullInt64   { return sql.NullInt64{Int64: v, Valid: true} }

func TestBuildInstallMethodsGate(t *testing.T) {
	t.Run("三重门全过时输出恰好一条 npm 证据", func(t *testing.T) {
		inst := buildInstall(sql.NullString{}, ns("dsh plugin add x"), ns("npm"), ns("dsh-x"), ns("1.0.0"), ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("1.2.3"), ni(1))
		if len(inst.Methods) != 1 {
			t.Fatalf("expected 1 method, got %+v", inst.Methods)
		}
		m := inst.Methods[0]
		if m.Kind != "npm" || m.Verification != "verified" || m.Code != "repository_backlink" ||
			m.RequiresBuildAllowance || m.Spec != "dsh-x" || m.Revision != "1.2.3" {
			t.Fatalf("unexpected method: %+v", m)
		}
	})
	cases := map[string]Install{
		"未发布 npm":     buildInstall(sql.NullString{}, sql.NullString{}, ns("git"), ns("dsh-x"), sql.NullString{}, ni(0), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("1.2.3"), ni(1)),
		"回链未通过":       buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("dsh-x"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("1.2.3"), ni(0)),
		"预发布版本":       buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("dsh-x"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("1.2.3-rc.1"), ni(1)),
		"版本带前导零":      buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("dsh-x"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("01.2.3"), ni(1)),
		"缺最新版本":       buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("dsh-x"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, ni(1)),
		"包名非法":        buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("DSH-X"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("1.2.3"), ni(1)),
		"scoped 包名放行": buildInstall(sql.NullString{}, sql.NullString{}, ns("npm"), ns("@scope/dsh-x"), sql.NullString{}, ni(1), sql.NullString{}, sql.NullString{}, sql.NullString{}, ns("0.1.0"), ni(1)),
	}
	for label, inst := range cases {
		want := 0
		if label == "scoped 包名放行" {
			want = 1
		}
		if len(inst.Methods) != want {
			t.Errorf("%s: expected %d methods, got %+v", label, want, inst.Methods)
		}
	}
}

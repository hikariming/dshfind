package store

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"io"
	"strings"
	"sync"
	"testing"
)

const migrationTestDriverName = "dshfind-migration-recorder"

var migrationTestDriver = &recordingDriver{}

func init() {
	sql.Register(migrationTestDriverName, migrationTestDriver)
}

func TestMigrateExecutesPluginReadContract(t *testing.T) {
	migrationTestDriver.reset()
	db, err := sql.Open(migrationTestDriverName, "")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })

	s := &Store{db: db}
	if err := s.Migrate(context.Background()); err != nil {
		t.Fatalf("Migrate() error = %v", err)
	}

	statements := migrationTestDriver.statements()
	for _, want := range []string{
		"CREATE TABLE IF NOT EXISTS plugins",
		"CREATE TABLE IF NOT EXISTS plugin_i18n",
		"CREATE TABLE IF NOT EXISTS plugin_snapshots",
		"CREATE TABLE IF NOT EXISTS api_keys",
		"ALTER TABLE plugins ADD COLUMN install_kind",
		"ALTER TABLE plugins ADD COLUMN score_version",
		"ALTER TABLE plugins ADD COLUMN release_etag",
		"ALTER TABLE plugins ADD COLUMN entry_committed",
	} {
		if !containsStatement(statements, want) {
			t.Errorf("Migrate() did not execute %q", want)
		}
	}
}

func TestDuplicateColumnErrorIsIgnored(t *testing.T) {
	if !isDuplicateColumn(&testError{"duplicate column name: install_kind"}) {
		t.Fatal("duplicate column error was not recognized")
	}
	if isDuplicateColumn(&testError{"database is unavailable"}) {
		t.Fatal("non-duplicate error was incorrectly recognized")
	}
}

func containsStatement(statements []string, want string) bool {
	for _, statement := range statements {
		if strings.Contains(statement, want) {
			return true
		}
	}
	return false
}

type recordingDriver struct {
	mu   sync.Mutex
	exec []string
}

func (d *recordingDriver) Open(string) (driver.Conn, error) {
	return &recordingConn{driver: d}, nil
}

func (d *recordingDriver) reset() {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.exec = nil
}

func (d *recordingDriver) statements() []string {
	d.mu.Lock()
	defer d.mu.Unlock()
	return append([]string(nil), d.exec...)
}

type recordingConn struct{ driver *recordingDriver }

func (*recordingConn) Prepare(string) (driver.Stmt, error) { return nil, driver.ErrSkip }
func (*recordingConn) Close() error                        { return nil }
func (*recordingConn) Begin() (driver.Tx, error)           { return nil, driver.ErrSkip }

func (c *recordingConn) ExecContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Result, error) {
	c.driver.mu.Lock()
	c.driver.exec = append(c.driver.exec, query)
	c.driver.mu.Unlock()
	return driver.RowsAffected(0), nil
}

func (*recordingConn) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	if !strings.Contains(query, "PRAGMA table_info(plugins)") {
		return nil, driver.ErrSkip
	}
	// 模拟一个早期 plugins 表，迫使 Migrate 执行增量列迁移。
	return &recordingRows{}, nil
}

type recordingRows struct{ emitted bool }

func (*recordingRows) Columns() []string {
	return []string{"cid", "name", "type", "notnull", "dflt_value", "pk"}
}

func (r *recordingRows) Next(dest []driver.Value) error {
	if r.emitted {
		return io.EOF
	}
	r.emitted = true
	dest[0] = int64(0)
	dest[1] = "full_name"
	dest[2] = "TEXT"
	dest[3] = int64(0)
	dest[4] = nil
	dest[5] = int64(1)
	return nil
}

func (*recordingRows) Close() error { return nil }

type testError struct{ message string }

func (e *testError) Error() string { return e.message }

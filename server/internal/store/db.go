// Package store 是唯一接触 Turso 的层:连接、迁移、全部 SQL。
package store

import (
	"database/sql"
	"fmt"
	"net/url"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

type Store struct {
	db *sql.DB
}

func Open(tursoURL, authToken string) (*Store, error) {
	u, err := url.Parse(tursoURL)
	if err != nil {
		return nil, fmt.Errorf("解析 TURSO_DATABASE_URL: %w", err)
	}
	q := u.Query()
	q.Set("authToken", authToken)
	u.RawQuery = q.Encode()

	db, err := sql.Open("libsql", u.String())
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

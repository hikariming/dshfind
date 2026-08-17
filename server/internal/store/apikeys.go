package store

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
	"time"
)

type APIKey struct {
	ID         int64   `json:"id"`
	KeyPrefix  string  `json:"key_prefix"`
	Name       string  `json:"name"`
	Contact    string  `json:"contact"`
	RatePerMin int     `json:"rate_per_min"`
	CreatedAt  string  `json:"created_at"`
	LastUsedAt *string `json:"last_used_at"`
	RevokedAt  *string `json:"revoked_at"`
}

const keyAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

// CreateKey 生成 dshf_ 前缀 + 32 位 base62 随机串;库里只存 sha256,
// 明文仅在返回值里出现一次,发丢了只能重发。
func (s *Store) CreateKey(ctx context.Context, name, contact string, ratePerMin int) (string, APIKey, error) {
	var b strings.Builder
	b.WriteString("dshf_")
	for range 32 {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(keyAlphabet))))
		if err != nil {
			return "", APIKey{}, err
		}
		b.WriteByte(keyAlphabet[n.Int64()])
	}
	plaintext := b.String()
	sum := sha256.Sum256([]byte(plaintext))
	now := time.Now().UTC().Format(time.RFC3339)
	if ratePerMin <= 0 {
		ratePerMin = 120
	}

	res, err := s.db.ExecContext(ctx,
		`INSERT INTO api_keys (key_hash, key_prefix, name, contact, rate_per_min, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		hex.EncodeToString(sum[:]), plaintext[:12], name, contact, ratePerMin, now)
	if err != nil {
		return "", APIKey{}, err
	}
	id, _ := res.LastInsertId()
	return plaintext, APIKey{
		ID: id, KeyPrefix: plaintext[:12], Name: name, Contact: contact,
		RatePerMin: ratePerMin, CreatedAt: now,
	}, nil
}

func (s *Store) RevokeKey(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`,
		time.Now().UTC().Format(time.RFC3339), id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("key %d 不存在或已吊销", id)
	}
	return nil
}

// LoadActiveKeys 返回 key_hash → APIKey,供请求路径上的内存查表。
func (s *Store) LoadActiveKeys(ctx context.Context) (map[string]APIKey, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, key_hash, key_prefix, name, contact, rate_per_min, created_at, last_used_at
		 FROM api_keys WHERE revoked_at IS NULL`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]APIKey{}
	for rows.Next() {
		var k APIKey
		var hash string
		var lastUsed sql.NullString
		if err := rows.Scan(&k.ID, &hash, &k.KeyPrefix, &k.Name, &k.Contact, &k.RatePerMin, &k.CreatedAt, &lastUsed); err != nil {
			return nil, err
		}
		if lastUsed.Valid {
			k.LastUsedAt = &lastUsed.String
		}
		out[hash] = k
	}
	return out, rows.Err()
}

func (s *Store) ListKeys(ctx context.Context) ([]APIKey, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, key_prefix, name, contact, rate_per_min, created_at, last_used_at, revoked_at
		 FROM api_keys ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []APIKey{}
	for rows.Next() {
		var k APIKey
		var lastUsed, revoked sql.NullString
		if err := rows.Scan(&k.ID, &k.KeyPrefix, &k.Name, &k.Contact, &k.RatePerMin, &k.CreatedAt, &lastUsed, &revoked); err != nil {
			return nil, err
		}
		if lastUsed.Valid {
			k.LastUsedAt = &lastUsed.String
		}
		if revoked.Valid {
			k.RevokedAt = &revoked.String
		}
		out = append(out, k)
	}
	return out, rows.Err()
}

// TouchKeysUsed 惰性更新 last_used_at:只在审计 flush 时按批调用,不在请求路径上。
func (s *Store) TouchKeysUsed(ctx context.Context, ids []int64, ts string) error {
	if len(ids) == 0 {
		return nil
	}
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(ids)), ",")
	args := make([]any, 0, len(ids)+1)
	args = append(args, ts)
	for _, id := range ids {
		args = append(args, id)
	}
	_, err := s.db.ExecContext(ctx,
		`UPDATE api_keys SET last_used_at = ? WHERE id IN (`+placeholders+`)`, args...)
	return err
}

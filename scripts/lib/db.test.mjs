import test from "node:test";
import assert from "node:assert/strict";

import {
  D1_BATCH_LIMIT,
  chunkStatements,
  isWriteStatement,
  normalizeStatement,
} from "./db.mjs";

test("isWriteStatement：写语句识别覆盖脚本里实际出现的形态", () => {
  assert.equal(isWriteStatement("INSERT INTO plugins (a) VALUES (1)"), true);
  assert.equal(isWriteStatement("  update plugins set stars = 1"), true);
  assert.equal(isWriteStatement("DELETE FROM sync_runs"), true);
  assert.equal(isWriteStatement("CREATE TABLE IF NOT EXISTS x (id)"), true);
  assert.equal(isWriteStatement("ALTER TABLE plugins ADD COLUMN y TEXT"), true);
  assert.equal(isWriteStatement("INSERT OR REPLACE INTO t VALUES (1)"), true);
  assert.equal(isWriteStatement("SELECT * FROM plugins"), false);
  assert.equal(isWriteStatement("PRAGMA table_info(plugins)"), false);
  // 关键词必须是词首：字段名里含 update 不算写。
  assert.equal(isWriteStatement("SELECT updated_at FROM plugins"), false);
});

test("normalizeStatement：字符串与对象统一成 {sql, args}", () => {
  assert.deepEqual(normalizeStatement("SELECT 1"), { sql: "SELECT 1", args: [] });
  assert.deepEqual(normalizeStatement({ sql: "SELECT ?", args: ["a"] }), {
    sql: "SELECT ?",
    args: ["a"],
  });
  // undefined 参数按 null 处理（对齐 JSON 序列化后的实际取值）。
  assert.deepEqual(normalizeStatement({ sql: "SELECT ?", args: [undefined] }), {
    sql: "SELECT ?",
    args: [null],
  });
  assert.deepEqual(normalizeStatement({ sql: "SELECT 1" }), { sql: "SELECT 1", args: [] });
});

test("chunkStatements：按内部路由上限切段", () => {
  const stmts = Array.from({ length: 250 }, (_, i) => ({ sql: `-- ${i}`, args: [] }));
  const chunks = chunkStatements(stmts);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, D1_BATCH_LIMIT);
  assert.equal(chunks[2].length, 50);
  assert.deepEqual(chunkStatements([], 10), []);
});

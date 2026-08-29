#!/usr/bin/env node
/**
 * 运营维护插件多语言文案（plugin_i18n 表 + plugins.install_cmd）。
 * 改动即时生效于插件页与详情页；首页静态数据在下次 pnpm gen:plugins 后跟上。
 *
 * 用法：
 *   node --env-file=.env.local scripts/set-plugin-i18n.mjs <owner/repo> --show
 *   node --env-file=.env.local scripts/set-plugin-i18n.mjs <owner/repo> --locale=zh \
 *        [--description="…"] [--intro="…"] [--highlights='["a","b"]']
 *   node --env-file=.env.local scripts/set-plugin-i18n.mjs <owner/repo> --install-cmd="dsh plugin … add …"
 *   node --env-file=.env.local scripts/set-plugin-i18n.mjs --from-json=<file.json>   # 批量
 *
 * 批量 JSON 结构（AI 翻译流水线直接产出这个）：
 *   { "owner/repo": { "installCmd": "…",
 *       "zh": { "description": "…", "intro": "…", "highlights": ["…"] },
 *       "en": { … }, "ja": { … }, "ko": { … } }, … }
 */
import { readFileSync } from "node:fs";
import { openDb } from "./lib/db.mjs";

const LOCALES = ["zh", "en", "ja", "ko"];

const client = openDb();

const args = process.argv.slice(2);
const now = new Date().toISOString();
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

/** 组一条 upsert；只更新传入的字段，未传的保留原值。 */
function upsertI18n(fullName, locale, { description, intro, highlights }) {
  return {
    sql: `INSERT INTO plugin_i18n (full_name, locale, description, intro, highlights, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(full_name, locale) DO UPDATE SET
            description = COALESCE(excluded.description, plugin_i18n.description),
            intro       = COALESCE(excluded.intro, plugin_i18n.intro),
            highlights  = COALESCE(excluded.highlights, plugin_i18n.highlights),
            updated_at  = excluded.updated_at`,
    args: [
      fullName,
      locale,
      description ?? null,
      intro ?? null,
      highlights ? JSON.stringify(highlights) : null,
      now,
    ],
  };
}

const fromJson = opt("from-json");
if (fromJson) {
  const data = JSON.parse(readFileSync(fromJson, "utf8"));
  const stmts = [];
  for (const [fullName, entry] of Object.entries(data)) {
    for (const loc of LOCALES) {
      if (entry[loc]) stmts.push(upsertI18n(fullName, loc, entry[loc]));
    }
    if (entry.installCmd) {
      stmts.push({
        sql: `UPDATE plugins SET install_cmd = ? WHERE lower(full_name) = lower(?)`,
        args: [entry.installCmd, fullName],
      });
    }
  }
  await client.batch(stmts, "write");
  console.log(`✅ 批量写入 ${Object.keys(data).length} 个插件、${stmts.length} 条语句`);
  process.exit(0);
}

const fullName = args.find((a) => !a.startsWith("--"));
if (!fullName) {
  console.error("用法见文件头注释");
  process.exit(1);
}

if (args.includes("--show")) {
  const rows = (
    await client.execute({
      sql: `SELECT locale, description, intro, highlights FROM plugin_i18n WHERE lower(full_name) = lower(?)`,
      args: [fullName],
    })
  ).rows;
  const cmd = (
    await client.execute({
      sql: `SELECT install_cmd FROM plugins WHERE lower(full_name) = lower(?)`,
      args: [fullName],
    })
  ).rows[0];
  console.log("install_cmd:", cmd?.install_cmd ?? "(默认)");
  for (const r of rows) {
    console.log(`[${r.locale}] desc: ${r.description ?? "-"}`);
    if (r.intro) console.log(`     intro: ${String(r.intro).slice(0, 80)}…`);
    if (r.highlights) console.log(`     highlights: ${r.highlights}`);
  }
  if (!rows.length) console.log("（无文案记录）");
  process.exit(0);
}

const installCmd = opt("install-cmd");
if (installCmd) {
  const rs = await client.execute({
    sql: `UPDATE plugins SET install_cmd = ? WHERE lower(full_name) = lower(?)`,
    args: [installCmd, fullName],
  });
  if (!rs.rowsAffected) {
    console.error(`未找到 ${fullName}`);
    process.exit(1);
  }
  console.log(`✅ ${fullName} install_cmd 已更新`);
}

const locale = opt("locale");
if (locale) {
  if (!LOCALES.includes(locale)) {
    console.error(`locale 必须是 ${LOCALES.join("/")}`);
    process.exit(1);
  }
  const highlights = opt("highlights");
  await client.execute(
    upsertI18n(fullName, locale, {
      description: opt("description"),
      intro: opt("intro"),
      highlights: highlights ? JSON.parse(highlights) : undefined,
    }),
  );
  console.log(`✅ ${fullName} [${locale}] 文案已更新`);
}

if (!installCmd && !locale) {
  console.error("没有指定任何写入项（--locale=… / --install-cmd=… / --show）");
  process.exit(1);
}

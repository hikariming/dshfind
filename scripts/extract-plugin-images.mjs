#!/usr/bin/env node
/**
 * 给每个收录仓库抽一张配图：解析 README → 过滤徽章 → 下载 → 转两档 webp → 传 R2，
 * 结果写回 Turso plugin_images 表。
 *
 * 用法：
 *   pnpm images:extract --probe-only        # 只探测「有没有图」，不下载不上传（无需 R2 凭据）
 *   pnpm images:extract                     # 完整管线：探测 + 处理 + 上传
 *   pnpm images:extract --limit 200         # 只处理前 N 个（按 star 降序，先覆盖有人看的那批）
 *   pnpm images:extract --only owner/repo   # 只处理一个（可重复传）
 *   pnpm images:extract --all               # 无视新鲜度，全部重抽
 *   pnpm images:extract --stale-days 30     # 换个新鲜度阈值（默认 30 天）
 *   pnpm images:extract --dry-run           # 只打印，不写库不上传
 *   pnpm images:extract --verbose           # 逐条打印选中的图（--only 时自动开启）
 *
 * 为什么走 raw.githubusercontent.com 而不是 GitHub API：README 抓取量等于仓库数
 * （9,672 次），走 API 会瞬间打穿 5,000/小时 的限额；raw 是 CDN，不占 API 配额。
 * 只有回退到「自定义社交预览图」时才请求 github.com 的 HTML 页面，那是少数情况。
 *
 * 抽取规则（含徽章过滤、相对路径解析、候选打分）在 scripts/lib/plugin-images.mjs，
 * 有单测；改规则后跑 `pnpm test` 即可验证，不必联网。
 */
import { createHash } from "node:crypto";

import { openDb } from "./lib/db.mjs";

import {
  customSocialPreview,
  imageKeyPrefix,
  pickPluginImage,
} from "./lib/plugin-images.mjs";

// ---------- 常量 ----------

const CONCURRENCY = 8;
const DEFAULT_STALE_DAYS = 30;
const FETCH_TIMEOUT_MS = 20_000;

/** 原图体积上限。超过多半是没压过的 PNG 录屏，处理它不值当。 */
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * 尺寸下限。低于这个的基本是漏网的图标或分隔线——徽章域名黑名单挡不住
 * 自建域名上的徽章，尺寸是第二道闸。
 */
const MIN_WIDTH = 320;
const MIN_HEIGHT = 120;

/** 列表卡片用：固定 16:9，避免 100 张图陆续到达把 CLS 打爆。 */
const THUMB = { width: 480, height: 270, quality: 78 };
/** 详情页用：限宽不限高，保留原比例。 */
const FULL = { width: 1200, quality: 82 };

/** README 的常见文件名，按命中率排序。 */
const README_NAMES = [
  "README.md",
  "readme.md",
  "README.MD",
  "README.rst",
  "README.zh.md",
  "README_CN.md",
  "README.zh-CN.md",
  "README.txt",
];

// ---------- 参数 ----------

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const only = argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []));
const limit = Number(opt("--limit", 0)) || 0;
const staleDays = Number(opt("--stale-days", DEFAULT_STALE_DAYS));
const dryRun = has("--dry-run");
const all = has("--all");
// --only 隐含逐条打印：为一两个仓库调规则时，进度条毫无用处
const verbose = has("--verbose") || only.length > 0;
let probeOnly = has("--probe-only");

// ---------- 基础设施 ----------

function db() {
  return openDb();
}

/**
 * R2 客户端。凭据不全时返回 null，调用方自动降级成 --probe-only——
 * 让人能先拿到「到底多少插件有图」这个数，再决定要不要建桶。
 */
async function r2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  const { S3Client } = await import("@aws-sdk/client-s3");
  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket: process.env.R2_BUCKET || "dshfind-plugin-images",
  };
}

/** 简单并发池：不引依赖，顺序无关。与 probe-install.mjs 同一形态。 */
async function mapPool(items, poolLimit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(poolLimit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** 带超时的 fetch；超时/网络错误一律当作「取不到」返回 null，不让单个仓库拖垮整轮。 */
async function get(url, { asText = false } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { "user-agent": "dshfind-image-bot (+https://dshfind.com)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    if (asText) return { text: await res.text(), res };
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, res };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- 单个仓库的处理 ----------

/** 依次尝试常见 README 文件名，返回第一个取到的正文。 */
async function fetchReadme(fullName) {
  for (const name of README_NAMES) {
    const got = await get(`https://raw.githubusercontent.com/${fullName}/HEAD/${name}`, {
      asText: true,
    });
    if (got?.text) return got.text;
  }
  return null;
}

/**
 * 找出这个仓库该用哪张图。
 * README 优先于社交预览图：README 里的通常是作者精心放的效果图，
 * 而社交预览图更多是 logo 或宣传banner。
 */
async function findImage(fullName) {
  const readme = await fetchReadme(fullName);
  if (readme) {
    const picked = pickPluginImage(readme, fullName);
    if (picked) {
      return { kind: "readme", url: picked.url, raw: picked.sourceUrl, alt: picked.alt };
    }
  }
  // 回退：仓库主手工上传过的社交预览图。GitHub 自动合成的那张不要——
  // 那就是仓库名 + 头像 + 描述，我们自己排版能做得更好。
  const page = await get(`https://github.com/${fullName}`, { asText: true });
  const social = page?.text ? customSocialPreview(page.text) : null;
  if (social) return { kind: "social", url: social, raw: social, alt: "" };
  return null;
}

/**
 * 下载并转成两档 webp。
 * @returns {{ok: true, ...} | {ok: false, note: string}}
 */
async function processImage(sharp, url) {
  const got = await get(url);
  if (!got) return { ok: false, note: "下载失败" };

  const type = got.res.headers.get("content-type") || "";
  if (type && !type.startsWith("image/")) {
    return { ok: false, note: `不是图片：${type.split(";")[0]}` };
  }
  if (got.buf.length > MAX_IMAGE_BYTES) {
    return { ok: false, note: `原图过大：${(got.buf.length / 1048576).toFixed(1)}MB` };
  }

  let meta;
  try {
    meta = await sharp(got.buf).metadata();
  } catch {
    return { ok: false, note: "解码失败" };
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return { ok: false, note: `尺寸过小：${width}×${height}` };
  }

  // 动图只取首帧：列表卡片上一排动图既干扰阅读又拖流量。
  // 详情页要放动图是另一件事，等真要做的时候单独加一档。
  const thumb = await sharp(got.buf)
    .resize(THUMB.width, THUMB.height, { fit: "cover", position: "top" })
    .webp({ quality: THUMB.quality })
    .toBuffer();
  const full = await sharp(got.buf)
    .resize({ width: FULL.width, withoutEnlargement: true })
    .webp({ quality: FULL.quality })
    .toBuffer();

  return {
    ok: true,
    width,
    height,
    hash: createHash("sha256").update(got.buf).digest("hex").slice(0, 16),
    thumb,
    full,
  };
}

async function upload(store, key, body) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await store.client.send(
    new PutObjectCommand({
      Bucket: store.bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      // 内容变了键也会变（键里带 hash），所以可以放心长缓存
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

// ---------- 主流程 ----------

const client = db();
const store = probeOnly || dryRun ? null : await r2();
if (!probeOnly && !dryRun && !store) {
  console.log("⚠️ 未配置 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY");
  console.log("   自动降级为 --probe-only：只统计有没有图，不下载不上传。\n");
  probeOnly = true;
}

let sharp = null;
if (!probeOnly) {
  ({ default: sharp } = await import("sharp"));
}

/**
 * 待处理清单：按 star 降序，让 --limit 优先覆盖真的有人看的那批。
 * --only 直接用给定的仓库，不查库——调试时不该为了一个仓库扫全表。
 */
async function pendingTargets() {
  if (only.length > 0) return only;
  const cutoff = new Date(Date.now() - staleDays * 86400_000).toISOString();
  const res = await client.execute({
    // is_present / is_offtopic 的口径与 gen-plugins-real.mjs 一致——
    // 不在站上渲染的仓库不值得抽图，探它们只是白烧时间和 GitHub 的耐心。
    //
    // status='found' 必须无条件重取（?3）：那是 --probe-only 留下的「找到了但没入库」，
    // 它同样写了 probed_at。只按新鲜度筛的话，先跑一轮探测再跑真正的抽取，
    // 第二轮会认为全部都还新鲜而一个都不处理——静默地什么也没干。
    sql: `SELECT p.full_name
            FROM plugins p
            LEFT JOIN plugin_images i ON i.full_name = p.full_name
           WHERE p.is_present = 1 AND p.is_offtopic = 0
             AND (?1 = 1
                  OR i.full_name IS NULL
                  OR i.probed_at < ?2
                  OR (?3 = 1 AND i.status = 'found'))
           ORDER BY p.stars DESC`,
    args: [all ? 1 : 0, cutoff, probeOnly ? 0 : 1],
  });
  return res.rows.map((r) => String(r.full_name));
}

let targets = await pendingTargets();
if (limit > 0) targets = targets.slice(0, limit);

// dry-run 会走完下载与转码（那正是要验的部分），只是不写 R2 也不写库，
// 所以此时 store 是 null 而 probeOnly 仍为 false——两个开关不能合并判断。
const mode = probeOnly
  ? "探测模式：不下载、不上传"
  : dryRun
    ? "dry-run：下载并转码，但不写 R2、不写库"
    : `写入 R2 bucket: ${store.bucket}`;
console.log(`📋 待处理 ${targets.length} 个仓库（${mode}）`);

const stats = { ok: 0, found: 0, none: 0, failed: 0 };
const notes = new Map();
/** 累计产物体积——用来把 R2 用量从估算变成实测。 */
const bytes = { thumb: 0, full: 0 };
let done = 0;

await mapPool(targets, CONCURRENCY, async (fullName) => {
  const probedAt = new Date().toISOString();
  let row = {
    full_name: fullName,
    status: "none",
    source_kind: null,
    source_url: null,
    source_raw: null,
    source_hash: null,
    alt: null,
    width: null,
    height: null,
    thumb_key: null,
    full_key: null,
    note: null,
    probed_at: probedAt,
  };

  const found = await findImage(fullName);
  if (found) {
    row = { ...row, status: "found", source_kind: found.kind, source_url: found.url, source_raw: found.raw, alt: found.alt || null };

    if (!probeOnly) {
      const out = await processImage(sharp, found.url);
      if (out.ok) {
        const prefix = `${imageKeyPrefix(fullName)}/${out.hash}`;
        bytes.thumb += out.thumb.length;
        bytes.full += out.full.length;
        if (!dryRun) {
          await upload(store, `${prefix}/thumb.webp`, out.thumb);
          await upload(store, `${prefix}/full.webp`, out.full);
        }
        row = {
          ...row,
          status: "ok",
          source_hash: out.hash,
          width: out.width,
          height: out.height,
          thumb_key: `${prefix}/thumb.webp`,
          full_key: `${prefix}/full.webp`,
        };
      } else {
        row = { ...row, status: "failed", note: out.note };
      }
    }
  }

  stats[row.status] = (stats[row.status] ?? 0) + 1;
  if (row.note) notes.set(row.note, (notes.get(row.note) ?? 0) + 1);

  if (!dryRun) {
    await client.execute({
      sql: `INSERT INTO plugin_images
              (full_name, status, source_kind, source_url, source_raw, source_hash,
               alt, width, height, thumb_key, full_key, note, probed_at)
            VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
            ON CONFLICT(full_name) DO UPDATE SET
              status=excluded.status, source_kind=excluded.source_kind,
              source_url=excluded.source_url, source_raw=excluded.source_raw,
              source_hash=excluded.source_hash, alt=excluded.alt,
              width=excluded.width, height=excluded.height,
              thumb_key=excluded.thumb_key, full_key=excluded.full_key,
              note=excluded.note, probed_at=excluded.probed_at`,
      args: [
        row.full_name, row.status, row.source_kind, row.source_url, row.source_raw,
        row.source_hash, row.alt, row.width, row.height, row.thumb_key,
        row.full_key, row.note, row.probed_at,
      ],
    });
  }

  done += 1;
  if (verbose) {
    const mark = { ok: "✅", found: "🔎", none: "·　", failed: "❌" }[row.status];
    const detail = row.source_url
      ? `${row.source_kind} ${row.width ? `${row.width}×${row.height} ` : ""}${row.source_url}`
      : (row.note ?? "无可用图");
    console.log(`${mark} ${fullName.padEnd(44)} ${detail}`);
  } else if (done % 100 === 0 || done === targets.length) {
    process.stdout.write(`\r   进度 ${done}/${targets.length}`);
  }
});

console.log("\n");
console.log("── 结果 ──────────────────────");
const total = targets.length || 1;
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
if (probeOnly) {
  console.log(`  找到可用图  ${String(stats.found).padStart(5)}  ${pct(stats.found)}`);
} else {
  console.log(
    `  ${dryRun ? "转码成功  " : "已入库 R2 "}  ${String(stats.ok).padStart(5)}  ${pct(stats.ok)}`,
  );
  console.log(`  抽到但失败  ${String(stats.failed).padStart(5)}  ${pct(stats.failed)}`);
}
console.log(`  确实无图    ${String(stats.none).padStart(5)}  ${pct(stats.none)}`);

if (stats.ok > 0) {
  const mb = (n) => `${(n / 1048576).toFixed(1)}MB`;
  const kb = (n) => `${Math.round(n / 1024)}KB`;
  console.log(
    `\n  产物体积：缩略图均 ${kb(bytes.thumb / stats.ok)} / 大图均 ${kb(bytes.full / stats.ok)}` +
      `，本轮共 ${mb(bytes.thumb + bytes.full)}`,
  );
}
if (notes.size > 0) {
  console.log("\n  失败原因分布：");
  for (const [note, n] of [...notes].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(5)}  ${note}`);
  }
}

// 图源构成：README 与社交预览图各占多少，决定后面要不要在 README 解析上继续投入
if (!dryRun) {
  const kinds = (
    await client.execute(
      `SELECT source_kind, count(*) n FROM plugin_images
        WHERE status IN ('ok','found') GROUP BY source_kind`,
    )
  ).rows;
  if (kinds.length > 0) {
    console.log("\n  图源构成（全表累计）：");
    for (const k of kinds) console.log(`    ${String(k.n).padStart(5)}  ${k.source_kind}`);
  }
}

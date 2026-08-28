/**
 * 论坛 + 插件讨论 + 投票，逐项复刻 server/internal/httpapi/forum.go 与
 * server/internal/store/forum.go。数据在 D1（论坛三张表已从 Turso 迁入，
 * 切流后 D1 是唯一写入方，Turso 副本冻结成历史）。
 *
 * 响应字节口径：
 *   - 读端点走 writeCacheableJSON（无尾换行、强 ETag、discussion 级缓存头、
 *     CORS *——Go 的 public 链在 handler 之前就设了）
 *   - 写端点走 writeJSON（**有**尾换行）；投票/发帖带 private,no-store，
 *     发评论 201 **没有** Cache-Control（Go 就是没设，照抄）
 *   - 错误 {"error":{code,message,retry_after?}} + 尾换行
 *
 * JSON 字段序全部照 Go struct 声明序（struct 序列化不排序，只有 map 排序，
 * 所以 board_counts 要按键排）。
 */
import {
  SESSION_COOKIE,
  cookieValue,
  isForumAdmin,
  jsonError,
  setCredentialedCORS,
  verifySession,
  writeJSON,
} from "./auth.mjs";
import { rateAllow, hashedIPKey, rateConfig } from "./ratelimit.mjs";
import { CACHE_CONTROL_DISCUSSION, cacheableResponse, getCatalog, getDetailIndex, goTrimSpace } from "./shared.mjs";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const goEscape = (s) =>
  s
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const MAX_COMMENT_BYTES = 10 << 10;
const MAX_COMMENT_LINKS = 5;
const DISCUSSION_COMMENT_LIMIT = 200;
const MAX_REQUEST_BODY_BYTES = 128 << 10;
const MAX_THREAD_BODY_BYTES = 64 << 10;
const MAX_THREAD_BODY_LINKS = 20;
const MAX_THREAD_TITLE_RUNES = 200;
const THREAD_POST_LIMIT = 500;
const THREADS_PER_PAGE_MAX = 50;
const THREADS_PER_PAGE_DEF = 20;
const THREAD_EXCERPT_CHARS = 300;
const THREAD_SLUG_MAX_CHARS = 48;
const FORUM_WRITE_COST = 60;

const POSTABLE_BOARDS = ["general", "help", "dev", "announce"];
const BOARD_PLUGIN = "plugin";
const BOARD_ANNOUNCE = "announce";

const nowRFC3339 = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const byteLen = (s) => encoder.encode(s).length;

function countLinks(body) {
  const lower = body.toLowerCase();
  return lower.split("http://").length - 1 + (lower.split("https://").length - 1);
}

const normalizeLocale = (raw) => (["zh", "en", "ja", "ko"].includes(raw) ? raw : "zh");
const filterLocale = (raw) => (["zh", "en", "ja", "ko"].includes(raw) ? raw : "");
const filterBoard = (raw) => (raw === BOARD_PLUGIN || POSTABLE_BOARDS.includes(raw) ? raw : "");

function positiveInt(raw, def) {
  if (!/^[+-]?\d+$/.test(raw ?? "")) return def;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 ? n : def;
}

/** 复刻 NormalizeSlug：只留 ASCII 小写字母数字，其余压成单个连字符，上限 48。 */
export function normalizeSlug(raw) {
  let out = "";
  let count = 0;
  let lastDash = true;
  for (const ch of (raw ?? "").toLowerCase()) {
    if (count >= THREAD_SLUG_MAX_CHARS) break;
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
      out += ch;
      count++;
      lastDash = false;
    } else if (!lastDash) {
      out += "-";
      count++;
      lastDash = true;
    }
  }
  return out.replace(/^-+|-+$/g, "");
}

/** 复刻 PluginThreadSlug：确定性 slug + sha256 前 8 位防撞。 */
export async function pluginThreadSlug(fullName) {
  const normalized = fullName.toLowerCase();
  let readable = "plugin-";
  for (const ch of normalized) {
    readable += (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") ? ch : "-";
  }
  const sum = await crypto.subtle.digest("SHA-256", encoder.encode(normalized));
  const hex = Array.from(new Uint8Array(sum), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${readable}-${hex.slice(0, 8)}`;
}

const randomSuffix = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("");

// ── 请求体解析（decodeJSONBody 直译：任何解析/类型问题都是同一个 400）────────

async function decodeBody(request, fields) {
  let text;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  // Go 是 LimitReader 截断后解析失败；这里直接判长
  if (byteLen(text) > MAX_REQUEST_BODY_BYTES) return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    // Go 的 Decode 只读第一个值，尾随垃圾不报错；宽容处理：截取首个平衡值再试
    const m = balancedPrefix(text);
    if (m === null) return null;
    try {
      value = JSON.parse(m);
    } catch {
      return null;
    }
  }
  if (value === null) return {}; // null 解进 struct 是 no-op，全部零值
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [name, key] of fields) {
    const v = value[name];
    if (v === undefined || v === null) {
      out[key] = "";
    } else if (typeof v === "string") {
      out[key] = v;
    } else {
      return null; // 类型不符 → Go 的 Decode 报错 → invalid JSON body
    }
  }
  return out;
}

function balancedPrefix(text) {
  let i = 0;
  while (i < text.length && /[ \t\r\n]/.test(text[i])) i++;
  if (text[i] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let k = i; k < text.length; k++) {
    const ch = text[k];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return text.slice(i, k + 1);
    }
  }
  return null;
}

// ── D1 数据层（store/forum.go 直译）─────────────────────────────────────────

/** 作者对象按 Author struct 序：login, name, avatar。 */
const authorOf = (r) => ({
  login: r.author_login,
  name: r.author_name ?? null,
  avatar: r.author_avatar ?? null,
});

const postOf = (r) => ({
  id: Number(r.id),
  body_md: r.body_md,
  kind: r.kind,
  author: authorOf(r),
  created_at: r.created_at,
});

async function voteCounts(env, fullName) {
  const res = await env.DB.prepare(
    "SELECT verdict, COUNT(*) n FROM plugin_votes WHERE full_name = ? GROUP BY verdict",
  )
    .bind(fullName)
    .all();
  let up = 0;
  let down = 0;
  for (const r of res.results ?? []) {
    if (r.verdict === "up") up = Number(r.n);
    else if (r.verdict === "down") down = Number(r.n);
  }
  return { up, down };
}

async function pluginDiscussion(env, fullName) {
  const { up, down } = await voteCounts(env, fullName);
  const res = await env.DB.prepare(
    `SELECT p.id, p.body_md, p.kind, p.author_login, p.author_name, p.author_avatar, p.created_at
       FROM forum_posts p
       JOIN forum_threads t ON t.id = p.thread_id
      WHERE t.plugin_full_name = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL
      ORDER BY p.created_at ASC, p.id ASC
      LIMIT ?`,
  )
    .bind(fullName, DISCUSSION_COMMENT_LIMIT)
    .all();
  return {
    full_name: fullName,
    up,
    down,
    comments: (res.results ?? []).map(postOf),
  };
}

const threadSummaryOf = (r) => ({
  slug: r.slug,
  board: r.board,
  title: r.title,
  excerpt: r.excerpt,
  author: authorOf(r),
  locale: r.locale,
  plugin_full_name: r.plugin_full_name ?? null,
  reply_count: Number(r.reply_count),
  last_post_at: r.last_post_at,
  is_pinned: Number(r.is_pinned) !== 0,
  is_locked: Number(r.is_locked) !== 0,
  created_at: r.created_at,
});

async function listThreads(env, board, locale, limit, offset) {
  const rows = await env.DB.prepare(
    `SELECT slug, board, title, substr(body_md, 1, ?) excerpt, author_login, author_name, author_avatar,
            locale, plugin_full_name, reply_count, COALESCE(last_post_at, created_at) last_post_at,
            is_pinned, is_locked, created_at
       FROM forum_threads
      WHERE deleted_at IS NULL
        AND (? = '' OR board = ?)
        AND (? = '' OR locale = ?)
      ORDER BY is_pinned DESC, COALESCE(last_post_at, created_at) DESC, id DESC
      LIMIT ? OFFSET ?`,
  )
    .bind(THREAD_EXCERPT_CHARS, board, board, locale, locale, limit, offset)
    .all();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) n FROM forum_threads
      WHERE deleted_at IS NULL AND (? = '' OR board = ?) AND (? = '' OR locale = ?)`,
  )
    .bind(board, board, locale, locale)
    .first();

  // 板块计数只受语言过滤影响（点某个板块 chip 时其他 chip 的数字不该跟着变 0）
  const countRows = await env.DB.prepare(
    `SELECT board, COUNT(*) n FROM forum_threads
      WHERE deleted_at IS NULL AND (? = '' OR locale = ?) GROUP BY board`,
  )
    .bind(locale, locale)
    .all();
  const boardCounts = {};
  for (const r of countRows.results ?? []) boardCounts[r.board] = Number(r.n);

  return {
    items: (rows.results ?? []).map(threadSummaryOf),
    total: Number(totalRow?.n ?? 0),
    boardCounts,
  };
}

async function threadBySlug(env, slug) {
  const r = await env.DB.prepare(
    `SELECT id, slug, board, title, body_md, author_login, author_name, author_avatar,
            locale, plugin_full_name, reply_count, COALESCE(last_post_at, created_at) last_post_at,
            is_pinned, is_locked, created_at
       FROM forum_threads WHERE slug = ? AND deleted_at IS NULL`,
  )
    .bind(slug)
    .first();
  if (!r) return null;
  const posts = await env.DB.prepare(
    `SELECT id, body_md, kind, author_login, author_name, author_avatar, created_at
       FROM forum_posts
      WHERE thread_id = ? AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
      LIMIT ?`,
  )
    .bind(r.id, THREAD_POST_LIMIT)
    .all();
  // Thread struct 序：slug..created_at, posts
  return {
    slug: r.slug,
    board: r.board,
    title: r.title,
    body_md: r.body_md,
    author: authorOf(r),
    locale: r.locale,
    plugin_full_name: r.plugin_full_name ?? null,
    reply_count: Number(r.reply_count),
    last_post_at: r.last_post_at,
    is_pinned: Number(r.is_pinned) !== 0,
    is_locked: Number(r.is_locked) !== 0,
    created_at: r.created_at,
    posts: (posts.results ?? []).map(postOf),
  };
}

// ── 响应助手 ─────────────────────────────────────────────────────────────────

/** 公开读的错误：Go 的 public 链在 handler 前就设了 CORS *。 */
const publicError = (status, code, message) => {
  const h = new Headers({ "Access-Control-Allow-Origin": "*" });
  return jsonError(status, code, message, h);
};

/** map[string]int → 键排序（Go 序列化 map 的行为）。 */
function sortedCounts(counts) {
  const out = {};
  for (const k of Object.keys(counts).sort()) out[k] = counts[k];
  return out;
}

/** 复刻 resolvePluginFullName：owner/repo 必须真实存在，返回快照里的规范写法。 */
async function resolveFullName(env, owner, repo) {
  const [catalog, index] = await Promise.all([getCatalog(env), getDetailIndex(env)]);
  const row = index[`${owner}/${repo}`.toLowerCase()];
  if (row === undefined) return null;
  const [s, e] = catalog.full.offsets[row];
  return JSON.parse(decoder.decode(catalog.full.buf.subarray(s, e))).full_name;
}

// ── 公开读 handlers ─────────────────────────────────────────────────────────

/** GET /v1/plugins/{owner}/{repo}/discussion */
export async function handleDiscussion(request, env, owner, repo) {
  const fullName = await resolveFullName(env, owner, repo);
  if (fullName === null) return publicError(404, "not_found", "plugin not found");
  let discussion;
  try {
    discussion = await pluginDiscussion(env, fullName);
  } catch {
    return publicError(500, "internal", "failed to load discussion");
  }
  const body = encoder.encode(goEscape(JSON.stringify(discussion)));
  return cacheableResponse(request, body, "application/json; charset=utf-8", CACHE_CONTROL_DISCUSSION, {
    "Access-Control-Allow-Origin": "*",
  });
}

/** GET /v1/forum/threads */
export async function handleListThreads(request, env, url) {
  const q = url.searchParams;
  const board = filterBoard(q.get("board") ?? "");
  const locale = filterLocale(q.get("locale") ?? "");
  const page = positiveInt(q.get("page") ?? "", 1);
  let perPage = positiveInt(q.get("per_page") ?? "", THREADS_PER_PAGE_DEF);
  if (perPage > THREADS_PER_PAGE_MAX) perPage = THREADS_PER_PAGE_MAX;

  let result;
  try {
    result = await listThreads(env, board, locale, perPage, (page - 1) * perPage);
  } catch {
    return publicError(500, "internal", "failed to list threads");
  }
  // threadListResponse struct 序：items, total, page, per_page, board_counts, boards
  const payload = {
    items: result.items,
    total: result.total,
    page,
    per_page: perPage,
    board_counts: sortedCounts(result.boardCounts),
    boards: POSTABLE_BOARDS,
  };
  const body = encoder.encode(goEscape(JSON.stringify(payload)));
  return cacheableResponse(request, body, "application/json; charset=utf-8", CACHE_CONTROL_DISCUSSION, {
    "Access-Control-Allow-Origin": "*",
  });
}

/** GET /v1/forum/threads/{slug} */
export async function handleThreadDetail(request, env, slug) {
  let thread;
  try {
    thread = await threadBySlug(env, slug);
  } catch {
    return publicError(500, "internal", "failed to load thread");
  }
  if (thread === null) return publicError(404, "not_found", "thread not found");
  const body = encoder.encode(goEscape(JSON.stringify(thread)));
  return cacheableResponse(request, body, "application/json; charset=utf-8", CACHE_CONTROL_DISCUSSION, {
    "Access-Control-Allow-Origin": "*",
  });
}

// ── 会话写 gate（sessionWrite 直译）──────────────────────────────────────────

/**
 * profile: {name, perHour, burstOps}。通过时返回 {author, headers}（headers 已带
 * credentialed CORS），拒绝时返回 {response}。
 */
async function sessionWriteGate(request, env, profile) {
  const headers = new Headers();
  if (!setCredentialedCORS(env, request, headers)) {
    return { response: jsonError(403, "forbidden", "origin is not allowed", new Headers()) };
  }
  const user = await verifySession(env, cookieValue(request, SESSION_COOKIE));
  if (!user) {
    return { response: jsonError(401, "unauthorized", "sign in with GitHub first", headers) };
  }
  const rc = rateConfig(env);
  const ipKey = await hashedIPKey(request);
  const gate = await rateAllow(env, [
    {
      key: `${profile.name}:${user.login}`,
      perMinute: profile.perHour,
      burst: FORUM_WRITE_COST * profile.burstOps,
      cost: FORUM_WRITE_COST,
    },
    // 一个人换十个 GitHub 小号仍然共用同一条出口 IP 的额度
    { key: `forum-ip:${ipKey}`, perMinute: rc.anonPerMin, burst: rc.anonBurst },
    { key: "global:forum-write", perMinute: rc.authGlobalPerMin, burst: rc.authGlobalBurst, pinned: true },
  ]);
  if (!gate.allowed) {
    return {
      response: jsonError(429, "rate_limited", "too many writes; slow down", headers, gate.retryAfterSec + 1),
    };
  }
  return { author: { login: user.login, name: user.name, avatar: user.avatar }, headers };
}

const profiles = (env) => {
  const rc = rateConfig(env);
  return {
    comment: { name: "forum-comment", perHour: rc.commentPerHour, burstOps: rc.commentBurst },
    vote: { name: "forum-vote", perHour: rc.votePerHour, burstOps: rc.voteBurst },
    thread: { name: "forum-thread", perHour: rc.threadPerHour, burstOps: rc.threadBurst },
  };
};

// ── 写 handlers ──────────────────────────────────────────────────────────────

/** POST /v1/plugins/{owner}/{repo}/comments */
export async function handlePluginComment(request, env, owner, repo) {
  const gate = await sessionWriteGate(request, env, profiles(env).comment);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  const fullName = await resolveFullName(env, owner, repo);
  if (fullName === null) return jsonError(404, "not_found", "plugin not found", headers);

  const payload = await decodeBody(request, [
    ["body_md", "bodyMD"],
    ["kind", "kind"],
    ["locale", "locale"],
  ]);
  if (payload === null) return jsonError(400, "bad_request", "invalid JSON body", headers);

  const body = goTrimSpace(payload.bodyMD);
  if (body === "") return jsonError(400, "bad_request", "body_md is required", headers);
  if (byteLen(body) > MAX_COMMENT_BYTES) return jsonError(400, "bad_request", "body_md exceeds 10KB", headers);
  if (countLinks(body) > MAX_COMMENT_LINKS) {
    return jsonError(400, "bad_request", "too many links in one comment", headers);
  }
  const kind = payload.kind === "" ? "comment" : payload.kind;
  if (kind !== "comment" && kind !== "issue") {
    return jsonError(400, "bad_request", "kind must be comment or issue", headers);
  }

  try {
    const now = nowRFC3339();
    const slug = await pluginThreadSlug(fullName);
    await env.DB.prepare(
      `INSERT INTO forum_threads (slug, board, title, author_login, author_name, author_avatar, locale, plugin_full_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO NOTHING`,
    )
      .bind(slug, BOARD_PLUGIN, fullName, author.login, author.name, author.avatar, normalizeLocale(payload.locale), fullName, now)
      .run();
    const threadRow = await env.DB.prepare("SELECT id FROM forum_threads WHERE slug = ?").bind(slug).first();
    const ins = await env.DB.prepare(
      `INSERT INTO forum_posts (thread_id, body_md, kind, author_login, author_name, author_avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(threadRow.id, body, kind, author.login, author.name, author.avatar, now)
      .run();
    await env.DB.prepare(
      "UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = ? WHERE id = ?",
    )
      .bind(now, threadRow.id)
      .run();
    // 注意：Go 的这个 201 **没有** Cache-Control 头，照抄
    return writeJSON(
      201,
      { post: { id: Number(ins.meta.last_row_id), body_md: body, kind, author, created_at: now } },
      headers,
    );
  } catch {
    return jsonError(500, "internal", "failed to save comment", headers);
  }
}

async function writeVoteCountsResponse(env, headers, fullName, myVote) {
  let counts;
  try {
    counts = await voteCounts(env, fullName);
  } catch {
    return jsonError(500, "internal", "failed to load votes", headers);
  }
  headers.set("Cache-Control", "private, no-store");
  return writeJSON(200, { up: counts.up, down: counts.down, my_vote: myVote }, headers);
}

/** PUT /v1/plugins/{owner}/{repo}/vote */
export async function handlePluginVote(request, env, owner, repo) {
  const gate = await sessionWriteGate(request, env, profiles(env).vote);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  const fullName = await resolveFullName(env, owner, repo);
  if (fullName === null) return jsonError(404, "not_found", "plugin not found", headers);

  const payload = await decodeBody(request, [["verdict", "verdict"]]);
  if (payload === null) return jsonError(400, "bad_request", "invalid JSON body", headers);
  if (payload.verdict !== "up" && payload.verdict !== "down") {
    return jsonError(400, "bad_request", "verdict must be up or down", headers);
  }
  try {
    await env.DB.prepare(
      `INSERT INTO plugin_votes (full_name, user_login, verdict, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(full_name, user_login)
       DO UPDATE SET verdict = excluded.verdict, created_at = excluded.created_at`,
    )
      .bind(fullName, author.login, payload.verdict, nowRFC3339())
      .run();
  } catch {
    return jsonError(500, "internal", "failed to save vote", headers);
  }
  return writeVoteCountsResponse(env, headers, fullName, payload.verdict);
}

/** DELETE /v1/plugins/{owner}/{repo}/vote */
export async function handlePluginUnvote(request, env, owner, repo) {
  const gate = await sessionWriteGate(request, env, profiles(env).vote);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  const fullName = await resolveFullName(env, owner, repo);
  if (fullName === null) return jsonError(404, "not_found", "plugin not found", headers);
  try {
    await env.DB.prepare("DELETE FROM plugin_votes WHERE full_name = ? AND user_login = ?")
      .bind(fullName, author.login)
      .run();
  } catch {
    return jsonError(500, "internal", "failed to clear vote", headers);
  }
  return writeVoteCountsResponse(env, headers, fullName, null);
}

/** GET /v1/me/plugin-votes/{owner}/{repo} —— authLimited 链而不是 sessionWrite。 */
export async function handleMyPluginVote(request, env, owner, repo) {
  const rc = rateConfig(env);
  const ipKey = await hashedIPKey(request);
  const gate = await rateAllow(env, [
    { key: `auth:${ipKey}`, perMinute: rc.authPerMin, burst: rc.authBurst },
    { key: "global:auth", perMinute: rc.authGlobalPerMin, burst: rc.authGlobalBurst, pinned: true },
  ]);
  if (!gate.allowed) {
    return jsonError(429, "rate_limited", "too many requests", new Headers(), gate.retryAfterSec + 1);
  }
  const headers = new Headers();
  if (!setCredentialedCORS(env, request, headers)) {
    return jsonError(403, "forbidden", "origin is not allowed", new Headers());
  }
  const user = await verifySession(env, cookieValue(request, SESSION_COOKIE));
  if (!user) return jsonError(401, "unauthorized", "sign in with GitHub first", headers);
  const fullName = await resolveFullName(env, owner, repo);
  if (fullName === null) return jsonError(404, "not_found", "plugin not found", headers);
  let verdict;
  try {
    const row = await env.DB.prepare(
      "SELECT verdict FROM plugin_votes WHERE full_name = ? AND user_login = ?",
    )
      .bind(fullName, user.login)
      .first();
    verdict = row?.verdict ?? "";
  } catch {
    return jsonError(500, "internal", "failed to load vote", headers);
  }
  headers.set("Cache-Control", "private, no-store");
  return writeJSON(200, { my_vote: verdict === "" ? null : verdict }, headers);
}

/** DELETE /v1/forum/posts/{id} */
export async function handleDeletePost(request, env, idRaw) {
  const gate = await sessionWriteGate(request, env, profiles(env).comment);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  if (!/^[+-]?\d+$/.test(idRaw)) return jsonError(400, "bad_request", "invalid post id", headers);
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) return jsonError(400, "bad_request", "invalid post id", headers);
  try {
    const res = await env.DB.prepare(
      `UPDATE forum_posts SET deleted_at = ?
        WHERE id = ? AND author_login = ? AND deleted_at IS NULL`,
    )
      .bind(nowRFC3339(), id, author.login)
      .run();
    if ((res.meta.changes ?? 0) === 0) {
      // 别人的帖子与不存在的帖子回同一个 404，不给探测 id 的机会
      return jsonError(404, "not_found", "post not found", headers);
    }
    return new Response(null, { status: 204, headers });
  } catch {
    return jsonError(500, "internal", "failed to delete post", headers);
  }
}

/** POST /v1/forum/threads */
export async function handleCreateThread(request, env) {
  const gate = await sessionWriteGate(request, env, profiles(env).thread);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  const payload = await decodeBody(request, [
    ["board", "board"],
    ["title", "title"],
    ["body_md", "bodyMD"],
    ["locale", "locale"],
    ["slug", "slug"],
  ]);
  if (payload === null) return jsonError(400, "bad_request", "invalid JSON body", headers);

  const board = goTrimSpace(payload.board);
  if (!POSTABLE_BOARDS.includes(board)) return jsonError(400, "bad_request", "unknown board", headers);
  if (board === BOARD_ANNOUNCE && !isForumAdmin(env, author.login)) {
    return jsonError(403, "forbidden", "only maintainers can post announcements", headers);
  }
  const title = goTrimSpace(payload.title);
  if (title === "") return jsonError(400, "bad_request", "title is required", headers);
  if ([...title].length > MAX_THREAD_TITLE_RUNES) {
    return jsonError(400, "bad_request", "title is too long", headers);
  }
  const body = goTrimSpace(payload.bodyMD);
  if (body === "") return jsonError(400, "bad_request", "body_md is required", headers);
  if (byteLen(body) > MAX_THREAD_BODY_BYTES) {
    return jsonError(400, "bad_request", "body_md exceeds 64KB", headers);
  }
  if (countLinks(body) > MAX_THREAD_BODY_LINKS) {
    return jsonError(400, "bad_request", "too many links in one post", headers);
  }
  const customSlug = normalizeSlug(payload.slug);
  if (goTrimSpace(payload.slug) !== "" && customSlug === "") {
    return jsonError(400, "bad_request", "slug must contain latin letters or digits", headers);
  }

  const locale = normalizeLocale(payload.locale);
  const custom = customSlug !== "";
  let readable = custom ? customSlug : normalizeSlug(title);
  if (readable === "") readable = "t"; // 纯中文标题的兜底

  try {
    const now = nowRFC3339();
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt > 0 || !custom ? `${readable}-${randomSuffix()}` : readable;
      const res = await env.DB.prepare(
        `INSERT INTO forum_threads
           (slug, board, title, body_md, author_login, author_name, author_avatar, locale, last_post_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO NOTHING`,
      )
        .bind(slug, board, title, body, author.login, author.name, author.avatar, locale, now, now)
        .run();
      if ((res.meta.changes ?? 0) === 0) continue; // slug 撞了，换个随机后缀重试
      headers.set("Cache-Control", "private, no-store");
      // Thread struct 序（reply_count/is_pinned/is_locked/plugin_full_name 是零值也要出现）
      return writeJSON(
        201,
        {
          thread: {
            slug,
            board,
            title,
            body_md: body,
            author,
            locale,
            plugin_full_name: null,
            reply_count: 0,
            last_post_at: now,
            is_pinned: false,
            is_locked: false,
            created_at: now,
            posts: [],
          },
        },
        headers,
      );
    }
    return jsonError(500, "internal", "failed to create thread", headers);
  } catch {
    return jsonError(500, "internal", "failed to create thread", headers);
  }
}

/** POST /v1/forum/threads/{slug}/posts */
export async function handleThreadReply(request, env, slug) {
  const gate = await sessionWriteGate(request, env, profiles(env).comment);
  if (gate.response) return gate.response;
  const { author, headers } = gate;

  const payload = await decodeBody(request, [["body_md", "bodyMD"]]);
  if (payload === null) return jsonError(400, "bad_request", "invalid JSON body", headers);
  const body = goTrimSpace(payload.bodyMD);
  if (body === "") return jsonError(400, "bad_request", "body_md is required", headers);
  if (byteLen(body) > MAX_COMMENT_BYTES) return jsonError(400, "bad_request", "body_md exceeds 10KB", headers);
  if (countLinks(body) > MAX_COMMENT_LINKS) {
    return jsonError(400, "bad_request", "too many links in one reply", headers);
  }

  try {
    const t = await env.DB.prepare(
      "SELECT id, is_locked FROM forum_threads WHERE slug = ? AND deleted_at IS NULL",
    )
      .bind(slug)
      .first();
    if (!t) return jsonError(404, "not_found", "thread not found", headers);
    if (Number(t.is_locked) !== 0) return jsonError(409, "locked", "thread is locked", headers);

    const now = nowRFC3339();
    const ins = await env.DB.prepare(
      `INSERT INTO forum_posts (thread_id, body_md, kind, author_login, author_name, author_avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(t.id, body, "comment", author.login, author.name, author.avatar, now)
      .run();
    await env.DB.prepare(
      "UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = ? WHERE id = ?",
    )
      .bind(now, t.id)
      .run();
    headers.set("Cache-Control", "private, no-store");
    return writeJSON(
      201,
      { post: { id: Number(ins.meta.last_row_id), body_md: body, kind: "comment", author, created_at: now } },
      headers,
    );
  } catch {
    return jsonError(500, "internal", "failed to save reply", headers);
  }
}

/** DELETE /v1/forum/threads/{slug} —— 插件讨论帖排除在外（见 store 注释）。 */
export async function handleDeleteThread(request, env, slug) {
  const gate = await sessionWriteGate(request, env, profiles(env).thread);
  if (gate.response) return gate.response;
  const { author, headers } = gate;
  try {
    const res = await env.DB.prepare(
      `UPDATE forum_threads SET deleted_at = ?
        WHERE slug = ? AND author_login = ? AND deleted_at IS NULL AND plugin_full_name IS NULL`,
    )
      .bind(nowRFC3339(), slug, author.login)
      .run();
    if ((res.meta.changes ?? 0) === 0) return jsonError(404, "not_found", "thread not found", headers);
    return new Response(null, { status: 204, headers });
  } catch {
    return jsonError(500, "internal", "failed to delete thread", headers);
  }
}

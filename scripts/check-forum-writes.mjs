#!/usr/bin/env node
/**
 * S3 验收（二）：论坛写路径 + 鉴权的行为断言，在本地 wrangler dev + 本地 D1 上跑。
 *
 * 写路径不能对线上做 parity（会污染生产数据），这里的期望值取自
 * server/internal/httpapi/forum_test.go 与 forum.go/auth.go 的行为约定。
 * 会话用 .dev.vars 里的假 AUTH_SECRET 自签——签发逻辑与 Go signSession 一致，
 * 这同时验证了 Worker 的 verifySession 能吃 Go 形状的 JWT。
 *
 * 用法：node scripts/check-forum-writes.mjs [worker地址] [AUTH_SECRET]
 *   秘钥默认取 .dev.vars 里的值。⚠️ 只能对本地跑，脚本会真的写库。
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const WORKER = process.argv[2] ?? "http://localhost:8790";
const WEB_ORIGIN = "https://dshfind.com";
if (!/localhost|127\.0\.0\.1/.test(WORKER)) {
  console.error("拒绝执行：这个脚本会写库，只允许对 localhost 跑");
  process.exit(1);
}

const SECRET =
  process.argv[3] ??
  /^AUTH_SECRET=(.+)$/m.exec(readFileSync("workers/api-edge/.dev.vars", "utf8"))?.[1]?.trim();
if (!SECRET) {
  console.error("拿不到 AUTH_SECRET（.dev.vars）");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
function signSession(user, { expOffsetSec = 7 * 24 * 3600, secret = SECRET } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ login: user.login, name: user.name ?? null, avatar: user.avatar ?? null, iat: now, exp: now + expOffsetSec }),
  );
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

const alice = signSession({ login: "alice", name: "Alice A", avatar: "https://example.com/a.png" });
const bob = signSession({ login: "bob", name: null, avatar: null });
const admin = signSession({ login: "hikariming", name: "Hikari", avatar: null }); // .dev.vars 的 FORUM_ADMIN_LOGINS
const expired = signSession({ login: "alice" }, { expOffsetSec: -60 });
const badSig = signSession({ login: "alice" }, { secret: "wrong-secret-0123456789abcdef0123456789" });

async function call(method, path, { token, body, origin = WEB_ORIGIN, headers = {} } = {}) {
  const h = { ...headers };
  if (origin !== null) h.Origin = origin;
  if (token) h.Cookie = `dshfind_session=${token}`;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(WORKER + path, {
    method,
    headers: h,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, text, json, headers: res.headers };
}

let bad = 0;
let n = 0;
function check(name, cond, detail) {
  n++;
  if (cond) console.log(`✓ ${name}`);
  else {
    bad++;
    console.error(`✗ ${name}${detail ? `：${detail}` : ""}`);
  }
}

// ── 鉴权基础 ──
{
  const me = await call("GET", "/auth/me", { token: alice });
  check("auth/me 有效会话返回用户", me.json?.user?.login === "alice" && me.json.user.name === "Alice A", me.text);
  const meExp = await call("GET", "/auth/me", { token: expired });
  check("auth/me 过期 token → user:null", meExp.json?.user === null, meExp.text);
  const meBad = await call("GET", "/auth/me", { token: badSig });
  check("auth/me 坏签名 → user:null", meBad.json?.user === null, meBad.text);

  const login = await call("GET", "/auth/github?return_to=/zh/bbs", { origin: null });
  const loc = login.headers.get("location") ?? "";
  check("auth/github 302 到 GitHub 授权页", login.status === 302 && loc.startsWith("https://github.com/login/oauth/authorize?"), `${login.status} ${loc.slice(0, 60)}`);
  check(
    "auth/github 参数按字母序且带 PKCE",
    /client_id=.*code_challenge=.*code_challenge_method=S256.*redirect_uri=.*state=/.test(loc),
    loc,
  );
  const cookies = login.headers.getSetCookie?.() ?? [];
  check("auth/github 设 3 个短时 cookie", cookies.length === 3 && cookies.every((c) => c.includes("Path=/auth/github") && c.includes("HttpOnly")), cookies.join(" | "));

  const evilReturn = await call("GET", "/auth/github?return_to=https://evil.example/x", { origin: null });
  const evilCookie = (evilReturn.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("dshfind_oauth_return_to="));
  check("恶意 return_to 被压成 /", evilCookie?.startsWith("dshfind_oauth_return_to=/;"), evilCookie);

  const logout = await call("POST", "/auth/logout?return_to=/en/plugins");
  const outCookies = logout.headers.getSetCookie?.() ?? [];
  check(
    "logout 303 + 清双 cookie（Domain=dshfind.com）",
    logout.status === 303 &&
      logout.headers.get("location") === "https://dshfind.com/en/plugins" &&
      outCookies.length === 2 &&
      outCookies.every((c) => c.includes("Domain=dshfind.com") && c.includes("Max-Age=0")),
    `${logout.status} ${logout.headers.get("location")} ${outCookies.join(" | ")}`,
  );
}

// ── 插件评论 ──
const PLUGIN = "bowenliang123/dsh-context"; // 本地 D1 里还没有它的讨论帖，测隐式建帖
{
  const before = await call("GET", `/v1/plugins/${PLUGIN}/discussion`, { origin: null });
  const beforeCount = before.json?.comments?.length ?? -1;

  const post = await call("POST", `/v1/plugins/${PLUGIN}/comments`, {
    token: alice,
    body: { body_md: "本地写测试：first comment", kind: "comment", locale: "zh" },
  });
  check("发评论 201", post.status === 201, `${post.status} ${post.text}`);
  check(
    "评论响应形状（id/body_md/kind/author/created_at）",
    Number.isInteger(post.json?.post?.id) &&
      post.json.post.body_md === "本地写测试：first comment" &&
      post.json.post.kind === "comment" &&
      post.json.post.author.login === "alice" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(post.json.post.created_at),
    post.text,
  );
  check("评论 201 没有 Cache-Control（Go 就没设）", post.headers.get("cache-control") === null, post.headers.get("cache-control"));
  check("评论响应带尾换行", post.text.endsWith("\n"));

  const after = await call("GET", `/v1/plugins/${PLUGIN}/discussion`, { origin: null });
  check("讨论区读回新评论（隐式建帖生效）", (after.json?.comments?.length ?? -1) === beforeCount + 1, after.text.slice(0, 200));
  check("讨论区 full_name 是规范写法", after.json?.full_name === PLUGIN);

  const issue = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: bob, body: { body_md: "报个问题", kind: "issue" } });
  check("issue 类评论 201 且 author.name 为 null", issue.status === 201 && issue.json.post.kind === "issue" && issue.json.post.author.name === null, issue.text);

  const noBody = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: { body_md: "   " } });
  check("空 body_md 400", noBody.status === 400 && noBody.json?.error?.message === "body_md is required", noBody.text);
  const tooBig = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: { body_md: "x".repeat(10 * 1024 + 1) } });
  check("超 10KB 400", tooBig.status === 400 && tooBig.json?.error?.message === "body_md exceeds 10KB", tooBig.text);
  const spam = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: { body_md: Array(6).fill("https://x.com").join(" ") } });
  check("链接过多 400", spam.status === 400 && spam.json?.error?.message === "too many links in one comment", spam.text);
  const badKind = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: { body_md: "x", kind: "rant" } });
  check("非法 kind 400", badKind.status === 400 && badKind.json?.error?.message === "kind must be comment or issue", badKind.text);
  const badJSON = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: "not json" });
  check("坏 JSON 400", badJSON.status === 400 && badJSON.json?.error?.message === "invalid JSON body", badJSON.text);
  const wrongType = await call("POST", `/v1/plugins/${PLUGIN}/comments`, { token: alice, body: '{"body_md":123}' });
  check("body_md 类型不符 400", wrongType.status === 400 && wrongType.json?.error?.message === "invalid JSON body", wrongType.text);
  const noPlugin = await call("POST", "/v1/plugins/nope/nope-x/comments", { token: alice, body: { body_md: "x" } });
  check("不存在的插件 404", noPlugin.status === 404, noPlugin.text);
}

// ── 投票 ──
{
  const up = await call("PUT", `/v1/plugins/${PLUGIN}/vote`, { token: alice, body: { verdict: "up" } });
  check("投 up 200 且计数含自己", up.status === 200 && up.json.up >= 1 && up.json.my_vote === "up", up.text);
  check("投票响应 private,no-store", up.headers.get("cache-control") === "private, no-store", up.headers.get("cache-control"));

  const change = await call("PUT", `/v1/plugins/${PLUGIN}/vote`, { token: alice, body: { verdict: "down" } });
  check("改票 down（up-1 down+1）", change.status === 200 && change.json.my_vote === "down" && change.json.down >= 1, change.text);

  const mine = await call("GET", `/v1/me/plugin-votes/${PLUGIN}`, { token: alice });
  check("查我的票 = down", mine.status === 200 && mine.json.my_vote === "down", mine.text);

  const clear = await call("DELETE", `/v1/plugins/${PLUGIN}/vote`, { token: alice });
  check("撤票 my_vote=null", clear.status === 200 && clear.json.my_vote === null, clear.text);
  const mine2 = await call("GET", `/v1/me/plugin-votes/${PLUGIN}`, { token: alice });
  check("撤票后查我的票 = null", mine2.json?.my_vote === null, mine2.text);

  const badVerdict = await call("PUT", `/v1/plugins/${PLUGIN}/vote`, { token: alice, body: { verdict: "meh" } });
  check("非法 verdict 400", badVerdict.status === 400 && badVerdict.json?.error?.message === "verdict must be up or down", badVerdict.text);
}

// ── BBS 发帖 / 回帖 / 删除 ──
let createdSlug = "";
{
  const t = await call("POST", "/v1/forum/threads", {
    token: alice,
    body: { board: "general", title: "本地写测试主题", body_md: "正文 **markdown**", locale: "zh" },
  });
  check("发主题帖 201", t.status === 201, `${t.status} ${t.text}`);
  createdSlug = t.json?.thread?.slug ?? "";
  check(
    "主题帖形状（slug 带随机后缀 / posts 空 / reply_count 0）",
    /-[0-9a-f]{8}$/.test(createdSlug) && t.json.thread.reply_count === 0 && Array.isArray(t.json.thread.posts) && t.json.thread.posts.length === 0 && t.json.thread.plugin_full_name === null,
    t.text,
  );
  check("发帖响应 private,no-store", t.headers.get("cache-control") === "private, no-store");

  const custom = await call("POST", "/v1/forum/threads", {
    token: alice,
    body: { board: "dev", title: "自定义 slug 测试", body_md: "x", slug: "My Custom Slug 123" },
  });
  check("自定义 slug 归一化且不加后缀", custom.status === 201 && custom.json.thread.slug === "my-custom-slug-123", custom.text);
  const conflict = await call("POST", "/v1/forum/threads", {
    token: bob,
    body: { board: "dev", title: "撞 slug", body_md: "x", slug: "my-custom-slug-123" },
  });
  check("slug 撞了自动加后缀", conflict.status === 201 && /^my-custom-slug-123-[0-9a-f]{8}$/.test(conflict.json.thread.slug), conflict.text);

  const zhTitle = await call("POST", "/v1/forum/threads", { token: alice, body: { board: "help", title: "纯中文标题测试", body_md: "x" } });
  check("纯中文标题落到 t-<后缀>", zhTitle.status === 201 && /^t-[0-9a-f]{8}$/.test(zhTitle.json.thread.slug), zhTitle.text);

  const badBoard = await call("POST", "/v1/forum/threads", { token: alice, body: { board: "plugin", title: "x", body_md: "x" } });
  check("board=plugin 不可手动发 400", badBoard.status === 400 && badBoard.json?.error?.message === "unknown board", badBoard.text);
  const longTitle = await call("POST", "/v1/forum/threads", { token: alice, body: { board: "general", title: "字".repeat(201), body_md: "x" } });
  check("标题 201 字 400", longTitle.status === 400 && longTitle.json?.error?.message === "title is too long", longTitle.text);
  const badSlug = await call("POST", "/v1/forum/threads", { token: alice, body: { board: "general", title: "x", body_md: "x", slug: "中文" } });
  check("纯中文自定义 slug 400", badSlug.status === 400 && badSlug.json?.error?.message === "slug must contain latin letters or digits", badSlug.text);

  const announceDenied = await call("POST", "/v1/forum/threads", { token: alice, body: { board: "announce", title: "x", body_md: "x" } });
  check("非管理员发公告 403", announceDenied.status === 403 && announceDenied.json?.error?.message === "only maintainers can post announcements", announceDenied.text);
  const announceOK = await call("POST", "/v1/forum/threads", { token: admin, body: { board: "announce", title: "公告测试", body_md: "x" } });
  check("管理员发公告 201", announceOK.status === 201, announceOK.text);

  const reply = await call("POST", `/v1/forum/threads/${createdSlug}/posts`, { token: bob, body: { body_md: "回帖测试" } });
  check("回帖 201", reply.status === 201 && reply.json.post.kind === "comment" && reply.json.post.author.login === "bob", reply.text);
  const detail = await call("GET", `/v1/forum/threads/${createdSlug}`, { origin: null });
  check("详情 reply_count+1 且含回帖", detail.json?.reply_count === 1 && detail.json?.posts?.length === 1, detail.text.slice(0, 200));
  const replyNone = await call("POST", "/v1/forum/threads/nope-slug/posts", { token: bob, body: { body_md: "x" } });
  check("回不存在的帖 404", replyNone.status === 404 && replyNone.json?.error?.message === "thread not found", replyNone.text);

  const postID = reply.json.post.id;
  const delOther = await call("DELETE", `/v1/forum/posts/${postID}`, { token: alice });
  check("删别人的回帖 404（不给探测）", delOther.status === 404, delOther.text);
  const delOwn = await call("DELETE", `/v1/forum/posts/${postID}`, { token: bob });
  check("删自己的回帖 204", delOwn.status === 204, delOwn.text);
  const delAgain = await call("DELETE", `/v1/forum/posts/${postID}`, { token: bob });
  check("重复删 404（软删除已生效）", delAgain.status === 404, delAgain.text);
  const badID = await call("DELETE", "/v1/forum/posts/abc", { token: bob });
  check("非法 post id 400", badID.status === 400 && badID.json?.error?.message === "invalid post id", badID.text);

  const delThreadOther = await call("DELETE", `/v1/forum/threads/${createdSlug}`, { token: bob });
  check("删别人的主题 404", delThreadOther.status === 404, delThreadOther.text);
  const delThread = await call("DELETE", `/v1/forum/threads/${createdSlug}`, { token: alice });
  check("删自己的主题 204", delThread.status === 204, delThread.text);
  const detailGone = await call("GET", `/v1/forum/threads/${createdSlug}`, { origin: null });
  check("删后详情 404", detailGone.status === 404, detailGone.text);

  // 插件讨论帖不许删（author 只是碰巧第一个评论的人）
  const disc = await call("GET", "/v1/plugins/xmanrui/dsh-im/discussion", { origin: null });
  check("（前置）讨论区可读", disc.status === 200);
  const delPluginThread = await call("DELETE", "/v1/forum/threads/plugin-xmanrui-dsh-im-34471c0d", { token: signSession({ login: "xmanrui" }) });
  check("插件讨论帖删除被拒 404", delPluginThread.status === 404, delPluginThread.text);
}

// 限流：功能测试用 .dev.vars 放宽了额度（否则测试自己会把桶打爆——Go 的
// 顺序就是限流在参数校验之前）。限流数学由 ratelimit.mjs 的直接导入单测覆盖；
// 429 的响应形状（Retry-After 头 + retry_after 字段 + credentialed CORS）在
// 默认额度下端到端验证过。

console.log(`\n${n - bad}/${n} 通过`);
process.exit(bad > 0 ? 1 : 0);

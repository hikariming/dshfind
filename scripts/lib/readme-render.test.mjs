import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_SOURCE_BYTES,
  makeSlugger,
  renderReadme,
  resolveImageSrc,
  resolveLinkHref,
  resolveRepoPath,
  truncateMarkdown,
} from "./readme-render.mjs";

const repo = "acme/widget";
const render = async (md, path) => (await renderReadme(md, { fullName: repo, path })).html;

test("相对路径按 README 所在目录解析，越出仓库根返回 null", () => {
  assert.equal(resolveRepoPath("./a.png"), "a.png");
  assert.equal(resolveRepoPath("img/a.png", "docs"), "docs/img/a.png");
  assert.equal(resolveRepoPath("/assets/a.png", "docs"), "assets/a.png");
  assert.equal(resolveRepoPath("../a.png", "docs"), "a.png");
  assert.equal(resolveRepoPath("../../a.png", "docs"), null);
});

test("图片：相对路径与 blob 页改写到 raw 域名，外站原样保留", () => {
  assert.equal(
    resolveImageSrc("./docs/hero.png", repo),
    "https://raw.githubusercontent.com/acme/widget/HEAD/docs/hero.png",
  );
  assert.equal(
    resolveImageSrc("https://github.com/acme/widget/blob/main/a.png?raw=true", repo),
    "https://raw.githubusercontent.com/acme/widget/main/a.png",
  );
  assert.equal(resolveImageSrc("https://img.shields.io/x.svg", repo), "https://img.shields.io/x.svg");
  assert.equal(
    resolveImageSrc("截图 1.png", repo),
    "https://raw.githubusercontent.com/acme/widget/HEAD/%E6%88%AA%E5%9B%BE%201.png",
  );
});

test("链接：相对路径改写到 GitHub blob 页并保留锚点，页内锚点与外链不动", () => {
  assert.equal(
    resolveLinkHref("docs/usage.md#install", repo),
    "https://github.com/acme/widget/blob/HEAD/docs/usage.md#install",
  );
  assert.equal(resolveLinkHref("#install", repo), "#install");
  assert.equal(resolveLinkHref("https://example.com", repo), "https://example.com");
  assert.equal(resolveLinkHref("mailto:a@b.c", repo), "mailto:a@b.c");
});

test("锚点生成：GitHub 口径，保留中文，重名追加序号", () => {
  const slug = makeSlugger();
  assert.equal(slug("Getting Started!"), "getting-started");
  assert.equal(slug("安装 & 使用"), "安装--使用");
  assert.equal(slug("Getting Started"), "getting-started-1");
});

test("截断在块边界并补齐未闭合的代码围栏", () => {
  const block = "段落".repeat(100);
  const md = `${"x\n\n".repeat(10)}\`\`\`js\n${`${block}\n\n`.repeat(200)}`;
  const { text, truncated } = truncateMarkdown(md);
  assert.ok(truncated);
  assert.ok(Buffer.byteLength(text) <= MAX_SOURCE_BYTES + 10);
  assert.equal((text.match(/^```/gm) ?? []).length % 2, 0);
  assert.ok(!text.includes("�"));
});

test("脚本、事件处理器、javascript: 链接、style 一律剥掉", async () => {
  const html = await render(
    [
      "<script>alert(1)</script>",
      '<img src="x.png" onerror="alert(1)">',
      '<a href="javascript:alert(1)">bad</a>',
      "[md bad](javascript:alert(1))",
      '<div style="position:fixed">x</div>',
      '<iframe src="https://evil.example"></iframe>',
    ].join("\n\n"),
  );
  assert.ok(!/<script|onerror|javascript:|style=|<iframe/i.test(html), html);
});

test("保留 README 常用的原始 HTML：居中头图、宽高、picture 深浅色", async () => {
  const html = await render(
    [
      '<p align="center"><img src="./logo.png" width="120" alt="logo"></p>',
      "<picture>",
      '  <source media="(prefers-color-scheme: dark)" srcset="./dark.png">',
      '  <img src="./light.png" alt="shot">',
      "</picture>",
      "<details><summary>More</summary>hidden</details>",
    ].join("\n"),
  );
  assert.match(html, /<p align="center">/);
  assert.match(html, /src="https:\/\/raw\.githubusercontent\.com\/acme\/widget\/HEAD\/logo\.png"/);
  assert.match(html, /width="120"/);
  assert.match(html, /srcset="https:\/\/raw\.githubusercontent\.com\/acme\/widget\/HEAD\/dark\.png"/);
  assert.match(html, /<details><summary>More<\/summary>/);
  assert.match(html, /loading="lazy"/);
});

test("标题降一级并生成锚点；页内跳转对上带前缀的 id", async () => {
  const html = await render("# Widget\n\n## Install\n\n[jump](#install)");
  assert.match(html, /<h2 id="readme-widget">Widget<\/h2>/);
  assert.match(html, /<h3 id="readme-install">Install<\/h3>/);
  assert.match(html, /href="#readme-install"/);
});

test("外链加 nofollow 新窗口；docs 目录下的 README 按其目录解析", async () => {
  const html = await render("[site](https://example.com) [guide](./guide.md)", "docs/README.md");
  assert.match(html, /href="https:\/\/example\.com" target="_blank" rel="nofollow ugc noopener"/);
  assert.match(html, /href="https:\/\/github\.com\/acme\/widget\/blob\/HEAD\/docs\/guide\.md"/);
});

test("GFM 表格与任务列表可用，代码块保留语言类名", async () => {
  const html = await render("| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n\n```ts\nconst a = 1;\n```");
  assert.match(html, /<table>/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /class="language-ts"/);
});

test("非 Markdown README 按纯文本转义展示；空文件标 empty", async () => {
  const rst = await renderReadme("Title\n=====\n\n<b>x</b>", { fullName: repo, path: "README.rst" });
  assert.equal(rst.html, '<pre class="readme-plain">Title\n=====\n\n&#60;b&#62;x&#60;/b&#62;</pre>');
  const empty = await renderReadme("  \n", { fullName: repo });
  assert.equal(empty.status, "empty");
});

test("作者写的 id/name 统一收进 readme- 命名空间；脚注往返链接对得上", async () => {
  const html = await render('<div id="main-content">x</div>\n\n<a name="Top"></a>\n\n[up](#top) foot[^1]\n\n[^1]: note');
  assert.match(html, /<div id="readme-main-content">/);
  assert.match(html, /<a name="readme-top">/);
  assert.match(html, /href="#readme-top"/);
  assert.match(html, /href="#readme-fn-1"/);
  assert.match(html, /<li id="readme-fn-1">/);
  assert.match(html, /id="readme-fnref-1"/);
  assert.match(html, /href="#readme-fnref-1"/);
  assert.ok(!html.includes("user-content-"), html);
});

test("GitHub 提示块：[!IMPORTANT] 引用块转成带标题的提示块，普通引用不动", async () => {
  const html = await render("> [!IMPORTANT]\n> Read **this** first.\n\n> [!tip] inline tip\n\n> plain quote");
  assert.match(html, /<div class="markdown-alert markdown-alert-important"><p class="markdown-alert-title">Important<\/p>/);
  assert.match(html, /<p>Read <strong>this<\/strong> first.<\/p>/);
  assert.match(html, /markdown-alert-tip"><p class="markdown-alert-title">Tip<\/p>\s*<p>inline tip<\/p>/);
  assert.match(html, /<blockquote>\s*<p>plain quote<\/p>/);
  assert.ok(!html.includes("[!"), html);
});

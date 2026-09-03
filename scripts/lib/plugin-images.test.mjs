import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  customSocialPreview,
  extractImageCandidates,
  imageKeyPrefix,
  isBadge,
  pickPluginImage,
  resolveImageUrl,
} from "./plugin-images.mjs";

test("isBadge：徽章服务域名一律排除", () => {
  assert.equal(isBadge("https://img.shields.io/badge/build-passing-green"), true);
  assert.equal(isBadge("https://badgen.net/npm/v/foo"), true);
  assert.equal(isBadge("https://api.star-history.com/svg?repos=a/b"), true);
  assert.equal(isBadge("https://codecov.io/gh/a/b/branch/main/graph/badge.svg"), true);
});

test("isBadge：GitHub Actions 的工作流徽章", () => {
  assert.equal(isBadge("https://github.com/a/b/actions/workflows/ci.yml/badge.svg"), true);
  assert.equal(isBadge("https://github.com/a/b/workflows/CI/badge.svg"), true);
});

test("isBadge：svg 一律算徽章，带查询串也认得出", () => {
  assert.equal(isBadge("https://example.com/diagram.svg"), true);
  assert.equal(isBadge("https://example.com/diagram.svg?v=2"), true);
  assert.equal(isBadge("assets/logo.SVG"), true);
});

test("isBadge：真截图不被误伤", () => {
  assert.equal(isBadge("https://raw.githubusercontent.com/a/b/HEAD/docs/demo.png"), false);
  assert.equal(isBadge("assets/hero.webp"), false);
  assert.equal(isBadge("https://github.com/user-attachments/assets/abc-123"), false);
});

test("isBadge：空值当徽章处理，调用方无需另外判空", () => {
  assert.equal(isBadge(""), true);
  assert.equal(isBadge(null), true);
});

test("extractImageCandidates：Markdown 与 <img> 混排时按出现顺序返回", () => {
  const md = [
    "# Title",
    "![first](a.png)",
    '<img src="b.png" alt="second" width="600">',
    "![third](c.png)",
  ].join("\n");
  const got = extractImageCandidates(md);
  assert.deepEqual(
    got.map((c) => [c.url, c.alt]),
    [
      ["a.png", "first"],
      ["b.png", "second"],
      ["c.png", "third"],
    ],
  );
});

test("extractImageCandidates：吃掉 <> 包裹与 title 串", () => {
  const got = extractImageCandidates('![x](<a b.png> "标题")');
  assert.equal(got.length, 1);
  assert.equal(got[0].url, "a");
});

test("extractImageCandidates：<img> 属性顺序颠倒也要认", () => {
  const got = extractImageCandidates('<img alt="演示" src="demo.gif">');
  assert.deepEqual(got.map((c) => [c.url, c.alt]), [["demo.gif", "演示"]]);
});

test("resolveImageUrl：相对路径拼回 raw 域名", () => {
  assert.equal(
    resolveImageUrl("assets/hero.png", "o/r"),
    "https://raw.githubusercontent.com/o/r/HEAD/assets/hero.png",
  );
  assert.equal(
    resolveImageUrl("./docs/images/x.png", "o/r"),
    "https://raw.githubusercontent.com/o/r/HEAD/docs/images/x.png",
  );
});

test("resolveImageUrl：workspace README 的相对路径以子包目录为基准", () => {
  assert.equal(
    resolveImageUrl("./preview.png", "o/r", "HEAD", "packages/dsh-a2a"),
    "https://raw.githubusercontent.com/o/r/HEAD/packages/dsh-a2a/preview.png",
  );
});

test("resolveImageUrl：README 里的根相对指向仓库根，不是站点根", () => {
  assert.equal(
    resolveImageUrl("/assets/x.png", "o/r"),
    "https://raw.githubusercontent.com/o/r/HEAD/assets/x.png",
  );
});

test("resolveImageUrl：../ 会被折叠掉", () => {
  assert.equal(
    resolveImageUrl("docs/../assets/x.png", "o/r"),
    "https://raw.githubusercontent.com/o/r/HEAD/assets/x.png",
  );
});

test("resolveImageUrl：blob / raw 页面换成 raw 域名并丢掉查询串", () => {
  assert.equal(
    resolveImageUrl("https://github.com/o/r/blob/main/a.png?raw=true", "o/r"),
    "https://raw.githubusercontent.com/o/r/main/a.png",
  );
  assert.equal(
    resolveImageUrl("https://github.com/o/r/raw/main/a.png", "o/r"),
    "https://raw.githubusercontent.com/o/r/main/a.png",
  );
});

test("resolveImageUrl：user-attachments 与外站原样保留", () => {
  const ua = "https://github.com/user-attachments/assets/abc-123";
  assert.equal(resolveImageUrl(ua, "o/r"), ua);
  const ext = "https://statics.example.com/logo.png";
  assert.equal(resolveImageUrl(ext, "o/r"), ext);
});

test("resolveImageUrl：协议相对补 https", () => {
  assert.equal(resolveImageUrl("//cdn.example.com/a.png", "o/r"), "https://cdn.example.com/a.png");
});

test("resolveImageUrl：不可下载的写法返回 null", () => {
  assert.equal(resolveImageUrl("data:image/png;base64,AAAA", "o/r"), null);
  assert.equal(resolveImageUrl("#anchor", "o/r"), null);
  assert.equal(resolveImageUrl("", "o/r"), null);
  assert.equal(resolveImageUrl("a.png", "not-a-repo"), null);
});

test("pickPluginImage：跳过徽章，取第一张真图", () => {
  const md = [
    "![build](https://img.shields.io/badge/build-passing-green)",
    "![npm](https://badgen.net/npm/v/foo)",
    "![](assets/hero.png)",
  ].join("\n");
  const got = pickPluginImage(md, "o/r");
  assert.equal(got.url, "https://raw.githubusercontent.com/o/r/HEAD/assets/hero.png");
});

test("pickPluginImage：alt 写明是截图时，能压过靠前的普通图", () => {
  const md = ["![](assets/a.png)", "![运行截图](assets/b.png)"].join("\n");
  const got = pickPluginImage(md, "o/r");
  assert.match(got.url, /b\.png$/);
});

test("pickPluginImage：同分时保留 README 顺序", () => {
  const md = ["![](assets/a.png)", "![](assets/b.png)"].join("\n");
  assert.match(pickPluginImage(md, "o/r").url, /a\.png$/);
});

test("pickPluginImage：logo 排在普通图之后", () => {
  const md = ["![logo](assets/logo.png)", "![](assets/shot.png)"].join("\n");
  assert.match(pickPluginImage(md, "o/r").url, /shot\.png$/);
});

test("pickPluginImage：只有 logo 时仍然给出来，而不是判定为无图", () => {
  const got = pickPluginImage("![logo](assets/logo.png)", "o/r");
  assert.match(got.url, /logo\.png$/);
});

test("pickPluginImage：全是徽章等于没有图", () => {
  const md = "![build](https://img.shields.io/badge/a-b-c)\n![x](https://codecov.io/y/badge.svg)";
  assert.equal(pickPluginImage(md, "o/r"), null);
});

test("pickPluginImage：空 README 返回 null", () => {
  assert.equal(pickPluginImage("", "o/r"), null);
  assert.equal(pickPluginImage(undefined, "o/r"), null);
});

test("pickPluginImage：保留原始写法供溯源", () => {
  const got = pickPluginImage("![演示](./assets/demo.gif)", "o/r");
  assert.equal(got.sourceUrl, "./assets/demo.gif");
  assert.equal(got.alt, "演示");
});

test("customSocialPreview：只认作者上传的那张", () => {
  const custom = '<meta property="og:image" content="https://repository-images.githubusercontent.com/1/2" />';
  assert.equal(
    customSocialPreview(custom),
    "https://repository-images.githubusercontent.com/1/2",
  );
});

test("customSocialPreview：GitHub 自动合成的不算", () => {
  const auto = '<meta property="og:image" content="https://opengraph.githubassets.com/abc/o/r" />';
  assert.equal(customSocialPreview(auto), null);
});

test("customSocialPreview：属性顺序颠倒也要认", () => {
  const html = '<meta content="https://repository-images.githubusercontent.com/9/9" property="og:image">';
  assert.equal(customSocialPreview(html), "https://repository-images.githubusercontent.com/9/9");
});

test("customSocialPreview：没有 og:image 返回 null", () => {
  assert.equal(customSocialPreview("<html></html>"), null);
  assert.equal(customSocialPreview(null), null);
});

test("imageKeyPrefix：斜杠换成双下划线", () => {
  assert.equal(imageKeyPrefix("owner/repo"), "p/owner__repo");
});

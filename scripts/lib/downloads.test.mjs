import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  MAX_POINT_MONTHS,
  MIRROR_MAX_POINT_MONTHS,
  downloadStatus,
  downloadWindows,
  downloadsPointUrl,
  encodePackage,
  maxPointMonths,
  sumAssetDownloads,
} from "./downloads.mjs";

test("maxPointMonths：npm 18 个月、镜像 12 个月，未知 host 取保守值", () => {
  assert.equal(maxPointMonths("api.npmjs.org"), MAX_POINT_MONTHS);
  assert.equal(maxPointMonths("registry.npmmirror.com"), MIRROR_MAX_POINT_MONTHS);
  assert.equal(maxPointMonths("registry.example.com"), MIRROR_MAX_POINT_MONTHS);
});

test("downloadWindows：镜像的 12 个月窗口不会超限（超了会 422，整段累计作废）", () => {
  const windows = downloadWindows("2018-09-14", "2026-08-24", MIRROR_MAX_POINT_MONTHS);
  assert.ok(windows.length >= 8);
  for (const w of windows) {
    const start = new Date(`${w.start}T00:00:00Z`);
    const limit = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 12, start.getUTCDate()));
    assert.ok(new Date(`${w.end}T00:00:00Z`) < limit, `${w.start}:${w.end} 超出镜像上限`);
  }
  assert.equal(windows.at(-1).end, "2026-08-24");
});

test("downloadWindows：不足 18 个月只切一个窗口", () => {
  assert.deepEqual(downloadWindows("2026-08-13", "2026-08-24"), [
    { start: "2026-08-13", end: "2026-08-24" },
  ]);
});

test("downloadWindows：同一天也给一个窗口（当天发布的包）", () => {
  assert.deepEqual(downloadWindows("2026-08-24", "2026-08-24"), [
    { start: "2026-08-24", end: "2026-08-24" },
  ]);
});

test("downloadWindows：超 18 个月分窗，首尾相接不重叠不留缝", () => {
  const windows = downloadWindows("2020-01-01", "2026-08-24");
  assert.equal(windows[0].start, "2020-01-01");
  assert.equal(windows.at(-1).end, "2026-08-24");
  for (let i = 1; i < windows.length; i++) {
    const prevEnd = new Date(`${windows[i - 1].end}T00:00:00Z`);
    const start = new Date(`${windows[i].start}T00:00:00Z`);
    assert.equal(start - prevEnd, 86_400_000, "下一窗必须从上一窗的次日开始");
  }
});

test("downloadWindows：每个窗口都不超过接口的 18 个月上限", () => {
  for (const w of downloadWindows("2018-03-15", "2026-08-24")) {
    const start = new Date(`${w.start}T00:00:00Z`);
    const limit = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 18, start.getUTCDate()));
    assert.ok(new Date(`${w.end}T00:00:00Z`) < limit, `${w.start}:${w.end} 超窗`);
  }
});

test("downloadWindows：起点晚于终点或日期脏时返回空（判「没测到」而非 0）", () => {
  assert.deepEqual(downloadWindows("2026-09-01", "2026-08-24"), []);
  assert.deepEqual(downloadWindows("not-a-date", "2026-08-24"), []);
  assert.deepEqual(downloadWindows(null, "2026-08-24"), []);
});

test("downloadWindows：吃完整 ISO 时间戳（包元数据里的 time.created 就是这个形态）", () => {
  assert.deepEqual(downloadWindows("2026-08-13T14:26:11.670Z", "2026-08-24T03:00:00.000Z"), [
    { start: "2026-08-13", end: "2026-08-24" },
  ]);
});

test("encodePackage：scoped 包名整体转义，斜杠不能漏", () => {
  assert.equal(encodePackage("@liustack/modlens"), "%40liustack%2Fmodlens");
  assert.equal(encodePackage("dsh-context"), "dsh-context");
});

test("downloadsPointUrl：两个 host 共用一套路径与编码", () => {
  const w = { start: "2026-01-01", end: "2026-08-24" };
  assert.equal(
    downloadsPointUrl("api.npmjs.org", "@liustack/modlens", w),
    "https://api.npmjs.org/downloads/point/2026-01-01:2026-08-24/%40liustack%2Fmodlens",
  );
  assert.equal(
    downloadsPointUrl("registry.npmmirror.com", "dshmarket", w),
    "https://registry.npmmirror.com/downloads/point/2026-01-01:2026-08-24/dshmarket",
  );
});

test("sumAssetDownloads：跨 release 累加所有资产", () => {
  assert.equal(
    sumAssetDownloads([
      { assets: [{ download_count: 10 }, { download_count: 5 }] },
      { assets: [{ download_count: 7 }] },
    ]),
    22,
  );
});

test("sumAssetDownloads：脏字段跳过而不是让整仓失败", () => {
  assert.equal(
    sumAssetDownloads([
      { assets: null },
      { assets: [{ download_count: "12" }, { download_count: -3 }, { download_count: 4.7 }] },
      null,
      { assets: [{}] },
    ]),
    4,
  );
});

test("sumAssetDownloads：没有 release 就是 0", () => {
  assert.equal(sumAssetDownloads([]), 0);
  assert.equal(sumAssetDownloads(undefined), 0);
});

test("downloadStatus：按拿到的数据定状态", () => {
  assert.equal(downloadStatus({ npmTotal: 100, releaseTotal: 5 }), "npm+release");
  assert.equal(downloadStatus({ npmTotal: 100, releaseTotal: 0 }), "npm");
  assert.equal(downloadStatus({ npmTotal: null, releaseTotal: 5 }), "release");
  assert.equal(downloadStatus({ npmTotal: 0, releaseTotal: 0 }), "npm");
});

test("downloadStatus：占名的仓库若有 Release 仍算 release，占名事实另记 note", () => {
  assert.equal(downloadStatus({ npmTotal: null, releaseTotal: 40442, nameTaken: true }), "release");
  assert.equal(downloadStatus({ npmTotal: null, releaseTotal: 0, nameTaken: true }), "name-taken");
});

test("downloadStatus：没发布 / 什么都没有", () => {
  assert.equal(downloadStatus({ npmTotal: null, releaseTotal: 0, unpublished: true }), "unpublished");
  assert.equal(downloadStatus({ npmTotal: null, releaseTotal: 0 }), "none");
});

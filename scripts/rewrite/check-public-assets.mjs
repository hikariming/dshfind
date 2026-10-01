#!/usr/bin/env node
// 迁移期护栏：apps/web/public 下的文件在正式域名上其实由**老站**提供——路由器只把已迁移的页面与
// /_astro/* 转给新站（scripts/lib/rewrite-router.mjs）。新站 public/ 里有、老站没有的文件，
// 在 workers.dev 上正常，到 dshfind.com 就 404（导航栏 logo 裂图就是这么来的）。
//
// 新增图片等请用资源导入（import x from "~/assets/..."，产物进 /_astro/）；非放 public/ 不可时，
// 老站 public/ 同步放一份。第 7 阶段新站直接挂域名后删掉本检查。
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const webPublic = path.join(root, 'apps/web/public');
// Cloudflare 静态资源层的配置文件，不对外提供
const IGNORE = new Set([
  '_headers',
  '_redirects',
  '.assetsignore',
  // 老站由 src/app/robots.ts 动态生成同一份内容（迁移期正式域名上仍由它提供，内容已逐字节核对）
  'robots.txt',
]);
// Next app 目录的文件约定（favicon.ico / icon.png / apple-icon.png）也由老站在根路径提供
const OLD_SITE_DIRS = [path.join(root, 'public'), path.join(root, 'src/app')];

function walk(dir, prefix = '') {
  return readdirSync(dir).flatMap((name) => {
    const rel = path.join(prefix, name);
    return statSync(path.join(dir, name)).isDirectory() ? walk(path.join(dir, name), rel) : [rel];
  });
}

const missing = walk(webPublic).filter(
  (rel) => !IGNORE.has(rel) && !OLD_SITE_DIRS.some((dir) => existsSync(path.join(dir, rel))),
);

if (missing.length) {
  console.error('以下文件只在新站 public/，经正式域名访问会 404（改用 ~/assets 资源导入，或在老站 public/ 同步一份）：');
  for (const rel of missing) console.error(`  /${rel}`);
  process.exit(1);
}
console.log(`public 资源检查通过：${walk(webPublic).length - IGNORE.size} 个文件老站均可提供`);

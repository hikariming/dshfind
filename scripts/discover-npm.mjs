/**
 * 从 npm 发现 GitHub topic 搜索漏掉的插件仓库，写入 scripts/data/npm-discovered.json。
 *
 *   pnpm discover:npm            # 抓 keywords:dsh-plugin / dsh-bundle，合并进名单
 *
 * 名单只增不减（仓库删了由 sync-plugins-db 抓取失败时跳过）；入库由 sync:db 的
 * 手动收录路径负责，每晚限量补新仓库。npm 搜索会 429，翻页间隔 1.5s + 退避重试。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NPM_KEYWORDS, collectRepos } from "./lib/npm-discovery.mjs";

const OUT = fileURLToPath(new URL("./data/npm-discovered.json", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchPage(keyword, from) {
  for (let t = 0; t < 8; t++) {
    try {
      const res = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=keywords:${keyword}&size=250&from=${from}`,
      );
      if (res.status === 429) {
        await sleep(20_000 * (t + 1));
        continue;
      }
      if (res.ok) return await res.json();
    } catch {
      /* 网络抖动，退避重试 */
    }
    await sleep(10_000);
  }
  throw new Error(`npm search ${keyword} from=${from} 重试耗尽`);
}

const found = new Map();
for (const keyword of NPM_KEYWORDS) {
  let from = 0;
  let total = Infinity;
  while (from < total) {
    const body = await searchPage(keyword, from);
    total = body.total; // 翻过 total 后接口仍会吐数据，必须自己停
    if (!body.objects?.length) break;
    for (const [k, v] of collectRepos(body.objects)) {
      const e = found.get(k);
      if (e) for (const p of v.packages) e.packages.includes(p) || e.packages.push(p);
      else found.set(k, v);
    }
    console.log(`${keyword}: ${Math.min(from + 250, total)}/${total}，累计 ${found.size} 个仓库`);
    from += 250;
    await sleep(1500);
  }
}

let prev = [];
try {
  prev = JSON.parse(readFileSync(OUT, "utf8")).repos;
} catch {
  /* 首次运行 */
}
const merged = new Map(prev.map((e) => [e.repo.toLowerCase(), e]));
let added = 0;
for (const [k, v] of found) {
  const e = merged.get(k);
  if (e) e.packages = [...new Set([...e.packages, ...v.packages])];
  else (merged.set(k, v), added++);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ repos: [...merged.values()] }, null, 1) + "\n");
console.log(`名单共 ${merged.size} 个仓库，本轮新增 ${added}`);

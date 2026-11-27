// 由 scripts/gen-plugins-real.mjs 生成——请勿手改。
// 首页三条 rail 的候选池，口径见生成脚本末尾的注释。
// 生成时间：2026-11-27T23:20:40.054Z
import type { HomePick } from "./types";

/** 编辑推荐候选池（有编辑短评的项目，置顶推荐排前）。首页 6 张一批，「换一批」在池内轮换。 */
export const editorPool: HomePick[] = [
  { fullName: "deepseek-ai/deepseek-harness", name: "deepseek-harness", owner: "deepseek-ai", stars: 288035, score: 100, isFeatured: true, isOfficial: true, isInsider: true },
  { fullName: "anywhere-labs/dsh-desktop", name: "dsh-desktop", owner: "anywhere-labs", stars: 36961, score: 76, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "ccch1mneyyy/dsh-Go", name: "dsh-Go", owner: "ccch1mneyyy", stars: 33290, score: null, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "zhu1090093659/dsh-web", name: "dsh-web", owner: "zhu1090093659", stars: 10668, score: 90, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "superdesigndev/treg", name: "treg", owner: "superdesigndev", stars: 9782, score: 77, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "ccch1mneyyy/dsh-TUI", name: "dsh-TUI", owner: "ccch1mneyyy", stars: 8360, score: 87, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "bowenliang123/dsh-context", name: "dsh-context", owner: "bowenliang123", stars: 5563, score: 91, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "omdsh-dev/DSH-better-sidebar", name: "DSH-better-sidebar", owner: "omdsh-dev", stars: 5361, score: 81, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "liustack/modlens", name: "modlens", owner: "liustack", stars: 5102, score: 80, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "xmanrui/dsh-im", name: "dsh-im", owner: "xmanrui", stars: 3842, score: 87, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "xiaobright/dsh-anchored-standard", name: "dsh-anchored-standard", owner: "xiaobright", stars: 3703, score: 78, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "Small-tailqwq/dsh-deep-whale", name: "dsh-deep-whale", owner: "Small-tailqwq", stars: 3156, score: 81, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "NanmiCoder/dsh-agent-teams", name: "dsh-agent-teams", owner: "NanmiCoder", stars: 3116, score: 91, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "liustack/modsearch", name: "modsearch", owner: "liustack", stars: 1049, score: 78, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "Anionex/dsh-vision-toolkit", name: "dsh-vision-toolkit", owner: "Anionex", stars: 949, score: 90, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "SeaOf0/dsh-redteam-model", name: "dsh-redteam-model", owner: "SeaOf0", stars: 928, score: 80, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "hust-open-atom-club/oh-dsh", name: "oh-dsh", owner: "hust-open-atom-club", stars: 324, score: 74, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "huiliyi37/dsh-tianshu-tui", name: "dsh-tianshu-tui", owner: "huiliyi37", stars: 317, score: 80, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "ZSeven-W/dsh-openpencil", name: "dsh-openpencil", owner: "ZSeven-W", stars: 269, score: 72, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "joeseesun/qiaomu-rss-dsh", name: "qiaomu-rss-dsh", owner: "joeseesun", stars: 126, score: null, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "joeseesun/qiaomu-reader-dsh", name: "qiaomu-reader-dsh", owner: "joeseesun", stars: 14, score: null, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "DM010727/dsh-cline", name: "dsh-cline", owner: "DM010727", stars: 10, score: null, isFeatured: true, isOfficial: false, isInsider: false },
  { fullName: "GanyuanRan/Aegis", name: "Aegis", owner: "GanyuanRan", stars: 1458, score: 71, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "ysr666/dsh-vision-router", name: "dsh-vision-router", owner: "ysr666", stars: 1305, score: 84, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "omdsh-dev/dsh-genui", name: "dsh-genui", owner: "omdsh-dev", stars: 1069, score: 79, isFeatured: false, isOfficial: false, isInsider: true },
  { fullName: "Electricitysheep/dsh-handbook", name: "dsh-handbook", owner: "Electricitysheep", stars: 1034, score: 66, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "csyangwen/dsh-memory-evolve", name: "dsh-memory-evolve", owner: "csyangwen", stars: 913, score: 75, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "Nagi-ovo/dsh-ads", name: "dsh-ads", owner: "Nagi-ovo", stars: 737, score: 61, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "FSMargoo/dsh-at-file", name: "dsh-at-file", owner: "FSMargoo", stars: 575, score: 69, isFeatured: false, isOfficial: false, isInsider: true },
  { fullName: "text2future/flowix", name: "flowix", owner: "text2future", stars: 521, score: 62, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "vlln/whale-girl", name: "whale-girl", owner: "vlln", stars: 418, score: 64, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "hikariming/dshfind", name: "dshfind", owner: "hikariming", stars: 411, score: 64, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "Nagi-ovo/dsh-visualize", name: "dsh-visualize", owner: "Nagi-ovo", stars: 350, score: 58, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "taxueseek/argo", name: "argo", owner: "taxueseek", stars: 286, score: 61, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "omdsh-dev/dsh-annotation", name: "dsh-annotation", owner: "omdsh-dev", stars: 173, score: 73, isFeatured: false, isOfficial: false, isInsider: true },
  { fullName: "Anionex/dsh-turn-rewind", name: "dsh-turn-rewind", owner: "Anionex", stars: 158, score: 74, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "pingfanfan/hello-dsh", name: "hello-dsh", owner: "pingfanfan", stars: 110, score: 54, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "JingbiaoMei/Tokdash", name: "Tokdash", owner: "JingbiaoMei", stars: 93, score: 58, isFeatured: false, isOfficial: false, isInsider: false },
  { fullName: "btspoony/mstar-harness", name: "mstar-harness", owner: "btspoony", stars: 74, score: 65, isFeatured: false, isOfficial: false, isInsider: true },
  { fullName: "hellodigua/dsh-share", name: "dsh-share", owner: "hellodigua", stars: 44, score: 67, isFeatured: true, isOfficial: false, isInsider: true },
  { fullName: "freehul/sgme", name: "sgme", owner: "freehul", stars: 18, score: null, isFeatured: false, isOfficial: false, isInsider: false },
];

/** 本周飙升：近 7 天 star 增长最快、且不在编辑推荐池里的项目。 */
export const trendingPicks: HomePick[] = [
  { fullName: "Ebony-Vinyl/dsh-our-free-model", name: "dsh-our-free-model", owner: "Ebony-Vinyl", stars: 89093, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 7027 },
  { fullName: "kunkundi/crossdesk", name: "crossdesk", owner: "kunkundi", stars: 8776, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 3416 },
  { fullName: "mvanhorn/last30days-skill", name: "last30days-skill", owner: "mvanhorn", stars: 76330, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 3255 },
  { fullName: "nexu-io/openmotion", name: "openmotion", owner: "nexu-io", stars: 16935, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 3042 },
  { fullName: "kingcharleslzy-ai/dsh-purge", name: "dsh-purge", owner: "kingcharleslzy-ai", stars: 13213, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 2227 },
  { fullName: "nexu-io/opengame", name: "opengame", owner: "nexu-io", stars: 2203, score: null, isFeatured: false, isOfficial: false, isInsider: false, starGrowth: 1414 },
];

/** 新面孔：最近收录且已确认是 DSH 插件的项目。 */
export const newcomerPicks: HomePick[] = [
  { fullName: "duduk233/miliastra-beyond-simulator", name: "miliastra-beyond-simulator", owner: "duduk233", stars: 107, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-27" },
  { fullName: "duduk233/dsh-plugin-miliastra-toolbox", name: "dsh-plugin-miliastra-toolbox", owner: "duduk233", stars: 38, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-27" },
  { fullName: "xiazeying/dsh-liang-rheostat", name: "dsh-liang-rheostat", owner: "xiazeying", stars: 6, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-27" },
  { fullName: "gyc0717/jiyixinghai", name: "jiyixinghai", owner: "gyc0717", stars: 3, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-27" },
  { fullName: "liyupi/memecub", name: "memecub", owner: "liyupi", stars: 39, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-26" },
  { fullName: "world-geniuses/dsh-plugin-shop-accounts", name: "dsh-plugin-shop-accounts", owner: "world-geniuses", stars: 33, score: null, isFeatured: false, isOfficial: false, isInsider: false, firstSeenAt: "2026-11-26" },
];

/** 首页每条 rail 一次展示几张——「换一批」按这个数切片。 */
export const RAIL_SIZE = 6;

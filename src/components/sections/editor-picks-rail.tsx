"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PickCardView, type PickCard } from "@/components/sections/pick-card";

/**
 * 「编辑推荐」那条 rail：一批 N 张，点「换一批」在候选池里往后翻。
 *
 * 整池随 HTML 一起发下来（约 50 张卡的展示字段，十几 KB），换一批纯客户端切片——
 * 不发请求、不调函数，首页仍然是构建期的静态产物。
 *
 * 批次初值必须是常量 0：渲染期取随机数会 hydration mismatch，而且 Google 抓到的
 * 应该始终是同一批（池内置顶推荐排在最前，所以第 0 批也是最硬的那批）。
 * 每天 gen:data 之后池子自己会变，首屏内容照样是新的。
 */
export function EditorPicksRail({
  cards,
  perBatch,
}: {
  cards: PickCard[];
  perBatch: number;
}) {
  const t = useTranslations("Home");
  const [batch, setBatch] = React.useState(0);

  const batches = Math.max(1, Math.ceil(cards.length / perBatch));
  // 取模回绕：池子除不尽 perBatch 时，最后一批不会缺角
  const shown = Array.from(
    { length: Math.min(perBatch, cards.length) },
    (_, i) => cards[(batch * perBatch + i) % cards.length],
  );

  return (
    <>
      {batches > 1 && (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => setBatch((b) => (b + 1) % batches)}
          >
            <RefreshCw className="size-3.5" />
            {t("shuffle")}
          </Button>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((pick, i) => (
          // key 用槽位而不是 fullName：换一批时复用同一批 DOM 节点，内容瞬间替换。
          // 用 fullName 会让 6 张卡整体重建，Reveal 跟着重新走一遍「进入视野再淡入」，
          // 明明人就盯着这块看，却要等一两秒才补齐。
          <PickCardView key={i} pick={pick} delay={40 * i} />
        ))}
      </div>
    </>
  );
}

import { useTranslations } from "next-intl";

import { gradeOf } from "@/lib/grade";

// 既有调用方从这里 import gradeOf；口径本身在 lib/grade（与 Astro 新站共用）
export { gradeOf };

const GRADE_STYLES: Record<string, string> = {
  S: "bg-gradient-brand text-white",
  A: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  B: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  C: "bg-muted text-muted-foreground",
};

/** 插件综合评分徽标；score 为 null（未评分）时不渲染。 */
export function ScoreBadge({ score }: { score: number | null }) {
  const t = useTranslations("Plugins");
  if (score == null) return null;
  const grade = gradeOf(score);
  return (
    <span
      title={t("score")}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${GRADE_STYLES[grade]}`}
    >
      {grade}
      <span className="opacity-80">{score}</span>
    </span>
  );
}

import * as React from "react";

/**
 * 首页各区块共用的标题行。
 *
 * 刻意不做「左边大标题 + 右边小段解释文字」那种分栏页头——右列只放真正的
 * 交互元素（这里是跳转按钮），说明文字统一压在标题正下方。
 */
export function SectionHeading({
  title,
  accent,
  description,
  action,
}: {
  title: string;
  /** 标题后面那个品牌色的数字或短词。 */
  accent?: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
          {accent != null && (
            <span className="ml-2 text-brand-600 dark:text-brand-400">
              {accent}
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

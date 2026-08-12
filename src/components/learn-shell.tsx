import { LearnNav } from "@/components/learn-nav";

/**
 * 学习页面通用外壳：左侧贴边章节目录（顶天立地）+ 右侧正文。
 */
export function LearnShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-border/60 bg-background/40 px-4 py-6 lg:block">
        <LearnNav />
      </aside>
      <div className="min-w-0 flex-1 px-6 py-8 sm:px-8 lg:px-10">
        {/* 宽屏下限制正文宽度并居中，保证阅读行长舒适 */}
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </div>
    </div>
  );
}

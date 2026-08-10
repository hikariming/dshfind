import { LearnShell } from "@/components/learn-shell";
import { LessonFooterNav } from "@/components/lesson-footer-nav";
import { cordisLessons } from "@/lib/mock";
import type { LearnChapterItem } from "@/lib/types";

const lessonItems: LearnChapterItem[] = cordisLessons.map((lesson) => ({
  id: lesson.id,
  label: lesson.title,
  href: `/learn/cordis/lessons/${lesson.slug}`,
  index: lesson.index,
  status: lesson.status,
}));

export default function CordisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LearnShell>
      {children}
      <LessonFooterNav items={lessonItems} />
    </LearnShell>
  );
}

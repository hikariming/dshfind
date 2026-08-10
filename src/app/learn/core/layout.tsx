import { LearnShell } from "@/components/learn-shell";
import { LessonFooterNav } from "@/components/lesson-footer-nav";
import { learnChapters } from "@/lib/nav";

export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LearnShell>
      {children}
      <LessonFooterNav items={learnChapters[2].items} />
    </LearnShell>
  );
}

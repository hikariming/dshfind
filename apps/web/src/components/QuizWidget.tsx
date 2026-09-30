import { useState } from "preact/hooks";

/**
 * 课后自测题（Preact 岛）。交互与样式照搬老站 src/components/quiz.tsx，
 * 区别只在文案由 props 传入（不依赖 next-intl），以及图标改为内联 SVG（不带 lucide 运行时）。
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  /** 正确答案在 options 中的下标 */
  answer: number;
  explanation?: string;
}

export interface QuizLabels {
  hint: string;
  submit: string;
  correct: string;
  wrong: string;
  retry: string;
  score: string;
}

const Check = ({ cls }: { cls: string }) => (
  <svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const Cross = ({ cls }: { cls: string }) => (
  <svg class={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </svg>
);

export default function Quiz({
  questions,
  title,
  labels,
}: {
  questions: QuizQuestion[];
  title: string;
  labels: QuizLabels;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const answered = questions.filter((_, i) => submitted[i]);
  const correctCount = answered.filter((q) => selected[questions.indexOf(q)] === q.answer).length;

  const resetQuestion = (qi: number) => {
    setSubmitted((s) => ({ ...s, [qi]: false }));
    setSelected((s) => {
      const next = { ...s };
      delete next[qi];
      return next;
    });
  };

  return (
    <div class="mt-12 rounded-xl border border-brand-500/30 bg-brand-500/5 p-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-2xl font-bold">{title}</h2>
        {answered.length > 0 && (
          <span
            class={`rounded-full px-3 py-1 text-sm font-medium ${
              correctCount === answered.length
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {labels.score}：{correctCount} / {answered.length}
          </span>
        )}
      </div>
      <p class="mt-2 text-sm text-muted-foreground">{labels.hint}</p>

      {questions.map((q, qi) => {
        const isSubmitted = !!submitted[qi];
        const sel = selected[qi];
        const isCorrect = sel === q.answer;
        return (
          <div key={qi} class="mt-6 rounded-xl border border-border/60 bg-background p-5">
            <div class="text-base font-medium">
              {qi + 1}. {q.question}
            </div>
            <div class="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                let cls = "border-border/60 hover:border-brand-500/40 hover:bg-brand-500/5";
                if (isSubmitted) {
                  if (oi === q.answer) cls = "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  else if (oi === sel) cls = "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-400";
                  else cls = "border-border/40 opacity-50";
                } else if (sel === oi) {
                  cls = "border-brand-500/60 bg-brand-500/10";
                }
                const badge =
                  isSubmitted && oi === q.answer
                    ? "bg-emerald-500 text-white"
                    : isSubmitted && oi === sel
                      ? "bg-rose-500 text-white"
                      : sel === oi
                        ? "bg-brand-500 text-white"
                        : "bg-muted text-muted-foreground";
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setSelected((s) => ({ ...s, [qi]: oi }))}
                    class={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-[15px] transition-colors ${cls} ${
                      isSubmitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span class={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badge}`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span class="flex-1">{opt}</span>
                    {isSubmitted && oi === q.answer && <Check cls="size-4 shrink-0 text-emerald-500" />}
                    {isSubmitted && oi === sel && oi !== q.answer && <Cross cls="size-4 shrink-0 text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {!isSubmitted ? (
              <button
                type="button"
                class="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-50"
                disabled={sel === undefined}
                onClick={() => setSubmitted((s) => ({ ...s, [qi]: true }))}
              >
                {labels.submit}
              </button>
            ) : (
              <div class="mt-4 flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm">
                {isCorrect ? (
                  <Check cls="mt-0.5 size-5 shrink-0 text-emerald-500" />
                ) : (
                  <Cross cls="mt-0.5 size-5 shrink-0 text-rose-500" />
                )}
                <div class="min-w-0">
                  <div
                    class={
                      isCorrect
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isCorrect ? labels.correct : `${labels.wrong} ${String.fromCharCode(65 + q.answer)}`}
                  </div>
                  {q.explanation && <p class="mt-1.5 leading-7 text-muted-foreground">{q.explanation}</p>}
                  <button
                    type="button"
                    class="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => resetQuestion(qi)}
                  >
                    ↺ {labels.retry}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import * as React from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** 正确答案在 options 中的下标 */
  answer: number;
  explanation?: string;
}

/**
 * 自测多选题：逐题作答，提交后显示对错与解析，可重新作答。
 * 用法（MDX）：<Quiz questions={[{ question, options, answer, explanation }]} />
 */
export function Quiz({
  questions,
  title = "自测题",
}: {
  questions: QuizQuestion[];
  title?: string;
}) {
  const [selected, setSelected] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState<Record<number, boolean>>({});

  const answered = questions.filter((_, i) => submitted[i]);
  const correctCount = answered.filter(
    (q, i) => selected[i] === q.answer
  ).length;

  const resetQuestion = (qi: number) => {
    setSubmitted((s) => ({ ...s, [qi]: false }));
    setSelected((s) => {
      const next = { ...s };
      delete next[qi];
      return next;
    });
  };

  return (
    <div className="mt-12 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {answered.length > 0 && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              correctCount === answered.length
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            当前得分：{correctCount} / {answered.length}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        完成作答后点击「提交答案」，可以查看对错与解析。
      </p>

      {questions.map((q, qi) => {
        const isSubmitted = !!submitted[qi];
        const sel = selected[qi];
        const isCorrect = sel === q.answer;

        return (
          <div
            key={qi}
            className="mt-6 rounded-xl border border-border/60 bg-background p-5"
          >
            <div className="text-base font-medium">
              {qi + 1}. {q.question}
            </div>

            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                let cls =
                  "border-border/60 hover:border-brand-500/40 hover:bg-brand-500/5";
                if (isSubmitted) {
                  if (oi === q.answer) {
                    cls =
                      "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  } else if (oi === sel) {
                    cls =
                      "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-400";
                  } else {
                    cls = "border-border/40 opacity-50";
                  }
                } else if (sel === oi) {
                  cls = "border-brand-500/60 bg-brand-500/10";
                }

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [qi]: oi }))
                    }
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-[15px] transition-colors ${cls} ${
                      isSubmitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isSubmitted && oi === q.answer
                          ? "bg-emerald-500 text-white"
                          : isSubmitted && oi === sel
                            ? "bg-rose-500 text-white"
                            : sel === oi
                              ? "bg-brand-500 text-white"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isSubmitted && oi === q.answer && (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    )}
                    {isSubmitted && oi === sel && oi !== q.answer && (
                      <XCircle className="size-4 shrink-0 text-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {!isSubmitted ? (
              <Button
                size="sm"
                className="mt-4 rounded-lg"
                disabled={sel === undefined}
                onClick={() => setSubmitted((s) => ({ ...s, [qi]: true }))}
              >
                提交答案
              </Button>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm">
                {isCorrect ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0">
                  <div
                    className={
                      isCorrect
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isCorrect ? "回答正确！" : `回答错误，正确答案是 ${String.fromCharCode(65 + q.answer)}`}
                  </div>
                  {q.explanation && (
                    <p className="mt-1.5 leading-7 text-muted-foreground">
                      {q.explanation}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    className="mt-2 text-muted-foreground"
                    onClick={() => resetQuestion(qi)}
                  >
                    <RotateCcw />
                    重新作答
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

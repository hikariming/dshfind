"use client";

import * as React from "react";

export interface TypePhrase {
  text: string;
  /** 高亮区间 [start, end)（字符下标），显示为品牌蓝色 + 微光 */
  accent?: [number, number];
}

interface TypewriterProps {
  phrases: TypePhrase[];
  /** 每打一个字耗时（首句需在 1 秒内完成，10 字 ≈ 90ms） */
  typingMs?: number;
  /** 删除一个字耗时 */
  deletingMs?: number;
  /** 整句停留时间 */
  holdMs?: number;
}

/**
 * 循环打字机：逐字打出 → 停留 → 逐字删除 → 下一条。
 */
export function Typewriter({
  phrases,
  typingMs = 90,
  deletingMs = 28,
  holdMs = 2000,
}: TypewriterProps) {
  const [idx, setIdx] = React.useState(0);
  const [text, setText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const phrase = phrases[idx % phrases.length];
  const [accentStart = 0, accentEnd = 0] = phrase.accent ?? [];

  React.useEffect(() => {
    const full = phrase.text;
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting) {
      if (text.length < full.length) {
        timer = setTimeout(
          () => setText(full.slice(0, text.length + 1)),
          typingMs
        );
      } else {
        // 整句打完后停留
        timer = setTimeout(() => setDeleting(true), holdMs);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, -1)), deletingMs);
      } else {
        setIdx((i) => (i + 1) % phrases.length);
        setDeleting(false);
      }
    }
    return () => clearTimeout(timer);
  }, [text, deleting, idx, phrase, typingMs, deletingMs, holdMs]);

  return (
    <span className="inline-block align-bottom">
      {text.slice(0, accentStart)}
      {accentEnd > accentStart && (
        <span className="text-brand-600 [text-shadow:0_0_18px_rgba(77,107,254,0.45)] dark:text-brand-300 dark:[text-shadow:0_0_18px_rgba(110,139,255,0.5)]">
          {text.slice(accentStart, accentEnd)}
        </span>
      )}
      {text.slice(accentEnd)}
      <span
        aria-hidden="true"
        className="caret-blink ml-0.5 inline-block h-[0.95em] w-[0.14em] translate-y-[0.08em] rounded-[1px] bg-brand-500 dark:bg-brand-300"
      />
    </span>
  );
}

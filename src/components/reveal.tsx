"use client";

import * as React from "react";

/**
 * 进入视野时淡入上浮。用 IntersectionObserver 而不是 scroll 监听——
 * scroll 事件每帧触发、在移动端会掉帧，观察器只在跨越阈值时回调一次。
 * 动效本身由 globals.css 的 [data-reveal] 定义，并已对 prefers-reduced-motion 关掉。
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** 同一区块内多个元素依次进入时的错开毫秒数。 */
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </div>
  );
}

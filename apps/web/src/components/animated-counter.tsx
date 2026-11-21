"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: string;
}) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const target = Number(value.replace(/[^0-9]/g, ""));
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * ease);
            const suffix = value.replace(/[0-9]/g, "");
            setDisplay(current.toLocaleString() + suffix);
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, started]);

  return (
    <div
      ref={ref}
      className="reveal scale-in"
      style={{ animationDelay: delay }}
    >
      <dt className="order-2 text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className="order-1 text-5xl font-display font-bold tracking-tight data-[tabular]">
        {display}
      </dd>
    </div>
  );
}

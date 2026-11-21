"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal — ajoute la classe `.visible` quand l'élément entre dans le
 * viewport. Utilise IntersectionObserver pour rester performant et ne pas
 * surcharger le thread principal.
 *
 * Usage:
 *   <ScrollReveal once threshold={0.12}>
 *     <div className="reveal">…</div>
 *   </ScrollReveal>
 */
export function ScrollReveal({
  children,
  once = true,
  threshold = 0.12,
  rootMargin = "0px 0px -10% 0px",
}: {
  children: React.ReactNode;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setHasBeenVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  const show = once ? visible || hasBeenVisible : visible;

  return (
    <div ref={ref} className={show ? "visible" : ""}>
      {children}
    </div>
  );
}

/**
 * StaggerScrollReveal — révèle ses enfants un par un avec un décalage.
 */
export function StaggerScrollReveal({
  children,
  once = true,
  threshold = 0.12,
  rootMargin = "0px 0px -12% 0px",
}: {
  children: React.ReactNode;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setHasBeenVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  const show = once ? visible || hasBeenVisible : visible;

  return (
    <div ref={ref} className={`stagger ${show ? "visible" : ""}`}>
      {children}
    </div>
  );
}

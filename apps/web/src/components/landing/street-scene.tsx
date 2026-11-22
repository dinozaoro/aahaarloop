"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Decorative shopfronts flanking the hero. Parallax follows the pointer and
 * the scroll through two custom properties on the wrapper; reduced motion,
 * touch layouts (CSS) and small screens keep the scene still.
 */
export function StreetScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    const write = () => {
      frame = 0;
      const x = (pointerX / Math.max(1, window.innerWidth)) * 2 - 1;
      const y = (pointerY / Math.max(1, window.innerHeight)) * 2 - 1;
      const scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
      el.style.setProperty("--sx", x.toFixed(3));
      el.style.setProperty("--sy", (y * 0.35 + scroll).toFixed(3));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(write);
    };
    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="street-scene" ref={ref} aria-hidden="true">
      <div className="street-ground" />
      <div className="shop shop-left">
        <div className="shop-body">
          <span className="shop-sign">Annapurna Kitchen</span>
          <span className="shop-awning" />
          <span className="shop-window">
            <Image
              src="/images/indian-table-current.jpg"
              alt=""
              fill
              draggable={false}
              sizes="(max-width: 900px) 44vw, 22vw"
            />
          </span>
          <span className="shop-counter">
            <i className="crate" />
            <i className="crate" />
            <i className="crate" />
          </span>
        </div>
      </div>
      <div className="shop shop-right">
        <div className="shop-body">
          <span className="shop-sign shop-sign-ink">Seva Community Kitchen</span>
          <span className="shop-awning shop-awning-alt" />
          <span className="shop-window">
            <Image
              src="/images/community-kitchen.jpg"
              alt=""
              fill
              draggable={false}
              sizes="(max-width: 900px) 44vw, 20vw"
            />
          </span>
          <span className="chalkboard">
            Surplus available
            <em>Collection time set by the donor</em>
          </span>
          <span className="handover-tag">
            <Check aria-hidden="true" size={14} />
            Confirmed on handover
          </span>
        </div>
      </div>
    </div>
  );
}

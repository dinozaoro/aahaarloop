"use client";

import { LogoMark } from "@/components/logo";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./nutrition.module.css";

const NAV_LINKS = [
  { label: "Products", href: "/browse" },
  { label: "AI Nutrition", href: "/dashboard" },
  { label: "Sustainability", href: "/donations" },
  { label: "Recipes", href: "/recipient/needs" },
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafThumb() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M38 9C21 9 11 17 11 30a9 9 0 0 0 9 9c13 0 21-10 18-30Z"
        fill="currentColor"
        opacity=".22"
      />
      <path
        d="M38 9C24 13 16 21 13 37M20 27l8-6m-4 12 6-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FarmThumb() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M5 25 24 10l19 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 23v16h28V23" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 39V28h8v11" stroke="currentColor" strokeWidth="2" />
      <path d="M8 15c4-1 6-4 7-7 1 3 3 6 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function NutritionLandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    function onPointerMove(event: PointerEvent) {
      if (frameRef.current !== null) {
        return;
      }
      const bounds = root!.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      frameRef.current = requestAnimationFrame(() => {
        root!.style.setProperty("--px", x.toFixed(3));
        root!.style.setProperty("--py", y.toFixed(3));
        frameRef.current = null;
      });
    }

    function onPointerLeave() {
      root!.style.setProperty("--px", "0");
      root!.style.setProperty("--py", "0");
    }

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);
    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!videoOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setVideoOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [videoOpen]);

  function closeVideo() {
    setVideoOpen(false);
  }

  return (
    <div ref={rootRef} data-nutrition className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.shell}>
          <section className={styles.hero} aria-label="Eat better, every day">
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.grain} aria-hidden="true" />

          <nav className={styles.nav} aria-label="Primary">
            <Link href="/" className={styles.brand} aria-label="Aahaarloop home">
              <LogoMark className={styles.brandMark} />
              <span>NATURE</span>
            </Link>
            <div className={styles.navLinks}>
              {NAV_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              ))}
            </div>
            <a href="mailto:hello@aahaarloop.org" className={styles.contact}>
              Contact Us
              <span className={styles.contactArrow}>
                <ArrowIcon />
              </span>
            </a>
          </nav>

          <div className={styles.headline} aria-label="Eat Better.">
            <span className={styles.eat}>Eat</span>
            <span className={styles.better}>Better.</span>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.floatLayer}>
              <div className={styles.bowlShadow} />
              <div className={styles.bowlLayer}>
                <Image
                  src="/images/tasty-bowl.webp"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 700px) 78vw, (max-width: 1100px) 52vw, 620px"
                  className={styles.bowl}
                />
              </div>
            </div>
          </div>

          <div className={`${styles.infoLabel} ${styles.infoOrganic}`}>
            <span className={styles.infoIcon}>
              <LeafThumb />
            </span>
            <span className={styles.infoText}>
              <strong>100%</strong>
              <strong>Organic</strong>
            </span>
          </div>

          <div className={`${styles.infoLabel} ${styles.infoFarm}`}>
            <span className={styles.infoIcon}>
              <FarmThumb />
            </span>
            <span className={styles.infoText}>
              <strong>Farm to</strong>
              <strong>Table</strong>
            </span>
          </div>

          <div className={styles.centerCopy}>
            <p>Discover a new way to experience organic food</p>
            <Link href="/browse" className={styles.primaryButton}>
              Get Started
              <span className={styles.buttonArrow}>
                <ArrowIcon />
              </span>
            </Link>
          </div>

          <div className={`${styles.bottomPanel} ${styles.panelLeft}`}>
            <div className={styles.socialRow}>
              <a href="mailto:hello@aahaarloop.org" aria-label="Email us" className={styles.iconLink}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m3 6 7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className={styles.iconLink}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M4.5 7.5H2.8V17h1.7V7.5ZM3.65 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM17 11.4c0-2.2-1.2-3.3-2.7-3.3-.9 0-1.6.5-1.9 1.2V7.5h-1.7V17h1.7v-4.9c0-1.2.5-1.9 1.5-1.9s1.4.7 1.4 1.9V17H17v-5.6Z" />
                </svg>
              </a>
            </div>
            <p>Nature helps people build healthier eating habits.</p>
          </div>

          <div className={`${styles.bottomPanel} ${styles.panelRight}`}>
            <div className={styles.stat}>
              <strong>12M</strong>
              <span>Healthy meals personalized</span>
            </div>
            <button
              type="button"
              className={styles.watch}
              onClick={() => setVideoOpen(true)}
              aria-haspopup="dialog"
            >
              <span className={styles.playRing}>
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7 4.8v10.4L15.5 10 7 4.8Z" />
                </svg>
              </span>
              Watch Video
            </button>
            <Link href="/dashboard" className={styles.explore}>
              Explore Nutrition <ArrowIcon />
            </Link>
          </div>
          </section>
        </div>
      </div>

      {videoOpen ? (
        <div
          className={styles.videoOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Video tour"
          onClick={closeVideo}
        >
          <div className={styles.videoPanel} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.videoClose}
              onClick={closeVideo}
              aria-label="Close video tour"
            >
              ×
            </button>
            <span className={styles.videoBadge}>NATURE · FILM 01</span>
            <h2>From the farm, to your table.</h2>
            <p>
              The full film is in production. Meanwhile, explore how Aahaarloop
              matches surplus food with the people who need it most.
            </p>
            <Link href="/browse" className={styles.primaryButton}>
              Explore the platform <span className={styles.buttonArrow}><ArrowIcon /></span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

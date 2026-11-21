# Performance and bundle audit

Baseline measured on 2026-11-21 against a production build of `apps/web`
(Next.js 16.4.6, Turbopack), served with `next start`. Re-run the same steps after
any UI or dependency change and update the numbers below.

## How to reproduce

```sh
pnpm --filter @aahaarloop/web build
cd apps/web && npx next start -p 3100
npx lighthouse@12 http://localhost:3100/ \
  --only-categories=performance --output=json \
  --output-path=/tmp/lighthouse.json \
  --chrome-flags='--headless=new --no-sandbox --disable-gpu'
```

Bundle sizes come from `.next/static/chunks` (sum of `*.js` and `*.css`, both raw
and gzip -9).

## Measured baseline

| Metric                 | Value  | Target   | Status     |
| ---------------------- | ------ | -------- | ---------- |
| Lighthouse performance | 74     | ≥ 90     | Needs work |
| FCP                    | 1.0 s  | ≤ 1.8 s  | Pass       |
| LCP                    | 3.2 s  | ≤ 2.5 s  | Needs work |
| TBT                    | 790 ms | ≤ 200 ms | Needs work |
| CLS                    | 0      | ≤ 0.1    | Pass       |
| Speed index            | 1.0 s  | ≤ 3.4 s  | Pass       |

The dominant cost is main-thread work after first paint (TBT), not layout shift
or network latency.

## Bundle budget

| Asset                   | Raw       | gzip      | Budget (gzip)   |
| ----------------------- | --------- | --------- | --------------- |
| All JS chunks           | 886.9 KiB | 272.2 KiB | ≤ 300 KiB total |
| All CSS                 | 83.7 KiB  | 17.8 KiB  | ≤ 25 KiB total  |
| Largest single JS chunk | 223.7 KiB | 70.2 KiB  | ≤ 80 KiB        |

The three largest chunks (70.2, 43.2 and 38.6 KiB gzip) account for most of the
JavaScript. A new route or library that pushes the totals past the budget must
be split or lazy-loaded before merging.

## Actions, in priority order

1. **Split the heavy chunks.** Identify which route owns the 70/43/38 KiB
   chunks with a bundle analyser and dynamic-import the admin and impact views
   so `/` and `/browse` never download them.
2. **Lazy-load the map.** The interactive Leaflet map (#42) is not implemented
   yet. It must be `next/dynamic`-imported with `ssr: false`, never part of the
   initial bundle. Add this to the #42 acceptance criteria.
3. **Cut TBT.** Defer non-critical client components (notification badges,
   offline status, install prompt) until after the first interaction where
   possible; keep the first screen free of hydration-heavy trees.
4. **Fonts.** `Inter` is loaded through `next/font` with `display: swap`, so it
   does not block rendering. The current design handoff is replacing it with a
   distinct display font — keep `swap` and `preload` only the weights actually
   used.
5. **Images.** The landing hero already uses a 42 KiB WebP. Keep images in
   WebP/AVIF with explicit dimensions to protect the CLS score.
6. **Caching.** The service worker (#54) now precaches the shell and serves
   assets cache-first, which helps repeat visits; Lighthouse above is a cold
   load.

## What is not covered here

- Real-device profiling and field data (CrUX) — no production traffic yet.
- Per-route bundles: this Next/Turbopack build does not emit a per-route build
  manifest, so the budget is an aggregate across all chunks. Break it down once
  a per-route analyser is in place.
- The map lazy-load target cannot be verified until #42 exists.

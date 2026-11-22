# Artiko → AahaarLoop — Reverse-engineering report & redesign direction

Research phase, 2026-11-22. Branch: `feat/aahaar-bazaar-spatial-redesign`. No code changed yet.

## 1. What was inspected (and what was not)

**Artiko organization** (`github.com/artiko-songomby-d1`) has 3 repos:

| Repo | Stack | Role |
|---|---|---|
| `artiko-api` | FastAPI | Backend — **not inspected** (out of scope by instruction) |
| `artiko-web` | Next.js + client KANTO SPA | **Frontend — the reference** |
| `artiko-mobile` | Kotlin | Android app |

**Inspected in `artiko-web` (source-level):**

- Full KANTO file tree (354 files under `src/kanto`).
- Design system: `src/kanto/styles/tokens.css`, `fonts.css`, `global.css`.
- Home scene: `features/home/HomePage.module.css`, `home-content.ts`.
- Immersive chrome: `features/gallery/GalleryChrome.module.css`.
- Flat-page layout: `components/hall-layout/HallLayout.module.css`.
- Opening (pre-paint intro): `features/opening/Opening.module.css`.
- Ceremony & ending: `features/hanging/hanging-content.ts`, `features/visit/EndOfVisitPage.tsx`.
- Motion system: `lib/motion/gsap.ts`, `motion-prefs.ts`.
- Routing: `app/routes.ts`.
- Docs: `README.md`, `docs/kanto/MVP-DEMO.md` (full demo walkthrough), `docs/task.md` (API audit).

**Not inspected (stated honestly):**

- **No rendered pixels.** No public demo URL exists in the repos, and this environment has no browser tool (only Figma MCP). Descriptions of motion and layout come from the code and docs, not from watching the running app.
- Licensed display fonts (`New Icon Serif`, `Helvetica Now Display`) are gitignored; OFL fallbacks were inspected instead.
- The Figma source files (nodes `12:88`, `114:3877`) referenced by tokens were not accessible.
- `artiko-mobile` UI details: not needed for the web redesign.

## 2. Artiko's design language (extracted principles)

### 2.1 Spatial composition

- **The interface is a scene, not a document.** `html, body { overflow: hidden }` — the museum never page-scrolls. Home is a fixed full-viewport "Salon": framed exhibits hung at **absolute scene coordinates** on a 1440×900 stage, scaled by `--u: min(100vw / 1440, 100dvh / 900)`. Mobile gets its own 390×844 stage.
- The hanging is deliberately **asymmetric and varied** (different sizes/heights) so it reads as a salon wall, not a grid.
- **Two-tier experience**: immersive for *discovery* (museum rooms, walked laterally via wheel/drag/arrows/keys), conventional scroll pages for *tasks* (wizard, admin, lists — `HallLayout`: sticky nav, max-width 1440, two-column split).
- UI chrome **floats over the scene**: top bar (logo / current room / progress dots), bottom bar (room tabs / artwork counter / actions), glass pills with `backdrop-filter: blur(7px)`.
- Mobile: bottom sheets replace wall text and the room menu.

### 2.2 Navigation

- Room tabs + progress dots (6px → 18px active), "Plan du musée" overlay opened from the room label, `Retour à la salle` button that fades in when a work is in focus, end-of-visit link on the last work.
- Route structure is a small client router with path builders (`routes.ts`); every screen composes URLs via `paths.*`.

### 2.3 Typography & hierarchy

- Display serif, uppercase, `line-height: 0.88`, `nowrap` hero headline at 92 stage-units.
- **Condensed sans (Bebas Neue) for wall titles** — big, uppercase, poster-like.
- **Serif italic (Averia Serif Libre) for subtitles and cartels** — museum-label voice.
- Eyebrows: 11px bold uppercase, `letter-spacing: 0.16em`.
- Body: 13–15px, `line-height: 1.5`, ink at 62% opacity for secondary text.
- One licensed pair (New Icon Serif + Helvetica Now Display) with OFL fallbacks (Instrument Serif + Instrument Sans).

### 2.4 Color & material

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#0e1116` | Text |
| `--color-paper` | `#f0ece4` | Light surfaces |
| `--color-gold` | `#c8a174` | Focus ring, end link |
| `--color-wine` / `--color-accent` | `#67271f` / `#7e2a20` | Headline accent, labels, errors |
| `--color-wall-ivory` | `#fefefe` | Home wall |
| `--color-gallery-black` | `#000000` | Immersive rooms |

- **Materials**: paper-grain SVG overlay; radial wall gradients (red/stone/ochre/indigo) with a warm `--spot-light`; dark-wood frame gradients; warm radial scrim; glass pills; contact shadows.
- Semantic tints for states (error/success/warning + 7–16% tints).

### 2.5 Motion

- **Opening works before JS**: letter-by-letter wordmark rise (130ms apart, pure CSS) + hairline progress creep; real progress takes over when the bundle runs. Museum boot shows a plain black wall instead.
- Intro variants (`hanging` default, `light`, `focus`) and transition variants (`gallery-black`, `through-frame`, `curtain`) tested in a dev motion lab; production uses defaults.
- GSAP + `SplitText` for wall text: line masks, `wall-text-in` 560ms staggered 70ms per child; wall swap = 240ms fade-out + staggered rise-in.
- Hover: 150–200ms `cubic-bezier(0.22, 1, 0.36, 1)`; cartels lift −4px with a raised shadow.
- **Reduced motion**: global kill switch (`animation/transition-duration: 0.01ms`), choreography replaced by fades, opening letters simply present.
- Nothing appears before its animation: `[data-motion='pending'] [data-reveal] { visibility: hidden }`.

### 2.6 Ceremonial moments (the "feel like an environment" glue)

- **Enter the museum**: home exit → blackout → first room lights up.
- **Hanging ceremony**: after submitting a work, a staged scene (plinth/rail/label chosen per work) with copy that follows real status ("déposée" vs "accrochée"), a cartel with the deposit number, and three exits (primary/secondary/tertiary).
- **End of visit**: big figures from the session log (rooms, works, minutes) + two actions.
- Ambient sound offered (off by default).

## 3. AahaarLoop current state (inventory summary)

- **Monorepo**: pnpm + turborepo. `apps/web` (Next 16.4.6, React 19, Tailwind 4 CSS-first — no config file, theme in `@theme inline` in `globals.css`), `apps/mobile` (Expo), `packages/*` (shared, database/Drizzle, matching, food-recognition).
- **UI kit**: shadcn-style primitives on radix (`src/components/ui/*`), lucide icons, sonner toasts, `cn()` helper.
- **No animation library**; two dead helpers (`scroll-reveal.tsx`, `animated-counter.tsx`) whose CSS classes don't exist.
- **Five global stylesheets**: `globals.css` (tokens), `landing.css` (301 ln), `workspace.css` (452 ln), `account.css`, `readable-text.css` (global font-size override — a11y hack, keep).
- **Three competing color systems**: tokens (`--primary #DF211B`) vs. raw hexes (`#E12620`, `#FFC928`, `#B51757`…) vs. stale brand green `#063a2a` in manifest/offline/install-prompt.
- **Fonts**: DM Sans (body) + Instrument Serif (display); workspace CSS still hardcodes Georgia.
- **Landing** (`page.tsx` + `landing.css`): centered serif hero, yellow photo block with 2 floating cards, ribbon, editorial block, 3-step list, dark maroon ecosystem block, impact heading only, red CTA + QR.
- **Workspace**: `.workspace-shell` top nav; routes — dashboard, browse(+detail), donations (list/new×3/[id]), claims, impact, notifications, favorites, profile, settings, recipient/*, volunteer/*, auth (two-column `account-layout`), onboarding, install, admin/*.
- **Data**: two systems — in-memory preview store (what pages render; resets on restart, org ids from unset env → empty states everywhere) and a real API/Drizzle layer partially wired (claims/upload/pickups not connected; UI says "preview/unavailable").
- **A11y baseline**: skip link, landmarks, single h1, focus-visible rings, reduced-motion rules, `docs/accessibility.md` (axe not run in CI).
- **Dead code**: `/design` + `/nutrition` (redirected), `coming-soon`, `papicon`, `tasty-bowl.webp`, stray logo png.
- **Assets**: 3 food PNGs + 3 photos + QR; no SVG illustrations; `foodPhoto()` heuristic duplicated in 5 files.
- Mobile duplicates web tokens by hand in `apps/mobile/src/theme.ts` (out of scope for this redesign, but note the drift).

## 4. Design direction: "Aahaar ka Bazaar" — a street, not a corridor

We keep Artiko's **principles** (scene over document, two-tier immersive/functional, floating chrome, ceremonial moments, pre-paint motion, reduced-motion parity) and replace its **content**: a museum → a contemporary Indian food street at golden hour. No museum wood frames, no art-world voice, no copied assets.

### 4.1 Metaphor mapping

| Artiko | AahaarLoop |
|---|---|
| Museum corridor / rooms | The bazaar street: shopfronts & stalls |
| Wall label (cartel) | Shop signboard / stall chalkboard carrying live donation info |
| Room tabs + progress dots | Shop stops along the street |
| Plan du musée | The street map (ecosystem directory) |
| "Entrer dans le musée" | "Step into the bazaar" |
| Hanging ceremony | **Handover moment**: food collected → warm confirmation at the counter |
| End-of-visit figures | **Daily bazaar receipt**: meals rescued, kg, minutes, organisations |
| Loading screen | Shutter-up reveal |

### 4.2 Visual system

- **Keep the brand core** (it already reads Indian-street without cliché): action red `#DF211B`, marigold `#FFC928`, cream `#FFF7F0`, ink `#2C1618`. Extend tokens, don't rebrand.
- **Add two tokens only**: a warm night surface (`#171110` + warm scrim) for the immersive landing hero and impact moments, and a glass token (`backdrop-filter: blur(7px)` on translucent ink) for floating chrome — Artiko's most transferable device.
- **Typography**: keep DM Sans + Instrument Serif. One optional addition: a condensed OFL face (e.g. Bebas Neue) **only for signboards** — if we skip it, signboards use Instrument Serif uppercase tight; decide during build (skip unless it earns its file).
- **Signboards as structure**: the eyebrow labels, status chips and section titles become signboard/plaque treatments (uppercase, tracked, on a painted board) — functional, not decorative.
- **Avoid the tells**: no cream+terracotta single-word-italic hero (current landing is already near this — the scene must carry the page), no identical rounded-card grids, no gradient washes, no ALL-CAPS eyebrow above *every* heading.

### 4.3 A. Landing page architecture

1. **Hero — the street scene.** A layered CSS/DOM scene (no WebGL, no three.js): 3–4 depth layers of shopfronts/signboards/crates with parallax on pointer + scroll (`depth` values like Artiko's 0.45–1), headline set in the scene, CTAs (Android APK + web app) as painted boards. Mobile: own 390-wide stage, scene collapses to 2 layers.
2. **Problem & mission** — editorial block (keep current strength, restyle to signboard voice).
3. **How it works** — a street walk: 3 numbered stops *along one street* (numbering justified: it's a sequence), each stop a stall with a mini live-UI vignette (replacing current step-preview cards).
4. **Two pathways** — donor counter vs. recipient gate, side by side as two shopfronts.
5. **The ecosystem street map** — flat directory/map view (the "plan du musée" analogue) linking roles.
6. **Impact** — big figures, small captions (Artiko end-of-visit pattern), on the warm night surface.
7. **CTA** — keep red block + QR (it works).

**Motion (one orchestrated moment + quiet rest):** pre-paint CSS shutter/letter reveal on load (works before JS), hero parallax, single scroll reveal per section, 150–200ms hovers. No GSAP — CSS + a few lines of rAF JS; global reduced-motion kill switch already exists in `globals.css`.

### 4.4 B. Web application architecture

Practical first: **no virtual street to cross for an action.** The bazaar lives in framing, not in navigation.

- **Shell**: keep the existing top nav; restyle as a hanging signboard (painted board + rope motif is enough — no animated ropes).
- **Dashboard**: keep the stat strip and offer rows; bazaar treatment of `.stat-strip` / `.panel` (plaque headers), no card-grid inflation.
- **Browse/detail**: donation cards become stall cards (signboard header, food photo, deadline as a chalk line); detail page keeps its facts grid + claim panel.
- **Create donation**: keep the 3-step flow and drafts untouched — only visual skin. Speed is the feature.
- **Lifecycle** (`/donations/[id]` 5-step bar): restyle as the food's journey along the street — same semantics, clearer states.
- **Empty states**: closed-shutter illustrations + one action sentence ("This stall is closed — no donations yet. Post one.").
- **Impact page**: the "bazaar receipt" aesthetic — ledger lines, big serif figures.
- **Handover moment**: when a claim/checkout completes, reuse the ceremony pattern: short, skippable, respects reduced motion, always shows the next action.
- **Auth**: keep two-column `account-layout`; swap the peach panel for a street-photo/story panel.

### 4.5 Reuse / replace / redesign

| | What |
|---|---|
| **Reuse** | Route structure, data layer + API (untouched), shadcn primitives, `cn()`, tokens core (extended), DM Sans/Instrument Serif, `PageChrome`/skip link/focus rings, reduced-motion global rule, `readable-text.css`, `AsyncState`, workspace layout skeleton, QR/install flow, PWA |
| **Replace** | `landing.css` (→ street scene), `workspace.css` visual classes (→ plaque/signboard treatment), stale green (`manifest`, `offline.html`, `install-prompt`, `service-worker-status`) → token red, hardcoded hexes → tokens, Georgia → DM Sans |
| **Redesign** | Hero, section rhythm, empty states, donation lifecycle bar, impact page, auth story panel, handover moment |
| **Delete** | `/design`+`/nutrition` dead routes & CSS, `coming-soon`, `papicon`, unused `scroll-reveal`/`animated-counter` (or wire them properly), `tasty-bowl.webp`, duplicate logo png, `foodPhoto()` duplication (one helper) |

### 4.6 UX guardrails (from the brief, made testable)

- Donation creation ≤ 3 steps, draft survives reload (already true — preserve).
- Every screen: one primary action, visible without scrolling on mobile.
- Reduced motion: all motion behind the global kill switch; ceremonies become instant fades.
- Contrast ≥ 4.5:1 on signboard text (ink on painted boards is the risky one — check marigold-on-red).
- Touch targets ≥ 44px (existing glass buttons already are).
- No action requires the immersive hero scene to be visible or animated.

## 5. Implementation plan (after approval)

1. **Tokens & cleanup** — unify the 3 color systems into `globals.css` tokens, fix stale green, delete dead code. (Foundation; no visual change beyond consistency.)
2. **Landing street scene** — hero + section rhythm + motion, mobile stage first (mobile-first), a11y pass.
3. **Workspace theming** — shell, dashboard, browse, detail, lifecycle, empty states (top-down, screen by screen).
4. **Moments & polish** — impact receipt, handover ceremony, auth panel, reduced-motion + contrast audit, run `pnpm test` (29 test files guard links/PWA/store).

Each step lands as its own conventional commit on this branch.

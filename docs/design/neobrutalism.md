# Neobrutalist redesign — direction

Branch: `feat/neobrutalist-redesign`. This branch starts a new visual identity for
both clients. It does **not** reproduce the Figma file and does **not** reuse the
current ivory/red styling.

## Idea

Loud, honest, physical. Food rescue is operational work: crates, labels, routes,
deadlines. The interface should feel like printed signage and shipping labels,
not a soft lifestyle brand.

Rules:

- One ink colour for every border and every shadow.
- Hard offset shadows only. No blur, no gradients, no glass.
- Saturated accents on a paper background, one accent per surface.
- Chunky type, tight leading, uppercase labels.
- Motion is short and mechanical: things move, they do not float.

## Tokens

| Token | Value |
| --- | --- |
| `paper` | `#FFFDF5` |
| `ink` | `#111111` |
| `muted` | `#5A5A5A` |
| `yellow` | `#FFD43B` |
| `pink` | `#FF6B9A` |
| `cyan` | `#4DD4F7` |
| `lime` | `#C6F35A` |
| `orange` | `#FF8A3D` |
| `violet` | `#A78BFA` |
| `danger` | `#FF4D3D` |

- Border: `3px solid ink` (2px on dense mobile rows).
- Shadow: `6px 6px 0 ink` desktop, `4px 4px 0 ink` mobile.
- Radius: `0` for panels, `4px` for inputs and badges, `999px` only for pills.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Type: `Archivo Black` for display, `Space Grotesk` for UI and body.
- Scale: 56/64 display, 32/38 page title, 22/28 section, 16/24 body, 12/16 label.

## Components

- **Button**: solid accent, 3px ink border, hard shadow. Press moves the button
  into its shadow (translate 3px, shadow 0) in 90ms.
- **Card**: paper or accent surface, 3px border, hard shadow. No nested shadows.
- **Input**: white, 3px border, label above in uppercase. Focus adds the hard
  shadow instead of a glow.
- **Badge**: solid accent, ink border, uppercase, 11px, letter-spaced.
- **Nav**: thick bottom border; active item is a solid accent block, not a
  coloured text label.
- **Tables and lists**: alternating paper/white rows separated by 2px ink lines.
- **Empty states**: a large label-like panel with one action, no illustration.

## Motion

- 90–160ms, `ease-out`, no bounce except a single 1.02 scale on success.
- Press feedback is translation, not opacity.
- Page transitions: 160ms slide, no fade.
- Respect `prefers-reduced-motion` / Android reduce-motion.

## Accessibility

- Body text on paper or white only. Never muted grey on yellow or pink.
- Every interactive element keeps a 48px touch target and a visible 3px focus
  outline with 3px offset.
- Colour is never the only status signal: every badge carries a label.
- Hard shadows are decorative; focus and state never depend on them.

## Rollout order

1. Tokens and primitives: `apps/web/src/app/globals.css`, mobile `theme.ts` and
   `components.tsx`.
2. Landing page.
3. Web app shell, navigation and auth screens.
4. Core web screens: discover, donation details, create, activity, impact,
   profile, admin.
5. Mobile tabs, then the same core screens with the mobile shadow scale.
6. Remove the old ivory/red tokens once no screen references them.

## Non-goals

- No Figma reproduction on this branch.
- No gradients, glassmorphism, soft shadows, or decorative blobs.
- No change to API contracts, database schema or business rules.
- No fake data: every screen keeps reading the existing store/API.

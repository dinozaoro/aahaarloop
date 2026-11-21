# Design tokens and UI foundation

Owner: Developer B. Related issue: #14. Showcase: `/design`.

Tokens live in `apps/web/src/app/globals.css` as CSS variables mapped through
Tailwind's `@theme`. Components use token utilities (`bg-card`, `text-muted-foreground`,
`rounded-lg`, `shadow-soft`), never raw hex values.

## Color

| Token                                | Role                               |
| ------------------------------------ | ---------------------------------- |
| `background` / `foreground`          | Page canvas and body text          |
| `card` / `card-foreground`           | Panels, dialogs, sheets, inputs    |
| `primary` / `primary-foreground`     | Main action and brand              |
| `secondary` / `secondary-foreground` | Subdued surfaces and active nav    |
| `muted` / `muted-foreground`         | Metadata, captions, disabled text  |
| `accent` / `accent-foreground`       | Highlights such as urgency badges  |
| `destructive`                        | Errors, cancellation               |
| `success` / `warning`                | Positive and caution statuses      |
| `border` / `input` / `ring`          | Borders, form outlines, focus ring |

Values are authored in OKLCH for predictable contrast. Light and dark values
exist; the dark palette is opt-in through the `.dark` class and no theme switch
is wired yet.

## Typography

- Family: system UI stack (`ui-sans-serif`, `system-ui`, ...). No webfont is
  loaded, so text renders immediately and nothing depends on a font CDN.
- Weights: 400 body, 500 controls, 600 headings.
- Scale: `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20,
  `text-2xl` 24, `text-3xl` 30, `text-4xl` 36+, with `tracking-tight` on headings.

## Spacing, radius and elevation

- Spacing follows Tailwind's 4 px base scale (`gap-2` = 8 px, `p-6` = 24 px).
- Radius base is `--radius: 0.75rem`; `rounded-sm/md/lg/xl` derive from it.
- `shadow-soft` is the default card elevation; `shadow-lifted` is reserved for
  dialogs, sheets and toasts.
- Section rhythm: `gap-10` between major blocks, `gap-4` inside a block.

## Components

`apps/web/src/components/ui` contains the shadcn-compatible primitives: button,
card, badge, input, textarea, label, field, select, checkbox, tabs, dialog,
sheet, table and the Sonner toast surface. `components.json` keeps the shadcn
CLI able to add more.

Dialog and sheet are built on Radix, so focus trapping, Escape handling, focus
return and `aria-*` wiring come from the primitives. Tabs use the Radix tab
keyboard model.

## App shell

`SiteHeader` is sticky, collapses to a sheet below `md`, and marks the current
page with `aria-current="page"`. `SiteFooter` carries the safety disclaimer and
documentation links. `main` has `id="main"` so the skip link added in #16 can
target it.

## Logo

`LogoMark` is an inline SVG placeholder and is explicitly replaceable. Swap the
SVG only; keep the wordmark and the accessible name intact.

## Rules

- Do not hard-code colors in components; add or use a token.
- Do not remove focus styles; use `focus-visible` rings.
- Interactive controls keep a visible label or an `aria-label`.
- Every overlay needs a title and description for assistive technology.

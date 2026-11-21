# Accessibility baseline

Owner: Developer B. Related issue: #16. Applies to every web screen.

## What is implemented

- **Skip link**: the first focusable element on every page jumps to
  `<main id="main">`; the target receives focus programmatically. The link is
  visually hidden until focused.
- **Landmarks**: one banner (`header`), one main, one contentinfo (`footer`),
  plus labelled `nav` elements (`aria-label="Main"`, `"Mobile"`, `"Breadcrumb"`)
  and `aria-current="page"` on the active link.
- **Headings**: each page has a single `h1`; sections use `h2`/`h3` in order.
  `PageHeader` renders the page `h1`.
- **Focus**: a global `:focus-visible` outline uses the `ring` token with a
  2 px offset. Buttons, links and form controls add their own visible ring.
  Focus styles are never removed, and overlays return focus to their trigger.
- **Forms**: inputs have a programmatic `label`; descriptions and errors are
  referenced with `aria-describedby`; invalid fields set `aria-invalid="true"`
  and errors render with `role="alert"` so they are announced.
- **Errors and async states**: `AsyncState` announces loading and empty states
  politely and failures assertively. Toasts from Sonner are announced.
- **Contrast**: text colors are paired with their surfaces in the token set
  (`foreground` on `background`, `*muted-foreground*` on `background`, white on
  `primary`). The pairs are chosen for at least 4.5:1 for body text.
- **Motion**: one entrance animation (`fade-up`) exists. A global
  `prefers-reduced-motion: reduce` rule disables animation, transitions and
  smooth scrolling, and spinners use `motion-reduce:animate-none`.
- **Zoom and reflow**: layouts use `max-w` containers with responsive grids;
  content reflows at 320 px and 400% zoom without horizontal scrolling.
- **Language**: `<html lang="en">` is set.

## Audit status

| Check | Status |
| --- | --- |
| ESLint `jsx-a11y` rules (via `eslint-config-next`) | Passing |
| Keyboard-only walkthrough of the shell and `/design` | Passing (skip link, nav, tabs, dialog, sheet, toast, form errors) |
| Automated axe/Lighthouse scan | Not run: no Chrome or browser is available in this environment. Run `npx @axe-core/cli http://localhost:3000/design` locally. |
| Screen-reader test (VoiceOver/NVDA) | Not run in this environment |

The landing page (#15), donation form (#18) and dashboards (#17, #31) are
audited in their own issues using this baseline; the shell they mount in
already satisfies it.

## Known gaps

- The dark palette exists but no theme switch is wired; dark-mode contrast is
  not audited.
- The app uses demo data; live error paths from the future API are not covered
  yet.
- Map interactions (#42) will need a keyboard-accessible address alternative.
- File upload fields (#22) will need an accessible preview and size error.
- Automated accessibility checks are not wired into CI yet (#71 test strategy).

## Rules for new screens

1. One `h1` per page, rendered by `PageHeader` where possible.
2. Every input gets a label plus `aria-describedby` for help and error text.
3. Announce asynchronous results with `role="status"` or `role="alert"`.
4. Never rely on color alone: pair urgency and status colors with text.
5. Every icon-only control needs an `aria-label`; decorative icons get
   `aria-hidden="true"`.
6. Keep the skip link and the main landmark; do not add a second `main`.
7. Test the screen with the keyboard (Tab, Shift+Tab, Enter, Space, Escape,
   arrows) before opening the PR.

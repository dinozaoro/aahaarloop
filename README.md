# aahaarloop

Monorepo for the Aahaarloop surplus-food platform.

## Layout

- `apps/web` — Next.js App Router web app with the design system and app shell.
- `apps/mobile` — Expo (React Native) app with Expo Router.
- `packages/matching` — deterministic urgency and matching rules shared by the clients.
- `docs/product-spec.md` — product specification, glossary and matching contract.
- `docs/design-tokens.md` — design tokens and UI foundation.
- `docs/accessibility.md` — accessibility baseline, audit status and known gaps.

## Getting started

```bash
npm install
npm run web      # http://localhost:3000
npm run mobile
```

See `apps/mobile/README.md` for the mobile workflow and environment variables.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build    # production build of the web app
```

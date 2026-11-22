# Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull
request and on pushes to `main`. Superseded runs for the same ref are cancelled.
No secrets are used or printed.

Jobs:

- **checks** — `pnpm install --frozen-lockfile`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test` and the web production build. Any failure blocks
  the PR.
- **mobile-typecheck** — `pnpm --filter @aahaarloop/mobile typecheck`.
- **commit-trailers** — checks every PR commit for the two required co-author
  trailers and rejects extra (including AI) co-authors. It runs with full git
  history over `base..head`.

The trailer job is PR-only because GitHub rewrites the commit message when a PR
is squash-merged; merged commits on `main` are not re-checked. Keep the two
trailers on every commit you push to a PR branch.

`scripts/check-commit-trailers.mjs` is also runnable locally:

```sh
node scripts/check-commit-trailers.mjs <base-sha> <head-sha>
```

Its trailer parser is covered by `scripts/commit-trailers.test.mjs`, which runs
as part of `pnpm test`.

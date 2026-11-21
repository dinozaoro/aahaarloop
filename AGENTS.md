# AGENTS.md

Rules for every human or AI agent contributing to this repository.

## Branches

Use Conventional Branch names:

```
<type>/<short-kebab-case-description>
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style`.
Include the issue number when one exists: `feat/42-food-listing`.

## Commits

Use Conventional Commits, always in English:

```
<type>(<scope>): <short imperative description>
```

Examples: `feat(auth): add email sign-in`, `fix(api): handle empty results`.
One logical change per commit.

## Co-authorship (mandatory)

Every commit MUST end with exactly these two trailers:

```
Co-authored-by: ItokianaRAKT <itokianarakt@gmail.com>
Co-authored-by: fatratra-png <nyfatratrar@gmail.com>
```

Never add an AI or external tool as author or co-author (Claude, Copilot, Cursor, Codex, Gemini, etc.).
Only the two developers above may be credited.

## Issues and pull requests

- One branch and one pull request per issue.
- Reference the issue in the PR body: `Closes #<issue-number>`.
- PR titles follow Conventional Commits.

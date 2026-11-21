# Production monitoring

## What is in the code

- **Structured request logs.** Every route wrapped by `withApiHandler` emits one JSON line per request with `request_id`, method, path, status, error code and duration. Unexpected server errors emit a second `api_error` line.
- **No personal data in logs.** `lib/monitoring/log.ts` redacts emails, phone numbers, `nt_live_*` and `sk-*` credentials from every string field before it reaches the sink. Domain error codes and request IDs are safe to share.
- **Health probes.**
  - `GET /api/health/db` — read-only `select 1` against the pooled Neon connection.
  - `GET /api/health` — aggregates the database and the branch AI Gateway status; returns 503 if either is down.
  - `GET /api/ai/models` — free Gateway status; `available:false` is expected while the account has no AI credits and is **not** a failure.

Logs are visible in the Vercel project's **Runtime Logs** and in Neon's branch logs for database work.

## Verify locally

```sh
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/health/db
node --test apps/web/test/monitoring.test.mjs
```

To see a structured error line, call any protected route without a session and
check the runtime log for `"event":"api_error"` or `"code":"unauthorized"`.

## Alerts to configure in Vercel (human step)

No external monitoring account is configured, so **alerts are not yet active**.
In the Vercel project `aahaarloop`:

1. Open **Observability → Runtime Logs** and confirm requests appear after a demo run.
2. Add a log drain if long-term retention is required (the free tier keeps logs briefly).
3. Configure an uptime check on `https://aahaarloop.vercel.app/api/health` expecting HTTP 200.
4. Add an alert on 5xx rate and on the health check failing twice in a row; route it to the team's email or Slack.
5. Repeat for the preview deployment if previews are demoed.

## Rules

- Never log request bodies, session tokens, `DATABASE_URL`, `NEON_AI_GATEWAY_TOKEN` or Cloudinary secrets.
- Use `request_id` from the `x-request-id` response header when correlating a judge-visible failure with a log line.
- Keep the `/api/health` probe read-only; it must never mutate data.

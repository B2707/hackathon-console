# hackathon-console

Team status dashboard for the hackathon Team OS — a Next.js app on Vercel
backed by Marketplace Upstash Redis. Receives GitHub webhooks + seat
heartbeats and renders the wall: seat health strip, kanban, ticker.

## How it works

- GitHub webhooks (registered by the template repo's `scripts/repo-init.sh`)
  land on `POST /api/webhook`, HMAC-verified against `TEAM_HEARTBEAT_SECRET`.
  Each event appends a ticker entry and patches the cached board in place.
- Seats post `POST /api/heartbeat` so the wall shows who's alive.
- The wall polls `GET /api/state`. If the cached board is older than 60s the
  handler lazily re-fetches open issues/PRs from GitHub (Hobby tier has no
  crons — staleness heals on read). Without a `GITHUB_TOKEN` the reconcile
  backs off to 5 minutes to respect the 60 req/h unauthenticated limit;
  webhooks keep it fresh in between.

## Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/webhook` | `X-Hub-Signature-256` HMAC | GitHub events → ticker + board patches |
| `POST /api/heartbeat` | `X-Team-Secret` header | body `{"seat":"sjp","note":"on task #12"}` |
| `GET /api/state` | `X-Team-Secret` header | `{seats, board, ticker, repo}` + lazy reconcile |

## Environment

| Var | Required | Notes |
|---|---|---|
| `TEAM_HEARTBEAT_SECRET` | yes | HMAC + header auth. Generate: `openssl rand -hex 32`. Same value everywhere; never committed. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | yes | Injected by the Vercel Marketplace Upstash integration (`KV_REST_API_*` also accepted). |
| `GITHUB_TOKEN` | recommended | Fine-grained read-only (Issues + Pull requests) on the team repo; enables the 60s reconcile. |
| `GITHUB_REPO` | no | `owner/repo` override. Normally learned from the first webhook — the ping GitHub sends on registration is enough. |

## Bring it online (D3 runbook — IN ORDER)

1. **Vercel**: import this repo as a project (framework preset: Next.js).
2. **Upstash**: Vercel Marketplace → Upstash → create a Redis database and
   link it to the project (injects the REST env vars). It is NOT "Vercel KV"
   — that product is sunset; the Marketplace integration is the path.
3. **Secrets**: add `TEAM_HEARTBEAT_SECRET` (and optionally `GITHUB_TOKEN`)
   in Vercel project → Settings → Environment Variables.
4. **Deploy**, note the production URL.
5. **Webhook**: from the team template repo, with the SAME secret exported:
   `TEAM_HEARTBEAT_SECRET=... scripts/repo-init.sh <owner/repo> --webhook-url https://<console>/api/webhook`
   (idempotent; re-run at hour zero against the event repo). The ping event
   teaches the console which repo to reconcile from.
6. **Wall**: open `https://<console>/?key=<TEAM_HEARTBEAT_SECRET>` once per
   device — the key moves to localStorage and is scrubbed from the URL.
7. **Heartbeat smoke test**:
   `curl -X POST https://<console>/api/heartbeat -H "X-Team-Secret: $TEAM_HEARTBEAT_SECRET" -H "content-type: application/json" -d '{"seat":"bader","note":"hello wall"}'`
   — seat hooks in the template wire this automatically at D4.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

## Storage (Upstash Redis)

| Key | Type | Contents |
|---|---|---|
| `seats` | hash | seat → `{seat, at, note?}` |
| `ticker` | list | newest-first events, capped at 100 |
| `board` | string | JSON `{fetchedAt, issues[], prs[]}` |
| `repo` | string | `owner/repo` learned from webhooks |
| `board:lock` | string | 30s NX lock so concurrent polls don't stampede GitHub |

## Status

D3 core shipped: health strip + kanban (label canon: triage/proposed/ready/
blocked/needs-human + PRs in flight) + ticker. Burn/demo tiles remain below
the cut line (COULD).

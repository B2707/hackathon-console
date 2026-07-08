# hackathon-console

Team status dashboard for the hackathon Team OS — Vercel app backed by
Marketplace Upstash Redis. Receives GitHub webhooks + seat heartbeats and
renders the wall: seat health strip, ready-column kanban, ticker.

## Endpoints (built at D3)

- `POST /api/webhook` — GitHub events (HMAC-verified)
- `POST /api/heartbeat` — seat heartbeats (X-Team-Secret header)
- `GET  /api/state` — aggregated board state (X-Team-Secret required;
  lazily re-fetches from GitHub if cache is older than 60s — no cron needed)

## Status

D0 stub. Build lands D3 (core: health strip + kanban + ticker; burn/demo
tiles are post-gate stretch). Ported from the workflow fork's control-pane.

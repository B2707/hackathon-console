import { ROSTER } from './board'
import type { TickerEvent } from './types'

// --- Event Log data contract -------------------------------------------------
// The Event Log panel renders a monospace table: Time · Level · Seat · Message ·
// Latency. Its rows are derived from the real /api/state ticker feed by
// `mapTickerToEvents` below.

export type EventLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR'

export type EventLogEntry = {
  /** Epoch ms; the panel formats this as HH:MM:SS. */
  time: number
  level: EventLevel
  /** Roster handle, or 'system' when the actor is not parseable. */
  seat: string
  message: string
  /** Optional "128ms" / "—" latency readout. Not present in the ticker feed. */
  latency?: string
  url?: string
}

// Ticker `kind` values emitted by app/api/webhook: ping | push | issue | pr |
// comment | ci. This is the baseline level before text-keyword overrides.
const KIND_LEVEL: Record<string, EventLevel> = {
  ping: 'OK',
  push: 'INFO',
  issue: 'INFO',
  pr: 'INFO',
  comment: 'INFO',
  ci: 'WARN',
}

const ERROR_HINT = /\b(fail|failed|failing|error|red|broke|broken|crash)\b/i
const OK_HINT =
  /\b(pass|passed|passing|green|success|merged|approved|shipped|deployed|ready)\b/i
const WARN_HINT =
  /\b(warn|warning|stale|blocked|freeze|conflict|collision|retry|flaky|flake)\b/i

/**
 * Resolve an ops-severity level for a ticker event. Text keywords win over the
 * coarse `kind`, so "ci: build failed" reads ERROR while "ci: tests passed"
 * reads OK. TODO: thread the real CI conclusion / PR state instead of scanning
 * the human text.
 */
export function levelForTicker(ev: TickerEvent): EventLevel {
  if (ERROR_HINT.test(ev.text)) return 'ERROR'
  if (OK_HINT.test(ev.text)) return 'OK'
  if (WARN_HINT.test(ev.text)) return 'WARN'
  return KIND_LEVEL[ev.kind] ?? 'INFO'
}

/** Best-effort seat attribution: first roster handle mentioned, else 'system'. */
export function seatForTicker(ev: TickerEvent): string {
  const lower = ev.text.toLowerCase()
  const hit = ROSTER.find((seat) => new RegExp(`\\b${seat}\\b`).test(lower))
  return hit ?? 'system'
}

/** Map the real ticker feed onto Event Log rows (newest-first order preserved). */
export function mapTickerToEvents(ticker: TickerEvent[]): EventLogEntry[] {
  return ticker.map((ev) => ({
    time: ev.at,
    level: levelForTicker(ev),
    seat: seatForTicker(ev),
    message: ev.text,
    url: ev.url,
    // latency: TODO — not carried by the ticker; wire real request timing.
  }))
}

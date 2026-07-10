import type { BoardIssue } from './types'

// --- polling + freshness contract (unchanged from the original wall) --------
export const POLL_MS = 15_000
export const FRESH_MS = 10 * 60_000
export const WARM_MS = 30 * 60_000

// Seat keys are LOWERCASED GitHub usernames (the heartbeat seat regex is
// lowercase-only: /^[a-z][a-z0-9-]{0,19}$/). Display labels are the
// proper-cased logins — see seatGithubLogin below.
export const ROSTER = [
  'b2707',
  'mohammadesteitieh',
  'amrooosh',
  'saidel04',
] as const

// --- lane canon -------------------------------------------------------------
// Lane precedence mirrors the template's label semantics: an escalation or a
// block outranks dispatchability. Labels come from repo-init.sh's canon.
export const LANES = [
  'triage',
  'proposed',
  'ready',
  'blocked',
  'needs-human',
] as const
export type Lane = (typeof LANES)[number]

export const LANE_TITLES: Record<Lane, string> = {
  triage: 'Triage',
  proposed: 'Proposed',
  ready: 'Ready',
  blocked: 'Blocked',
  'needs-human': 'Needs human',
}

export function laneFor(labels: string[]): Lane {
  if (labels.includes('needs-human')) return 'needs-human'
  if (labels.includes('blocked')) return 'blocked'
  if (labels.includes('ready')) return 'ready'
  if (labels.includes('proposed')) return 'proposed'
  return 'triage'
}

/** Group open issues into lanes, preserving lane order. */
export function issuesByLane(issues: BoardIssue[]): Record<Lane, BoardIssue[]> {
  const byLane: Record<Lane, BoardIssue[]> = {
    triage: [],
    proposed: [],
    ready: [],
    blocked: [],
    'needs-human': [],
  }
  for (const issue of issues) byLane[laneFor(issue.labels)].push(issue)
  return byLane
}

// One status language, mapped to ops severity.
export type Tone = 'success' | 'warning' | 'danger' | 'primary' | 'muted'

/** Tone -> CSS custom property, for inline SVG strokes / accents. */
export function toneVar(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'var(--success)'
    case 'warning':
      return 'var(--warning)'
    case 'danger':
      return 'var(--danger)'
    case 'primary':
      return 'var(--primary)'
    default:
      return 'var(--muted-foreground)'
  }
}

/** Tone -> Badge variant name. */
export function toneBadgeVariant(
  tone: Tone
): 'success' | 'warning' | 'danger' | 'default' | 'outline' {
  if (tone === 'success' || tone === 'warning' || tone === 'danger') return tone
  if (tone === 'primary') return 'default'
  return 'outline'
}

/** Lane -> ops severity tone. Escalations/blocks read rose, ready reads emerald. */
export function laneTone(lane: Lane): Tone {
  switch (lane) {
    case 'ready':
      return 'success'
    case 'proposed':
      return 'warning'
    case 'blocked':
    case 'needs-human':
      return 'danger'
    default:
      return 'muted'
  }
}

// --- time --------------------------------------------------------------------
export function timeAgo(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// --- seat freshness ----------------------------------------------------------
export type SeatStatus = 'fresh' | 'warm' | 'stale' | 'never'

/** Identical thresholds to the original wall: <10m fresh, <30m warm, else stale. */
export function seatStatus(at: number | undefined, now: number): SeatStatus {
  if (!at) return 'never'
  const age = now - at
  if (age < FRESH_MS) return 'fresh'
  if (age < WARM_MS) return 'warm'
  return 'stale'
}

export const SEAT_STATUS_LABEL: Record<SeatStatus, string> = {
  fresh: 'fresh',
  warm: 'warm',
  stale: 'stale',
  never: 'no beat',
}

export function seatStatusTone(status: SeatStatus): Tone {
  switch (status) {
    case 'fresh':
      return 'success'
    case 'warm':
      return 'warning'
    case 'stale':
      return 'danger'
    default:
      return 'muted'
  }
}

/** Freshness as a 0..1 ring fraction: 1 at a fresh beat, decaying to 0 by WARM. */
export function seatFreshnessFraction(
  at: number | undefined,
  now: number
): number {
  if (!at) return 0
  const frac = 1 - (now - at) / WARM_MS
  return Math.min(1, Math.max(0, frac))
}

// --- per-seat identity accent (ring color on the avatar) --------------------
// Positional colors carried over from the original four seats.
const SEAT_ACCENTS: Record<string, string> = {
  b2707: '#4d8dff',
  mohammadesteitieh: '#fb7185',
  amrooosh: '#fbbf24',
  saidel04: '#a78bfa',
}

// Fixed palette for any seat outside the roster — hashed so a given handle
// always lands on the same colour.
const EXTRA_PALETTE = [
  '#38bdf8',
  '#f472b6',
  '#c084fc',
  '#4ade80',
  '#fb923c',
  '#e879f9',
  '#22d3ee',
]

export function seatAccent(name: string): string {
  // Lowercased lookup so live GitHub logins (e.g. PR author "B2707") land on
  // the same accent as their lowercase seat key.
  const key = name.toLowerCase()
  if (SEAT_ACCENTS[key]) return SEAT_ACCENTS[key]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return EXTRA_PALETTE[hash % EXTRA_PALETTE.length]
}

// --- seat key → proper-cased GitHub login ------------------------------------
// Doubles as the UI display label ("just use github usernames") and the
// github.com/<login>.png avatar URL segment. Client-safe (unlike
// lib/scoreboard.ts's SEAT_HANDLES, which is server-only). Unmapped extras
// fall back to the raw seat name, which 404s gracefully to initials.
const SEAT_GITHUB_LOGIN: Record<string, string> = {
  b2707: 'B2707',
  mohammadesteitieh: 'MohammadESteitieh',
  amrooosh: 'Amrooosh',
  saidel04: 'saidel04',
}

export function seatGithubLogin(name: string): string {
  return SEAT_GITHUB_LOGIN[name.toLowerCase()] ?? name
}

export function initials(name: string): string {
  const parts = name.replace(/[^a-z0-9]+/gi, ' ').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// --- special label styling (preserves the original break-glass/demo-path) ---
export type LabelTone = 'demo' | 'break' | 'default'

export function labelTone(label: string): LabelTone {
  if (label === 'demo-path') return 'demo'
  if (label === 'break-glass') return 'break'
  return 'default'
}

/** True when a card carries an escalation label that should accent its edge. */
export function cardAccent(labels: string[]): 'demo' | 'break' | null {
  if (labels.includes('break-glass')) return 'break'
  if (labels.includes('demo-path')) return 'demo'
  return null
}

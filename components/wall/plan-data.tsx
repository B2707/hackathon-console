'use client'

import type { Board } from '@/lib/types'
import {
  LANES,
  initials,
  issuesByLane,
  laneFor,
  seatAccent,
  seatGithubLogin,
} from '@/lib/board'

/**
 * Shared data + tiny presentational helpers for the Plan & Board panel
 * (handoff `team-board.html`). Kept here so plan-board / plan-kanban /
 * plan-table stay small and focused.
 *
 * REAL — every value here is derived from the live `board` (/api/state issues +
 * PRs). The KPI cards and the kanban columns come straight from that board;
 * there are no fabricated series, no fixed completion %, and no sample cards.
 * The board carries OPEN work only (see lib/github.fetchBoard), so there is no
 * "Done / merged" column — that would need a closed/merged feed we don't have.
 */

// --- label helpers ----------------------------------------------------------
const LANE_SET = new Set<string>([...LANES])
const CONTROL_SET = new Set(['demo-path', 'break-glass'])

/** Topic/tech labels for card chips — drops lane + control labels (the noise). */
export function topicLabels(labels: string[]): string[] {
  return labels.filter((l) => !LANE_SET.has(l) && !CONTROL_SET.has(l))
}

// --- KPI stat cards ----------------------------------------------------------
export type Kpi = {
  label: string
  value: string
  /** Value accent color (CSS token). */
  color: string
}

/**
 * Five KPI cards, every one derived from the live `board` — open issues, open
 * PRs, PRs in review (open + non-draft), issues ready to claim, and issues
 * blocked/needs-human. No sparkline history is shown because no real per-metric
 * time-series is fed; the numbers are the truth as of the latest board snapshot.
 */
export function buildKpis(board: Board | null): Kpi[] {
  const issues = board?.issues ?? []
  const prs = board?.prs ?? []
  const byLane = issuesByLane(issues)
  const lanesFilled = LANES.filter((lane) => byLane[lane].length > 0).length
  const inReview = prs.filter((p) => !p.draft).length
  const blocked = byLane.blocked.length + byLane['needs-human'].length

  return [
    { label: 'Open Issues', value: String(issues.length), color: 'var(--primary)' },
    { label: 'Open PRs', value: String(prs.length), color: 'var(--primary)' },
    { label: 'In Review', value: String(inReview), color: 'var(--warning)' },
    { label: 'Ready', value: String(byLane.ready.length), color: 'var(--success)' },
    {
      label: 'Blocked',
      value: String(blocked),
      color: blocked ? 'var(--danger)' : 'var(--muted-foreground)',
    },
  ]
}

// --- kanban model ------------------------------------------------------------
export type PlanColumnKind = 'backlog' | 'progress' | 'review'

export type PlanCard = {
  /** `#<number>` — the real issue/PR number. */
  id: string
  title: string
  labels: string[]
  /** First assignee (issues) / author (PRs); drives the avatar + status suffix. */
  who: string | null
  url: string
}

export type PlanColumn = {
  kind: PlanColumnKind
  title: string
  /** CSS var for the header dot. */
  dot: string
  cards: PlanCard[]
}

function issueCard(
  n: { number: number; title: string; labels: string[]; assignees: string[]; url: string }
): PlanCard {
  return {
    id: `#${n.number}`,
    title: n.title,
    labels: topicLabels(n.labels),
    who: n.assignees[0] ?? null,
    url: n.url,
  }
}

function prCard(
  p: { number: number; title: string; author: string; labels: string[]; url: string }
): PlanCard {
  return {
    id: `#${p.number}`,
    title: p.title,
    labels: topicLabels(p.labels),
    who: p.author || null,
    url: p.url,
  }
}

/**
 * Map the real board into 3 kanban columns of OPEN work. Backlog = issues not
 * yet `ready` (triage/proposed, plus blocked/needs-human so no issue is
 * dropped); In Progress = `ready` issues + draft PRs; In Review = open
 * (non-draft) PRs. There is deliberately no "Done" column: the board carries
 * only open items, so a merged/closed lane would have no real source.
 */
export function buildColumns(board: Board | null): PlanColumn[] {
  const issues = board?.issues ?? []
  const prs = board?.prs ?? []

  const backlog = issues.filter((i) => laneFor(i.labels) !== 'ready')
  const ready = issues.filter((i) => laneFor(i.labels) === 'ready')
  const draftPrs = prs.filter((p) => p.draft)
  const openPrs = prs.filter((p) => !p.draft)

  return [
    {
      kind: 'backlog',
      title: 'Backlog',
      dot: 'var(--muted-foreground)',
      cards: backlog.map(issueCard),
    },
    {
      kind: 'progress',
      title: 'In Progress',
      dot: 'var(--primary)',
      cards: [...ready.map(issueCard), ...draftPrs.map(prCard)],
    },
    {
      kind: 'review',
      title: 'In Review',
      dot: 'var(--warning)',
      cards: openPrs.map(prCard),
    },
  ]
}

/** Status badge text + tint per column kind (matches the prototype `.kstatus`). */
export const KSTATUS: Record<
  PlanColumnKind,
  { label: (who: string | null) => string; cls: string }
> = {
  backlog: { label: () => 'Free to claim', cls: 'border-success/30 bg-success/15 text-success' },
  progress: {
    label: (who) => (who ? `In progress · ${who}` : 'In progress'),
    cls: 'border-primary/30 bg-primary/15 text-primary',
  },
  review: {
    label: (who) => (who ? `In review · ${who}` : 'In review'),
    cls: 'border-warning/30 bg-warning/15 text-warning',
  },
}

/** Case-insensitive match of a card against the toolbar filter (title + labels). */
export function cardMatches(card: PlanCard, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    card.title.toLowerCase().includes(q) ||
    card.labels.some((l) => l.toLowerCase().includes(q))
  )
}

// --- CSS-circle avatar (per-person accent), matching the prototype `.avatar` --
export function PlanAvatar({ name, size = 24 }: { name: string; size?: number }) {
  const accent = seatAccent(name)
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full border-[1.5px] font-mono font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size <= 22 ? '0.52rem' : '0.56rem',
        color: accent,
        background: `${accent}24`, // ~14% tint via hex8 alpha
        borderColor: accent,
      }}
      title={seatGithubLogin(name)}
    >
      {initials(name)}
    </span>
  )
}

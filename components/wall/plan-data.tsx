'use client'

import type { Board } from '@/lib/types'
import { LANES, initials, issuesByLane, laneFor, seatAccent } from '@/lib/board'

/**
 * Shared data + tiny presentational helpers for the Plan & Board panel
 * (handoff `team-board.html`). Kept here so plan-board / plan-kanban /
 * plan-stepper / plan-table stay small and focused.
 *
 * REAL vs SAMPLE seams are marked inline: the kanban columns + the two
 * board-derived KPIs (Open PRs, Lanes Filled) come from `board`; everything
 * else (completion %, the other three KPIs, all sparkline series, the Done
 * column, and the Plan milestones) is SAMPLE, verbatim from the prototype.
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
  /** SAMPLE series — hover history is not yet fed by any real API. */
  series: number[]
  color: string
}

/**
 * Five KPI cards. Open PRs + Lanes Filled are REAL (derived from `board`); the
 * other values and every sparkline series are SAMPLE.
 * // TODO: GitHub / Actions API for PRs Merged, CI Pass Rate, Deploys Today + all series.
 */
export function buildKpis(board: Board | null): Kpi[] {
  const prs = board?.prs ?? []
  const byLane = issuesByLane(board?.issues ?? [])
  const lanesFilled = LANES.filter((lane) => byLane[lane].length > 0).length

  return [
    { label: 'PRs Merged', value: '33', series: [3, 5, 4, 7, 6, 9, 8, 12], color: 'var(--success)' }, // TODO: real
    { label: 'Open PRs', value: String(prs.length), series: [6, 5, 7, 4, 5, 4, 3, 4], color: 'var(--primary)' }, // REAL value
    { label: 'CI Pass Rate', value: '88%', series: [82, 85, 84, 88, 86, 89, 88, 88], color: 'var(--success)' }, // TODO: real
    { label: 'Deploys Today', value: '17', series: [8, 10, 9, 13, 12, 15, 14, 17], color: 'var(--primary)' }, // TODO: real
    { label: 'Lanes Filled', value: `${lanesFilled}/${LANES.length}`, series: [3, 4, 4, 5, 4, 4, 4, 4], color: 'var(--warning)' }, // REAL numerator
  ]
}

// --- kanban model ------------------------------------------------------------
export type PlanColumnKind = 'backlog' | 'progress' | 'review' | 'done'

export type PlanCard = {
  /** `#<number>` for real items; a fixed id for sample Done cards. */
  id: string
  title: string
  labels: string[]
  /** First assignee (issues) / author (PRs); drives the avatar + status suffix. */
  who: string | null
  url: string
  /** Sample-only body sentence; real cards fall back to the title. */
  desc?: string
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
 * Map the real board into 4 kanban columns. Backlog = issues not yet `ready`
 * (triage/proposed, plus blocked/needs-human so no issue is dropped); In
 * Progress = `ready` issues + draft PRs; In Review = open (non-draft) PRs; Done
 * = SAMPLE merged cards. // TODO: closed/merged issues + PRs from GitHub.
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
    { kind: 'done', title: 'Done', dot: 'var(--success)', cards: SAMPLE_DONE },
  ]
}

/** SAMPLE — the prototype's 3 merged cards. // TODO: closed/merged from GitHub. */
const SAMPLE_DONE: PlanCard[] = [
  {
    id: '#1',
    title: 'Scaffold repo & CI',
    labels: ['setup'],
    who: 'bader',
    url: 'https://github.com/B2707/hackathon-console/pull/1',
    desc: 'Template cloned, Actions green, seats provisioned.',
  },
  {
    id: '#12',
    title: 'Seat health gauges',
    labels: ['frontend'],
    who: 'sjp',
    url: 'https://github.com/B2707/hackathon-console/pull/12',
    desc: 'Ring gauges + resource meters rendered from the heartbeat feed.',
  },
  {
    id: '#8',
    title: 'Nav pill + hero',
    labels: ['design'],
    who: 'adham',
    url: 'https://github.com/B2707/hackathon-console/pull/8',
    desc: 'Sticky nav pill and the Team Board hero header.',
  },
]

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
  done: { label: () => 'Merged', cls: 'border-border bg-muted text-muted-foreground' },
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
      title={name}
    >
      {initials(name)}
    </span>
  )
}

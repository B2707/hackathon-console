'use client'

import * as React from 'react'

import { Expandable } from '@/components/ui/expandable'
import { Meter } from '@/components/ui/meter'
import { RingGauge } from '@/components/ui/ring-gauge'
import { Sparkline } from '@/components/ui/sparkline'
import { cn } from '@/lib/utils'
import {
  type SeatStatus,
  initials,
  seatAccent,
  seatGithubLogin,
  seatStatus,
  timeAgo,
} from '@/lib/board'
import type { SeatBeat } from '@/lib/types'

/**
 * SeatCard — one expandable seat in the Team panel (handoff `team-board.html`
 * lines 1841–1936, `.seat-card`).
 *
 * REAL vs SAMPLE:
 *   - Presence is REAL — the status dot + the "active … ago" suffix are derived
 *     from the seat's live heartbeat `at` via `seatStatus` / `timeAgo` against
 *     `now`. Presence always wins for the dot (a fresh beat reads online even if
 *     the seat's sample work-status says otherwise).
 *   - Everything else is SAMPLE (see `SAMPLE` below) — each field is a
 *     // TODO: real data seam (GitHub aggregate API for health / PR / CI /
 *     commits, Anthropic Usage API for tokens / spend).
 */

type WorkStatus = 'green' | 'amber' | 'red'

type SeatSample = {
  /** Work-status → badge + ring/edge/spark accent (NOT presence). */
  work: WorkStatus
  /** Ring gauge value 0–100. */
  health: number
  /** One-line situation (the "active … ago" presence suffix is appended live). */
  situation: string
  /** Meter fill % (drives the bar) + readout (a raw count for PRs). */
  prs: { fill: number; display: string }
  ci: { fill: number; display: string }
  /** Commits/hr, last 8h (index 0 = 7h ago … last = now). */
  series: number[]
  commits: string
  tokens: string
  spend: string
  /** "Working on" line + task id. */
  task: string
}

// SAMPLE presentation data, mirroring the prototype's hardcoded seats.
// TODO: real data — replace with GitHub aggregate + Anthropic Usage feeds.
const SAMPLE: Record<string, SeatSample> = {
  b2707: {
    work: 'green',
    health: 92,
    situation: 'Shipping — 2 PRs in review, CI green',
    prs: { fill: 90, display: '12' },
    ci: { fill: 96, display: '96%' },
    series: [2, 4, 3, 6, 5, 8, 7, 11],
    commits: '88',
    tokens: '34.1M',
    spend: '$128',
    task: 'Rebuild wall in shadcn · WALL-27',
  },
  mohammadesteitieh: {
    work: 'green',
    health: 80,
    situation: 'Steady — batch drill running',
    prs: { fill: 72, display: '9' },
    ci: { fill: 88, display: '88%' },
    series: [1, 3, 2, 4, 3, 5, 4, 7],
    commits: '71',
    tokens: '22.6M',
    spend: '$84',
    task: 'Batch drill simulate=all · OPS-05',
  },
  amrooosh: {
    work: 'amber',
    health: 35,
    situation: 'At risk — heartbeat stale · PR #42 awaiting review',
    prs: { fill: 56, display: '7' },
    ci: { fill: 61, display: '61%' },
    series: [4, 3, 4, 2, 3, 2, 1, 2],
    commits: '63',
    tokens: '16.9M',
    spend: '$61',
    task: 'Seat heartbeat flake · OPS-03',
  },
  saidel04: {
    work: 'red',
    health: 5,
    situation: 'Blocked — build red on main',
    prs: { fill: 40, display: '5' },
    ci: { fill: 32, display: '32%' },
    series: [5, 4, 3, 2, 1, 1, 0, 0],
    commits: '44',
    tokens: '10.6M',
    spend: '$39',
    task: 'idle · last seen 45m ago',
  },
}

// Sample fallback for a real seat that appears outside the roster.
function sampleFor(name: string): SeatSample {
  return (
    SAMPLE[name] ?? {
      work: 'green',
      health: 60,
      situation: 'No analytics wired yet',
      prs: { fill: 0, display: '0' },
      ci: { fill: 0, display: '—' },
      series: [0, 0, 0, 0, 0, 0, 0, 0],
      commits: '—',
      tokens: '—',
      spend: '—',
      task: '—',
    }
  )
}

const WORK_LABEL: Record<WorkStatus, string> = {
  green: 'On track',
  amber: 'At risk',
  red: 'Blocked',
}

// Single accent (ring arc, sparkline, left edge) per work-status.
const WORK_COLOR: Record<WorkStatus, string> = {
  green: 'var(--success)',
  amber: 'var(--warning)',
  red: 'var(--danger)',
}

// Meter fill follows the prototype's teal / amber / rose classes.
const METER_COLOR: Record<WorkStatus, string> = {
  green: 'var(--primary)',
  amber: 'var(--warning)',
  red: 'var(--danger)',
}

// Work-status pill (leading dot via bg-current).
const WORK_BADGE: Record<WorkStatus, string> = {
  green: 'text-success bg-success/12 border-success/28',
  amber: 'text-warning bg-warning/12 border-warning/28',
  red: 'text-danger bg-danger/12 border-danger/28',
}

// Inset 3px left edge in the work-status color (overrides the card shadow, as
// in the prototype's `.seat-card[data-work]` rules).
const WORK_EDGE: Record<WorkStatus, string> = {
  green: 'shadow-[inset_3px_0_0_var(--success)]',
  amber: 'shadow-[inset_3px_0_0_var(--warning)]',
  red: 'shadow-[inset_3px_0_0_var(--danger)]',
}

// REAL presence → status-dot color (fresh=online, warm=stale, else offline).
function dotClass(status: SeatStatus): string {
  if (status === 'fresh') return 'bg-success'
  if (status === 'warm') return 'bg-warning'
  return 'bg-danger'
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] border bg-muted px-2.5 py-[9px]">
      <span className="font-mono text-base font-bold text-foreground">
        {value}
      </span>
      <span className="text-[0.62rem] uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function SeatCard({
  name,
  beat,
  now,
}: {
  name: string
  beat: SeatBeat | undefined
  now: number
}) {
  const [open, setOpen] = React.useState(false)
  const sample = sampleFor(name)
  const { work } = sample
  const accent = seatAccent(name)
  const label = seatGithubLogin(name)
  const status = seatStatus(beat?.at, now)
  const presence = beat ? `active ${timeAgo(beat.at, now)} ago` : 'no heartbeat yet'

  return (
    <Expandable
      open={open}
      onOpenChange={setOpen}
      showChevron={false}
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground transition-colors duration-150',
        WORK_EDGE[work],
        open ? 'border-input' : 'border-border'
      )}
      headerClassName="flex-col items-stretch gap-3.5 p-4"
      header={(isOpen) => (
        <>
          {/* seat-top: avatar · name+badge · gauge · chevron */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3">
            <div className="relative flex-none">
              <div
                className="grid size-[46px] place-items-center rounded-full border-2 font-mono text-[0.82rem] font-semibold tracking-[0.02em]"
                style={{
                  borderColor: accent,
                  backgroundColor: `${accent}24`,
                  color: accent,
                }}
              >
                {initials(name)}
              </div>
              <span
                aria-hidden
                className={cn(
                  'absolute -bottom-px -right-px size-[13px] rounded-full shadow-[0_0_0_3px_var(--card)]',
                  dotClass(status)
                )}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate font-mono text-[0.92rem] font-semibold text-foreground">
                {label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-[5px] self-start rounded-full border px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.05em]',
                  WORK_BADGE[work]
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {WORK_LABEL[work]}
              </span>
            </div>

            <RingGauge
              value={sample.health}
              color={WORK_COLOR[work]}
              size={46}
              strokeWidth={5}
            />

            <span
              aria-hidden
              className={cn(
                'inline-flex flex-none self-center text-muted-foreground transition-transform duration-[250ms]',
                isOpen && 'rotate-180'
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-[15px]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>

          <p className="text-[0.78rem] leading-[1.45] text-muted-foreground">
            {sample.situation} · {presence}
          </p>

          <div className="flex flex-col gap-[9px]">
            <Meter
              label="PRs"
              value={sample.prs.fill}
              color={METER_COLOR[work]}
              display={sample.prs.display}
            />
            <Meter
              label="CI"
              value={sample.ci.fill}
              color={METER_COLOR[work]}
              display={sample.ci.display}
            />
          </div>
        </>
      )}
    >
      {/* seat-analytics: commits/hr spark · stat tiles · working-on */}
      <div className="flex flex-col gap-[7px] border-t px-4 pb-3 pt-3.5">
        <span className="text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground">
          Commits / hr · last 8h
        </span>
        <div className="h-11 w-full">
          <Sparkline
            values={sample.series}
            color={WORK_COLOR[work]}
            unit="commits"
            metric="Commits / hr"
            height={44}
            ariaLabel={`${label} commits per hour, last 8 hours`}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <StatTile value={sample.commits} label="commits" />
        <StatTile value={sample.tokens} label="tokens" />
        <StatTile value={sample.spend} label="spend" />
      </div>
      <div className="flex flex-col gap-[3px] px-4 pb-4">
        <span className="text-[0.62rem] uppercase tracking-[0.06em] text-muted-foreground">
          Working on
        </span>
        <span className="font-mono text-[0.8rem] text-foreground">
          {sample.task}
        </span>
      </div>
    </Expandable>
  )
}

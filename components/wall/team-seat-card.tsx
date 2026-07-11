'use client'

import * as React from 'react'

import { Expandable } from '@/components/ui/expandable'
import { RingGauge } from '@/components/ui/ring-gauge'
import { cn } from '@/lib/utils'
import {
  type SeatStatus,
  initials,
  seatAccent,
  seatFreshnessFraction,
  seatGithubLogin,
  seatStatus,
  timeAgo,
} from '@/lib/board'
import type { SeatBeat } from '@/lib/types'

/**
 * SeatCard — one expandable seat in the Team panel.
 *
 * REAL, heartbeat-only. Every value is derived from the seat's live heartbeat
 * in /api/state (`beat.at` / `beat.note`) against the server clock `now`:
 *   - the presence status dot + badge (Online / Idle / Stale / No heartbeat),
 *   - the freshness ring (decays from a fresh beat toward zero by the WARM
 *     threshold — a live "how recently did this seat check in" gauge),
 *   - the situation line ("Active … ago" or "No heartbeat yet"),
 *   - the expanded last-beat clock + note.
 *
 * A roster seat with no beat renders an honest "no heartbeat yet" state. There
 * is NO fabricated health / PR / CI / commit / token analytics — /api/state
 * seats only carry {seat, at, note}, so that is all this card shows.
 */

type PresenceStyle = {
  label: string
  color: string
  badge: string
}

const PRESENCE: Record<SeatStatus, PresenceStyle> = {
  fresh: {
    label: 'Online',
    color: 'var(--success)',
    badge: 'text-success bg-success/12 border-success/28',
  },
  warm: {
    label: 'Idle',
    color: 'var(--warning)',
    badge: 'text-warning bg-warning/12 border-warning/28',
  },
  stale: {
    label: 'Stale',
    color: 'var(--danger)',
    badge: 'text-danger bg-danger/12 border-danger/28',
  },
  never: {
    label: 'No heartbeat',
    color: 'var(--muted-foreground)',
    badge: 'text-muted-foreground bg-muted border-border',
  },
}

// REAL presence → status-dot color (fresh online, warm idle, stale/never off).
function dotClass(status: SeatStatus): string {
  if (status === 'fresh') return 'bg-success'
  if (status === 'warm') return 'bg-warning'
  if (status === 'stale') return 'bg-danger'
  return 'bg-muted-foreground'
}

// Inset 3px left edge in the presence color (a never-seat reads plain border).
const EDGE: Record<SeatStatus, string> = {
  fresh: 'shadow-[inset_3px_0_0_var(--success)]',
  warm: 'shadow-[inset_3px_0_0_var(--warning)]',
  stale: 'shadow-[inset_3px_0_0_var(--danger)]',
  never: 'shadow-[inset_3px_0_0_var(--border)]',
}

/** Epoch ms → HH:MM:SS (24h) for the expanded last-heartbeat readout. */
function formatBeat(at: number): string {
  const d = new Date(at)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
  const accent = seatAccent(name)
  const label = seatGithubLogin(name)
  const status = seatStatus(beat?.at, now)
  const presence = PRESENCE[status]
  const ring = Math.round(seatFreshnessFraction(beat?.at, now) * 100)
  const situation = beat
    ? `Active ${timeAgo(beat.at, now)} ago`
    : 'No heartbeat yet — awaiting first beat'

  return (
    <Expandable
      open={open}
      onOpenChange={setOpen}
      showChevron={false}
      className={cn(
        'overflow-hidden rounded-lg border bg-card text-card-foreground transition-colors duration-150',
        EDGE[status],
        open ? 'border-input' : 'border-border'
      )}
      headerClassName="flex-col items-stretch gap-3.5 p-4"
      header={(isOpen) => (
        <>
          {/* seat-top: avatar + presence dot · name + badge · freshness ring · chevron */}
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
                  presence.badge
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {presence.label}
              </span>
            </div>

            <RingGauge
              value={ring}
              color={presence.color}
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
            {situation}
          </p>
        </>
      )}
    >
      {/* Expanded: raw heartbeat detail — the only real per-seat data we carry. */}
      <div className="flex flex-col gap-2.5 border-t px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground">
            Last heartbeat
          </span>
          <span className="font-mono text-[0.8rem] text-foreground tabular-nums">
            {beat ? formatBeat(beat.at) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.66rem] uppercase tracking-[0.06em] text-muted-foreground">
            Presence
          </span>
          <span
            className="font-mono text-[0.8rem]"
            style={{ color: presence.color }}
          >
            {presence.label}
          </span>
        </div>
        <div className="flex flex-col gap-[3px]">
          <span className="text-[0.62rem] uppercase tracking-[0.06em] text-muted-foreground">
            Note
          </span>
          <span className="font-mono text-[0.8rem] text-foreground">
            {beat?.note?.trim() ||
              (beat
                ? 'No note on last beat'
                : 'Awaiting first heartbeat from this seat')}
          </span>
        </div>
      </div>
    </Expandable>
  )
}

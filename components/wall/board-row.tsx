'use client'

import * as React from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Expandable } from '@/components/ui/expandable'
import { initials, seatAccent } from '@/lib/board'
import { cn } from '@/lib/utils'

/**
 * Shared building blocks for the twin ranked boards (Leader + Mangooli), ported
 * from the handoff `team-board.html`: `.section-head`/`.tile`/`.count-badge`
 * (BoardHeader), `.medal` (Medal), the per-seat accent `.avatar` (SeatAvatar),
 * and the expandable `.xrow`/`.brd-head`/`.metric-cell` row (BoardRow). The two
 * boards are structurally identical, so both consume these; each board supplies
 * only its own metric node + expanded detail.
 */

// --- rank medal (handoff `.medal.{gold,silver,bronze,none}`) ----------------
const MEDAL_STYLE: Record<'gold' | 'silver' | 'bronze', React.CSSProperties> = {
  gold: {
    background: 'linear-gradient(160deg, #ffe486, #ffd700 55%, #d9af12)',
    color: '#171207',
  },
  silver: {
    background: 'linear-gradient(160deg, #eef1f4, #c0c0c0 55%, #9aa0a6)',
    color: '#171207',
  },
  bronze: {
    background: 'linear-gradient(160deg, #e6a56b, #cd7f32 55%, #9c5c22)',
    color: '#21140a',
  },
}

function medalKey(rank: number): keyof typeof MEDAL_STYLE | null {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return null
}

/** Rank medal — gold/silver/bronze gradient chip, or a plain muted number. */
export function Medal({ rank }: { rank: number }) {
  const key = medalKey(rank)
  const base =
    'grid size-8 flex-none place-items-center rounded-full font-mono text-[0.86rem] tabular-nums'

  if (!key) {
    return (
      <span
        className={cn(
          base,
          'border border-border bg-muted font-semibold text-muted-foreground'
        )}
      >
        {rank}
      </span>
    )
  }

  return (
    <span
      className={cn(
        base,
        'font-bold shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.3)]'
      )}
      style={MEDAL_STYLE[key]}
    >
      {rank}
    </span>
  )
}

/** Per-seat identity avatar — accent ring + accent initials (matches seat-grid). */
export function SeatAvatar({ seat }: { seat: string }) {
  const accent = seatAccent(seat)
  return (
    <Avatar
      className="size-9 flex-none"
      style={{ boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${accent}` }}
    >
      <AvatarFallback
        className="font-mono text-[0.72rem]"
        style={{ color: accent }}
      >
        {initials(seat)}
      </AvatarFallback>
    </Avatar>
  )
}

// --- section header (handoff `.section-head` + `.tile` + `.count-badge`) -----
const TILE_TONE = {
  teal: 'border-primary/30 bg-primary/10 text-primary',
  amber: 'border-warning/25 bg-warning/15 text-warning',
} as const

export type BoardHeaderProps = {
  icon: React.ReactNode
  tone: keyof typeof TILE_TONE
  title: string
  sub: string
  /** Right-aligned count badge value (bold) + unit. */
  count: number
  unit: string
}

export function BoardHeader({
  icon,
  tone,
  title,
  sub,
  count,
  unit,
}: BoardHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid size-[38px] flex-none place-items-center rounded-[10px] border',
            TILE_TONE[tone]
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          <p className="mt-[3px] text-[0.82rem] leading-tight text-muted-foreground">
            {sub}
          </p>
        </div>
      </div>
      <span className="whitespace-nowrap rounded-full border border-border bg-muted px-[11px] py-[5px] font-mono text-[0.8rem] text-muted-foreground">
        <b className="font-semibold text-foreground">{count}</b> {unit}
      </span>
    </div>
  )
}

// --- expandable ranked row (handoff `.xrow` / `.brd-head` / `.metric-cell`) --
export type BoardRowProps = {
  rank: number
  seat: string
  subline: string
  /** The big, pre-colored headline metric (PRs merged / mango pts). */
  metric: React.ReactNode
  /** Uppercase unit under the metric. */
  unit: string
  /** Worst row (#1 breaker) — rose-tinted background, kept even when open. */
  worst?: boolean
  /** Expanded detail (tiles or bars); carries its own left-indented padding. */
  children: React.ReactNode
}

export function BoardRow({
  rank,
  seat,
  subline,
  metric,
  unit,
  worst = false,
  children,
}: BoardRowProps) {
  return (
    <Expandable
      className={cn(
        'rounded-[10px] border-b border-border last:border-b-0',
        worst ? 'bg-danger/[0.06]' : 'data-[open=true]:bg-white/[0.02]'
      )}
      headerClassName="grid grid-cols-[34px_1fr_auto_auto] items-center gap-3 px-1.5 py-[11px]"
      header={
        <>
          <Medal rank={rank} />
          <div className="flex min-w-0 items-center gap-[11px]">
            <SeatAvatar seat={seat} />
            <div className="flex min-w-0 flex-col gap-px">
              <span className="truncate font-mono text-[0.95rem] font-semibold text-foreground">
                {seat}
              </span>
              <span className="truncate font-mono text-[0.7rem] text-muted-foreground">
                {subline}
              </span>
            </div>
          </div>
          <span className="flex flex-col items-end gap-px">
            {metric}
            <span className="text-[0.6rem] uppercase tracking-[0.05em] text-muted-foreground">
              {unit}
            </span>
          </span>
        </>
      }
    >
      {children}
    </Expandable>
  )
}

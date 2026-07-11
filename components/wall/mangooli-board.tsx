'use client'

import { TriangleAlert } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Meter } from '@/components/ui/meter'
import { BoardHeader, BoardRow } from '@/components/wall/board-row'
import { cn } from '@/lib/utils'

/**
 * Mangooli Board — ranks by breakage (handoff `team-board.html` lines
 * 1988–2031). Structurally identical to the Leader Board but celebrates chaos:
 * an alert-triangle icon (NOT a flame), a "mango pts" metric colored --warning
 * (or --danger on the #1 worst row, which also gets a rose-tinted background),
 * and an expanded detail of 4 breakdown bars (via `Meter`): Builds broken,
 * Merge collisions, Abandoned claims, CI failures.
 *
 * DATA: REAL — breakage aggregates from /api/scoreboard (builds broken + CI
 * failures, attributed via the Actions API). Merge collisions + abandoned
 * claims have no clean GitHub source yet and read 0. Empty until the first poll
 * and while the brand-new repo has no failures, when a zero-state renders.
 */
export type MangoRow = {
  /** 1-based rank (1 = worst). */
  rank: number
  /** Roster handle → avatar accent + initials. */
  seat: string
  /** Headline metric; --warning, or --danger when `worst`. */
  mangoPts: number
  /** True for the #1 worst row: rose-tinted bg + danger score. */
  worst: boolean
  /** Small line under the name, e.g. "4 builds · 6 CI fails". */
  subline: string
  buildsBroken: number
  mergeCollisions: number
  abandonedClaims: number
  ciFailures: number
}

export type MangooliBoardProps = {
  rows: MangoRow[]
}

/** Breakdown bar colors, verbatim from the handoff `.mg-bar .lb-bar-fill`. */
const BAR_COLOR = {
  buildsBroken: '#fb7185',
  mergeCollisions: '#fbbf24',
  abandonedClaims: '#a78bfa',
  ciFailures: '#4d8dff',
} as const

const BARS: { key: keyof typeof BAR_COLOR; label: string }[] = [
  { key: 'buildsBroken', label: 'Builds broken' },
  { key: 'mergeCollisions', label: 'Merge collisions' },
  { key: 'abandonedClaims', label: 'Abandoned claims' },
  { key: 'ciFailures', label: 'CI failures' },
]

export function MangooliBoard({ rows }: MangooliBoardProps) {
  const totalPts = rows.reduce((sum, r) => sum + r.mangoPts, 0)
  const ordered = [...rows].sort((a, b) => a.rank - b.rank)

  // Single shared scale across every breakdown value (mirrors the prototype's
  // fixed per-unit widths): the largest single count fills its bar, the rest
  // read proportionally. Guard against an all-zero board.
  const maxVal = Math.max(
    1,
    ...rows.flatMap((r) => [
      r.buildsBroken,
      r.mergeCollisions,
      r.abandonedClaims,
      r.ciFailures,
    ])
  )

  return (
    <Card className="gap-0 p-4">
      <BoardHeader
        icon={<TriangleAlert className="size-[19px]" />}
        tone="amber"
        title="Mangooli Board"
        sub="Who breaks the most · click a row"
        count={totalPts}
        unit="incidents"
      />
      {ordered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-border bg-muted text-muted-foreground">
            <TriangleAlert className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Nothing broken yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              A clean board. Broken builds and CI failures land here the moment
              they happen.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {ordered.map((row) => (
            <BoardRow
              key={row.seat}
              rank={row.rank}
              seat={row.seat}
              subline={row.subline}
              unit="mango pts"
              worst={row.worst}
              metric={
                <span
                  className={cn(
                    'font-mono text-[1.25rem] font-extrabold leading-none tabular-nums',
                    row.worst ? 'text-danger' : 'text-warning'
                  )}
                >
                  {row.mangoPts}
                </span>
              }
            >
              <div className="flex flex-col gap-[9px] pt-1 pr-1.5 pb-3.5 pl-[42px]">
                {BARS.map((bar) => {
                  const value = row[bar.key]
                  return (
                    <Meter
                      key={bar.key}
                      label={bar.label}
                      value={(value / maxVal) * 100}
                      color={BAR_COLOR[bar.key]}
                      display={
                        <span className="text-[0.8rem] text-foreground tabular-nums">
                          {value}
                        </span>
                      }
                      className="grid-cols-[116px_1fr_auto] gap-2.5"
                    />
                  )
                })}
              </div>
            </BoardRow>
          ))}
        </div>
      )}
    </Card>
  )
}

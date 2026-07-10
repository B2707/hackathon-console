'use client'

import { Card } from '@/components/ui/card'

/**
 * Mangooli Board — ranks by breakage (handoff `team-board.html` lines
 * 1988–2031). Structurally identical to the Leader Board but celebrates chaos:
 * an alert-triangle icon (NOT a flame), a "mango pts" metric colored --warning
 * (or --danger on the #1 worst row, which also gets a rose-tinted background),
 * and an expanded detail of 4 breakdown bars: Builds broken, Merge collisions,
 * Abandoned claims, CI failures.
 *
 * DATA: all SAMPLE for now (lib/sample.SAMPLE_MANGOOLI). // TODO: GitHub
 * aggregate API (Actions runs, merge conflicts, abandoned claim labels).
 *
 * STUB: renders the section header only.
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

export function MangooliBoard({ rows }: MangooliBoardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-warning/25 bg-warning/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Mangooli Board
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rows.length} ranked · <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

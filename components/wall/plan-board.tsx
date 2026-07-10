'use client'

import { Card } from '@/components/ui/card'
import type { Board } from '@/lib/types'

/**
 * Plan & Board — progress toward the demo + the work board (handoff
 * `team-board.html` lines 2265–2596). Header shows a right-aligned completion %
 * and "N of 6 · ETA ...". A row of 5 KPI stat cards (each with a hover
 * sparkline), a filter input + a Board / Plan / Table view toggle, then the
 * active view:
 *   - Board: 4 kanban columns (Backlog / In Progress / In Review / Done) of
 *     expandable cards, each with a status badge + View on GitHub button.
 *   - Plan: a vertical stepper of the 6 demo milestones.
 *   - Table: a projects table (Project · Repo · Team · Tech · Created ·
 *     Contributors · Status).
 *
 * DATA: kanban cards + table rows derive from REAL `board.issues` / `board.prs`
 * (use lib/board's LANES / laneFor / issuesByLane). The completion %, ETA, the
 * KPI values + series, and the Plan milestones are SAMPLE — seam them with
 * `// TODO: real data`.
 *
 * STUB: renders the section header only.
 */
export type PlanBoardProps = {
  board: Board | null
  now: number
}

export function PlanBoard({ board }: PlanBoardProps) {
  const issues = board?.issues.length ?? 0
  const prs = board?.prs.length ?? 0

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-violet/25 bg-violet/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Plan &amp; Board
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {issues} issues · {prs} PRs ·{' '}
            <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

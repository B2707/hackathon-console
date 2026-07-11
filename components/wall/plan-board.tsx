'use client'

import * as React from 'react'
import { Search, SquareCheckBig } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Board } from '@/lib/types'
import { buildKpis, type Kpi } from './plan-data'
import { PlanKanban } from './plan-kanban'
import { PlanTable } from './plan-table'

/**
 * Plan & Board — the live work board (handoff `team-board.html` lines
 * 2265–2596). A header (violet checklist tile + title + a real open-item count)
 * over a row of 5 board-derived KPI stat cards, a filter + a Board / Table view
 * toggle, then the active view. The view toggle, the card-expand, and the
 * filter are React state (not DOM).
 *
 * REAL — every number derives from `board` (/api/state issues + PRs): the KPI
 * cards, the open-item count, the kanban Backlog/In Progress/In Review columns,
 * and the whole Table view. There is no fixed completion %/ETA and no Plan
 * (milestone) view: neither has a real source, so neither is shown.
 */
export type PlanBoardProps = {
  board: Board | null
  now: number
}

type PlanView = 'board' | 'table'

const VIEWS: { value: PlanView; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'table', label: 'Table' },
]

export function PlanBoard({ board }: PlanBoardProps) {
  const [view, setView] = React.useState<PlanView>('board')
  const [filter, setFilter] = React.useState('')

  const kpis = React.useMemo(() => buildKpis(board), [board])
  const openItems = (board?.issues.length ?? 0) + (board?.prs.length ?? 0)

  return (
    <Card className="gap-[18px] p-5">
      {/* Header: checklist tile + title + a real open-item count. */}
      <div className="flex items-start justify-between gap-[18px]">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[10px] border border-violet/30 bg-violet/15 text-violet">
            <SquareCheckBig className="size-[19px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.06rem] font-[650] leading-tight tracking-[-0.01em] text-foreground">
              Plan &amp; Board
            </h2>
            <p className="mt-[3px] text-[0.82rem] text-muted-foreground">
              Issues &amp; pull requests in flight
            </p>
          </div>
        </div>

        <div className="flex flex-none flex-col items-end gap-0.5">
          <span className="font-mono text-[1.9rem] font-extrabold leading-none text-foreground tabular-nums">
            {openItems}
          </span>
          <span className="font-mono text-[0.72rem] text-muted-foreground">
            open item{openItems === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* KPI stat cards. */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Toolbar: filter + Board / Plan / Table toggle. */}
      <div className="flex items-center justify-between gap-3.5">
        <div className="relative w-full max-w-[340px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="pl-8"
          />
        </div>

        <div className="inline-flex flex-none gap-0.5 rounded-[9px] border border-border bg-muted p-[3px]">
          {VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view === item.value}
              onClick={() => setView(item.value)}
              className={cn(
                'cursor-pointer rounded-[7px] px-[11px] py-[5px] font-mono text-[0.72rem] font-semibold tracking-[0.04em] transition-colors',
                view === item.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active view. */}
      {view === 'board' && <PlanKanban board={board} filter={filter} />}
      {view === 'table' && (
        <PlanTable issues={board?.issues ?? []} prs={board?.prs ?? []} filter={filter} />
      )}
    </Card>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-popover px-4 py-[15px]">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {kpi.label}
      </span>
      <span
        className="font-mono text-[1.7rem] font-bold leading-none tabular-nums"
        style={{ color: kpi.color }}
      >
        {kpi.value}
      </span>
    </div>
  )
}

'use client'

import { Activity, LayoutDashboard, Table2, TriangleAlert } from 'lucide-react'

import { AnimeNavBar } from '@/components/ui/anime-navbar'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { ActivityBeams } from './activity-beams'
import { BoardPanel } from './board-panel'
import { KpiGauges } from './kpi-gauges'
import { SeatHealth } from './seat-health'
import { WallHeader } from './wall-header'
import { WallSkeleton } from './wall-skeleton'
import type { StateResponse } from '@/lib/types'

const NAV_ITEMS = [
  { name: 'Wall', url: '#wall', icon: LayoutDashboard },
  { name: 'Board', url: '#board', icon: Table2 },
  { name: 'Activity', url: '#activity', icon: Activity },
]

type WallProps = {
  data: StateResponse | null
  error: string | null
  isSyncing: boolean
  onRefresh: () => void
}

export function Wall({ data, error, isSyncing, onRefresh }: WallProps) {
  const surfacedError =
    error ??
    (data?.reconcileError ? `reconcile: ${data.reconcileError}` : null)

  const now = data?.now ?? Date.now()
  const seats = data?.seats ?? []
  const issues = data?.board?.issues ?? []
  const prs = data?.board?.prs ?? []

  return (
    <div className="relative min-h-screen scroll-smooth">
      <BackgroundPaths className="fixed opacity-60" />
      <AnimeNavBar items={NAV_ITEMS} defaultActive="Wall" />

      <div className="relative z-10 mx-auto flex max-w-[1800px] flex-col gap-6 px-4 pb-16 pt-24 sm:px-6">
        <WallHeader
          repo={data?.repo ?? null}
          boardFetchedAt={data?.board?.fetchedAt}
          now={now}
          isSyncing={isSyncing}
          onRefresh={onRefresh}
        />

        {surfacedError && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            <TriangleAlert className="size-4 shrink-0" />
            <span className="truncate">{surfacedError}</span>
          </div>
        )}

        {!data ? (
          <WallSkeleton />
        ) : (
          <>
            <section id="wall" aria-label="key metrics">
              <KpiGauges seats={seats} issues={issues} prs={prs} now={now} />
            </section>

            <section aria-label="seat health">
              <SeatHealth seats={seats} now={now} />
            </section>

            <section id="activity" aria-label="activity flow">
              <ActivityBeams seats={seats} repo={data.repo} now={now} />
            </section>

            <section id="board" aria-label="board">
              <BoardPanel issues={issues} prs={prs} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

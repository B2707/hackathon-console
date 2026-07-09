'use client'

import { BoardLanes } from './board-lanes'
import { DashboardSkeleton } from './dashboard-skeleton'
import { KpiRow } from './kpi-row'
import { PrsPanel } from './prs-panel'
import { SeatGrid } from './seat-grid'
import { TickerFeed } from './ticker-feed'
import { TopBar } from './top-bar'
import type { StateResponse } from '@/lib/types'

type ConsoleShellProps = {
  data: StateResponse | null
  error: string | null
  isSyncing: boolean
  onReset: () => void
}

export function ConsoleShell({
  data,
  error,
  isSyncing,
  onReset,
}: ConsoleShellProps) {
  // reconcileError surfaces in the top bar alongside any transport error.
  const surfacedError =
    error ??
    (data?.reconcileError ? `reconcile: ${data.reconcileError}` : null)

  if (!data) {
    // First load (or an error before any data): keep the bar reachable so the
    // error shows and the title stays clickable to reset the key.
    return (
      <div className="min-h-screen">
        <TopBar
          repo={null}
          now={Date.now()}
          error={surfacedError}
          isSyncing={isSyncing}
          onReset={onReset}
        />
        <DashboardSkeleton />
      </div>
    )
  }

  const now = data.now
  const seats = data.seats ?? []
  const issues = data.board?.issues ?? []
  const prs = data.board?.prs ?? []
  const ticker = data.ticker ?? []

  return (
    <div className="min-h-screen">
      <TopBar
        repo={data.repo}
        boardFetchedAt={data.board?.fetchedAt}
        now={now}
        error={surfacedError}
        isSyncing={isSyncing}
        onReset={onReset}
      />

      <main className="mx-auto flex max-w-[1800px] flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <KpiRow seats={seats} issues={issues} prs={prs} now={now} />

        <section aria-label="seat health">
          <SeatGrid seats={seats} now={now} />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <section aria-label="board">
              <BoardLanes issues={issues} />
            </section>
            <section aria-label="pull requests">
              <PrsPanel prs={prs} />
            </section>
          </div>
          <aside aria-label="activity feed">
            <TickerFeed ticker={ticker} now={now} />
          </aside>
        </div>
      </main>
    </div>
  )
}

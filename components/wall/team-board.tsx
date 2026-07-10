'use client'

import { BackgroundCanvas } from './background-canvas'
import { EventLog } from './event-log'
import { Hero } from './hero'
import { LeaderBoard } from './leader-board'
import { LiveAlerts } from './live-alerts'
import { MangooliBoard } from './mangooli-board'
import { PlanBoard } from './plan-board'
import { SystemGraph } from './system-graph'
import { TeamSeats } from './team-seats'
import { TweaksPanel } from './tweaks-panel'
import { mapTickerToEvents } from '@/lib/event-log'
import { SAMPLE_LEADERBOARD, SAMPLE_MANGOOLI } from '@/lib/sample'
import type { StateResponse } from '@/lib/types'

/**
 * Team Board shell — the top-level composition for the mission-control wall.
 *
 * Lays the sections out in the handoff's order and threads the real /api/state
 * payload into each panel (deriving where the panels need it). The Leader /
 * Mangooli boards are fed SAMPLE data (lib/sample) until their GitHub-aggregate
 * feeds exist; every other panel receives real data. See each panel file for
 * its prop contract + real-vs-sample seams.
 */
export type TeamBoardProps = {
  data: StateResponse | null
  error: string | null
  /** True while a poll is in flight (drives the hero live shimmer). */
  isSyncing: boolean
  /** Force an immediate re-poll. */
  onRefresh: () => void
}

export function TeamBoard({
  data,
  error,
  isSyncing,
  onRefresh,
}: TeamBoardProps) {
  const surfacedError =
    error ??
    (data?.reconcileError ? `reconcile: ${data.reconcileError}` : null)

  // Derive once, defaulting so the wall renders immediately (before first poll).
  const now = data?.now ?? Date.now()
  const repo = data?.repo ?? null
  const seats = data?.seats ?? []
  const alerts = data?.alerts ?? []
  const board = data?.board ?? null
  const events = mapTickerToEvents(data?.ticker ?? [])

  return (
    <div className="relative min-h-screen scroll-smooth">
      {/* Fixed decorative layer (below content). Body gradient is in globals.css. */}
      <BackgroundCanvas />

      <div className="wall relative z-[1] mx-auto flex max-w-[1440px] flex-col gap-7 px-10 pb-[90px] pt-[30px] max-md:px-[18px]">
        <Hero
          repo={repo}
          now={now}
          boardFetchedAt={board?.fetchedAt}
          isSyncing={isSyncing}
          onRefresh={onRefresh}
        />

        {surfacedError && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            <svg
              viewBox="0 0 24 24"
              className="size-4 flex-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="truncate">{surfacedError}</span>
          </div>
        )}

        <TeamSeats seats={seats} now={now} />

        {/* Duo row: Leader Board | Mangooli Board (stacks ≤1000px). */}
        <div className="duo-row grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <LeaderBoard rows={SAMPLE_LEADERBOARD} />
          <MangooliBoard rows={SAMPLE_MANGOOLI} />
        </div>

        <LiveAlerts alerts={alerts} now={now} />

        <PlanBoard board={board} now={now} />

        <SystemGraph
          seats={seats}
          alerts={alerts}
          ticker={data?.ticker ?? []}
          repo={repo}
          now={now}
        />

        <EventLog events={events} />
      </div>

      {/* Host-integrated tweaks (hidden by default). */}
      <TweaksPanel />
    </div>
  )
}

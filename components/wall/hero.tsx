'use client'

import { ArrowRight, Zap } from 'lucide-react'
import { timeAgo } from '@/lib/board'

/**
 * Hero — identity + live status (handoff `team-board.html` lines 1808–1832).
 *
 * Centered column: a pill badge (HACKATHON chip + context + arrow), the gradient
 * mono wordmark "Team Board" (a button that forces a re-poll), and a live meta
 * row (pulsing Live/Syncing indicator · repo · "board Nm ago"). Real data only.
 */
export type HeroProps = {
  /** Repo slug, e.g. "B2707/hackathon-console" (real, from /api/state). */
  repo: string | null
  /** Server clock (epoch ms) for relative timestamps. */
  now: number
  /** When the board snapshot was fetched (epoch ms) — powers "board Nm ago". */
  boardFetchedAt?: number
  /** True while a poll is in flight — swaps the live indicator to "Syncing…". */
  isSyncing: boolean
  /** Force an immediate re-poll (wired to the wordmark click). */
  onRefresh: () => void
}

export function Hero({
  repo,
  now,
  boardFetchedAt,
  isSyncing,
  onRefresh,
}: HeroProps) {
  return (
    <header className="flex flex-col items-center gap-4 pb-[6px] pt-[22px] text-center">
      {/* Pill badge: HACKATHON chip + context + arrow. */}
      <div className="inline-flex items-center gap-[9px] rounded-full border border-border bg-[rgba(18,24,32,0.72)] py-1.5 pl-1.5 pr-2 text-[0.78rem] text-muted-foreground shadow-[var(--shadow-sm)]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(77,141,255,0.26)] bg-[rgba(77,141,255,0.12)] px-[9px] py-[3px] font-mono text-[0.7rem] font-semibold tracking-[0.04em] text-primary">
          <Zap className="size-3" strokeWidth={2.2} />
          HACKATHON
        </span>
        <span>Console for B2707/hackathon-team-template</span>
        <span className="inline-flex text-muted-foreground">
          <ArrowRight className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      {/* Gradient wordmark — click to force an immediate board re-poll. */}
      <h1 className="contents">
        <button
          type="button"
          title="click to refresh"
          onClick={onRefresh}
          className="cursor-pointer rounded-lg border-0 bg-gradient-to-b from-[#f2f7fc] to-[#b9c8da] bg-clip-text p-0 font-mono text-[3.1rem] font-extrabold leading-none tracking-[-0.03em] text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Team Board
        </button>
      </h1>

      {/* Live status meta row. */}
      <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2.5 text-[0.82rem]">
        <span className="inline-flex items-center gap-[7px] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-success">
          <span className="size-2 animate-[soft-pulse_2s_ease-in-out_infinite] rounded-full bg-success shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" />
          {isSyncing ? 'Syncing…' : 'Live'}
        </span>
        <span className="text-border">·</span>
        <span className="font-mono text-muted-foreground">
          {repo ?? 'no repo yet'}
        </span>
        {boardFetchedAt != null && (
          <>
            <span className="text-border">·</span>
            <span className="text-muted-foreground">
              board {timeAgo(boardFetchedAt, now)} ago
            </span>
          </>
        )}
      </div>
    </header>
  )
}

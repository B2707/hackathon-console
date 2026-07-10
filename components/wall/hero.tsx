'use client'

/**
 * Hero — identity + live status (handoff `team-board.html` lines 1808–1832).
 *
 * STUB: renders the wordmark + a minimal meta row. The panel agent builds the
 * pill badge, gradient wordmark, pulsing Live dot, and "board Nm ago" meta.
 */
export type HeroProps = {
  /** Repo slug, e.g. "B2707/hackathon-console" (real, from /api/state). */
  repo: string | null
  /** Server clock (epoch ms) for relative timestamps. */
  now: number
  /** When the board snapshot was fetched (epoch ms) — powers "board Nm ago". */
  boardFetchedAt?: number
  /** True while a poll is in flight — drives the shimmer on the live indicator. */
  isSyncing: boolean
  /** Force an immediate re-poll (wire to the wordmark/logo click). */
  onRefresh: () => void
}

export function Hero({ repo }: HeroProps) {
  return (
    <header className="flex flex-col items-center gap-3 py-6 text-center">
      <h1 className="bg-gradient-to-b from-[#f2f7fc] to-[#b9c8da] bg-clip-text font-mono text-[3.1rem] font-extrabold leading-none tracking-[-0.03em] text-transparent">
        Team Board
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
        <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-success">
          <span className="size-2 rounded-full bg-success" />
          Live
        </span>
        <span className="text-border">·</span>
        <span className="font-mono text-muted-foreground">{repo ?? '—'}</span>
        <span className="text-border">·</span>
        <span className="text-primary">building</span>
      </div>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'

import type { LeaderRow } from '@/components/wall/leader-board'
import type { MangoRow } from '@/components/wall/mangooli-board'

export type ScoreboardData = {
  fetchedAt: number
  repo: string | null
  leaderboard: LeaderRow[]
  mangooli: MangoRow[]
  /** Roster seats with a real GitHub handle configured. */
  configured: string[]
  error?: string
}

// Aggregates move slowly (a hackathon's worth of PRs/commits) and the route
// caches for minutes, so a slow poll is plenty — no need to match the 15s wall.
const SCOREBOARD_POLL_MS = 60_000

/**
 * Polls the read-only /api/scoreboard for GitHub-derived Leader/Mangooli rows.
 * Returns null until the first response; the boards render their zero-state
 * meanwhile (and whenever the aggregates are empty).
 */
export function useScoreboard(): ScoreboardData | null {
  const [data, setData] = useState<ScoreboardData | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/scoreboard', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as ScoreboardData
        if (alive) setData(json)
      } catch {
        // Keep the last good value (or null → boards show their zero-state).
      }
    }
    load()
    const timer = setInterval(load, SCOREBOARD_POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  return data
}

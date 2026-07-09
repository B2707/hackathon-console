'use client'

import { useCallback, useEffect, useState } from 'react'

import { POLL_MS } from '@/lib/board'
import type { StateResponse } from '@/lib/types'

export type TeamState = {
  data: StateResponse | null
  error: string | null
  /** Presentational only: true while a poll request is in flight. */
  isSyncing: boolean
  /** Force an immediate re-poll (wired to the header logo click). */
  refresh: () => void
}

/**
 * Public polling for the wall. The read path is unauthenticated: it polls
 * /api/state every POLL_MS with no secret header. The write endpoints
 * (heartbeat + webhook) remain authenticated server-side.
 */
export function useTeamState(): TeamState {
  const [data, setData] = useState<StateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const load = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) {
        setError(`state fetch failed: ${res.status}`)
        return
      }
      setData((await res.json()) as StateResponse)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'network error')
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  return { data, error, isSyncing, refresh: load }
}

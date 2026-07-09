'use client'

import { useCallback, useEffect, useState } from 'react'

import { KEY_STORAGE, POLL_MS } from '@/lib/board'
import type { StateResponse } from '@/lib/types'

export type TeamState = {
  keyLoaded: boolean
  teamKey: string | null
  data: StateResponse | null
  error: string | null
  /** Presentational only: true while a poll request is in flight. */
  isSyncing: boolean
  unlock: (key: string) => void
  reset: () => void
}

/**
 * Auth + polling for the wall. Behaviour is identical to the original page.tsx:
 * accept /?key=… once, persist to localStorage, scrub the URL, then poll
 * /api/state every POLL_MS with the x-team-secret header.
 */
export function useTeamState(): TeamState {
  const [teamKey, setTeamKey] = useState<string | null>(null)
  const [keyLoaded, setKeyLoaded] = useState(false)
  const [data, setData] = useState<StateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Accept /?key=… once, persist to localStorage, then scrub it from the URL
  // so the secret never lives in a shareable/bookmarkable address.
  useEffect(() => {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('key')
    if (fromUrl) {
      localStorage.setItem(KEY_STORAGE, fromUrl)
      url.searchParams.delete('key')
      window.history.replaceState(null, '', url.toString())
    }
    setTeamKey(localStorage.getItem(KEY_STORAGE))
    setKeyLoaded(true)
  }, [])

  const load = useCallback(async (key: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/state', {
        headers: { 'x-team-secret': key },
        cache: 'no-store',
      })
      if (res.status === 401) {
        setError('key rejected — click header to reset')
        return
      }
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
    if (!teamKey) return
    load(teamKey)
    const timer = setInterval(() => load(teamKey), POLL_MS)
    return () => clearInterval(timer)
  }, [teamKey, load])

  const unlock = useCallback((key: string) => {
    localStorage.setItem(KEY_STORAGE, key)
    setTeamKey(key)
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(KEY_STORAGE)
    setTeamKey(null)
    setData(null)
  }, [])

  return { keyLoaded, teamKey, data, error, isSyncing, unlock, reset }
}

'use client'

import { ConsoleShell } from '@/components/console/console-shell'
import { useTeamState } from '@/hooks/use-team-state'

export default function Wall() {
  const { data, error, isSyncing, refresh } = useTeamState()

  // The wall is a public, read-only view — it renders immediately and polls
  // /api/state with no team key. Write endpoints stay authenticated server-side.
  return (
    <ConsoleShell
      data={data}
      error={error}
      isSyncing={isSyncing}
      onReset={refresh}
    />
  )
}

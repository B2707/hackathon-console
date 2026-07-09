'use client'

import { Wall } from '@/components/wall/wall'
import { useTeamState } from '@/hooks/use-team-state'

export default function WallPage() {
  const { data, error, isSyncing, refresh } = useTeamState()

  // The wall is a public, read-only view — it renders immediately and polls
  // /api/state with no team key. Write endpoints stay authenticated server-side.
  return (
    <Wall
      data={data}
      error={error}
      isSyncing={isSyncing}
      onRefresh={refresh}
    />
  )
}

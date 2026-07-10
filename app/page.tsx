'use client'

import { TeamBoard } from '@/components/wall/team-board'
import { useScoreboard } from '@/hooks/use-scoreboard'
import { useTeamState } from '@/hooks/use-team-state'

export default function TeamBoardPage() {
  const { data, error, isSyncing, refresh } = useTeamState()
  // Second, slower feed: GitHub-derived Leader/Mangooli rows (null until first
  // response → the wall shows SAMPLE data meanwhile). Also public/read-only.
  const scoreboard = useScoreboard()

  // The wall is a public, read-only view — it renders immediately and polls
  // /api/state with no team key. Write endpoints stay authenticated server-side.
  return (
    <TeamBoard
      data={data}
      error={error}
      isSyncing={isSyncing}
      onRefresh={refresh}
      scoreboard={scoreboard}
    />
  )
}

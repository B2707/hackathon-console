'use client'

import { ConsoleShell } from '@/components/console/console-shell'
import { KeyGate } from '@/components/console/key-gate'
import { useTeamState } from '@/hooks/use-team-state'

export default function Wall() {
  const { keyLoaded, teamKey, data, error, isSyncing, unlock, reset } =
    useTeamState()

  // Avoid a flash of the gate before localStorage is read (matches original).
  if (!keyLoaded) return null

  if (!teamKey) return <KeyGate onSubmit={unlock} />

  return (
    <ConsoleShell
      data={data}
      error={error}
      isSyncing={isSyncing}
      onReset={reset}
    />
  )
}

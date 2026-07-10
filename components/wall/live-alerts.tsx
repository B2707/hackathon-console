'use client'

import { Card } from '@/components/ui/card'
import type { Alert } from '@/lib/types'

/**
 * Live Alerts — tripwire incidents needing attention (handoff `team-board.html`
 * lines 2034–2109). A vertical list of expandable alert cards: severity tile
 * (P0 danger / P1 warning), a mono wire code (e.g. RED-MAIN), an optional
 * pulsing LIVE shimmer on the freshest, a plain-English headline, a relative
 * timestamp, and a chevron. Expanded reveals a description (with inline <code>
 * for branch/job/file), context chips (repo / branch / owner), and action
 * buttons opening GitHub in a new tab.
 *
 * DATA: REAL — `alerts` come straight from /api/state (the P0/P1 tripwire fires).
 *
 * STUB: renders the section header only. (Prop shape kept as { alerts, now } so
 * the legacy wall.tsx composition still type-checks.)
 */
export type LiveAlertsProps = {
  alerts: Alert[]
  now: number
}

export function LiveAlerts({ alerts }: LiveAlertsProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-danger/25 bg-danger/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Live Alerts
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {alerts.length > 0 ? `${alerts.length} active` : 'all clear'} ·{' '}
            <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

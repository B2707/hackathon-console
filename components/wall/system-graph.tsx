'use client'

import { Card } from '@/components/ui/card'
import type { Alert, SeatBeat } from '@/lib/types'

/**
 * Live System Graph — real-time knowledge graph of agents, tools & CI/CD acting
 * on the repo, plus a streaming event feed (handoff `team-board.html` lines
 * 2195–2263). Layout: a ~1.55fr <canvas> graph + a 1fr side panel (3 pipeline
 * chips: Build / Test / Deploy, and a #activity-stream capped at 7 rows).
 *
 * DATA: node COLORS derive from real state — repo red when a RED-MAIN alert is
 * present, seat nodes colored by presence (from `seats`), the rest fixed. The
 * ordered packet-firing sequence and the pipeline chips are a fixed decorative
 * script the panel OWNS (gated on prefers-reduced-motion and a paused flag).
 *
 * STUB: renders the section header only.
 */
export type SystemGraphProps = {
  seats: SeatBeat[]
  alerts: Alert[]
  repo: string | null
  now: number
}

export function SystemGraph({ seats, alerts }: SystemGraphProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-violet/25 bg-violet/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Live System Graph
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {seats.length} seats · {alerts.length} alerts ·{' '}
            <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { Card } from '@/components/ui/card'
import type { EventLogEntry } from '@/lib/event-log'

// Re-exported so panel-agents implementing this file get the row types alongside
// the props contract. The source of truth is lib/event-log.ts.
export type { EventLogEntry, EventLevel } from '@/lib/event-log'

/**
 * Event Log — raw live stream from the wall daemon (handoff `team-board.html`
 * lines 2111–2193). A segmented filter (ALL / WARN / ERROR) over a monospace
 * table: Time · Level · Seat · Message · Latency. Level badges: INFO (blue),
 * OK (green), WARN (amber), ERROR (red). Clicking a filter shows only matching
 * rows.
 *
 * DATA: REAL — `events` are mapped from the /api/state ticker feed by
 * lib/event-log.mapTickerToEvents (kind→level, text→message, at→time, seat
 * parsed from the text). Latency is a seam (not carried by the ticker).
 *
 * STUB: renders the section header only.
 */
export type EventLogProps = {
  events: EventLogEntry[]
}

export function EventLog({ events }: EventLogProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-primary/25 bg-primary/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Event Log
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {events.length} events · <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

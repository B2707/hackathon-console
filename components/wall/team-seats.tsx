'use client'

import { Card } from '@/components/ui/card'
import type { SeatBeat } from '@/lib/types'

/**
 * Team seats — who is on the team, their health, and what they are doing
 * (handoff `team-board.html` lines 1834–1938).
 *
 * DATA: presence (online / stale / offline + last-seen) is REAL, derived from
 * `seats` via lib/board's seatStatus helpers. Health score, work-status +
 * situation sentence, PR / CI meters, commits / tokens / spend tiles, the
 * commits-per-hour sparkline, and the "Working on" task id are SAMPLE — the
 * panel derives or hardcodes them behind `// TODO: real data` seams
 * (GitHub API for PR/CI/commits, Anthropic Usage API for tokens/spend).
 *
 * STUB: renders the section header only.
 */
export type TeamSeatsProps = {
  seats: SeatBeat[]
  now: number
}

export function TeamSeats({ seats }: TeamSeatsProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-primary/25 bg-primary/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Team
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {seats.length} seats · <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

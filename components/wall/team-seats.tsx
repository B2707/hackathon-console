'use client'

import { Users } from 'lucide-react'

import { SeatCard } from './team-seat-card'
import { ROSTER, seatStatus } from '@/lib/board'
import type { SeatBeat } from '@/lib/types'

/**
 * Team seats — who is on the team, their health, and what they are doing
 * (handoff `team-board.html` lines 1834–1938).
 *
 * Renders the section header (users tile + "Team" + subtitle + a live "N online"
 * indicator counting fresh seats) and a responsive 4-col grid of expandable
 * seat cards — one per roster seat, plus any real seat that shows up outside the
 * roster. Presence (status dot + "active … ago") is REAL, derived from each
 * seat's heartbeat; the rest of each card is SAMPLE (see team-seat-card.tsx).
 */
export type TeamSeatsProps = {
  seats: SeatBeat[]
  now: number
}

export function TeamSeats({ seats, now }: TeamSeatsProps) {
  const seatsByName = new Map(seats.map((s) => [s.seat, s]))
  const extras = Array.from(seatsByName.keys()).filter(
    (name) => !ROSTER.includes(name as (typeof ROSTER)[number])
  )
  const seatNames = [...ROSTER, ...extras]
  const onlineCount = seatNames.filter(
    (name) => seatStatus(seatsByName.get(name)?.at, now) === 'fresh'
  ).length

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[10px] border border-[#60a5fa]/[0.28] bg-[#60a5fa]/[0.14] text-[#60a5fa]">
            <Users className="size-[19px]" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="text-[1.06rem] font-[650] leading-tight tracking-[-0.01em] text-foreground">
              Team
            </h2>
            <p className="mt-[3px] text-[0.82rem] text-muted-foreground">
              Who is working on what · click a seat for analytics
            </p>
          </div>
        </div>
        <span className="inline-flex flex-none items-center gap-[7px] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-success">
          <span className="size-2 flex-none rounded-full bg-success shadow-[0_0_0_3px_rgba(52,211,153,0.18)] motion-safe:animate-[soft-pulse_2s_ease-in-out_infinite]" />
          {onlineCount} online
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-[760px]:grid-cols-1">
        {seatNames.map((name) => (
          <SeatCard
            key={name}
            name={name}
            beat={seatsByName.get(name)}
            now={now}
          />
        ))}
      </div>
    </section>
  )
}

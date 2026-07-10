'use client'

import { motion } from 'framer-motion'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CircularGauge } from './circular-gauge'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import type { SeatBeat } from '@/lib/types'
import {
  ROSTER,
  SEAT_STATUS_LABEL,
  initials,
  seatAccent,
  seatFreshnessFraction,
  seatGithubLogin,
  seatStatus,
  seatStatusTone,
  timeAgo,
  toneBadgeVariant,
  toneVar,
} from '@/lib/board'

type SeatGridProps = {
  seats: SeatBeat[]
  now: number
}

export function SeatGrid({ seats, now }: SeatGridProps) {
  const seatsByName = new Map(seats.map((s) => [s.seat, s]))
  const extras = seats
    .filter((s) => !ROSTER.includes(s.seat as (typeof ROSTER)[number]))
    .map((s) => s.seat)
  const seatNames = [...ROSTER, ...extras]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    >
      {seatNames.map((name) => (
        <motion.div key={name} variants={fadeUpItem}>
          <SeatCard beat={seatsByName.get(name)} name={name} now={now} />
        </motion.div>
      ))}
    </motion.div>
  )
}

function SeatCard({
  beat,
  name,
  now,
}: {
  beat: SeatBeat | undefined
  name: string
  now: number
}) {
  const status = seatStatus(beat?.at, now)
  const tone = seatStatusTone(status)
  const accent = seatAccent(name)
  const fraction = seatFreshnessFraction(beat?.at, now)

  return (
    <Card className="gap-0 p-3">
      <div className="flex items-center gap-3">
        <Avatar
          style={{
            // Per-seat identity accent: inner card gap + accent ring.
            boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${accent}`,
          }}
        >
          <AvatarFallback style={{ color: accent }}>
            {initials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium">
              {seatGithubLogin(name)}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">
            {beat ? `${timeAgo(beat.at, now)} ago` : 'no heartbeat yet'}
          </span>
        </div>

        <CircularGauge
          value={fraction}
          size={38}
          strokeWidth={3.5}
          color={toneVar(tone)}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: toneVar(tone) }}
          />
        </CircularGauge>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Badge variant={toneBadgeVariant(tone)}>{SEAT_STATUS_LABEL[status]}</Badge>
        {beat?.note && (
          <span className="text-muted-foreground truncate text-xs" title={beat.note}>
            {beat.note}
          </span>
        )}
      </div>
    </Card>
  )
}

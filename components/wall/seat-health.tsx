'use client'

import { motion } from 'framer-motion'

import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge, type BadgeColor } from '@/components/ui/heroui-badge'
import { Card } from '@/components/ui/card'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import type { SeatBeat } from '@/lib/types'
import {
  ROSTER,
  type SeatStatus,
  initials,
  seatAccent,
  seatFreshnessFraction,
  seatStatus,
  seatStatusTone,
  timeAgo,
  toneVar,
} from '@/lib/board'

type SeatHealthProps = {
  seats: SeatBeat[]
  now: number
}

// Map the wall's freshness status onto the HeroUI badge's colour + label.
const STATUS_BADGE: Record<SeatStatus, { word: string; color: BadgeColor }> = {
  fresh: { word: 'online', color: 'success' },
  warm: { word: 'stale', color: 'warning' },
  stale: { word: 'offline', color: 'danger' },
  never: { word: 'offline', color: 'danger' },
}

export function SeatHealth({ seats, now }: SeatHealthProps) {
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
  const badge = STATUS_BADGE[status]

  return (
    <Card className="gap-0 p-3">
      <div className="flex items-center gap-3">
        <Badge color={badge.color} variant="soft" placement="bottom-right" size="sm">
          <Badge.Anchor>
            <Avatar
              className="size-11"
              style={{ boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${accent}` }}
            >
              <AvatarImage
                src={`https://github.com/${name}.png?size=88`}
                alt={name}
              />
              <AvatarFallback style={{ color: accent }}>
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          </Badge.Anchor>
          <Badge.Label>{badge.word}</Badge.Label>
        </Badge>

        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm font-medium">{name}</div>
          <span className="text-xs text-muted-foreground">
            {beat ? `${timeAgo(beat.at, now)} ago` : 'no heartbeat yet'}
          </span>
        </div>

        <AnimatedCircularProgressBar
          value={Math.round(fraction * 100)}
          max={100}
          min={0}
          gaugePrimaryColor={toneVar(tone)}
          gaugeSecondaryColor="var(--border)"
          className="size-11 text-[10px]"
        />
      </div>

      {beat?.note && (
        <span
          className="mt-2.5 block truncate text-xs text-muted-foreground"
          title={beat.note}
        >
          {beat.note}
        </span>
      )}
    </Card>
  )
}

'use client'

import * as React from 'react'
import { GitBranch } from 'lucide-react'

import { AnimatedBeam } from '@/components/ui/animated-beam'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import type { SeatBeat } from '@/lib/types'
import {
  ROSTER,
  initials,
  seatAccent,
  seatGithubLogin,
  seatStatus,
  seatStatusTone,
  toneVar,
} from '@/lib/board'

const TEAL = '#2dd4bf'
const MAX_NODES = 6

type ActivityBeamsProps = {
  seats: SeatBeat[]
  repo: string | null
  now: number
}

/**
 * Decorative "activity flow": a beam sweeps from each seat node into a central
 * repo node. Tied to the live seats — one AnimatedBeam per occupied slot, its
 * gradient tinted with that seat's identity accent.
 */
export function ActivityBeams({ seats, repo, now }: ActivityBeamsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const centerRef = React.useRef<HTMLDivElement>(null)
  const slot0 = React.useRef<HTMLDivElement>(null)
  const slot1 = React.useRef<HTMLDivElement>(null)
  const slot2 = React.useRef<HTMLDivElement>(null)
  const slot3 = React.useRef<HTMLDivElement>(null)
  const slot4 = React.useRef<HTMLDivElement>(null)
  const slot5 = React.useRef<HTMLDivElement>(null)
  const slotRefs = [slot0, slot1, slot2, slot3, slot4, slot5]

  const seatsByName = new Map(seats.map((s) => [s.seat, s]))
  const extras = seats
    .filter((s) => !ROSTER.includes(s.seat as (typeof ROSTER)[number]))
    .map((s) => s.seat)
  const names = [...ROSTER, ...extras].slice(0, MAX_NODES)
  const repoShort = repo ? repo.split('/').slice(-1)[0] : 'repo'

  return (
    <Card className="p-4">
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
        Activity flow
      </div>
      <div
        ref={containerRef}
        className="relative flex items-center justify-between gap-6 px-2 py-6"
      >
        <div className="flex flex-col gap-3">
          {names.map((name, i) => {
            const beat = seatsByName.get(name)
            const tone = seatStatusTone(seatStatus(beat?.at, now))
            return (
              <div
                key={name}
                ref={slotRefs[i]}
                className="z-10 flex items-center gap-2 rounded-full border bg-card/80 py-1 pl-1 pr-3 shadow-sm backdrop-blur"
              >
                <Avatar
                  className="size-8"
                  style={{ boxShadow: `0 0 0 2px ${toneVar(tone)}` }}
                >
                  <AvatarImage
                    src={`https://github.com/${seatGithubLogin(name)}.png?size=64`}
                    alt={name}
                  />
                  <AvatarFallback
                    className="text-[10px]"
                    style={{ color: seatAccent(name) }}
                  >
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-mono text-xs">{name}</span>
              </div>
            )
          })}
        </div>

        <div
          ref={centerRef}
          className="z-10 flex flex-col items-center gap-1 rounded-xl border border-primary/40 bg-card px-4 py-3 shadow-md"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <GitBranch className="size-5" />
          </span>
          <span className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
            {repoShort}
          </span>
        </div>

        {names.map((name, i) => (
          <AnimatedBeam
            key={name}
            containerRef={containerRef}
            fromRef={slotRefs[i]}
            toRef={centerRef}
            curvature={(i - (names.length - 1) / 2) * 24}
            duration={4 + i * 0.5}
            delay={i * 0.35}
            pathColor="var(--border)"
            pathWidth={2}
            pathOpacity={0.15}
            gradientStartColor={seatAccent(name)}
            gradientStopColor={TEAL}
          />
        ))}
      </div>
    </Card>
  )
}

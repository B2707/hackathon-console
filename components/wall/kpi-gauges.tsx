'use client'

import { motion } from 'framer-motion'
import { GitPullRequest, Layers, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Card } from '@/components/ui/card'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import type { BoardIssue, BoardPr, SeatBeat } from '@/lib/types'
import {
  LANES,
  ROSTER,
  type Tone,
  issuesByLane,
  seatStatus,
  toneVar,
} from '@/lib/board'

type KpiGaugesProps = {
  seats: SeatBeat[]
  issues: BoardIssue[]
  prs: BoardPr[]
  now: number
}

function ratioTone(ratio: number): Tone {
  if (ratio >= 0.66) return 'success'
  if (ratio >= 0.34) return 'warning'
  return 'danger'
}

export function KpiGauges({ seats, issues, prs, now }: KpiGaugesProps) {
  const totalSeats = new Set([...ROSTER, ...seats.map((s) => s.seat)]).size
  const freshCount = seats.filter(
    (s) => seatStatus(s.at, now) === 'fresh'
  ).length
  const freshRatio = totalSeats ? freshCount / totalSeats : 0

  const byLane = issuesByLane(issues)
  const activeIssueLanes = LANES.filter((l) => byLane[l].length > 0).length
  const activeLanes = activeIssueLanes + (prs.length > 0 ? 1 : 0)
  const totalLanes = LANES.length + 1

  const prCap = Math.max(6, prs.length)

  const gauges: {
    icon: LucideIcon
    label: string
    sub: string
    value: number
    max: number
    tone: Tone
  }[] = [
    {
      icon: Users,
      label: 'Seats fresh',
      sub: `${freshCount}/${totalSeats}`,
      value: Math.round(freshRatio * 100),
      max: 100,
      tone: ratioTone(freshRatio),
    },
    {
      icon: GitPullRequest,
      label: 'PRs in flight',
      sub: `${prs.length}`,
      value: prs.length,
      max: prCap,
      tone: 'primary',
    },
    {
      icon: Layers,
      label: 'Lanes filled',
      sub: `${activeLanes}/${totalLanes}`,
      value: activeLanes,
      max: totalLanes,
      tone: 'primary',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {gauges.map((g) => (
        <motion.div key={g.label} variants={fadeUpItem}>
          <Card className="flex-row items-center gap-4 p-4">
            <AnimatedCircularProgressBar
              value={g.value}
              max={g.max}
              min={0}
              gaugePrimaryColor={toneVar(g.tone)}
              gaugeSecondaryColor="var(--border)"
              className="size-20 text-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <g.icon className="size-3.5" />
                <span className="truncate">{g.label}</span>
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {g.sub}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

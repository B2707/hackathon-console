'use client'

import { motion } from 'framer-motion'
import { Boxes, GitPullRequest, ListChecks, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { CircularGauge } from './circular-gauge'
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

type KpiRowProps = {
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

export function KpiRow({ seats, issues, prs, now }: KpiRowProps) {
  const totalSeats = new Set([...ROSTER, ...seats.map((s) => s.seat)]).size
  const freshCount = seats.filter((s) => seatStatus(s.at, now) === 'fresh').length

  const byLane = issuesByLane(issues)
  const activeIssueLanes = LANES.filter((l) => byLane[l].length > 0).length
  const activeLanes = activeIssueLanes + (prs.length > 0 ? 1 : 0)
  const totalLanes = LANES.length + 1

  const tiles: {
    icon: LucideIcon
    label: string
    value: number
    fraction: number
    tone: Tone
  }[] = [
    {
      icon: Users,
      label: 'seats fresh',
      value: freshCount,
      fraction: totalSeats ? freshCount / totalSeats : 0,
      tone: ratioTone(totalSeats ? freshCount / totalSeats : 0),
    },
    {
      icon: Boxes,
      label: 'lanes active',
      value: activeLanes,
      fraction: activeLanes / totalLanes,
      tone: 'primary',
    },
    {
      icon: GitPullRequest,
      label: 'PRs in flight',
      value: prs.length,
      fraction: Math.min(prs.length / 6, 1),
      tone: 'primary',
    },
    {
      icon: ListChecks,
      label: 'open issues',
      value: issues.length,
      fraction: Math.min(issues.length / 12, 1),
      tone: 'primary',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {tiles.map((t) => (
        <motion.div key={t.label} variants={fadeUpItem}>
          <Card className="flex-row items-center gap-3 p-3">
            <CircularGauge value={t.fraction} size={52} strokeWidth={4} color={toneVar(t.tone)}>
              <span className="text-sm font-semibold tabular-nums">{t.value}</span>
            </CircularGauge>
            <div className="min-w-0">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <t.icon className="size-3.5" />
                <span className="truncate uppercase tracking-wide">{t.label}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

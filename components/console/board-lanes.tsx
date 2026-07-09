'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import type { BoardIssue } from '@/lib/types'
import {
  LANES,
  LANE_TITLES,
  issuesByLane,
  laneTone,
  toneBadgeVariant,
} from '@/lib/board'

/** Badge variant for an individual label pill (special labels win). */
function labelVariant(
  label: string
): 'success' | 'warning' | 'danger' | 'outline' {
  if (label === 'break-glass' || label === 'needs-human' || label === 'blocked')
    return 'danger'
  if (label === 'demo-path' || label === 'proposed') return 'warning'
  if (label === 'ready') return 'success'
  return 'outline'
}

const ACCENT_COLOR: Record<'demo' | 'break', string> = {
  demo: 'var(--warning)',
  break: 'var(--danger)',
}

function accentFor(labels: string[]): string | undefined {
  if (labels.includes('break-glass')) return ACCENT_COLOR.break
  if (labels.includes('demo-path')) return ACCENT_COLOR.demo
  return undefined
}

export function BoardLanes({ issues }: { issues: BoardIssue[] }) {
  const byLane = issuesByLane(issues)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {LANES.map((lane) => {
        const cards = byLane[lane]
        const tone = laneTone(lane)
        return (
          <Card key={lane} className="max-h-[52vh] min-h-40 gap-0 p-0">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                {LANE_TITLES[lane]}
              </span>
              <Badge variant={toneBadgeVariant(tone)} className="tabular-nums">
                {cards.length}
              </Badge>
            </div>
            <Separator />
            <ScrollArea className="flex-1 p-2">
              {cards.length === 0 ? (
                <p className="text-muted-foreground/60 px-1 py-6 text-center text-xs">
                  nothing here
                </p>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-2"
                >
                  {cards.map((issue) => (
                    <motion.div key={issue.number} variants={fadeUpItem}>
                      <IssueCard issue={issue} accent={accentFor(issue.labels)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </ScrollArea>
          </Card>
        )
      })}
    </div>
  )
}

function IssueCard({
  issue,
  accent,
}: {
  issue: BoardIssue
  accent?: string
}) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noreferrer"
      style={accent ? { borderLeftColor: accent, borderLeftWidth: 2 } : undefined}
      className="group bg-secondary/40 hover:bg-secondary/70 hover:border-border block rounded-lg border border-transparent p-2.5 transition-colors"
    >
      <div className="flex items-start gap-1.5">
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          #{issue.number}
        </span>
        <span className="text-foreground/90 line-clamp-3 text-xs leading-snug">
          {issue.title}
        </span>
        <ExternalLink className="text-muted-foreground/0 group-hover:text-muted-foreground ml-auto size-3 shrink-0 transition-colors" />
      </div>

      {issue.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.map((label) => (
            <Badge
              key={label}
              variant={labelVariant(label)}
              className="px-1.5 py-0 text-[10px]"
            >
              {label}
            </Badge>
          ))}
        </div>
      )}

      {issue.assignees.length > 0 && (
        <div className="text-muted-foreground mt-1.5 truncate font-mono text-[11px]">
          @{issue.assignees.join(', ')}
        </div>
      )}
    </a>
  )
}

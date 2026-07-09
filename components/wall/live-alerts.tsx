'use client'

import { motion } from 'framer-motion'
import { OctagonAlert, ShieldCheck, Siren, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge, type BadgeColor } from '@/components/ui/heroui-badge'
import { Card } from '@/components/ui/card'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { timeAgo } from '@/lib/board'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

type Severity = Alert['severity']

// P0 reads rose (--danger), P1 reads amber (--warning) — the same ops-severity
// tokens the rest of the wall uses, so the dark aesthetic stays consistent.
const SEVERITY: Record<
  Severity,
  { color: BadgeColor; icon: LucideIcon; card: string; tile: string }
> = {
  P0: {
    color: 'danger',
    icon: OctagonAlert,
    card: 'border-danger/40 bg-danger/5 border-l-4 border-l-danger',
    tile: 'bg-danger/15 text-danger',
  },
  P1: {
    color: 'warning',
    icon: TriangleAlert,
    card: 'border-warning/40 bg-warning/5 border-l-4 border-l-warning',
    tile: 'bg-warning/15 text-warning',
  },
}

type LiveAlertsProps = {
  alerts: Alert[]
  now: number
}

/**
 * Live Alerts wall panel: the P0/P1 tripwire fires that also POST to
 * /api/alert. Newest-first, severity-coloured cards. The freshest one carries a
 * shimmering LIVE marker. Empty state reassures with "All clear".
 */
export function LiveAlerts({ alerts, now }: LiveAlertsProps) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-danger/15 text-danger">
            <Siren className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Live Alerts
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {alerts.length > 0
            ? `${alerts.length} active`
            : 'all clear'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/20 py-10 text-center">
          <ShieldCheck className="size-8 text-success" />
          <span className="text-sm text-muted-foreground">
            All clear — no alerts.
          </span>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          {alerts.map((alert, i) => (
            <motion.div key={alert.id} variants={fadeUpItem}>
              <AlertCard alert={alert} now={now} newest={i === 0} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  )
}

function AlertCard({
  alert,
  now,
  newest,
}: {
  alert: Alert
  now: number
  newest: boolean
}) {
  const sev = SEVERITY[alert.severity] ?? SEVERITY.P1

  return (
    <Card className={cn('gap-0 p-3.5', sev.card)}>
      <div className="flex items-start gap-3">
        <Badge
          color={sev.color}
          variant="soft"
          placement="top-right"
          size="sm"
        >
          <Badge.Anchor>
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-lg',
                sev.tile
              )}
            >
              <sev.icon className="size-5" />
            </span>
          </Badge.Anchor>
          <Badge.Label>{alert.severity}</Badge.Label>
        </Badge>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-semibold uppercase tracking-tight">
              {alert.wire}
            </span>
            {newest && (
              <span className="flex shrink-0 items-center gap-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                <TextShimmer
                  as="span"
                  duration={1.4}
                  className="text-[10px] font-semibold uppercase tracking-widest"
                >
                  LIVE
                </TextShimmer>
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {alert.detail}
          </p>
        </div>

        <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground tabular-nums">
          {timeAgo(alert.at, now)} ago
        </span>
      </div>
    </Card>
  )
}

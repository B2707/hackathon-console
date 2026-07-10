'use client'

import { Fragment, type ReactNode } from 'react'
import {
  ExternalLink,
  OctagonAlert,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Expandable } from '@/components/ui/expandable'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { timeAgo } from '@/lib/board'
import type { Alert } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Live Alerts — tripwire incidents needing attention (handoff `team-board.html`
 * lines 2034–2109, CSS `.alert-item` 1504–1530). A vertical list of expandable
 * alert cards, newest-first: a severity tile (P0 octagon / P1 triangle + badge),
 * a mono wire code, a pulsing LIVE shimmer on the freshest card, a plain-English
 * headline, a relative timestamp, and a chevron. Expanding reveals a description
 * (inline `<code>` for code-looking tokens), context chips, and GitHub actions.
 *
 * DATA: REAL — `alerts` come straight from the live tripwire feed (/api/state).
 * Expand state is React-owned (per-card `Expandable`, not DOM toggling).
 *
 * TODO: richer alert context (needs alert payload with url/branch) — the Alert
 * type carries only {severity, wire, detail, at}, so the expanded repo/actions
 * point at the team template repo rather than the alert's own branch/CI run.
 */
export type LiveAlertsProps = {
  alerts: Alert[]
  now: number
}

// The team's working repo — alerts are about work happening here, not the
// console. TODO: replace with the per-alert repo once the payload carries it.
const REPO = 'B2707/hackathon-team-template'
const REPO_URL = `https://github.com/${REPO}`

const SEVERITY = {
  P0: {
    Icon: OctagonAlert,
    tile: 'border-danger/30 bg-danger/[0.16] text-danger',
    badge: 'bg-danger',
    edge: 'border-l-4 border-l-danger bg-danger/[0.055]',
  },
  P1: {
    Icon: TriangleAlert,
    tile: 'border-warning/30 bg-warning/[0.16] text-warning',
    badge: 'bg-warning',
    edge: 'border-l-4 border-l-warning bg-warning/[0.055]',
  },
} as const

export function LiveAlerts({ alerts, now }: LiveAlertsProps) {
  return (
    <Card className="gap-0 p-5">
      <header className="mb-[18px] flex items-start justify-between gap-[18px]">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[10px] border border-danger/[0.26] bg-danger/[0.14] text-danger">
            <Siren className="size-[19px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
              Live Alerts
            </h2>
            <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
              Tripwire incidents · click a card to expand
            </p>
          </div>
        </div>
        <span className="flex-none whitespace-nowrap rounded-full border border-border bg-muted px-[11px] py-[5px] font-mono text-[0.8rem] text-muted-foreground">
          <b className="font-semibold text-foreground">{alerts.length}</b> active
        </span>
      </header>

      {alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              now={now}
              isNewest={index === 0}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function AlertCard({
  alert,
  now,
  isNewest,
}: {
  alert: Alert
  now: number
  isNewest: boolean
}) {
  const sev = SEVERITY[alert.severity]
  const { Icon } = sev

  return (
    <Expandable
      defaultOpen={isNewest}
      className={cn(
        'overflow-hidden rounded-[14px] border border-border',
        sev.edge
      )}
      headerClassName="items-center px-4 py-[14px]"
      header={(open) => (
        <>
          <span
            className={cn(
              'relative grid size-[42px] flex-none place-items-center rounded-[11px] border',
              sev.tile
            )}
          >
            <span
              className={cn(
                'absolute -left-2 -top-2 rounded-[6px] px-[5px] py-[2px] font-mono text-[0.6rem] font-bold leading-none tracking-[0.04em] text-background',
                sev.badge
              )}
            >
              {alert.severity}
            </span>
            <Icon className="size-5" aria-hidden />
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="flex items-center gap-[9px]">
              <span className="font-mono text-[0.82rem] font-semibold uppercase tracking-[0.04em] text-foreground">
                {alert.wire}
              </span>
              {isNewest && <LiveTag />}
            </span>
            <span
              className={cn(
                'text-[0.9rem] font-medium text-foreground',
                open ? 'whitespace-normal' : 'truncate'
              )}
            >
              {alert.detail}
            </span>
          </span>

          <span className="flex-none self-start whitespace-nowrap font-mono text-[0.74rem] text-muted-foreground">
            {timeAgo(alert.at, now)} ago
          </span>
        </>
      )}
    >
      <p className="pl-4 pr-4 pt-[14px] text-[0.85rem] leading-[1.6] text-muted-foreground md:pl-[72px]">
        <CodeText text={alert.detail} />
      </p>
      <div className="flex flex-wrap gap-2 pl-4 pr-4 pt-3 md:pl-[72px]">
        <Chip label="repo" value={REPO} />
        <Chip label="wire" value={alert.wire} />
      </div>
      <div className="flex flex-wrap gap-[10px] pb-4 pl-4 pr-4 pt-[14px] md:pl-[72px]">
        <ActionButton href={`${REPO_URL}/actions`} primary>
          View CI run
        </ActionButton>
        <ActionButton href={REPO_URL}>Open repo</ActionButton>
      </div>
    </Expandable>
  )
}

/** Pulsing LIVE indicator on the freshest alert: a pinging dot + shimmer text. */
function LiveTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-2 py-[2px]">
      <span className="relative flex size-2">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary"
          style={{ animation: 'ping 1.7s cubic-bezier(0,0,.2,1) infinite' }}
        />
        <span className="relative size-2 rounded-full bg-primary" />
      </span>
      <TextShimmer
        as="span"
        duration={2.4}
        className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] [--base-color:var(--primary)] [--base-gradient-color:#e8f0ff] dark:[--base-color:var(--primary)] dark:[--base-gradient-color:#e8f0ff]"
      >
        Live
      </TextShimmer>
    </span>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[7px] border border-border bg-muted px-[9px] py-[3px] font-mono text-[0.72rem] text-muted-foreground">
      {label} <b className="font-semibold text-foreground">{value}</b>
    </span>
  )
}

function ActionButton({
  href,
  primary = false,
  children,
}: {
  href: string
  primary?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-[7px] rounded-[9px] border px-[13px] py-[8px] text-[0.8rem] transition-colors',
        primary
          ? 'border-primary bg-primary font-semibold text-primary-foreground hover:brightness-110'
          : 'border-border font-medium text-foreground hover:border-input hover:bg-foreground/[0.03]'
      )}
    >
      {children}
      <ExternalLink className="size-[13px] opacity-70" aria-hidden />
    </a>
  )
}

/**
 * Renders plain text with inline `<code>` for code-looking tokens: backtick
 * spans, paths / branch refs (`origin/main`, `a/b/c.tsx`), filenames, and
 * issue/PR refs (`#42`). Best-effort — the Alert payload has no structured
 * code fields, so we detect from the prose.
 */
const CODE_RE =
  /(`[^`]+`|origin\/[^\s]+|\b[\w-]+\/[\w./-]+|\b[\w-]+\.[a-z]{2,5}\b|#\d+)/g

function CodeText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(CODE_RE)) {
    const index = match.index ?? 0
    if (index > last) {
      nodes.push(<Fragment key={key++}>{text.slice(last, index)}</Fragment>)
    }
    const token = match[0].replace(/^`|`$/g, '')
    nodes.push(
      <code
        key={key++}
        className="rounded-[5px] border border-border bg-muted px-[5px] py-px font-mono text-[0.78rem] text-foreground"
      >
        {token}
      </code>
    )
    last = index + match[0].length
  }
  if (last < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>)
  }
  return <>{nodes}</>
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-success/25 bg-success/10 text-success">
        <ShieldCheck className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">
          All clear — no active alerts
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tripwires are green. Nothing needs attention right now.
        </p>
      </div>
    </div>
  )
}

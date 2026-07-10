'use client'

import { useState } from 'react'
import { ChevronDown, ExternalLink, ScrollText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Expandable } from '@/components/ui/expandable'
import { cn } from '@/lib/utils'
import type { EventLevel, EventLogEntry } from '@/lib/event-log'

// Re-exported so panel consumers get the row types alongside the props contract.
// The source of truth is lib/event-log.ts.
export type { EventLogEntry, EventLevel } from '@/lib/event-log'

/**
 * Event Log — raw live stream from the /api/state ticker feed. A COLLAPSIBLE
 * card (header chevron hides the whole body) over a BOUNDED, SCROLLABLE list of
 * per-row EXPANDABLE entries: each row is a compact one-liner (time · level ·
 * seat · message) that expands to the full message, meta chips, and a GitHub
 * link. A segmented filter (ALL / WARN / ERROR) narrows by level.
 *
 * DATA: REAL — `events` are mapped from the ticker by lib/event-log.
 * mapTickerToEvents. Latency is a seam not carried by the ticker (shown only
 * when present).
 */
export type EventLogProps = {
  events: EventLogEntry[]
}

const FILTERS = ['ALL', 'WARN', 'ERROR'] as const
type Filter = (typeof FILTERS)[number]

// INFO=primary(blue), OK=success(green), WARN=warning(amber), ERROR=danger(red).
const LEVEL_VARIANT: Record<
  EventLevel,
  'default' | 'success' | 'warning' | 'danger'
> = {
  INFO: 'default',
  OK: 'success',
  WARN: 'warning',
  ERROR: 'danger',
}

/** Epoch ms → HH:MM:SS (24h), matching the prototype's mono time column. */
function formatClock(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function EventLog({ events }: EventLogProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState<Filter>('ALL')
  const shown =
    filter === 'ALL' ? events : events.filter((event) => event.level === filter)

  return (
    <Card className="gap-0 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[10px] border border-[#60a5fa]/[0.28] bg-[#60a5fa]/[0.14] text-[#60a5fa]">
            <ScrollText className="size-[19px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
              Event Log
            </h2>
            <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
              Live stream · {events.length} event{events.length === 1 ? '' : 's'}
              {' · '}click a row to expand
            </p>
          </div>
        </div>

        <div className="flex flex-none items-center gap-2 self-start">
          <div
            role="tablist"
            aria-label="Filter events by level"
            className="inline-flex gap-[2px] rounded-[9px] border border-border bg-muted p-[3px]"
          >
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={filter === option}
                onClick={() => setFilter(option)}
                className={cn(
                  'cursor-pointer rounded-[7px] px-[11px] py-[5px] font-mono text-[0.72rem] font-semibold tracking-[0.04em] transition-colors',
                  filter === option
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand event log' : 'Collapse event log'}
            className="grid size-[30px] flex-none cursor-pointer place-items-center rounded-[8px] border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                collapsed && '-rotate-90'
              )}
              aria-hidden
            />
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="reveal-in mt-[18px]">
          {shown.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              {events.length === 0
                ? 'No events yet — waiting for the ticker.'
                : `No ${filter} events.`}
            </p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
              {shown.map((event, index) => (
                <LogRow key={`${event.time}-${index}`} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

/** One log entry: a compact clickable row that expands to full detail. */
function LogRow({ event }: { event: EventLogEntry }) {
  return (
    <Expandable
      className="rounded-[10px] border border-border/70 bg-popover/40"
      headerClassName="items-center gap-3 px-3 py-[9px]"
      header={
        <>
          <span className="flex-none font-mono text-[0.74rem] text-muted-foreground">
            {formatClock(event.time)}
          </span>
          <Badge
            variant={LEVEL_VARIANT[event.level]}
            className="flex-none rounded-[5px] px-[7px] py-[2px] font-mono text-[0.62rem] font-bold tracking-[0.06em]"
          >
            {event.level}
          </Badge>
          <span className="hidden w-[110px] flex-none truncate font-mono text-[0.74rem] text-muted-foreground sm:block">
            {event.seat || 'system'}
          </span>
          <span className="min-w-0 flex-1 truncate text-[0.82rem] text-foreground">
            {event.message}
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-2.5 px-3 pb-3 pt-1">
        <p className="whitespace-normal break-words text-[0.82rem] leading-[1.55] text-foreground">
          {event.message}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Meta label="seat" value={event.seat || 'system'} />
          <Meta label="level" value={event.level} />
          {event.latency ? <Meta label="latency" value={event.latency} /> : null}
        </div>
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-[0.78rem] font-medium text-primary hover:underline"
          >
            Open on GitHub
            <ExternalLink className="size-[13px]" aria-hidden />
          </a>
        )}
      </div>
    </Expandable>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[7px] border border-border bg-muted px-[9px] py-[3px] font-mono text-[0.72rem] text-muted-foreground">
      {label} <b className="font-semibold text-foreground">{value}</b>
    </span>
  )
}

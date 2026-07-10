'use client'

import { useState } from 'react'
import { ScrollText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { EventLevel, EventLogEntry } from '@/lib/event-log'

// Re-exported so panel consumers get the row types alongside the props contract.
// The source of truth is lib/event-log.ts.
export type { EventLogEntry, EventLevel } from '@/lib/event-log'

/**
 * Event Log — raw live stream from the wall daemon (handoff `team-board.html`
 * lines 2111–2193, CSS `.log-table` / `.seg` / `.lvl`). A segmented filter
 * (ALL / WARN / ERROR) over a monospace table: Time · Level · Seat · Message ·
 * Latency. Level badges: INFO (blue), OK (green), WARN (amber), ERROR (red).
 * The filter is React state; ALL shows everything, WARN/ERROR show only their
 * own rows (mirrors the prototype's exact filter at JS lines 2659–2669).
 *
 * DATA: REAL — `events` are mapped from the /api/state ticker feed by
 * lib/event-log.mapTickerToEvents. Latency is a seam not carried by the ticker,
 * so it renders as "—" until real request timing is threaded through.
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
  const [filter, setFilter] = useState<Filter>('ALL')
  const shown =
    filter === 'ALL' ? events : events.filter((event) => event.level === filter)

  return (
    <Card className="gap-0 p-5">
      <header className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] flex-none place-items-center rounded-[10px] border border-[#60a5fa]/[0.28] bg-[#60a5fa]/[0.14] text-[#60a5fa]">
            <ScrollText className="size-[19px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
              Event Log
            </h2>
            <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
              Live stream from the wall daemon
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter events by level"
          className="inline-flex flex-none gap-[2px] self-start rounded-[9px] border border-border bg-muted p-[3px]"
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
      </header>

      <Table className="min-w-[640px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[92px]">Time</TableHead>
            <TableHead className="w-[74px]">Level</TableHead>
            <TableHead className="w-[120px]">Seat</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[90px] text-right">Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono">
          {shown.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="py-10 text-center text-xs text-muted-foreground"
              >
                {events.length === 0
                  ? 'No events yet — waiting for the ticker.'
                  : `No ${filter} events.`}
              </TableCell>
            </TableRow>
          ) : (
            shown.map((event, index) => (
              <TableRow key={`${event.time}-${index}`}>
                <TableCell className="text-[0.78rem] text-muted-foreground">
                  {formatClock(event.time)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={LEVEL_VARIANT[event.level]}
                    className="rounded-[5px] px-[7px] py-[2px] font-mono text-[0.62rem] font-bold tracking-[0.06em]"
                  >
                    {event.level}
                  </Badge>
                </TableCell>
                <TableCell className="truncate text-[0.78rem] text-muted-foreground">
                  {event.seat || 'system'}
                </TableCell>
                <TableCell className="text-[0.78rem] text-foreground">
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate hover:text-primary hover:underline"
                    >
                      {event.message}
                    </a>
                  ) : (
                    <span className="block truncate">{event.message}</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-[0.78rem] text-muted-foreground">
                  {event.latency ?? '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  Bot,
  Check,
  Circle,
  CircleAlert,
  Eye,
  GitBranch,
  Loader2,
  RefreshCw,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { seatStatus, type SeatStatus } from '@/lib/board'
import type { Alert, SeatBeat } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  EV_STYLE,
  LEGEND,
  SEED_FEED,
  type FeedRow,
  type FeedType,
  type SysEvent,
  mountSystemGraph,
} from './system-graph-canvas'

declare global {
  interface Window {
    __wallPaused?: boolean
  }
}

/**
 * Live System Graph — real-time knowledge graph of agents, tools & CI/CD acting
 * on the repo, plus a streaming event feed (handoff `team-board.html` lines
 * 2196–2263 + script 2675–2752; README §6). Layout: a ~1.55fr <canvas> graph +
 * a 1fr side panel (3 pipeline chips + a feed capped at 7 rows), stacking
 * ≤1100px.
 *
 * DATA: node COLOURS derive from real state — repo red when a RED-MAIN/main
 * alert is present, seat nodes coloured by `seatStatus`, the rest fixed. The
 * ordered packet-firing sequence + pipeline chips are a fixed decorative script
 * this panel owns; the rAF loop pauses on `window.__wallPaused` /
 * prefers-reduced-motion and renders the static state instead.
 */
export type SystemGraphProps = {
  seats: SeatBeat[]
  alerts: Alert[]
  repo: string | null
  now: number
}

// Feed-row icon per actor type (lucide equivalents of the prototype's SVGs).
const EV_ICON: Record<FeedType, LucideIcon> = {
  seat: ArrowDown,
  ci: RefreshCw,
  ok: Check,
  review: Eye,
  deploy: Rocket,
  agent: Bot,
  error: CircleAlert,
}

// Seat freshness -> node colour (fresh emerald, warm amber, stale/never rose).
const SEAT_STATUS_COLOR: Record<SeatStatus, string> = {
  fresh: '#22c55e',
  warm: '#fbbf24',
  stale: '#f87171',
  never: '#f87171',
}

const SEAT_NODE_IDS = ['bader', 'sjp', 'amr', 'adham'] as const

// Static pipeline chips (Build done / Test running / Deploy queued).
const CHIPS = [
  { key: 'build', label: 'Build', value: '42s', tone: 'pass', Icon: Check, sw: 3, spin: false },
  { key: 'test', label: 'Test', value: 'running', tone: 'run', Icon: Loader2, sw: 2.5, spin: true },
  { key: 'deploy', label: 'Deploy', value: 'queued', tone: 'queue', Icon: Circle, sw: 2.4, spin: false },
] as const

const CHIP_TONE: Record<string, string> = {
  pass: 'text-success',
  run: 'text-warning',
  queue: 'text-muted-foreground',
}

export function SystemGraph({ seats, alerts, now }: SystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorsRef = useRef<Record<string, string>>({})
  const rowId = useRef(0)
  const [feed, setFeed] = useState<FeedRow[]>(() => SEED_FEED)

  // Derive real-state node colours every render and keep the live ref current
  // (the rAF loop reads it each frame, so a poll recolours without a restart).
  const seatAt = new Map(seats.map((s) => [s.seat, s.at]))
  const repoRed = alerts.some((a) => /main/i.test(a.wire))
  const colors: Record<string, string> = {
    repo: repoRed ? '#f87171' : '#4d8dff',
    agent: '#a78bfa',
    review: '#fbbf24',
    ci: '#fbbf24',
    test: '#fbbf24',
    deploy: '#7c7d85',
    lint: '#22c55e',
  }
  for (const id of SEAT_NODE_IDS) {
    colors[id] = SEAT_STATUS_COLOR[seatStatus(seatAt.get(id), now)]
  }
  useEffect(() => {
    colorsRef.current = colors
  })

  // Prepend a fired event, relabel the prior "now" row, cap at 7 (source emit).
  const handleEmit = useCallback((ev: SysEvent) => {
    setFeed((prev) => {
      const older = prev.map((r) => ({
        ...r,
        justAdded: false,
        time: r.time === 'now' ? 'just now' : r.time,
      }))
      rowId.current += 1
      const row: FeedRow = {
        id: `ev-${rowId.current}`,
        type: ev.type,
        actor: ev.actor,
        segments: ev.segments,
        time: 'now',
        justAdded: true,
      }
      return [row, ...older].slice(0, 7)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const paused = () =>
      (typeof window !== 'undefined' && !!window.__wallPaused) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return mountSystemGraph(canvas, { colorsRef, onEmit: handleEmit, paused })
  }, [handleEmit])

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] border border-violet/25 bg-violet/10 text-violet">
          <GitBranch className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Live System Graph
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Agents, tools &amp; CI/CD firing in real time
          </p>
        </div>
        <span className="inline-flex flex-none items-center gap-1.5 text-[0.72rem] font-medium text-muted-foreground">
          <span
            className="size-1.5 rounded-full bg-success"
            style={{ animation: 'soft-pulse 2s ease-in-out infinite' }}
          />
          streaming
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-[22px] min-[1101px]:grid-cols-[1.55fr_1fr]">
        {/* Canvas graph */}
        <div
          className="relative min-h-[420px] overflow-hidden rounded-[16px] border border-border"
          style={{
            background:
              'radial-gradient(130% 120% at 32% 22%, rgba(77,141,255,.06), transparent 60%), #0a0a0d',
          }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
          <div className="pointer-events-none absolute bottom-[14px] left-4 flex flex-wrap gap-4">
            {LEGEND.map((l) => (
              <span
                key={l.label}
                className="inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground"
              >
                <span
                  className="size-[9px] rounded-full"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel: pipeline chips + streaming feed */}
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className="flex gap-2">
            {CHIPS.map((c) => (
              <div
                key={c.key}
                className="flex flex-1 flex-col gap-1.5 rounded-[14px] border border-border bg-popover p-3"
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.05em]',
                    CHIP_TONE[c.tone]
                  )}
                >
                  <c.Icon
                    className="size-3"
                    strokeWidth={c.sw}
                    style={
                      c.spin
                        ? { animation: 'spin 1s linear infinite' }
                        : undefined
                    }
                  />
                  {c.label}
                </span>
                <span className="font-mono text-[0.82rem] font-semibold text-foreground">
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex max-h-[320px] flex-1 flex-col overflow-hidden rounded-[12px] border border-border bg-popover px-4 py-1.5">
            {feed.map((row, i) => {
              const style = EV_STYLE[row.type]
              const Icon = EV_ICON[row.type]
              return (
                <div
                  key={row.id}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto] items-center gap-3 px-0.5 py-[11px]',
                    i < feed.length - 1 && 'border-b border-border'
                  )}
                  style={
                    row.justAdded
                      ? { animation: 'evin .5s cubic-bezier(.2,.7,.2,1)' }
                      : undefined
                  }
                >
                  <span
                    className="grid size-8 flex-none place-items-center rounded-[9px]"
                    style={{ color: style.color, background: style.bg }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 text-[0.84rem] leading-[1.35]">
                    <span className="font-mono font-semibold text-foreground">
                      {row.actor}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {row.segments.map((seg, j) =>
                        seg.mono ? (
                          <span key={j} className="font-mono text-foreground">
                            {seg.t}
                          </span>
                        ) : seg.danger ? (
                          <b key={j} style={{ color: 'var(--danger)' }}>
                            {seg.t}
                          </b>
                        ) : (
                          <span key={j}>{seg.t}</span>
                        )
                      )}
                    </span>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[0.72rem] text-muted-foreground">
                    {row.time}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

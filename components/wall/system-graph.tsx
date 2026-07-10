'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CircleDot,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  OctagonAlert,
  Plug,
  RefreshCw,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { seatAccent, seatStatus, timeAgo, type SeatStatus } from '@/lib/board'
import type { Alert, SeatBeat, TickerEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  C,
  LEGEND,
  SEAT_PREFIX,
  buildGraph,
  mountSystemGraph,
  type PacketSpec,
  type SystemGraphHandle,
} from './system-graph-canvas'

declare global {
  interface Window {
    __wallPaused?: boolean
  }
}

/**
 * Live System Graph — a knowledge graph of the REAL system (the template repo at
 * centre, one node per real seat, plus agents / ci / tripwires / discord /
 * console) and a merged live feed. Handoff `team-board.html` lines 2196–2263
 * supply the look; the substance is real.
 *
 * NOTHING fires on a timer. Packets fire ONLY when a genuinely-new ticker/alert
 * event appears across a poll — the panel diffs a "seen" key set, seeds it from
 * the first data load (static, no burst), then animates each new event (staggered
 * so a burst reads). Node COLOURS derive from live state and are pushed to the
 * canvas via a ref, so the 15s poll recolours without restarting the loop. Under
 * window.__wallPaused / prefers-reduced-motion packets don't animate but colours
 * + feed rows still update (static truth) and a static frame is drawn.
 */
export type SystemGraphProps = {
  seats: SeatBeat[]
  alerts: Alert[]
  ticker: TickerEvent[]
  repo: string | null
  now: number
}

const STAGGER_MS = 240
const FEED_CAP = 8
// A non-seat actor seen within this window keeps the `agents` node lit.
const AGENT_RECENT_MS = 30 * 60_000

const TICKER_KINDS = ['push', 'pr', 'issue', 'comment', 'ci', 'ping'] as const
const ACTOR_KINDS = new Set(['push', 'pr', 'issue', 'comment'])

// Seat freshness -> node colour (fresh emerald / warm amber / stale-never rose).
const SEAT_STATUS_COLOR: Record<SeatStatus, string> = {
  fresh: C.success,
  warm: C.warning,
  stale: C.danger,
  never: C.danger,
}

type FeedKind = 'push' | 'pr' | 'issue' | 'comment' | 'ci' | 'ping' | 'alert'
type CiState = 'success' | 'fail' | 'other'

// One unified shape for the merged ticker+alert stream.
type FeedItem = {
  key: string
  at: number
  kind: FeedKind
  /** Bold label: actor handle, ci workflow, wire, or "webhook". */
  actor: string
  /** The real event text with the leading actor stripped (no duplication). */
  body: string
  url?: string
  ci?: CiState
  severity?: 'P0' | 'P1'
}
type FeedRow = FeedItem & { justAdded: boolean }

// --- pure helpers ------------------------------------------------------------

function shortRepo(repo: string | null): string {
  if (!repo) return 'repo'
  const slash = repo.lastIndexOf('/')
  return slash >= 0 ? repo.slice(slash + 1) : repo
}

/** Actor = first whitespace token (matches every webhook text format). */
function parseActor(text: string): string {
  return text.trim().split(/\s+/)[0] ?? ''
}

/** Coarse CI conclusion from the "<wf>: <conclusion> on <branch>" text. */
function ciState(text: string): CiState {
  const t = text.toLowerCase()
  if (t.includes('success')) return 'success'
  if (t.includes('fail')) return 'fail'
  return 'other'
}

function ciColor(c: CiState): string {
  return c === 'success' ? C.success : c === 'fail' ? C.danger : C.warning
}

/** Split "<workflow>: <conclusion> on <branch>" for the status chip. */
function parseCi(text: string): { concl: string; branch: string } {
  const m = text.match(/:\s*(.+?)\s+on\s+(.+)$/)
  if (m) return { concl: m[1].trim(), branch: m[2].trim() }
  const c = text.match(/:\s*(.+)$/)
  return { concl: (c ? c[1] : text).trim(), branch: '' }
}

/** Build the merged, newest-first stream from the real ticker + alerts. */
function mergeItems(ticker: TickerEvent[], alerts: Alert[]): FeedItem[] {
  const fromTicker: FeedItem[] = ticker.map((e) => {
    const kind = (
      (TICKER_KINDS as readonly string[]).includes(e.kind) ? e.kind : 'push'
    ) as FeedKind
    const key = `t|${e.kind}|${e.at}|${e.text}`
    if (kind === 'ci') {
      const parts = e.text.split(/:(.+)/)
      return {
        key,
        at: e.at,
        kind,
        actor: (parts[0] || 'ci').trim(),
        body: (parts[1] || e.text).trim(),
        url: e.url,
        ci: ciState(e.text),
      }
    }
    if (kind === 'ping') {
      return {
        key,
        at: e.at,
        kind,
        actor: 'webhook',
        body: e.text.replace(/^webhook\s+/i, '').trim() || e.text,
        url: e.url,
      }
    }
    const actor = parseActor(e.text)
    return {
      key,
      at: e.at,
      kind,
      actor,
      body: e.text.slice(actor.length).replace(/^\s*[—-]\s*/, '').trim() || e.text,
      url: e.url,
    }
  })
  const fromAlerts: FeedItem[] = alerts.map((a) => ({
    key: `alert|${a.id}`,
    at: a.at,
    kind: 'alert',
    actor: a.wire,
    body: a.detail || a.wire,
    severity: a.severity,
  }))
  return [...fromTicker, ...fromAlerts].sort((x, y) => y.at - x.at)
}

const FEED_ICON: Record<Exclude<FeedKind, 'ci' | 'alert'>, LucideIcon> = {
  push: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  comment: MessageSquare,
  ping: Plug,
}

function iconFor(item: FeedItem): LucideIcon {
  if (item.kind === 'ci') return item.ci === 'fail' ? X : Check
  if (item.kind === 'alert')
    return item.severity === 'P0' ? OctagonAlert : TriangleAlert
  return FEED_ICON[item.kind]
}

const KIND_COLOR: Record<Exclude<FeedKind, 'ci' | 'alert'>, string> = {
  push: C.primary,
  pr: C.violet,
  issue: C.warning,
  comment: C.muted,
  ping: C.success,
}

function toneFor(item: FeedItem): string {
  if (item.kind === 'ci') return ciColor(item.ci ?? 'other')
  if (item.kind === 'alert') return item.severity === 'P0' ? C.danger : C.warning
  return KIND_COLOR[item.kind]
}

/** Map a real event to the packet the canvas should animate (null = skip). */
function specFor(item: FeedItem, seats: SeatBeat[]): PacketSpec | null {
  switch (item.kind) {
    case 'push':
    case 'pr':
    case 'issue':
    case 'comment': {
      const seat = seats.find(
        (s) => s.seat.toLowerCase() === item.actor.toLowerCase()
      )
      if (seat)
        return {
          from: `${SEAT_PREFIX}${seat.seat}`,
          to: 'repo',
          color: seatAccent(seat.seat),
        }
      return { from: 'agents', to: 'repo', color: C.violet }
    }
    case 'ci':
      return {
        from: 'ci',
        to: 'console',
        color: ciColor(item.ci ?? 'other'),
        pulse: ['ci'],
      }
    case 'ping':
      return { from: 'repo', to: 'console', color: C.primary }
    case 'alert': {
      const color = item.severity === 'P0' ? C.danger : C.warning
      return {
        from: 'tripwires',
        to: 'console',
        color,
        pulse: ['tripwires', 'discord'],
        flash: /main/i.test(item.actor) ? { id: 'repo', color: C.danger } : undefined,
      }
    }
  }
}

// --- component ---------------------------------------------------------------

export function SystemGraph({ seats, alerts, ticker, repo, now }: SystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<SystemGraphHandle | null>(null)
  const colorsRef = useRef<Record<string, string>>({})
  const seenRef = useRef<Set<string> | null>(null)
  const timersRef = useRef<number[]>([])
  const [feed, setFeed] = useState<FeedRow[]>([])

  const paused = useCallback(
    () =>
      typeof window !== 'undefined' &&
      (!!window.__wallPaused ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    []
  )

  // Live node colours, recomputed every poll and pushed to the ref the loop reads.
  const colors = useMemo(() => {
    const map: Record<string, string> = {
      repo: alerts.some((a) => /main/i.test(a.wire)) ? C.danger : C.primary,
      console: C.primary,
      discord: C.muted,
      tripwires: alerts.some((a) => a.severity === 'P0')
        ? C.danger
        : alerts.some((a) => a.severity === 'P1')
          ? C.warning
          : C.muted,
    }
    for (const s of seats) {
      map[`${SEAT_PREFIX}${s.seat}`] = SEAT_STATUS_COLOR[seatStatus(s.at, now)]
    }
    let lastCi: TickerEvent | null = null
    for (const e of ticker) {
      if (e.kind === 'ci' && (!lastCi || e.at > lastCi.at)) lastCi = e
    }
    map.ci = lastCi ? ciColor(ciState(lastCi.text)) : C.muted
    const seatSet = new Set(seats.map((s) => s.seat.toLowerCase()))
    const agentsActive = ticker.some(
      (e) =>
        ACTOR_KINDS.has(e.kind) &&
        now - e.at < AGENT_RECENT_MS &&
        !seatSet.has(parseActor(e.text).toLowerCase())
    )
    map.agents = agentsActive ? C.violet : C.muted
    return map
  }, [seats, alerts, ticker, now])

  useEffect(() => {
    colorsRef.current = colors
    handleRef.current?.redraw()
  }, [colors])

  // Mount / remount the canvas when the roster or repo label changes (rare).
  const seatKey = seats.map((s) => s.seat).join(',')
  const repoLabel = shortRepo(repo)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { nodes, edges } = buildGraph(
      seatKey ? seatKey.split(',') : [],
      repoLabel
    )
    const handle = mountSystemGraph(canvas, { nodes, edges, colorsRef, paused })
    handleRef.current = handle
    handle.redraw()
    return () => {
      handle.destroy()
      handleRef.current = null
    }
  }, [seatKey, repoLabel, paused])

  // Diff the real feed across polls: seed statically on first load, then fire a
  // staggered packet + prepend a row for each genuinely-new event.
  useEffect(() => {
    const items = mergeItems(ticker, alerts)
    if (!seenRef.current) {
      if (items.length === 0) return // wait for the first real data load
      seenRef.current = new Set(items.map((i) => i.key))
      setFeed(items.slice(0, FEED_CAP).map((i) => ({ ...i, justAdded: false })))
      return
    }
    const seen = seenRef.current
    const fresh = items.filter((i) => !seen.has(i.key)).sort((a, b) => a.at - b.at)
    seenRef.current = new Set(items.map((i) => i.key)) // prune to what's present
    if (fresh.length === 0) return
    const isPaused = paused()
    fresh.forEach((item, idx) => {
      const prepend = () =>
        setFeed((prev) =>
          [
            { ...item, justAdded: !isPaused },
            ...prev.map((r) => ({ ...r, justAdded: false })),
          ].slice(0, FEED_CAP)
        )
      if (isPaused) {
        prepend() // static truth: row updates, no packet
        return
      }
      const timer = window.setTimeout(() => {
        prepend()
        const spec = specFor(item, seats)
        if (spec) handleRef.current?.fire(spec)
      }, idx * STAGGER_MS)
      timersRef.current.push(timer)
    })
  }, [ticker, alerts, seats, paused])

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current = []
    },
    []
  )

  // Honest status: latest CI conclusion + active tripwire count (replaces the
  // old fabricated Build/Test/Deploy chips).
  const ci = useMemo(() => {
    let last: TickerEvent | null = null
    for (const e of ticker) {
      if (e.kind === 'ci' && (!last || e.at > last.at)) last = e
    }
    if (!last) return null
    return { ...parseCi(last.text), state: ciState(last.text) }
  }, [ticker])
  const p0 = alerts.filter((a) => a.severity === 'P0').length
  const p1 = alerts.filter((a) => a.severity === 'P1').length

  const ciTone = ci ? ciColor(ci.state) : C.muted
  const CiIcon = !ci ? RefreshCw : ci.state === 'fail' ? X : ci.state === 'success' ? Check : RefreshCw
  const alertTone = p0 ? C.danger : p1 ? C.warning : C.success
  const AlertIcon = p0 ? OctagonAlert : p1 ? TriangleAlert : Check

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
            Seats, agents, CI &amp; tripwires acting on the repo
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
          <div className="pointer-events-none absolute bottom-[14px] left-4 flex flex-wrap gap-x-4 gap-y-1.5">
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

        {/* Side panel: honest status + merged live feed */}
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5 rounded-[14px] border border-border bg-popover p-3">
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.05em]"
                style={{ color: ciTone }}
              >
                <CiIcon
                  className="size-3"
                  strokeWidth={2.6}
                  style={
                    !ci || ci.state === 'other'
                      ? { animation: 'spin 1s linear infinite' }
                      : undefined
                  }
                />
                CI
              </span>
              <span className="truncate font-mono text-[0.82rem] font-semibold text-foreground">
                {ci
                  ? `${ci.concl}${ci.branch ? ` · ${ci.branch}` : ''}`
                  : 'no runs yet'}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 rounded-[14px] border border-border bg-popover p-3">
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.05em]"
                style={{ color: alertTone }}
              >
                <AlertIcon className="size-3" strokeWidth={2.6} />
                Tripwires
              </span>
              <span className="truncate font-mono text-[0.82rem] font-semibold text-foreground">
                {p0 + p1 === 0 ? 'all clear' : `${p0} P0 · ${p1} P1`}
              </span>
            </div>
          </div>

          <div className="flex max-h-[320px] flex-1 flex-col overflow-hidden rounded-[12px] border border-border bg-popover px-4 py-1.5">
            {feed.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-10 text-center text-xs text-muted-foreground">
                No real events yet — waiting for the webhook.
              </div>
            ) : (
              feed.map((row, i) => {
                const Icon = iconFor(row)
                const tone = toneFor(row)
                return (
                  <div
                    key={row.key}
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
                      style={{ color: tone, background: `${tone}22` }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 text-[0.84rem] leading-[1.35]">
                      <span className="font-mono font-semibold text-foreground">
                        {row.actor}
                      </span>{' '}
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary hover:underline"
                        >
                          {row.body}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{row.body}</span>
                      )}
                    </div>
                    <span className="whitespace-nowrap font-mono text-[0.72rem] text-muted-foreground">
                      {timeAgo(row.at, now)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

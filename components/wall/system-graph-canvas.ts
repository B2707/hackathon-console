// Draw + animation core for the Live System Graph (handoff `team-board.html`
// script lines 2675–2752). Framework-agnostic: the React panel owns the feed
// state + node colours and hands them in; this module owns the <canvas> render
// loop, the fixed event sequence, packet motion, node pulses and hover.
//
// Node COLOURS are supplied by the panel (real seat/alert state) via a live
// ref, so a 15s poll can recolour nodes without restarting the loop. Values in
// the ref must be HEX (the canvas parses them to rgba()).

export type FeedType =
  | 'seat'
  | 'ci'
  | 'ok'
  | 'review'
  | 'deploy'
  | 'agent'
  | 'error'

export type FeedSegment = { t: string; mono?: boolean; danger?: boolean }
export type SysEvent = { type: FeedType; actor: string; segments: FeedSegment[] }
export type FeedRow = SysEvent & { id: string; time: string; justAdded?: boolean }

type NodeType = 'repo' | 'seat' | 'agent' | 'ci' | 'test' | 'deploy'
export type NodeDef = {
  id: string
  x: number
  y: number
  t: NodeType
  label: string
  r?: number
}

// Node layout (fractions of the canvas box) — repo at centre, seats down the
// left rail, agents/CI/CD around the right + bottom. Verbatim from the source.
export const NODES: NodeDef[] = [
  { id: 'repo', x: 0.52, y: 0.5, t: 'repo', label: 'repo', r: 14 },
  { id: 'bader', x: 0.11, y: 0.2, t: 'seat', label: 'bader' },
  { id: 'sjp', x: 0.11, y: 0.42, t: 'seat', label: 'sjp' },
  { id: 'amr', x: 0.11, y: 0.64, t: 'seat', label: 'amr' },
  { id: 'adham', x: 0.11, y: 0.86, t: 'seat', label: 'adham' },
  { id: 'agent', x: 0.33, y: 0.13, t: 'agent', label: 'claude-agent' },
  { id: 'review', x: 0.83, y: 0.17, t: 'agent', label: 'review-bot' },
  { id: 'ci', x: 0.89, y: 0.44, t: 'ci', label: 'ci-runner' },
  { id: 'test', x: 0.86, y: 0.71, t: 'test', label: 'tests' },
  { id: 'deploy', x: 0.66, y: 0.9, t: 'deploy', label: 'deploy-bot' },
  { id: 'lint', x: 0.44, y: 0.9, t: 'ci', label: 'lint' },
]

export const EDGES: [string, string][] = [
  ['bader', 'repo'],
  ['sjp', 'repo'],
  ['amr', 'repo'],
  ['adham', 'repo'],
  ['agent', 'repo'],
  ['repo', 'review'],
  ['review', 'repo'],
  ['repo', 'ci'],
  ['ci', 'test'],
  ['test', 'deploy'],
  ['lint', 'ci'],
  ['repo', 'lint'],
]

// Fallback colour by node type (packet colour + legend). Real per-node colours
// come from the panel's colour ref.
export const NODE_TYPE_COLOR: Record<NodeType, string> = {
  seat: '#4d8dff',
  agent: '#a78bfa',
  ci: '#fbbf24',
  test: '#f97316',
  deploy: '#22c55e',
  repo: '#f6f7f9',
}

export const LEGEND: { label: string; color: string }[] = [
  { label: 'seat', color: '#4d8dff' },
  { label: 'agent', color: '#a78bfa' },
  { label: 'ci', color: '#fbbf24' },
  { label: 'test', color: '#f97316' },
  { label: 'deploy', color: '#22c55e' },
]

// Feed-row icon tile colours, mirroring the prototype's `.ev-ic.*` classes.
export const EV_STYLE: Record<FeedType, { color: string; bg: string }> = {
  seat: { color: 'var(--primary)', bg: 'rgba(77,141,255,.12)' },
  ci: { color: 'var(--warning)', bg: 'rgba(251,191,36,.14)' },
  ok: { color: 'var(--success)', bg: 'rgba(34,197,94,.14)' },
  review: { color: 'var(--violet)', bg: 'rgba(167,139,250,.14)' },
  deploy: { color: '#60a5fa', bg: 'rgba(96,165,250,.14)' },
  agent: { color: 'var(--danger)', bg: 'rgba(251,113,133,.14)' },
  error: { color: 'var(--danger)', bg: 'rgba(248,113,113,.16)' },
}

// Static-first seed rows (the feed shows real content immediately) — from the
// prototype's `#activity-stream` markup.
export const SEED_FEED: FeedRow[] = [
  { id: 'seed-0', type: 'ci', actor: 'ci-runner', time: '8s', segments: [{ t: 'tests passed on ' }, { t: 'feature/logs-table', mono: true }] },
  { id: 'seed-1', type: 'review', actor: 'review-bot', time: '24s', segments: [{ t: 'approved ' }, { t: 'PR #58', mono: true }] },
  { id: 'seed-2', type: 'seat', actor: 'bader', time: '41s', segments: [{ t: 'pushed 3 commits to ' }, { t: 'feature/logs-table', mono: true }] },
  { id: 'seed-3', type: 'deploy', actor: 'deploy-bot', time: '1m', segments: [{ t: 'shipped preview ' }, { t: 'pr-61.wall.dev', mono: true }] },
  { id: 'seed-4', type: 'error', actor: 'ci-runner', time: '3m', segments: [{ t: 'build ' }, { t: 'failed', danger: true }, { t: ' on ' }, { t: 'origin/main', mono: true }] },
]

// The fixed ordered sequence: push → build → tests → deploy → review → approve
// → lint → agent → build-failed-on-main. Each entry fires a packet along the
// (from,to) edge and prepends its event to the feed.
export const SEQUENCE: { from: string; to: string; ev: SysEvent }[] = [
  { from: 'bader', to: 'repo', ev: { type: 'seat', actor: 'bader', segments: [{ t: 'pushed 3 commits to ' }, { t: 'feature/logs-table', mono: true }] } },
  { from: 'repo', to: 'ci', ev: { type: 'ci', actor: 'ci-runner', segments: [{ t: 'build started on ' }, { t: 'feature/logs-table', mono: true }] } },
  { from: 'ci', to: 'test', ev: { type: 'ci', actor: 'ci-runner', segments: [{ t: 'running vitest suite' }] } },
  { from: 'test', to: 'deploy', ev: { type: 'deploy', actor: 'deploy-bot', segments: [{ t: 'shipped preview ' }, { t: 'pr-61.wall.dev', mono: true }] } },
  { from: 'repo', to: 'review', ev: { type: 'review', actor: 'review-bot', segments: [{ t: 'reviewing ' }, { t: 'PR #61', mono: true }] } },
  { from: 'review', to: 'repo', ev: { type: 'ok', actor: 'review-bot', segments: [{ t: 'approved ' }, { t: 'PR #58', mono: true }] } },
  { from: 'lint', to: 'ci', ev: { type: 'ci', actor: 'ci-runner', segments: [{ t: 'lint clean on ' }, { t: 'feature/kanban', mono: true }] } },
  { from: 'agent', to: 'repo', ev: { type: 'agent', actor: 'claude-agent', segments: [{ t: 'opened ' }, { t: 'PR #62', mono: true }, { t: ' — token analytics' }] } },
  { from: 'ci', to: 'repo', ev: { type: 'error', actor: 'ci-runner', segments: [{ t: 'build ' }, { t: 'failed', danger: true }, { t: ' on ' }, { t: 'origin/main', mono: true }] } },
]

type RNode = NodeDef & { r: number; pulse: number; flashUntil: number }
type REdge = { a: RNode; b: RNode; glow: number }
type Packet = { from: RNode; to: RNode; p: number }

export type MountOptions = {
  /** Live map of nodeId -> HEX colour, reflecting real seat/alert state. */
  colorsRef: { current: Record<string, string> }
  /** Called when the sequence advances, so the panel can prepend to the feed. */
  onEmit: (ev: SysEvent) => void
  /** Freeze gate: true when window.__wallPaused OR prefers-reduced-motion. */
  paused: () => boolean
}

const TAU = Math.PI * 2
const CYCLE_S = 2.2
const FLASH_MS = 1600

function rgb(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

/**
 * Wire up the canvas render loop. Returns a cleanup fn that cancels the rAF and
 * removes every listener/observer. Under prefers-reduced-motion no continuous
 * loop runs — a single static frame is drawn (and redrawn on resize).
 */
export function mountSystemGraph(
  canvas: HTMLCanvasElement,
  { colorsRef, onEmit, paused }: MountOptions
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let w = 0
  let h = 0

  const nodes: RNode[] = NODES.map((n) => ({ ...n, r: n.r ?? 7, pulse: 0, flashUntil: 0 }))
  const byId: Record<string, RNode> = {}
  nodes.forEach((n) => (byId[n.id] = n))
  const edges: REdge[] = EDGES.map(([a, b]) => ({ a: byId[a], b: byId[b], glow: 0 }))
  const packets: Packet[] = []

  // Mutable loop state (declared up-front so every closure below can read it).
  let raf = 0
  let acc = 0
  let last = 0
  let seqI = 0
  let staticDrawn = false

  const px = (n: RNode) => n.x * w
  const py = (n: RNode) => n.y * h
  let hover: RNode | null = null

  const colorOf = (n: RNode): string => {
    if (n.flashUntil && performance.now() < n.flashUntil) return '#22c55e'
    return colorsRef.current[n.id] || NODE_TYPE_COLOR[n.t] || '#4d8dff'
  }

  function resize() {
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function drawNode(n: RNode) {
    const col = colorOf(n)
    const X = px(n)
    const Y = py(n)
    if (n.pulse > 0) {
      ctx!.beginPath()
      ctx!.arc(X, Y, n.r + 6 + (1 - n.pulse) * 16, 0, TAU)
      ctx!.strokeStyle = `rgba(${rgb(col)},${(n.pulse * 0.55).toFixed(3)})`
      ctx!.lineWidth = 2
      ctx!.stroke()
      n.pulse *= 0.92
      if (n.pulse < 0.03) n.pulse = 0
    }
    ctx!.beginPath()
    ctx!.arc(X, Y, n.r, 0, TAU)
    ctx!.fillStyle = n.t === 'repo' ? '#101014' : `rgba(${rgb(col)},0.16)`
    ctx!.fill()
    ctx!.lineWidth = hover === n ? 2.6 : 2
    ctx!.strokeStyle = col
    ctx!.stroke()
    ctx!.beginPath()
    ctx!.arc(X, Y, n.r * 0.42, 0, TAU)
    ctx!.fillStyle = col
    ctx!.fill()
    ctx!.font = '600 11px ui-monospace, Menlo, monospace'
    ctx!.textAlign = 'center'
    ctx!.textBaseline = 'top'
    ctx!.fillStyle = hover === n ? '#f6f7f9' : 'rgba(150,155,170,0.85)'
    ctx!.fillText(n.label, X, Y + n.r + 5)
  }

  function drawEdge(e: REdge, glow: number, faint: number) {
    ctx!.beginPath()
    ctx!.moveTo(px(e.a), py(e.a))
    ctx!.lineTo(px(e.b), py(e.b))
    const hl = !!hover && (e.a === hover || e.b === hover)
    const g = Math.max(glow, hl ? 0.6 : 0)
    ctx!.strokeStyle = `rgba(120,140,180,${(faint + g * 0.5).toFixed(3)})`
    ctx!.lineWidth = hl ? 1.6 : 1
    ctx!.stroke()
  }

  function drawStatic() {
    ctx!.clearRect(0, 0, w, h)
    edges.forEach((e) => drawEdge(e, 0, 0.14))
    nodes.forEach(drawNode)
  }

  function fire() {
    const s = SEQUENCE[seqI % SEQUENCE.length]
    seqI += 1
    const from = byId[s.from]
    const to = byId[s.to]
    packets.push({ from, to, p: 0 })
    const e = edges.find(
      (x) => (x.a === from && x.b === to) || (x.a === to && x.b === from)
    )
    if (e) e.glow = 1
    if (to.id === 'deploy') to.flashUntil = performance.now() + FLASH_MS
    onEmit(s.ev)
  }

  function frame(ts: number) {
    raf = requestAnimationFrame(frame)
    // Freeze to the static state when paused (flag or reduced-motion) but keep
    // the loop alive so it resumes the instant the flag clears. Draw the static
    // frame once on entering the paused state, not every tick.
    if (paused()) {
      if (!staticDrawn) {
        drawStatic()
        staticDrawn = true
      }
      last = 0
      return
    }
    staticDrawn = false
    if (!last) last = ts
    const dt = Math.min((ts - last) / 1000, 0.05)
    last = ts
    acc += dt
    ctx!.clearRect(0, 0, w, h)
    if (acc > CYCLE_S) {
      acc = 0
      fire()
    }
    edges.forEach((e) => {
      drawEdge(e, e.glow, 0.09)
      e.glow *= 0.94
      if (e.glow < 0.01) e.glow = 0
    })
    for (let i = packets.length - 1; i >= 0; i -= 1) {
      const pk = packets[i]
      pk.p += dt * 1.1
      if (pk.p >= 1) {
        pk.to.pulse = 1
        packets.splice(i, 1)
        continue
      }
      const x = px(pk.from) + (px(pk.to) - px(pk.from)) * pk.p
      const y = py(pk.from) + (py(pk.to) - py(pk.from)) * pk.p
      const col = colorOf(pk.to)
      ctx!.beginPath()
      ctx!.arc(x, y, 3, 0, TAU)
      ctx!.fillStyle = col
      ctx!.shadowColor = col
      ctx!.shadowBlur = 10
      ctx!.fill()
      ctx!.shadowBlur = 0
    }
    nodes.forEach(drawNode)
  }

  function onMove(ev: MouseEvent) {
    const r = canvas.getBoundingClientRect()
    const mx = ev.clientX - r.left
    const my = ev.clientY - r.top
    let best = 26
    let found: RNode | null = null
    nodes.forEach((n) => {
      const d = Math.hypot(px(n) - mx, py(n) - my)
      if (d < best) {
        best = d
        found = n
      }
    })
    hover = found
    canvas.style.cursor = hover ? 'pointer' : 'default'
  }
  function onLeave() {
    hover = null
  }

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  function start() {
    cancelAnimationFrame(raf)
    raf = 0
    last = 0
    if (mql.matches) {
      drawStatic()
      return
    }
    raf = requestAnimationFrame(frame)
  }
  function onReduceChange() {
    packets.length = 0
    nodes.forEach((n) => {
      n.pulse = 0
      n.flashUntil = 0
    })
    start()
  }

  const ro = new ResizeObserver(() => {
    resize()
    if (paused()) drawStatic()
  })

  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('mouseleave', onLeave)
  mql.addEventListener('change', onReduceChange)
  ro.observe(canvas)
  resize()
  start()

  return () => {
    cancelAnimationFrame(raf)
    canvas.removeEventListener('mousemove', onMove)
    canvas.removeEventListener('mouseleave', onLeave)
    mql.removeEventListener('change', onReduceChange)
    ro.disconnect()
  }
}

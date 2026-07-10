// Draw + animation core for the Live System Graph. Framework-agnostic: the React
// panel owns the real node COLOURS + the event feed and hands them in; this
// module owns the <canvas> render loop, packet motion, node pulses/flash and
// hover-highlight.
//
// NOTHING fires on a timer. The panel diffs the real ticker/alert feed across
// polls and calls `handle.fire(spec)` once per genuinely-new event. Node COLOURS
// are supplied via a live ref (nodeId -> HEX) so the 15s poll recolours nodes
// without restarting the loop. Values in the ref must be HEX (parsed to rgba()).

export type NodeType =
  | 'repo'
  | 'seat'
  | 'agents'
  | 'ci'
  | 'tripwires'
  | 'discord'
  | 'console'

export type NodeDef = {
  id: string
  x: number
  y: number
  t: NodeType
  label: string
  r?: number
}

// Palette — mirrors the globals.css custom properties. Kept as HEX because the
// canvas parses these to rgba() for the fills / glows / pulse rings.
export const C = {
  primary: '#4d8dff', // --primary
  success: '#22c55e', // --success
  warning: '#fbbf24', // --warning
  danger: '#f87171', // --danger
  violet: '#a78bfa', // --violet
  muted: '#7c7d85', // --muted-foreground
  repoFill: '#101014',
} as const

export const SEAT_PREFIX = 'seat:'

// Fixed infrastructure nodes ringing the central repo. Seat nodes are generated
// per-roster (see buildGraph) down the left rail.
const INFRA: NodeDef[] = [
  { id: 'repo', x: 0.5, y: 0.5, t: 'repo', label: 'repo', r: 14 },
  { id: 'agents', x: 0.31, y: 0.12, t: 'agents', label: 'agents' },
  { id: 'ci', x: 0.85, y: 0.26, t: 'ci', label: 'ci' },
  { id: 'tripwires', x: 0.85, y: 0.64, t: 'tripwires', label: 'tripwires' },
  { id: 'discord', x: 0.9, y: 0.87, t: 'discord', label: 'discord' },
  { id: 'console', x: 0.52, y: 0.9, t: 'console', label: 'console' },
]

/**
 * Build the node + edge sets for a given roster + repo. Seats spread evenly down
 * the left rail; the fixed infra nodes ring the repo. Edges mirror the real data
 * flows: seat_i/agents -> repo, repo -> ci/tripwires/console, ci -> console,
 * tripwires -> discord/console.
 */
export function buildGraph(
  seatIds: string[],
  repoLabel: string
): { nodes: NodeDef[]; edges: [string, string][] } {
  const n = seatIds.length
  const seatNodes: NodeDef[] = seatIds.map((id, i) => ({
    id: `${SEAT_PREFIX}${id}`,
    x: 0.1,
    y: n <= 1 ? 0.5 : 0.18 + (i * 0.66) / (n - 1),
    t: 'seat',
    label: id,
  }))
  const nodes: NodeDef[] = [
    { ...INFRA[0], label: repoLabel || 'repo' },
    ...INFRA.slice(1),
    ...seatNodes,
  ]
  const edges: [string, string][] = [
    ['agents', 'repo'],
    ['repo', 'ci'],
    ['repo', 'tripwires'],
    ['repo', 'console'],
    ['ci', 'console'],
    ['tripwires', 'discord'],
    ['tripwires', 'console'],
    ...seatNodes.map((s) => [s.id, 'repo'] as [string, string]),
  ]
  return { nodes, edges }
}

// Bottom-left legend — the real node taxonomy.
export const LEGEND: { label: string; color: string }[] = [
  { label: 'seat', color: C.primary },
  { label: 'agents', color: C.violet },
  { label: 'ci', color: C.warning },
  { label: 'tripwires', color: C.danger },
  { label: 'discord', color: C.muted },
  { label: 'console', color: C.primary },
]

// A packet the panel asks us to animate for one real event. `from`/`to` are node
// ids; `pulse` nodes ring immediately; `flash` overrides a node's colour briefly.
export type PacketSpec = {
  from: string
  to: string
  color: string
  pulse?: string[]
  flash?: { id: string; color: string }
}

export type SystemGraphHandle = {
  /** Animate one real event (ignored while paused / reduced-motion). */
  fire: (spec: PacketSpec) => void
  /** Repaint the static frame — used when a poll recolours nodes while paused. */
  redraw: () => void
  /** Cancel the rAF and detach every listener / observer. */
  destroy: () => void
}

export type MountOptions = {
  nodes: NodeDef[]
  edges: [string, string][]
  /** Live map of nodeId -> HEX colour reflecting real seat / alert / ci state. */
  colorsRef: { current: Record<string, string> }
  /** Freeze gate: true when window.__wallPaused OR prefers-reduced-motion. */
  paused: () => boolean
}

type RNode = NodeDef & {
  r: number
  pulse: number
  flashUntil: number
  flashColor: string
}
type REdge = { a: RNode; b: RNode; glow: number }
type Packet = { from: RNode; to: RNode; p: number; color: string }

const TAU = Math.PI * 2
const FLASH_MS = 1600

const TYPE_FALLBACK: Record<NodeType, string> = {
  repo: C.primary,
  seat: C.primary,
  agents: C.violet,
  ci: C.warning,
  tripwires: C.warning,
  discord: C.muted,
  console: C.primary,
}

function rgb(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(h.slice(0, 6), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

/**
 * Wire up the canvas render loop for one node/edge set. Returns a handle the
 * panel drives (fire / redraw / destroy). Under prefers-reduced-motion no
 * continuous loop runs — a static frame is drawn (and repainted on redraw /
 * resize). When window.__wallPaused flips, the loop freezes to the static frame.
 */
export function mountSystemGraph(
  canvas: HTMLCanvasElement,
  { nodes: nodeDefs, edges: edgeDefs, colorsRef, paused }: MountOptions
): SystemGraphHandle {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { fire() {}, redraw() {}, destroy() {} }
  const g: CanvasRenderingContext2D = ctx

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let w = 0
  let h = 0

  const nodes: RNode[] = nodeDefs.map((n) => ({
    ...n,
    r: n.r ?? 7,
    pulse: 0,
    flashUntil: 0,
    flashColor: C.danger,
  }))
  const byId: Record<string, RNode> = {}
  nodes.forEach((n) => (byId[n.id] = n))
  const edges: REdge[] = edgeDefs
    .map(([a, b]) => ({ a: byId[a], b: byId[b], glow: 0 }))
    .filter((e) => e.a && e.b)
  const packets: Packet[] = []

  let raf = 0
  let last = 0
  let needsStatic = true
  let hover: RNode | null = null

  const px = (n: RNode) => n.x * w
  const py = (n: RNode) => n.y * h

  const colorOf = (n: RNode): string => {
    if (n.flashUntil && performance.now() < n.flashUntil) return n.flashColor
    return colorsRef.current[n.id] || TYPE_FALLBACK[n.t] || C.primary
  }

  function resize() {
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function drawNode(n: RNode) {
    const col = colorOf(n)
    const X = px(n)
    const Y = py(n)
    if (n.pulse > 0) {
      g.beginPath()
      g.arc(X, Y, n.r + 6 + (1 - n.pulse) * 16, 0, TAU)
      g.strokeStyle = `rgba(${rgb(col)},${(n.pulse * 0.55).toFixed(3)})`
      g.lineWidth = 2
      g.stroke()
      n.pulse *= 0.92
      if (n.pulse < 0.03) n.pulse = 0
    }
    g.beginPath()
    g.arc(X, Y, n.r, 0, TAU)
    g.fillStyle = n.t === 'repo' ? C.repoFill : `rgba(${rgb(col)},0.16)`
    g.fill()
    g.lineWidth = hover === n ? 2.6 : 2
    g.strokeStyle = col
    g.stroke()
    g.beginPath()
    g.arc(X, Y, n.r * 0.42, 0, TAU)
    g.fillStyle = col
    g.fill()
    g.font = '600 11px ui-monospace, Menlo, monospace'
    g.textAlign = 'center'
    g.textBaseline = 'top'
    g.fillStyle = hover === n ? '#f6f7f9' : 'rgba(150,155,170,0.85)'
    g.fillText(n.label, X, Y + n.r + 5)
  }

  function drawEdge(e: REdge, glow: number, faint: number) {
    g.beginPath()
    g.moveTo(px(e.a), py(e.a))
    g.lineTo(px(e.b), py(e.b))
    const hl = !!hover && (e.a === hover || e.b === hover)
    const gg = Math.max(glow, hl ? 0.6 : 0)
    g.strokeStyle = `rgba(120,140,180,${(faint + gg * 0.5).toFixed(3)})`
    g.lineWidth = hl ? 1.6 : 1
    g.stroke()
  }

  function drawStatic() {
    g.clearRect(0, 0, w, h)
    edges.forEach((e) => drawEdge(e, 0, 0.14))
    nodes.forEach(drawNode)
  }

  function fire(spec: PacketSpec) {
    if (paused()) return
    const from = byId[spec.from]
    const to = byId[spec.to]
    if (!from || !to) return
    packets.push({ from, to, p: 0, color: spec.color })
    const e = edges.find(
      (x) => (x.a === from && x.b === to) || (x.a === to && x.b === from)
    )
    if (e) e.glow = 1
    spec.pulse?.forEach((id) => {
      const nn = byId[id]
      if (nn) nn.pulse = 1
    })
    if (spec.flash) {
      const nn = byId[spec.flash.id]
      if (nn) {
        nn.flashUntil = performance.now() + FLASH_MS
        nn.flashColor = spec.flash.color
      }
    }
  }

  function frame(ts: number) {
    raf = requestAnimationFrame(frame)
    // Freeze to the static frame while paused (flag or reduced-motion) but keep
    // the loop alive so it resumes instantly. Repaint only when marked dirty.
    if (paused()) {
      if (needsStatic) {
        drawStatic()
        needsStatic = false
      }
      last = 0
      return
    }
    needsStatic = true // re-entering pause will repaint with the latest colours
    if (!last) last = ts
    const dt = Math.min((ts - last) / 1000, 0.05)
    last = ts
    g.clearRect(0, 0, w, h)
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
      g.beginPath()
      g.arc(x, y, 3, 0, TAU)
      g.fillStyle = pk.color
      g.shadowColor = pk.color
      g.shadowBlur = 10
      g.fill()
      g.shadowBlur = 0
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
    needsStatic = true
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

  function redraw() {
    // Repaint the static frame with the current colour ref. Needed when the wall
    // is paused / reduced-motion and a poll changed node colours (the animated
    // loop repaints on its own, so just mark it dirty there).
    if (mql.matches || paused()) drawStatic()
    else needsStatic = true
  }

  const ro = new ResizeObserver(() => {
    resize()
    if (mql.matches || paused()) drawStatic()
    else needsStatic = true
  })

  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('mouseleave', onLeave)
  mql.addEventListener('change', onReduceChange)
  ro.observe(canvas)
  resize()
  start()

  return {
    fire,
    redraw,
    destroy() {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      mql.removeEventListener('change', onReduceChange)
      ro.disconnect()
    },
  }
}

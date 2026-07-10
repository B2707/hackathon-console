'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Sparkline — a lightweight SVG polyline chart with an optional hover tooltip.
 *
 * Ported from the handoff `.spark-host` hydration: a non-scaling-stroke
 * polyline in a `0 0 100 H` viewBox (preserveAspectRatio="none"), plus a thin
 * vertical cursor and a tooltip that snaps to the nearest data point on
 * mousemove, showing the value, a per-point label, and the metric name.
 *
 * Static-first: the polyline renders its final values on first paint, so
 * print / PDF / screenshot export shows a real chart (no empty entrance state).
 */
export type SparklineProps = {
  /** The series. Rendered left → right; the last value is "now". */
  values: number[]
  /** Line color (CSS color / token). */
  color: string
  /** Per-point labels. Defaults to hourly offsets ("now", "1h ago", ...). */
  labels?: string[]
  /** Unit appended to the tooltip value (e.g. "commits"). */
  unit?: string
  /** Metric name shown under the tooltip value. */
  metric?: string
  /** viewBox height (the intrinsic aspect; the SVG still stretches to fit). */
  height?: number
  className?: string
  ariaLabel?: string
}

const PAD = 4
const VIEW_W = 100

export function Sparkline({
  values,
  color,
  labels,
  unit,
  metric,
  height = 40,
  className,
  ariaLabel,
}: SparklineProps) {
  const [hover, setHover] = React.useState<number | null>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)

  const n = values.length
  const min = n ? Math.min(...values) : 0
  const max = n ? Math.max(...values) : 1
  const range = max - min || 1

  const points = values.map((v, i) => ({
    x: n > 1 ? PAD + (i * (VIEW_W - 2 * PAD)) / (n - 1) : VIEW_W / 2,
    y: height - PAD - ((v - min) / range) * (height - 2 * PAD),
    v,
  }))

  const resolvedLabels =
    labels && labels.length === n
      ? labels
      : points.map((_, i) => {
          const offset = n - 1 - i
          return offset === 0 ? 'now' : `${offset}h ago`
        })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (n < 1) return
    const rect = hostRef.current?.getBoundingClientRect()
    if (!rect) return
    const fx = (e.clientX - rect.left) / rect.width
    const i = Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1))))
    setHover(i)
  }

  const active = hover != null ? points[hover] : null

  return (
    <div
      ref={hostRef}
      className={cn('relative h-full w-full', className)}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
      role="img"
      aria-label={ariaLabel ?? (metric ? `${metric} sparkline` : 'sparkline')}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <polyline
          points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {active && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: `${active.x}%` }}
          />
          <span
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[125%] whitespace-nowrap rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[0.66rem] text-foreground"
            style={{ left: `${active.x}%`, top: `${(active.y / height) * 100}%` }}
          >
            <b className="font-bold">
              {active.v}
              {unit ? ` ${unit}` : ''}
            </b>{' '}
            · {resolvedLabels[hover as number]}
            {metric && (
              <i className="mt-px block not-italic text-[0.6rem] text-muted-foreground">
                {metric}
              </i>
            )}
          </span>
        </>
      )}
    </div>
  )
}

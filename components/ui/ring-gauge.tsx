import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * RingGauge — a single-arc SVG progress ring with a centered number.
 *
 * Ported from the handoff `.ring` / `.seat-gauge`: a faint full-circle track
 * with a colored arc painted via `stroke-dashoffset`, the SVG rotated -90deg so
 * the arc starts at 12 o'clock. Static-first — the arc renders its final value
 * on first paint (the dashoffset is computed inline), so screenshot/PDF export
 * shows real content.
 *
 * `color` is any CSS color (pass a token like `var(--success)` or a hex). The
 * dedicated `animated-circular-progress-bar` primitive was intentionally NOT
 * reused here: it forces a two-color gauge with a rotation gap and always
 * displays `currentPercent`; this ring is the simpler handoff shape with a
 * `color` prop and an overridable centered label.
 */
export type RingGaugeProps = {
  /** 0–100. Clamped. */
  value: number
  /** Arc stroke color (CSS color / token, e.g. `var(--success)`). */
  color: string
  /** Square px size of the ring. Default 46 (seat gauge). */
  size?: number
  /** Arc + track thickness in px. Default 5. */
  strokeWidth?: number
  /** Track (unfilled) color. Default `var(--border)`. */
  trackColor?: string
  /** Overrides the centered text (defaults to the rounded value). */
  label?: React.ReactNode
  /** Extra classes for the centered number. */
  numberClassName?: string
  className?: string
}

export function RingGauge({
  value,
  color,
  size = 46,
  strokeWidth = 5,
  trackColor = 'var(--border)',
  label,
  numberClassName,
  className,
}: RingGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - clamped / 100)
  const center = size / 2

  return (
    <div
      className={cn('relative flex-none', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={trackColor}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 grid place-items-center font-mono text-[0.62rem] font-semibold tabular-nums text-muted-foreground',
          numberClassName
        )}
      >
        {label ?? Math.round(clamped)}
      </span>
    </div>
  )
}

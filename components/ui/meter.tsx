import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Meter — a labeled horizontal progress bar.
 *
 * Ported from the handoff `.meter-row`: a short mono uppercase label, a rounded
 * track with a colored fill sized by `value` (0–100), and an optional
 * right-aligned readout. The readout is decoupled from the bar width so a raw
 * count ("12") can sit next to a percentage-driven fill, matching the seat
 * meters in the prototype.
 */
export type MeterProps = {
  /** Short label shown on the left (e.g. "PRs", "CI"). */
  label: string
  /** 0–100, drives the fill width. Clamped. */
  value: number
  /** Fill color (CSS color / token, e.g. `var(--primary)`). */
  color: string
  /** Right-aligned readout. Defaults to `${value}%`. */
  display?: React.ReactNode
  className?: string
}

export function Meter({ label, value, color, display, className }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn(
        'grid grid-cols-[34px_1fr_auto] items-center gap-2.5',
        className
      )}
    >
      <span className="font-mono text-[0.64rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <span className="min-w-[30px] text-right font-mono text-[0.66rem] text-muted-foreground tabular-nums">
        {display ?? `${clamped}%`}
      </span>
    </div>
  )
}

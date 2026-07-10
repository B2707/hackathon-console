'use client'

import { motion } from 'framer-motion'

type CircularGaugeProps = {
  /** Fill fraction, 0..1. */
  value: number
  size?: number
  strokeWidth?: number
  /** Stroke color of the filled arc (defaults to the primary token). */
  color?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Lightweight SVG progress ring using stroke-dashoffset — no charting dep.
 * The arc animates from empty to `value` on mount.
 */
export function CircularGauge({
  value,
  size = 44,
  strokeWidth = 4,
  color = 'var(--primary)',
  className,
  children,
}: CircularGaugeProps) {
  const clamped = Math.min(1, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="var(--border)"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

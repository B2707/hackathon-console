'use client'

import { cn } from '@/lib/utils'

/**
 * BackgroundCanvas — the fixed decorative "falling grid" layer behind the wall
 * (handoff `team-board.html` lines 1801–1804; the rAF grid loop lives in the
 * prototype script at lines 2606–2651). It sits above the body gradient
 * (defined in globals.css) and below the wall content (z-0).
 *
 * DATA: none — purely decorative. The panel owns the <canvas> render loop,
 * which must be gated on prefers-reduced-motion (fall back to a static faint
 * dot grid).
 *
 * STUB: renders the empty fixed layer so the shell composes.
 */
export type BackgroundCanvasProps = {
  className?: string
}

export function BackgroundCanvas({ className }: BackgroundCanvasProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
    />
  )
}

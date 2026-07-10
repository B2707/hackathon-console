'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * BackgroundCanvas — the fixed decorative "falling grid" layer behind the wall
 * (handoff `team-board.html` lines 1801–1804; rAF grid loop at lines 2606–2651).
 * Sits above the body gradient (globals.css) and below the wall content (z-0).
 *
 * Ports the prototype's downward-flowing brightness wave over a fixed dot grid.
 * The loop is gated on `window.__wallPaused` (the Tweaks panel's "Live graph
 * motion" switch) and on `prefers-reduced-motion` — when reduced-motion is set
 * it renders a single static faint dot grid and never starts the rAF loop; when
 * paused it freezes on the current frame. hi-DPI aware and resize-safe.
 *
 * DATA: none — purely decorative.
 */
declare global {
  interface Window {
    __wallPaused?: boolean
  }
}

export type BackgroundCanvasProps = {
  className?: string
}

const CELL = 26

export function BackgroundCanvas({ className }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctx2d = canvasEl.getContext('2d')
    if (!ctx2d) return
    // Explicitly-typed non-null handles: control-flow narrowing isn't preserved
    // into the nested closures below, so give them a declared non-null type.
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = ctx2d

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let cols = 0
    let rows = 0
    let w = 0
    let h = 0
    let raf = 0
    let t = 0

    function resize() {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL) + 1
      rows = Math.ceil(h / CELL) + 1
    }

    // Reduced-motion fallback: a static faint grid of dots.
    function drawStatic() {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(77,141,255,0.05)'
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)
        }
      }
    }

    // One frame of the downward-flowing wave of brightness (t drives the flow).
    function drawWave() {
      ctx.clearRect(0, 0, w, h)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const band = Math.sin(y * 0.55 - t * 5 + Math.sin(x * 0.6) * 0.8)
          const a = Math.max(0, band) * 0.1 + 0.015
          ctx.fillStyle = 'rgba(77,141,255,' + a.toFixed(3) + ')'
          const s = 2 + Math.max(0, band) * 1.5
          ctx.fillRect(x * CELL + CELL / 2 - s / 2, y * CELL + CELL / 2 - s / 2, s, s)
        }
      }
    }

    function frame() {
      if (media.matches) {
        // Reduced motion: hold a static frame, stop the loop.
        drawStatic()
        return
      }
      // Advance time only while unpaused; always redraw so a paused frame is
      // a frozen (static) render rather than a blank canvas.
      if (!window.__wallPaused) t += 0.006
      drawWave()
      raf = requestAnimationFrame(frame)
    }

    function start() {
      cancelAnimationFrame(raf)
      resize()
      if (media.matches) drawStatic()
      else raf = requestAnimationFrame(frame)
    }

    function onResize() {
      resize()
      // Keep the static fallback correct across viewport changes.
      if (media.matches) drawStatic()
    }

    start()
    window.addEventListener('resize', onResize)
    media.addEventListener('change', start)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      media.removeEventListener('change', start)
    }
  }, [])

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

'use client'

import { Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * TweaksPanel — a self-contained, fixed bottom-right controls panel (handoff
 * `team-board.html`: CSS lines 1668–1688, behavior at lines 2950–3019).
 *
 * A gear FAB toggles a compact panel (hidden by default). Every control applies
 * a real side effect via `useEffect` — it does NOT depend on the shell to wire
 * anything up (all props are optional). Effects:
 *  - Accent  → sets `--primary` / `--ring` on <html>.
 *  - Layout  → toggles `body.layout-stacked` (integrator supplies the CSS).
 *  - Compact → toggles `body.compact`.
 *  - Motion  → sets `window.__wallPaused` (pauses the Live System Graph loop).
 */
declare global {
  interface Window {
    __wallPaused?: boolean
  }
}

export type TweaksState = {
  /** Accent hex applied to --primary / --ring. */
  accent: string
  /** Duo-row layout: side-by-side or stacked. */
  layout: 'side' | 'stacked'
  /** Tighten wall padding / gaps. */
  compact: boolean
  /** Run the Live System Graph packet loop. */
  graphMotion: boolean
}

export const DEFAULT_TWEAKS: TweaksState = {
  accent: '#4d8dff',
  layout: 'side',
  compact: false,
  graphMotion: true,
}

export type TweaksPanelProps = {
  /** Whether the panel starts open. Default false (only the gear shows). */
  open?: boolean
  /** Seed values for the controls. */
  value?: TweaksState
  /** Fired when any control changes. */
  onChange?: (next: TweaksState) => void
  /** Fired when the panel is dismissed. */
  onClose?: () => void
}

// [hex, label] — the prototype's accent set, verbatim.
const ACCENTS: ReadonlyArray<readonly [string, string]> = [
  ['#4d8dff', 'Blue'],
  ['#a78bfa', 'Violet'],
  ['#22c55e', 'Green'],
  ['#fbbf24', 'Amber'],
]

const LABEL =
  'block text-[0.64rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground'

export function TweaksPanel({
  open: openProp = false,
  value,
  onChange,
  onClose,
}: TweaksPanelProps) {
  const [open, setOpen] = useState(openProp)
  const [state, setState] = useState<TweaksState>(value ?? DEFAULT_TWEAKS)

  // Apply each tweak as a real DOM side effect whenever state changes.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', state.accent)
    root.style.setProperty('--ring', state.accent)
    document.body.classList.toggle('layout-stacked', state.layout === 'stacked')
    document.body.classList.toggle('compact', state.compact)
    window.__wallPaused = !state.graphMotion
  }, [state])

  function update(next: TweaksState) {
    setState(next)
    onChange?.(next)
  }

  function close() {
    setOpen(false)
    onClose?.()
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open tweaks"
        onClick={() => setOpen(true)}
        className="fixed bottom-[18px] right-[18px] z-[120] grid size-11 place-items-center rounded-full border border-border bg-popover text-muted-foreground shadow-[var(--shadow-lg)] backdrop-blur-[14px] transition-colors hover:text-foreground"
      >
        <Settings className="size-5" />
      </button>
    )
  }

  return (
    <div className="reveal-in fixed bottom-[18px] right-[18px] z-[120] w-[252px] rounded-[16px] border border-border bg-[rgba(16,16,20,0.96)] p-[15px] text-foreground shadow-[var(--shadow-lg)] backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className="mb-3.5 flex items-center justify-between">
        <h4 className="text-[0.95rem] font-[650]">Tweaks</h4>
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="grid size-[26px] place-items-center rounded-[7px] text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="size-[15px]" strokeWidth={2.2} />
        </button>
      </div>

      <div className="space-y-[15px]">
        {/* Accent swatches → --primary / --ring. */}
        <div>
          <span className={cn(LABEL, 'mb-2')}>Accent</span>
          <div className="flex gap-2">
            {ACCENTS.map(([hex, label]) => (
              <button
                key={hex}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={state.accent === hex}
                onClick={() => update({ ...state, accent: hex })}
                style={{ background: hex }}
                className={cn(
                  'size-[30px] cursor-pointer rounded-lg border-2 p-0',
                  state.accent === hex ? 'border-foreground' : 'border-transparent'
                )}
              />
            ))}
          </div>
        </div>

        {/* Duo-row layout → body.layout-stacked. */}
        <div>
          <span className={cn(LABEL, 'mb-2')}>Scoreboard &amp; Mangooli</span>
          <div className="flex gap-0.5 rounded-[9px] border border-border bg-muted p-[3px]">
            {(['side', 'stacked'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ ...state, layout: v })}
                className={cn(
                  'flex-1 cursor-pointer rounded-[7px] px-1 py-1.5 text-[0.74rem] font-semibold transition-colors',
                  state.layout === v
                    ? 'bg-card text-foreground shadow-[var(--shadow-sm)]'
                    : 'text-muted-foreground'
                )}
              >
                {v === 'side' ? 'Side by side' : 'Stacked'}
              </button>
            ))}
          </div>
        </div>

        {/* Compact density → body.compact. */}
        <Toggle
          label="Compact density"
          checked={state.compact}
          onToggle={() => update({ ...state, compact: !state.compact })}
        />

        {/* Live graph motion → window.__wallPaused. */}
        <Toggle
          label="Live graph motion"
          checked={state.graphMotion}
          onToggle={() => update({ ...state, graphMotion: !state.graphMotion })}
        />
      </div>
    </div>
  )
}

/** Prototype's `.tw-switch` — a native switch button (Enter/Space for free). */
function Toggle({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={LABEL}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          'relative h-[23px] w-10 flex-none cursor-pointer rounded-full border transition-colors',
          checked ? 'border-primary bg-[rgba(77,141,255,0.3)]' : 'border-border bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute left-[2px] top-[2px] size-[17px] rounded-full transition-transform',
            checked ? 'translate-x-[17px] bg-primary' : 'bg-muted-foreground'
          )}
        />
      </button>
    </div>
  )
}

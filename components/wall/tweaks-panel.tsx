'use client'

/**
 * TweaksPanel — a fixed bottom-right host-integrated controls panel, hidden
 * until toggled on (handoff `team-board.html`: CSS lines 1668–1688, behavior in
 * the script at lines 2950–3019). Controls: Accent swatches (sets --primary /
 * --ring), Scoreboard & Mangooli layout (side ↔ stacked), Compact density, and
 * Live graph motion on/off. Optional — back it with your settings store.
 *
 * STUB: hidden by default (returns null unless `open`). The panel agent builds
 * the swatches / segmented / switch controls and applies the state.
 */
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
  /** Whether the panel is shown. Default false (hidden). */
  open?: boolean
  /** Current tweak values. */
  value?: TweaksState
  /** Fired when any control changes. */
  onChange?: (next: TweaksState) => void
  /** Fired when the panel is dismissed. */
  onClose?: () => void
}

export function TweaksPanel({ open = false }: TweaksPanelProps) {
  if (!open) return null

  return (
    <div className="fixed bottom-[18px] right-[18px] z-[120] w-[252px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between">
        <h4 className="text-[0.95rem] font-[650]">Tweaks</h4>
        <span className="text-xs text-primary">building</span>
      </div>
    </div>
  )
}

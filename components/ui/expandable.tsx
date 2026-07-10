'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Expandable — a headless expandable card/row.
 *
 * Works controlled (`open` + `onOpenChange`) or uncontrolled (`defaultOpen`).
 * The header is a full-width toggle button with an optional chevron that rotates
 * 180° when open. The detail slot is revealed by React state — it is MOUNTED
 * only while open (a `revealIn` fade plays on mount) rather than driven by a
 * CSS `grid-template-rows: 0fr → 1fr` transition, which the handoff notes
 * collapses to 0 in Chromium for runtime-toggled panels.
 *
 * The reveal animation and chevron transition both inherit the global
 * `prefers-reduced-motion` guard, so no extra JS gating is needed.
 *
 * Chrome is intentionally minimal (button reset only) so panels own the card
 * styling via `className` / `headerClassName` / `contentClassName`. The wrapper
 * carries `data-open` for CSS/child hooks.
 */
export type ExpandableProps = {
  /** Header content; a function form receives the current open state. */
  header: React.ReactNode | ((open: boolean) => React.ReactNode)
  /** The detail slot, revealed while open. */
  children: React.ReactNode
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean
  /** Initial open state when uncontrolled. Default false. */
  defaultOpen?: boolean
  /** Fired on every toggle with the next open state. */
  onOpenChange?: (open: boolean) => void
  /** Render the trailing chevron. Default true. */
  showChevron?: boolean
  /** Disables toggling. */
  disabled?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  chevronClassName?: string
}

export function Expandable({
  header,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  showChevron = true,
  disabled = false,
  className,
  headerClassName,
  contentClassName,
  chevronClassName,
}: ExpandableProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = isControlled ? controlledOpen : internalOpen

  function toggle() {
    if (disabled) return
    const next = !open
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div className={className} data-open={open}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left font-[inherit] text-inherit',
          disabled && 'cursor-default',
          headerClassName
        )}
      >
        {typeof header === 'function' ? header(open) : header}
        {showChevron && (
          <span
            aria-hidden
            className={cn(
              'inline-flex flex-none text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
              chevronClassName
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div className={cn('reveal-in min-h-0 overflow-hidden', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}

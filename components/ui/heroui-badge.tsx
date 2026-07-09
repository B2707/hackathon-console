'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

// HeroUI-style Badge: a compound <Badge> / <Badge.Anchor> / <Badge.Label>. The
// Anchor is the element the badge attaches to; the Label is the absolutely
// positioned pill, styled from the color/variant/placement/size maps below.
export type BadgeColor =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
export type BadgeVariant = 'primary' | 'secondary' | 'soft'
export type BadgePlacement =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
export type BadgeSize = 'sm' | 'md' | 'lg'

const colorClasses: Record<BadgeVariant, Record<BadgeColor, string>> = {
  primary: {
    default: 'bg-primary text-primary-foreground border-primary',
    accent: 'bg-accent text-accent-foreground border-accent',
    success: 'bg-success text-success-foreground border-success',
    warning: 'bg-warning text-warning-foreground border-warning',
    danger: 'bg-danger text-danger-foreground border-danger',
  },
  secondary: {
    default: 'bg-secondary text-secondary-foreground border-border',
    accent: 'bg-accent text-accent-foreground border-border',
    success: 'bg-secondary text-success border-success/40',
    warning: 'bg-secondary text-warning border-warning/40',
    danger: 'bg-secondary text-danger border-danger/40',
  },
  soft: {
    default: 'bg-primary/15 text-primary border-transparent',
    accent: 'bg-accent/40 text-accent-foreground border-transparent',
    success: 'bg-success/15 text-success border-transparent',
    warning: 'bg-warning/15 text-warning border-transparent',
    danger: 'bg-danger/15 text-danger border-transparent',
  },
}

const placementClasses: Record<BadgePlacement, string> = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-4 min-w-4 px-1 text-[10px]',
  md: 'h-5 min-w-5 px-1.5 text-[11px]',
  lg: 'h-6 min-w-6 px-2 text-xs',
}

interface BadgeContextValue {
  color: BadgeColor
  variant: BadgeVariant
  placement: BadgePlacement
  size: BadgeSize
}

const BadgeContext = React.createContext<BadgeContextValue>({
  color: 'default',
  variant: 'primary',
  placement: 'top-right',
  size: 'md',
})

interface BadgeProps extends React.ComponentProps<'div'> {
  color?: BadgeColor
  variant?: BadgeVariant
  placement?: BadgePlacement
  size?: BadgeSize
}

function BadgeRoot({
  color = 'default',
  variant = 'primary',
  placement = 'top-right',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <BadgeContext.Provider value={{ color, variant, placement, size }}>
      <div
        data-slot="hero-badge"
        className={cn('relative inline-flex w-fit shrink-0', className)}
        {...props}
      >
        {children}
      </div>
    </BadgeContext.Provider>
  )
}

function BadgeAnchor({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="hero-badge-anchor"
      className={cn('relative flex', className)}
      {...props}
    />
  )
}

function BadgeLabel({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  const { color, variant, placement, size } = React.useContext(BadgeContext)
  return (
    <span
      data-slot="hero-badge-label"
      className={cn(
        'absolute z-10 inline-flex items-center justify-center gap-1 rounded-full border font-semibold leading-none whitespace-nowrap shadow-sm',
        colorClasses[variant][color],
        placementClasses[placement],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

const Badge = Object.assign(BadgeRoot, {
  Anchor: BadgeAnchor,
  Label: BadgeLabel,
})

export { Badge, BadgeAnchor, BadgeLabel }

import * as React from 'react'

import { cn } from '@/lib/utils'

// Lightweight, radix-free avatar. Identity is initials-only for the wall, so we
// skip image loading entirely and render a styled fallback.

function Avatar({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center bg-secondary text-xs font-semibold',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback }

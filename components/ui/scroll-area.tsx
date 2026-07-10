import * as React from 'react'

import { cn } from '@/lib/utils'

// Plain, dependency-free scroll container. Styling of the scrollbar itself is
// handled globally in globals.css (thin, calm). Kept as a named primitive so
// call sites read like the rest of the shadcn surface.
function ScrollArea({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="scroll-area"
      className={cn('min-h-0 overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  )
}

export { ScrollArea }

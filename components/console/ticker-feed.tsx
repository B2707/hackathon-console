'use client'

import { motion } from 'framer-motion'
import {
  Circle,
  CircleDot,
  CirclePlay,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  Radio,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { fadeInItem, staggerContainer } from '@/lib/motion'
import type { TickerEvent } from '@/lib/types'
import { timeAgo } from '@/lib/board'

const KIND: Record<string, { icon: LucideIcon; color: string }> = {
  push: { icon: GitCommitHorizontal, color: 'var(--muted-foreground)' },
  issue: { icon: CircleDot, color: 'var(--primary)' },
  pr: { icon: GitPullRequest, color: '#a78bfa' },
  comment: { icon: MessageSquare, color: 'var(--muted-foreground)' },
  ci: { icon: CirclePlay, color: 'var(--warning)' },
  ping: { icon: Radio, color: 'var(--success)' },
}
const FALLBACK = { icon: Circle, color: 'var(--muted-foreground)' }

export function TickerFeed({
  ticker,
  now,
}: {
  ticker: TickerEvent[]
  now: number
}) {
  return (
    <Card className="gap-0 p-0 xl:sticky xl:top-[4.75rem]">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
          <Radio className="size-3.5" />
          Activity
        </span>
      </div>
      <Separator />

      {ticker.length === 0 ? (
        <p className="text-muted-foreground/60 px-3 py-10 text-center text-xs">
          no activity yet
        </p>
      ) : (
        <ScrollArea className="max-h-[70vh] p-2 xl:max-h-[calc(100vh-8rem)]">
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col"
          >
            {ticker.map((event, i) => {
              const meta = KIND[event.kind] ?? FALLBACK
              const Icon = meta.icon
              return (
                <motion.li
                  key={`${event.at}-${i}`}
                  variants={fadeInItem}
                  className="hover:bg-accent/30 flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors"
                >
                  <span
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `color-mix(in oklab, ${meta.color} 14%, transparent)` }}
                  >
                    <Icon className="size-3.5" style={{ color: meta.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary block text-xs leading-snug transition-colors"
                      >
                        {event.text}
                      </a>
                    ) : (
                      <span className="block text-xs leading-snug">
                        {event.text}
                      </span>
                    )}
                    <span className="text-muted-foreground/70 mt-0.5 block font-mono text-[10px]">
                      {timeAgo(event.at, now)} ago
                    </span>
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </ScrollArea>
      )}
    </Card>
  )
}

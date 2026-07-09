'use client'

import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { livePulse } from '@/lib/motion'
import { timeAgo } from '@/lib/board'

type TopBarProps = {
  repo: string | null
  boardFetchedAt?: number
  now: number
  error: string | null
  isSyncing: boolean
  onReset: () => void
}

export function TopBar({
  repo,
  boardFetchedAt,
  now,
  error,
  isSyncing,
  onReset,
}: TopBarProps) {
  return (
    <header className="bg-background/70 supports-[backdrop-filter]:bg-background/55 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onReset}
          title="click to reset team key"
          className="group flex items-center gap-2.5 outline-none"
        >
          <span className="from-primary/90 to-primary/50 shadow-primary/20 flex size-7 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm">
            <span className="bg-primary-foreground size-2 rounded-[3px]" />
          </span>
          <span className="text-sm font-semibold tracking-tight group-hover:opacity-80">
            Team OS Console
          </span>
        </button>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <span className="truncate font-mono">
            {repo ?? 'no repo yet — webhook teaches it'}
          </span>
          {boardFetchedAt != null && (
            <>
              <span className="text-border">·</span>
              <span className="whitespace-nowrap">
                board {timeAgo(boardFetchedAt, now)} ago
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {error && (
            <span className="text-danger flex items-center gap-1.5 text-xs">
              <TriangleAlert className="size-3.5 shrink-0" />
              <span className="max-w-[42ch] truncate">{error}</span>
            </span>
          )}

          <div className="border-border/70 bg-card/60 flex items-center gap-2 rounded-full border px-2.5 py-1">
            <span className="relative flex size-2">
              {isSyncing ? (
                <span className="bg-primary size-2 rounded-full" />
              ) : (
                <>
                  <motion.span
                    className="bg-success absolute inline-flex size-2 rounded-full"
                    animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.9, 1] }}
                    transition={livePulse}
                  />
                  <span className="bg-success relative inline-flex size-2 rounded-full" />
                </>
              )}
            </span>
            {isSyncing ? (
              <span className="text-shimmer text-xs font-medium">syncing</span>
            ) : (
              <span className="text-muted-foreground text-xs font-medium">
                live
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

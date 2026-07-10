'use client'

import { GooeyText } from '@/components/ui/gooey-text-morphing'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { timeAgo } from '@/lib/board'

type WallHeaderProps = {
  repo: string | null
  boardFetchedAt?: number
  now: number
  isSyncing: boolean
  onRefresh: () => void
}

/**
 * Wordmark built from GooeyText (cycling TEAM OS / MISSION CONTROL / <repo>)
 * plus a TextShimmer LIVE / SYNCING indicator driven by isSyncing.
 */
export function WallHeader({
  repo,
  boardFetchedAt,
  now,
  isSyncing,
  onRefresh,
}: WallHeaderProps) {
  const repoShort = repo ? repo.split('/').slice(-1)[0].toUpperCase() : 'HACKATHON'
  const texts = ['TEAM OS', 'MISSION CONTROL', repoShort]

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        onClick={onRefresh}
        title="click to refresh"
        className="outline-none"
      >
        <GooeyText
          texts={texts}
          morphTime={1.1}
          cooldownTime={1.6}
          className="h-14 w-[min(90vw,26rem)]"
          textClassName="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        />
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            {isSyncing ? (
              <span className="size-2 rounded-full bg-primary" />
            ) : (
              <span className="size-2 rounded-full bg-success" />
            )}
          </span>
          <TextShimmer
            as="span"
            duration={1.4}
            className="text-[11px] font-semibold uppercase tracking-widest"
          >
            {isSyncing ? 'SYNCING…' : 'LIVE'}
          </TextShimmer>
        </span>

        <span className="text-border">·</span>
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
    </div>
  )
}

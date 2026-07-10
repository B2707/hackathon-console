'use client'

import { Card } from '@/components/ui/card'

/**
 * Leader Board — ranks by shipping (handoff `team-board.html` lines 1942–1986).
 *
 * A row = rank medal (gold/silver/bronze/none) · avatar + name + subline · big
 * right-aligned "PRs merged" metric (mono, --primary) · chevron. Expanding a row
 * reveals 6 tiles: PRs merged, commits, issues closed, reviews given, time
 * active, avg review. NOTE: no cost/token data lives here (that is analytics).
 *
 * DATA: all SAMPLE for now (lib/sample.SAMPLE_LEADERBOARD). // TODO: GitHub
 * aggregate API (PRs, commits, issues, reviews, Actions timing).
 *
 * STUB: renders the section header only.
 */
export type LeaderRow = {
  /** 1-based rank; drives the medal (1=gold, 2=silver, 3=bronze, else none). */
  rank: number
  /** Roster handle → avatar accent + initials. */
  seat: string
  /** Big headline metric. */
  prsMerged: number
  commits: number
  issuesClosed: number
  reviewsGiven: number
  /** e.g. "6h 20m". */
  timeActive: string
  /** e.g. "11m". */
  avgReview: string
  /** Small line under the name, e.g. "88 commits · 9 issues". */
  subline: string
}

export type LeaderBoardProps = {
  rows: LeaderRow[]
}

export function LeaderBoard({ rows }: LeaderBoardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-3">
        <span className="size-9 flex-none rounded-[10px] border border-primary/25 bg-primary/10" />
        <div className="min-w-0">
          <h2 className="text-[1.06rem] font-[650] leading-tight tracking-tight text-foreground">
            Leader Board
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rows.length} contributors ·{' '}
            <span className="text-primary">building</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

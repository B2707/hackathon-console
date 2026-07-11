'use client'

import * as React from 'react'
import { Trophy } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { BoardHeader, BoardRow } from '@/components/wall/board-row'

/**
 * Leader Board — ranks by shipping (handoff `team-board.html` lines 1942–1986).
 *
 * A row = rank medal (gold/silver/bronze/none) · avatar + name + subline · big
 * right-aligned "PRs merged" metric (mono, --primary) · chevron. Expanding a row
 * reveals 6 tiles: PRs merged, commits, issues closed, reviews given, time
 * active, avg review. NOTE: no cost/token data lives here (that is analytics).
 *
 * DATA: REAL — GitHub aggregates from /api/scoreboard (PRs, commits, issues,
 * reviews). Empty until the first poll and while the brand-new repo has no
 * merged PRs, when a quiet zero-state renders instead of rows.
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

/** One expanded-detail stat (handoff `.sa-tile`). */
function StatTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] border border-border bg-muted px-2.5 py-[9px]">
      <span className="font-mono text-base font-bold text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-[0.62rem] uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function LeaderBoard({ rows }: LeaderBoardProps) {
  const totalPrs = rows.reduce((sum, r) => sum + r.prsMerged, 0)
  const ordered = [...rows].sort((a, b) => a.rank - b.rank)

  return (
    <Card className="gap-0 p-4">
      <BoardHeader
        icon={<Trophy className="size-[19px]" />}
        tone="teal"
        title="Leader Board"
        sub="Who ships the most · click a row"
        count={totalPrs}
        unit="PRs merged"
      />
      {ordered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-border bg-muted text-muted-foreground">
            <Trophy className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              No shipping yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The leaderboard fills as the team merges PRs — dispatch begins at
              hour zero.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {ordered.map((row) => (
            <BoardRow
              key={row.seat}
              rank={row.rank}
              seat={row.seat}
              subline={row.subline}
              unit="PRs merged"
              metric={
                <span className="font-mono text-[1.25rem] font-extrabold leading-none text-primary tabular-nums">
                  {row.prsMerged}
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-2 pt-1.5 pr-1.5 pb-3 pl-[42px]">
                <StatTile value={row.prsMerged} label="PRs merged" />
                <StatTile value={row.commits} label="commits" />
                <StatTile value={row.issuesClosed} label="issues closed" />
                <StatTile value={row.reviewsGiven} label="reviews given" />
                <StatTile value={row.timeActive} label="time active" />
                <StatTile value={row.avgReview} label="avg review" />
              </div>
            </BoardRow>
          ))}
        </div>
      )}
    </Card>
  )
}

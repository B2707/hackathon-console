// Phase 2 scoreboard — turns per-seat GitHub activity into the Leader Board and
// Mangooli Board row shapes the wall already renders. Server-only (pulls the
// GitHub token via lib/github). The client never imports this; it reads the
// computed rows from /api/scoreboard.

import type { LeaderRow } from '@/components/wall/leader-board'
import type { MangoRow } from '@/components/wall/mangooli-board'
import { ROSTER } from './board'
import {
  fetchRecentRuns,
  searchCommitCount,
  searchIssuesCount,
} from './github'

// Seat key (lowercased GitHub username) → proper-cased GitHub login. All four
// seats are configured, so the wall's Leader/Mangooli boards flip from SAMPLE
// to real GitHub aggregates (components/wall/team-board requires every roster
// seat configured before switching off SAMPLE).
export const SEAT_HANDLES: Record<string, string> = {
  b2707: 'B2707',
  mohammadesteitieh: 'MohammadESteitieh',
  amrooosh: 'Amrooosh',
  saidel04: 'saidel04',
}

export type SeatStats = {
  seat: string
  prsMerged: number
  commits: number
  issuesClosed: number
  reviewsGiven: number
  buildsBroken: number
  ciFailures: number
}

export type Scoreboard = {
  leaderboard: LeaderRow[]
  mangooli: MangoRow[]
  /** Roster seats that have a real handle configured (drives real-vs-sample). */
  configured: string[]
}

// mango-point weights: a broken build hurts most, a red CI run least. Merge
// collisions + abandoned claims have no clean GitHub source (they live in
// team-OS claims state) → 0 for now, kept as an explicit seam. Tunable.
const MANGO = { build: 3, ci: 1, collision: 2, abandoned: 2 } as const

/** Resolve a count query to 0 rather than letting one rate-limit break the board. */
async function safeCount(p: Promise<number>): Promise<number> {
  try {
    return await p
  } catch {
    return 0
  }
}

async function statsForSeat(
  repo: string,
  seat: string,
  handle: string
): Promise<SeatStats> {
  const base = `repo:${repo}`
  // issuesClosed uses `assignee:` — the seat that OWNED the issue when it
  // closed, which reads truer than `author:` (who merely opened it).
  const [prsMerged, commits, issuesClosed, reviewsGiven] = await Promise.all([
    safeCount(searchIssuesCount(`${base} is:pr is:merged author:${handle}`)),
    safeCount(searchCommitCount(`${base} author:${handle}`)),
    safeCount(
      searchIssuesCount(`${base} is:issue is:closed assignee:${handle}`)
    ),
    safeCount(searchIssuesCount(`${base} is:pr reviewed-by:${handle}`)),
  ])
  return {
    seat,
    prsMerged,
    commits,
    issuesClosed,
    reviewsGiven,
    buildsBroken: 0, // filled by the CI attribution pass below
    ciFailures: 0,
  }
}

export async function buildScoreboard(repo: string): Promise<Scoreboard> {
  const configured = ROSTER.filter((s) => SEAT_HANDLES[s])
  const stats = await Promise.all(
    configured.map((s) => statsForSeat(repo, s, SEAT_HANDLES[s]))
  )
  const byName = new Map(stats.map((st) => [st.seat, st]))

  // CI attribution — one Actions page, bucket failures onto the actor's seat.
  const bySeat = new Map(
    configured.map((s) => [SEAT_HANDLES[s].toLowerCase(), s])
  )
  try {
    for (const run of await fetchRecentRuns(repo)) {
      if (run.conclusion !== 'failure' || !run.actor) continue
      const seat = bySeat.get(run.actor.toLowerCase())
      const st = seat ? byName.get(seat) : undefined
      if (!st) continue
      st.ciFailures += 1
      // A failure on a push (vs. a PR) reads as a broken build on the branch.
      if (run.event === 'push') st.buildsBroken += 1
    }
  } catch {
    // No Actions access → CI metrics stay at 0.
  }

  return {
    leaderboard: buildLeaderboard(stats),
    mangooli: buildMangooli(stats),
    configured: [...configured],
  }
}

/** Rank by shipping: PRs merged desc, commits as the tiebreak. */
function buildLeaderboard(stats: SeatStats[]): LeaderRow[] {
  const ordered = [...stats].sort(
    (a, b) => b.prsMerged - a.prsMerged || b.commits - a.commits
  )
  return ordered.map((s, i) => ({
    rank: i + 1,
    seat: s.seat,
    prsMerged: s.prsMerged,
    commits: s.commits,
    issuesClosed: s.issuesClosed,
    reviewsGiven: s.reviewsGiven,
    timeActive: '—', // TODO: seat-heartbeat active span (lives in /api/state seats)
    avgReview: '—', // TODO: GitHub review latency (PR opened → first review)
    subline: `${s.commits} commits · ${s.issuesClosed} issues`,
  }))
}

function mangoPts(s: SeatStats): number {
  return s.buildsBroken * MANGO.build + s.ciFailures * MANGO.ci
  // + mergeCollisions * MANGO.collision + abandonedClaims * MANGO.abandoned (seam)
}

/** Rank by breakage: mango pts desc. The #1 row is "worst" only if it has pts. */
function buildMangooli(stats: SeatStats[]): MangoRow[] {
  const ordered = [...stats]
    .map((s) => ({ s, pts: mangoPts(s) }))
    .sort((a, b) => b.pts - a.pts)
  return ordered.map(({ s, pts }, i) => ({
    rank: i + 1,
    seat: s.seat,
    mangoPts: pts,
    worst: i === 0 && pts > 0,
    subline: `${s.buildsBroken} build${s.buildsBroken === 1 ? '' : 's'} · ${s.ciFailures} CI fail${s.ciFailures === 1 ? '' : 's'}`,
    buildsBroken: s.buildsBroken,
    mergeCollisions: 0, // TODO: team-OS claims state (no clean GitHub source)
    abandonedClaims: 0, // TODO: team-OS claims state (no clean GitHub source)
    ciFailures: s.ciFailures,
  }))
}

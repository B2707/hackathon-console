// Sample data for panels whose real feeds are not yet wired. Each dataset
// mirrors the design-handoff prototype's hardcoded values. Every field is a
// seam: // TODO: GitHub aggregate API (PRs, commits, issues, reviews, Actions
// runs) — the Leader/Mangooli boards must NOT carry cost/token data (that lives
// in analytics per the handoff).

import type { LeaderRow } from '@/components/wall/leader-board'
import type { MangoRow } from '@/components/wall/mangooli-board'

/** Leader Board — ranked by shipping (PRs merged). Order: b2707 > mohammadesteitieh > amrooosh > saidel04. */
export const SAMPLE_LEADERBOARD: LeaderRow[] = [
  {
    rank: 1,
    seat: 'b2707',
    prsMerged: 12, // TODO: GitHub aggregate API
    commits: 88, // TODO: GitHub aggregate API
    issuesClosed: 9, // TODO: GitHub aggregate API
    reviewsGiven: 14, // TODO: GitHub aggregate API
    timeActive: '6h 20m', // TODO: seat-heartbeat active time
    avgReview: '11m', // TODO: GitHub review latency
    subline: '88 commits · 9 issues',
  },
  {
    rank: 2,
    seat: 'mohammadesteitieh',
    prsMerged: 9,
    commits: 71,
    issuesClosed: 7,
    reviewsGiven: 10,
    timeActive: '5h 40m',
    avgReview: '18m',
    subline: '71 commits · 7 issues',
  },
  {
    rank: 3,
    seat: 'amrooosh',
    prsMerged: 7,
    commits: 63,
    issuesClosed: 5,
    reviewsGiven: 6,
    timeActive: '5h 10m',
    avgReview: '26m',
    subline: '63 commits · 5 issues',
  },
  {
    rank: 4,
    seat: 'saidel04',
    prsMerged: 5,
    commits: 44,
    issuesClosed: 4,
    reviewsGiven: 3,
    timeActive: '4h 05m',
    avgReview: '40m',
    subline: '44 commits · 4 issues',
  },
]

/** Mangooli Board — ranked by breakage (mango pts). Order: saidel04 (worst) > amrooosh > mohammadesteitieh > b2707. */
export const SAMPLE_MANGOOLI: MangoRow[] = [
  {
    rank: 1,
    seat: 'saidel04',
    mangoPts: 13, // TODO: GitHub aggregate API (build/CI failure scoring)
    worst: true,
    subline: '4 builds · 6 CI fails',
    buildsBroken: 4,
    mergeCollisions: 2,
    abandonedClaims: 1,
    ciFailures: 6,
  },
  {
    rank: 2,
    seat: 'amrooosh',
    mangoPts: 8,
    worst: false,
    subline: '2 builds · 3 CI fails',
    buildsBroken: 2,
    mergeCollisions: 1,
    abandonedClaims: 2,
    ciFailures: 3,
  },
  {
    rank: 3,
    seat: 'mohammadesteitieh',
    mangoPts: 4,
    worst: false,
    subline: '1 build · 2 CI fails',
    buildsBroken: 1,
    mergeCollisions: 1,
    abandonedClaims: 0,
    ciFailures: 2,
  },
  {
    rank: 4,
    seat: 'b2707',
    mangoPts: 2,
    worst: false,
    subline: '0 builds · 1 CI fail',
    buildsBroken: 0,
    mergeCollisions: 1,
    abandonedClaims: 0,
    ciFailures: 1,
  },
]

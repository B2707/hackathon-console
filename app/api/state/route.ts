import { fetchBoard, hasGithubToken } from '@/lib/github'
import { redis } from '@/lib/redis'
import { getBoard, getRepo, getSeats, getTicker, setBoard } from '@/lib/state'

export const dynamic = 'force-dynamic'

// Lazy reconcile (Hobby tier has no crons): re-fetch from GitHub when the
// cached board is stale. Unauthenticated GitHub API allows only 60 req/h,
// so without a token back off to 5 minutes — webhooks keep it fresh anyway.
const STALE_MS_WITH_TOKEN = 60_000
const STALE_MS_NO_TOKEN = 300_000
const LOCK_TTL_S = 30

// GET /api/state is public — the wall is a read-only view of team state.
// Write endpoints (heartbeat, webhook) stay authenticated server-side.
export async function GET() {
  const [board, repo] = await Promise.all([getBoard(), getRepo()])
  const staleMs = hasGithubToken() ? STALE_MS_WITH_TOKEN : STALE_MS_NO_TOKEN
  const isStale = !board || Date.now() - board.fetchedAt > staleMs

  let freshBoard = board
  let reconcileError: string | undefined
  if (isStale && repo) {
    // NX lock so concurrent wall viewers don't stampede the GitHub API;
    // losers of the race serve the stale board — it heals on a later poll.
    const locked = await redis().set('board:lock', '1', {
      nx: true,
      ex: LOCK_TTL_S,
    })
    if (locked) {
      try {
        freshBoard = await fetchBoard(repo)
        await setBoard(freshBoard)
      } catch (err) {
        // Serve the stale board rather than a broken wall.
        reconcileError = err instanceof Error ? err.message : String(err)
      }
    }
  }

  const [seats, ticker] = await Promise.all([getSeats(), getTicker()])
  return Response.json({
    now: Date.now(),
    repo,
    seats,
    board: freshBoard,
    ticker,
    ...(reconcileError ? { reconcileError } : {}),
  })
}

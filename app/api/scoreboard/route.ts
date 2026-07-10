import { hasGithubToken } from '@/lib/github'
import { redis } from '@/lib/redis'
import { buildScoreboard, type Scoreboard } from '@/lib/scoreboard'
import { getRepo } from '@/lib/state'

export const dynamic = 'force-dynamic'

// Public GET, same read-only contract as /api/state. Leader/Mangooli aggregates
// are computed from the GitHub Search API, which shares a 30 req/min (authed)
// budget — so cache hard and reconcile lazily under an NX lock, exactly like the
// board reconcile in /api/state. Without a token search is 10 req/min → cache
// longer. This route never mutates team state and needs no secret.
const CACHE_KEY = 'scoreboard:cache'
const LOCK_KEY = 'scoreboard:lock'
const LOCK_TTL_S = 60

type Cached = Scoreboard & { fetchedAt: number; repo: string }

function empty(repo: string | null, error?: string) {
  return {
    fetchedAt: Date.now(),
    repo,
    leaderboard: [],
    mangooli: [],
    configured: [],
    ...(error ? { error } : {}),
  }
}

export async function GET() {
  const repo = (await getRepo()) ?? process.env.GITHUB_REPO ?? null
  if (!repo) return Response.json(empty(null))

  const freshMs = hasGithubToken() ? 120_000 : 300_000
  const cached = (await redis().get(CACHE_KEY)) as Cached | null
  if (cached && cached.repo === repo && Date.now() - cached.fetchedAt < freshMs) {
    return Response.json(cached)
  }

  // Losers of the NX race serve the stale cache (or empty on first run); it
  // heals on a later poll — the wall falls back to SAMPLE until then.
  const locked = await redis().set(LOCK_KEY, '1', { nx: true, ex: LOCK_TTL_S })
  if (!locked) return Response.json(cached ?? empty(repo))

  try {
    const board = await buildScoreboard(repo)
    const payload: Cached = { ...board, repo, fetchedAt: Date.now() }
    await redis().set(CACHE_KEY, payload)
    return Response.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json(cached ?? empty(repo, message))
  }
}

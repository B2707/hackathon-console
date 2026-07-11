import { checkTeamSecret } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

// Event-ops reset: wipe accumulated live state (alerts, ticker, seats,
// cached board) so the wall starts clean at an event boundary. The `repo`
// pointer is deliberately preserved — retargeting is done via env + webhook,
// not here. Auth matches every other write route (x-team-secret).
const RESET_KEYS = ['alerts', 'ticker', 'seats', 'board'] as const

export async function POST(req: Request) {
  if (!checkTeamSecret(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  await Promise.all(RESET_KEYS.map((k) => redis().del(k)))
  return Response.json({ reset: [...RESET_KEYS] })
}

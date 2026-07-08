import { checkTeamSecret } from '@/lib/auth'
import { recordBeat } from '@/lib/state'

export const dynamic = 'force-dynamic'

const SEAT_RE = /^[a-z][a-z0-9-]{0,19}$/
const NOTE_MAX = 120

export async function POST(req: Request) {
  if (!checkTeamSecret(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { seat?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 })
  }

  const seat =
    typeof body.seat === 'string' ? body.seat.trim().toLowerCase() : ''
  if (!SEAT_RE.test(seat)) {
    return Response.json(
      { error: 'seat must match [a-z][a-z0-9-]{0,19}' },
      { status: 400 }
    )
  }
  const note =
    typeof body.note === 'string' ? body.note.slice(0, NOTE_MAX) : undefined

  await recordBeat({ seat, at: Date.now(), ...(note ? { note } : {}) })
  return Response.json({ ok: true })
}

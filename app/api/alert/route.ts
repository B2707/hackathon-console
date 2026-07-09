import { randomUUID } from 'crypto'

import { checkTeamSecret } from '@/lib/auth'
import { pushAlert, type Alert } from '@/lib/state'

export const dynamic = 'force-dynamic'

const SEVERITIES = new Set<Alert['severity']>(['P0', 'P1'])
const WIRE_MAX = 60
const DETAIL_MAX = 300

// Ingest a P0/P1 tripwire fire from the team template and surface it on the
// wall. Authed with the same X-Team-Secret as /api/heartbeat. Fail-safe: bad
// input is rejected, and a storage error is logged and returned as 500 rather
// than thrown — the caller (scripts/tripwires.js) POSTs best-effort anyway.
export async function POST(req: Request) {
  if (!checkTeamSecret(req)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { severity?: unknown; wire?: unknown; detail?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 })
  }

  const severity = typeof body.severity === 'string' ? body.severity : ''
  if (!SEVERITIES.has(severity as Alert['severity'])) {
    return Response.json(
      { error: 'severity must be P0 or P1' },
      { status: 400 }
    )
  }
  const wire =
    typeof body.wire === 'string' ? body.wire.trim().slice(0, WIRE_MAX) : ''
  if (!wire) {
    return Response.json({ error: 'wire required' }, { status: 400 })
  }
  const detail =
    typeof body.detail === 'string' ? body.detail.trim().slice(0, DETAIL_MAX) : ''
  if (!detail) {
    return Response.json({ error: 'detail required' }, { status: 400 })
  }

  const alert: Alert = {
    id: randomUUID(),
    severity: severity as Alert['severity'],
    wire,
    detail,
    at: Date.now(),
  }

  try {
    await pushAlert(alert)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error({ route: 'alert', err: message })
    return Response.json({ error: 'storage' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}

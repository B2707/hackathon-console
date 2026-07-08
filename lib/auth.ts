import { createHmac, timingSafeEqual } from 'crypto'

function teamSecret(): string {
  return process.env.TEAM_HEARTBEAT_SECRET ?? ''
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

// X-Team-Secret header auth for /api/heartbeat and /api/state.
export function checkTeamSecret(req: Request): boolean {
  const given = req.headers.get('x-team-secret') ?? ''
  const want = teamSecret()
  if (!want || !given) return false
  return safeEqual(given, want)
}

// GitHub webhook HMAC (X-Hub-Signature-256) — same shared secret, stamped
// onto the hook by scripts/repo-init.sh in the team template repo.
export function checkWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const want = teamSecret()
  if (!want || !signature) return false
  const digest =
    'sha256=' + createHmac('sha256', want).update(rawBody).digest('hex')
  return safeEqual(signature, digest)
}

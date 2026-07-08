import { Redis } from '@upstash/redis'

let client: Redis | null = null

// Lazy init so `next build` doesn't require the env vars. The Marketplace
// Upstash integration injects UPSTASH_*; older KV-style installs inject
// KV_REST_API_* — accept either.
export function redis(): Redis {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error(
      'Upstash Redis env missing: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_*)'
    )
  }
  client = new Redis({ url, token })
  return client
}

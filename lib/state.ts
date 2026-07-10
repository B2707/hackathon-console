import { redis } from './redis'

export type SeatBeat = { seat: string; at: number; note?: string }
export type TickerEvent = { at: number; kind: string; text: string; url?: string }
export type BoardIssue = {
  number: number
  title: string
  labels: string[]
  assignees: string[]
  url: string
  updatedAt: string
}
export type BoardPr = {
  number: number
  title: string
  author: string
  draft: boolean
  labels: string[]
  url: string
  updatedAt: string
}
export type Board = { fetchedAt: number; issues: BoardIssue[]; prs: BoardPr[] }
export type Alert = {
  id: string
  severity: 'P0' | 'P1'
  wire: string
  detail: string
  at: number
}

const TICKER_MAX = 100
// Newest-first alerts list, capped at 50 stored; the wall reads the newest 20.
const ALERTS_MAX = 50
const ALERTS_READ = 20

export async function recordBeat(beat: SeatBeat): Promise<void> {
  await redis().hset('seats', { [beat.seat]: beat })
}

export async function getSeats(): Promise<SeatBeat[]> {
  const all = await redis().hgetall<Record<string, SeatBeat>>('seats')
  return all ? Object.values(all) : []
}

export async function pushEvent(event: TickerEvent): Promise<void> {
  const r = redis()
  await r.lpush('ticker', event)
  await r.ltrim('ticker', 0, TICKER_MAX - 1)
}

export async function getTicker(): Promise<TickerEvent[]> {
  return await redis().lrange<TickerEvent>('ticker', 0, TICKER_MAX - 1)
}

// Live Alerts: P0/P1 tripwire fires surfaced on the wall. LPUSH newest-first,
// LTRIM to the cap. Mirrors the ticker list; the Upstash client JSON-encodes
// the object on push and decodes it on lrange.
export async function pushAlert(alert: Alert): Promise<void> {
  const r = redis()
  await r.lpush('alerts', alert)
  await r.ltrim('alerts', 0, ALERTS_MAX - 1)
}

export async function getAlerts(): Promise<Alert[]> {
  return await redis().lrange<Alert>('alerts', 0, ALERTS_READ - 1)
}

export async function getBoard(): Promise<Board | null> {
  return await redis().get<Board>('board')
}

export async function setBoard(board: Board): Promise<void> {
  await redis().set('board', board)
}

export async function setRepo(fullName: string): Promise<void> {
  await redis().set('repo', fullName)
}

// Env override wins; otherwise use the repo learned from webhooks (the ping
// GitHub sends on hook registration is enough to teach it).
export async function getRepo(): Promise<string | null> {
  return process.env.GITHUB_REPO ?? (await redis().get<string>('repo'))
}

// Webhook payloads carry full objects — patch the cached board in place so
// the wall stays fresh between lazy reconciles without GitHub API calls.
//
// Concurrency: patchBoardIssue/patchBoardPr do a read-modify-write on the same
// 'board' key with no lock, so two webhooks landing together can clobber each
// other (accepted last-writer-wins). We deliberately do NOT add locking — the
// lazy reconcile in app/api/state re-fetches the board from GitHub on staleness
// (60s with a token, 5min without) and self-heals any dropped patch within
// minutes, comfortably inside the event window.
export async function patchBoardIssue(
  issue: BoardIssue,
  isOpen: boolean
): Promise<void> {
  const board = await getBoard()
  if (!board) return
  const issues = board.issues.filter((i) => i.number !== issue.number)
  if (isOpen) issues.push(issue)
  await setBoard({ ...board, issues })
}

export async function patchBoardPr(pr: BoardPr, isOpen: boolean): Promise<void> {
  const board = await getBoard()
  if (!board) return
  const prs = board.prs.filter((p) => p.number !== pr.number)
  if (isOpen) prs.push(pr)
  await setBoard({ ...board, prs })
}

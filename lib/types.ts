// Client-safe mirror of the /api/state JSON contract. These match lib/state.ts
// exactly but live here so the client bundle never imports the server module
// (which pulls in @upstash/redis). Behaviour of the wall is unchanged.

export type SeatBeat = { seat: string; at: number; note?: string }

export type TickerEvent = {
  at: number
  kind: string
  text: string
  url?: string
}

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

export type StateResponse = {
  now: number
  repo: string | null
  seats: SeatBeat[]
  board: Board | null
  ticker: TickerEvent[]
  reconcileError?: string
}

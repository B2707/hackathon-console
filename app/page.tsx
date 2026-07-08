'use client'

import { useCallback, useEffect, useState } from 'react'

type SeatBeat = { seat: string; at: number; note?: string }
type TickerEvent = { at: number; kind: string; text: string; url?: string }
type BoardIssue = {
  number: number
  title: string
  labels: string[]
  assignees: string[]
  url: string
  updatedAt: string
}
type BoardPr = {
  number: number
  title: string
  author: string
  draft: boolean
  labels: string[]
  url: string
  updatedAt: string
}
type StateResponse = {
  now: number
  repo: string | null
  seats: SeatBeat[]
  board: { fetchedAt: number; issues: BoardIssue[]; prs: BoardPr[] } | null
  ticker: TickerEvent[]
  reconcileError?: string
}

const ROSTER = ['bader', 'sjp', 'amr', 'adham']
const POLL_MS = 15_000
const FRESH_MS = 10 * 60_000
const WARM_MS = 30 * 60_000
const KEY_STORAGE = 'team-key'

// Lane precedence mirrors the template's label semantics: an escalation or a
// block outranks dispatchability. Labels come from repo-init.sh's canon.
const LANES = ['triage', 'proposed', 'ready', 'blocked', 'needs-human'] as const
const LANE_TITLES: Record<string, string> = {
  triage: 'Triage',
  proposed: 'Proposed',
  ready: 'Ready',
  blocked: 'Blocked',
  'needs-human': 'Needs human',
}

function laneFor(labels: string[]): (typeof LANES)[number] {
  if (labels.includes('needs-human')) return 'needs-human'
  if (labels.includes('blocked')) return 'blocked'
  if (labels.includes('ready')) return 'ready'
  if (labels.includes('proposed')) return 'proposed'
  return 'triage'
}

function timeAgo(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function seatFreshness(at: number | undefined, now: number): string {
  if (!at) return ''
  const age = now - at
  if (age < FRESH_MS) return 'seat--fresh'
  if (age < WARM_MS) return 'seat--warm'
  return 'seat--stale'
}

function cardClass(labels: string[]): string {
  if (labels.includes('break-glass')) return 'card card--break-glass'
  if (labels.includes('demo-path')) return 'card card--demo-path'
  return 'card'
}

function tagClass(label: string): string {
  if (label === 'demo-path') return 'tag tag--demo-path'
  if (label === 'break-glass') return 'tag tag--break-glass'
  return 'tag'
}

function KeyGate({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="gate">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
      >
        <strong>Team OS Console</strong>
        <input
          type="password"
          placeholder="team key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button type="submit">unlock</button>
        <span className="hint">
          Paste TEAM_HEARTBEAT_SECRET (or open /?key=… once). Stored only in
          this browser&apos;s localStorage.
        </span>
      </form>
    </div>
  )
}

export default function Wall() {
  const [teamKey, setTeamKey] = useState<string | null>(null)
  const [keyLoaded, setKeyLoaded] = useState(false)
  const [data, setData] = useState<StateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Accept /?key=… once, persist to localStorage, then scrub it from the URL
  // so the secret never lives in a shareable/bookmarkable address.
  useEffect(() => {
    const url = new URL(window.location.href)
    const fromUrl = url.searchParams.get('key')
    if (fromUrl) {
      localStorage.setItem(KEY_STORAGE, fromUrl)
      url.searchParams.delete('key')
      window.history.replaceState(null, '', url.toString())
    }
    setTeamKey(localStorage.getItem(KEY_STORAGE))
    setKeyLoaded(true)
  }, [])

  const load = useCallback(async (key: string) => {
    try {
      const res = await fetch('/api/state', {
        headers: { 'x-team-secret': key },
        cache: 'no-store',
      })
      if (res.status === 401) {
        setError('key rejected — click header to reset')
        return
      }
      if (!res.ok) {
        setError(`state fetch failed: ${res.status}`)
        return
      }
      setData((await res.json()) as StateResponse)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'network error')
    }
  }, [])

  useEffect(() => {
    if (!teamKey) return
    load(teamKey)
    const timer = setInterval(() => load(teamKey), POLL_MS)
    return () => clearInterval(timer)
  }, [teamKey, load])

  if (!keyLoaded) return null
  if (!teamKey) {
    return (
      <KeyGate
        onSubmit={(key) => {
          localStorage.setItem(KEY_STORAGE, key)
          setTeamKey(key)
        }}
      />
    )
  }

  const now = data?.now ?? Date.now()
  const seatsByName = new Map((data?.seats ?? []).map((s) => [s.seat, s]))
  const extraSeats = (data?.seats ?? [])
    .filter((s) => !ROSTER.includes(s.seat))
    .map((s) => s.seat)
  const seatNames = [...ROSTER, ...extraSeats]

  const issues = data?.board?.issues ?? []
  const prs = data?.board?.prs ?? []
  const byLane = new Map<string, BoardIssue[]>(LANES.map((l) => [l, []]))
  for (const issue of issues) {
    byLane.get(laneFor(issue.labels))?.push(issue)
  }

  return (
    <div className="wall">
      <header className="topbar">
        <h1
          title="click to reset team key"
          onClick={() => {
            localStorage.removeItem(KEY_STORAGE)
            setTeamKey(null)
            setData(null)
          }}
        >
          Team OS Console
        </h1>
        <span className="meta">
          {data?.repo ?? 'no repo yet — webhook teaches it'}
          {data?.board ? ` · board ${timeAgo(data.board.fetchedAt, now)} ago` : ''}
        </span>
        {(error || data?.reconcileError) && (
          <span className="error">{error ?? `reconcile: ${data?.reconcileError}`}</span>
        )}
      </header>

      <section className="strip" aria-label="seat health">
        {seatNames.map((name) => {
          const beat = seatsByName.get(name)
          return (
            <div
              key={name}
              className={`seat ${seatFreshness(beat?.at, now)}`.trim()}
              data-seat={name}
            >
              <span className="who">
                <span className="dot" />
                {name}
              </span>
              <span className="age">
                {beat ? `${timeAgo(beat.at, now)} ago` : 'no heartbeat yet'}
              </span>
              {beat?.note && <span className="note">{beat.note}</span>}
            </div>
          )
        })}
      </section>

      <main className="main">
        <section className="kanban" aria-label="board">
          {LANES.map((lane) => {
            const cards = byLane.get(lane) ?? []
            return (
              <div key={lane} className="lane">
                <h2>
                  {LANE_TITLES[lane]}
                  <span>{cards.length}</span>
                </h2>
                <div className="cards">
                  {cards.map((issue) => (
                    <a
                      key={issue.number}
                      className={cardClass(issue.labels)}
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="num">#{issue.number}</span>
                      {issue.title}
                      {issue.assignees.length > 0 && (
                        <span className="by">@ {issue.assignees.join(', ')}</span>
                      )}
                      {issue.labels.length > 0 && (
                        <span className="tags">
                          {issue.labels.map((label) => (
                            <span key={label} className={tagClass(label)}>
                              {label}
                            </span>
                          ))}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="lane">
            <h2>
              PRs in flight<span>{prs.length}</span>
            </h2>
            <div className="cards">
              {prs.map((pr) => (
                <a
                  key={pr.number}
                  className={cardClass(pr.labels)}
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="num">#{pr.number}</span>
                  {pr.draft ? '[draft] ' : ''}
                  {pr.title}
                  <span className="by">by {pr.author}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <aside className="ticker" aria-label="event ticker">
          <h2>Ticker</h2>
          <ul>
            {(data?.ticker ?? []).map((event, i) => (
              <li key={`${event.at}-${i}`}>
                <span className="when">{timeAgo(event.at, now)}</span>
                {event.url ? (
                  <a href={event.url} target="_blank" rel="noreferrer">
                    {event.text}
                  </a>
                ) : (
                  <span>{event.text}</span>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  )
}

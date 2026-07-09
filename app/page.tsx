'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
const FRESH_MS = 5 * 60_000 // < 5m  → online
const STALE_MS = 20 * 60_000 // 5–20m → stale; > 20m → offline
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
const LANE_CLASS: Record<string, string> = {
  triage: 'lane--triage',
  proposed: 'lane--proposed',
  ready: 'lane--ready',
  blocked: 'lane--blocked',
  'needs-human': 'lane--needs-human',
}

// Exact repo label colors → CSS vars declared in globals.css.
const LABEL_COLOR: Record<string, string> = {
  'team:triage': 'var(--lbl-triage)',
  triage: 'var(--lbl-triage)',
  proposed: 'var(--lbl-proposed)',
  ready: 'var(--lbl-ready)',
  blocked: 'var(--lbl-blocked)',
  'demo-path': 'var(--lbl-demo)',
  'break-glass': 'var(--lbl-breakglass)',
  'test-exempt': 'var(--lbl-testexempt)',
  filler: 'var(--lbl-filler)',
  'needs-human': 'var(--lbl-human)',
}

function laneFor(labels: string[]): (typeof LANES)[number] {
  if (labels.includes('needs-human')) return 'needs-human'
  if (labels.includes('blocked')) return 'blocked'
  if (labels.includes('ready')) return 'ready'
  if (labels.includes('proposed')) return 'proposed'
  return 'triage'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Compact relative age for the ticker + board-sync readout.
function timeAgo(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// Mission-elapsed-time clock for the hero seat tiles: M:SS, or H:MM:SS past
// the hour. Ticks live every second between polls.
function metClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

type SeatLevel = 'online' | 'stale' | 'dead' | 'absent'
function seatLevel(at: number | undefined, now: number): SeatLevel {
  if (!at) return 'absent'
  const age = now - at
  if (age < FRESH_MS) return 'online'
  if (age < STALE_MS) return 'stale'
  return 'dead'
}
const SEAT_WORD: Record<SeatLevel, string> = {
  online: 'Online',
  stale: 'Stale',
  dead: 'Offline',
  absent: 'No signal',
}

// Ticker event → syslog-style type code + color class (see globals.css).
function tickMeta(ev: TickerEvent): { cls: string; code: string } {
  switch (ev.kind) {
    case 'ping':
      return { cls: 'tick--net', code: 'NET' }
    case 'push':
      return { cls: 'tick--push', code: 'PUSH' }
    case 'issue':
      return { cls: 'tick--iss', code: 'ISS' }
    case 'pr':
      return { cls: 'tick--pr', code: 'PR' }
    case 'comment':
      return { cls: 'tick--msg', code: 'MSG' }
    case 'ci':
      if (/success|passed|\bok\b/i.test(ev.text)) return { cls: 'tick--ci-ok', code: 'CI' }
      if (/fail|error|cancel/i.test(ev.text)) return { cls: 'tick--ci-bad', code: 'CI' }
      return { cls: 'tick--ci', code: 'CI' }
    default:
      return { cls: 'tick--msg', code: ev.kind.slice(0, 4).toUpperCase() }
  }
}

function issueCardClass(labels: string[]): string {
  if (labels.includes('break-glass')) return 'card card--breakglass'
  if (labels.includes('demo-path')) return 'card card--demo'
  return 'card'
}

function LabelChips({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <span className="card__tags">
      {labels.map((label) => (
        <span key={label} className="chip">
          <i style={{ ['--chip' as string]: LABEL_COLOR[label] ?? 'var(--ink-faint)' }} />
          {label}
        </span>
      ))}
    </span>
  )
}

function KeyGate({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="gate">
      <div className="gate__box">
        <div className="gate__bar">
          <i />
          Team OS // Console
        </div>
        <form
          className="gate__body"
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) onSubmit(value.trim())
          }}
        >
          <div className="gate__title">AUTHORIZE</div>
          <div className="gate__prompt">
            <input
              className="gate__input"
              type="password"
              placeholder="team secret"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              aria-label="team secret"
            />
          </div>
          <button className="gate__btn" type="submit">
            Establish link
          </button>
          <span className="gate__hint">
            Paste TEAM_HEARTBEAT_SECRET, or open /?key=… once. Stored only in this
            browser&apos;s localStorage — never sent anywhere but this console.
          </span>
        </form>
      </div>
    </div>
  )
}

export default function Wall() {
  const [teamKey, setTeamKey] = useState<string | null>(null)
  const [keyLoaded, setKeyLoaded] = useState(false)
  const [data, setData] = useState<StateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState<number>(() => Date.now())
  // Anchor server time to a client instant so ages tick smoothly every second
  // between 15s polls and stay immune to client clock skew.
  const baseRef = useRef<{ server: number; client: number } | null>(null)

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

  // 1s heartbeat for the wall: drives the live MET timers and the clock.
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async (key: string) => {
    try {
      const res = await fetch('/api/state', {
        headers: { 'x-team-secret': key },
        cache: 'no-store',
      })
      if (res.status === 401) {
        setError('KEY REJECTED — click wordmark to re-authorize')
        return
      }
      if (!res.ok) {
        setError(`STATE FETCH FAILED · ${res.status}`)
        return
      }
      const json = (await res.json()) as StateResponse
      baseRef.current = { server: json.now, client: Date.now() }
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NETWORK ERROR')
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

  // Skew-safe "now": server clock advanced by locally elapsed time.
  const now = baseRef.current
    ? baseRef.current.server + (tick - baseRef.current.client)
    : tick

  const seatsByName = new Map((data?.seats ?? []).map((s) => [s.seat, s]))
  const extraSeats = (data?.seats ?? [])
    .filter((s) => !ROSTER.includes(s.seat))
    .map((s) => s.seat)
  const seatNames = [...ROSTER, ...extraSeats]

  const issues = data?.board?.issues ?? []
  const prs = data?.board?.prs ?? []
  const byLane = new Map<string, BoardIssue[]>(LANES.map((l) => [l, []]))
  for (const issue of issues) byLane.get(laneFor(issue.labels))?.push(issue)

  const boardAge = data?.board ? now - data.board.fetchedAt : null
  const sync =
    boardAge == null ? '' : boardAge < 120_000 ? 'hot' : boardAge < 600_000 ? '' : 'cold'
  const wallClock = new Date(tick).toLocaleTimeString('en-GB', { hour12: false })

  const resetKey = () => {
    localStorage.removeItem(KEY_STORAGE)
    setTeamKey(null)
    setData(null)
    baseRef.current = null
  }

  return (
    <div className="wall">
      {/* ── STATUS BAR ─────────────────────────────────────────── */}
      <header className="bar">
        <div className="bar__mark" onClick={resetKey} title="reset team key">
          <span className="bar__live" />
          Team OS
        </div>
        <div className="bar__repo">
          <b>{data?.repo ?? 'no repo yet'}</b>
          {!data?.repo && ' — webhook teaches it'}
        </div>
        <div className="bar__sync" data-fresh={sync}>
          <span className="k">Board </span>
          <span className="v">
            {data?.board ? `T+${timeAgo(data.board.fetchedAt, now)}` : 'no sync'}
          </span>
        </div>

        <div className="bar__legend" aria-label="heartbeat legend">
          <span className="leg leg--online">
            <i />
            Online
          </span>
          <span className="leg leg--stale">
            <i />
            Stale
          </span>
          <span className="leg leg--offline">
            <i />
            Offline
          </span>
          <span className="leg leg--nosignal">
            <i />
            No signal
          </span>
        </div>

        {(error || data?.reconcileError) && (
          <span className="bar__err" role="alert">
            {error ?? `RECONCILE: ${data?.reconcileError}`}
          </span>
        )}
        <time className="bar__clock" aria-label="wall clock">
          {wallClock}
        </time>
      </header>

      {/* ── SEAT HEALTH — hero board of lights ─────────────────── */}
      <section className="crew" aria-label="seat health">
        {seatNames.map((name, i) => {
          const beat = seatsByName.get(name)
          const level = seatLevel(beat?.at, now)
          return (
            <div key={name} className={`seat seat--${level}`} data-seat={name}>
              <div className="seat__top">
                <span className="seat__idx">Seat {pad(i + 1)}</span>
                <span className="seat__status">
                  <span className="seat__dot" />
                  {SEAT_WORD[level]}
                </span>
              </div>
              <div className="seat__name">{name}</div>
              <div className="seat__met">
                {level === 'absent' ? '--:--' : metClock(now - (beat as SeatBeat).at)}
              </div>
              <div className="seat__metlabel">
                {level === 'absent' ? 'Awaiting first beat' : 'Since last heartbeat'}
              </div>
              {beat?.note && <div className="seat__note">{beat.note}</div>}
            </div>
          )
        })}
      </section>

      {/* ── MAIN: kanban + ticker ──────────────────────────────── */}
      <main className="main">
        <section className="board" aria-label="board">
          {LANES.map((lane) => {
            const cards = byLane.get(lane) ?? []
            return (
              <div key={lane} className={`lane ${LANE_CLASS[lane]}`}>
                <div className="lane__head">
                  <span className="lane__title">{LANE_TITLES[lane]}</span>
                  <span className="lane__count">{cards.length}</span>
                </div>
                <div className="lane__cards">
                  {cards.length === 0 && <div className="lane__empty">clear</div>}
                  {cards.map((issue) => (
                    <a
                      key={issue.number}
                      className={issueCardClass(issue.labels)}
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="card__top">
                        <span className="card__num">#{issue.number}</span>
                        <span className="card__title">{issue.title}</span>
                      </div>
                      {issue.assignees.length > 0 && (
                        <span className="card__by">@ {issue.assignees.join(', ')}</span>
                      )}
                      <LabelChips labels={issue.labels} />
                    </a>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="lane lane--prs">
            <div className="lane__head">
              <span className="lane__title">PRs in flight</span>
              <span className="lane__count">{prs.length}</span>
            </div>
            <div className="lane__cards">
              {prs.length === 0 && <div className="lane__empty">none open</div>}
              {prs.map((pr) => (
                <a
                  key={pr.number}
                  className={`card ${pr.draft ? 'card--pr-draft' : 'card--pr-ready'}`}
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="card__top">
                    <span className="card__num">#{pr.number}</span>
                    <span
                      className={`pr-state ${pr.draft ? 'pr-state--draft' : 'pr-state--ready'}`}
                    >
                      <i />
                      {pr.draft ? 'Draft' : 'Ready'}
                    </span>
                  </div>
                  <span className="card__title">{pr.title}</span>
                  <span className="card__by">by {pr.author}</span>
                  <LabelChips labels={pr.labels} />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── TICKER — event feed ──────────────────────────────── */}
        <aside className="feed" aria-label="event ticker">
          <div className="feed__head">
            <span className="feed__title">Event feed</span>
            <span className="lane__count">{data?.ticker?.length ?? 0}</span>
          </div>
          <ul className="feed__list">
            {(data?.ticker ?? []).length === 0 && (
              <li className="feed__empty">no events yet — standing by</li>
            )}
            {(data?.ticker ?? []).map((event) => {
              const meta = tickMeta(event)
              return (
                <li
                  key={`${event.at}-${event.kind}-${event.text.slice(0, 18)}`}
                  className={`tick ${meta.cls}`}
                >
                  <span className="tick__when">{timeAgo(event.at, now)}</span>
                  <span className="tick__kind">{meta.code}</span>
                  {event.url ? (
                    <a
                      className="tick__text"
                      href={event.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {event.text}
                    </a>
                  ) : (
                    <span className="tick__text">{event.text}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </aside>
      </main>
    </div>
  )
}

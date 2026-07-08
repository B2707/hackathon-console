import type { Board, BoardIssue, BoardPr } from './state'

const GITHUB_API = 'https://api.github.com'

export function hasGithubToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'hackathon-console',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

async function ghJson(path: string): Promise<unknown> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GitHub ${path} -> ${res.status}`)
  return res.json()
}

type GhLabel = { name: string }
type GhIssue = {
  number: number
  title: string
  html_url: string
  updated_at: string
  labels: GhLabel[]
  assignees: { login: string }[]
  pull_request?: unknown
}
type GhPr = {
  number: number
  title: string
  html_url: string
  updated_at: string
  draft: boolean
  labels: GhLabel[]
  user: { login: string }
}

// Full re-fetch of open issues + PRs — the lazy reconcile that heals any
// drift from missed webhooks. Two API calls per invocation.
export async function fetchBoard(repo: string): Promise<Board> {
  const [issuesRaw, prsRaw] = await Promise.all([
    ghJson(`/repos/${repo}/issues?state=open&per_page=100`) as Promise<GhIssue[]>,
    ghJson(`/repos/${repo}/pulls?state=open&per_page=100`) as Promise<GhPr[]>,
  ])
  // The issues API also returns PRs — keep only true issues here.
  const issues: BoardIssue[] = issuesRaw
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      labels: i.labels.map((l) => l.name),
      assignees: i.assignees.map((a) => a.login),
      url: i.html_url,
      updatedAt: i.updated_at,
    }))
  const prs: BoardPr[] = prsRaw.map((p) => ({
    number: p.number,
    title: p.title,
    author: p.user.login,
    draft: p.draft,
    labels: p.labels.map((l) => l.name),
    url: p.html_url,
    updatedAt: p.updated_at,
  }))
  return { fetchedAt: Date.now(), issues, prs }
}

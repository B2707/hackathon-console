import { checkWebhookSignature } from '@/lib/auth'
import {
  patchBoardIssue,
  patchBoardPr,
  pushEvent,
  setRepo,
  type BoardIssue,
  type BoardPr,
} from '@/lib/state'

export const dynamic = 'force-dynamic'

type GhLabel = { name?: string }
type WebhookPayload = {
  action?: string
  repository?: { full_name?: string }
  sender?: { login?: string }
  pusher?: { name?: string }
  ref?: string
  commits?: unknown[]
  issue?: {
    number: number
    title: string
    state: string
    html_url: string
    updated_at: string
    labels?: GhLabel[]
    assignees?: { login?: string }[]
    pull_request?: unknown
  }
  pull_request?: {
    number: number
    title: string
    state: string
    html_url: string
    updated_at: string
    draft?: boolean
    labels?: GhLabel[]
    user?: { login?: string }
  }
  label?: { name?: string }
  comment?: { html_url?: string }
  workflow_run?: {
    name?: string
    conclusion?: string | null
    head_branch?: string
    html_url?: string
  }
}

function labelNames(labels?: GhLabel[]): string[] {
  return (labels ?? []).flatMap((l) => (l.name ? [l.name] : []))
}

export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  if (!checkWebhookSignature(raw, signature)) {
    return Response.json({ error: 'bad signature' }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = JSON.parse(raw) as WebhookPayload
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 })
  }

  const event = req.headers.get('x-github-event') ?? 'unknown'
  if (payload.repository?.full_name) {
    await setRepo(payload.repository.full_name)
  }

  const at = Date.now()
  const actor = payload.sender?.login ?? payload.pusher?.name ?? 'someone'

  switch (event) {
    case 'ping': {
      await pushEvent({
        at,
        kind: 'ping',
        text: `webhook connected: ${payload.repository?.full_name ?? '?'}`,
      })
      break
    }
    case 'push': {
      const count = payload.commits?.length ?? 0
      const branch = payload.ref?.replace('refs/heads/', '') ?? '?'
      await pushEvent({
        at,
        kind: 'push',
        text: `${actor} pushed ${count} commit${count === 1 ? '' : 's'} to ${branch}`,
      })
      break
    }
    case 'issues': {
      const issue = payload.issue
      if (!issue) break
      const boardIssue: BoardIssue = {
        number: issue.number,
        title: issue.title,
        labels: labelNames(issue.labels),
        assignees: (issue.assignees ?? []).flatMap((a) =>
          a.login ? [a.login] : []
        ),
        url: issue.html_url,
        updatedAt: issue.updated_at,
      }
      await patchBoardIssue(boardIssue, issue.state === 'open')
      const action = payload.action ?? 'updated'
      const detail =
        action === 'labeled' || action === 'unlabeled'
          ? `${action} ${payload.label?.name ?? ''}`.trim()
          : action
      await pushEvent({
        at,
        kind: 'issue',
        text: `${actor} — #${issue.number} ${detail}: ${issue.title}`,
        url: issue.html_url,
      })
      break
    }
    case 'pull_request': {
      const pr = payload.pull_request
      if (!pr) break
      const boardPr: BoardPr = {
        number: pr.number,
        title: pr.title,
        author: pr.user?.login ?? '?',
        draft: pr.draft ?? false,
        labels: labelNames(pr.labels),
        url: pr.html_url,
        updatedAt: pr.updated_at,
      }
      await patchBoardPr(boardPr, pr.state === 'open')
      await pushEvent({
        at,
        kind: 'pr',
        text: `${actor} — PR #${pr.number} ${payload.action ?? 'updated'}: ${pr.title}`,
        url: pr.html_url,
      })
      break
    }
    case 'issue_comment': {
      if (payload.action !== 'created' || !payload.issue) break
      await pushEvent({
        at,
        kind: 'comment',
        text: `${actor} commented on #${payload.issue.number}`,
        url: payload.comment?.html_url ?? payload.issue.html_url,
      })
      break
    }
    case 'workflow_run': {
      const run = payload.workflow_run
      if (payload.action !== 'completed' || !run) break
      await pushEvent({
        at,
        kind: 'ci',
        text: `${run.name ?? 'workflow'}: ${run.conclusion ?? '?'} on ${run.head_branch ?? '?'}`,
        url: run.html_url,
      })
      break
    }
    default:
      // Unhandled event types are acknowledged silently — the hook only
      // subscribes to the ones above, but stay tolerant of new ones.
      break
  }

  return Response.json({ ok: true })
}

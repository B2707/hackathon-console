'use client'

import * as React from 'react'

import { Card } from '@/components/ui/card'
import { ProjectDataTable, type Project } from '@/components/ui/project-data-table'
import type { BoardIssue, BoardPr } from '@/lib/types'
import { LANE_TITLES, initials, laneFor } from '@/lib/board'
import { topicLabels } from './plan-data'

/**
 * Table view — the board's issues + PRs in the user's ProjectDataTable
 * (Project · Repository · Team · Tech · Created · Contributors · Status). The
 * issue/PR → Project mapping mirrors components/wall/board-panel.tsx (whose
 * helpers aren't exported); the shared toolbar `filter` drives the rows, so no
 * per-table filter/column control is rendered here.
 */

type StatusVariant = Project['status']['variant']

function avatarFor(login: string) {
  return { src: `https://github.com/${login}.png?size=64`, alt: login, fallback: initials(login) }
}

function teamFrom(labels: string[]): string {
  const team = labels.find((l) => l.startsWith('team:') || l.startsWith('team/'))
  return team ? team.split(/[:/]/).slice(1).join('/') : '—'
}

function techFrom(labels: string[]): string {
  return topicLabels(labels)[0] ?? '—'
}

function issueStatus(labels: string[]): { text: string; variant: StatusVariant } {
  const lane = laneFor(labels)
  if (lane === 'blocked' || lane === 'needs-human')
    return { text: LANE_TITLES[lane], variant: 'onHold' }
  if (lane === 'ready') return { text: LANE_TITLES[lane], variant: 'active' }
  return { text: LANE_TITLES[lane], variant: 'inProgress' }
}

function prStatus(pr: BoardPr): { text: string; variant: StatusVariant } {
  const lane = laneFor(pr.labels)
  if (lane === 'blocked' || lane === 'needs-human')
    return { text: LANE_TITLES[lane], variant: 'onHold' }
  if (pr.draft) return { text: 'Draft', variant: 'inProgress' }
  return { text: 'Open', variant: 'active' }
}

function toProjects(issues: BoardIssue[], prs: BoardPr[]): Project[] {
  const prRows: Project[] = prs.map((pr) => ({
    id: `pr-${pr.number}`,
    name: pr.title,
    repository: pr.url,
    team: teamFrom(pr.labels),
    tech: techFrom(pr.labels),
    createdAt: pr.updatedAt.slice(0, 10),
    contributors: pr.author ? [avatarFor(pr.author)] : [],
    status: prStatus(pr),
  }))

  const issueRows: Project[] = issues.map((issue) => ({
    id: `issue-${issue.number}`,
    name: issue.title,
    repository: issue.url,
    team: teamFrom(issue.labels),
    tech: techFrom(issue.labels),
    createdAt: issue.updatedAt.slice(0, 10),
    contributors: issue.assignees.map(avatarFor),
    status: issueStatus(issue.labels),
  }))

  return [...prRows, ...issueRows]
}

const ALL_COLUMNS = new Set<keyof Project>([
  'name',
  'repository',
  'team',
  'tech',
  'createdAt',
  'contributors',
  'status',
])

export function PlanTable({
  issues,
  prs,
  filter,
}: {
  issues: BoardIssue[]
  prs: BoardPr[]
  filter: string
}) {
  const projects = React.useMemo(() => toProjects(issues, prs), [issues, prs])

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) =>
      [p.name, p.team, p.tech, p.repository, p.status.text].some((v) =>
        v.toLowerCase().includes(q)
      )
    )
  }, [projects, filter])

  if (projects.length === 0) {
    return (
      <Card className="items-center justify-center p-10 text-center text-sm text-muted-foreground">
        No issues or PRs on the board yet — the webhook fills this in.
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto">
      <ProjectDataTable projects={filtered} visibleColumns={ALL_COLUMNS} />
    </div>
  )
}

'use client'

import * as React from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  ProjectDataTable,
  type Project,
} from '@/components/ui/project-data-table'
import type { BoardIssue, BoardPr } from '@/lib/types'
import { LANES, LANE_TITLES, initials, laneFor } from '@/lib/board'

type StatusVariant = Project['status']['variant']

const LANE_LABELS = new Set<string>([...LANES])
const CONTROL_LABELS = new Set(['demo-path', 'break-glass'])

const COLUMNS: { key: keyof Project; label: string }[] = [
  { key: 'name', label: 'Project' },
  { key: 'repository', label: 'Repository' },
  { key: 'team', label: 'Team' },
  { key: 'tech', label: 'Tech' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'contributors', label: 'Contributors' },
  { key: 'status', label: 'Status' },
]

function avatarFor(login: string) {
  return {
    src: `https://github.com/${login}.png?size=64`,
    alt: login,
    fallback: initials(login),
  }
}

function teamFrom(labels: string[]): string {
  const team = labels.find(
    (l) => l.startsWith('team:') || l.startsWith('team/')
  )
  return team ? team.split(/[:/]/).slice(1).join('/') : '—'
}

function techFrom(labels: string[]): string {
  const tech = labels.find(
    (l) => !LANE_LABELS.has(l) && !CONTROL_LABELS.has(l)
  )
  return tech ?? '—'
}

function issueStatus(labels: string[]): { text: string; variant: StatusVariant } {
  const lane = laneFor(labels)
  if (lane === 'blocked' || lane === 'needs-human')
    return { text: LANE_TITLES[lane], variant: 'onHold' }
  if (lane === 'ready') return { text: LANE_TITLES[lane], variant: 'active' }
  return { text: LANE_TITLES[lane], variant: 'inProgress' }
}

function prStatus(
  pr: BoardPr
): { text: string; variant: StatusVariant } {
  const lane = laneFor(pr.labels)
  if (lane === 'blocked' || lane === 'needs-human')
    return { text: LANE_TITLES[lane], variant: 'onHold' }
  if (pr.draft) return { text: 'Draft', variant: 'inProgress' }
  return { text: 'Open', variant: 'active' }
}

function toProjects(issues: BoardIssue[], prs: BoardPr[]): Project[] {
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

  return [...prRows, ...issueRows]
}

type BoardPanelProps = {
  issues: BoardIssue[]
  prs: BoardPr[]
}

/**
 * Wires the board's issues + PRs into the user's ProjectDataTable, with the
 * demo's column-toggle (DropdownMenu) and filter (Input) controls.
 */
export function BoardPanel({ issues, prs }: BoardPanelProps) {
  const [query, setQuery] = React.useState('')
  const [visibleColumns, setVisibleColumns] = React.useState<Set<keyof Project>>(
    () => new Set(COLUMNS.map((c) => c.key))
  )

  const projects = React.useMemo(() => toProjects(issues, prs), [issues, prs])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) =>
      [p.name, p.team, p.tech, p.repository, p.status.text].some((v) =>
        v.toLowerCase().includes(q)
      )
    )
  }, [projects, query])

  const toggleColumn = (key: keyof Project) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter projects…"
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} item{filtered.length === 1 ? '' : 's'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="items-center justify-center p-10 text-center text-sm text-muted-foreground">
          No issues or PRs on the board yet — the webhook fills this in.
        </Card>
      ) : (
        <ProjectDataTable projects={filtered} visibleColumns={visibleColumns} />
      )}
    </div>
  )
}

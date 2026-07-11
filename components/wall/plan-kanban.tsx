'use client'

import * as React from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  KSTATUS,
  PlanAvatar,
  type PlanCard,
  type PlanColumn,
  type PlanColumnKind,
  buildColumns,
  cardMatches,
} from './plan-data'
import type { Board } from '@/lib/types'

/**
 * Board view — the 3-column kanban (handoff `.kanban-cols`). Columns + their
 * cards derive entirely from the real board (see plan-data.buildColumns) — all
 * OPEN work, no sample Done column. Cards are expandable via React state (not
 * DOM): collapsed shows title + tag chips + id + assignee avatar + chevron;
 * expanded reveals a status badge, the title, and a "View on GitHub" button.
 * The toolbar `filter` narrows cards by title/labels and re-counts each column.
 */
export function PlanKanban({ board, filter }: { board: Board | null; filter: string }) {
  const columns = React.useMemo(() => buildColumns(board), [board])

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {columns.map((column) => (
        <KanbanColumn key={column.kind} column={column} filter={filter} />
      ))}
    </div>
  )
}

function KanbanColumn({ column, filter }: { column: PlanColumn; filter: string }) {
  const cards = column.cards.filter((card) => cardMatches(card, filter))

  return (
    <div className="flex min-h-[120px] flex-col gap-2.5 rounded-xl border border-border bg-popover p-3">
      <div className="flex items-center gap-2 border-b border-border px-1 pb-2 pt-0.5">
        <span className="size-2 flex-none rounded-full" style={{ background: column.dot }} />
        <span className="text-[0.74rem] font-semibold uppercase tracking-[0.06em] text-foreground">
          {column.title}
        </span>
        <span className="ml-auto rounded-full border border-border bg-muted px-[7px] py-px font-mono text-[0.7rem] text-muted-foreground">
          {cards.length}
        </span>
      </div>

      {cards.length === 0 ? (
        <p className="px-1 py-6 text-center text-[0.72rem] text-muted-foreground">
          Nothing yet
        </p>
      ) : (
        cards.map((card) => (
          <KanbanCard key={`${column.kind}-${card.id}`} card={card} kind={column.kind} />
        ))
      )}
    </div>
  )
}

function KanbanCard({ card, kind }: { card: PlanCard; kind: PlanColumnKind }) {
  const [open, setOpen] = React.useState(false)
  const status = KSTATUS[kind]

  return (
    <div
      data-open={open}
      className="group flex flex-col gap-[9px] rounded-[10px] border border-border bg-card p-3 shadow-sm transition-[border-color,transform] hover:-translate-y-px hover:border-input"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer flex-col gap-[9px] border-0 bg-transparent p-0 text-left font-[inherit] text-inherit"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[0.84rem] font-[550] leading-[1.35] text-foreground">
            {card.title}
          </span>
          <ChevronDown
            className={cn(
              'mt-px size-[14px] flex-none text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>

        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.labels.map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.68rem] text-muted-foreground transition-colors group-hover:text-foreground">
            {card.id}
          </span>
          {card.who && <PlanAvatar name={card.who} size={24} />}
        </div>
      </button>

      {open && (
        <div className="reveal-in flex flex-col gap-2.5 border-t border-border pt-[11px]">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 self-start rounded-full border px-[7px] py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.05em]',
              status.cls
            )}
          >
            <span className="size-[5px] rounded-full bg-current" />
            {status.label(card.who)}
          </span>

          {/* Real issues/PRs carry no separate body — show the title. */}
          <p className="text-[0.74rem] leading-[1.42] text-muted-foreground">
            {card.title}
          </p>

          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-muted px-2.5 py-1.5 text-[0.72rem] font-medium text-foreground transition-colors hover:border-input"
          >
            View on GitHub
            <ExternalLink className="size-[13px]" />
          </a>
        </div>
      )}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-border bg-muted px-2 py-[3px] font-mono text-[0.72rem] text-foreground">
      {children}
    </span>
  )
}

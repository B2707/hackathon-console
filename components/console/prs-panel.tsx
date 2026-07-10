'use client'

import { motion } from 'framer-motion'
import { GitPullRequest } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fadeInItem, staggerContainer } from '@/lib/motion'
import type { BoardPr } from '@/lib/types'
import { initials, seatAccent, toneBadgeVariant } from '@/lib/board'

export function PrsPanel({ prs }: { prs: BoardPr[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
          <GitPullRequest className="size-3.5" />
          PRs in flight
        </span>
        <Badge variant={toneBadgeVariant('primary')} className="tabular-nums">
          {prs.length}
        </Badge>
      </div>
      <Separator />

      {prs.length === 0 ? (
        <p className="text-muted-foreground/60 px-3 py-8 text-center text-xs">
          no open pull requests
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Pull request</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="hidden sm:table-cell">Labels</TableHead>
            </TableRow>
          </TableHeader>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="[&_tr:last-child]:border-0"
          >
            {prs.map((pr) => {
              const accent = seatAccent(pr.author)
              return (
                <motion.tr
                  key={pr.number}
                  variants={fadeInItem}
                  className="border-border/60 hover:bg-accent/40 border-b transition-colors"
                >
                  <TableCell>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary flex items-start gap-1.5 transition-colors"
                    >
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">
                        #{pr.number}
                      </span>
                      <span className="text-xs leading-snug">
                        {pr.draft && (
                          <span className="text-warning font-mono">[draft] </span>
                        )}
                        {pr.title}
                      </span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-5">
                        <AvatarFallback
                          className="text-[9px]"
                          style={{ color: accent }}
                        >
                          {initials(pr.author)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground truncate font-mono text-[11px]">
                        {pr.author}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {pr.labels.length === 0 ? (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      ) : (
                        pr.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </motion.tbody>
        </Table>
      )}
    </Card>
  )
}

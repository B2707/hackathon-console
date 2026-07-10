'use client'

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PlanAvatar } from './plan-data'

/**
 * Plan view — a vertical stepper of the 6 demo milestones (handoff
 * `.plan-list`). Entirely SAMPLE, verbatim from the prototype.
 * // TODO: real milestones (from a roadmap / project source).
 */

type MilestoneState = 'done' | 'active' | 'queued'
type Sub = { checked: boolean; text: string; who: string }
type Milestone = {
  state: MilestoneState
  /** Node glyph for active/queued items; done items render a check. */
  node?: string
  title: string
  tag: { text: string; kind: 'done' | 'active' | 'todo' }
  desc: string
  subs?: Sub[]
}

const MILESTONES: Milestone[] = [
  {
    state: 'done',
    title: 'Scaffold repo & CI pipeline',
    tag: { text: 'Done', kind: 'done' },
    desc: 'Template cloned, Actions green, seats provisioned.',
  },
  {
    state: 'done',
    title: 'Wire tripwire alerts',
    tag: { text: 'Done', kind: 'done' },
    desc: 'RED-MAIN, DEMO-FREEZE and collision detection live on the wall.',
  },
  {
    state: 'done',
    title: 'Seat health + heartbeat',
    tag: { text: 'Done', kind: 'done' },
    desc: 'Gauges + resource meters render from the heartbeat feed.',
  },
  {
    state: 'active',
    node: '3',
    title: 'Rebuild wall in shadcn',
    tag: { text: 'In progress', kind: 'active' },
    desc: 'Port every panel to the dark shadcn system with reaviz charts.',
    subs: [
      { checked: true, text: 'Charts row (area + stacked)', who: 'bader' },
      { checked: true, text: 'Kanban + plan stepper', who: 'sjp' },
      { checked: false, text: 'Interactive logs table', who: 'bader' },
    ],
  },
  {
    state: 'queued',
    node: '4',
    title: 'Leaderboard + Mangooli scoring',
    tag: { text: 'Queued', kind: 'todo' },
    desc: 'Finalize contribution weights and the mango-score formula.',
  },
  {
    state: 'queued',
    node: '5',
    title: 'Demo dry-run & freeze',
    tag: { text: 'Queued', kind: 'todo' },
    desc: 'Lock main, run the script end-to-end, screenshot the wall.',
  },
]

const NODE_CLS: Record<MilestoneState, string> = {
  done: 'border-success bg-success/15 text-success',
  active: 'border-primary bg-primary/15 text-primary shadow-[0_0_0_4px_rgba(77,141,255,0.12)]',
  queued: 'border-border bg-card text-muted-foreground',
}

const TAG_CLS: Record<Milestone['tag']['kind'], string> = {
  done: 'border-success/25 bg-success/15 text-success',
  active: 'border-primary/25 bg-primary/15 text-primary',
  todo: 'border-border bg-muted text-muted-foreground',
}

export function PlanStepper() {
  return (
    <div className="flex flex-col">
      {MILESTONES.map((milestone, index) => (
        <div
          key={milestone.title}
          className="relative grid grid-cols-[30px_1fr] gap-4 pb-[22px] last:pb-0"
        >
          {index < MILESTONES.length - 1 && (
            <span className="absolute bottom-[-2px] left-[14px] top-[30px] w-0.5 bg-border" />
          )}

          <div
            className={cn(
              'relative z-[1] grid size-[30px] place-items-center rounded-full border-2 font-mono text-[0.78rem] font-bold',
              NODE_CLS[milestone.state]
            )}
          >
            {milestone.state === 'done' ? <Check className="size-[15px]" /> : milestone.node}
            {milestone.state === 'active' && (
              <span className="absolute size-[30px] rounded-full border-2 border-primary animate-[ping_1.9s_cubic-bezier(0,0,0.2,1)_infinite]" />
            )}
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  'text-[0.95rem] font-semibold',
                  milestone.state === 'done' ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {milestone.title}
              </span>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.06em]',
                  TAG_CLS[milestone.tag.kind]
                )}
              >
                {milestone.tag.text}
              </span>
            </div>

            <p className="mt-[5px] text-[0.82rem] text-muted-foreground">{milestone.desc}</p>

            {milestone.subs && (
              <div className="mt-2.5 flex flex-col gap-[7px]">
                {milestone.subs.map((sub) => (
                  <div
                    key={sub.text}
                    className="flex items-center gap-2.5 text-[0.82rem] text-muted-foreground"
                  >
                    <span
                      className={cn(
                        'grid size-[15px] flex-none place-items-center rounded border-[1.5px]',
                        sub.checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      )}
                    >
                      {sub.checked && <Check className="size-2.5" />}
                    </span>
                    <span className={cn(sub.checked && 'text-foreground')}>{sub.text}</span>
                    <span className="ml-auto">
                      <PlanAvatar name={sub.who} size={22} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function KeyGate({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="border-border/70 backdrop-blur-sm">
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center gap-3">
              <span className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">
                  Team OS Console
                </h1>
                <p className="text-muted-foreground text-xs">
                  Enter your team key to unlock the wall
                </p>
              </div>
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (value.trim()) onSubmit(value.trim())
              }}
            >
              <input
                type="password"
                placeholder="team key"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                className="bg-background border-input focus-visible:border-ring focus-visible:ring-ring/40 h-9 rounded-md border px-3 font-mono text-sm outline-none transition-[color,box-shadow] focus-visible:ring-2"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md text-sm font-medium transition-colors"
              >
                Unlock
              </button>
            </form>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Paste <span className="font-mono">TEAM_HEARTBEAT_SECRET</span> (or
              open <span className="font-mono">/?key=…</span> once). Stored only
              in this browser&apos;s localStorage.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

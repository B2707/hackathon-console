'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// "AnimeNavBar": a centered floating pill nav. Each item is {name,url,icon};
// the active tab gets an animated glow (shared layoutId) with a little mascot
// blob perched on top, and hovered tabs get a soft highlight.
interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface AnimeNavBarProps {
  items: NavItem[]
  className?: string
  defaultActive?: string
}

export function AnimeNavBar({
  items,
  className,
  defaultActive,
}: AnimeNavBarProps) {
  const [mounted, setMounted] = React.useState(false)
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState(
    defaultActive ?? items[0]?.name ?? ''
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'fixed left-1/2 top-4 z-50 -translate-x-1/2',
        className
      )}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-1.5 py-1.5 shadow-lg backdrop-blur-lg"
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name
          const isHovered = hoveredTab === item.name

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              onMouseEnter={() => setHoveredTab(item.name)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                'relative flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300',
                'text-white/70 hover:text-white',
                isActive && 'text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="anime-navbar-lamp"
                  className="absolute inset-0 -z-10 rounded-full bg-white/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* the little mascot blob perched on the active tab */}
                  <motion.div
                    className="absolute -top-2 left-1/2 h-2 w-8 -translate-x-1/2 rounded-t-full bg-primary"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute -top-1 left-1/2 h-4 w-9 -translate-x-1/2 rounded-full bg-primary/25 blur-md" />
                    <div className="absolute left-1.5 top-0.5 h-0.5 w-0.5 rounded-full bg-primary-foreground" />
                    <div className="absolute right-1.5 top-0.5 h-0.5 w-0.5 rounded-full bg-primary-foreground" />
                  </motion.div>
                </motion.div>
              )}

              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-full bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <Icon className="size-4 shrink-0" strokeWidth={2.5} />
              <span className="relative z-10 hidden sm:inline">{item.name}</span>
            </a>
          )
        })}
      </motion.div>
    </div>
  )
}

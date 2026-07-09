import type { Variants, Transition } from 'framer-motion'

// Restrained, calm motion language for the console. Easing is an explicit
// cubic-bezier (easeOut-ish) so typing stays strict across framer-motion majors.
const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1]

/** Container that reveals its children in a gentle stagger. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
}

/** A single item: subtle rise + fade. Pair with {@link staggerContainer}. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
}

/** Tighter variant for dense rows (ticker / table). */
export const fadeInItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: EASE_OUT },
  },
}

/** Gentle infinite pulse for "live / fresh" indicators. */
export const livePulse: Transition = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut',
}

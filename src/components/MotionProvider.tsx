'use client'

import { LazyMotion, MotionConfig } from 'motion/react'

const loadFeatures = () => import('./motionFeatures').then((mod) => mod.default)

/**
 * Every Motion animation respects the visitor's "reduce motion" setting.
 * LazyMotion keeps the animation engine out of the first download: components use the light
 * `m.*` elements and the engine arrives a moment later (before anything scrolls into view).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

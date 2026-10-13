'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { ImgProps } from '../SanityImg'

const ease = [0.16, 1, 0.3, 1] as const

/** Wide illustration with the heading on its quiet left side; drifts gently as you scroll. */
export function AboutHero({ heading, intro, image, children }: { heading: string; intro?: string; image: ImgProps | null; children?: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const words = heading.split(' ')

  return (
    <section ref={ref} className="about-hero" aria-labelledby="about-title">
      {image ? (
        <motion.div className="about-hero-art" style={reduce ? undefined : { scale, y }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 860px) 160vw, 100vw" width={image.width} height={image.height} alt={image.alt} fetchPriority="high" />
        </motion.div>
      ) : null}
      <motion.div className="container about-hero-copy" style={reduce ? undefined : { y: copyY }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          About us
        </motion.p>
        <h1 id="about-title">
          {words.map((w, i) => (
            <span key={i}>
              <span className="hero3d-word">
                <motion.span initial={{ y: '108%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease, delay: 0.1 + i * 0.06 }}>
                  {w}
                </motion.span>
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        {intro ? (
          <motion.p className="about-intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.55 }}>
            {intro}
          </motion.p>
        ) : null}
        {children ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.7 }}>
            {children}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  )
}

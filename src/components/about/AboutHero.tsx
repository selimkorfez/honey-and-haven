'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { ImgProps } from '../SanityImg'

type Vars = React.CSSProperties & Record<`--${string}`, string | number>
/** CSS arrival (see .about-in): shows on first paint without waiting for the page's JavaScript */
const arrive = (delay: number, from: number, duration = 0.9): Vars => ({ '--d': `${delay}s`, '--from': `${from}px`, '--dur': `${duration}s` })

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
        <p className="eyebrow about-in" style={arrive(0, 12, 0.8)}>
          About us
        </p>
        <h1 id="about-title">
          {words.map((w, i) => (
            <span key={i}>
              {/* same CSS word-by-word arrival as the home page's headline (.hero3d-word) */}
              <span className="hero3d-word" style={{ '--i': i } as Vars}>
                <span>{w}</span>
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        {intro ? (
          <p className="about-intro about-in" style={arrive(0.55, 16)}>
            {intro}
          </p>
        ) : null}
        {children ? (
          <div className="about-in" style={arrive(0.7, 16)}>
            {children}
          </div>
        ) : null}
      </motion.div>
    </section>
  )
}

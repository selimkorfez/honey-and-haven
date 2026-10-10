'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { ImgProps } from './SanityImg'

const EXPO = [0.16, 1, 0.3, 1] as const

/**
 * The one authored moment on the site: the photo settles out of a soft blur
 * while the headline rises word by word on a gentle spring.
 */
export function HeroMotion({ image, heading, children }: { image: ImgProps | null; heading: string; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : 180])
  const words = heading.split(' ')

  return (
    <section className="hero">
      <motion.div className="hero-media" style={{ y }}>
        {image ? (
          <motion.img
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.sizes}
            width={image.width}
            height={image.height}
            alt={image.alt}
            fetchPriority="high"
            initial={reduce ? { opacity: 0 } : { scale: 1.08, filter: 'blur(10px) brightness(0.7)' }}
            animate={reduce ? { opacity: 1 } : { scale: 1, filter: 'blur(0px) brightness(1)' }}
            transition={reduce ? { duration: 0.4 } : { duration: 1.6, ease: EXPO }}
          />
        ) : null}
      </motion.div>
      <div className="container hero-content">
        <h1 className="hero-title">
          {words.map((w, i) => (
            <span key={i}>
              <span className="word">
                <motion.span
                  initial={reduce ? { opacity: 0 } : { y: '105%' }}
                  animate={reduce ? { opacity: 1 } : { y: 0 }}
                  transition={
                    reduce ? { duration: 0.4 } : { type: 'spring', stiffness: 140, damping: 22, delay: 0.25 + i * 0.06 }
                  }
                >
                  {w}
                </motion.span>
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        <motion.div
          className="hero-bottom"
          initial={{ opacity: 0, y: reduce ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.4 : 0.8, ease: EXPO, delay: reduce ? 0 : 0.7 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}

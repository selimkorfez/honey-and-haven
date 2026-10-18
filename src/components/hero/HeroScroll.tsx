'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { ImgProps } from '../SanityImg'
import { LogoMark } from '../LogoMark'
import type { HeroTone } from './CupScene'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const loadScene = () => import('./CupScene')
const CupScene = dynamic(loadScene, { ssr: false })
// start downloading the 3D scene as soon as this file runs in the browser, not after hydration
if (typeof window !== 'undefined') loadScene().catch(() => {})

type Step = { _key: string; title: string; text?: string }

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * The home page's opening: a takeaway cup, an iced bottle and a honey jar
 * turning among coffee beans, choreographed to the scroll (GSAP ScrollTrigger
 * drives a 0–1 progress value that the Three.js scene reads every frame).
 */
export function HeroScroll({
  heading,
  text,
  steps,
  fallbackImage,
  tone = 'studio',
  children,
}: {
  tone?: HeroTone
  heading: string
  text?: string
  steps: Step[]
  fallbackImage: ImgProps | null
  children: React.ReactNode
}) {
  const root = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [mode, setMode] = useState<'pending' | '3d' | 'still' | 'flat'>('pending')
  // At night (dark theme) the cream backdrop would glare, so use the studio brown
  const [night, setNight] = useState(false)
  useEffect(() => {
    const html = document.documentElement
    const update = () => setNight(html.dataset.theme === 'dark')
    update()
    const mo = new MutationObserver(update)
    mo.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  const shownTone: HeroTone = night ? 'studio' : tone

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = supportsWebGL()
    setMode(!gl ? 'flat' : reduce ? 'still' : '3d')
  }, [])

  const animated = mode === '3d'
  const words = heading.split(' ')

  useGSAP(
    () => {
      // (the headline's arrival is a CSS animation, see .hero3d-word in globals.css)
      if (!animated) return

      const panels = gsap.utils.toArray<HTMLElement>('.hero3d-panel')
      const dots = gsap.utils.toArray<HTMLElement>('.hero3d-dot')
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => {
            progress.current = self.progress
            const active = Math.min(panels.length - 1, Math.floor(self.progress * panels.length * 0.999))
            dots.forEach((d, i) => d.toggleAttribute('data-active', i === active))
          },
        },
      })
      panels.forEach((panel, i) => {
        if (i === 0) return
        tl.to(panels[i - 1], { autoAlpha: 0, y: -48, duration: 0.45 }, i - 0.55).fromTo(
          panel,
          { autoAlpha: 0, y: 48 },
          { autoAlpha: 1, y: 0, duration: 0.45 },
          i - 0.3,
        )
      })
      tl.to({}, { duration: 0.45 })
    },
    { scope: root, dependencies: [mode, steps.length] },
  )

  return (
    <section
      ref={root}
      className="hero3d"
      data-mode={mode}
      data-tone={shownTone}
      style={{ ['--steps' as string]: steps.length }}
      aria-label="Welcome"
    >
      <div className="hero3d-stage">
        <div className="hero3d-glow" aria-hidden="true" />
        <div className="hero3d-canvas" aria-hidden="true">
          {mode === '3d' || mode === 'still' ? (
            <CupScene progress={progress} still={mode === 'still'} tone={shownTone} />
          ) : mode === 'flat' ? (
            fallbackImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero3d-fallback" src={fallbackImage.src} srcSet={fallbackImage.srcSet} sizes="(max-width: 860px) 100vw, 55vw" alt="" />
            ) : (
              <LogoMark className="hero3d-fallback-mark" />
            )
          ) : null}
        </div>

        <div className="container hero3d-copy">
          <div className="hero3d-panel is-first">
            <h1 className="hero3d-title">
              {words.map((w, i) => (
                <span key={i}>
                  <span className="hero3d-word" style={{ ['--i' as string]: i }}>
                    <span>{w}</span>
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </span>
              ))}
            </h1>
            {text ? <p className="hero3d-text hero3d-after">{text}</p> : null}
            <div className="hero3d-after" style={{ ['--i' as string]: text ? 1 : 0 }}>
              {children}
            </div>
          </div>
          {steps.map((s) => (
            <div key={s._key} className="hero3d-panel">
              <h2 className="hero3d-step">{s.title}</h2>
              {s.text ? <p className="hero3d-text">{s.text}</p> : null}
            </div>
          ))}
        </div>

        {animated && steps.length ? (
          <div className="hero3d-dots" aria-hidden="true">
            {[0, ...steps.map((_, i) => i + 1)].map((i) => (
              <span key={i} className="hero3d-dot" data-active={i === 0 ? '' : undefined} />
            ))}
          </div>
        ) : null}
        {animated ? (
          <div className="hero3d-hint" aria-hidden="true">
            <span>Scroll</span>
            <span className="hero3d-hint-line" />
          </div>
        ) : null}
      </div>
    </section>
  )
}

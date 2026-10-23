'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { supportsWebGL, workerSupported } from './quality'
import WorkerScene from './WorkerScene'

export type { HeroTone } from './quality'
import type { HeroTone } from './quality'

/*
 * The hero's 3D scene (the cups, honey jar and beans, see scene.tsx). Where the browser allows,
 * it's drawn by a background worker so the page stays smooth (WorkerScene); otherwise, for a
 * still frame ("reduce motion"), or if the worker can't start, it's drawn on the page (InlineScene).
 */

const loadInline = () => import('./InlineScene')
const InlineScene = dynamic(loadInline, { ssr: false })
// no worker here: start downloading the page version straight away
if (typeof window !== 'undefined' && !workerSupported()) loadInline().catch(() => {})

type Progress = { current: number }

export default function CupScene({
  progress,
  still = false,
  tone = 'studio',
  onNoWebGL,
}: {
  progress: Progress
  still?: boolean
  tone?: HeroTone
  /** the worker couldn't draw and the page can't either (no WebGL): show the flat picture */
  onNoWebGL?: () => void
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [ready, setReady] = useState(false)
  // client-only component (loaded with ssr: false), so the browser can be checked straight away
  // (a still frame is drawn on the page unless ?worker=1 asks for the worker, for checking)
  const [inWorker, setInWorker] = useState(() => workerSupported() && (!still || /[?&]worker=1/.test(window.location.search)))
  const [stats] = useState(() => /[?&]herostats=1/.test(window.location.search))

  useEffect(() => {
    // Only draw frames while the scene is on screen
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!stats) return
    document.documentElement.dataset.heroRenderer = inWorker ? 'worker' : 'page'
  }, [stats, inWorker])

  return (
    <div ref={wrap} className="cup-scene" data-ready={ready || undefined} style={{ position: 'absolute', inset: 0 }}>
      {inWorker ? (
        <WorkerScene
          progress={progress}
          still={still}
          tone={tone}
          visible={visible}
          stats={stats}
          onReady={() => setReady(true)}
          onFail={() => {
            setReady(false)
            if (supportsWebGL()) setInWorker(false)
            else onNoWebGL?.()
          }}
        />
      ) : (
        <InlineScene progress={progress} still={still} tone={tone} visible={visible} stats={stats} onReady={() => setReady(true)} />
      )}
    </div>
  )
}

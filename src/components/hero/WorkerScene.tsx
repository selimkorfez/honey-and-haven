'use client'

import { useEffect, useRef } from 'react'
import { LEVELS, isTouch, qualityForced, startLevel, workerSupported, type HeroTone } from './quality'

/*
 * The hero scene drawn by a background worker (scene.worker.tsx). The page keeps only a plain
 * <canvas>, hands it over, and sends small messages; the 3D code never loads on the page, so
 * scrolling and taps stay smooth while the cups turn, and phones have less to start up.
 *
 * To the worker: preload {level} · init {canvas, level, limit, still, adaptive, stats, tone, visible,
 * width, height, dpr} · p {v} progress · m {x, y} mouse · wake · tone · visible · size.
 * From the worker: started · ready (first frame drawn, fade in) · error (draw on the page
 * instead) · frames {n} (?herostats=1).
 */

type Progress = { current: number }

const newWorker = () => new Worker(new URL('./scene.worker.tsx', import.meta.url), { type: 'module' })

// Start the worker as soon as this file loads, so its code and the textures download while the
// page is still setting up; the canvas is handed over once the hero is on the page.
let early: Worker | null = null
/** set if the early worker failed before the scene took it over */
let earlyBroken = false
if (typeof window !== 'undefined' && workerSupported()) {
  try {
    early = newWorker()
    early.addEventListener('error', () => (earlyBroken = true))
    early.postMessage({ type: 'preload', level: startLevel() })
  } catch {
    early = null
  }
}

/** One worker per canvas (React's development double-mount would otherwise hand it over twice). */
type Session = { worker: Worker; kill?: number }
const sessions = new WeakMap<HTMLCanvasElement, Session>()

const maxDpr = (level: 0 | 1 | 2) => Math.min(LEVELS[level].dpr, window.devicePixelRatio || 1)

export default function WorkerScene({
  progress,
  still,
  tone,
  visible,
  onReady,
  onFail,
  stats,
}: {
  progress: Progress
  still: boolean
  tone: HeroTone
  visible: boolean
  onReady: () => void
  onFail: () => void
  stats: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const session = useRef<Session | null>(null)
  const cb = useRef({ onReady, onFail })
  cb.current = { onReady, onFail }
  // latest values for the hand-over (later changes are sent by the effects below)
  const initial = useRef({ tone, visible })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const level = startLevel()
    let s = sessions.get(canvas)
    if (s) window.clearTimeout(s.kill)
    else {
      try {
        if (earlyBroken) throw new Error('worker failed to start')
        const worker = early ?? newWorker()
        early = null
        const off = canvas.transferControlToOffscreen()
        const r = canvas.getBoundingClientRect()
        worker.postMessage(
          {
            type: 'init',
            canvas: off,
            level,
            limit: isTouch(),
            still,
            adaptive: !qualityForced(),
            stats,
            tone: initial.current.tone,
            visible: initial.current.visible,
            width: Math.max(1, r.width),
            height: Math.max(1, r.height),
            dpr: maxDpr(level),
          },
          [off],
        )
        s = { worker }
        sessions.set(canvas, s)
      } catch {
        cb.current.onFail()
        return
      }
    }
    const sess = s
    session.current = sess
    const { worker } = sess

    let failed = false
    const fail = () => {
      if (failed) return
      failed = true
      worker.terminate()
      cb.current.onFail()
    }
    // if it hasn't got going in good time (e.g. it broke while loading), draw on the page instead
    const watchdog = window.setTimeout(fail, 15000)
    worker.onmessage = (e) => {
      const m = e.data
      if (m?.type === 'started') window.clearTimeout(watchdog)
      else if (m?.type === 'ready') cb.current.onReady()
      else if (m?.type === 'error') fail()
      else if (m?.type === 'frames') (window as unknown as { __heroFrames?: number }).__heroFrames = m.n
    }
    worker.onerror = fail

    // size changes (rotating the phone, resizing the window)
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) worker.postMessage({ type: 'size', width, height, dpr: maxDpr(level) })
    })
    ro.observe(canvas)

    // scroll progress (and the mouse, on computers) go over once a frame, only when they change
    const fine = window.matchMedia('(pointer: fine)').matches
    const pointer = { x: 0, y: 0, dirty: false }
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointer.dirty = true
    }
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })
    let last = -1
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (progress.current !== last) {
        last = progress.current
        worker.postMessage({ type: 'p', v: last })
      }
      if (pointer.dirty) {
        pointer.dirty = false
        worker.postMessage({ type: 'm', x: pointer.x, y: pointer.y })
      }
    }
    raf = requestAnimationFrame(tick)

    // phones: a scroll or touch tells the worker to draw every frame again for a moment
    let lastWake = 0
    const wake = () => {
      const now = performance.now()
      if (now - lastWake < 120) return
      lastWake = now
      worker.postMessage({ type: 'wake' })
    }
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('touchstart', wake, { passive: true })

    return () => {
      window.clearTimeout(watchdog)
      ro.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('touchstart', wake)
      worker.onmessage = null
      worker.onerror = null
      session.current = null
      // stop the worker unless the same canvas comes straight back (development double-mount)
      sess.kill = window.setTimeout(() => {
        worker.terminate()
        sessions.delete(canvas)
      }, 0)
    }
    // the canvas is handed over once; everything else is sent as it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    session.current?.worker.postMessage({ type: 'tone', tone })
  }, [tone])
  useEffect(() => {
    session.current?.worker.postMessage({ type: 'visible', visible })
  }, [visible])

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} />
}

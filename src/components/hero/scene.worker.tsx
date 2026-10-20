/*
 * Background worker that draws the hero scene, so the page itself stays free for scrolling,
 * taps and text while the cups turn. The page hands over its canvas (OffscreenCanvas) and then
 * just sends small messages: scroll progress, size, light/dark, on/off screen.
 * Messages: see WorkerScene.tsx.
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createRoot, extend, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, GL_OPTIONS, SceneContents, frameCount, mouse, preloadTextures, setupRenderer, type OnWake } from './scene'
import { LEVELS, type HeroTone } from './quality'

type Scope = {
  postMessage(m: unknown): void
  addEventListener(type: 'message', fn: (e: MessageEvent) => void): void
  requestAnimationFrame?: (cb: FrameRequestCallback) => number
  cancelAnimationFrame?: (id: number) => void
}
const scope = self as unknown as Scope
const post = (m: unknown) => scope.postMessage(m)

// Very old engines without frames in workers: a plain 60 a second timer
if (!scope.requestAnimationFrame) {
  scope.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number
  scope.cancelAnimationFrame = (id) => clearTimeout(id)
}

// <Canvas> does this for the page; a bare root has to be told which three.js objects exist
extend(THREE as unknown as Parameters<typeof extend>[0])

const progress = { current: 0 }

type View = { tone: HeroTone; visible: boolean; width: number; height: number; dpr: number }
let view: View = { tone: 'studio', visible: true, width: 1, height: 1, dpr: 1 }
const listeners = new Set<() => void>()
const setView = (patch: Partial<View>) => {
  view = { ...view, ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const getView = () => view

const wakers = new Set<() => void>()
const onWake: OnWake = (wake) => {
  wakers.add(wake)
  return () => {
    wakers.delete(wake)
  }
}

type Init = {
  type: 'init'
  canvas: OffscreenCanvas
  level: 0 | 1 | 2
  limit: boolean
  still: boolean
  adaptive: boolean
  stats: boolean
} & View

function App({ init }: { init: Init }) {
  const v = useSyncExternalStore(subscribe, getView, getView)
  const [ready, setReady] = useState(false)
  const [lowRes, setLowRes] = useState(false)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const setDpr = useThree((s) => s.setDpr)
  const setSize = useThree((s) => s.setSize)

  useEffect(() => setFrameloop(init.still || (init.limit && v.visible) ? 'demand' : v.visible ? 'always' : 'never'), [init.still, init.limit, v.visible, setFrameloop])
  useEffect(() => setDpr(lowRes ? 1 : v.dpr), [lowRes, v.dpr, setDpr])
  useEffect(() => setSize(v.width, v.height), [v.width, v.height, setSize])
  useEffect(() => {
    if (ready) post({ type: 'ready' })
  }, [ready])
  useEffect(() => {
    if (!init.stats) return
    const t = setInterval(() => post({ type: 'frames', n: frameCount.n }), 250)
    return () => clearInterval(t)
  }, [init.stats])

  return (
    <SceneContents
      q={LEVELS[init.level]}
      progress={progress}
      still={init.still}
      tone={v.tone}
      limit={init.limit}
      visible={v.visible}
      adaptive={init.adaptive}
      ready={ready}
      lowRes={lowRes}
      onReady={() => setReady(true)}
      onLowRes={() => setLowRes(true)}
      onWake={onWake}
      stats={init.stats}
    />
  )
}

let started = false
async function start(init: Init) {
  if (started) return
  started = true
  const { canvas, level, limit, still, type: _t, ...rest } = init
  void _t
  setView({ tone: rest.tone, visible: rest.visible, width: rest.width, height: rest.height, dpr: rest.dpr })
  // the pre-made textures first, as on the page (painted on the spot if they don't arrive)
  await Promise.race([preloadTextures(LEVELS[level].tex), new Promise((r) => setTimeout(r, 4000))])
  try {
    const root = createRoot(canvas)
    await root.configure({
      gl: GL_OPTIONS,
      shadows: 'percentage',
      camera: CAMERA,
      dpr: rest.dpr,
      size: { width: rest.width, height: rest.height, top: 0, left: 0 },
      frameloop: still || (limit && rest.visible) ? 'demand' : rest.visible ? 'always' : 'never',
      onCreated: ({ gl }) => setupRenderer(gl),
    })
    root.render(<App init={init} />)
    post({ type: 'started' })
  } catch (err) {
    // e.g. no WebGL in workers on this browser: the page draws it instead
    post({ type: 'error', message: String(err) })
  }
}

scope.addEventListener('message', (e) => {
  const m = e.data
  switch (m?.type) {
    case 'preload':
      preloadTextures(LEVELS[m.level as 0 | 1 | 2].tex)
      break
    case 'init':
      start(m as Init)
      break
    case 'p':
      progress.current = m.v
      break
    case 'm':
      mouse.x = m.x
      mouse.y = m.y
      break
    case 'wake':
      wakers.forEach((w) => w())
      break
    case 'tone':
      setView({ tone: m.tone })
      break
    case 'visible':
      setView({ visible: m.visible })
      break
    case 'size':
      setView({ width: m.width, height: m.height, dpr: m.dpr })
      break
  }
})

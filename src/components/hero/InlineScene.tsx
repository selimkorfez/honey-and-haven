'use client'

import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CAMERA, GL_OPTIONS, SceneContents, frameCount, mouse, preloadTextures, setupRenderer, type OnWake, type Progress } from './scene'
import { BAKING, LEVELS, isTouch, qualityForced, startLevel, type HeroTone } from './quality'

/*
 * The hero scene drawn on the page itself: for browsers that can't hand the canvas to a
 * background worker (see WorkerScene), for "reduce motion" (a still frame) and when baking textures.
 */

// Start fetching the pre-made textures as soon as this file loads, alongside everything else
if (typeof window !== 'undefined' && !BAKING) preloadTextures(LEVELS[startLevel()].tex)

const onWake: OnWake = (wake) => {
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('touchstart', wake, { passive: true })
  return () => {
    window.removeEventListener('scroll', wake)
    window.removeEventListener('touchstart', wake)
  }
}

export default function InlineScene({
  progress,
  still,
  tone,
  visible,
  onReady,
  stats,
}: {
  progress: Progress
  still: boolean
  tone: HeroTone
  visible: boolean
  onReady: () => void
  stats: boolean
}) {
  // client-only component, so the device can be read straight away
  const [level] = useState<0 | 1 | 2>(startLevel)
  // last resort on a struggling device: render at 1x
  const [lowRes, setLowRes] = useState(false)
  const [ready, setReady] = useState(false)
  // the pre-made textures (usually already downloaded by now); painted on the spot if they fail
  const [texReady, setTexReady] = useState(BAKING)
  // phones and tablets draw fewer frames while nothing is scrolling
  const [limit] = useState(isTouch)

  useEffect(() => {
    if (texReady) return
    let done = false
    const go = () => {
      if (!done) setTexReady(true)
      done = true
    }
    preloadTextures(LEVELS[level].tex).then(go, go)
    const t = window.setTimeout(go, 4000)
    return () => {
      done = true
      window.clearTimeout(t)
    }
  }, [level, texReady])

  useEffect(() => {
    // Gentle parallax with the mouse (not on touch screens)
    if (!window.matchMedia('(pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (!stats) return
    const t = window.setInterval(() => ((window as unknown as { __heroFrames?: number }).__heroFrames = frameCount.n), 250)
    return () => window.clearInterval(t)
  }, [stats])

  if (!texReady) return null
  const q = LEVELS[level]

  return (
    <Canvas
      frameloop={still || (limit && visible) ? 'demand' : visible ? 'always' : 'never'}
      dpr={Math.min(lowRes ? 1 : q.dpr, window.devicePixelRatio || 1)}
      shadows="percentage"
      camera={CAMERA}
      gl={GL_OPTIONS}
      onCreated={({ gl }) => setupRenderer(gl)}
    >
      <SceneContents
        q={q}
        progress={progress}
        still={still}
        tone={tone}
        limit={limit}
        visible={visible}
        adaptive={!qualityForced()}
        ready={ready}
        lowRes={lowRes}
        onReady={() => {
          setReady(true)
          onReady()
        }}
        onLowRes={() => setLowRes(true)}
        onWake={onWake}
        stats={stats}
      />
    </Canvas>
  )
}

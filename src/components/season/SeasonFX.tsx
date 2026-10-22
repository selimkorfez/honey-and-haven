'use client'

import { useEffect, useRef } from 'react'
import { SEASONS, type SeasonId } from '@/lib/seasons'

type Part = { x: number; y: number; z: number; a: number; sp: number; col: string; ph: number }

/**
 * Gentle seasonal decorations over the home page's opening (snow, petals, leaves, hearts, stars…).
 * A small 2D canvas behind the words: only runs while the opening is on screen and the tab is
 * visible, draws fewer pieces on phones, and stays still for people who prefer reduced motion.
 */
export function SeasonFX({ id }: { id: SeasonId }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const fx = SEASONS[id].fx
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let parts: Part[] = []
    let seed = 11
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      w = r.width
      h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed = 11
      const n = Math.round(fx.count * Math.min(1, Math.max(0.45, w / 1280)))
      parts = Array.from({ length: n }, () => ({
        x: rnd() * w,
        y: rnd() * h,
        z: 0.5 + rnd(),
        a: rnd() * 6.28,
        sp: rnd(),
        col: fx.colors[Math.floor(rnd() * fx.colors.length)],
        ph: rnd() * 6.28,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        let x = p.x
        let y = p.y
        if (!reduce && fx.type !== 'star') {
          if (fx.type === 'spark' || fx.type === 'heart') {
            y = (p.y - t * (8 + p.sp * 10) * p.z) % h
            if (y < 0) y += h
            x = p.x + Math.sin(t * 0.6 + p.ph) * 8
          } else {
            const fall = fx.type === 'snow' ? 14 + p.sp * 14 : 16 + p.sp * 16
            y = (p.y + t * fall * p.z) % h
            x = (((p.x + Math.sin(t * 0.7 + p.ph) * (fx.type === 'snow' ? 10 : 22) + t * (fx.type === 'snow' ? 2 : 8)) % w) + w) % w
          }
        }
        const rot = p.a + (reduce ? 0 : t * (0.4 + p.sp) * (p.ph > 3 ? 1 : -1))
        ctx.save()
        ctx.translate(x, y)
        ctx.fillStyle = p.col
        switch (fx.type) {
          case 'snow':
            ctx.globalAlpha = 0.55 + 0.35 * p.sp
            ctx.beginPath()
            ctx.arc(0, 0, 1.2 + p.z * 1.6, 0, 6.28)
            ctx.fill()
            break
          case 'petal':
            ctx.rotate(rot)
            ctx.globalAlpha = 0.85
            ctx.beginPath()
            ctx.ellipse(0, 0, 4 * p.z, 7 * p.z, 0, 0, 6.28)
            ctx.fill()
            break
          case 'leaf':
            ctx.rotate(rot)
            ctx.globalAlpha = 0.9
            ctx.scale(p.z * 0.95, p.z * 0.95)
            ctx.beginPath()
            ctx.moveTo(0, -10)
            ctx.bezierCurveTo(9, -4, 7, 6, 0, 11)
            ctx.bezierCurveTo(-7, 6, -9, -4, 0, -10)
            ctx.fill()
            ctx.strokeStyle = 'rgba(0,0,0,.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, -8)
            ctx.lineTo(0, 10)
            ctx.stroke()
            break
          case 'heart':
            ctx.rotate(Math.sin(t + p.ph) * 0.3)
            ctx.globalAlpha = 0.75
            ctx.scale(p.z * 0.6, p.z * 0.6)
            ctx.beginPath()
            ctx.moveTo(0, 8)
            ctx.bezierCurveTo(-14, -2, -6, -14, 0, -5)
            ctx.bezierCurveTo(6, -14, 14, -2, 0, 8)
            ctx.fill()
            break
          case 'spark':
            ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(t * 1.5 + p.ph))
            ctx.beginPath()
            ctx.arc(0, 0, 1 + p.z * 1.5, 0, 6.28)
            ctx.fill()
            break
          case 'star': {
            ctx.globalAlpha = reduce ? 0.7 : 0.25 + 0.75 * Math.abs(Math.sin(t * (0.6 + p.sp) + p.ph))
            const s = 1.2 + p.z * 1.8
            ctx.beginPath()
            for (let k = 0; k < 8; k++) {
              const rr = k % 2 ? s * 0.35 : s * 1.6
              const a = (k * Math.PI) / 4
              ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
            }
            ctx.closePath()
            ctx.fill()
            break
          }
          case 'confetti':
            ctx.rotate(rot)
            ctx.globalAlpha = 0.85
            ctx.fillRect(-2.2 * p.z, -1.2 * p.z, 4.4 * p.z, 2.4 * p.z)
            break
        }
        ctx.restore()
      }
    }

    let raf = 0
    let onScreen = true
    const start = performance.now()
    const loop = (now: number) => {
      raf = 0
      if (!onScreen || document.hidden) return
      draw((now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (reduce) return draw(0)
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(loop)
    }

    resize()
    wake()
    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw(0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      wake()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', wake)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', wake)
    }
  }, [id])

  return <canvas ref={ref} className="season-fx" aria-hidden="true" />
}

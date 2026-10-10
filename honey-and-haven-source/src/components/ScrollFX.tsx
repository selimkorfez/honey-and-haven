'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Powers every scroll effect on the site:
 *  - `.reveal` elements fade/slide in when they enter the screen
 *  - `[data-parallax="0.15"]` elements drift at a different speed while scrolling
 *  - the header changes style once you start scrolling
 *  - the menu page category bar highlights the section you're reading
 */
export function ScrollFX() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Header height (used by sticky menu bar)
    const header = document.querySelector<HTMLElement>('.site-header')
    const setHeaderH = () => header && root.style.setProperty('--header-h', `${header.offsetHeight}px`)
    setHeaderH()

    // Reveal on scroll
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    reveals.forEach((el) => io.observe(el))

    // Active category in menu bar
    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.menu-nav a[href^="#"]'))
    const sectionIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          navLinks.forEach((a) => {
            const active = a.getAttribute('href') === `#${e.target.id}`
            a.classList.toggle('active', active)
            if (active) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' })
          })
        }
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    document.querySelectorAll('.menu-section[id]').forEach((s) => sectionIO.observe(s))

    // Parallax + header state
    const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    let ticking = false
    const update = () => {
      ticking = false
      root.dataset.scrolled = window.scrollY > 40 ? 'true' : 'false'
      if (reduce) return
      const vh = window.innerHeight
      for (const el of parallax) {
        const speed = parseFloat(el.dataset.parallax || '0.1')
        const rect = el.parentElement?.getBoundingClientRect() ?? el.getBoundingClientRect()
        if (rect.bottom < -200 || rect.top > vh + 200) continue
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', setHeaderH)
    window.addEventListener('resize', onScroll)

    return () => {
      io.disconnect()
      sectionIO.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', setHeaderH)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  return null
}

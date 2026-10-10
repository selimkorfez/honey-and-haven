'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Small scroll helpers (the animations themselves live in Motion components):
 *  - the header fills with cream once you scroll past the top
 *  - the menu page's category bar highlights the section you're reading
 */
export function ScrollFX() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const header = document.querySelector<HTMLElement>('.site-header')
    const setHeaderH = () => header && root.style.setProperty('--header-h', `${header.offsetHeight}px`)
    setHeaderH()

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

    let ticking = false
    const update = () => {
      ticking = false
      root.dataset.scrolled = window.scrollY > 40 ? 'true' : 'false'
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

    return () => {
      sectionIO.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', setHeaderH)
    }
  }, [pathname])

  return null
}

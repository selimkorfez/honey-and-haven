'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Small scroll helpers (the animations themselves live in Motion components):
 *  - the header fills in once you scroll past the top
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

    // 'hero' while the header is still over the home page's 3D hero (it takes the hero's colour there),
    // 'true' once past it. A little gap between the on/off points stops it flickering at the threshold.
    const hero = document.querySelector<HTMLElement>('.hero3d')
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      const was = root.dataset.scrolled
      const scrolled = was === 'true' || was === 'hero' ? y > 16 : y > 48
      const overHero = Boolean(hero && hero.getBoundingClientRect().bottom > (header?.offsetHeight ?? 64))
      const next = !scrolled ? 'false' : overHero ? 'hero' : 'true'
      if (next !== was) root.dataset.scrolled = next
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Close } from './Icons'

type Item = { href: string; label: string }

/**
 * Phones: the page links move into a panel that slides in from the right.
 * The light switch and the basket stay in the header.
 */
export function MobileMenu({ hasBlog = false, directions }: { hasBlog?: boolean; directions?: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const items: Item[] = [
    { href: '/menu', label: 'Menu' },
    { href: '/shop', label: 'Shop' },
    { href: '/about', label: 'About' },
    ...(hasBlog ? [{ href: '/blog', label: 'Blog' }] : []),
    { href: '/#visit', label: 'Visit us' },
  ]

  useEffect(() => setMounted(true), [])

  // close when the page changes
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.menuOpen = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      // keep keyboard focus inside the panel
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a, button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('a')?.focus(), 60)
    const btn = toggle.current
    return () => {
      delete root.dataset.menuOpen
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      btn?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      {mounted
        ? createPortal(
            <div className="drawer" data-open={open || undefined} aria-hidden={!open}>
              <div className="drawer-scrim" onClick={() => setOpen(false)} />
              <div
                ref={panel}
                id="mobile-menu"
                className="drawer-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                inert={!open}
              >
                <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <Close />
                </button>
                <nav aria-label="Main">
                  <ul className="drawer-links">
                    {items.map((it, i) => {
                      const current = it.href === pathname || (it.href !== '/#visit' && pathname.startsWith(`${it.href}/`))
                      return (
                        <li key={it.href} style={{ ['--i' as string]: i }}>
                          <Link href={it.href} aria-current={current ? 'page' : undefined} onClick={() => setOpen(false)}>
                            {it.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
                {directions ? (
                  <a className="btn btn-primary drawer-cta" href={directions} target="_blank" rel="noopener noreferrer">
                    Get directions <ArrowUpRight />
                  </a>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

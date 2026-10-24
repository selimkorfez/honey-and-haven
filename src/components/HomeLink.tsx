'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The header logo: goes to the home page, and on the home page itself glides back up to the top
 * (the 3D opening), which a plain link to the same page wouldn't do.
 */
export function HomeLink({ className, label, children }: { className?: string; label: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Link
      href="/"
      className={className}
      aria-label={label}
      scroll
      onClick={(e) => {
        if (pathname !== '/' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
        if (window.location.hash) history.replaceState(null, '', '/')
      }}
    >
      {children}
    </Link>
  )
}

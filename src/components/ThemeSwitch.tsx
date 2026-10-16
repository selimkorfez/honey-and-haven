'use client'

import { useEffect, useState } from 'react'
import { BeeMark } from './bee/BeeMark'

const KEY = 'hh-theme'
type Theme = 'light' | 'dark'

/**
 * Runs in <head> before the page paints: picks the saved choice, or else the device's
 * light / dark setting, so the page never flashes the wrong colours.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem('${KEY}')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=t==='dark'?'#17110f':'#f3eadf'})()`

function apply(theme: Theme) {
  const html = document.documentElement
  html.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17110f' : '#f3eadf')
}

function saved(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

/**
 * The light switch in the header: a honey slider. Bee knob on the left with the sun
 * by day; at night it slides across, the moon rises and stars come out. Follows the
 * device setting until someone flips it, then remembers their choice. How it looks is pure CSS on html[data-theme], so it's
 * right from the first paint.
 */
export function ThemeSwitch() {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    const html = document.documentElement
    const read = () => {
      const isDark = html.dataset.theme === 'dark'
      setDark(isDark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#17110f' : '#f3eadf')
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    // no choice saved yet: keep following the device if it changes (e.g. sunset auto-switch)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onDevice = () => {
      if (!saved()) apply(mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onDevice)
    return () => {
      mo.disconnect()
      mq.removeEventListener('change', onDevice)
    }
  }, [])

  const flip = () => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {}
    // instant, like a real light switch (the rocker itself animates)
    apply(next)
  }

  return (
    <button
      type="button"
      className="light-switch"
      role="switch"
      aria-checked={dark === null ? true : !dark}
      aria-label="Lights (switch between day and night look)"
      title={dark ? 'Lights on' : 'Lights off'}
      onClick={flip}
    >
      <span className="ls-track" aria-hidden="true">
        <span className="ls-stars">
          <i />
          <i />
          <i />
        </span>
        <svg className="ls-ico ls-moon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
        <svg className="ls-ico ls-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
        <span className="ls-knob">
          <BeeMark className="ls-bee" />
        </span>
      </span>
    </button>
  )
}

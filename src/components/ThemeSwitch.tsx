'use client'

import { useEffect, useState } from 'react'

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
 * The light switch in the header: a little wall rocker. Up = lights on (day look),
 * down = lights off (night look). Follows the device setting until someone flips it,
 * then remembers their choice. How it looks is pure CSS on html[data-theme], so it's
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
      <span className="ls-plate" aria-hidden="true">
        <span className="ls-rocker" />
        <span className="ls-dot" />
      </span>
    </button>
  )
}

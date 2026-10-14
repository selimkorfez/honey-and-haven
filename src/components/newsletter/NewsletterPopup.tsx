'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { NewsletterSettings } from '@/lib/types'
import { readLetter, writeLetter } from '@/lib/newsletter'
import { BeeMark } from '../bee/BeeMark'
import { Close } from '../Icons'
import { NewsletterForm } from './NewsletterForm'

const ease = [0.16, 1, 0.3, 1] as const
const SNOOZE = 30 * 24 * 60 * 60 * 1000 // closed: stay away for 30 days
const QUIET = ['/shop/thank-you', '/newsletter', '/info/privacy'] // never interrupt these pages

/**
 * A small card that slides in once a visitor has been browsing for a while.
 * Never shown after they sign up, and not again for 30 days after they close it.
 * Waits while the visitor is in the 3D opening, has the basket or the bee open,
 * or is already looking at the signup above the footer.
 */
export function NewsletterPopup({ settings }: { settings: NewsletterSettings }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const ids = useId()
  const card = useRef<HTMLDivElement>(null)

  // The badge follows the heading's offer ("10% off…"), or shows the bee if there's no percentage
  const percent = settings.popupHeading.match(/\d+\s?%/)?.[0].replace(/\s/, '')
  const quiet = QUIET.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (quiet || open) return
    const s = readLetter()
    if (s.status || (s.dismissedAt && Date.now() - s.dismissedAt < SNOOZE)) return
    try {
      if (sessionStorage.getItem('hh-letter-shown') === '1') return
    } catch {}

    const ready = () => {
      const hero = document.querySelector('.hero3d')
      if (hero && hero.getBoundingClientRect().bottom > window.innerHeight * 0.5) return false
      if (document.querySelector('.basket-layer, .bee[data-open]')) return false
      const band = document.getElementById('newsletter')
      if (band) {
        const r = band.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) return false
      }
      return true
    }

    let elapsed = 0
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      elapsed += 1
      if (elapsed >= settings.popupDelay && ready()) {
        clearInterval(tick)
        setOpen(true)
        try {
          sessionStorage.setItem('hh-letter-shown', '1')
        } catch {}
        // Let the bee know, so its greeting doesn't talk over the card
        window.dispatchEvent(new CustomEvent('hh:letter-popup'))
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [quiet, open, settings.popupDelay])

  // Leave quietly when the visitor navigates to a page where it shouldn't be
  useEffect(() => {
    if (quiet) setOpen(false)
  }, [quiet])

  const close = () => {
    setOpen(false)
    if (!done) writeLetter({ dismissedAt: Date.now() })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={card}
          className="letter-pop"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${ids}-title`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.55, ease }}
        >
          <button type="button" className="icon-btn letter-pop-close" aria-label="Close" onClick={close}>
            <Close />
          </button>
          {done ? (
            <div className="letter-pop-done" role="status">
              <BeeMark className="letter-done-mark" />
              <h2 id={`${ids}-title`}>Almost there</h2>
              <p>{settings.thanks}</p>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Back to browsing
              </button>
            </div>
          ) : (
            <>
              <div className="letter-pop-head">
                <span className="letter-pop-badge" aria-hidden="true">
                  {percent ? (
                    <>
                      {percent}
                      <small>off</small>
                    </>
                  ) : (
                    <BeeMark />
                  )}
                </span>
                <div>
                  <h2 id={`${ids}-title`}>{settings.popupHeading}</h2>
                  <p>{settings.popupText}</p>
                </div>
              </div>
              <NewsletterForm settings={settings} variant="pop" source="popup" onDone={() => setDone(true)} />
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

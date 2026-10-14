import type { NewsletterSettings, Settings } from './types'

/** Wording used until the owner changes it in Site settings → Newsletter. */
export const NEWSLETTER_DEFAULTS: NewsletterSettings = {
  enabled: true,
  popup: true,
  popupDelay: 20,
  popupHeading: 'Enjoy 10% off your first visit',
  popupText: 'Join the Honey & Haven letter.',
  heading: 'Stay in the hive',
  text: 'Coffee notes, local stories and occasional treats — plus 10% off your first visit.',
  offer: 'Your 10% welcome code arrives by email as soon as you confirm.',
  button: 'Subscribe',
  thanks: 'Thank you! Check your inbox and tap the link to confirm. Your 10% code follows straight after.',
}

export function newsletterSettings(settings: Settings): NewsletterSettings {
  const n = settings?.newsletter ?? {}
  const pick = <K extends keyof NewsletterSettings>(k: K) => (n[k] === undefined || n[k] === null || n[k] === '' ? NEWSLETTER_DEFAULTS[k] : (n[k] as NewsletterSettings[K]))
  return {
    enabled: pick('enabled'),
    popup: pick('popup'),
    popupDelay: Math.min(120, Math.max(5, Number(pick('popupDelay')) || 20)),
    popupHeading: pick('popupHeading'),
    popupText: pick('popupText'),
    heading: pick('heading'),
    text: pick('text'),
    offer: pick('offer'),
    button: pick('button'),
    thanks: pick('thanks'),
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** What this browser remembers about the visitor and the newsletter (never their email). */
export type LetterState = { status?: 'pending' | 'joined'; dismissedAt?: number }
const KEY = 'hh-letter'
export const LETTER_EVENT = 'hh:letter'

export function readLetter(): LetterState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as LetterState
  } catch {
    return {}
  }
}

export function writeLetter(patch: LetterState) {
  const next = { ...readLetter(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  window.dispatchEvent(new CustomEvent(LETTER_EVENT, { detail: next }))
  return next
}

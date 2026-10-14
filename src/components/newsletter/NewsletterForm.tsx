'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import type { NewsletterSettings } from '@/lib/types'
import { EMAIL_RE, LETTER_EVENT, readLetter, writeLetter, type LetterState } from '@/lib/newsletter'
import { ArrowRight } from '../Icons'

type Field = 'email' | 'consent'

/** Remembers (in this browser only) whether the visitor has signed up, and keeps every form in step. */
export function useLetterState() {
  const [state, setState] = useState<LetterState | null>(null)
  useEffect(() => {
    setState(readLetter())
    const on = (e: Event) => setState((e as CustomEvent<LetterState>).detail)
    const onStorage = (e: StorageEvent) => e.key === 'hh-letter' && setState(readLetter())
    window.addEventListener(LETTER_EVENT, on)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(LETTER_EVENT, on)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return state
}

export function NewsletterForm({
  settings,
  variant,
  source,
  onDone,
}: {
  settings: NewsletterSettings
  variant: 'band' | 'pop'
  source: 'popup' | 'footer'
  onDone?: () => void
}) {
  const ids = useId()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [consent, setConsent] = useState(false)
  const [trap, setTrap] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<{ text: string; field?: Field } | null>(null)
  const started = useRef(Date.now())
  const emailRef = useRef<HTMLInputElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError({ text: 'Please check your email address.', field: 'email' })
      emailRef.current?.focus()
      return
    }
    if (!consent) {
      setError({ text: 'Please tick the box so we can send you emails.', field: 'consent' })
      consentRef.current?.focus()
      return
    }
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, firstName, consent, source, website: trap, elapsed: Date.now() - started.current }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: Field }
      if (res.ok && data.ok) {
        writeLetter({ status: readLetter().status === 'joined' ? 'joined' : 'pending' })
        onDone?.()
        return
      }
      setError({ text: data.error || 'We couldn’t sign you up just now. Please try again in a moment.', field: data.field })
    } catch {
      setError({ text: 'We couldn’t reach the hive. Please check your connection and try again.' })
    }
    setSending(false)
  }

  const errorId = `${ids}-error`
  const describe = (f: Field) => (error?.field === f ? errorId : undefined)

  return (
    <form className="letter-form" data-variant={variant} onSubmit={submit} noValidate>
      {variant === 'pop' ? (
        <div className="letter-fields">
          <label className="letter-field">
            <span>First name <small>(optional)</small></span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={60} />
          </label>
          <label className="letter-field">
            <span>Email</span>
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error?.field === 'email') setError(null)
              }}
              aria-invalid={error?.field === 'email' || undefined}
              aria-describedby={describe('email')}
              maxLength={160}
            />
          </label>
        </div>
      ) : (
        <div className="letter-inline">
          <label className="sr-only" htmlFor={`${ids}-email`}>
            Email address
          </label>
          <input
            id={`${ids}-email`}
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Your email address"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error?.field === 'email') setError(null)
            }}
            aria-invalid={error?.field === 'email' || undefined}
            aria-describedby={describe('email')}
            maxLength={160}
          />
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Joining…' : settings.button} <ArrowRight />
          </button>
        </div>
      )}

      <label className="letter-consent" data-error={error?.field === 'consent' || undefined}>
        <input
          ref={consentRef}
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked)
            if (error?.field === 'consent') setError(null)
          }}
          aria-describedby={describe('consent')}
        />
        <span>Yes, send me Honey &amp; Haven emails with news and offers. I can unsubscribe at any time.</span>
      </label>

      {/* Spam trap: hidden from people */}
      <label className="bee-trap" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </label>

      {variant === 'pop' ? (
        <button type="submit" className="btn btn-primary letter-submit" disabled={sending}>
          {sending ? 'Joining…' : settings.button} <ArrowRight />
        </button>
      ) : null}

      {error ? (
        <p className="letter-error" id={errorId} role="alert">
          {error.text}
        </p>
      ) : null}

      <p className="letter-small">
        {settings.offer} See our <Link href="/info/privacy">Privacy Policy</Link>.
      </p>
    </form>
  )
}

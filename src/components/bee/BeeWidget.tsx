'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import type { BeePick } from '@/lib/types'
import { BeeMark } from './BeeMark'
import { ArrowRight, ArrowUpRight, Close } from '../Icons'

const ease = [0.16, 1, 0.3, 1] as const

const KINDS = [
  { value: 'feedback', label: 'Feedback', placeholder: 'How was your visit? What did you love, or what could be better?' },
  { value: 'idea', label: 'Idea', placeholder: 'A drink you’d love us to make, an event, a new treat…' },
  { value: 'recommend', label: 'Recommend', placeholder: 'Recommend us something: a flavour, a song for the café, a local maker…' },
  { value: 'other', label: 'Other', placeholder: 'Tell us anything.' },
] as const

type Tab = 'tell' | 'picks'

/** Opens the bee from anywhere: window.dispatchEvent(new CustomEvent('hh:bee', { detail: 'tell' })) */
export const openBee = (tab: Tab = 'tell') => window.dispatchEvent(new CustomEvent('hh:bee', { detail: tab }))

export function BeeWidget({ greeting, picks }: { greeting?: string; picks: BeePick[] }) {
  const reduce = useReducedMotion()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('tell')
  const [hello, setHello] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const ids = useId()

  // Say hello once per visit, a few seconds in, once the visitor is past the big 3D opening
  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem('hh-bee-hi') === '1'
    } catch {}
    if (seen || !greeting) return
    let show: ReturnType<typeof setTimeout> | undefined
    let hide: ReturnType<typeof setTimeout> | undefined
    const clearOfHero = () => {
      const hero = document.querySelector('.hero3d')
      return !hero || hero.getBoundingClientRect().bottom < window.innerHeight * 0.5
    }
    const arm = () => {
      if (show || !clearOfHero()) return
      window.removeEventListener('scroll', arm)
      show = setTimeout(() => {
        setHello(true)
        try {
          sessionStorage.setItem('hh-bee-hi', '1')
        } catch {}
        hide = setTimeout(() => setHello(false), 10000)
      }, 4000)
    }
    window.addEventListener('scroll', arm, { passive: true })
    arm()
    return () => {
      window.removeEventListener('scroll', arm)
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [greeting])

  const show = useCallback((t: Tab) => {
    setTab(t)
    setHello(false)
    setOpen(true)
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => show(((e as CustomEvent).detail as Tab) || 'tell')
    const onClose = () => setOpen(false)
    // The newsletter card is sliding in: the bee's greeting steps aside
    const onLetter = () => setHello(false)
    window.addEventListener('hh:bee', onOpen)
    window.addEventListener('hh:bee-close', onClose)
    window.addEventListener('hh:letter-popup', onLetter)
    return () => {
      window.removeEventListener('hh:bee', onOpen)
      window.removeEventListener('hh:bee-close', onClose)
      window.removeEventListener('hh:letter-popup', onLetter)
    }
  }, [show])

  // Close when navigating
  useEffect(() => setOpen(false), [pathname])

  // Escape closes; clicking elsewhere closes; focus moves into the panel
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    const f = requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus())
    return () => {
      cancelAnimationFrame(f)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="bee" data-open={open || undefined}>
      <AnimatePresence>
        {hello && !open ? (
          <m.div
            className="bee-hello"
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.5, ease }}
          >
            <button type="button" className="bee-hello-text" onClick={() => show('tell')}>
              {greeting}
            </button>
            <button type="button" className="bee-hello-close" aria-label="Dismiss" onClick={() => setHello(false)}>
              <Close width={14} height={14} />
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <m.div
            ref={panel}
            id={`${ids}-panel`}
            className="bee-panel"
            role="dialog"
            aria-labelledby={`${ids}-title`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="bee-head">
              <BeeMark className="bee-head-mark" />
              <div>
                <h2 id={`${ids}-title`}>Hello from the bee</h2>
                <p>Notes go straight to the Honey &amp; Haven team.</p>
              </div>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                <Close />
              </button>
            </div>

            <div className="bee-tabs" role="tablist" aria-label="Bee">
              <button type="button" role="tab" aria-selected={tab === 'tell'} onClick={() => setTab('tell')} data-autofocus={tab === 'tell' || undefined}>
                Tell us
              </button>
              {picks.length ? (
                <button type="button" role="tab" aria-selected={tab === 'picks'} onClick={() => setTab('picks')} data-autofocus={tab === 'picks' || undefined}>
                  The bee recommends
                </button>
              ) : null}
            </div>

            <div className="bee-body" role="tabpanel">
              {tab === 'picks' && picks.length ? <Picks picks={picks} onGo={() => setOpen(false)} /> : <Tell pathname={pathname} />}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      <button
        ref={button}
        type="button"
        className="bee-btn"
        aria-expanded={open}
        aria-controls={open ? `${ids}-panel` : undefined}
        aria-label={open ? 'Close the bee' : 'Send us feedback or see what the bee recommends'}
        onClick={() => (open ? setOpen(false) : show(tab))}
      >
        <span className="bee-btn-fly">
          <BeeMark className="bee-btn-mark" />
        </span>
      </button>
    </div>
  )
}

function Picks({ picks, onGo }: { picks: BeePick[]; onGo: () => void }) {
  return (
    <ul className="bee-picks">
      {picks.map((p, i) => {
        const external = p.link && /^https?:\/\//.test(p.link)
        const inner = (
          <>
            <span className="bee-pick-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="bee-pick-copy">
              <strong>{p.title}</strong>
              {p.text ? <span>{p.text}</span> : null}
            </span>
            {p.link ? external ? <ArrowUpRight /> : <ArrowRight /> : null}
          </>
        )
        return (
          <m.li key={p._key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, duration: 0.4, ease }}>
            {p.link ? (
              external ? (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="bee-pick">
                  {inner}
                </a>
              ) : (
                <Link href={p.link} className="bee-pick" onClick={onGo}>
                  {inner}
                </Link>
              )
            ) : (
              <div className="bee-pick">{inner}</div>
            )}
          </m.li>
        )
      })}
    </ul>
  )
}

function Tell({ pathname }: { pathname: string }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('feedback')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const started = useRef(Date.now())
  const ids = useId()
  const current = KINDS.find((k) => k.value === kind)!

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    setError(null)
    if (message.trim().length < 3) {
      setError('Please write a little more.')
      return
    }
    setState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, name, email, website: trap, page: pathname, elapsed: Date.now() - started.current }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setState('sent')
        return
      }
      setError(data.error || 'We couldn’t send that just now. Please try again.')
    } catch {
      setError('We couldn’t reach the bee. Please check your connection and try again.')
    }
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div className="bee-sent" role="status">
        <m.span
          className="bee-sent-mark"
          initial={{ x: -40, y: 30, rotate: -20, opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease }}
        >
          <BeeMark />
        </m.span>
        <h3>Thank you!</h3>
        <p>The bee is buzzing your note over to the team{name ? `, ${name.split(' ')[0]}` : ''}.{email ? ' If it needs a reply, we’ll email you.' : ''}</p>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMessage('')
            setState('idle')
            started.current = Date.now()
          }}
        >
          Send another note
        </button>
      </div>
    )
  }

  return (
    <form className="bee-form" onSubmit={send} noValidate>
      <fieldset className="bee-kinds">
        <legend className="sr-only">What kind of note is it?</legend>
        {KINDS.map((k) => (
          <label key={k.value} data-checked={kind === k.value || undefined}>
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} />
            {k.label}
          </label>
        ))}
      </fieldset>
      <label className="sr-only" htmlFor={`${ids}-msg`}>
        Your message
      </label>
      <textarea
        id={`${ids}-msg`}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          setError(null)
        }}
        placeholder={current.placeholder}
        rows={4}
        maxLength={1500}
        required
      />
      <div className="bee-row">
        <label>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={80} placeholder="Optional" />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={160}
            placeholder="Only for a reply"
          />
        </label>
      </div>
      {/* Hidden from people; bots fill it in */}
      <input className="bee-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      {error ? (
        <p className="bee-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary bee-send" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send to the team'}
        {state === 'sending' ? null : <ArrowRight />}
      </button>
      <p className="bee-small">
        Want to leave a public review instead?{' '}
        <a href="/#reviews" onClick={() => window.dispatchEvent(new CustomEvent('hh:bee-close'))}>
          See reviews
        </a>
      </p>
    </form>
  )
}

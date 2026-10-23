'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { checkDetails, type CheckoutRequest, type CheckoutResponse, type CustomerDetails, type Fulfilment } from '@/lib/basket'
import { discountAmount, type DiscountRule } from '@/lib/discounts'
import { deliveryCost, gbp } from '@/lib/money'
import { LogoMark } from '../LogoMark'
import { ArrowLeft, ArrowRight, Check, Close, Lock, Minus, Plus, Store, Truck } from '../Icons'
import { useBasket } from './BasketProvider'

const ease = [0.16, 1, 0.3, 1] as const
const DETAILS_KEY = 'hh-details-v1'
const EMPTY: CustomerDetails = { name: '', email: '', phone: '', line1: '', line2: '', city: '', postcode: '' }

type Step = 'basket' | 'details'
type Applied = { rule: DiscountRule; label: string } | null

export function BasketDrawer() {
  const b = useBasket()
  const { config, lines, open, setOpen } = b
  const reduce = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const ids = useId()
  const [step, setStep] = useState<Step>('basket')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [badField, setBadField] = useState<string | null>(null)
  const [details, setDetails] = useState<CustomerDetails>(EMPTY)
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState<Applied>(null)
  const [codeMsg, setCodeMsg] = useState<string | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)

  const collectionOnly = lines.filter((l) => l.collectionOnly)
  const both = config.collectionEnabled && config.deliveryEnabled
  const fulfilment: Fulfilment = !config.deliveryEnabled
    ? 'collection'
    : !config.collectionEnabled
      ? 'delivery'
      : collectionOnly.length
        ? 'collection'
        : b.fulfilment
  const blockedByCollection = collectionOnly.length > 0 && !config.collectionEnabled
  const discount = discountAmount(applied?.rule, b.subtotal)
  const belowMin = applied && typeof applied.rule.minSpend === 'number' && b.subtotal < applied.rule.minSpend ? applied.rule.minSpend : null
  const freeDelivery = Boolean(applied?.rule.freeDelivery) && !belowMin
  const delivery = fulfilment === 'delivery' && !freeDelivery ? deliveryCost(config, b.subtotal) : 0
  const total = Math.round((b.subtotal - discount + delivery) * 100) / 100
  const toFree =
    fulfilment === 'delivery' && !freeDelivery && typeof config.freeDeliveryOver === 'number' && config.freeDeliveryOver > 0 && delivery > 0
      ? config.freeDeliveryOver - b.subtotal
      : 0

  const notice = !config.ordersOpen
    ? config.closedMessage || 'Online orders are paused for now.'
    : !config.live
      ? 'Online payments are being set up. Everything is available in store in the meantime.'
      : blockedByCollection
        ? `${collectionOnly.map((l) => l.name).join(', ')} can only be collected in store, which isn’t available right now.`
        : null

  // Remember the customer's details in this browser for next time
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || 'null')
      if (saved && typeof saved === 'object') setDetails({ ...EMPTY, ...saved })
    } catch {}
  }, [])

  // Back to the first step whenever the basket is reopened or emptied
  useEffect(() => {
    if (!open || !lines.length) setStep('basket')
  }, [open, lines.length])

  // Focus, Escape, focus trap and scroll lock while open
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    requestAnimationFrame(() => closeBtn.current?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab' || !panel.current) return
      const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [open, setOpen])

  // If the browser restores this page from its back/forward cache, re-enable the button
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setBusy(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  /** Any change to the basket clears an old checkout message. */
  const act =
    <A extends unknown[]>(fn: (...a: A) => void) =>
    (...a: A) => {
      setError(null)
      fn(...a)
    }

  const field = (name: keyof CustomerDetails) => ({
    id: `${ids}-${name}`,
    name,
    value: details[name] ?? '',
    'aria-invalid': badField === name || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDetails((d) => ({ ...d, [name]: e.target.value }))
      if (badField === name) {
        setBadField(null)
        setError(null)
      }
    },
  })

  async function applyCode(e?: React.FormEvent) {
    e?.preventDefault()
    if (!codeInput.trim() || checkingCode) return
    setCheckingCode(true)
    setCodeMsg(null)
    try {
      const res = await fetch('/api/discount', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: codeInput }) })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; rule?: DiscountRule; label?: string; error?: string }
      if (data.ok && data.rule) {
        setApplied({ rule: data.rule, label: data.label || data.rule.code })
        setCodeInput('')
      } else setCodeMsg(data.error || 'That code isn’t valid.')
    } catch {
      setCodeMsg('We couldn’t check that code. Please try again.')
    }
    setCheckingCode(false)
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    const bad = checkDetails(details, fulfilment)
    if (bad) {
      setBadField(bad.field)
      setError(bad.error)
      document.getElementById(`${ids}-${bad.field}`)?.focus()
      return
    }
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details))
    } catch {}
    setBusy(true)
    try {
      const body: CheckoutRequest = {
        lines: lines.map((l) => ({ productId: l.productId, variantKey: l.variantKey, qty: l.qty })),
        fulfilment,
        customer: details,
        code: applied?.rule.code,
      }
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = (await res.json().catch(() => ({ error: 'Something went wrong. Please try again.' }))) as CheckoutResponse
      if ('url' in data && data.url) {
        window.location.assign(data.url)
        return
      }
      const err = 'error' in data ? data : { error: 'Something went wrong. Please try again.', field: undefined, fix: undefined }
      if (err.fix?.length) {
        b.limit(err.fix)
        setStep('basket')
      }
      if (err.field === 'code') {
        setApplied(null)
        setCodeMsg(err.error)
        setStep('basket')
      } else if (err.field) setBadField(err.field)
      setError(err.error)
    } catch {
      setError('We couldn’t reach the checkout. Please check your connection and try again.')
    }
    setBusy(false)
  }

  const totals = (
    <dl className="basket-totals">
      <div>
        <dt>Subtotal</dt>
        <dd className="price">{gbp(b.subtotal)}</dd>
      </div>
      {discount > 0 ? (
        <div className="basket-discount">
          <dt>Discount ({applied?.rule.code})</dt>
          <dd className="price">−{gbp(discount)}</dd>
        </div>
      ) : null}
      <div>
        <dt>{fulfilment === 'collection' ? 'Collection' : 'Delivery'}</dt>
        <dd className="price">{delivery === 0 ? 'Free' : gbp(delivery)}</dd>
      </div>
      <div className="basket-total">
        <dt>Total</dt>
        <dd className="price">{gbp(total)}</dd>
      </div>
    </dl>
  )

  return (
    <AnimatePresence>
      {open ? (
        <div className="basket-layer" key="basket">
          <m.div
            className="basket-scrim"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <m.div
            ref={panel}
            className="basket"
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-title"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="basket-head">
              {step === 'details' ? (
                <button type="button" className="icon-btn basket-back" onClick={() => setStep('basket')} aria-label="Back to basket">
                  <ArrowLeft />
                </button>
              ) : null}
              <h2 id="basket-title">
                {step === 'details' ? (
                  'Your details'
                ) : (
                  <>
                    Your basket {b.count ? <span className="basket-count">{b.count}</span> : null}
                  </>
                )}
              </h2>
              <button ref={closeBtn} type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close basket">
                <Close />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="basket-empty">
                <LogoMark className="basket-empty-mark" />
                <p>Your basket is empty.</p>
                <Link href="/shop" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Visit the shop <ArrowRight />
                </Link>
              </div>
            ) : step === 'basket' ? (
              <>
                <ul className="basket-lines">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <m.li
                        key={l.id}
                        className="basket-line"
                        layout={!reduce}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.4, ease }}
                      >
                        <Link href={`/shop/${l.slug}`} className="basket-thumb" onClick={() => setOpen(false)} tabIndex={-1} aria-hidden="true">
                          {l.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.image} alt="" width={72} height={72} />
                          ) : (
                            <LogoMark />
                          )}
                        </Link>
                        <div className="basket-line-body">
                          <div className="basket-line-top">
                            <Link href={`/shop/${l.slug}`} onClick={() => setOpen(false)} className="basket-line-name">
                              {l.name}
                            </Link>
                            <span className="price">{gbp(Math.round(l.price * l.qty * 100) / 100)}</span>
                          </div>
                          {l.option ? <p className="basket-line-option">{l.option}</p> : null}
                          {l.collectionOnly ? <p className="basket-line-option">Collection in store only</p> : null}
                          <div className="basket-line-actions">
                            <div className="qty" role="group" aria-label={`Quantity of ${l.name}`}>
                              <button type="button" onClick={() => act(b.setQty)(l.id, l.qty - 1)} aria-label="One fewer">
                                <Minus />
                              </button>
                              <output aria-live="polite">{l.qty}</output>
                              <button
                                type="button"
                                onClick={() => act(b.setQty)(l.id, l.qty + 1)}
                                disabled={l.qty >= Math.min(20, l.max ?? 20)}
                                aria-label="One more"
                              >
                                <Plus />
                              </button>
                            </div>
                            <button type="button" className="link-btn" onClick={() => act(b.remove)(l.id)}>
                              Remove
                            </button>
                          </div>
                          {l.max !== null && l.qty >= l.max ? <p className="basket-line-note">That’s all we have left.</p> : null}
                        </div>
                      </m.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="basket-foot">
                  {both ? (
                    <fieldset className="fulfil">
                      <legend className="sr-only">How would you like to get your order?</legend>
                      <label className="fulfil-option" data-checked={fulfilment === 'collection' || undefined}>
                        <input
                          type="radio"
                          name="fulfilment"
                          value="collection"
                          checked={fulfilment === 'collection'}
                          onChange={() => act(b.setFulfilment)('collection')}
                        />
                        <Store />
                        <span>
                          <strong>Collect in store</strong>
                          <small>Free</small>
                        </span>
                      </label>
                      <label className="fulfil-option" data-checked={fulfilment === 'delivery' || undefined} data-disabled={collectionOnly.length > 0 || undefined}>
                        <input
                          type="radio"
                          name="fulfilment"
                          value="delivery"
                          checked={fulfilment === 'delivery'}
                          disabled={collectionOnly.length > 0}
                          onChange={() => act(b.setFulfilment)('delivery')}
                        />
                        <Truck />
                        <span>
                          <strong>UK delivery</strong>
                          <small>{deliveryCost(config, b.subtotal) === 0 ? 'Free' : gbp(config.deliveryFee)}</small>
                        </span>
                      </label>
                    </fieldset>
                  ) : null}
                  <p className="basket-note">
                    {collectionOnly.length > 0 && config.deliveryEnabled
                      ? `${collectionOnly.length > 1 ? 'Some items' : collectionOnly[0].name} can only be collected in store. `
                      : null}
                    {fulfilment === 'collection' ? config.collectionNote : config.deliveryNote}
                  </p>

                  {/* Discount code */}
                  {config.live ? (
                    applied ? (
                      <div className="code-applied">
                        <Check />
                        <span>
                          <strong>{applied.rule.code}</strong> {applied.label}
                          {belowMin ? <small> · spend {gbp(belowMin)} to use it</small> : null}
                        </span>
                        <button type="button" className="link-btn" onClick={() => setApplied(null)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form className="code-form" onSubmit={applyCode}>
                        <label htmlFor={`${ids}-code`} className="sr-only">
                          Discount code
                        </label>
                        <input
                          id={`${ids}-code`}
                          value={codeInput}
                          onChange={(e) => {
                            setCodeInput(e.target.value)
                            setCodeMsg(null)
                          }}
                          placeholder="Discount code"
                          autoCapitalize="characters"
                          autoComplete="off"
                          maxLength={30}
                        />
                        <button type="submit" className="btn btn-ghost" disabled={!codeInput.trim() || checkingCode}>
                          {checkingCode ? 'Checking…' : 'Apply'}
                        </button>
                        {codeMsg ? (
                          <p className="code-msg" role="alert">
                            {codeMsg}
                          </p>
                        ) : null}
                      </form>
                    )
                  ) : null}

                  {totals}
                  {toFree > 0 ? <p className="basket-nudge">Add {gbp(Math.round(toFree * 100) / 100)} more for free delivery.</p> : null}

                  {notice ? <p className="basket-alert">{notice}</p> : null}
                  {error ? (
                    <p className="basket-alert" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-primary basket-checkout"
                    onClick={() => {
                      setError(null)
                      setStep('details')
                    }}
                    disabled={Boolean(notice)}
                  >
                    Checkout <ArrowRight />
                  </button>
                  <p className="basket-secure">
                    <Lock /> Secure payment by SumUp · Card, Apple Pay, Google Pay
                  </p>
                </div>
              </>
            ) : (
              <form className="details" onSubmit={pay} noValidate>
                <div className="details-body">
                  <p className="details-intro">
                    {fulfilment === 'collection' ? 'So we know whose order it is when you collect it.' : 'Where should we post your order? UK addresses only.'}
                  </p>
                  <div className="details-field">
                    <label htmlFor={`${ids}-name`}>Full name</label>
                    <input {...field('name')} autoComplete="name" maxLength={80} required />
                  </div>
                  <div className="details-field">
                    <label htmlFor={`${ids}-email`}>Email</label>
                    <input {...field('email')} type="email" autoComplete="email" inputMode="email" maxLength={160} required />
                  </div>
                  <div className="details-field">
                    <label htmlFor={`${ids}-phone`}>
                      Phone <span>optional, in case we need to reach you</span>
                    </label>
                    <input {...field('phone')} type="tel" autoComplete="tel" inputMode="tel" maxLength={30} />
                  </div>
                  {fulfilment === 'delivery' ? (
                    <fieldset className="details-address">
                      <legend>Delivery address</legend>
                      <div className="details-field">
                        <label htmlFor={`${ids}-line1`}>Address</label>
                        <input {...field('line1')} autoComplete="address-line1" maxLength={120} required />
                      </div>
                      <div className="details-field">
                        <label htmlFor={`${ids}-line2`} className="sr-only">
                          Address line 2
                        </label>
                        <input {...field('line2')} autoComplete="address-line2" maxLength={120} placeholder="Flat, building (optional)" />
                      </div>
                      <div className="details-row">
                        <div className="details-field">
                          <label htmlFor={`${ids}-city`}>Town or city</label>
                          <input {...field('city')} autoComplete="address-level2" maxLength={80} required />
                        </div>
                        <div className="details-field">
                          <label htmlFor={`${ids}-postcode`}>Postcode</label>
                          <input {...field('postcode')} autoComplete="postal-code" autoCapitalize="characters" maxLength={10} required />
                        </div>
                      </div>
                    </fieldset>
                  ) : (
                    <p className="details-collect">
                      <Store /> {config.collectionNote}
                    </p>
                  )}
                </div>

                <div className="basket-foot">
                  {totals}
                  {error ? (
                    <p className="basket-alert" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button type="submit" className="btn btn-primary basket-checkout" disabled={busy} aria-busy={busy}>
                    {busy ? 'Opening secure payment…' : `Pay ${gbp(total)}`}
                    {busy ? null : <Lock />}
                  </button>
                  <p className="basket-secure">You’ll pay on SumUp’s secure page, then come back here.</p>
                </div>
              </form>
            )}
          </m.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

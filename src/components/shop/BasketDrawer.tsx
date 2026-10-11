'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { CheckoutRequest, CheckoutResponse, Fulfilment } from '@/lib/basket'
import { deliveryCost, gbp } from '@/lib/money'
import { LogoMark } from '../LogoMark'
import { ArrowRight, Close, Lock, Minus, Plus, Store, Truck } from '../Icons'
import { useBasket } from './BasketProvider'

const ease = [0.16, 1, 0.3, 1] as const

export function BasketDrawer() {
  const b = useBasket()
  const { config, lines, open, setOpen } = b
  const reduce = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const delivery = fulfilment === 'delivery' ? deliveryCost(config, b.subtotal) : 0
  const total = b.subtotal + delivery
  const toFree =
    fulfilment === 'delivery' && typeof config.freeDeliveryOver === 'number' && config.freeDeliveryOver > 0 && delivery > 0
      ? config.freeDeliveryOver - b.subtotal
      : 0

  const notice = !config.ordersOpen
    ? config.closedMessage || 'Online orders are paused for now.'
    : !config.live
      ? 'Online payments are being set up. Everything is available in store in the meantime.'
      : blockedByCollection
        ? `${collectionOnly.map((l) => l.name).join(', ')} can only be collected in store, which isn’t available right now.`
        : null

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

  async function checkout() {
    setBusy(true)
    setError(null)
    try {
      const body: CheckoutRequest = {
        lines: lines.map((l) => ({ productId: l.productId, variantKey: l.variantKey, qty: l.qty })),
        fulfilment,
      }
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = (await res.json().catch(() => ({ error: 'Something went wrong. Please try again.' }))) as CheckoutResponse
      if ('url' in data && data.url) {
        window.location.assign(data.url)
        return
      }
      if ('fix' in data && data.fix?.length) b.limit(data.fix)
      setError('error' in data ? data.error : 'Something went wrong. Please try again.')
    } catch {
      setError('We couldn’t reach the checkout. Please check your connection and try again.')
    }
    setBusy(false)
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="basket-layer" key="basket">
          <motion.div
            className="basket-scrim"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
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
              <h2 id="basket-title">
                Your basket {b.count ? <span className="basket-count">{b.count}</span> : null}
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
            ) : (
              <>
                <ul className="basket-lines">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
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
                      </motion.li>
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

                  <dl className="basket-totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd className="price">{gbp(b.subtotal)}</dd>
                    </div>
                    <div>
                      <dt>{fulfilment === 'collection' ? 'Collection' : 'Delivery'}</dt>
                      <dd className="price">{delivery === 0 ? 'Free' : gbp(delivery)}</dd>
                    </div>
                    <div className="basket-total">
                      <dt>Total</dt>
                      <dd className="price">{gbp(Math.round(total * 100) / 100)}</dd>
                    </div>
                  </dl>
                  {toFree > 0 ? <p className="basket-nudge">Add {gbp(Math.round(toFree * 100) / 100)} more for free delivery.</p> : null}

                  {notice ? <p className="basket-alert">{notice}</p> : null}
                  {error ? (
                    <p className="basket-alert" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button type="button" className="btn btn-primary basket-checkout" onClick={checkout} disabled={Boolean(notice) || busy} aria-busy={busy}>
                    {busy ? 'Opening secure checkout…' : 'Checkout'}
                    {busy ? null : <ArrowRight />}
                  </button>
                  <p className="basket-secure">
                    <Lock /> Secure payment by Stripe · Discount codes at checkout
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

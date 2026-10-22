'use client'

import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { BasketItemInput } from '@/lib/basket'
import { gbp, stockInfo } from '@/lib/money'
import type { ProductVariant } from '@/lib/types'
import { Check, Minus, Plus } from '../Icons'
import { useBasket } from './BasketProvider'

type Props = {
  product: {
    id: string
    slug: string
    name: string
    image?: string
    price: number
    compareAtPrice?: number | null
    stock?: number | null
    collectionOnly: boolean
    optionName?: string | null
    variants: ProductVariant[]
  }
  lowAt: number
  ordersOpen: boolean
  closedMessage?: string
  /** shown in the shop but not for sale yet */
  comingSoon?: boolean
}

export function AddToBasket({ product, lowAt, ordersOpen, closedMessage, comingSoon = false }: Props) {
  const { add, lines } = useBasket()
  const hasVariants = product.variants.length > 0
  const [variantKey, setVariantKey] = useState<string | null>(hasVariants && product.variants.length === 1 ? product.variants[0]._key : null)
  const [qty, setQty] = useState(1)
  const [nudge, setNudge] = useState(false)
  const [added, setAdded] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  const variant = product.variants.find((v) => v._key === variantKey) ?? null
  const price = typeof variant?.price === 'number' ? variant.price : product.price
  const stock = stockInfo(hasVariants ? (variant ? variant.stock : null) : product.stock, lowAt)
  const allSoldOut = hasVariants ? product.variants.every((v) => stockInfo(v.stock, lowAt).soldOut) : stock.soldOut
  const inBasket = lines.find((l) => l.productId === product.id && (l.variantKey ?? null) === (variantKey ?? null))?.qty ?? 0
  const maxQty = Math.max(0, Math.min(20, stock.left ?? 20) - inBasket)
  const optionLabel = (product.optionName || 'option').toLowerCase()
  const onSale = !variant?.price && typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price

  function submit() {
    if (hasVariants && !variant) {
      setNudge(true)
      groupRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus()
      return
    }
    const item: BasketItemInput = {
      productId: product.id,
      variantKey: variant?._key,
      name: product.name,
      option: variant ? `${product.optionName || 'Option'}: ${variant.name}` : undefined,
      price,
      image: product.image,
      slug: product.slug,
      max: stock.left,
      collectionOnly: product.collectionOnly,
    }
    add(item, Math.min(qty, Math.max(1, maxQty)))
    setQty(1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="atb">
      <p className="atb-price">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={price}
            className="price"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {gbp(price)}
          </motion.span>
        </AnimatePresence>
        {onSale ? (
          <s className="price">
            <span className="sr-only">was </span>
            {gbp(product.compareAtPrice!)}
          </s>
        ) : null}
      </p>

      {hasVariants ? (
        <div className="atb-options">
          <p id={labelId} className="atb-label">
            {product.optionName || 'Choose an option'}
            {variant ? <span>: {variant.name}</span> : null}
          </p>
          <div ref={groupRef} className="atb-pills" role="radiogroup" aria-labelledby={labelId} data-nudge={nudge || undefined}>
            {product.variants.map((v) => {
              const out = stockInfo(v.stock, lowAt).soldOut
              return (
                <button
                  key={v._key}
                  type="button"
                  role="radio"
                  aria-checked={variantKey === v._key}
                  disabled={out}
                  onClick={() => {
                    setVariantKey(v._key)
                    setNudge(false)
                    setQty(1)
                  }}
                >
                  {v.name}
                  {out ? <span className="sr-only"> (sold out)</span> : null}
                </button>
              )
            })}
          </div>
          {nudge ? (
            <p className="atb-hint" role="alert">
              Please choose a {optionLabel} first.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="atb-stock" aria-live="polite">
        {comingSoon
          ? 'Coming soon. It isn’t in the shop just yet, so check back soon or ask in store.'
          : allSoldOut
          ? 'Sold out for now. Check back soon or ask in store.'
          : stock.soldOut
            ? `This ${optionLabel} is sold out.`
            : stock.low
              ? `Only ${stock.left} left`
              : stock.left !== null
                ? 'In stock'
                : hasVariants && !variant
                  ? ''
                  : 'In stock'}
      </p>

      {comingSoon ? null : !ordersOpen ? (
        <p className="atb-closed">{closedMessage}</p>
      ) : allSoldOut ? null : (
        <div className="atb-row">
          <div className="qty qty-lg" role="group" aria-label="Quantity">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One fewer">
              <Minus />
            </button>
            <output aria-live="polite">{qty}</output>
            <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, maxQty), q + 1))} disabled={qty >= maxQty} aria-label="One more">
              <Plus />
            </button>
          </div>
          <button type="button" className="btn btn-primary atb-btn" onClick={submit} disabled={Boolean(variant && stock.soldOut) || (maxQty === 0 && (!hasVariants || Boolean(variant)))}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'added' : 'add'}
                className="atb-btn-label"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {added ? (
                  <>
                    <Check /> Added to basket
                  </>
                ) : maxQty === 0 && inBasket > 0 ? (
                  'All in your basket'
                ) : (
                  <>Add to basket · {gbp(Math.round(price * qty * 100) / 100)}</>
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MAX_PER_LINE, lineId, type BasketItemInput, type BasketLine, type Fulfilment } from '@/lib/basket'
import type { CheckoutConfig } from '@/lib/types'
import dynamic from 'next/dynamic'

// The drawer shows nothing until the basket is opened, so its code is fetched just after the page loads
const BasketDrawer = dynamic(() => import('./BasketDrawer').then((mod) => mod.BasketDrawer), { ssr: false })

type BasketCtx = {
  config: CheckoutConfig
  lines: BasketLine[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (open: boolean) => void
  fulfilment: Fulfilment
  setFulfilment: (f: Fulfilment) => void
  add: (item: BasketItemInput, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  /** Applies stock limits the server reported at checkout. */
  limit: (fix: { id: string; max: number }[]) => void
}

const Ctx = createContext<BasketCtx | null>(null)
const KEY = 'hh-basket-v1'

export function useBasket() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBasket must be used inside <BasketProvider>')
  return ctx
}

const cap = (l: Pick<BasketLine, 'max'>) => Math.min(MAX_PER_LINE, l.max ?? MAX_PER_LINE)

export function BasketProvider({ config, children }: { config: CheckoutConfig; children: React.ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([])
  const [open, setOpen] = useState(false)
  const [fulfilment, setFulfilment] = useState<Fulfilment>(config.collectionEnabled ? 'collection' : 'delivery')
  const [ready, setReady] = useState(false)

  // Restore the basket saved in this browser (and keep tabs in sync)
  useEffect(() => {
    const read = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
        if (Array.isArray(saved?.lines)) setLines(saved.lines.filter((l: BasketLine) => l && l.id && l.qty > 0))
        if (saved?.fulfilment === 'collection' || saved?.fulfilment === 'delivery') setFulfilment(saved.fulfilment)
      } catch {
        /* storage unavailable: basket just won't persist */
      }
    }
    read()
    setReady(true)
    // Coming back from a cancelled checkout: reopen the basket
    const url = new URL(window.location.href)
    if (url.searchParams.get('basket') === 'open') {
      setOpen(true)
      url.searchParams.delete('basket')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
    const onStorage = (e: StorageEvent) => e.key === KEY && read()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ lines, fulfilment }))
    } catch {
      /* ignore */
    }
  }, [ready, lines, fulfilment])

  const add = useCallback((item: BasketItemInput, qty = 1) => {
    const id = lineId(item.productId, item.variantKey)
    setLines((prev) => {
      const existing = prev.find((l) => l.id === id)
      if (existing) return prev.map((l) => (l.id === id ? { ...l, ...item, qty: Math.min(cap(item), l.qty + qty) } : l))
      return [...prev, { ...item, id, qty: Math.min(cap(item), qty) }]
    })
    setOpen(true)
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(cap(l), qty) } : l))))
  }, [])

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), [])
  const clear = useCallback(() => setLines([]), [])

  const limit = useCallback((fix: { id: string; max: number }[]) => {
    setLines((prev) =>
      prev
        .map((l) => {
          const f = fix.find((x) => x.id === l.id)
          return f ? { ...l, max: f.max, qty: Math.min(l.qty, f.max) } : l
        })
        .filter((l) => l.qty > 0),
    )
  }, [])

  const value = useMemo<BasketCtx>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0)
    const subtotal = Math.round(lines.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100
    return { config, lines, count, subtotal, open, setOpen, fulfilment, setFulfilment, add, setQty, remove, clear, limit }
  }, [config, lines, open, fulfilment, add, setQty, remove, clear, limit])

  return (
    <Ctx.Provider value={value}>
      {children}
      <BasketDrawer />
    </Ctx.Provider>
  )
}

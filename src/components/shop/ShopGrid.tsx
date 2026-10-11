'use client'

import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import type { ProductCardView } from '@/lib/productView'
import { ProductCard } from './ProductCard'

const ease = [0.16, 1, 0.3, 1] as const

export function ShopGrid({ products, categories }: { products: ProductCardView[]; categories: string[] }) {
  const [active, setActive] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const shown = active ? products.filter((p) => p.category === active) : products

  return (
    <LayoutGroup>
      {categories.length > 1 ? (
        <div className="shop-filters" role="group" aria-label="Filter by category">
          {[null, ...categories].map((c) => (
            <button key={c ?? 'all'} type="button" aria-pressed={active === c} onClick={() => setActive(c)}>
              {active === c ? <motion.span layoutId="shop-filter" className="shop-filter-pill" transition={{ duration: 0.45, ease }} /> : null}
              <span>{c ?? 'Everything'}</span>
            </button>
          ))}
        </div>
      ) : null}
      <ul className="pgrid">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease }}
            >
              <ProductCard p={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </LayoutGroup>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { BasketItemInput } from '@/lib/basket'
import { Check, Plus } from '../Icons'
import { useBasket } from './BasketProvider'

/** Small "Add" button on product cards for products without options. */
export function QuickAdd({ item, label = 'Add' }: { item: BasketItemInput; label?: string }) {
  const { add } = useBasket()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1400)
    return () => clearTimeout(t)
  }, [done])
  return (
    <button
      type="button"
      className="quick-add"
      data-done={done || undefined}
      onClick={() => {
        add(item)
        setDone(true)
      }}
      // the spoken name starts with the words on the button ("Add to basket: Tote bag")
      aria-label={label === 'Add' ? `Add ${item.name} to basket` : `${label}: ${item.name}`}
    >
      {done ? <Check /> : <Plus />}
      <span>{done ? 'Added' : label}</span>
    </button>
  )
}

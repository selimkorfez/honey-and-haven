'use client'

import { useEffect } from 'react'
import { useBasket } from './BasketProvider'

/** Empties the basket once an order has been paid. */
export function ClearBasket() {
  const { clear } = useBasket()
  useEffect(() => {
    clear()
  }, [clear])
  return null
}

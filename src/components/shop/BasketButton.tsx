'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Bag } from '../Icons'
import { useBasket } from './BasketProvider'

export function BasketButton() {
  const { count, setOpen } = useBasket()
  return (
    <button
      type="button"
      className="basket-btn"
      onClick={() => setOpen(true)}
      aria-label={count ? `Basket, ${count} item${count === 1 ? '' : 's'}` : 'Basket, empty'}
    >
      <Bag />
      <AnimatePresence>
        {count ? (
          <motion.span
            key={count}
            className="basket-badge"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 22 }}
            aria-hidden="true"
          >
            {count}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  )
}

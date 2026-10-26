'use client'

import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import type { ImgProps } from './SanityImg'

export type BoardItem = {
  id: string
  name: string
  price: string
  description?: string
  tags: { short: string; long: string }[]
  image: ImgProps | null
}

const EXPO = [0.16, 1, 0.3, 1] as const

/** Favourites as a menu board: point at a row and the photo changes to that item. */
export function MenuBoard({ items }: { items: BoardItem[] }) {
  // Open on the first item that has a photo
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((i) => i.image)))
  const select = (i: number) => setActive(i)
  const current = items[active]

  return (
    <div className="board">
      <div className="board-photo">
        <AnimatePresence initial={false} mode="popLayout">
          {current?.image ? (
            <m.img
              key={current.id}
              src={current.image.src}
              srcSet={current.image.srcSet}
              sizes={current.image.sizes}
              width={current.image.width}
              height={current.image.height}
              alt={current.image.alt}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EXPO }}
            />
          ) : current ? (
            // No photo yet: a themed "coming soon" tile, like the one on the menu page
            <m.div
              key={`soon-${current.id}`}
              className="board-soon"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EXPO }}
            >
              <span className="board-soon-label">Photo coming soon</span>
              <span className="board-soon-name">{current.name}</span>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
      <ul className="board-list">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              className="board-row"
              aria-pressed={active === i}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              onClick={() => select(i)}
            >
              {active === i ? (
                <m.span
                  layoutId="board-highlight"
                  className="board-highlight"
                  aria-hidden="true"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              ) : null}
              <span className="board-line">
                <span className="board-name">{item.name}</span>
                {item.price ? (
                  <>
                    <span className="dots" aria-hidden="true" />
                    <span className="price">{item.price}</span>
                  </>
                ) : null}
              </span>
              {item.description ? <span className="board-desc">{item.description}</span> : null}
              {item.tags.length ? (
                <span className="tags">
                  {item.tags.map((t) => (
                    <span key={t.short} className="tag" title={t.long}>
                      {t.short}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

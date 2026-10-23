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
  const [active, setActive] = useState(0)
  const firstWithImage = items.findIndex((i) => i.image)
  // Items without a photo keep showing the last photo, so the frame is never empty
  const [shown, setShown] = useState(firstWithImage)
  const select = (i: number) => {
    setActive(i)
    if (items[i].image) setShown(i)
  }
  const photo = shown >= 0 ? items[shown] : null

  return (
    <div className="board">
      <div className="board-photo">
        <AnimatePresence initial={false} mode="popLayout">
          {photo?.image ? (
            <m.img
              key={photo.id}
              src={photo.image.src}
              srcSet={photo.image.srcSet}
              sizes={photo.image.sizes}
              width={photo.image.width}
              height={photo.image.height}
              alt={photo.image.alt}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EXPO }}
            />
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

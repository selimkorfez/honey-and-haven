'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ImgProps } from '../SanityImg'
import { Img } from '../Img'
import { LogoMark } from '../LogoMark'

export function ProductGallery({ images, thumbs, name }: { images: ImgProps[]; thumbs: ImgProps[]; name: string }) {
  const [i, setI] = useState(0)
  if (!images.length)
    return (
      <div className="pgallery">
        <div className="pgallery-main pgallery-empty">
          <LogoMark />
        </div>
      </div>
    )
  return (
    <div className="pgallery">
      <div className="pgallery-main">
        <AnimatePresence initial={false}>
          <motion.div
            key={i}
            className="pgallery-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Img img={images[i]} priority={i === 0} />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 ? (
        <div className="pgallery-thumbs" role="group" aria-label={`Photos of ${name}`}>
          {thumbs.map((t, n) => (
            <button key={n} type="button" aria-pressed={n === i} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)}>
              <Img img={t} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

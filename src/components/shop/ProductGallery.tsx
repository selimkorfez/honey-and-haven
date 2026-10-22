'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { ImgProps } from '../SanityImg'
import { Img } from '../Img'
import { LogoMark } from '../LogoMark'

/**
 * The colours along a photo's top and bottom edges, read from its tiny blurred preview. Photos that
 * aren't the frame's shape are shown whole, and the space above and below is filled with these, so
 * it reads as more of the photo's own backdrop.
 */
function useEdgeColours(images: ImgProps[]) {
  const [edges, setEdges] = useState<(string | null)[]>([])
  useEffect(() => {
    let off = false
    Promise.all(
      images.map(
        (img) =>
          new Promise<string | null>((resolve) => {
            const r = img.width && img.height ? img.width / img.height : 0.8
            // already the frame's shape (4:5): nothing to fill
            if (!img.lqip || Math.abs(r - 0.8) < 0.02) return resolve(null)
            const pic = new Image()
            pic.onload = () => {
              try {
                const c = document.createElement('canvas')
                c.width = pic.naturalWidth
                c.height = pic.naturalHeight
                const ctx = c.getContext('2d')!
                ctx.drawImage(pic, 0, 0)
                const row = (y: number) => {
                  const d = ctx.getImageData(0, y, c.width, 1).data
                  let rr = 0, g = 0, b = 0
                  for (let k = 0; k < d.length; k += 4) {
                    rr += d[k]
                    g += d[k + 1]
                    b += d[k + 2]
                  }
                  const n = d.length / 4
                  return `rgb(${Math.round(rr / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`
                }
                const top = row(0)
                const bottom = row(c.height - 1)
                // left/right space (wide photos) uses the same split, which still blends well
                resolve(`linear-gradient(to bottom, ${top} 0 50%, ${bottom} 50% 100%)`)
              } catch {
                resolve(null)
              }
            }
            pic.onerror = () => resolve(null)
            pic.src = img.lqip
          }),
      ),
    ).then((list) => {
      if (!off) setEdges(list)
    })
    return () => {
      off = true
    }
  }, [images])
  return edges
}

export function ProductGallery({ images, thumbs, name }: { images: ImgProps[]; thumbs: ImgProps[]; name: string }) {
  const [i, setI] = useState(0)
  const edges = useEdgeColours(images)
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
            style={edges[i] ? { background: edges[i]! } : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Img img={images[i]} priority={i === 0} className="pgallery-photo" />
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

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as m from 'motion/react-m'
import type { Review } from '@/lib/reviews'
import { Reveal } from '../Reveal'
import { BeeMark } from '../bee/BeeMark'
import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from '../Icons'

const ease = [0.16, 1, 0.3, 1] as const

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`} style={{ ['--fill' as string]: `${(value / 5) * 100}%`, ['--size' as string]: `${size}px` }}>
      <span className="stars-base" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} width={size} height={size} />
        ))}
      </span>
      <span className="stars-fill" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} width={size} height={size} />
        ))}
      </span>
    </span>
  )
}

/** Top-rated reviews in a swipeable row, the overall rating, and a "leave a review" bar. */
export function Reviews({
  heading,
  text,
  reviews,
  rating,
  count,
  allUrl,
  writeUrl,
  starter,
}: {
  heading?: string
  text?: string
  reviews: Review[]
  rating?: number
  count?: number
  allUrl?: string
  writeUrl: string
  starter: boolean
}) {
  const rail = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const [hover, setHover] = useState(0)

  const update = useCallback(() => {
    const el = rail.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const step = (dir: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('.review-card')
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 20), behavior: 'smooth' })
  }

  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <Reveal className="reviews-head">
          <div>
            <h2 id="reviews-title">{heading || 'Kind words from our regulars'}</h2>
            {text ? <p className="body-text">{text}</p> : null}
          </div>
          {typeof rating === 'number' ? (
            <div className="reviews-score">
              <strong className="price">{rating.toFixed(1)}</strong>
              <div>
                <Stars value={rating} size={18} />
                <p>
                  {count ? `${count.toLocaleString('en-GB')} reviews on Google` : 'on Google'}
                  {allUrl ? (
                    <>
                      {' · '}
                      <a href={allUrl} target="_blank" rel="noopener noreferrer">
                        Read them all
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ) : null}
        </Reveal>

        {reviews.length ? (
          <div className="reviews-rail-wrap">
            <ul className="reviews-rail" ref={rail} onScroll={update} tabIndex={0} aria-label="Reviews">
              {reviews.map((r, i) => (
                <m.li
                  key={r.id}
                  className="review-card"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.8, ease, delay: Math.min(i, 3) * 0.08 }}
                >
                  <Stars value={r.rating} />
                  <blockquote>
                    <p>{r.text}</p>
                  </blockquote>
                  <footer>
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt="" width={36} height={36} loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="review-avatar" aria-hidden="true">
                        {r.author.charAt(0)}
                      </span>
                    )}
                    <span>
                      {r.authorUrl ? (
                        <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="review-name">
                          {r.author}
                        </a>
                      ) : (
                        <span className="review-name">{r.author}</span>
                      )}
                      <small>
                        {[r.when, r.source].filter(Boolean).join(' · ')}
                        {r.link ? (
                          <>
                            {' · '}
                            <a href={r.link} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </>
                        ) : null}
                      </small>
                    </span>
                  </footer>
                </m.li>
              ))}
            </ul>
            {reviews.length > 2 ? (
              <div className="reviews-nav">
                <button type="button" className="icon-btn" onClick={() => step(-1)} disabled={edges.start} aria-label="Previous reviews">
                  <ArrowLeft />
                </button>
                <button type="button" className="icon-btn" onClick={() => step(1)} disabled={edges.end} aria-label="More reviews">
                  <ArrowRight />
                </button>
              </div>
            ) : null}
            {reviews.some((r) => r.source === 'Google') ? <p className="reviews-attrib">Reviews from Google</p> : null}
          </div>
        ) : starter ? (
          <ul className="reviews-rail reviews-placeholder" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="review-card">
                <Stars value={5} />
                <p>Your best Google reviews appear here automatically once Google is connected.</p>
              </li>
            ))}
          </ul>
        ) : null}

        <Reveal className="review-bar" delay={0.1}>
          <div className="review-bar-copy">
            <BeeMark className="review-bar-bee" />
            <div>
              <h3>Enjoyed your visit?</h3>
              <p>A quick review helps other people find a little haven. It means a lot to a small café.</p>
            </div>
          </div>
          <div className="review-bar-actions">
            <div className="review-bar-stars" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <a
                  key={n}
                  href={writeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-on={n <= hover || undefined}
                  onMouseEnter={() => setHover(n)}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover(0)}
                  aria-label={`Leave a ${n} star review on Google`}
                >
                  <Star width={28} height={28} />
                </a>
              ))}
            </div>
            <a href={writeUrl} className="btn btn-light" target="_blank" rel="noopener noreferrer">
              Leave a review <ArrowUpRight />
            </a>
            <button type="button" className="link-btn review-bar-bee-link" onClick={() => window.dispatchEvent(new CustomEvent('hh:bee', { detail: 'tell' }))}>
              Got an idea for us? Tell the bee
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

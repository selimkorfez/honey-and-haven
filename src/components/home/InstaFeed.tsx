import type { InstaPost } from '@/lib/instagram'
import { Reveal } from '../Reveal'
import { ArrowUpRight, Instagram, Layers, Play } from '../Icons'

export type FeedTile = InstaPost & { srcSet?: string }

/** "Slow mornings, warm cups": the café's latest Instagram posts. */
export function InstaFeed({
  heading,
  text,
  posts,
  profile,
  handle,
  live,
}: {
  heading?: string
  text?: string
  posts: FeedTile[]
  profile?: string
  handle?: string | null
  live: boolean
}) {
  return (
    <section className="section insta" id="instagram" aria-labelledby="insta-title">
      <div className="container">
        <Reveal className="insta-head">
          <div>
            <p className="eyebrow">
              <Instagram width={16} height={16} /> {handle || 'Instagram'}
            </p>
            <h2 id="insta-title">{heading || 'Slow mornings, warm cups'}</h2>
            {text ? <p className="body-text">{text}</p> : null}
          </div>
          {profile ? (
            <a href={profile} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
              Follow us <ArrowUpRight />
            </a>
          ) : null}
        </Reveal>
        <ul className="insta-grid" data-live={live || undefined}>
          {posts.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 0.08} y={36}>
              <a href={p.href} className="insta-tile" target="_blank" rel="noopener noreferrer" aria-label={p.caption ? `Instagram post: ${p.caption.slice(0, 90)}` : 'Open on Instagram'}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} srcSet={p.srcSet} sizes="(max-width: 700px) 50vw, 25vw" alt="" loading="lazy" decoding="async" />
                {p.kind !== 'image' ? <span className="insta-kind">{p.kind === 'video' ? <Play /> : <Layers />}</span> : null}
                <span className="insta-over" aria-hidden="true">
                  <Instagram />
                  {p.caption ? <span className="insta-cap">{p.caption}</span> : <span className="insta-cap">View on Instagram</span>}
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { HomeData, MenuItem, SanityImage, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { DIETARY_LABELS, formatPrice, mapsEmbed, mapsLink, paragraphs } from '@/lib/format'
import { SanityImg } from '@/components/SanityImg'
import { Reveal } from '@/components/Reveal'
import { HexMark } from '@/components/Icons'
import { FALLBACK_HOME, FALLBACK_SETTINGS } from '@/lib/fallback'

async function getData() {
  const [settings, data] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), sanityFetch<HomeData>(HOME_QUERY)])
  const page = data?.page ?? FALLBACK_HOME.page
  // Until the café publishes its own home page, show the starter favourites too
  const featured = data?.featured?.length ? data.featured : data?.page ? [] : FALLBACK_HOME.featured
  return { settings: settings ?? FALLBACK_SETTINGS, page, featured }
}

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const { settings, page } = await getData()
  return buildMetadata(settings, page?.seo)
}

export default async function HomePage() {
  const { settings, page, featured } = await getData()
  const heading = page?.heroHeading || settings?.name || 'Honey & Haven'

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-media" data-parallax="0.3">
          <SanityImg image={page?.heroImage} width={1920} height={1280} priority sizes="100vw" />
        </div>
        <div className="container hero-content">
          {page?.heroEyebrow ? (
            <div className="eyebrow fade-up" style={{ ['--d' as string]: '0.2s' }}>
              {page.heroEyebrow}
            </div>
          ) : null}
          <h1 className="hero-title">
            {heading.split(' ').map((w, i) => (
              <Fragment key={i}>
                <span className="word">
                  <span style={{ ['--i' as string]: i }}>{w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <div className="hero-bottom">
            {page?.heroText ? <p className="hero-text fade-up">{page.heroText}</p> : <span />}
            <div className="hero-actions fade-up" style={{ ['--d' as string]: '1.05s' }}>
              <Link href="/menu" className="btn btn-light">
                See the menu <span className="arrow">→</span>
              </Link>
              <Link href="#visit" className="btn btn-ghost">
                Find us
              </Link>
            </div>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true" />
      </section>

      {/* ---------- Marquee ---------- */}
      <Marquee items={featured.length ? featured.map((f) => f.name) : ['Fresh coffee', 'Homemade bakes', 'Good company']} />

      {/* ---------- Story ---------- */}
      <section className="section story" id="story">
        <div className="container">
          <div className="story-grid">
            <Reveal variant="curtain" className="story-media">
              <div data-parallax="0.06" style={{ position: 'absolute', inset: 0 }}>
                <SanityImg image={page?.storyImage} width={900} height={1125} sizes="(max-width: 860px) 100vw, 50vw" />
              </div>
            </Reveal>
            <div className="story-copy">
              <Reveal>
                <span className="eyebrow">Our story</span>
              </Reveal>
              {page?.storyHeading ? (
                <Reveal delay={100}>
                  <h2>{page.storyHeading}</h2>
                </Reveal>
              ) : null}
              <div className="body">
                {paragraphs(page?.storyText).map((p, i) => (
                  <Reveal key={i} delay={180 + i * 80}>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={320}>
                <Link href="/menu" className="btn btn-primary">
                  Explore the menu <span className="arrow">→</span>
                </Link>
              </Reveal>
            </div>
          </div>

          {page?.highlights?.length ? (
            <div className="highlights">
              {page.highlights.map((h, i) => (
                <Reveal key={h._key} className="highlight" delay={i * 120}>
                  <span className="highlight-num">0{i + 1}</span>
                  <h3>{h.title}</h3>
                  {h.text ? <p>{h.text}</p> : null}
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------- Featured menu ---------- */}
      {featured.length ? (
        <section className="section featured">
          <div className="container">
            <div className="featured-head">
              <div className="section-head">
                <Reveal>
                  <span className="eyebrow">Favourites</span>
                </Reveal>
                <Reveal delay={100}>
                  <h2>{page?.menuHeading || 'From the counter'}</h2>
                </Reveal>
                {page?.menuText ? (
                  <Reveal delay={180}>
                    <p>{page.menuText}</p>
                  </Reveal>
                ) : null}
              </div>
              <Reveal delay={200}>
                <Link href="/menu" className="btn btn-ghost">
                  Full menu <span className="arrow">→</span>
                </Link>
              </Reveal>
            </div>
            <div className="cards">
              {featured.map((item, i) => (
                <Reveal key={item._id} as="article" className="card" delay={(i % 3) * 120}>
                  <FeaturedCard item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Gallery ---------- */}
      {page?.gallery?.length ? <Gallery images={page.gallery} /> : null}

      {/* ---------- Visit ---------- */}
      <section className="section visit" id="visit">
        <div className="container">
          <div className="visit-grid">
            <Reveal variant="left" className="visit-card">
              <div style={{ display: 'grid', gap: 16 }}>
                <span className="eyebrow">Visit us</span>
                <h2>{page?.visitHeading || 'Come say hello'}</h2>
                {page?.visitText ? <p className="lead">{page.visitText}</p> : null}
              </div>
              {settings?.hours?.length ? (
                <table className="hours">
                  <tbody>
                    {settings.hours.map((h) => (
                      <tr key={h._key}>
                        <td>{h.days}</td>
                        <td>{h.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {settings?.address ? <p className="address">{settings.address}</p> : null}
              <div className="visit-actions">
                <a className="btn btn-primary" href={mapsLink(settings?.mapQuery)} target="_blank" rel="noopener noreferrer">
                  Get directions <span className="arrow">→</span>
                </a>
                {settings?.phone ? (
                  <a className="btn btn-ghost" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                    Call us
                  </a>
                ) : settings?.instagram ? (
                  <a className="btn btn-ghost" href={settings.instagram} target="_blank" rel="noopener noreferrer">
                    Message us
                  </a>
                ) : null}
              </div>
            </Reveal>
            <Reveal variant="right" delay={150} className="map">
              <iframe
                title={`Map showing ${settings?.name || 'Honey & Haven'}`}
                src={mapsEmbed(settings?.mapQuery)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

function Marquee({ items }: { items: string[] }) {
  const group = (hidden?: boolean) => (
    <div className="marquee-group" aria-hidden={hidden || undefined}>
      {[...items, ...items].map((t, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="marquee-item">{t}</span>
          <HexMark className="marquee-dot" />
        </span>
      ))}
    </div>
  )
  return (
    <div className="marquee" role="presentation">
      <div className="marquee-track">
        {group()}
        {group(true)}
      </div>
    </div>
  )
}

function FeaturedCard({ item }: { item: MenuItem }) {
  return (
    <>
      <div className="card-media">
        {item.image?.asset ? (
          <SanityImg image={item.image} width={640} height={480} sizes="(max-width: 700px) 100vw, 33vw" alt={item.image.alt || item.name} />
        ) : (
          <div className="card-placeholder">
            <HexMark />
          </div>
        )}
      </div>
      <div className="card-body">
        {item.category ? <span className="card-cat">{item.category}</span> : null}
        <div className="card-title">
          <h3>{item.name}</h3>
          <span className="price">{formatPrice(item.price, item.priceNote)}</span>
        </div>
        {item.description ? <p>{item.description}</p> : null}
        {item.dietary?.length ? (
          <div className="tags">
            {item.dietary.map((d) => (
              <span key={d} className="tag" title={DIETARY_LABELS[d]?.long}>
                {DIETARY_LABELS[d]?.short ?? d}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}

function Gallery({ images }: { images: SanityImage[] }) {
  const cols: SanityImage[][] = [[], [], []]
  images.forEach((img, i) => cols[i % 3].push(img))
  const ratios = ['4 / 5', '1 / 1', '3 / 4', '5 / 6']
  const speeds = ['0.04', '-0.06', '0.08']
  return (
    <section className="section gallery">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Inside the haven</span>
          </Reveal>
          <Reveal delay={100}>
            <h2>Slow mornings, warm cups</h2>
          </Reveal>
        </div>
        <div className="gallery-grid">
          {cols.map((col, c) => (
            <div className="gallery-col" key={c} data-parallax={speeds[c]}>
              {col.map((img, i) => (
                <Reveal key={img._key || i} variant="zoom" delay={c * 120} className="gallery-item">
                  <SanityImg
                    image={img}
                    width={700}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    style={{ ['--ar' as string]: ratios[(c + i) % ratios.length] }}
                  />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

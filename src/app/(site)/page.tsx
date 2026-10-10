import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { HomeData, SanityImage, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { DIETARY_LABELS, formatPrice, mapsEmbed, mapsLink, paragraphs } from '@/lib/format'
import { SanityImg, imgProps } from '@/components/SanityImg'
import { HeroMotion } from '@/components/HeroMotion'
import { MenuBoard, type BoardItem } from '@/components/MenuBoard'
import { ArrowRight, Clock, HexMark, Pin, Video } from '@/components/Icons'
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
  const addressLines = (settings?.address || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const firstHours = settings?.hours?.[0]

  const board: BoardItem[] = featured.map((item) => ({
    id: item._id,
    name: item.name,
    price: formatPrice(item.price, item.priceNote),
    description: item.description,
    tags: (item.dietary ?? []).map((d) => DIETARY_LABELS[d] ?? { short: d, long: d }),
    image: imgProps(item.image, 720, 720, '(max-width: 860px) 100vw, 45vw', item.image?.alt || item.name),
  }))

  return (
    <>
      <HeroMotion image={imgProps(page?.heroImage, 1920, 1280, '100vw')} heading={heading}>
        <div className="hero-copy">
          {page?.heroText ? <p className="hero-text">{page.heroText}</p> : null}
          <ul className="hero-facts">
            {addressLines.length ? (
              <li>
                <Pin />
                <span>{addressLines.slice(0, 2).join(', ')}</span>
              </li>
            ) : null}
            {firstHours ? (
              <li>
                <Clock />
                <span>
                  {firstHours.days} {firstHours.hours}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
        <div className="hero-actions">
          <Link href="/menu" className="btn btn-light">
            See the menu <ArrowRight />
          </Link>
          <a href={mapsLink(settings?.mapQuery)} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </div>
      </HeroMotion>

      {/* ---------- Story ---------- */}
      <section className="section story" id="story">
        <div className="container story-grid">
          <div className="story-media">
            <SanityImg image={page?.storyImage} width={900} height={1125} sizes="(max-width: 860px) 100vw, 45vw" />
          </div>
          <div className="story-copy">
            {page?.storyHeading ? <h2>{page.storyHeading}</h2> : null}
            {paragraphs(page?.storyText).map((p, i) => (
              <p key={i} className="body-text">
                {p}
              </p>
            ))}
            {page?.highlights?.length ? (
              <ul className="highlights">
                {page.highlights.map((h) => (
                  <li key={h._key}>
                    <HexMark className="highlight-mark" />
                    <span>
                      <strong>{h.title}.</strong> {h.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/menu" className="text-link">
              Explore the menu <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Menu board ---------- */}
      {board.length ? (
        <section className="section counter" id="favourites">
          <div className="container">
            <div className="counter-head">
              <div className="counter-intro">
                <h2>{page?.menuHeading || 'From the counter'}</h2>
                {page?.menuText ? <p>{page.menuText}</p> : null}
              </div>
              <Link href="/menu" className="text-link text-link-light">
                See the full menu <ArrowRight />
              </Link>
            </div>
            <MenuBoard items={board} />
          </div>
        </section>
      ) : null}

      {/* ---------- Gallery ---------- */}
      {page?.gallery?.length ? <Gallery heading={page.galleryHeading} images={page.gallery} /> : null}

      {/* ---------- Visit ---------- */}
      <section className="section visit" id="visit">
        <div className="container visit-grid">
          <div className="visit-card">
            <h2>{page?.visitHeading || 'Come say hello'}</h2>
            {page?.visitText ? <p className="body-text">{page.visitText}</p> : null}
            {settings?.hours?.length ? (
              <table className="hours">
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {settings.hours.map((h) => (
                    <tr key={h._key}>
                      <th scope="row">{h.days}</th>
                      <td>{h.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {settings?.address ? <address className="address">{settings.address}</address> : null}
            <div className="visit-actions">
              <a className="btn btn-primary" href={mapsLink(settings?.mapQuery)} target="_blank" rel="noopener noreferrer">
                Get directions <ArrowRight />
              </a>
              {settings?.phone ? (
                <a className="btn btn-ghost" href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                  Call us
                </a>
              ) : null}
              {settings?.tiktok ? (
                <a className="btn btn-ghost" href={settings.tiktok} target="_blank" rel="noopener noreferrer">
                  <Video /> Watch on TikTok
                </a>
              ) : null}
            </div>
          </div>
          <div className="map">
            <iframe
              title={`Map showing ${settings?.name || 'Honey & Haven'}`}
              src={mapsEmbed(settings?.mapQuery)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  )
}

function Gallery({ heading, images }: { heading?: string; images: SanityImage[] }) {
  const ratios = ['4 / 5', '1 / 1', '3 / 4', '5 / 6']
  return (
    <section className="section gallery">
      <div className="container">
        <h2 className="section-title">{heading || 'Slow mornings, warm cups'}</h2>
        <div className="gallery-grid">
          {images.map((img, i) => (
            <figure key={img._key || i} className="gallery-item" style={{ ['--ar' as string]: ratios[i % ratios.length] }}>
              <SanityImg image={img} width={720} sizes="(max-width: 640px) 50vw, 33vw" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

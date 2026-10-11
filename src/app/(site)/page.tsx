import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { HomeData, Product, SanityImage, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { DIETARY_LABELS, formatPrice, mapsEmbed, mapsLink, paragraphs } from '@/lib/format'
import { SanityImg, imgProps } from '@/components/SanityImg'
import { HeroScroll } from '@/components/hero/HeroScroll'
import { LogoMark } from '@/components/LogoMark'
import { MenuBoard, type BoardItem } from '@/components/MenuBoard'
import { ArrowRight, ArrowUpRight, Camera, Clock, HexMark, Pin, Video } from '@/components/Icons'
import { FALLBACK_HOME, FALLBACK_PRODUCTS, FALLBACK_SETTINGS } from '@/lib/fallback'
import { isConfigured } from '@/sanity/env'
import { getShopSettings } from '@/lib/shop'
import { toCard, type ProductCardView } from '@/lib/productView'
import { formatDays, specialText, specialToday, upcomingSpecialHours } from '@/lib/hours'
import { Img } from '@/components/Img'
import { QuickAdd } from '@/components/shop/QuickAdd'

async function getData() {
  const [settings, data, shopSettings] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), sanityFetch<HomeData>(HOME_QUERY), getShopSettings()])
  const page = data?.page ?? FALLBACK_HOME.page
  // Until the café publishes its own home page, show the starter favourites too
  const featured = data?.featured?.length ? data.featured : data?.page ? [] : FALLBACK_HOME.featured
  // Pinned products (example products only before the Studio is connected)
  const pinned: Product[] = isConfigured ? (data?.shop ?? []) : FALLBACK_PRODUCTS.filter((p) => p.featured)
  const shop = pinned.map((p, i) => toCard(p, shopSettings.lowStockAt, i, '(max-width: 520px) 100vw, 22vw'))
  return { settings: settings ?? FALLBACK_SETTINGS, page, featured, shop }
}

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const { settings, page } = await getData()
  return buildMetadata(settings, page?.seo)
}

export default async function HomePage() {
  const { settings, page, featured, shop } = await getData()
  const heading = page?.heroHeading || settings?.name || 'Honey & Haven'
  const addressLines = (settings?.address || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const firstHours = settings?.hours?.[0]
  const today = specialToday(settings?.specialHours)
  const upcoming = upcomingSpecialHours(settings?.specialHours)

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
      <HeroScroll
        heading={heading}
        text={page?.heroText}
        steps={page?.heroSteps ?? []}
        fallbackImage={imgProps(page?.heroImage, 1440, 1200, '55vw')}
      >
        <ul className="hero-facts">
          {addressLines.length ? (
            <li>
              <Pin />
              <span>{addressLines.slice(0, 2).join(', ')}</span>
            </li>
          ) : null}
          {today ? (
            <li className="hero-fact-special">
              <Clock />
              <span>
                Today ({today.label}): {specialText(today)}
              </span>
            </li>
          ) : firstHours ? (
            <li>
              <Clock />
              <span>
                {firstHours.days} {firstHours.hours}
              </span>
            </li>
          ) : null}
        </ul>
        <div className="hero-actions">
          <Link href="/menu" className="btn btn-primary">
            See the menu <ArrowRight />
          </Link>
          <a href={mapsLink(settings?.mapQuery)} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </div>
      </HeroScroll>

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

      {/* ---------- Shop ---------- */}
      {shop.length ? <Shop heading={page?.shopHeading} text={page?.shopText} items={shop} /> : null}

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
            {upcoming.length ? (
              <div className="special-hours">
                <h3>Holiday hours</h3>
                <table className="hours">
                  <caption className="sr-only">Holiday and special opening hours</caption>
                  <tbody>
                    {upcoming.map((h) => (
                      <tr key={h._key}>
                        <th scope="row">
                          {h.label}
                          <small>{formatDays(h)}</small>
                        </th>
                        <td>{specialText(h)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {settings?.hoursNote ? <p className="hours-note">{settings.hoursNote}</p> : null}
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
              {settings?.instagram ? (
                <a className="btn btn-ghost" href={settings.instagram} target="_blank" rel="noopener noreferrer">
                  <Camera /> Instagram
                </a>
              ) : null}
              {settings?.tiktok ? (
                <a className="btn btn-ghost" href={settings.tiktok} target="_blank" rel="noopener noreferrer">
                  <Video /> TikTok
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

function Shop({ heading, text, items }: { heading?: string; text?: string; items: ProductCardView[] }) {
  return (
    <section className="section shop" id="shop">
      <div className="container">
        <div className="shop-head">
          <div className="shop-head-copy">
            <h2>{heading || 'Take a little haven home'}</h2>
            {text ? <p className="body-text">{text}</p> : null}
          </div>
          <Link href="/shop" className="btn btn-ghost">
            Visit the shop <ArrowRight />
          </Link>
        </div>
        <ul className="shop-grid">
          {items.map((item) => (
            <li key={item.id} className="shop-item" data-soldout={item.soldOut || undefined}>
              <div className="shop-media" data-tone={item.tone}>
                {item.image ? (
                  <Img img={item.image} />
                ) : (
                  <div className="shop-mark">
                    <LogoMark />
                  </div>
                )}
                {item.badge ? <span className="pcard-badge" data-kind={item.soldOut ? 'out' : item.badge === 'Sale' ? 'sale' : 'low'}>{item.badge}</span> : null}
              </div>
              <div className="shop-body">
                <div className="shop-line">
                  <h3>
                    <Link href={`/shop/${item.slug}`} className="pcard-link">
                      {item.name}
                    </Link>
                  </h3>
                  <span className="price">
                    {item.price}
                    {item.was ? (
                      <s>
                        <span className="sr-only">was </span>
                        {item.was}
                      </s>
                    ) : null}
                  </span>
                </div>
                {item.summary ? <p>{item.summary}</p> : null}
                <div className="shop-actions">
                  {item.quickAdd ? <QuickAdd item={item.quickAdd} label="Add to basket" /> : null}
                  <span className="shop-more" aria-hidden="true">
                    {item.soldOut ? 'Sold out' : item.quickAdd ? 'Details' : 'Choose options'} <ArrowUpRight />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

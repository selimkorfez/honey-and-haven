import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { MENU_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { MenuData, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { DIETARY_LABELS, formatPrice, sectionId } from '@/lib/format'
import { SanityImg } from '@/components/SanityImg'
import { FALLBACK_MENU, FALLBACK_SETTINGS } from '@/lib/fallback'

async function getMenu(): Promise<MenuData> {
  const data = await sanityFetch<MenuData>(MENU_QUERY)
  // Show the starter menu until the café has added its own
  if (!data || (!data.page && !data.categories?.length)) return FALLBACK_MENU
  return data
}

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [settings, data] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getMenu()])
  return buildMetadata(settings ?? FALLBACK_SETTINGS, data.page?.seo, 'Menu')
}

const slug = sectionId

export default async function MenuPage() {
  const data = await getMenu()
  const categories = data.categories ?? []
  const page = data.page
  const milks = page?.milks?.filter((m) => m.name) ?? []
  const milkLine = milks.length && categories.some((c) => c.showMilks)
  const usedTags = new Set([
    ...categories.flatMap((c) => c.items.flatMap((i) => i.dietary ?? [])),
    ...(milkLine ? milks.flatMap((m) => m.dietary ?? []) : []),
  ])

  return (
    <>
      <section className="menu-hero">
        <div className="container">
          <h1>{page?.heading || 'Our menu'}</h1>
          {page?.intro ? <p>{page.intro}</p> : null}
        </div>
      </section>

      {categories.length > 1 ? (
        <nav className="menu-nav" aria-label="Menu categories">
          <ul>
            {categories.map((c) => (
              <li key={c._id}>
                <a href={`#${slug(c.title)}`}>{c.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {page?.drinksNote ? <p className="menu-note">{page.drinksNote}</p> : null}

      <div className="container">
        {categories.length === 0 ? <p className="empty">Our menu is being updated. Pop in to see what&rsquo;s on today.</p> : null}

        {categories.map((cat) => (
          <section key={cat._id} id={slug(cat.title)} className="menu-section">
            <div className="menu-section-head">
              <h2>{cat.title}</h2>
              {cat.description ? <p>{cat.description}</p> : null}
              {cat.showMilks && milks.length ? (
                <div className="milk-swap">
                  <em>{page?.milkLabel || 'Swap your milk:'}</em>
                  <ul>
                    {milks.map((m) => (
                      <li key={m._key}>
                        {m.name}
                        {m.dietary?.map((d) => (
                          <span key={d} className="tag" title={DIETARY_LABELS[d]?.long}>
                            {DIETARY_LABELS[d]?.short ?? d}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <ul className="menu-list">
              {cat.items.map((item) => (
                <li key={item._id} className={`menu-item${item.image?.asset ? '' : ' no-image'}`} data-soon={item.comingSoon || undefined}>
                  {item.image?.asset ? (
                    <div className="menu-thumb">
                      {/* the item's name is right next to it, so the photo only needs its own description (if any) */}
                      <SanityImg image={item.image} width={160} height={160} sizes="80px" alt={item.image.alt && item.image.alt !== item.name ? item.image.alt : ''} />
                    </div>
                  ) : null}
                  <div>
                    <div className="menu-line">
                      <h3>
                        {item.name}
                        {item.comingSoon ? <span className="tag tag-soon">Coming soon</span> : null}
                      </h3>
                      {formatPrice(item.price, item.priceNote) ? (
                        <>
                          <span className="dots" aria-hidden="true" />
                          <span className="price">{formatPrice(item.price, item.priceNote)}</span>
                        </>
                      ) : null}
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
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="container menu-footer">
        {usedTags.size ? (
          <div className="legend">
            {[...usedTags].map((t) => (
              <span key={t}>
                <strong>{DIETARY_LABELS[t]?.short ?? t}</strong> {DIETARY_LABELS[t]?.long}
              </span>
            ))}
          </div>
        ) : null}
        {page?.footnote ? <p style={{ maxWidth: 560 }}>{page.footnote}</p> : null}
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_SETTINGS } from '@/lib/fallback'
import { toCard } from '@/lib/productView'
import { toCheckoutConfig } from '@/lib/shop'
import { gbp } from '@/lib/money'
import { SanityImg } from '@/components/SanityImg'
import { ShopGrid } from '@/components/shop/ShopGrid'
import { Store, Truck } from '@/components/Icons'
import { getShop } from './data'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [settings, shop] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getShop()])
  return buildMetadata(settings ?? FALLBACK_SETTINGS, shop.settings.seo, 'Shop')
}

export default async function ShopPage() {
  const { settings, categories, products } = await getShop()
  const cfg = toCheckoutConfig(settings)
  const cards = products.map((p, i) => toCard(p, settings.lowStockAt, i))

  return (
    <>
      <section className="shop-hero">
        <div className="container shop-hero-inner" data-has-image={settings.bannerImage?.asset ? true : undefined}>
          <div className="shop-hero-copy">
            <h1>{settings.heading}</h1>
            {settings.intro ? <p>{settings.intro}</p> : null}
            <ul className="shop-perks">
              {settings.collectionEnabled ? (
                <li>
                  <Store /> Free collection on The Parade
                </li>
              ) : null}
              {settings.deliveryEnabled ? (
                <li>
                  <Truck />
                  {typeof settings.freeDeliveryOver === 'number' && settings.freeDeliveryOver > 0
                    ? `UK delivery, free over ${gbp(settings.freeDeliveryOver)}`
                    : `UK delivery ${gbp(settings.deliveryFee)}`}
                </li>
              ) : null}
            </ul>
          </div>
          {settings.bannerImage?.asset ? (
            <div className="shop-hero-media">
              <SanityImg image={settings.bannerImage} width={900} height={700} sizes="(max-width: 860px) 100vw, 45vw" priority />
            </div>
          ) : null}
        </div>
      </section>

      <section className="shop-list">
        <div className="container">
          {!cfg.ordersOpen ? <p className="shop-closed">{settings.closedMessage}</p> : null}
          {cards.length ? (
            <ShopGrid products={cards} categories={categories} />
          ) : (
            <p className="empty">New things are on their way. Pop into the café to see what&rsquo;s in.</p>
          )}
        </div>
      </section>
    </>
  )
}

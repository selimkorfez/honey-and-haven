import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/client'
import { PRODUCT_SLUGS_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_PRODUCTS, FALLBACK_SETTINGS } from '@/lib/fallback'
import { imgProps } from '@/components/SanityImg'
import { thumbUrl, toCard } from '@/lib/productView'
import { getShopSettings, toCheckoutConfig } from '@/lib/shop'
import { gbp, productStock } from '@/lib/money'
import { siteUrl } from '@/lib/format'
import { isConfigured } from '@/sanity/env'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { AddToBasket } from '@/components/shop/AddToBasket'
import { ProductCard } from '@/components/shop/ProductCard'
import { RichText } from '@/components/RichText'
import { ArrowRight, Store, Truck } from '@/components/Icons'
import { getProduct } from '../data'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = isConfigured ? ((await sanityFetch<string[]>(PRODUCT_SLUGS_QUERY)) ?? []) : FALLBACK_PRODUCTS.map((p) => p.slug)
  return slugs.map((slug) => ({ slug }))
}

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const [settings, { product }] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getProduct(slug)])
  const s = settings ?? FALLBACK_SETTINGS
  if (!product) return buildMetadata(s, null, 'Shop')
  return buildMetadata(s, {
    title: `${product.name} · ${s?.name || 'Honey & Haven'}`,
    description: product.summary || undefined,
    image: product.images?.[0],
  })
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params
  const [{ product, related }, settings] = await Promise.all([getProduct(slug), getShopSettings()])
  if (!product) notFound()

  const cfg = toCheckoutConfig(settings)
  const images = (product.images ?? []).map((img) => imgProps(img, 900, 900, '(max-width: 860px) 100vw, 50vw', img.alt || product.name)).filter((x) => x !== null)
  const thumbs = (product.images ?? []).map((img) => imgProps(img, 120, 120, '80px', '')).filter((x) => x !== null)
  const stock = productStock(product, settings.lowStockAt)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary || undefined,
    image: images[0]?.src,
    url: `${siteUrl()}/shop/${product.slug}`,
    brand: { '@type': 'Brand', name: 'Honey & Haven' },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'GBP',
      availability: stock.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `${siteUrl()}/shop/${product.slug}`,
    },
  }

  return (
    <>
      <nav className="container crumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        {product.category ? (
          <>
            <span aria-hidden="true">/</span>
            <span>{product.category}</span>
          </>
        ) : null}
      </nav>

      <section className="product">
        <div className="container product-grid">
          <ProductGallery images={images} thumbs={thumbs} name={product.name} />
          <div className="product-info">
            <h1>{product.name}</h1>
            {product.summary ? <p className="product-summary">{product.summary}</p> : null}
            <AddToBasket
              product={{
                id: product._id,
                slug: product.slug,
                name: product.name,
                image: thumbUrl(product),
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: product.stock,
                collectionOnly: Boolean(product.collectionOnly),
                optionName: product.optionName,
                variants: product.variants ?? [],
              }}
              lowAt={settings.lowStockAt}
              ordersOpen={cfg.ordersOpen}
              closedMessage={settings.closedMessage}
            />
            <ul className="product-fulfil">
              {settings.collectionEnabled ? (
                <li>
                  <Store />
                  <span>
                    <strong>Free collection</strong> {settings.collectionNote}
                  </span>
                </li>
              ) : null}
              {settings.deliveryEnabled && !product.collectionOnly ? (
                <li>
                  <Truck />
                  <span>
                    <strong>
                      UK delivery {gbp(settings.deliveryFee)}
                      {typeof settings.freeDeliveryOver === 'number' && settings.freeDeliveryOver > 0 ? `, free over ${gbp(settings.freeDeliveryOver)}` : ''}
                    </strong>{' '}
                    {settings.deliveryNote}
                  </span>
                </li>
              ) : null}
              {product.collectionOnly ? (
                <li>
                  <Store />
                  <span>
                    <strong>Collection only.</strong> This one can’t be posted.
                  </span>
                </li>
              ) : null}
            </ul>
            <RichText value={product.description} className="rich product-desc" />
            <Link href="/info/delivery-and-returns" className="text-link">
              Delivery &amp; returns <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="section related">
          <div className="container">
            <div className="related-head">
              <h2>You might also like</h2>
              <Link href="/shop" className="text-link">
                Everything in the shop <ArrowRight />
              </Link>
            </div>
            <ul className="pgrid">
              {related.map((p, i) => (
                <li key={p._id}>
                  <ProductCard p={toCard(p, settings.lowStockAt, i + 1)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}

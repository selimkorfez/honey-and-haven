import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { PRODUCT_QUERY, SHOP_QUERY } from '@/sanity/lib/queries'
import { FALLBACK_PRODUCTS } from '@/lib/fallback'
import { withShopDefaults } from '@/lib/shop'
import type { Product, ShopSettings } from '@/lib/types'

/** Example products only appear before the Studio is connected. */
export async function getShop() {
  const data = await sanityFetch<{ settings: Partial<ShopSettings> | null; categories: string[]; products: Product[] }>(SHOP_QUERY)
  const settings = withShopDefaults(data?.settings)
  if (!isConfigured) {
    const categories = [...new Set(FALLBACK_PRODUCTS.map((p) => p.category).filter(Boolean))] as string[]
    return { settings, categories, products: FALLBACK_PRODUCTS }
  }
  return { settings, categories: data?.categories ?? [], products: data?.products ?? [] }
}

export async function getProduct(slug: string) {
  if (!isConfigured) {
    const product = FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null
    return { product, related: FALLBACK_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 3) }
  }
  const data = await sanityFetch<{ product: Product | null; related: Product[] }>(PRODUCT_QUERY, { slug })
  return { product: data?.product ?? null, related: data?.related ?? [] }
}

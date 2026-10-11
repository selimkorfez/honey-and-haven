import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/format'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { INFO_SLUGS_QUERY, PRODUCT_SLUGS_QUERY } from '@/sanity/lib/queries'
import { FALLBACK_INFO_PAGES, FALLBACK_PRODUCTS } from '@/lib/fallback'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [products, info] = isConfigured
    ? await Promise.all([sanityFetch<string[]>(PRODUCT_SLUGS_QUERY), sanityFetch<string[]>(INFO_SLUGS_QUERY)])
    : [FALLBACK_PRODUCTS.map((p) => p.slug), []]
  const infoSlugs = new Set([...FALLBACK_INFO_PAGES.map((p) => p.slug), ...(info ?? [])])
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/menu`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/shop`, changeFrequency: 'weekly', priority: 0.8 },
    ...(products ?? []).map((slug) => ({ url: `${base}/shop/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...[...infoSlugs].map((slug) => ({ url: `${base}/info/${slug}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ]
}

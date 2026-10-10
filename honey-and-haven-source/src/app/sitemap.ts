import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/format'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/menu`, changeFrequency: 'weekly', priority: 0.8 },
  ]
}

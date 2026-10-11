import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/format'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/api/', '/shop/thank-you'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}

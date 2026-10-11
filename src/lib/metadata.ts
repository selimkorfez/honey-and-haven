import type { Metadata } from 'next'
import { urlFor } from '@/sanity/lib/image'
import type { Seo, Settings } from './types'

export function buildMetadata(settings: Settings, pageSeo: Seo | undefined, fallbackTitle?: string): Metadata {
  const name = settings?.name || 'Honey & Haven'
  const title = pageSeo?.title || (fallbackTitle ? `${fallbackTitle} · ${name}` : settings?.seo?.title || name)
  const description = pageSeo?.description || settings?.seo?.description || undefined
  const image = pageSeo?.image?.asset ? pageSeo.image : settings?.seo?.image
  const ogImage = image?.asset
    ? image.asset._id === 'fallback'
      ? `${image.asset.url}?w=1200&h=630&fit=crop&auto=format`
      : urlFor(image).width(1200).height(630).url()
    : undefined

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      siteName: name,
      type: 'website',
      locale: 'en_GB',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: ogImage ? 'summary_large_image' : 'summary', title, description, images: ogImage ? [ogImage] : undefined },
    robots: pageSeo?.noIndex ? { index: false, follow: true } : undefined,
  }
}

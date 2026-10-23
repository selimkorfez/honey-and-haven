'use client'

import dynamic from 'next/dynamic'
import type { NewsletterSettings } from '@/lib/types'

/**
 * The newsletter pop-up only appears after a visitor has been reading for a while, so its code
 * is fetched after the page has loaded instead of with the first download.
 */
const NewsletterPopup = dynamic(() => import('./NewsletterPopup').then((mod) => mod.NewsletterPopup), { ssr: false })

export function NewsletterPopupLoader({ settings }: { settings: NewsletterSettings }) {
  return <NewsletterPopup settings={settings} />
}

import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'
import { sanityFetch } from '@/sanity/lib/client'
import { SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { siteUrl } from '@/lib/format'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScrollFX } from '@/components/ScrollFX'
import { MotionProvider } from '@/components/MotionProvider'
import { FALLBACK_SETTINGS } from '@/lib/fallback'

const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', axes: ['SOFT', 'opsz'], style: ['normal', 'italic'] })
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export const revalidate = 60

export const viewport: Viewport = { themeColor: '#f4ece0' }

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await sanityFetch<Settings>(SETTINGS_QUERY)) ?? FALLBACK_SETTINGS
  return {
    metadataBase: new URL(siteUrl()),
    ...buildMetadata(settings, null),
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = (await sanityFetch<Settings>(SETTINGS_QUERY)) ?? FALLBACK_SETTINGS
  const name = settings?.name || 'Honey & Haven'

  // Tells Google this is a local café (helps with Maps & local search)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name,
    url: siteUrl(),
    description: settings?.seo?.description,
    telephone: settings?.phone || undefined,
    email: settings?.email || undefined,
    address: settings?.address
      ? { '@type': 'PostalAddress', streetAddress: settings.address.replace(/\n/g, ', '), addressCountry: 'GB' }
      : undefined,
    servesCuisine: ['Coffee', 'Cafe'],
    hasMenu: `${siteUrl()}/menu`,
    sameAs: [settings?.instagram, settings?.tiktok, settings?.facebook].filter(Boolean),
  }

  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <MotionProvider>
          <Header name={name} announcement={settings?.announcement} />
          <main>{children}</main>
          <Footer settings={settings} />
        </MotionProvider>
        <ScrollFX />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  )
}

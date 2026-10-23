import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'
import { sanityFetch } from '@/sanity/lib/client'
import { SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { announcementHref, mapsLink, siteUrl } from '@/lib/format'
import { activeSeason } from '@/lib/seasons'
import { Header } from '@/components/Header'
import { THEME_SCRIPT } from '@/components/ThemeSwitch'
import { Footer } from '@/components/Footer'
import { ScrollFX } from '@/components/ScrollFX'
import { MotionProvider } from '@/components/MotionProvider'
import { FALLBACK_SETTINGS } from '@/lib/fallback'
import { isConfigured } from '@/sanity/env'
import { getShopSettings, toCheckoutConfig } from '@/lib/shop'
import { BasketProvider } from '@/components/shop/BasketProvider'
import { BeeWidget } from '@/components/bee/BeeWidget'
import { draftMode } from 'next/headers'
import { PreviewBridgeLazy } from '@/components/preview/PreviewBridgeLazy'
import { newsletterSettings } from '@/lib/newsletter'
import { brevoConfigured } from '@/lib/brevo'
import { NewsletterBand } from '@/components/newsletter/NewsletterBand'
import { NewsletterPopupLoader } from '@/components/newsletter/NewsletterPopupLoader'
import { WordmarkSprite } from '@/components/Wordmark'

const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', axes: ['opsz'], style: 'normal' })
// The italic is only used in a few notes (mostly on the menu page), so it isn't preloaded on every page:
// it shares the "Fraunces" family name, so the browser fetches it only where italic text appears.
const serifItalic = Fraunces({ subsets: ['latin'], variable: '--font-serif-italic', axes: ['opsz'], style: 'italic', preload: false })
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export const revalidate = 60

export const viewport: Viewport = {
  // a single theme-color, kept in step with the light switch (see THEME_SCRIPT)
  themeColor: '#f3eadf',
  colorScheme: 'light dark',
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await sanityFetch<Settings>(SETTINGS_QUERY)) ?? FALLBACK_SETTINGS
  return {
    metadataBase: new URL(siteUrl()),
    ...buildMetadata(settings, null),
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settingsData, shopSettings] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getShopSettings()])
  const settings = settingsData ?? FALLBACK_SETTINGS
  const name = settings?.name || 'Honey & Haven'
  const checkout = toCheckoutConfig(shopSettings)
  const preview = (await draftMode()).isEnabled
  // The blog shows in the menu once there's at least one published post (the example post before the Studio is connected)
  const hasBlog = isConfigured ? Boolean(settingsData?.hasBlog) : true
  // Newsletter signup: live once Brevo is connected; always visible in the Studio's Preview so the wording can be checked
  const letter = newsletterSettings(settings)
  const showLetter = letter.enabled && (brevoConfigured() || preview)

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
    // Holiday closures, so Google shows the right hours
    specialOpeningHoursSpecification: (settings?.specialHours ?? [])
      .filter((s) => s.closed && s.date)
      .map((s) => ({ '@type': 'OpeningHoursSpecification', validFrom: s.date, validThrough: s.endDate || s.date, opens: '00:00', closes: '00:00' })),
  }

  return (
    // suppressHydrationWarning: the theme script sets data-theme on <html> before React loads
    <html lang="en-GB" className={`${serif.variable} ${serifItalic.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        {/* Sets light/dark before anything paints. First thing in <body> rather than in <head>: a script
            React draws inside <head> sometimes threw a hydration error (#418) on page load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <WordmarkSprite />
        <MotionProvider>
          <BasketProvider config={checkout}>
            <Header
              name={name}
              announcement={settings?.announcement}
              announcementHref={announcementHref(settings?.announcementLink)}
              directions={mapsLink(settings?.mapQuery)}
              hasBlog={hasBlog}
              season={activeSeason(settings?.season, settings?.announcement)}
            />
            <main>{children}</main>
            {showLetter ? <NewsletterBand settings={letter} /> : null}
            <Footer settings={settings} />
            {settings?.beeEnabled !== false ? <BeeWidget greeting={settings?.beeGreeting} picks={settings?.beePicks ?? []} /> : null}
            {showLetter && letter.popup ? <NewsletterPopupLoader settings={letter} /> : null}
          </BasketProvider>
        </MotionProvider>
        <ScrollFX />
        {preview ? <PreviewBridgeLazy /> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  )
}

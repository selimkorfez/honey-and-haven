import Link from 'next/link'
import type { Settings } from '@/lib/types'
import { mapsLink } from '@/lib/format'
import { ArrowUpRight } from './Icons'
import { Wordmark } from './Wordmark'
import { FALLBACK_SETTINGS } from '@/lib/fallback'

export function Footer({ settings }: { settings: Settings }) {
  const name = settings?.name || 'Honey & Haven'
  const socials = [
    { label: 'Instagram', href: settings?.instagram },
    { label: 'TikTok', href: settings?.tiktok },
    { label: 'Facebook', href: settings?.facebook },
  ].filter((s) => s.href)

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-big" aria-hidden="true">
          <Wordmark className="footer-wordmark" />
        </div>
        <div className="footer-grid">
          <div>
            <h3>{name}</h3>
            <p>{settings?.tagline}</p>
          </div>
          <div>
            <h3>Find us</h3>
            {settings?.address ? (
              <address>
                <a href={mapsLink(settings.mapQuery)} target="_blank" rel="noopener noreferrer">
                  {settings.address}
                </a>
              </address>
            ) : null}
            {settings?.phone ? (
              <p>
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
              </p>
            ) : null}
            {settings?.email ? (
              <p>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            ) : null}
          </div>
          <div>
            <h3>Hours</h3>
            <ul>
              {settings?.hours?.map((h) => (
                <li key={h._key}>
                  {h.days}: <span className="price">{h.hours}</span>
                </li>
              ))}
            </ul>
            {settings?.hoursNote ? <p className="footer-note">{settings.hoursNote}</p> : null}
          </div>
          <div>
            <h3>Follow</h3>
            <ul>
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} <ArrowUpRight />
                  </a>
                </li>
              ))}
              <li>
                <Link href="/menu">Our menu</Link>
              </li>
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li>
                <Link href="/about">About us</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <nav className="footer-links" aria-label="Information">
            {(settings?.infoPages?.length ? settings.infoPages : FALLBACK_SETTINGS.infoPages)?.map((p) => (
              <Link key={p.slug} href={`/info/${p.slug}`}>
                {p.title}
              </Link>
            ))}
            <Link href="/studio">Staff login</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

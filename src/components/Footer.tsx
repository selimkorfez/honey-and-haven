import Link from 'next/link'
import type { Settings } from '@/lib/types'
import { mapsLink } from '@/lib/format'
import { ArrowUpRight } from './Icons'

export function Footer({ settings }: { settings: Settings }) {
  const name = settings?.name || 'Honey & Haven'
  const [first, ...rest] = name.split('&')
  const socials = [
    { label: 'Instagram', href: settings?.instagram },
    { label: 'TikTok', href: settings?.tiktok },
    { label: 'Facebook', href: settings?.facebook },
  ].filter((s) => s.href)

  return (
    <footer className="site-footer">
      <div className="container">
        <p className="footer-big" aria-hidden="true">
          {rest.length ? (
            <>
              {first.trim()} <em>&amp;</em> {rest.join('&').trim()}
            </>
          ) : (
            name
          )}
        </p>
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
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <Link href="/studio">Staff login</Link>
        </div>
      </div>
    </footer>
  )
}

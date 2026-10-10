import Link from 'next/link'
import type { Settings } from '@/lib/types'
import { mapsLink } from '@/lib/format'

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
        <div className="footer-big reveal" data-reveal="up" aria-hidden="true">
          {rest.length ? (
            <>
              {first.trim()} <em>&amp;</em> {rest.join('&').trim()}
            </>
          ) : (
            name
          )}
        </div>
        <div className="footer-grid">
          <div>
            <h4>{name}</h4>
            <p>{settings?.tagline}</p>
          </div>
          <div>
            <h4>Find us</h4>
            {settings?.address ? (
              <p style={{ whiteSpace: 'pre-line' }}>
                <a href={mapsLink(settings.mapQuery)} target="_blank" rel="noopener noreferrer">
                  {settings.address}
                </a>
              </p>
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
            <h4>Hours</h4>
            <ul>
              {settings?.hours?.map((h) => (
                <li key={h._key}>
                  {h.days}: {h.hours}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
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

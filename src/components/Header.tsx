import Link from 'next/link'
import { LogoMark } from './LogoMark'
import { FoldingWordmark } from './Wordmark'
import { BasketButton } from './shop/BasketButton'
import { ThemeSwitch } from './ThemeSwitch'

/** "HONEY & HAVEN" folds into "HH" on scroll, then becomes the bee monogram. */
export function Header({
  name,
  announcement,
  announcementHref,
  hasBlog = false,
}: {
  name: string
  announcement?: string
  /** where the announcement goes when tapped (optional) */
  announcementHref?: string
  hasBlog?: boolean
}) {
  const external = announcementHref ? /^(https?:|mailto:|tel:)/.test(announcementHref) : false
  return (
    <header className="site-header">
      {announcement ? (
        <div className="announce">
          {announcementHref ? (
            external ? (
              <a href={announcementHref} target={announcementHref.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                {announcement} <span aria-hidden="true">→</span>
              </a>
            ) : (
              <Link href={announcementHref}>
                {announcement} <span aria-hidden="true">→</span>
              </Link>
            )
          ) : (
            announcement
          )}
        </div>
      ) : null}
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label={`${name} home`}>
          <FoldingWordmark />
          <LogoMark className="logo-mark" />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/menu">Menu</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          {hasBlog ? (
            <Link href="/blog" className="hide-sm">
              Blog
            </Link>
          ) : null}
          <Link href="/#visit" className="nav-cta hide-sm">
            Visit us
          </Link>
          <ThemeSwitch />
          <BasketButton />
        </nav>
      </div>
    </header>
  )
}

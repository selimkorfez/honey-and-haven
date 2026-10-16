import Link from 'next/link'
import { LogoMark } from './LogoMark'
import { FoldingWordmark } from './Wordmark'
import { BasketButton } from './shop/BasketButton'
import { ThemeSwitch } from './ThemeSwitch'

/** "HONEY & HAVEN" folds into "HH" on scroll, then becomes the bee monogram. */
export function Header({ name, announcement, hasBlog = false }: { name: string; announcement?: string; hasBlog?: boolean }) {
  return (
    <header className="site-header">
      {announcement ? <div className="announce">{announcement}</div> : null}
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

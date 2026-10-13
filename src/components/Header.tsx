import Link from 'next/link'
import { LogoMark } from './LogoMark'
import { FoldingWordmark } from './Wordmark'
import { BasketButton } from './shop/BasketButton'

/** "HONEY & HAVEN" folds into "HH" on scroll, then becomes the bee monogram. */
export function Header({ name, announcement }: { name: string; announcement?: string }) {
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
          <Link href="/#visit" className="nav-cta hide-sm">
            Visit us
          </Link>
          <BasketButton />
        </nav>
      </div>
    </header>
  )
}

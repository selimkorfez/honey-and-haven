import Link from 'next/link'
import { LogoMark } from './LogoMark'
import { BasketButton } from './shop/BasketButton'

export function Header({ name, announcement }: { name: string; announcement?: string }) {
  const [first, ...rest] = name.split('&')
  return (
    <header className="site-header">
      {announcement ? <div className="announce">{announcement}</div> : null}
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label={`${name} home`}>
          <LogoMark className="logo-mark" />
          <span>
            {rest.length ? (
              <>
                {first.trim()} <em>&amp;</em> {rest.join('&').trim()}
              </>
            ) : (
              name
            )}
          </span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/menu">Menu</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/#visit" className="nav-cta hide-sm">
            Visit us
          </Link>
          <BasketButton />
        </nav>
      </div>
    </header>
  )
}

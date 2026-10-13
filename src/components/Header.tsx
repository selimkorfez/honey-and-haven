import Link from 'next/link'
import { Fragment } from 'react'
import { LogoMark } from './LogoMark'
import { BasketButton } from './shop/BasketButton'

/**
 * Splits the café name into the letters that stay (initials and "&")
 * and the letters that fold away on scroll: "Honey & Haven" → "H&H" → bee monogram.
 */
function Wordmark({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  return (
    <span className="logo-word" aria-hidden="true">
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="lw-fold">
              <span>&nbsp;</span>
            </span>
          ) : null}
          {word === '&' ? (
            <em className="lw-amp">&amp;</em>
          ) : (
            <>
              <span className="lw-keep">{word[0]}</span>
              {word.length > 1 ? (
                <span className="lw-fold">
                  <span>{word.slice(1)}</span>
                </span>
              ) : null}
            </>
          )}
        </Fragment>
      ))}
    </span>
  )
}

export function Header({ name, announcement }: { name: string; announcement?: string }) {
  return (
    <header className="site-header">
      {announcement ? <div className="announce">{announcement}</div> : null}
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label={`${name} home`}>
          <Wordmark name={name} />
          <LogoMark className="logo-mark" />
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

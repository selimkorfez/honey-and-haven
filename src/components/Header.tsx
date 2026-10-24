import Link from 'next/link'
import { LogoMark } from './LogoMark'
import { HomeLink } from './HomeLink'
import { FoldingWordmark } from './Wordmark'
import { BasketButton } from './shop/BasketButton'
import { ThemeSwitch } from './ThemeSwitch'
import { MobileMenu } from './MobileMenu'
import { SeasonGarland } from './season/SeasonGarland'
import { SEASONS, barPattern, svgIcon, type ActiveSeason } from '@/lib/seasons'

/** "HONEY & HAVEN" folds into "HH" on scroll, then becomes the bee monogram. */
export function Header({
  name,
  announcement,
  announcementHref,
  directions,
  hasBlog = false,
  season,
}: {
  name: string
  announcement?: string
  /** where the announcement goes when tapped (optional) */
  announcementHref?: string
  /** Google Maps link for the phone menu's "Get directions" */
  directions?: string
  hasBlog?: boolean
  /** a seasonal theme switched on in the Studio (colours the top bar, adds the garland) */
  season?: ActiveSeason | null
}) {
  const look = season ? SEASONS[season.id] : null
  const message = season ? season.message : announcement
  const icon = look ? <i className="season-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgIcon(look.icon) }} /> : null
  // with a season on, the words sit between two little drawings
  const words = (text: React.ReactNode) =>
    look ? (
      <>
        {icon}
        <em className="announce-text">{text}</em>
        {icon}
      </>
    ) : (
      text
    )
  const external = announcementHref ? /^(https?:|mailto:|tel:)/.test(announcementHref) : false
  return (
    <header className="site-header">
      {message ? (
        <div
          className="announce"
          data-season={look?.id}
          data-bar={season?.barStyle}
          style={
            look
              ? ({
                  '--season-bar': look.bar,
                  '--season-text': look.text,
                  '--season-pattern': season?.barStyle === 'pattern' ? barPattern(look) : undefined,
                } as React.CSSProperties)
              : undefined
          }
        >
          {announcementHref ? (
            external ? (
              <a href={announcementHref} target={announcementHref.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                {words(
                  <>
                    {message} <span aria-hidden="true">→</span>
                  </>,
                )}
              </a>
            ) : (
              <Link href={announcementHref}>
                {words(
                  <>
                    {message} <span aria-hidden="true">→</span>
                  </>,
                )}
              </Link>
            )
          ) : (
            words(message)
          )}
        </div>
      ) : null}
      <div className="container header-inner">
        <HomeLink className="logo" label={`${name} home`}>
          <FoldingWordmark />
          <LogoMark className="logo-mark" />
        </HomeLink>
        <nav className="nav" aria-label="Main">
          {/* on phones these move into the side menu */}
          <Link href="/menu" className="nav-link">
            Menu
          </Link>
          <Link href="/shop" className="nav-link">
            Shop
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
          {hasBlog ? (
            <Link href="/blog" className="nav-link">
              Blog
            </Link>
          ) : null}
          <Link href="/#visit" className="nav-cta nav-link">
            Visit us
          </Link>
          <ThemeSwitch />
          <BasketButton />
          <MobileMenu hasBlog={hasBlog} directions={directions} />
        </nav>
      </div>
      {season && season.decoration !== 'ribbon' ? <SeasonGarland id={season.id} /> : null}
    </header>
  )
}

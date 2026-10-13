import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { ABOUT_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { AboutData, Settings, TeamMember } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_ABOUT, FALLBACK_SETTINGS } from '@/lib/fallback'
import { imgProps, SanityImg } from '@/components/SanityImg'
import { RichText } from '@/components/RichText'
import { Reveal } from '@/components/Reveal'
import { AboutHero } from '@/components/about/AboutHero'
import { BeeMark } from '@/components/bee/BeeMark'
import { ArrowRight, HexMark } from '@/components/Icons'
import { mapsLink } from '@/lib/format'

export const revalidate = 60

async function getData() {
  const [settings, page] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), sanityFetch<AboutData>(ABOUT_QUERY)])
  return { settings: settings ?? FALLBACK_SETTINGS, page: page ?? FALLBACK_ABOUT }
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings, page } = await getData()
  return buildMetadata(settings, page?.seo, 'About us')
}

/** Shown only before the Studio is connected, so the owners can see how the team section will look. */
const EXAMPLE_TEAM: TeamMember[] = [
  { _key: 'e1', name: 'Your name here', role: 'Owner', bio: 'Add each team member in the Studio with a photo, their role and a line about them.', favourite: 'Their go-to order' },
  { _key: 'e2', name: 'Your name here', role: 'Head barista', bio: 'Photos work best as portraits, taken in the café.', favourite: 'Their go-to order' },
  { _key: 'e3', name: 'Your name here', role: 'Barista', bio: 'Drag to reorder. Remove everyone to hide this section.', favourite: 'Their go-to order' },
]

export default async function AboutPage() {
  const { settings, page } = await getData()
  const heading = page?.heading || 'About us'
  const hero = imgProps(page?.heroImage ?? FALLBACK_ABOUT.heroImage, 1672, undefined, '100vw')
  const team = page?.team?.length ? page.team : isConfigured ? [] : EXAMPLE_TEAM
  const example = !page?.team?.length && !isConfigured

  return (
    <>
      <AboutHero heading={heading} intro={page?.intro} image={hero}>
        <div className="hero-actions">
          <Link href="/menu" className="btn btn-primary">
            See the menu <ArrowRight />
          </Link>
          <a href="#team" className="btn btn-ghost">
            Meet the team
          </a>
        </div>
      </AboutHero>

      {/* ---------- Story ---------- */}
      <section className="section about-story">
        <div className="container about-story-grid">
          <Reveal className="about-story-head">
            {page?.storyHeading ? <h2>{page.storyHeading}</h2> : null}
            <BeeMark className="about-story-bee" />
          </Reveal>
          <div className="about-story-body">
            <Reveal delay={0.1}>
              <RichText value={page?.story} className="rich about-rich" />
            </Reveal>
            {page?.storyImage?.asset ? (
              <Reveal className="about-story-media" delay={0.1}>
                <SanityImg image={page.storyImage} width={960} height={720} sizes="(max-width: 860px) 100vw, 50vw" />
              </Reveal>
            ) : null}
          </div>
        </div>
        {page?.values?.length ? (
          <div className="container">
            <ul className="about-values">
              {page.values.map((v, i) => (
                <Reveal as="li" key={v._key} delay={i * 0.1}>
                  <HexMark className="about-value-mark" />
                  <h3>{v.title}</h3>
                  {v.text ? <p>{v.text}</p> : null}
                </Reveal>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ---------- Team ---------- */}
      {team.length ? (
        <section className="section about-team" id="team">
          <div className="container">
            <Reveal className="about-team-head">
              <h2>{page?.teamHeading || 'The faces behind the counter'}</h2>
              {page?.teamIntro ? <p className="body-text">{page.teamIntro}</p> : null}
              {example ? <p className="about-team-example">Example cards: add your team in the Studio under About us page → Team.</p> : null}
            </Reveal>
            <ul className="team-grid" data-count={Math.min(team.length, 4)}>
              {team.map((m, i) => (
                <Reveal as="li" key={m._key} className="team-card" delay={(i % 4) * 0.12} y={48}>
                  <div className="team-photo" data-empty={!m.photo?.asset || undefined}>
                    {m.photo?.asset ? (
                      <SanityImg image={m.photo} width={640} height={800} sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 25vw" alt={m.photo.alt || m.name} />
                    ) : (
                      <BeeMark className="team-photo-bee" />
                    )}
                  </div>
                  <div className="team-body">
                    <h3>{m.name}</h3>
                    {m.role ? <p className="team-role">{m.role}</p> : null}
                    {m.bio ? <p className="team-bio">{m.bio}</p> : null}
                    {m.favourite ? (
                      <p className="team-fav">
                        <span>Go-to order</span> {m.favourite}
                      </p>
                    ) : null}
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ---------- Visit ---------- */}
      <section className="section about-cta">
        <Reveal className="container about-cta-inner">
          <BeeMark className="about-cta-bee" />
          <h2>Come and say hello</h2>
          {settings?.address ? <p>{settings.address.split('\n').join(', ')}</p> : null}
          <div className="hero-actions">
            <a className="btn btn-light" href={mapsLink(settings?.mapQuery)} target="_blank" rel="noopener noreferrer">
              Get directions <ArrowRight />
            </a>
            <Link className="btn btn-ghost" href="/#visit">
              Opening hours
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}

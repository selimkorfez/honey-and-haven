import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/client'
import { ABOUT_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { AboutData, Settings } from '@/lib/types'
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

export default async function AboutPage() {
  const { settings, page } = await getData()
  const heading = page?.heading || 'About us'
  const hero = imgProps(page?.heroImage ?? FALLBACK_ABOUT.heroImage, 1672, undefined, '100vw')

  return (
    <>
      <AboutHero heading={heading} intro={page?.intro} image={hero}>
        <div className="hero-actions">
          <Link href="/menu" className="btn btn-primary">
            See the menu <ArrowRight />
          </Link>
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

      {/* ---------- Visit ---------- */}
      <section className="section about-cta">
        <Reveal className="container about-cta-inner">
          <BeeMark className="about-cta-bee" />
          <h2>{page?.visitHeading || 'Come and say hello'}</h2>
          {page?.visitText ? (
            <p>{page.visitText}</p>
          ) : settings?.address ? (
            <p>{settings.address.split('\n').join(', ')}</p>
          ) : null}
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

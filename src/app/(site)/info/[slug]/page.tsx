import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { INFO_PAGE_QUERY, INFO_SLUGS_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { InfoPage, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_INFO_PAGES, FALLBACK_SETTINGS } from '@/lib/fallback'
import { RichText } from '@/components/RichText'

export const revalidate = 60

async function getPage(slug: string) {
  const page = await sanityFetch<InfoPage>(INFO_PAGE_QUERY, { slug })
  // Starter pages stay until the café publishes its own version
  return page ?? FALLBACK_INFO_PAGES.find((p) => p.slug === slug) ?? null
}

export async function generateStaticParams() {
  const slugs = new Set([...FALLBACK_INFO_PAGES.map((p) => p.slug), ...(isConfigured ? ((await sanityFetch<string[]>(INFO_SLUGS_QUERY)) ?? []) : [])])
  return [...slugs].map((slug) => ({ slug }))
}

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const [settings, page] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getPage(slug)])
  return buildMetadata(settings ?? FALLBACK_SETTINGS, null, page?.title)
}

export default async function InfoPageRoute({ params }: Params) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  return (
    <article className="info">
      <div className="container info-inner">
        <h1>{page.title}</h1>
        <RichText value={page.body} className="rich info-body" />
      </div>
    </article>
  )
}

import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { POSTS_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { PostCard as PostCardData, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_POSTS, FALLBACK_SETTINGS } from '@/lib/fallback'
import { PostCard } from '@/components/blog/PostCard'
import { Reveal } from '@/components/Reveal'

export const revalidate = 60

async function getPosts(): Promise<PostCardData[]> {
  if (!isConfigured) return FALLBACK_POSTS
  return (await sanityFetch<PostCardData[]>(POSTS_QUERY)) ?? []
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await sanityFetch<Settings>(SETTINGS_QUERY)) ?? FALLBACK_SETTINGS
  return {
    ...buildMetadata(settings, { description: 'News, new drinks, events and life behind the counter at Honey & Haven in Oadby.' }, 'Blog'),
  }
}

export default async function BlogPage() {
  const posts = await getPosts()
  const [lead, ...rest] = posts
  return (
    <>
      <section className="menu-hero blog-hero">
        <div className="container">
          <h1>News &amp; stories</h1>
          <p>New drinks, seasonal specials, events and life behind the counter at Honey &amp; Haven.</p>
        </div>
      </section>
      <section className="blog-list">
        <div className="container">
          {lead ? (
            <>
              <Reveal>
                <PostCard post={lead} lead />
              </Reveal>
              {rest.length ? (
                <div className="post-grid">
                  {rest.map((p, i) => (
                    <Reveal key={p._id} delay={(i % 3) * 0.08}>
                      <PostCard post={p} />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="empty">Our first post is on its way. Pop in to see what&rsquo;s new in the meantime.</p>
          )}
        </div>
      </section>
    </>
  )
}

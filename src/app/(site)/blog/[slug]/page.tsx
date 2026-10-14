import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { POST_QUERY, POST_SLUGS_QUERY, SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Post, PostCard as PostCardData, Settings } from '@/lib/types'
import { buildMetadata } from '@/lib/metadata'
import { FALLBACK_POSTS, FALLBACK_SETTINGS } from '@/lib/fallback'
import { RichText } from '@/components/RichText'
import { imgProps } from '@/components/SanityImg'
import { PostCard, postDate } from '@/components/blog/PostCard'
import { ArrowLeft, ArrowRight } from '@/components/Icons'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

async function getPost(slug: string): Promise<{ post: Post | null; more: PostCardData[] }> {
  if (!isConfigured) return { post: FALLBACK_POSTS.find((p) => p.slug === slug) ?? null, more: [] }
  const data = await sanityFetch<{ post: Post | null; more: PostCardData[] }>(POST_QUERY, { slug })
  return { post: data?.post ?? null, more: data?.more ?? [] }
}

export async function generateStaticParams() {
  const slugs = isConfigured ? ((await sanityFetch<string[]>(POST_SLUGS_QUERY)) ?? []) : FALLBACK_POSTS.map((p) => p.slug)
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const [settings, { post }] = await Promise.all([sanityFetch<Settings>(SETTINGS_QUERY), getPost(slug)])
  if (!post) return {}
  return buildMetadata(
    settings ?? FALLBACK_SETTINGS,
    { title: post.seo?.title, description: post.seo?.description || post.excerpt, image: post.seo?.image?.asset ? post.seo.image : post.coverImage, noIndex: post.seo?.noIndex },
    post.title,
  )
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const { post, more } = await getPost(slug)
  if (!post) notFound()
  const cover = imgProps(post.coverImage, 1400, 840, '(max-width: 1100px) 100vw, 1100px', post.coverImage?.alt || '')

  return (
    <article className="post">
      <header className="container post-head">
        <Link href="/blog" className="text-link post-back">
          <ArrowLeft /> All posts
        </Link>
        <p className="post-meta">
          {post.category ? <span>{post.category}</span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt}>{postDate(post.publishedAt)}</time> : null}
        </p>
        <h1>{post.title}</h1>
        {post.excerpt ? <p className="post-lead">{post.excerpt}</p> : null}
        {post.author ? <p className="post-author">By {post.author}</p> : null}
      </header>
      {cover ? (
        <div className="container post-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.src} srcSet={cover.srcSet} sizes={cover.sizes} width={cover.width} height={cover.height} alt={cover.alt} fetchPriority="high" />
        </div>
      ) : null}
      <div className="container">
        <RichText value={post.body} className="rich post-body" />
      </div>
      {more.length ? (
        <section className="section post-more">
          <div className="container">
            <div className="related-head">
              <h2>More from the café</h2>
              <Link href="/blog" className="text-link">
                All posts <ArrowRight />
              </Link>
            </div>
            <div className="post-grid">
              {more.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  )
}

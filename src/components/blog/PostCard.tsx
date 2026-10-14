import Link from 'next/link'
import type { PostCard as PostCardData } from '@/lib/types'
import { imgProps } from '../SanityImg'
import { LogoMark } from '../LogoMark'
import { ArrowRight } from '../Icons'

export const postDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** A post in the blog list. `lead` = the big card for the newest post. */
export function PostCard({ post, lead = false }: { post: PostCardData; lead?: boolean }) {
  const img = imgProps(post.coverImage, lead ? 1100 : 720, lead ? 760 : 540, lead ? '(max-width: 860px) 100vw, 55vw' : '(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw', post.coverImage?.alt || '')
  return (
    <article className="post-card" data-lead={lead || undefined}>
      <Link href={`/blog/${post.slug}`} className="post-card-media" tabIndex={-1} aria-hidden="true">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} srcSet={img.srcSet} sizes={img.sizes} width={img.width} height={img.height} alt="" loading={lead ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <LogoMark className="post-card-mark" />
        )}
      </Link>
      <div className="post-card-body">
        <p className="post-meta">
          {post.category ? <span>{post.category}</span> : null}
          <time dateTime={post.publishedAt}>{postDate(post.publishedAt)}</time>
        </p>
        <h2 className="post-card-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? <p className="post-card-excerpt">{post.excerpt}</p> : null}
        {lead ? (
          <span className="text-link" aria-hidden="true">
            Read the post <ArrowRight />
          </span>
        ) : null}
      </div>
    </article>
  )
}

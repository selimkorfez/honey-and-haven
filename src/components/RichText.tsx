import { PortableText, type PortableTextBlock, type PortableTextComponents } from 'next-sanity'
import type { SanityImage } from '@/lib/types'
import { imgProps } from './SanityImg'

const components: PortableTextComponents = {
  types: {
    // Photos added inside a blog post
    inlineImage: ({ value }: { value: SanityImage & { caption?: string; size?: string } }) => {
      const wide = value.size === 'wide'
      const p = imgProps(value, wide ? 1200 : 760, undefined, wide ? '(max-width: 900px) 100vw, 1100px' : '(max-width: 760px) 100vw, 720px')
      if (!p) return null
      return (
        <figure className="rich-figure" data-wide={wide || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} srcSet={p.srcSet} sizes={p.sizes} width={p.width} height={p.height} alt={p.alt} loading="lazy" decoding="async" />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href || '#'
      const external = /^https?:/.test(href)
      return (
        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      )
    },
  },
}

/** Text written in the Studio's rich text editor. */
export function RichText({ value, className = 'rich' }: { value?: PortableTextBlock[] | null; className?: string }) {
  if (!value?.length) return null
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  )
}

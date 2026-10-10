import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/lib/types'

export type ImgProps = {
  src: string
  srcSet: string
  sizes: string
  width: number
  height: number
  alt: string
  lqip?: string
}

/** Builds responsive image attributes from a Sanity image (or a starter photo). */
export function imgProps(
  image: SanityImage | null | undefined,
  width: number,
  height?: number,
  sizes = '100vw',
  alt?: string,
): ImgProps | null {
  if (!image?.asset) return null
  const ratio = height ? height / width : undefined
  const widths = [320, 480, 640, 800, 1080, 1440, 1920, 2400].filter((w) => w <= width * 2)
  const build = (w: number) => {
    // Starter photos (before the café uploads its own)
    if (image.asset!._id === 'fallback')
      return `${image.asset!.url}?w=${w}${ratio ? `&h=${Math.round(w * ratio)}&fit=crop` : ''}&auto=format&q=75`
    let b = urlFor(image).width(w).quality(80)
    if (ratio) b = b.height(Math.round(w * ratio))
    return b.url()
  }
  return {
    src: build(width),
    srcSet: widths.map((w) => `${build(w)} ${w}w`).join(', '),
    sizes,
    width,
    height: height ?? Math.round(width / (image.asset.metadata?.dimensions?.aspectRatio || 1.5)),
    alt: alt ?? image.alt ?? '',
    lqip: image.asset.metadata?.lqip,
  }
}

type Props = {
  image?: SanityImage | null
  width: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
  alt?: string
  style?: React.CSSProperties
}

/** Responsive image served (and resized) by Sanity's image CDN. */
export function SanityImg({ image, width, height, sizes = '100vw', priority, className, alt, style }: Props) {
  const p = imgProps(image, width, height, sizes, alt)
  if (!p) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.src}
      srcSet={p.srcSet}
      sizes={p.sizes}
      width={p.width}
      height={p.height}
      alt={p.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={{ backgroundImage: p.lqip ? `url(${p.lqip})` : undefined, backgroundSize: 'cover', ...style }}
    />
  )
}

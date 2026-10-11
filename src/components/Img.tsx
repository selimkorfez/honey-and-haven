import type { ImgProps } from './SanityImg'

/** Renders pre-built responsive image props (safe to use in client components). */
export function Img({ img, className, priority }: { img: ImgProps; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={img.sizes}
      width={img.width}
      height={img.height}
      alt={img.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={img.lqip ? { backgroundImage: `url(${img.lqip})`, backgroundSize: 'cover' } : undefined}
    />
  )
}

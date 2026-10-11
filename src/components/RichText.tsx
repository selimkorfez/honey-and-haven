import { PortableText, type PortableTextBlock, type PortableTextComponents } from 'next-sanity'

const components: PortableTextComponents = {
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

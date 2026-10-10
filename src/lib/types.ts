export type SanityImage = {
  _type?: 'image'
  alt?: string
  asset?: { _id: string; url: string; metadata?: { lqip?: string; dimensions?: { width: number; height: number; aspectRatio: number } } }
  hotspot?: unknown
  crop?: unknown
  _key?: string
}

export type Seo = { title?: string; description?: string; image?: SanityImage; noIndex?: boolean } | null

export type Settings = {
  name?: string
  tagline?: string
  announcement?: string
  address?: string
  mapQuery?: string
  phone?: string
  email?: string
  hours?: { _key: string; days: string; hours: string }[]
  instagram?: string
  tiktok?: string
  facebook?: string
  seo?: Seo
} | null

export type MenuItem = {
  _id: string
  name: string
  description?: string
  price?: number
  priceNote?: string
  dietary?: string[]
  image?: SanityImage
  category?: string
}

export type HomeData = {
  page: {
    heroEyebrow?: string
    heroHeading?: string
    heroText?: string
    heroImage?: SanityImage
    storyHeading?: string
    storyText?: string
    storyImage?: SanityImage
    highlights?: { _key: string; title: string; text?: string }[]
    menuHeading?: string
    menuText?: string
    gallery?: SanityImage[]
    visitHeading?: string
    visitText?: string
    seo?: Seo
  } | null
  featured: MenuItem[]
}

export type MenuData = {
  page: { heading?: string; intro?: string; footnote?: string; seo?: Seo } | null
  categories: { _id: string; title: string; description?: string; items: MenuItem[] }[]
}

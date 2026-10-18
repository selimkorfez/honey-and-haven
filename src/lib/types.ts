import type { PortableTextBlock } from 'next-sanity'

export type SanityImage = {
  _type?: 'image'
  alt?: string
  asset?: { _id: string; url: string; metadata?: { lqip?: string; dimensions?: { width: number; height: number; aspectRatio: number } } }
  hotspot?: unknown
  crop?: unknown
  _key?: string
  /** Gallery photos: link to the Instagram post */
  link?: string
}

export type Seo = { title?: string; description?: string; image?: SanityImage; noIndex?: boolean } | null

export type Settings = {
  name?: string
  tagline?: string
  announcement?: string
  announcementLink?: { page?: string; url?: string; section?: string } | null
  address?: string
  mapQuery?: string
  phone?: string
  email?: string
  hours?: { _key: string; days: string; hours: string }[]
  hoursNote?: string
  specialHours?: SpecialHours[]
  infoPages?: { title: string; slug: string }[]
  instagram?: string
  tiktok?: string
  facebook?: string
  hasBlog?: boolean
  beeEnabled?: boolean
  beeGreeting?: string
  beePicks?: BeePick[]
  googlePlaceId?: string
  reviewLink?: string
  newsletter?: Partial<NewsletterSettings>
  seo?: Seo
} | null

export type NewsletterSettings = {
  enabled: boolean
  popup: boolean
  popupDelay: number
  popupHeading: string
  popupText: string
  heading: string
  text: string
  offer: string
  button: string
  thanks: string
}

export type GalleryData = {
  heading?: string
  text?: string
  show?: 'instagram' | 'photos'
  photos?: SanityImage[]
} | null

export type BeePick = { _key: string; title: string; text?: string; link?: string }

export type HandpickedReview = { _key: string; quote: string; name: string; rating?: number; source?: string; link?: string }

export type TeamMember = { _key: string; name: string; role?: string; photo?: SanityImage; bio?: string; favourite?: string }

export type AboutData = {
  heading?: string
  intro?: string
  heroImage?: SanityImage
  storyHeading?: string
  story?: PortableTextBlock[]
  storyImage?: SanityImage
  values?: { _key: string; title: string; text?: string }[]
  teamHeading?: string
  teamIntro?: string
  team?: TeamMember[]
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
    heroHeading?: string
    heroText?: string
    heroSteps?: { _key: string; title: string; text?: string }[]
    heroImage?: SanityImage
    heroTone?: 'studio' | 'cream'
    storyHeading?: string
    storyText?: string
    storyImage?: SanityImage
    highlights?: { _key: string; title: string; text?: string }[]
    menuHeading?: string
    menuText?: string
    shopHeading?: string
    shopText?: string
    reviewsHeading?: string
    reviewsText?: string
    handpickedReviews?: HandpickedReview[]
    visitHeading?: string
    visitText?: string
    seo?: Seo
  } | null
  featured: MenuItem[]
  shop?: Product[]
  gallery?: GalleryData
}

export type SpecialHours = { _key: string; label: string; date: string; endDate?: string; closed?: boolean; hours?: string }

export type ProductVariant = { _key: string; name: string; price?: number | null; stock?: number | null }

export type Product = {
  _id: string
  name: string
  slug: string
  category?: string | null
  images?: SanityImage[] | null
  summary?: string | null
  description?: PortableTextBlock[] | null
  price: number
  compareAtPrice?: number | null
  stock?: number | null
  collectionOnly?: boolean | null
  optionName?: string | null
  variants?: ProductVariant[] | null
  featured?: boolean | null
}

export type ShopSettings = {
  heading?: string
  intro?: string
  bannerImage?: SanityImage
  ordersOpen: boolean
  closedMessage?: string
  lowStockAt: number
  thankYouMessage?: string
  collectionEnabled: boolean
  collectionNote?: string
  deliveryEnabled: boolean
  deliveryFee: number
  freeDeliveryOver?: number | null
  deliveryNote?: string
  seo?: Seo
}

/** What the browser needs to know about the shop (no secrets). */
export type CheckoutConfig = Pick<
  ShopSettings,
  'ordersOpen' | 'closedMessage' | 'collectionEnabled' | 'collectionNote' | 'deliveryEnabled' | 'deliveryFee' | 'freeDeliveryOver' | 'deliveryNote'
> & { live: boolean }

export type InfoPage = { title: string; slug: string; body?: PortableTextBlock[] | null }

export type MenuData = {
  page: { heading?: string; intro?: string; footnote?: string; seo?: Seo } | null
  categories: { _id: string; title: string; description?: string; items: MenuItem[] }[]
}

export type PostCard = {
  _id: string
  title: string
  slug: string
  publishedAt: string
  category?: string
  excerpt?: string
  coverImage?: SanityImage
}

export type Post = PostCard & { author?: string; body?: PortableTextBlock[]; seo?: Seo }

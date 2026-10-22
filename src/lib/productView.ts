import { imgProps, type ImgProps } from '@/components/SanityImg'
import type { BasketItemInput } from './basket'
import { gbp, priceLabel, productStock } from './money'
import type { Product } from './types'

export type ProductCardView = {
  id: string
  slug: string
  name: string
  category?: string | null
  summary?: string | null
  price: string
  was?: string | null
  badge?: string | null
  soldOut: boolean
  image: ImgProps | null
  image2: ImgProps | null
  /** Set for simple products that can go straight into the basket. */
  quickAdd: BasketItemInput | null
  /** Used to vary the colour of the bee tile on products without photos. */
  tone: number
}

export function thumbUrl(p: Product) {
  return imgProps(p.images?.[0], 160, 160)?.src
}

export function toCard(p: Product, lowAt: number, index = 0, sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'): ProductCardView {
  const stock = productStock(p, lowAt)
  const hasVariants = Boolean(p.variants?.length)
  const onSale = typeof p.compareAtPrice === 'number' && p.compareAtPrice > p.price
  return {
    id: p._id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    summary: p.summary,
    price: priceLabel(p),
    was: onSale ? gbp(p.compareAtPrice!) : null,
    badge: stock.soldOut ? 'Sold out' : stock.low ? `Only ${stock.left} left` : onSale ? 'Sale' : null,
    soldOut: stock.soldOut,
    // whole photos at their own shape: the card frame shows them uncropped (see .pcard-media img)
    image: imgProps(p.images?.[0], 640, undefined, sizes, p.images?.[0]?.alt || p.name),
    image2: imgProps(p.images?.[1], 640, undefined, sizes, p.images?.[1]?.alt || p.name),
    quickAdd:
      hasVariants || stock.soldOut
        ? null
        : {
            productId: p._id,
            name: p.name,
            price: p.price,
            image: thumbUrl(p),
            slug: p.slug,
            max: stock.left,
            collectionOnly: Boolean(p.collectionOnly),
          },
    tone: index % 3,
  }
}

import type { CheckoutConfig, Product, ProductVariant } from './types'

const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

/** £8.00 → "£8", £3.95 → "£3.95" */
export function gbp(n: number) {
  return Number.isInteger(n) ? `£${n}` : fmt.format(n)
}

export const toPence = (n: number) => Math.round(n * 100)

export function variantPrice(p: Pick<Product, 'price'>, v?: Pick<ProductVariant, 'price'> | null) {
  return typeof v?.price === 'number' ? v.price : p.price
}

/** Price label for a card: "£12", or "From £12" when options are priced differently. */
export function priceLabel(p: Pick<Product, 'price' | 'variants'>) {
  const prices = (p.variants ?? []).map((v) => variantPrice(p, v))
  if (!prices.length) return gbp(p.price)
  const min = Math.min(...prices)
  return prices.some((x) => x !== min) ? `From ${gbp(min)}` : gbp(min)
}

export type StockInfo = { soldOut: boolean; left: number | null; low: boolean }

/** null/undefined stock = not counted (always available). */
export function stockInfo(stock: number | null | undefined, lowAt: number): StockInfo {
  if (typeof stock !== 'number') return { soldOut: false, left: null, low: false }
  return { soldOut: stock <= 0, left: Math.max(0, stock), low: stock > 0 && stock <= lowAt }
}

export function productStock(p: Pick<Product, 'stock' | 'variants'>, lowAt: number): StockInfo {
  const vs = p.variants ?? []
  if (!vs.length) return stockInfo(p.stock, lowAt)
  const infos = vs.map((v) => stockInfo(v.stock, lowAt))
  return { soldOut: infos.every((i) => i.soldOut), left: null, low: false }
}

export function deliveryCost(cfg: Pick<CheckoutConfig, 'deliveryFee' | 'freeDeliveryOver'>, subtotal: number) {
  if (typeof cfg.freeDeliveryOver === 'number' && cfg.freeDeliveryOver > 0 && subtotal >= cfg.freeDeliveryOver) return 0
  return cfg.deliveryFee || 0
}

/** Shared between the browser basket and the checkout API. */
export type BasketItemInput = {
  productId: string
  variantKey?: string
  name: string
  option?: string
  price: number
  image?: string
  slug: string
  /** How many are left (null = not counted). */
  max: number | null
  collectionOnly: boolean
}

export type BasketLine = BasketItemInput & { id: string; qty: number }

export type Fulfilment = 'collection' | 'delivery'

export type CheckoutRequest = {
  lines: { productId: string; variantKey?: string; qty: number }[]
  fulfilment: Fulfilment
}

export type CheckoutResponse = { url: string } | { error: string; fix?: { id: string; max: number }[] }

export const lineId = (productId: string, variantKey?: string) => (variantKey ? `${productId}:${variantKey}` : productId)

export const MAX_PER_LINE = 20

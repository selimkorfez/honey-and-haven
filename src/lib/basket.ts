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

export type CustomerDetails = {
  name: string
  email: string
  phone?: string
  /** Delivery only */
  line1?: string
  line2?: string
  city?: string
  postcode?: string
}

export type CheckoutRequest = {
  lines: { productId: string; variantKey?: string; qty: number }[]
  fulfilment: Fulfilment
  customer: CustomerDetails
  code?: string
}

export type CheckoutResponse = { url: string } | { error: string; field?: keyof CustomerDetails | 'code'; fix?: { id: string; max: number }[] }

export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Checks the details form; returns the first problem, or null. Used in the browser and on the server. */
export function checkDetails(c: CustomerDetails, fulfilment: Fulfilment): { field: keyof CustomerDetails; error: string } | null {
  if (!c.name || c.name.trim().length < 2) return { field: 'name', error: 'Please add your name.' }
  if (!EMAIL.test(c.email?.trim() ?? '')) return { field: 'email', error: 'Please check your email address.' }
  if (c.phone && !/^[+\d][\d\s()-]{6,20}$/.test(c.phone.trim())) return { field: 'phone', error: 'Please check your phone number.' }
  if (fulfilment === 'delivery') {
    if (!c.line1 || c.line1.trim().length < 3) return { field: 'line1', error: 'Please add the first line of your address.' }
    if (!c.city || c.city.trim().length < 2) return { field: 'city', error: 'Please add your town or city.' }
    if (!UK_POSTCODE.test(c.postcode?.trim() ?? '')) return { field: 'postcode', error: 'Please check the postcode (UK only).' }
  }
  return null
}

export const lineId = (productId: string, variantKey?: string) => (variantKey ? `${productId}:${variantKey}` : productId)

export const MAX_PER_LINE = 20

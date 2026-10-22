import { getWriteClient } from '@/sanity/lib/write'
import { getCheckout, isSandboxCheckout, transactionCode, type SumUpStatus } from './sumup'
import type { CustomerDetails, Fulfilment } from './basket'

export type OrderSummary = {
  orderNumber: string
  paid: boolean
  /** SumUp's view of the payment */
  state: SumUpStatus
  recorded: boolean
  email?: string | null
  name?: string | null
  fulfilment: Fulfilment
  items: { name: string; option?: string; quantity: number; amount: number }[]
  delivery: number
  discount: number
  total: number
}

/** Saved (privately) before the customer is sent to SumUp, so we know what they're paying for. */
export type PendingCheckout = {
  _id: string
  _type: 'pendingCheckout'
  ref: string
  sumupId: string
  createdAt: string
  status: 'open' | 'recorded'
  /** test payments only: what was chosen on the pretend payment page */
  sandboxStatus?: SumUpStatus
  fulfilment: Fulfilment
  customer: CustomerDetails
  lines: {
    _key: string
    productId: string
    variantKey?: string
    name: string
    option?: string
    quantity: number
    unitPrice: number
    amount: number
  }[]
  subtotal: number
  delivery: number
  discount: number
  discountCode?: string
  discountId?: string
  total: number
}

export const pendingId = (ref: string) => `checkouts.${ref}`
export const isOrderRef = (ref: string) => /^HH-[A-Z0-9]{6,20}$/.test(ref)

/** "HH-" plus a short, unguessable code: the order number customers and staff see. */
export function newOrderRef() {
  const t = Date.now().toString(36).toUpperCase().slice(-5)
  const r = Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
  return `HH-${t}${r}`
}

function formatAddress(c: CustomerDetails) {
  return [c.name, c.line1, c.line2, c.city, c.postcode?.toUpperCase(), 'United Kingdom'].filter(Boolean).join('\n')
}

/**
 * Checks the payment with SumUp and, once paid, turns it into an Order in the Studio
 * and takes the items off stock. Safe to call more than once for the same order
 * (SumUp's notification + the thank-you page): only the first one counts.
 */
export async function recordOrder(ref: string): Promise<OrderSummary | null> {
  if (!isOrderRef(ref)) return null
  const write = getWriteClient()
  if (!write) return null
  const pending = await write.getDocument<PendingCheckout>(pendingId(ref))
  if (!pending?.sumupId) return null

  const checkout = await getCheckout(pending.sumupId)
  // Paid, for exactly the amount we asked for, for this order
  const paid =
    checkout.status === 'PAID' &&
    checkout.checkout_reference === ref &&
    checkout.currency === 'GBP' &&
    Math.abs(Number(checkout.amount) - pending.total) < 0.005

  const summary: OrderSummary = {
    orderNumber: ref,
    paid,
    state: checkout.status,
    recorded: false,
    email: pending.customer.email,
    name: pending.customer.name,
    fulfilment: pending.fulfilment,
    items: pending.lines.map((l) => ({ name: l.name, option: l.option, quantity: l.quantity, amount: l.amount })),
    delivery: pending.delivery,
    discount: pending.discount,
    total: pending.total,
  }
  if (!paid) {
    if (checkout.status === 'PAID') console.error('[orders] SumUp checkout', checkout.id, 'does not match order', ref)
    return summary
  }

  // Orders live under "orders." so they are private: only signed-in staff can see them
  const id = `orders.${ref}`
  if (await write.getDocument(id)) return { ...summary, recorded: true }

  const productIds = [...new Set(pending.lines.map((l) => l.productId))]
  const docs = await write.fetch<{ _id: string; stock?: number; variants?: { _key: string; stock?: number }[] }[]>(
    `*[_id in $ids]{ _id, stock, variants[]{ _key, stock } }`,
    { ids: [...productIds, ...productIds.map((p) => `drafts.${p}`)] },
  )

  // a test purchase: saved like any order, marked as a test, and it doesn't touch stock or codes
  const test = isSandboxCheckout(pending.sumupId)
  const c = pending.customer
  const tx = write.transaction().create({
    _id: id,
    _type: 'order',
    status: 'new',
    orderNumber: ref,
    placedAt: new Date().toISOString(),
    fulfilment: pending.fulfilment,
    customerName: c.name,
    email: c.email,
    phone: c.phone || undefined,
    address: pending.fulfilment === 'delivery' ? formatAddress(c) : undefined,
    items: pending.lines.map((l, i) => ({
      _key: `l${i}`,
      _type: 'orderLine',
      name: l.name,
      option: l.option,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      product: { _type: 'reference', _ref: l.productId, _weak: true },
    })),
    subtotal: pending.subtotal,
    deliveryFee: pending.delivery,
    discount: pending.discount,
    discountCode: pending.discountCode,
    total: pending.total,
    paymentProvider: test ? 'Test payment (no money taken)' : 'SumUp',
    testOrder: test || undefined,
    transactionCode: transactionCode(checkout),
    sumupCheckoutId: checkout.id,
  })

  // Take sold items off stock (on the published product and any unpublished edits of it)
  for (const l of test ? [] : pending.lines) {
    for (const doc of docs.filter((d) => d._id === l.productId || d._id === `drafts.${l.productId}`)) {
      if (l.variantKey) {
        const v = doc.variants?.find((x) => x._key === l.variantKey)
        if (typeof v?.stock === 'number') tx.patch(doc._id, (p) => p.dec({ [`variants[_key=="${l.variantKey}"].stock`]: l.quantity }))
      } else if (typeof doc.stock === 'number') {
        tx.patch(doc._id, (p) => p.dec({ stock: l.quantity }))
      }
    }
  }
  // Count the discount code as used
  if (!test && pending.discountId && (await write.getDocument(pending.discountId))) {
    tx.patch(pending.discountId, (p) => p.setIfMissing({ uses: 0 }).inc({ uses: 1 }))
  }
  tx.patch(pending._id, (p) => p.set({ status: 'recorded' }))

  try {
    await tx.commit({ visibility: 'sync' })
  } catch (err) {
    // Another request recorded it first: that's fine
    if ((err as { statusCode?: number }).statusCode === 409) return { ...summary, recorded: true }
    throw err
  }
  return { ...summary, recorded: true }
}

import type Stripe from 'stripe'
import { getStripe } from './stripe'
import { getWriteClient } from '@/sanity/lib/write'
import type { Fulfilment } from './basket'

export type OrderSummary = {
  orderNumber: string
  paid: boolean
  recorded: boolean
  email?: string | null
  name?: string | null
  fulfilment: Fulfilment
  items: { name: string; option?: string; quantity: number; amount: number }[]
  delivery: number
  discount: number
  total: number
}

const pounds = (pence?: number | null) => Math.round(pence ?? 0) / 100

function orderNumberFor(session: Stripe.Checkout.Session) {
  return `HH-${session.created.toString(36).toUpperCase().slice(-4)}${session.id.slice(-4).toUpperCase()}`
}

function formatAddress(a?: Stripe.Address | null, name?: string | null) {
  if (!a) return undefined
  return [name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join('\n')
}

/**
 * Turns a paid Stripe checkout into an Order in the Studio and takes the items off stock.
 * Safe to call more than once for the same checkout (webhook + thank-you page): only the first one counts.
 */
export async function recordOrder(sessionId: string): Promise<OrderSummary | null> {
  const stripe = getStripe()
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null

  const [session, lineItems] = await Promise.all([
    stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] }),
    stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] }),
  ])
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const fulfilment: Fulfilment = session.metadata?.fulfilment === 'delivery' ? 'delivery' : 'collection'

  const lines = lineItems.data.map((li) => {
    const product = (typeof li.price?.product === 'object' ? li.price.product : null) as Stripe.Product | null
    return {
      productId: product?.metadata?.productId,
      variantKey: product?.metadata?.variantKey || undefined,
      name: product?.metadata?.name || li.description || 'Item',
      option: product?.metadata?.option || undefined,
      quantity: li.quantity ?? 1,
      unitPrice: pounds(li.price?.unit_amount),
      amount: pounds(li.amount_subtotal),
    }
  })

  const summary: OrderSummary = {
    orderNumber: orderNumberFor(session),
    paid,
    recorded: false,
    email: session.customer_details?.email,
    name: session.customer_details?.name,
    fulfilment,
    items: lines.map((l) => ({ name: l.name, option: l.option, quantity: l.quantity, amount: l.amount })),
    delivery: pounds(session.total_details?.amount_shipping),
    discount: pounds(session.total_details?.amount_discount),
    total: pounds(session.amount_total),
  }
  if (!paid) return summary

  const write = getWriteClient()
  if (!write) {
    console.error('[orders] SANITY_API_WRITE_TOKEN is not set, so order', summary.orderNumber, 'was not saved to the Studio (it is still in Stripe).')
    return summary
  }

  // Orders live under "orders." so they are private: only signed-in staff can see them
  const id = `orders.${session.id}`
  const existing = await write.getDocument(id)
  if (existing) return { ...summary, recorded: true, orderNumber: (existing.orderNumber as string) || summary.orderNumber }

  const productIds = [...new Set(lines.map((l) => l.productId).filter(Boolean))] as string[]
  const docs = await write.fetch<{ _id: string; stock?: number; variants?: { _key: string; stock?: number }[] }[]>(
    `*[_id in $ids]{ _id, stock, variants[]{ _key, stock } }`,
    { ids: [...productIds, ...productIds.map((p) => `drafts.${p}`)] },
  )

  const pi = typeof session.payment_intent === 'object' ? session.payment_intent : null
  const shipping = session.collected_information?.shipping_details
  const tx = write.transaction().create({
    _id: id,
    _type: 'order',
    status: 'new',
    orderNumber: summary.orderNumber,
    placedAt: new Date(session.created * 1000).toISOString(),
    fulfilment,
    customerName: shipping?.name || session.customer_details?.name || undefined,
    email: session.customer_details?.email || undefined,
    phone: session.customer_details?.phone || undefined,
    address: fulfilment === 'delivery' ? formatAddress(shipping?.address, shipping?.name) : undefined,
    items: lines.map((l, i) => ({
      _key: `l${i}`,
      _type: 'orderLine',
      name: l.name,
      option: l.option,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      product: l.productId ? { _type: 'reference', _ref: l.productId, _weak: true } : undefined,
    })),
    subtotal: pounds(session.amount_subtotal),
    deliveryFee: summary.delivery,
    discount: summary.discount,
    total: summary.total,
    stripeSessionId: session.id,
    stripeLink: pi ? `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}payments/${pi.id}` : undefined,
  })

  // Take sold items off stock (on the published product and any unpublished edits of it)
  for (const l of lines) {
    if (!l.productId) continue
    for (const doc of docs.filter((d) => d._id === l.productId || d._id === `drafts.${l.productId}`)) {
      if (l.variantKey) {
        const v = doc.variants?.find((x) => x._key === l.variantKey)
        if (typeof v?.stock === 'number') tx.patch(doc._id, (p) => p.dec({ [`variants[_key=="${l.variantKey}"].stock`]: l.quantity }))
      } else if (typeof doc.stock === 'number') {
        tx.patch(doc._id, (p) => p.dec({ stock: l.quantity }))
      }
    }
  }

  try {
    await tx.commit({ visibility: 'sync' })
  } catch (err) {
    // Another request recorded it first: that's fine
    if ((err as { statusCode?: number }).statusCode === 409) return { ...summary, recorded: true }
    throw err
  }
  return { ...summary, recorded: true }
}

import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { isConfigured } from '@/sanity/env'
import { freshClient } from '@/sanity/lib/write'
import { CHECKOUT_PRODUCTS_QUERY, SHOP_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { getStripe } from '@/lib/stripe'
import { withShopDefaults } from '@/lib/shop'
import { deliveryCost, toPence } from '@/lib/money'
import { MAX_PER_LINE, lineId, type CheckoutRequest } from '@/lib/basket'
import type { ShopSettings } from '@/lib/types'
import { siteUrl } from '@/lib/format'

export const dynamic = 'force-dynamic'

type CheckoutProduct = {
  _id: string
  name: string
  available?: boolean
  price?: number
  stock?: number | null
  collectionOnly?: boolean
  variants?: { _key: string; name: string; price?: number | null; stock?: number | null }[] | null
  imageUrl?: string | null
}

const fail = (error: string, status = 400, fix?: { id: string; max: number }[]) => NextResponse.json({ error, fix }, { status })

function parse(body: unknown): CheckoutRequest | null {
  const b = body as CheckoutRequest
  if (!b || !Array.isArray(b.lines) || b.lines.length === 0 || b.lines.length > 30) return null
  if (b.fulfilment !== 'collection' && b.fulfilment !== 'delivery') return null
  const seen = new Set<string>()
  for (const l of b.lines) {
    if (typeof l?.productId !== 'string' || l.productId.length > 100) return null
    // Each product/option may only appear once (quantities are per line)
    const id = lineId(l.productId, l.variantKey)
    if (seen.has(id)) return null
    seen.add(id)
    if (l.variantKey !== undefined && typeof l.variantKey !== 'string') return null
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_PER_LINE) return null
  }
  return b
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe || !isConfigured) return fail('Online payments are being set up. Everything is available in store in the meantime.', 503)

  const body = parse(await req.json().catch(() => null))
  if (!body) return fail('Your basket looks out of date. Please refresh the page and try again.')

  // Prices, stock and settings always come from the Studio, never from the browser
  const sanity = freshClient()
  const ids = [...new Set(body.lines.map((l) => l.productId))]
  let products: CheckoutProduct[]
  let rawSettings: Partial<ShopSettings> | null
  try {
    ;[products, rawSettings] = await Promise.all([
      sanity.fetch<CheckoutProduct[]>(CHECKOUT_PRODUCTS_QUERY, { ids }),
      sanity.fetch<Partial<ShopSettings> | null>(SHOP_SETTINGS_QUERY),
    ])
  } catch (err) {
    console.error('[checkout] Sanity error', err)
    return fail('We couldn’t open the checkout just now. Please try again in a moment.', 502)
  }
  const settings = withShopDefaults(rawSettings)
  if (!settings.ordersOpen) return fail(settings.closedMessage || 'Online orders are paused for now.', 409)

  const problems: string[] = []
  const fix: { id: string; max: number }[] = []
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  let subtotal = 0
  let collectionOnly = false

  for (const line of body.lines) {
    const id = lineId(line.productId, line.variantKey)
    const p = products.find((x) => x._id === line.productId)
    if (!p || p.available === false || typeof p.price !== 'number') {
      problems.push(`Sorry, ${p?.name ?? 'one item'} is no longer available.`)
      fix.push({ id, max: 0 })
      continue
    }
    const variants = p.variants ?? []
    const v = line.variantKey ? variants.find((x) => x._key === line.variantKey) : null
    if ((variants.length && !v) || (!variants.length && line.variantKey)) {
      problems.push(`The option you picked for ${p.name} has changed. Please choose again.`)
      fix.push({ id, max: 0 })
      continue
    }
    const stock = v ? v.stock : p.stock
    const label = v ? `${p.name} (${v.name})` : p.name
    if (typeof stock === 'number' && line.qty > stock) {
      problems.push(stock <= 0 ? `${label} has just sold out.` : `We only have ${stock} × ${label} left, so we’ve updated your basket.`)
      fix.push({ id, max: Math.max(0, stock) })
      continue
    }
    const unit = typeof v?.price === 'number' ? v.price : p.price
    subtotal += unit * line.qty
    collectionOnly ||= Boolean(p.collectionOnly)
    items.push({
      quantity: line.qty,
      price_data: {
        currency: 'gbp',
        unit_amount: toPence(unit),
        product_data: {
          name: p.name,
          description: v ? `${v.name}` : undefined,
          images: p.imageUrl ? [`${p.imageUrl}?w=600&h=600&fit=crop&auto=format`] : undefined,
          metadata: { productId: p._id, variantKey: v?._key ?? '', name: p.name, option: v ? v.name : '' },
        },
      },
    })
  }
  if (problems.length) return fail(problems.join(' '), 409, fix)

  const delivery = body.fulfilment === 'delivery'
  if (delivery && !settings.deliveryEnabled) return fail('Delivery isn’t available right now. Please choose collection.', 409)
  if (delivery && collectionOnly) return fail('Some items in your basket can only be collected in store.', 409)
  if (!delivery && !settings.collectionEnabled) return fail('Collection isn’t available right now. Please choose delivery.', 409)

  const origin = process.env.NEXT_PUBLIC_SITE_URL ? siteUrl() : req.nextUrl.origin
  const note = (delivery ? settings.deliveryNote : settings.collectionNote)?.slice(0, 1000)
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items,
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      locale: 'en-GB',
      // Keeps the stock check fresh: unpaid checkouts expire after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      ...(delivery
        ? {
            shipping_address_collection: { allowed_countries: ['GB'] },
            shipping_options: [
              {
                shipping_rate_data: {
                  type: 'fixed_amount',
                  display_name: 'UK delivery',
                  fixed_amount: { amount: toPence(deliveryCost(settings, subtotal)), currency: 'gbp' },
                },
              },
            ],
          }
        : {}),
      custom_text: note ? { submit: { message: delivery ? note : `Collect in store: ${note}` } } : undefined,
      metadata: { fulfilment: body.fulfilment, source: 'website' },
      payment_intent_data: { description: `Honey & Haven online order (${delivery ? 'delivery' : 'collection'})`, metadata: { fulfilment: body.fulfilment } },
      success_url: `${origin}/shop/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop?basket=open`,
    })
    if (!session.url) throw new Error('No checkout URL')
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe error', err)
    return fail('We couldn’t open the checkout just now. Please try again in a moment.', 502)
  }
}

import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { recordOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/** Stripe calls this after every payment (set up once in Stripe → Developers → Webhooks). */
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const signature = req.headers.get('stripe-signature')
  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature ?? '', secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'unpaid') {
      try {
        const result = await recordOrder(session.id)
        // Refresh stock on the website straight away
        if (result?.recorded) revalidateTag('sanity', 'max')
      } catch (err) {
        console.error('[webhook] could not save order', session.id, err)
        // Stripe will retry later
        return NextResponse.json({ error: 'Order not saved yet' }, { status: 500 })
      }
    }
  }
  return NextResponse.json({ received: true })
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { recordOrder, type OrderSummary } from '@/lib/orders'
import { getShopSettings } from '@/lib/shop'
import { gbp } from '@/lib/money'
import { LogoMark } from '@/components/LogoMark'
import { ClearBasket } from '@/components/shop/ClearBasket'
import { ArrowRight } from '@/components/Icons'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Thank you · Honey & Haven', robots: { index: false, follow: false } }

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams
  const settings = await getShopSettings()
  let order: OrderSummary | null = null
  if (session_id) {
    try {
      order = await recordOrder(session_id)
    } catch (err) {
      console.error('[thank-you] could not load order', err)
    }
  }

  if (!order?.paid) {
    return (
      <section className="thanks">
        <div className="container thanks-inner">
          <LogoMark className="thanks-mark" />
          <h1>{order ? 'Payment still processing' : 'Nothing to see here'}</h1>
          <p className="body-text">
            {order
              ? 'Your payment hasn’t been confirmed yet. You’ll get an email from Stripe as soon as it is.'
              : 'We couldn’t find that order. If you’ve paid, check your email for a receipt.'}
          </p>
          <Link href="/shop" className="btn btn-primary">
            Back to the shop <ArrowRight />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="thanks">
      <ClearBasket />
      <div className="container thanks-inner">
        <LogoMark className="thanks-mark" />
        <h1>Thank you{order.name ? `, ${order.name.split(' ')[0]}` : ''}</h1>
        <p className="thanks-number">
          Order <strong>{order.orderNumber}</strong>
        </p>
        <p className="body-text">{settings.thankYouMessage}</p>
        <p className="body-text">
          {order.fulfilment === 'collection' ? settings.collectionNote : settings.deliveryNote || 'We’ll post your order soon.'}
          {order.email ? ` A receipt is on its way to ${order.email}.` : ''}
        </p>
        <div className="thanks-card">
          <ul>
            {order.items.map((it, i) => (
              <li key={i}>
                <span>
                  {it.quantity} × {it.name}
                  {it.option ? <small> ({it.option})</small> : null}
                </span>
                <span className="price">{gbp(it.amount)}</span>
              </li>
            ))}
            {order.discount ? (
              <li>
                <span>Discount</span>
                <span className="price">−{gbp(order.discount)}</span>
              </li>
            ) : null}
            <li>
              <span>{order.fulfilment === 'collection' ? 'Collect in store' : 'UK delivery'}</span>
              <span className="price">{order.delivery ? gbp(order.delivery) : 'Free'}</span>
            </li>
            <li className="thanks-total">
              <span>Total paid</span>
              <span className="price">{gbp(order.total)}</span>
            </li>
          </ul>
        </div>
        <Link href="/" className="text-link">
          Back to the home page <ArrowRight />
        </Link>
      </div>
    </section>
  )
}

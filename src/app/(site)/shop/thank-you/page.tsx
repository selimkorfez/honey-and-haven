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

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: ref } = await searchParams
  const settings = await getShopSettings()
  let order: OrderSummary | null = null
  if (ref) {
    try {
      order = await recordOrder(ref)
    } catch (err) {
      console.error('[thank-you] could not load order', err)
    }
  }

  if (!order?.paid) {
    const failed = order?.state === 'FAILED' || order?.state === 'EXPIRED'
    return (
      <section className="thanks">
        <div className="container thanks-inner">
          <LogoMark className="thanks-mark" />
          <h1>{!order ? 'Nothing to see here' : failed ? 'Payment didn’t go through' : 'Payment still processing'}</h1>
          <p className="body-text">
            {!order
              ? 'We couldn’t find that order. If you’ve paid, please get in touch in the café or on Instagram and we’ll sort it out.'
              : failed
                ? 'No money has been taken. Your basket is still saved, so you can try again.'
                : 'Your payment hasn’t been confirmed yet. This page will show your order as soon as it is; try refreshing in a moment.'}
          </p>
          {order && !failed ? (
            <Link href={`/shop/thank-you?order=${order.orderNumber}`} className="btn btn-primary">
              Refresh <ArrowRight />
            </Link>
          ) : (
            <Link href="/shop?basket=open" className="btn btn-primary">
              {failed ? 'Back to my basket' : 'Back to the shop'} <ArrowRight />
            </Link>
          )}
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
          {order.fulfilment === 'collection' ? settings.collectionNote : settings.deliveryNote || 'We’ll post your order soon.'} Please keep your order
          number handy.
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

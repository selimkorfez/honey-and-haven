import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWriteClient } from '@/sanity/lib/write'
import { sandboxPayments } from '@/lib/sumup'
import { isOrderRef, pendingId, type PendingCheckout } from '@/lib/orders'
import { gbp } from '@/lib/money'
import { LogoMark } from '@/components/LogoMark'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Test payment · Honey & Haven', robots: { index: false, follow: false } }

/**
 * Stands in for SumUp's payment page while testing (PAYMENTS_SANDBOX=1, never on the live site):
 * pick "Pay" or "Decline" and the shop carries on exactly as it would after a real payment.
 */
export default async function TestPaymentPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  if (!sandboxPayments()) notFound()
  const { order: ref } = await searchParams
  const write = getWriteClient()
  if (!ref || !isOrderRef(ref) || !write) notFound()
  const pending = await write.getDocument<PendingCheckout>(pendingId(ref))
  if (!pending) notFound()

  return (
    <section className="thanks">
      <div className="container thanks-inner">
        <LogoMark className="thanks-mark" />
        <p className="eyebrow">Test payment · no money is taken</p>
        <h1>Pay {gbp(pending.total)}</h1>
        <p className="body-text">
          This page stands in for SumUp&rsquo;s card page while the shop is being tested. Order <strong>{ref}</strong>,{' '}
          {pending.fulfilment === 'delivery' ? 'UK delivery' : 'collect in store'}.
        </p>
        <div className="thanks-card">
          <ul>
            {pending.lines.map((l) => (
              <li key={l._key}>
                <span>
                  {l.quantity} × {l.name}
                  {l.option ? <small> ({l.option})</small> : null}
                </span>
                <span className="price">{gbp(l.amount)}</span>
              </li>
            ))}
            {pending.discount ? (
              <li>
                <span>Discount</span>
                <span className="price">−{gbp(pending.discount)}</span>
              </li>
            ) : null}
            <li>
              <span>{pending.fulfilment === 'collection' ? 'Collect in store' : 'UK delivery'}</span>
              <span className="price">{pending.delivery ? gbp(pending.delivery) : 'Free'}</span>
            </li>
            <li className="thanks-total">
              <span>To pay</span>
              <span className="price">{gbp(pending.total)}</span>
            </li>
          </ul>
        </div>
        <div className="hero-actions">
          <form action="/api/sumup/test-pay" method="post">
            <input type="hidden" name="order" value={ref} />
            <input type="hidden" name="outcome" value="PAID" />
            <button type="submit" className="btn btn-primary">
              Pay {gbp(pending.total)} (test card)
            </button>
          </form>
          <form action="/api/sumup/test-pay" method="post">
            <input type="hidden" name="order" value={ref} />
            <input type="hidden" name="outcome" value="FAILED" />
            <button type="submit" className="btn btn-ghost">
              Decline the card
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

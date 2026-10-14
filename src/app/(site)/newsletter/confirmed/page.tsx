import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoMark } from '@/components/LogoMark'
import { ArrowRight } from '@/components/Icons'
import { MarkJoined } from '@/components/newsletter/MarkJoined'

export const metadata: Metadata = { title: 'You’re in the hive · Honey & Haven', robots: { index: false, follow: false } }

/** Where Brevo sends people after they tap "confirm" in the double opt-in email. */
export default function NewsletterConfirmedPage() {
  return (
    <section className="thanks">
      <MarkJoined />
      <div className="container thanks-inner">
        <LogoMark className="thanks-mark" />
        <h1>You’re in the hive</h1>
        <p className="body-text">
          Thank you for confirming. Your welcome email, with a discount code for your first visit, is on its way. Show it at the counter when you pop in.
        </p>
        <p className="body-text">Every email has an unsubscribe link at the bottom, so you can leave whenever you like.</p>
        <Link href="/menu" className="btn btn-primary">
          See the menu <ArrowRight />
        </Link>
      </div>
    </section>
  )
}

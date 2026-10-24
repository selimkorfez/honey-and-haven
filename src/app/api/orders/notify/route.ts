import { NextResponse } from 'next/server'
import { loadOrder, sendStatusEmail, STATUS_EMAILS } from '@/lib/orderEmails'
import { isOrderRef } from '@/lib/orders'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Called by the Studio after an order is published (see src/sanity/actions/publishOrder.tsx):
 * emails the customer if the order is now Ready to collect, Posted or Refunded/cancelled.
 * Nothing in the request is trusted: it reads the published order itself, and each status
 * email is sent only once, so calling it again does nothing.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: string; status?: string } | null
  const id = typeof body?.id === 'string' ? body.id.replace(/^drafts\./, '') : ''
  if (!id.startsWith('orders.') || !isOrderRef(id.slice('orders.'.length))) return NextResponse.json({ result: 'skipped' }, { status: 400 })
  if (body?.status && !STATUS_EMAILS.includes(body.status as never)) return NextResponse.json({ result: 'skipped' })

  // the Studio calls this as it publishes: wait (briefly) for the published order to show the new status
  let order = await loadOrder(id)
  for (let i = 0; i < 10 && order && body?.status && order.status !== body.status; i++) {
    await new Promise((r) => setTimeout(r, 800))
    order = await loadOrder(id)
  }
  if (!order) return NextResponse.json({ result: 'skipped' }, { status: 404 })
  const result = await sendStatusEmail(order)
  return NextResponse.json({ result, status: order.status })
}

import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getWriteClient } from '@/sanity/lib/write'
import { sandboxPayments } from '@/lib/sumup'
import { isOrderRef, pendingId, recordOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/** The test payment page's buttons (PAYMENTS_SANDBOX=1 only): mark the payment paid or declined. */
export async function POST(req: NextRequest) {
  if (!sandboxPayments()) return new NextResponse(null, { status: 404 })
  const form = await req.formData()
  const ref = String(form.get('order') ?? '')
  const outcome = form.get('outcome') === 'PAID' ? 'PAID' : 'FAILED'
  const write = getWriteClient()
  if (!write || !isOrderRef(ref) || !(await write.getDocument(pendingId(ref)))) return new NextResponse(null, { status: 404 })

  await write.patch(pendingId(ref)).set({ sandboxStatus: outcome }).commit({ visibility: 'sync' })
  // what SumUp's notification does after a real payment
  if (outcome === 'PAID' && (await recordOrder(ref))?.recorded) revalidateTag('sanity', 'max')
  return NextResponse.redirect(new URL(`/shop/thank-you?order=${ref}`, req.nextUrl.origin), 303)
}

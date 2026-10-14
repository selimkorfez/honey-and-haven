import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getWriteClient } from '@/sanity/lib/write'
import { recordOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/**
 * SumUp calls this when a payment's status changes ({ event_type, id }).
 * We never trust the message itself: recordOrder() asks SumUp for the real status.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { event_type?: string; id?: string } | null
  if (body?.event_type !== 'CHECKOUT_STATUS_CHANGED' || typeof body.id !== 'string' || body.id.length > 100) {
    // Unknown events are ignored, as SumUp recommends
    return new NextResponse(null, { status: 204 })
  }
  const write = getWriteClient()
  if (!write) return new NextResponse(null, { status: 503 })
  try {
    const ref = await write.fetch<string | null>(`*[_type == "pendingCheckout" && sumupId == $id][0].ref`, { id: body.id })
    if (!ref) return new NextResponse(null, { status: 204 })
    const result = await recordOrder(ref)
    // Refresh stock on the website straight away
    if (result?.recorded) revalidateTag('sanity', 'max')
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[sumup webhook] could not save order', body.id, err)
    // SumUp retries after 1, 5 and 20 minutes and 2 hours
    return new NextResponse(null, { status: 500 })
  }
}

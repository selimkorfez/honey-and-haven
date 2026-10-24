import { NextResponse } from 'next/server'
import { getWriteClient } from '@/sanity/lib/write'
import { isOrderRef } from '@/lib/orders'
import { ORDER_FIELDS, receiptPdf, type OrderDoc } from '@/lib/receipt'
import { siteUrl } from '@/lib/format'

export const dynamic = 'force-dynamic'

/**
 * An order's PDF receipt: /api/receipt/HH-XXXX?k=<the order's receipt key>.
 * The key is only in the customer's emails, their thank-you page and the order in the Studio.
 * Add &download=1 to save it instead of opening it.
 */
export async function GET(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const url = new URL(req.url)
  const key = url.searchParams.get('k') ?? ''
  const write = getWriteClient()
  if (!write || !isOrderRef(ref) || key.length < 20) return new NextResponse('Not found', { status: 404 })
  const order = await write.fetch<OrderDoc | null>(`*[_id == $id][0]{ ${ORDER_FIELDS} }`, { id: `orders.${ref}` })
  if (!order?.receiptKey || order.receiptKey !== key) return new NextResponse('Not found', { status: 404 })
  const s = await write.fetch<{ name?: string; address?: string; phone?: string; email?: string } | null>(
    `*[_id == "siteSettings"][0]{ name, address, phone, email }`,
  )
  const pdf = await receiptPdf(order, {
    name: s?.name || 'Honey & Haven',
    address: s?.address || undefined,
    phone: s?.phone,
    email: s?.email,
    website: siteUrl(),
  })
  const name = `Honey-and-Haven-receipt-${ref}.pdf`
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${url.searchParams.has('download') ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}

import { NextResponse } from 'next/server'
import { getWriteClient } from '@/sanity/lib/write'
import { DISCOUNT_QUERY, checkDiscount, discountLabel, normaliseCode, type DiscountDoc } from '@/lib/discounts'

export const dynamic = 'force-dynamic'

// Slows down anyone trying to guess codes: 10 tries per 10 minutes per visitor (per server instance)
const tries = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const list = (tries.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  list.push(now)
  tries.set(ip, list)
  if (tries.size > 5000) tries.clear()
  return list.length > 10
}

/** Checks a discount code for the basket. The checkout checks it again before payment. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null
  const code = typeof body?.code === 'string' ? normaliseCode(body.code).slice(0, 30) : ''
  if (code.length < 3) return NextResponse.json({ ok: false, error: 'Please enter a code.' }, { status: 400 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })

  const write = getWriteClient()
  if (!write) return NextResponse.json({ ok: false, error: 'Discount codes aren’t available yet.' }, { status: 503 })
  try {
    const doc = await write.fetch<DiscountDoc | null>(DISCOUNT_QUERY, { code })
    const check = checkDiscount(doc)
    if (!check.ok) return NextResponse.json({ ok: false, error: check.error })
    return NextResponse.json({ ok: true, rule: check.rule, label: discountLabel(check.rule) })
  } catch (err) {
    console.error('[discount] lookup failed', err)
    return NextResponse.json({ ok: false, error: 'We couldn’t check that code just now.' }, { status: 502 })
  }
}

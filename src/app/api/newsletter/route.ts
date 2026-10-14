import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/brevo'
import { EMAIL_RE } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

// Best-effort flood protection (per server instance): 5 sign-ups per 10 minutes per visitor
const recent = new Map<string, number[]>()
function tooMany(ip: string) {
  const now = Date.now()
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  list.push(now)
  recent.set(ip, list)
  if (recent.size > 5000) recent.clear()
  return list.length > 5
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, max) : '')
const fail = (error: string, status = 400, field?: string) => NextResponse.json({ error, field }, { status })

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return fail('Something went wrong. Please try again.')

  // Spam traps: a hidden field people never fill in, and forms sent impossibly fast. Pretend it worked.
  if (clean(body.website, 200) || (typeof body.elapsed === 'number' && body.elapsed < 1200)) return NextResponse.json({ ok: true })

  const email = clean(body.email, 160).toLowerCase()
  const firstName = clean(body.firstName, 60)
  if (!EMAIL_RE.test(email)) return fail('Please check your email address.', 400, 'email')
  // Consent must be given actively: the box starts unticked and the server checks it too
  if (body.consent !== true) return fail('Please tick the box so we can send you emails.', 400, 'consent')

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (tooMany(ip)) return fail('Thanks! That’s a few sign-ups already. Please try again a bit later.', 429)

  const result = await subscribe(email, firstName || undefined)
  if (result.ok) return NextResponse.json({ ok: true })
  if (result.reason === 'not-configured') return fail('Our newsletter is nearly ready. Please try again soon.', 503)
  if (result.reason === 'rejected') return fail('We couldn’t sign up that address. Please check it and try again.', 400, 'email')
  return fail('We couldn’t sign you up just now. Please try again in a moment.', 502)
}

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getWriteClient } from '@/sanity/lib/write'

const KINDS = new Set(['feedback', 'idea', 'recommend', 'other'])

// Best-effort flood protection (per server instance): 5 notes per 10 minutes per visitor
const recent = new Map<string, number[]>()
function tooMany(ip: string) {
  const now = Date.now()
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  list.push(now)
  recent.set(ip, list)
  if (recent.size > 5000) recent.clear()
  return list.length > 5
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, max)
    : ''

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })
  }

  // Spam traps: a hidden field people never fill in, and forms sent impossibly fast
  if (clean(body.website, 200) || (typeof body.elapsed === 'number' && body.elapsed < 1500)) {
    return NextResponse.json({ ok: true })
  }

  const message = clean(body.message, 1500)
  const kind = KINDS.has(String(body.kind)) ? String(body.kind) : 'feedback'
  const name = clean(body.name, 80)
  const email = clean(body.email, 160)
  const page = clean(body.page, 200)

  if (message.length < 3) return NextResponse.json({ error: 'Please write a little more.' }, { status: 400 })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address doesn’t look quite right.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (tooMany(ip)) return NextResponse.json({ error: 'Thanks! You’ve sent a few already. Please try again a bit later.' }, { status: 429 })

  const client = getWriteClient()
  if (!client) {
    return NextResponse.json(
      { error: 'Our bee is still learning to carry notes. Please tell us in the café or on Instagram for now.' },
      { status: 503 },
    )
  }

  try {
    // "feedback." IDs are private in Sanity: only signed-in staff can read them
    await client.create({
      _id: `feedback.${randomUUID()}`,
      _type: 'feedback',
      status: 'new',
      kind,
      message,
      name: name || undefined,
      email: email || undefined,
      page: page || undefined,
      sentAt: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Saving feedback failed', err)
    return NextResponse.json({ error: 'We couldn’t send that just now. Please try again in a moment.' }, { status: 500 })
  }
}

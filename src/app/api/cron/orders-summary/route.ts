import { NextResponse } from 'next/server'
import { sendDailySummary } from '@/lib/orderEmails'

export const dynamic = 'force-dynamic'

/** Run each morning by Vercel Cron (see vercel.json): emails Dil the orders still open. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  try {
    return NextResponse.json(await sendDailySummary())
  } catch (err) {
    console.error('[orders summary] failed', err)
    return NextResponse.json({ sent: false }, { status: 500 })
  }
}

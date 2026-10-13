import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { refreshInstagramToken } from '@/lib/instagram'

export const dynamic = 'force-dynamic'

/** Run weekly by Vercel Cron (see vercel.json) so the Instagram feed never expires. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  try {
    const result = await refreshInstagramToken()
    if (result.ok) revalidateTag('instagram', 'max')
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    console.error('Instagram token refresh failed', err)
    return NextResponse.json({ ok: false, message: 'Refresh failed' }, { status: 500 })
  }
}

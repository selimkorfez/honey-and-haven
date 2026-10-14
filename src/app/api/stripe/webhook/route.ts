import { NextResponse } from 'next/server'

// Online payments moved to SumUp (see /api/sumup/webhook). This route is no longer used and can be deleted.
export async function POST() {
  return NextResponse.json({ error: 'Gone' }, { status: 410 })
}

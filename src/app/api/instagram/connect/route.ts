import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { STATE_COOKIE, authorizeUrl } from '@/lib/instagram-connect'

export const dynamic = 'force-dynamic'

/** Sends the owner to Instagram to approve the website reading the café's posts. */
export async function GET() {
  const state = randomBytes(16).toString('hex')
  const res = NextResponse.redirect(authorizeUrl(state))
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/instagram', maxAge: 600 })
  return res
}

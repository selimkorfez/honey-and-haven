import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/** "Exit preview": back to the published website. */
export async function GET(req: NextRequest) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', req.nextUrl.origin))
}

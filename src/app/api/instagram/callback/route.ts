import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { STATE_COOKIE, exchangeCode } from '@/lib/instagram-connect'
import { instagramHandle } from '@/lib/instagram'
import { sanityFetch } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic'

const page = (title: string, text: string, ok: boolean) =>
  new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;background:#f3eadf;color:#2e1d1a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px">
<main style="max-width:420px;text-align:center"><p style="font-size:44px;margin:0">${ok ? '🐝' : '⚠️'}</p><h1 style="font-weight:500">${title}</h1><p style="color:#5c4838;line-height:1.5">${text}</p>
<p><a href="/" style="color:#7a4f2c">Back to the website</a></p></main></body>`,
    { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
  )

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Instagram sends the owner back here after they approve. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (url.searchParams.get('error')) return page('Not connected', 'Instagram access wasn’t approved. Nothing changed.', false)
  if (!code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) {
    return page('Link expired', 'Please start again from the “Connect Instagram” link.', false)
  }
  const settings = await sanityFetch<{ instagram?: string } | null>(`*[_id == "siteSettings"][0]{ instagram }`)
  const expected = instagramHandle(settings?.instagram ?? undefined)?.replace(/^@/, '') ?? null
  try {
    const result = await exchangeCode(code.replace(/#_$/, ''), expected)
    if (!result.ok) return page('Not connected', esc(result.message), false)
    revalidateTag('instagram', 'max')
    const res = page('Instagram connected', `The website now shows the latest posts from @${esc(result.username)}. It renews itself every week, so there’s nothing else to do.`, true)
    res.cookies.delete(STATE_COOKIE)
    return res
  } catch (err) {
    console.error('[instagram] connect failed', err)
    return page('Not connected', 'Something went wrong talking to Instagram. Please try again.', false)
  }
}

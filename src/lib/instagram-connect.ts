import { getWriteClient } from '@/sanity/lib/write'
import { siteUrl } from './format'

/**
 * "Connect Instagram" without copying tokens around: the café owner opens /api/instagram/connect,
 * logs in to Instagram and approves; the callback swaps the code for a 60-day token and keeps it
 * privately in Sanity (the weekly refresh job renews it from there).
 * Needs INSTAGRAM_APP_SECRET in Vercel, and the callback address added in the Meta app under
 * Instagram → API setup with Instagram login → Business login settings → OAuth redirect URIs.
 */
export const IG_APP_ID = process.env.INSTAGRAM_APP_ID || '1099249969582625'
export const igRedirectUri = () => `${siteUrl()}/api/instagram/callback`
export const STATE_COOKIE = 'hh-ig-state'

export function authorizeUrl(state: string) {
  const q = new URLSearchParams({
    client_id: IG_APP_ID,
    redirect_uri: igRedirectUri(),
    response_type: 'code',
    scope: 'instagram_business_basic',
    state,
  })
  return `https://www.instagram.com/oauth/authorize?${q}`
}

type Fail = { ok: false; message: string }

export async function exchangeCode(code: string, expectedUsername: string | null): Promise<{ ok: true; username: string } | Fail> {
  const secret = process.env.INSTAGRAM_APP_SECRET
  if (!secret) return { ok: false, message: 'INSTAGRAM_APP_SECRET is not set in Vercel yet.' }
  const write = getWriteClient()
  if (!write) return { ok: false, message: 'The Sanity write token is missing, so the connection can’t be saved.' }

  // 1. code → short-lived token
  const short = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: IG_APP_ID, client_secret: secret, grant_type: 'authorization_code', redirect_uri: igRedirectUri(), code }),
    cache: 'no-store',
  })
  const s = (await short.json().catch(() => ({}))) as { access_token?: string; error_message?: string; error?: { message?: string } }
  if (!short.ok || !s.access_token) return { ok: false, message: s.error_message || s.error?.message || `Instagram returned ${short.status}` }

  // 2. short-lived → 60-day token
  const long = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(s.access_token)}`,
    { cache: 'no-store' },
  )
  const l = (await long.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { message?: string } }
  if (!long.ok || !l.access_token) return { ok: false, message: l.error?.message || `Instagram returned ${long.status}` }

  // 3. only the café's own account may be connected
  const me = await fetch(`https://graph.instagram.com/me?fields=username&access_token=${encodeURIComponent(l.access_token)}`, { cache: 'no-store' })
  const m = (await me.json().catch(() => ({}))) as { username?: string }
  const username = m.username || ''
  if (expectedUsername && username.toLowerCase() !== expectedUsername.toLowerCase()) {
    return { ok: false, message: `That’s @${username || 'unknown'}, not @${expectedUsername}. Log in with the café’s account and try again.` }
  }

  const now = new Date()
  await write.createOrReplace({
    _id: 'secrets.instagram',
    _type: 'instagramToken',
    token: l.access_token,
    username,
    refreshedAt: now.toISOString(),
    expiresAt: l.expires_in ? new Date(now.getTime() + l.expires_in * 1000).toISOString() : undefined,
  })
  return { ok: true, username }
}

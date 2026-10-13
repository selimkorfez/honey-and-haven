import { getWriteClient } from '@/sanity/lib/write'

/**
 * Latest posts from the café's Instagram, through Meta's "Instagram API with Instagram Login".
 *
 * Setup (once): create a Meta app with the Instagram product, add the café's Instagram account,
 * generate an access token in the App Dashboard and save it in Vercel as INSTAGRAM_ACCESS_TOKEN.
 * Tokens last 60 days; /api/instagram/refresh (run weekly by Vercel Cron) renews it and keeps the
 * newest one in a private Sanity document, so nobody has to paste a new token by hand.
 */

const API = 'https://graph.instagram.com'
const VERSION = 'v25.0'
const TOKEN_DOC = 'secrets.instagram'

export type InstaPost = {
  id: string
  image: string
  href: string
  caption?: string
  kind: 'image' | 'video' | 'carousel'
  date?: string
}

type Media = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp?: string
}

/** The newest token: the one saved by the refresh job, otherwise the one in Vercel. */
export async function getInstagramToken(): Promise<string | null> {
  const client = getWriteClient()
  if (client) {
    try {
      const doc = await client.fetch<{ token?: string } | null>(`*[_id == $id][0]{ token }`, { id: TOKEN_DOC }, { next: { revalidate: 3600, tags: ['instagram'] } })
      if (doc?.token) return doc.token
    } catch (err) {
      console.error('Reading the Instagram token failed', err)
    }
  }
  return process.env.INSTAGRAM_ACCESS_TOKEN || null
}

export async function getInstagramPosts(limit = 8): Promise<InstaPost[] | null> {
  const token = await getInstagramToken()
  if (!token) return null
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
  const url = `${API}/${VERSION}/me/media?fields=${fields}&limit=${Math.min(25, limit + 6)}&access_token=${encodeURIComponent(token)}`
  try {
    // Instagram image links expire after a while, so refresh the list every hour
    const res = await fetch(url, { next: { revalidate: 3600, tags: ['instagram'] } })
    if (!res.ok) {
      console.error('Instagram returned', res.status, await res.text().catch(() => ''))
      return null
    }
    const json = (await res.json()) as { data?: Media[] }
    const posts = (json.data ?? [])
      .map((m): InstaPost | null => {
        const image = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url
        if (!image || !m.permalink) return null
        return {
          id: m.id,
          image,
          href: m.permalink,
          caption: m.caption?.slice(0, 220),
          kind: m.media_type === 'VIDEO' ? 'video' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image',
          date: m.timestamp,
        }
      })
      .filter((p): p is InstaPost => Boolean(p))
      .slice(0, limit)
    return posts.length ? posts : null
  } catch (err) {
    console.error('Instagram fetch failed', err)
    return null
  }
}

/** Swaps the current long-lived token for a fresh 60-day one and saves it (needs the Sanity write token). */
export async function refreshInstagramToken(): Promise<{ ok: boolean; message: string }> {
  const token = await getInstagramToken()
  if (!token) return { ok: false, message: 'No Instagram token set (INSTAGRAM_ACCESS_TOKEN).' }
  const client = getWriteClient()
  if (!client) return { ok: false, message: 'Sanity write token missing, so a refreshed token could not be saved.' }
  const res = await fetch(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { message?: string } }
  if (!res.ok || !json.access_token) return { ok: false, message: json.error?.message || `Instagram returned ${res.status}` }
  const now = new Date()
  await client.createOrReplace({
    _id: TOKEN_DOC,
    _type: 'instagramToken',
    token: json.access_token,
    refreshedAt: now.toISOString(),
    expiresAt: json.expires_in ? new Date(now.getTime() + json.expires_in * 1000).toISOString() : undefined,
  })
  return { ok: true, message: 'Instagram token refreshed.' }
}

/** "@honeyand.haven" from the profile link in Site settings. */
export function instagramHandle(url?: string) {
  if (!url) return null
  try {
    const name = new URL(url).pathname.split('/').filter(Boolean)[0]
    return name ? `@${name}` : null
  } catch {
    return null
  }
}

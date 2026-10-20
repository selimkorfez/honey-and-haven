export const DIETARY_LABELS: Record<string, { short: string; long: string }> = {
  v: { short: 'V', long: 'Vegetarian' },
  vg: { short: 'VG', long: 'Vegan' },
  gf: { short: 'GF', long: 'Gluten free' },
  df: { short: 'DF', long: 'Dairy free' },
  n: { short: 'N', long: 'Contains nuts' },
  soy: { short: 'SOY', long: 'Contains soya' },
}

export function formatPrice(price?: number | null, note?: string | null) {
  if (note) return note
  if (typeof price !== 'number') return ''
  return `£${price.toFixed(2)}`
}

export function paragraphs(text?: string | null) {
  return (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function mapsLink(query?: string | null) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Honey & Haven Oadby')}`
}

export function mapsEmbed(query?: string | null) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query || 'Honey & Haven Oadby')}&output=embed`
}

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}

/** A section id from a title, e.g. "Autumn Specials" → "autumn-specials" (used for menu sections and links to them). */
export const sectionId = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Where the announcement bar goes when tapped (from Site settings). */
export function announcementHref(link?: { page?: string; section?: string; url?: string } | null) {
  if (!link?.page) return undefined
  if (link.page === 'custom') return link.url?.trim() || undefined
  if (link.page === '/menu' && link.section) return `/menu#${sectionId(link.section)}`
  return link.page
}

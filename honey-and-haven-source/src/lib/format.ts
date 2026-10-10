export const DIETARY_LABELS: Record<string, { short: string; long: string }> = {
  v: { short: 'V', long: 'Vegetarian' },
  vg: { short: 'VG', long: 'Vegan' },
  gf: { short: 'GF', long: 'Gluten free' },
  df: { short: 'DF', long: 'Dairy free' },
  n: { short: 'N', long: 'Contains nuts' },
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

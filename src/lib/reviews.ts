/**
 * The café's Google rating and best reviews, from Google's Places API (New).
 * Needs GOOGLE_PLACES_API_KEY in Vercel and the café's Place ID (Site settings → Reviews).
 * Google returns up to 5 reviews, ordered by relevance. Refreshed hourly.
 */

export type Review = {
  id: string
  author: string
  authorUrl?: string
  photo?: string
  rating: number
  text: string
  when?: string
  link?: string
  source: string
}

export type ReviewSummary = { rating?: number; count?: number; mapsUri?: string; reviews: Review[] }

type PlaceResponse = {
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: {
    name: string
    rating?: number
    relativePublishTimeDescription?: string
    text?: { text?: string }
    originalText?: { text?: string }
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
    googleMapsUri?: string
  }[]
}

export async function getGoogleReviews(placeId?: string | null): Promise<ReviewSummary | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const id = placeId || process.env.GOOGLE_PLACE_ID
  if (!key || !id) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      next: { revalidate: 3600, tags: ['reviews'] },
    })
    if (!res.ok) {
      console.error('Google Places returned', res.status, await res.text().catch(() => ''))
      return null
    }
    const place = (await res.json()) as PlaceResponse
    const reviews = (place.reviews ?? [])
      .map(
        (r): Review => ({
          id: r.name,
          author: r.authorAttribution?.displayName || 'Google user',
          authorUrl: r.authorAttribution?.uri,
          photo: r.authorAttribution?.photoUri,
          rating: r.rating ?? 0,
          text: (r.text?.text || r.originalText?.text || '').trim(),
          when: r.relativePublishTimeDescription,
          link: r.googleMapsUri,
          source: 'Google',
        }),
      )
    return { rating: place.rating, count: place.userRatingCount, mapsUri: place.googleMapsUri, reviews }
  } catch (err) {
    console.error('Google reviews fetch failed', err)
    return null
  }
}

/** Highest-rated first, keeping Google's "most relevant" order within each star level. */
export function topReviews(list: Review[], max = 6) {
  return list
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.rating >= 4 && r.text.length > 0)
    .sort((a, b) => b.r.rating - a.r.rating || a.i - b.i)
    .slice(0, max)
    .map(({ r }) => r)
}

export const writeReviewUrl = (placeId?: string | null) =>
  placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null

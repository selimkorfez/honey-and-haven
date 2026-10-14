import { draftMode } from 'next/headers'
import { createClient, type QueryParams } from 'next-sanity'
import { apiVersion, dataset, projectId, isConfigured } from '../env'

export const client = createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: 'published' })

/** Server-only token that can read unpublished drafts (for the Studio's Preview tab). */
export const previewToken = () => process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN

async function isPreview() {
  try {
    return (await draftMode()).isEnabled
  } catch {
    // outside a request (e.g. building the list of pages)
    return false
  }
}

/**
 * Fetch content. Visitors get published content (pages refresh about once a minute).
 * In preview (opened from the Studio), drafts are shown straight away.
 */
export async function sanityFetch<T>(query: string, params: QueryParams = {}): Promise<T | null> {
  if (!isConfigured) return null
  try {
    const token = previewToken()
    if (token && (await isPreview())) {
      return await client.fetch<T>(query, params, { perspective: 'drafts', useCdn: false, token, cache: 'no-store' })
    }
    return await client.fetch<T>(query, params, { next: { revalidate: 60, tags: ['sanity'] } })
  } catch (err) {
    console.error('Sanity fetch failed', err)
    return null
  }
}

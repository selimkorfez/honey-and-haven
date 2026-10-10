import { createClient, type QueryParams } from 'next-sanity'
import { apiVersion, dataset, projectId, isConfigured } from '../env'

export const client = createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: 'published' })

/** Fetch published content. Pages refresh automatically about once a minute. */
export async function sanityFetch<T>(query: string, params: QueryParams = {}): Promise<T | null> {
  if (!isConfigured) return null
  try {
    return await client.fetch<T>(query, params, { next: { revalidate: 60, tags: ['sanity'] } })
  } catch (err) {
    console.error('Sanity fetch failed', err)
    return null
  }
}

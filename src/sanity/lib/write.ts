import { createClient } from 'next-sanity'
import { apiVersion, dataset, isConfigured, projectId } from '../env'

/**
 * Server-only client that can write (orders, stock). Needs SANITY_API_WRITE_TOKEN
 * (an "Editor" token from sanity.io/manage → API → Tokens). Never sent to the browser.
 */
export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!isConfigured || !token) return null
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: 'raw' })
}

/** Fresh, uncached reads for checkout (prices and stock must be up to date). */
export const freshClient = () => createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'published' })

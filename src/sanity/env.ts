export const apiVersion = '2026-02-01'

// NEXT_PUBLIC_* in the website; SANITY_STUDIO_* when the Studio is built on its own for sanity.studio hosting
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'missing-project-id'

export const isConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)

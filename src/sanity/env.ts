export const apiVersion = '2026-02-01'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'missing-project-id'

export const isConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)

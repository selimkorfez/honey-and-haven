import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || '1lpzx719',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // The Studio lives inside the website at /studio and is registered with Sanity under this app ID
  // (`sanity deploy --external --url https://honey-and-haven.vercel.app/studio`)
  deployment: { appId: 'bqwvy0a9pixqh5br5o9ygmok' },
})

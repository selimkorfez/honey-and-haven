import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || '1lpzx719',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted copy of the Studio: https://honey-and-haven.sanity.studio (deploy with `npm run deploy-studio`)
  studioHost: 'honey-and-haven',
  deployment: {
    autoUpdates: false,
    // hosted copy vs. the Studio inside the website (registered with `sanity deploy --external`)
    appId: process.env.SANITY_STUDIO_HOSTED === 'true' ? 'ahypcsq3e3h4g9ha87ntvlnh' : 'bqwvy0a9pixqh5br5o9ygmok',
  },
})

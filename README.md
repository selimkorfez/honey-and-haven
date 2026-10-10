# Honey & Haven — website

Next.js site with an embedded Sanity Studio at `/studio`, hosted on Vercel.

- **Website content** (text, photos, menu, prices, opening hours, Google/sharing settings) is edited at `/studio` — no code needed.
- Until Sanity is connected, the site shows built-in starter content (`src/lib/fallback.ts`).

## Connect Sanity (one-time)
1. In Vercel → Project **honey-and-haven** → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = your Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production`
2. In sanity.io/manage → API → CORS origins, add the site URL (e.g. `https://honey-and-haven-sk-886f.vercel.app`) with **Allow credentials** ticked.
3. Redeploy. Visit `/studio` and log in.
4. Invite the café staff: sanity.io/manage → Members → Invite (free plan includes 20 seats).

## Local development
```
npm install
npm run dev
```
Open http://localhost:3000 (site) and http://localhost:3000/studio (editor).

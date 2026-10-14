# Honey & Haven — website

Next.js site with an embedded Sanity Studio at `/studio`, an online shop paid through SumUp, hosted on Vercel.

- **Everything on the site** (text, photos, About page and team, the bee, menu, products, prices, stock, opening hours, holiday hours, delivery fees, info pages, Google/sharing settings) is edited at `/studio`. No code needed.
- **Orders** appear in `/studio → Orders` the moment someone pays. Stock goes down automatically.
- **Payments and refunds** are in SumUp (the same account as the café's card reader). **Discount codes** are made in the Studio.
- Until Sanity is connected, the site shows built-in starter content (`src/lib/fallback.ts`), and the example products can't be bought.

## 1. Sanity (already connected)
Sanity project **honey-and-haven** (ID `1lpzx719`, dataset `production`, public) was created through the Vercel Marketplace, so its environment variables are added to Vercel automatically and billing/plan is managed from Vercel → Integrations → Sanity. CORS origins for the live site and localhost are set.

- **Log in:** `/studio` (or the "Staff login" link in the footer).
- **Invite people:** Vercel → Integrations → Sanity → Open in Sanity → Members → Invite.
  - **Administrator** = Owner: everything, including Site settings, Shop settings and inviting people.
  - **Editor** (needs the Growth plan) = staff: blog, menu, shop, gallery, homepage and pages. Site settings and Shop settings are hidden from them in the Studio.
- **Preview:** open the **Preview** tab at the top of the Studio to see unpublished changes on the real site before publishing (uses `SANITY_API_READ_TOKEN` and `/api/draft-mode/enable`).
- **Studio sections:** Orders · Inbox · Blog · Menu · Shop / Merchandise · Gallery · Homepage · Other pages · Site settings.
- **Images:** upload any size; Sanity's image CDN resizes, crops (to the hotspot) and converts to WebP/AVIF automatically.

Orders are saved with IDs starting `orders.`, which Sanity keeps private: only signed-in staff can read them, even though the dataset is public.

## 2. Connect SumUp (one-time)
Online payments go through SumUp, the same account as the card reader in the café, so online sales show up alongside in-store ones.
1. Log in at me.sumup.com → your profile → **Settings** → **For developers** → **Toolkit** → **API keys** → **Create**. Name it "Website" and copy the key (SumUp only shows it once).
2. Vercel → Project **honey-and-haven** → Settings → Environment Variables, add `SUMUP_API_KEY` = that key. (`SUMUP_MERCHANT_CODE` is optional; the site looks it up from the key.)
3. Make sure `SANITY_API_WRITE_TOKEN` is set too: the site saves each order to the Studio.
4. Redeploy. The basket's Checkout button switches on automatically.

How a payment works: the customer fills in their details in the basket, pays on SumUp's secure page (card, Apple Pay or Google Pay), and comes back to a thank-you page. SumUp also tells the website directly (`/api/sumup/webhook`), so the order is saved even if they close the tab. Refunds are done in the SumUp app or dashboard: each order in the Studio shows its **SumUp transaction code** to search for.

To test without real money, create a sandbox account at developer.sumup.com and use its API key in a Vercel Preview deployment.

### Discount codes
**Studio → Shop → Discount codes → +**. Choose a code (e.g. `WELCOME10`), % or £ off, and optionally free delivery, a minimum spend, start/end dates or a maximum number of uses. Customers type it in the basket. Switch **Active** off to stop a code immediately. Note: codes are stored in the public part of the Studio's content, so treat them as promotional, not secret.

## 3. Instagram feed (optional)
The "Slow mornings, warm cups" section shows the café's latest Instagram posts. Until it's connected, it shows the backup photos from **Home page → Instagram**.
1. developers.facebook.com → My Apps → Create app → add the **Instagram** product → "API setup with Instagram login".
2. Add the café's Instagram account (it must be a Business or Creator account) and click **Generate token**.
3. Vercel → Environment Variables: `INSTAGRAM_ACCESS_TOKEN` = that token, and `CRON_SECRET` = any long random text.
4. Redeploy. Tokens last 60 days; Vercel Cron calls `/api/instagram/refresh` every Monday to renew it (the fresh token is kept privately in Sanity, so `SANITY_API_WRITE_TOKEN` must be set).

## 4. Google reviews (optional)
The reviews section shows the café's Google rating and its best reviews (Google shares up to 5, ordered by relevance; only 4★ and 5★ reviews with text are shown, and the overall rating always links to all of them).
1. console.cloud.google.com → create a project → enable **Places API (New)** → Credentials → Create API key. Restrict it to "Places API (New)".
2. Find the café's Place ID at developers.google.com/maps/documentation/places/web-service/place-id and paste it into **Site settings → Reviews**.
3. Vercel → Environment Variables: `GOOGLE_PLACES_API_KEY`. Redeploy.
Reviews refresh hourly (about 750 requests a month). Google bills reviews data per request after a free monthly allowance, so check the Google Maps Platform pricing page and set a budget alert in the Cloud console. The "Leave a review" button goes straight to Google's review form once the Place ID is set. Staff can also add real reviews by hand under **Home page → Reviews**.

## The bee
The bee in the corner of every page lets visitors send feedback, ideas and recommendations. Notes arrive in **Studio → Inbox (customer notes)** and are private. Its greeting and "The bee recommends" list are in **Site settings → The bee**. Needs `SANITY_API_WRITE_TOKEN`.

## How the shop works
- Prices, stock and delivery fees are always read fresh from the Studio when a customer checks out. The browser basket is never trusted.
- Collection vs delivery is chosen in the basket, then the customer adds their name, email, optional phone and (for delivery) a UK address. Products marked **Collection in store only** force collection.
- After payment, the order is recorded twice for safety (SumUp's notification and the thank-you page). Only the first counts, so stock is never taken off twice. The amount SumUp says was paid is checked against the order before it's accepted.
- **Shop settings → Take online orders** pauses the shop without hiding products.
- Products can have options (size, colour…) with their own stock and price. Leave **Option name** empty for simple products.

## Environment variables
| Name | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Content |
| `NEXT_PUBLIC_SANITY_DATASET` | Content (`production`) |
| `SANITY_API_WRITE_TOKEN` | Saving orders, updating stock (server only) |
| `SANITY_API_READ_TOKEN` | Preview of unpublished changes (server only) |
| `SUMUP_API_KEY` | Online payments (server only) |
| `SUMUP_MERCHANT_CODE` | Optional: SumUp merchant code (looked up automatically) |
| `NEXT_PUBLIC_SITE_URL` | Optional: the final domain, for Google and share links |
| `INSTAGRAM_ACCESS_TOKEN` | Optional: Instagram feed (server only) |
| `CRON_SECRET` | Optional: protects the weekly Instagram token refresh |
| `GOOGLE_PLACES_API_KEY` | Optional: Google rating and reviews (server only) |
| `GOOGLE_PLACE_ID` | Optional: alternative to the Place ID in Site settings |

## Local development
```
npm install
npm run dev
```
Open http://localhost:3000 (site) and http://localhost:3000/studio (editor).

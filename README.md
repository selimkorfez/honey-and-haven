# Honey & Haven — website

Next.js site with an embedded Sanity Studio at `/studio`, an online shop paid through Stripe Checkout, hosted on Vercel.

- **Everything on the site** (text, photos, About page and team, the bee, menu, products, prices, stock, opening hours, holiday hours, delivery fees, info pages, Google/sharing settings) is edited at `/studio`. No code needed.
- **Orders** appear in `/studio → Orders` the moment someone pays. Stock goes down automatically.
- **Payments, refunds and discount codes** are handled in the Stripe dashboard.
- Until Sanity is connected, the site shows built-in starter content (`src/lib/fallback.ts`), and the example products can't be bought.

## 1. Connect Sanity (one-time)
1. Create a free project at sanity.io/manage (dataset `production`, **public**).
2. In Vercel → Project **honey-and-haven** → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = your Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production`
   - `SANITY_API_WRITE_TOKEN` = sanity.io/manage → API → Tokens → Add API token → permission **Editor** (used only on the server to save orders and update stock)
3. sanity.io/manage → API → CORS origins: add the site URL (e.g. `https://honey-and-haven.vercel.app`) with **Allow credentials** ticked.
4. Redeploy. Visit `/studio` and log in.
5. Invite the café staff: sanity.io/manage → Members → Invite.

Orders are saved with IDs starting `orders.`, which Sanity keeps private: only signed-in staff can read them, even though the dataset is public.

## 2. Connect Stripe (one-time)
1. Create a Stripe account (stripe.com) and complete the business details so payouts reach the café's bank.
2. Vercel → Environment Variables, add `STRIPE_SECRET_KEY` (Stripe → Developers → API keys → Secret key). Start with the **test** key (`sk_test_…`) to try it, then swap for the live key.
3. Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR-SITE/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.
4. Recommended Stripe settings:
   - Settings → Customer emails → turn on **Successful payments** (customers get a receipt).
   - Settings → Team & security / Notifications → turn on emails for **successful payments** (staff get an alert for each order; the Stripe phone app also sends push notifications).
   - Settings → Payment methods → Apple Pay / Google Pay are on by default for Checkout.
5. Redeploy.

Test card while using the test key: `4242 4242 4242 4242`, any future date, any CVC.

### Discount codes
Stripe → Product catalogue → Coupons → create a coupon, then add a **promotion code** (e.g. `WELCOME10`). Customers enter it on the checkout page.

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
- Collection vs delivery is chosen in the basket. Delivery collects a UK address on Stripe's page. Products marked **Collection in store only** force collection.
- After payment, the order is recorded twice for safety (the Stripe webhook and the thank-you page). Only the first counts, so stock is never taken off twice.
- **Shop settings → Take online orders** pauses the shop without hiding products.
- Products can have options (size, colour…) with their own stock and price. Leave **Option name** empty for simple products.

## Environment variables
| Name | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Content |
| `NEXT_PUBLIC_SANITY_DATASET` | Content (`production`) |
| `SANITY_API_WRITE_TOKEN` | Saving orders, updating stock (server only) |
| `STRIPE_SECRET_KEY` | Creating checkouts (server only) |
| `STRIPE_WEBHOOK_SECRET` | Verifying Stripe's order notifications (server only) |
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
Open http://localhost:3000 (site) and http://localhost:3000/studio (editor). To test webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

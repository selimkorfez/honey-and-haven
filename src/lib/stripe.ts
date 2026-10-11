import Stripe from 'stripe'

let stripe: Stripe | null = null

/** Returns null until STRIPE_SECRET_KEY is added in Vercel. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripe) stripe = new Stripe(key, { appInfo: { name: 'Honey & Haven website' } })
  return stripe
}

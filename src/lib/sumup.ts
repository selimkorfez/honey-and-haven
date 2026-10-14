/**
 * SumUp online payments (Hosted Checkout): the customer pays on SumUp's secure page
 * by card, Apple Pay or Google Pay, and the money lands in the café's SumUp account.
 *
 * Needs SUMUP_API_KEY (SumUp dashboard → Settings → For developers → Toolkit → API keys).
 * SUMUP_MERCHANT_CODE is optional: it's looked up from the key if not set.
 * Server only: the key is never sent to the browser.
 */

const API = (process.env.SUMUP_API_BASE || 'https://api.sumup.com').replace(/\/$/, '')

export type SumUpStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'

export type SumUpCheckout = {
  id: string
  status: SumUpStatus
  amount: number
  currency: string
  checkout_reference: string
  hosted_checkout_url?: string
  transactions?: { id?: string; transaction_code?: string; status?: string; amount?: number }[]
}

export const sumupConfigured = () => Boolean(process.env.SUMUP_API_KEY)

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.SUMUP_API_KEY
  if (!key) throw new Error('SUMUP_API_KEY is not set')
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const text = await res.text()
  if (!res.ok) throw Object.assign(new Error(`SumUp ${res.status}: ${text.slice(0, 300)}`), { status: res.status })
  return (text ? JSON.parse(text) : {}) as T
}

let merchantCode: string | null = process.env.SUMUP_MERCHANT_CODE || null

/** The café's SumUp merchant code (e.g. MCXXXXXX), from the env or the account itself. */
export async function getMerchantCode() {
  if (merchantCode) return merchantCode
  const me = await call<{ merchant_profile?: { merchant_code?: string }; merchant_code?: string }>('/v0.1/me')
  merchantCode = me.merchant_profile?.merchant_code || me.merchant_code || null
  if (!merchantCode) throw new Error('Could not find the SumUp merchant code; set SUMUP_MERCHANT_CODE')
  return merchantCode
}

export async function createCheckout(input: { reference: string; amount: number; description: string; returnUrl: string; redirectUrl: string }) {
  return call<SumUpCheckout>('/v0.1/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      checkout_reference: input.reference,
      amount: Math.round(input.amount * 100) / 100,
      currency: 'GBP',
      merchant_code: await getMerchantCode(),
      description: input.description.slice(0, 250),
      // SumUp tells us here when the payment status changes
      return_url: input.returnUrl,
      // where the "back to the shop" button on SumUp's page goes
      redirect_url: input.redirectUrl,
      // unpaid checkouts expire, so stock checks stay fresh
      valid_until: new Date(Date.now() + 30 * 60_000).toISOString(),
      hosted_checkout: { enabled: true },
    }),
  })
}

export async function getCheckout(id: string) {
  return call<SumUpCheckout>(`/v0.1/checkouts/${encodeURIComponent(id)}`)
}

/** The successful transaction's code (what staff search for in the SumUp app). */
export function transactionCode(c: SumUpCheckout) {
  const t = c.transactions?.find((x) => x.status === 'SUCCESSFUL') ?? c.transactions?.[0]
  return t?.transaction_code
}

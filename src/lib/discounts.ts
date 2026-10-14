/** Discount codes, created by staff in Studio → Shop → Discount codes. Shared by the basket and the checkout. */
export type DiscountRule = {
  code: string
  kind: 'percent' | 'amount'
  value: number
  minSpend?: number | null
  freeDelivery?: boolean | null
}

export type DiscountDoc = DiscountRule & {
  _id: string
  active?: boolean | null
  startsAt?: string | null
  endsAt?: string | null
  maxUses?: number | null
  uses?: number | null
}

export const normaliseCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '')

export const DISCOUNT_QUERY = `*[_type == "discountCode" && code == $code && !(_id in path("drafts.**"))][0]{
  _id, code, kind, value, minSpend, freeDelivery, active, startsAt, endsAt, maxUses, uses
}`

/** Is this code usable right now? Returns a friendly reason if not. */
export function checkDiscount(d: DiscountDoc | null, now = new Date()): { ok: true; rule: DiscountRule } | { ok: false; error: string } {
  if (!d || d.active === false || typeof d.value !== 'number' || d.value < 0 || (d.value === 0 && !d.freeDelivery)) return { ok: false, error: 'That code isn’t valid.' }
  if (d.startsAt && new Date(d.startsAt) > now) return { ok: false, error: 'That code isn’t active yet.' }
  if (d.endsAt && new Date(d.endsAt) < now) return { ok: false, error: 'That code has expired.' }
  if (typeof d.maxUses === 'number' && d.maxUses > 0 && (d.uses ?? 0) >= d.maxUses) return { ok: false, error: 'That code has been fully used.' }
  return { ok: true, rule: { code: d.code, kind: d.kind, value: d.value, minSpend: d.minSpend, freeDelivery: d.freeDelivery } }
}

/** Money off the items (never more than the items cost). */
export function discountAmount(rule: DiscountRule | null | undefined, subtotal: number) {
  if (!rule) return 0
  if (typeof rule.minSpend === 'number' && subtotal < rule.minSpend) return 0
  const raw = rule.kind === 'percent' ? (subtotal * Math.min(100, rule.value)) / 100 : rule.value
  return Math.round(Math.min(subtotal, raw) * 100) / 100
}

export function discountLabel(rule: DiscountRule) {
  const off = rule.kind === 'percent' ? `${rule.value}% off` : `£${Number.isInteger(rule.value) ? rule.value : rule.value.toFixed(2)} off`
  return [rule.value > 0 ? off : null, rule.freeDelivery ? 'free delivery' : null].filter(Boolean).join(' + ')
}

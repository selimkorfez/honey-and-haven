import { sumupConfigured } from './sumup'
import { sanityFetch } from '@/sanity/lib/client'
import { isConfigured } from '@/sanity/env'
import { SHOP_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { FALLBACK_SHOP_SETTINGS } from './fallback'
import type { CheckoutConfig, ShopSettings } from './types'

/** Online payments work once Sanity (products and orders, with a write token) and SumUp are both connected. */
export const checkoutLive = () => isConfigured && sumupConfigured() && Boolean(process.env.SANITY_API_WRITE_TOKEN)

/** Fills in sensible defaults for anything the café hasn't set yet. */
export function withShopDefaults(data: Partial<ShopSettings> | null | undefined): ShopSettings {
  if (!data) return FALLBACK_SHOP_SETTINGS
  const f = FALLBACK_SHOP_SETTINGS
  return {
    ...data,
    heading: data.heading || f.heading,
    intro: data.intro || f.intro,
    ordersOpen: data.ordersOpen ?? true,
    closedMessage: data.closedMessage || f.closedMessage,
    lowStockAt: data.lowStockAt ?? 3,
    thankYouMessage: data.thankYouMessage || f.thankYouMessage,
    collectionEnabled: data.collectionEnabled ?? true,
    collectionNote: data.collectionNote || f.collectionNote,
    deliveryEnabled: data.deliveryEnabled ?? true,
    deliveryFee: data.deliveryFee ?? f.deliveryFee,
    freeDeliveryOver: data.freeDeliveryOver ?? null,
    deliveryNote: data.deliveryNote || undefined,
  }
}

export async function getShopSettings() {
  return withShopDefaults(await sanityFetch<Partial<ShopSettings>>(SHOP_SETTINGS_QUERY))
}

export function toCheckoutConfig(s: ShopSettings): CheckoutConfig {
  return {
    live: checkoutLive(),
    ordersOpen: s.ordersOpen && (s.collectionEnabled || s.deliveryEnabled),
    closedMessage: s.closedMessage,
    collectionEnabled: s.collectionEnabled,
    collectionNote: s.collectionNote,
    deliveryEnabled: s.deliveryEnabled,
    deliveryFee: s.deliveryFee,
    freeDeliveryOver: s.freeDeliveryOver,
    deliveryNote: s.deliveryNote,
  }
}

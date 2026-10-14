/**
 * Brevo (brevo.com): Honey & Haven's own newsletter account.
 * Sign-ups go through Brevo's double opt-in: Brevo emails the person a confirm link and only adds
 * them to the list once they click it. Adding them to the list starts the welcome email (with the
 * discount code), which the owner sets up in Brevo → Automations.
 */
import { siteUrl } from './format'

const API = process.env.BREVO_API_URL || 'https://api.brevo.com/v3' // override only for local testing

function config() {
  const key = process.env.BREVO_API_KEY
  const listId = Number(process.env.BREVO_LIST_ID)
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID)
  if (!key || !listId || !templateId) return null
  return { key, listId, templateId }
}

export const brevoConfigured = () => config() !== null

export type SubscribeResult = { ok: true } | { ok: false; reason: 'not-configured' | 'rejected' | 'error' }

export async function subscribe(email: string, firstName?: string): Promise<SubscribeResult> {
  const c = config()
  if (!c) return { ok: false, reason: 'not-configured' }

  const send = (withName: boolean) =>
    fetch(`${API}/contacts/doubleOptinConfirmation`, {
      method: 'POST',
      headers: { 'api-key': c.key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email,
        ...(withName && firstName ? { attributes: { FIRSTNAME: firstName } } : {}),
        includeListIds: [c.listId],
        templateId: c.templateId,
        redirectionUrl: `${siteUrl()}/newsletter/confirmed`,
      }),
      cache: 'no-store',
    })

  try {
    let res = await send(true)
    // An account without a FIRSTNAME field: sign them up without the name rather than failing
    if (res.status === 400 && firstName) {
      const body = await res.clone().json().catch(() => ({}) as { message?: string })
      if (/attribute/i.test(String((body as { message?: string }).message))) res = await send(false)
    }
    if (res.ok) return { ok: true }
    const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
    // Already signed up: treat as success (and don't reveal who is on the list)
    if (body.code === 'duplicate_parameter') return { ok: true }
    console.error('[newsletter] Brevo', res.status, body.code, body.message)
    return { ok: false, reason: res.status === 400 ? 'rejected' : 'error' }
  } catch (err) {
    console.error('[newsletter] Brevo unreachable', err)
    return { ok: false, reason: 'error' }
  }
}

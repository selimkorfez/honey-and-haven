/**
 * The shop's emails:
 *  - when an order is placed: a confirmation with the PDF receipt to the customer, and a
 *    "new order" alert (same receipt, plus a button to open it in the Studio) to Dil
 *  - when Dil changes an order to Ready to collect / Posted / Refunded or cancelled: an update to
 *    the customer (once per status, see /api/orders/notify)
 *  - each morning: a summary of orders still to prepare or collect (see /api/cron/orders-summary)
 * Each email sent is noted on the order ("Emails sent" in the Studio) so none goes out twice.
 */
import { getWriteClient } from '@/sanity/lib/write'
import { siteUrl } from './format'
import { gbp } from './money'
import { emailConfigured, ownerEmail, sendEmail } from './email'
import { ORDER_FIELDS, placedDate, receiptPdf, type CafeDetails, type OrderDoc } from './receipt'
import { FALLBACK_SHOP_SETTINGS } from './fallback'

type Settings = CafeDetails & {
  hours?: { days: string; hours: string }[]
  hoursNote?: string
  instagram?: string
  collectionNote: string
  deliveryNote?: string
}

async function cafeSettings(): Promise<Settings> {
  const write = getWriteClient()
  const s = write
    ? await write.fetch<{
        name?: string
        address?: string
        phone?: string
        email?: string
        hours?: { days: string; hours: string }[]
        hoursNote?: string
        instagram?: string
        collectionNote?: string
        deliveryNote?: string
      } | null>(
        `{ "site": *[_id == "siteSettings"][0]{ name, address, phone, email, hours[]{ days, hours }, hoursNote, instagram },
           "shop": *[_id == "shopPage"][0]{ collectionNote, deliveryNote } }{ ...site, ...shop }`,
      )
    : null
  return {
    name: s?.name || 'Honey & Haven',
    address: s?.address || '41D The Parade, Oadby, LE2 5BB',
    phone: s?.phone,
    email: s?.email,
    website: siteUrl(),
    hours: s?.hours,
    hoursNote: s?.hoursNote,
    instagram: s?.instagram,
    collectionNote: s?.collectionNote || FALLBACK_SHOP_SETTINGS.collectionNote || 'Collect from the café during opening hours.',
    deliveryNote: s?.deliveryNote,
  }
}

export const receiptUrl = (o: Pick<OrderDoc, 'orderNumber' | 'receiptKey'>) =>
  `${siteUrl()}/api/receipt/${o.orderNumber}?k=${o.receiptKey ?? ''}`
const studioUrl = (o: Pick<OrderDoc, '_id'>) => `${siteUrl()}/studio/intent/edit/id=${encodeURIComponent(o._id)};type=order`
const firstName = (o: OrderDoc) => (o.customerName ?? '').trim().split(/\s+/)[0] || 'there'
const receiptName = (o: OrderDoc) => `Honey-and-Haven-receipt-${o.orderNumber}.pdf`

/* ------------------------------------------------------------------ layout */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const C = { cream: '#f3eadf', paper: '#fffaf3', brown: '#4a3329', muted: '#7a6a5f', line: '#e4d8ca', honey: '#c98a2b' }

function layout(opts: { preheader: string; title: string; body: string; cafe: Settings }) {
  const { cafe } = opts
  const site = cafe.website
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;background:${C.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.brown}">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:4px 0 22px"><a href="${site}" style="text-decoration:none;color:${C.brown}"><img src="${site}/email/logo.png" width="44" height="56" alt="" style="display:block;margin:0 auto 8px;border:0"><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:.06em">HONEY &amp; HAVEN</span></a></td></tr>
<tr><td style="background:${C.paper};border-radius:18px;padding:30px 28px">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:27px;line-height:1.2">${esc(opts.title)}</h1>
${opts.body}
</td></tr>
<tr><td align="center" style="padding:20px 10px;font-size:12px;line-height:1.6;color:${C.muted}">
${esc(cafe.name)} · ${esc((cafe.address ?? '').replace(/\n/g, ', '))}<br>
${[cafe.phone ? esc(cafe.phone) : '', `<a href="${site}" style="color:${C.muted}">${esc(site.replace(/^https?:\/\//, ''))}</a>`, cafe.instagram ? `<a href="${esc(cafe.instagram)}" style="color:${C.muted}">Instagram</a>` : ''].filter(Boolean).join(' · ')}
</td></tr></table></td></tr></table></body></html>`
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${html}</p>`
const button = (href: string, label: string) =>
  `<p style="margin:22px 0 6px"><a href="${href}" style="display:inline-block;background:${C.brown};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px">${esc(label)}</a></p>`
const small = (html: string) => `<p style="margin:12px 0 0;font-size:12.5px;line-height:1.6;color:${C.muted}">${html}</p>`

function itemsTable(o: OrderDoc) {
  const row = (l: string, r: string, strong = false) =>
    `<tr><td style="padding:7px 0;font-size:14px;${strong ? 'font-weight:700;' : ''}">${l}</td><td align="right" style="padding:7px 0;font-size:14px;white-space:nowrap;${strong ? 'font-weight:700;' : ''}">${r}</td></tr>`
  const items = (o.items ?? [])
    .map((it) => row(`${it.quantity} × ${esc(it.name)}${it.option ? ` <span style="color:${C.muted}">(${esc(it.option)})</span>` : ''}`, gbp(Math.round(it.unitPrice * it.quantity * 100) / 100)))
    .join('')
  const extra = [
    o.discount ? row(`Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ''}`, `−${gbp(o.discount)}`) : '',
    row(o.fulfilment === 'delivery' ? 'UK delivery' : 'Collect in store', o.deliveryFee ? gbp(o.deliveryFee) : 'Free'),
  ].join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}">
${items}${extra}<tr><td colspan="2" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr>${row(o.total === 0 && o.discount ? 'Total (covered by your code)' : 'Total paid', gbp(o.total ?? 0), true)}</table>`
}

function hoursHtml(cafe: Settings) {
  if (!cafe.hours?.length) return ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 14px">${cafe.hours
    .map((h) => `<tr><td style="padding:2px 18px 2px 0;font-size:14px;color:${C.muted}">${esc(h.days)}</td><td style="padding:2px 0;font-size:14px">${esc(h.hours)}</td></tr>`)
    .join('')}</table>`
}

const textItems = (o: OrderDoc) =>
  [
    ...(o.items ?? []).map((it) => `${it.quantity} x ${it.name}${it.option ? ` (${it.option})` : ''}  ${gbp(it.unitPrice * it.quantity)}`),
    o.discount ? `Discount${o.discountCode ? ` (${o.discountCode})` : ''}  -${gbp(o.discount)}` : '',
    `${o.fulfilment === 'delivery' ? 'UK delivery' : 'Collect in store'}  ${o.deliveryFee ? gbp(o.deliveryFee) : 'Free'}`,
    `Total paid  ${gbp(o.total ?? 0)}`,
  ]
    .filter(Boolean)
    .join('\n')

/* ------------------------------------------------------------------ bookkeeping */

const alreadySent = (o: OrderDoc, key: string) => (o.emailsSent ?? []).some((s) => s === key || s.startsWith(`${key} ·`))

/**
 * Notes the emails on the order *before* sending them, in one change that only succeeds if nobody
 * else changed the order meanwhile: if two requests try at once (SumUp's notification and the
 * thank-you page, or a double click on Publish), only one sends. Returns the noted entries.
 */
async function claim(o: OrderDoc, keys: string[]): Promise<Map<string, string> | null> {
  const write = getWriteClient()
  const todo = keys.filter((k) => !alreadySent(o, k))
  if (!write || !todo.length || !o._rev) return null
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const stamps = new Map(todo.map((k) => [k, `${k} · ${when}`]))
  try {
    const tx = write.transaction().patch(write.patch(o._id).ifRevisionId(o._rev).setIfMissing({ emailsSent: [] }).append('emailsSent', [...stamps.values()]))
    // an unpublished edit open in the Studio gets the note too, so publishing it later keeps it
    if (await write.getDocument(`drafts.${o._id}`)) {
      tx.patch(write.patch(`drafts.${o._id}`).setIfMissing({ emailsSent: [] }).append('emailsSent', [...stamps.values()]))
    }
    await tx.commit({ visibility: 'sync' })
    return stamps
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode !== 409) console.error('[emails] could not note emails', o._id, err)
    return null
  }
}

/** Takes a note back off the order when its email couldn't be sent (so a later try can send it). */
async function unclaim(id: string, stamp: string) {
  const write = getWriteClient()
  if (!write) return
  const unset = [`emailsSent[@ == ${JSON.stringify(stamp)}]`]
  const tx = write.transaction().patch(id, (p) => p.unset(unset))
  if (await write.getDocument(`drafts.${id}`)) tx.patch(`drafts.${id}`, (p) => p.unset(unset))
  await tx.commit().catch((err) => console.error('[emails] could not undo note', id, err))
}

export async function loadOrder(id: string) {
  const write = getWriteClient()
  return write ? write.fetch<OrderDoc | null>(`*[_id == $id][0]{ ${ORDER_FIELDS} }`, { id }) : null
}

/* ------------------------------------------------------------------ order placed */

/** Confirmation (customer) and "new order" (Dil), both with the PDF receipt. Safe to call twice. */
export async function sendOrderPlacedEmails(orderId: string) {
  if (!emailConfigured()) return
  const o = await loadOrder(orderId)
  if (!o) return
  const owner = ownerEmail()
  const claimed = await claim(o, [...(o.email ? ['Order confirmation'] : []), ...(owner ? ['New order alert'] : [])])
  if (!claimed) return
  const cafe = await cafeSettings()
  const pdf = await receiptPdf(o, cafe)
  const attachments = [{ filename: receiptName(o), content: pdf, contentType: 'application/pdf' }]
  const collect = o.fulfilment !== 'delivery'
  const test = o.testOrder ? 'TEST · ' : ''

  if (o.email && claimed.has('Order confirmation')) {
    const next = collect
      ? `${esc(cafe.collectionNote)}`
      : esc(cafe.deliveryNote || 'We’ll post your order soon and email you when it’s on its way.')
    const ok = await sendEmail({
      to: o.email,
      replyTo: cafe.email || undefined,
      subject: `${test}Thank you for your order ${o.orderNumber}`,
      html: layout({
        cafe,
        preheader: `Order ${o.orderNumber} · ${gbp(o.total ?? 0)} · ${collect ? 'collect in store' : 'UK delivery'}`,
        title: `Thank you, ${esc(firstName(o))}`,
        body:
          p(`We’ve got your order <strong>${o.orderNumber}</strong> and we’re on it.`) +
          p(next) +
          itemsTable(o) +
          (!collect && o.address ? small(`<strong>Delivering to</strong><br>${esc(o.address).replace(/\n/g, '<br>')}`) : '') +
          button(receiptUrl(o), 'Download your receipt') +
          small(`Your receipt is attached as a PDF too. Questions? Just reply to this email${cafe.phone ? ` or call us on ${esc(cafe.phone)}` : ''}.`),
      }),
      text: `Thank you, ${firstName(o)}\n\nWe've got your order ${o.orderNumber}.\n\n${textItems(o)}\n\n${collect ? cafe.collectionNote : cafe.deliveryNote || "We'll post your order soon."}\n\nReceipt: ${receiptUrl(o)}\n\n${cafe.name}, ${cafe.address}`,
      attachments,
    })
    if (!ok) await unclaim(o._id, claimed.get('Order confirmation')!)
  }

  if (owner && claimed.has('New order alert')) {
    const ok = await sendEmail({
      to: owner,
      replyTo: o.email || undefined,
      subject: `${test}New order ${o.orderNumber} · ${gbp(o.total ?? 0)} · ${collect ? 'Collect' : 'Delivery'} · ${o.customerName ?? ''}`,
      html: layout({
        cafe,
        preheader: `${(o.items ?? []).map((i) => `${i.quantity} × ${i.name}`).join(', ')}`,
        title: `New ${collect ? 'collection' : 'delivery'} order`,
        body:
          p(`<strong>${o.orderNumber}</strong> · ${esc(placedDate(o.placedAt))}`) +
          p(
            `<strong>${esc(o.customerName ?? '')}</strong><br><a href="mailto:${esc(o.email ?? '')}" style="color:${C.brown}">${esc(o.email ?? '')}</a>${o.phone ? `<br><a href="tel:${esc(o.phone)}" style="color:${C.brown}">${esc(o.phone)}</a>` : ''}`,
          ) +
          (!collect && o.address ? p(`<strong>Post to</strong><br>${esc(o.address).replace(/\n/g, '<br>')}`) : '') +
          itemsTable(o) +
          small(`${esc(o.paymentProvider ?? '')}${o.transactionCode ? ` · transaction ${esc(o.transactionCode)}` : ''}`) +
          button(studioUrl(o), 'Open the order in the Studio') +
          small(
            `When it’s ${collect ? 'ready to collect' : 'posted'}, change its status in the Studio and press Publish: the customer gets an email automatically.${o.testOrder ? ' <strong>This is a test order: no money was taken.</strong>' : ''} Reply to this email to write to the customer.`,
          ),
      }),
      text: `New order ${o.orderNumber}\n${o.customerName} <${o.email}> ${o.phone ?? ''}\n${collect ? 'Collect in store' : `Post to:\n${o.address}`}\n\n${textItems(o)}\n\n${o.paymentProvider ?? ''} ${o.transactionCode ?? ''}\n\nOpen in the Studio: ${studioUrl(o)}`,
      attachments,
    })
    if (!ok) await unclaim(o._id, claimed.get('New order alert')!)
  }
}

/* ------------------------------------------------------------------ status updates */

/** Statuses that email the customer. */
export const STATUS_EMAILS = ['ready', 'posted', 'cancelled'] as const
export type StatusEmail = (typeof STATUS_EMAILS)[number]
const STATUS_KEY: Record<StatusEmail, string> = { ready: 'Ready to collect', posted: 'Posted', cancelled: 'Cancelled / refunded' }

export const trackingUrl = (n: string) => `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n.replace(/\s+/g, ''))}`

/** Emails the customer about the order's current status (once per status). Returns what happened. */
export async function sendStatusEmail(o: OrderDoc): Promise<'sent' | 'skipped' | 'failed'> {
  const status = o.status as StatusEmail
  if (!STATUS_EMAILS.includes(status) || !o.email || o.emailUpdates === false || !emailConfigured()) return 'skipped'
  const key = `Update: ${STATUS_KEY[status]}`
  const claimed = await claim(o, [key])
  if (!claimed) return 'skipped'
  const cafe = await cafeSettings()
  const test = o.testOrder ? 'TEST · ' : ''
  let subject: string
  let title: string
  let body: string
  let text: string
  if (status === 'ready') {
    subject = `${test}Your order ${o.orderNumber} is ready to collect`
    title = `It’s ready, ${esc(firstName(o))}!`
    body =
      p(`Your order <strong>${o.orderNumber}</strong> is packed and waiting for you at the café.`) +
      p(`<strong>${esc(cafe.address ?? '').replace(/\n/g, ', ')}</strong>`) +
      hoursHtml(cafe) +
      (cafe.hoursNote ? small(esc(cafe.hoursNote)) : '') +
      p('Just give us your name or order number at the counter.') +
      itemsTable(o)
    text = `Your order ${o.orderNumber} is ready to collect from ${cafe.address}.\n\n${textItems(o)}`
  } else if (status === 'posted') {
    subject = `${test}Your order ${o.orderNumber} is on its way`
    title = 'Your order is on its way'
    body =
      p(`Good news, ${esc(firstName(o))}: we’ve posted your order <strong>${o.orderNumber}</strong>.`) +
      (o.trackingNumber
        ? p(`Royal Mail tracking number: <strong>${esc(o.trackingNumber)}</strong>`) + button(trackingUrl(o.trackingNumber), 'Track your parcel')
        : p('It usually arrives within 1–3 working days.')) +
      (o.address ? small(`<strong>Delivering to</strong><br>${esc(o.address).replace(/\n/g, '<br>')}`) : '') +
      itemsTable(o)
    text = `We've posted your order ${o.orderNumber}.${o.trackingNumber ? `\nTracking: ${o.trackingNumber} ${trackingUrl(o.trackingNumber)}` : ''}\n\n${textItems(o)}`
  } else {
    subject = `${test}Your order ${o.orderNumber} has been cancelled`
    title = 'Your order has been cancelled'
    body =
      p(`Hi ${esc(firstName(o))}, your order <strong>${o.orderNumber}</strong> has been cancelled.`) +
      (o.total
        ? p(`We’ve refunded <strong>${gbp(o.total)}</strong> to the card you paid with. It usually shows in your account within 3–5 working days.`)
        : '') +
      p(`If you weren’t expecting this, just reply to this email${cafe.phone ? ` or call us on ${esc(cafe.phone)}` : ''} and we’ll sort it out.`)
    text = `Your order ${o.orderNumber} has been cancelled.${o.total ? ` We've refunded ${gbp(o.total)}; it usually shows within 3-5 working days.` : ''}`
  }
  const ok = await sendEmail({
    to: o.email,
    replyTo: cafe.email || undefined,
    subject,
    html: layout({ cafe, preheader: subject, title, body: body + small(`Order ${o.orderNumber} · <a href="${receiptUrl(o)}" style="color:${C.muted}">receipt</a>`) }),
    text: `${text}\n\nReceipt: ${receiptUrl(o)}\n${cafe.name}, ${cafe.address}`,
  })
  if (!ok) {
    await unclaim(o._id, claimed.get(key)!)
    return 'failed'
  }
  return 'sent'
}

/* ------------------------------------------------------------------ daily summary */

/** Morning email to Dil: orders still to prepare or post, and ones waiting to be collected. */
export async function sendDailySummary(): Promise<{ sent: boolean; open: number }> {
  const write = getWriteClient()
  const owner = ownerEmail()
  if (!write || !owner || !emailConfigured()) return { sent: false, open: 0 }
  const orders = await write.fetch<OrderDoc[]>(
    `*[_type == "order" && !(_id in path("drafts.**")) && (!defined(status) || status in ["new", "ready"])] | order(placedAt asc){ ${ORDER_FIELDS} }`,
  )
  if (!orders.length) return { sent: false, open: 0 }
  const cafe = await cafeSettings()
  const todo = orders.filter((o) => !o.status || o.status === 'new')
  const waiting = orders.filter((o) => o.status === 'ready')
  const days = (iso?: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0)
  const list = (os: OrderDoc[]) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border-top:1px solid ${C.line}">${os
      .map(
        (o) =>
          `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.45"><a href="${studioUrl(o)}" style="color:${C.brown};font-weight:700">${o.orderNumber}</a> · ${esc(o.customerName ?? '')} · ${o.fulfilment === 'delivery' ? 'Post' : 'Collect'}${days(o.placedAt) ? ` · <span style="color:${C.honey}">${days(o.placedAt)} day${days(o.placedAt) > 1 ? 's' : ''} ago</span>` : ''}<br><span style="color:${C.muted}">${esc((o.items ?? []).map((i) => `${i.quantity} × ${i.name}${i.option ? ` (${i.option})` : ''}`).join(', '))}</span></td></tr>`,
      )
      .join('')}</table>`
  const title = `${todo.length ? `${todo.length} to prepare` : 'Nothing to prepare'}${waiting.length ? ` · ${waiting.length} waiting for collection` : ''}`
  const ok = await sendEmail({
    to: owner,
    subject: `Today’s orders: ${title}`,
    html: layout({
      cafe,
      preheader: title,
      title: 'Good morning! Today’s orders',
      body:
        (todo.length ? `<h2 style="margin:8px 0 4px;font-size:16px">To prepare or post (${todo.length})</h2>${list(todo)}` : '') +
        (waiting.length ? `<h2 style="margin:8px 0 4px;font-size:16px">Ready, waiting to be collected (${waiting.length})</h2>${list(waiting)}` : '') +
        button(`${siteUrl()}/studio/structure/orders;toPrepare`, 'Open orders in the Studio') +
        small('Sent each morning when there are open orders. Mark orders as Done in the Studio once they’ve gone.'),
    }),
    text: `Today's orders: ${title}\n\n${orders.map((o) => `${o.orderNumber} ${o.customerName} (${o.status ?? 'new'})`).join('\n')}`,
  })
  return { sent: ok, open: orders.length }
}

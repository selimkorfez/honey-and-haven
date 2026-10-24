/**
 * The PDF receipt for an order: attached to the order emails, and downloadable from the
 * thank-you page and the order in the Studio (/api/receipt/[order]?k=…).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { LOGO_PATH } from '@/components/LogoMark'
import { gbp } from './money'

export type OrderDoc = {
  _id: string
  _rev?: string
  orderNumber: string
  status?: string
  placedAt?: string
  fulfilment?: 'collection' | 'delivery'
  customerName?: string
  email?: string
  phone?: string
  address?: string
  items?: { name: string; option?: string; quantity: number; unitPrice: number }[]
  subtotal?: number
  deliveryFee?: number
  discount?: number
  discountCode?: string
  total?: number
  paymentProvider?: string
  transactionCode?: string
  trackingNumber?: string
  receiptKey?: string
  testOrder?: boolean
  emailsSent?: string[]
  emailUpdates?: boolean
}

export type CafeDetails = { name: string; address?: string; phone?: string; email?: string; website: string }

/** Everything the emails and the receipt need to know about an order. */
export const ORDER_FIELDS = `_id, _rev, orderNumber, status, placedAt, fulfilment, customerName, email, phone, address,
  items[]{ name, option, quantity, unitPrice }, subtotal, deliveryFee, discount, discountCode, total,
  paymentProvider, transactionCode, trackingNumber, receiptKey, testOrder, emailsSent, emailUpdates`

/** LOGO_PATH with every y value negated (all its commands take x,y pairs). */
const LOGO_FLIPPED = (() => {
  let i = 0
  return LOGO_PATH.replace(/-?\d*\.?\d+/g, (n) => (i++ % 2 ? String(-Number(n)) : n))
})()

const BROWN = rgb(0.29, 0.2, 0.16)
const MUTED = rgb(0.47, 0.4, 0.36)
const LINE = rgb(0.85, 0.8, 0.74)
const CREAM = rgb(0.953, 0.918, 0.875)

/** pdf-lib's built-in fonts only know the Windows-1252 characters: swap the few others we use. */
const safe = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/−/g, '-')
    .replace(/[^\u0000-ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, '')

export const placedDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

export async function receiptPdf(order: OrderDoc, cafe: CafeDetails): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Receipt ${order.orderNumber}`)
  pdf.setAuthor(cafe.name)
  const page = pdf.addPage([595.28, 841.89]) // A4
  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const sans = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()
  const left = 56
  const right = width - 56

  const text = (p: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = BROWN, align: 'left' | 'right' = 'left') => {
    const t = safe(s)
    const w = font.widthOfTextAtSize(t, size)
    p.drawText(t, { x: align === 'right' ? x - w : x, y, size, font, color })
  }

  // Header band with the bee monogram
  page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: CREAM })
  // the monogram's outline is stored y-up (see LogoMark), so flip it for pdf-lib, which reads y-down
  page.drawSvgPath(LOGO_FLIPPED, { x: left, y: height - 122, scale: 0.022, color: BROWN })
  text(page, cafe.name, left + 52, height - 72, serif, 26)
  if (cafe.address) text(page, cafe.address.replace(/\n/g, ', '), left + 52, height - 92, sans, 9.5, MUTED)
  const contact = [cafe.phone, cafe.email, cafe.website.replace(/^https?:\/\//, '')].filter(Boolean).join('  ·  ')
  text(page, contact, left + 52, height - 106, sans, 9.5, MUTED)
  text(page, 'RECEIPT', right, height - 72, bold, 11, BROWN, 'right')
  text(page, order.orderNumber, right, height - 88, sans, 10, MUTED, 'right')

  let y = height - 190
  // Order details, two columns
  const rows: [string, string][] = [
    ['Date', placedDate(order.placedAt)],
    ['Customer', order.customerName ?? ''],
    ['Email', order.email ?? ''],
    ...(order.phone ? [['Phone', order.phone] as [string, string]] : []),
    ['Order type', order.fulfilment === 'delivery' ? 'UK delivery' : 'Collect in store'],
  ]
  for (const [k, v] of rows) {
    text(page, k, left, y, bold, 9.5, MUTED)
    text(page, v, left + 90, y, sans, 10.5)
    y -= 17
  }
  if (order.fulfilment === 'delivery' && order.address) {
    text(page, 'Deliver to', left, y, bold, 9.5, MUTED)
    for (const line of order.address.split('\n')) {
      text(page, line, left + 90, y, sans, 10.5)
      y -= 15
    }
    y -= 2
  }

  // Items
  y -= 18
  text(page, 'Item', left, y, bold, 9.5, MUTED)
  text(page, 'Qty', right - 170, y, bold, 9.5, MUTED, 'right')
  text(page, 'Each', right - 90, y, bold, 9.5, MUTED, 'right')
  text(page, 'Amount', right, y, bold, 9.5, MUTED, 'right')
  y -= 8
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: LINE })
  y -= 18
  for (const it of order.items ?? []) {
    const name = `${it.name}${it.option ? ` (${it.option})` : ''}`
    text(page, name.length > 60 ? `${name.slice(0, 58)}…` : name, left, y, sans, 10.5)
    text(page, String(it.quantity), right - 170, y, sans, 10.5, BROWN, 'right')
    text(page, gbp(it.unitPrice), right - 90, y, sans, 10.5, BROWN, 'right')
    text(page, gbp(Math.round(it.unitPrice * it.quantity * 100) / 100), right, y, sans, 10.5, BROWN, 'right')
    y -= 20
    if (y < 200) break
  }
  page.drawLine({ start: { x: left, y: y + 6 }, end: { x: right, y: y + 6 }, thickness: 0.8, color: LINE })
  y -= 14

  // Totals
  const totals: [string, string][] = [['Items', gbp(order.subtotal ?? 0)]]
  if (order.discount) totals.push([`Discount${order.discountCode ? ` (${order.discountCode})` : ''}`, `-${gbp(order.discount)}`])
  totals.push([order.fulfilment === 'delivery' ? 'Delivery' : 'Collection', order.deliveryFee ? gbp(order.deliveryFee) : 'Free'])
  for (const [k, v] of totals) {
    text(page, k, right - 170, y, sans, 10.5, MUTED)
    text(page, v, right, y, sans, 10.5, BROWN, 'right')
    y -= 18
  }
  y -= 4
  page.drawRectangle({ x: right - 182, y: y - 10, width: 182, height: 28, color: CREAM })
  text(page, order.total === 0 && order.discount ? 'Total (code)' : 'Total paid', right - 170, y, bold, 12)
  text(page, gbp(order.total ?? 0), right - 10, y, bold, 12, BROWN, 'right')
  y -= 44

  // Payment
  text(page, 'Payment', left, y, bold, 9.5, MUTED)
  text(page, order.paymentProvider ?? '', left + 90, y, sans, 10.5)
  y -= 17
  if (order.transactionCode) {
    text(page, 'Transaction', left, y, bold, 9.5, MUTED)
    text(page, order.transactionCode, left + 90, y, sans, 10.5)
    y -= 17
  }
  if (order.testOrder) {
    y -= 8
    text(page, 'TEST ORDER: no money was taken.', left, y, bold, 10.5, rgb(0.7, 0.25, 0.2))
  }

  // Footer
  text(page, 'Thank you for supporting us!', left, 70, serif, 13)
  text(page, `Keep this receipt with your order number ${order.orderNumber}.`, left, 52, sans, 9, MUTED)
  return pdf.save()
}

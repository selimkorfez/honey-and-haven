/**
 * Sending email (order confirmations, new-order alerts, status updates, the daily summary).
 *
 * Sent through the café's SMTP account:
 *   SMTP_HOST           outgoing mail server (for IONOS UK: smtp.ionos.co.uk)
 *   SMTP_PORT           outgoing mail port (for IONOS STARTTLS: 587)
 *   SMTP_USER           the café's email address (emails come from here, replies go back to it)
 *   SMTP_PASSWORD       the mailbox password
 *   ORDER_NOTIFY_EMAIL  optional: where Dil's order emails go (defaults to SMTP_USER;
 *                       several addresses can be separated with commas)
 * Legacy GMAIL_USER and GMAIL_APP_PASSWORD values remain supported.
 * Server only. Without these, emails are simply skipped and orders still work.
 *
 * On a computer running the site, EMAIL_DEV=1 writes the emails to files instead of sending them.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const devMode = () => process.env.EMAIL_DEV === '1' && !process.env.VERCEL
const emailUser = () => process.env.SMTP_USER || process.env.GMAIL_USER || ''
const emailPassword = () => process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || ''

export const emailConfigured = () => Boolean(emailUser() && emailPassword()) || devMode()

/** Where Dil's order emails go. */
export const ownerEmail = () => process.env.ORDER_NOTIFY_EMAIL || emailUser() || (devMode() ? 'owner@example.com' : '')

let transport: Transporter | null = null
function getTransport() {
  if (transport) return transport
  if (devMode()) {
    transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
    return transport
  }

  const auth = { user: emailUser(), pass: emailPassword().replace(/\s+/g, '') }
  const host = process.env.SMTP_HOST
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = process.env.SMTP_SECURE === 'true' || port === 465
    transport = nodemailer.createTransport({ host, port, secure, requireTLS: !secure, auth })
  } else {
    transport = nodemailer.createTransport({ service: 'gmail', auth })
  }
  return transport
}

export type Email = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: { filename: string; content: Buffer | Uint8Array; contentType?: string }[]
}

/** Sends one email. Never throws: returns false (and logs) if it couldn't be sent. */
export async function sendEmail(mail: Email): Promise<boolean> {
  if (!emailConfigured() || !mail.to) return false
  const from = process.env.EMAIL_FROM || emailUser() || 'cafe@example.com'
  try {
    const info = await getTransport().sendMail({
      from: { name: 'Honey & Haven', address: from },
      to: mail.to,
      replyTo: mail.replyTo || from,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments?.map((a) => ({ ...a, content: Buffer.from(a.content) })),
    })
    if (devMode()) {
      const dir = process.env.EMAIL_DEV_DIR || join(process.cwd(), '.emails')
      mkdirSync(dir, { recursive: true })
      const name = `${Date.now()}-${mail.subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}`
      writeFileSync(join(dir, `${name}.html`), mail.html)
      writeFileSync(join(dir, `${name}.eml`), (info as unknown as { message: Buffer }).message)
      for (const a of mail.attachments ?? []) writeFileSync(join(dir, `${name}-${a.filename}`), Buffer.from(a.content))
    }
    return true
  } catch (err) {
    console.error('[email] could not send', mail.subject, err)
    return false
  }
}

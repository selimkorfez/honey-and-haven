import { useToast } from '@sanity/ui/toast'
import type { DocumentActionComponent } from 'sanity'

/** Statuses that email the customer (keep in step with STATUS_EMAILS in src/lib/orderEmails.ts). */
const EMAILED = ['ready', 'posted', 'cancelled']

/**
 * The normal Publish button for orders, plus: once published, if the order is now Ready to collect,
 * Posted or Refunded/cancelled, the website emails the customer (see /api/orders/notify, which
 * sends each of those emails only once). A small message confirms it.
 */
export function withOrderNotify(publish: DocumentActionComponent): DocumentActionComponent {
  const PublishOrder: DocumentActionComponent = (props) => {
    const toast = useToast()
    const result = publish(props)
    if (!result) return result
    const doc = (props.draft ?? props.published) as { status?: string; emailUpdates?: boolean } | null
    const status = doc?.status
    return {
      ...result,
      onHandle: () => {
        result.onHandle?.()
        if (!status || !EMAILED.includes(status) || doc?.emailUpdates === false) return
        fetch('/api/orders/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: props.id, status }) })
          .then((r) => r.json())
          .then((d: { result?: string }) => {
            if (d.result === 'sent') toast.push({ status: 'success', title: 'Customer emailed', description: 'They’ve been told about the new status.' })
            else if (d.result === 'failed') toast.push({ status: 'warning', title: 'Couldn’t email the customer', description: 'The order is saved. Please let them know another way.' })
          })
          .catch(() => {})
      },
    }
  }
  PublishOrder.action = publish.action
  PublishOrder.displayName = 'PublishOrder'
  return PublishOrder
}

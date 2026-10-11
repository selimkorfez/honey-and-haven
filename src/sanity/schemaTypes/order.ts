import { defineArrayMember, defineField, defineType } from 'sanity'
import { PackageIcon } from '@sanity/icons/Package'

export const ORDER_STATUSES = [
  { title: 'New, to prepare', value: 'new' },
  { title: 'Ready to collect', value: 'ready' },
  { title: 'Posted', value: 'posted' },
  { title: 'Done', value: 'done' },
  { title: 'Refunded / cancelled', value: 'cancelled' },
]

/**
 * Orders are created automatically when someone pays online.
 * Staff only change the status (and can add notes).
 */
export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ORDER_STATUSES, layout: 'radio' },
      initialValue: 'new',
      description: 'Change this as you go, then press Publish.',
    }),
    defineField({ name: 'staffNotes', title: 'Staff notes', type: 'text', rows: 2, description: 'Only visible here, e.g. “Royal Mail tracking AB123456789GB”.' }),
    defineField({ name: 'orderNumber', title: 'Order number', type: 'string', readOnly: true }),
    defineField({ name: 'placedAt', title: 'Placed', type: 'datetime', readOnly: true }),
    defineField({
      name: 'fulfilment',
      title: 'Collection or delivery',
      type: 'string',
      readOnly: true,
      options: { list: [{ title: 'Collect in store', value: 'collection' }, { title: 'UK delivery', value: 'delivery' }] },
    }),
    defineField({ name: 'customerName', title: 'Name', type: 'string', readOnly: true }),
    defineField({ name: 'email', title: 'Email', type: 'string', readOnly: true }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', readOnly: true }),
    defineField({ name: 'address', title: 'Delivery address', type: 'text', rows: 4, readOnly: true, hidden: ({ document }) => document?.fulfilment !== 'delivery' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orderLine',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'option', type: 'string' }),
            defineField({ name: 'quantity', type: 'number' }),
            defineField({ name: 'unitPrice', title: 'Price each (£)', type: 'number' }),
            defineField({ name: 'product', type: 'reference', to: [{ type: 'product' }], weak: true }),
          ],
          preview: {
            select: { name: 'name', option: 'option', quantity: 'quantity', unitPrice: 'unitPrice' },
            prepare: ({ name, option, quantity, unitPrice }) => ({
              title: `${quantity ?? 1} × ${name}${option ? ` (${option})` : ''}`,
              subtitle: typeof unitPrice === 'number' ? `£${unitPrice.toFixed(2)} each` : undefined,
            }),
          },
        }),
      ],
    }),
    defineField({ name: 'subtotal', title: 'Items (£)', type: 'number', readOnly: true }),
    defineField({ name: 'deliveryFee', title: 'Delivery (£)', type: 'number', readOnly: true }),
    defineField({ name: 'discount', title: 'Discount (£)', type: 'number', readOnly: true }),
    defineField({ name: 'total', title: 'Total paid (£)', type: 'number', readOnly: true }),
    defineField({ name: 'stripeLink', title: 'View payment in Stripe', type: 'url', readOnly: true, description: 'Refunds are done from Stripe.' }),
    defineField({ name: 'stripeSessionId', title: 'Stripe checkout ID', type: 'string', readOnly: true, hidden: true }),
  ],
  orderings: [{ title: 'Newest first', name: 'placedDesc', by: [{ field: 'placedAt', direction: 'desc' }] }],
  preview: {
    select: { number: 'orderNumber', name: 'customerName', total: 'total', status: 'status', fulfilment: 'fulfilment', placedAt: 'placedAt' },
    prepare: ({ number, name, total, status, fulfilment, placedAt }) => {
      const s = ORDER_STATUSES.find((x) => x.value === status)?.title ?? 'New'
      const when = placedAt ? new Date(placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
      return {
        title: `${number ?? 'Order'} · ${name ?? ''}`,
        subtitle: [s, fulfilment === 'delivery' ? 'Delivery' : 'Collect', typeof total === 'number' ? `£${total.toFixed(2)}` : null, when].filter(Boolean).join(' · '),
      }
    },
  },
})

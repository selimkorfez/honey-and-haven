import { defineField, defineType } from 'sanity'
import { BasketIcon } from '@sanity/icons/Basket'
import { photoFields } from './fields'

export const shopPage = defineType({
  name: 'shopPage',
  title: 'Shop settings',
  type: 'document',
  icon: BasketIcon,
  groups: [
    { name: 'page', title: 'Shop page', default: true },
    { name: 'orders', title: 'Online orders' },
    { name: 'collection', title: 'Collection' },
    { name: 'delivery', title: 'Delivery' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string', group: 'page' }),
    defineField({ name: 'intro', title: 'Intro text', type: 'text', rows: 3, group: 'page' }),
    defineField({ name: 'bannerImage', title: 'Banner photo (optional)', type: 'image', group: 'page', options: { hotspot: true }, fields: photoFields }),

    defineField({
      name: 'ordersOpen',
      title: 'Take online orders',
      type: 'boolean',
      group: 'orders',
      initialValue: true,
      description: 'Turn off while you’re away or restocking. Products stay visible but can’t be bought.',
    }),
    defineField({
      name: 'closedMessage',
      title: 'Message while online orders are off',
      type: 'string',
      group: 'orders',
      initialValue: 'Online orders are paused for now. Everything is still available in store.',
    }),
    defineField({
      name: 'lowStockAt',
      title: 'Show “Only a few left” at',
      type: 'number',
      group: 'orders',
      initialValue: 3,
      description: 'When stock is this number or lower, the product shows “Only 2 left” etc.',
      validation: (r) => r.min(0).integer(),
    }),
    defineField({
      name: 'thankYouMessage',
      title: 'Thank-you message',
      type: 'text',
      rows: 3,
      group: 'orders',
      description: 'Shown after someone pays. They also get a receipt email from Stripe.',
    }),

    defineField({ name: 'collectionEnabled', title: 'Offer collection in store', type: 'boolean', group: 'collection', initialValue: true }),
    defineField({
      name: 'collectionNote',
      title: 'Collection details',
      type: 'text',
      rows: 2,
      group: 'collection',
      description: 'Shown in the basket and at checkout, e.g. “Ready to collect within 2 days. We’ll email you when it’s ready.”',
    }),

    defineField({ name: 'deliveryEnabled', title: 'Offer UK delivery', type: 'boolean', group: 'delivery', initialValue: true }),
    defineField({ name: 'deliveryFee', title: 'Delivery fee (£)', type: 'number', group: 'delivery', initialValue: 3.95, validation: (r) => r.min(0).precision(2) }),
    defineField({
      name: 'freeDeliveryOver',
      title: 'Free delivery on orders over (£)',
      type: 'number',
      group: 'delivery',
      description: 'Leave empty for no free delivery.',
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({
      name: 'deliveryNote',
      title: 'Delivery details',
      type: 'text',
      rows: 2,
      group: 'delivery',
      description: 'e.g. “Sent by Royal Mail Tracked 48, usually 2–4 working days.”',
    }),

    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Shop settings' }) },
})

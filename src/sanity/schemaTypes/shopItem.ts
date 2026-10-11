import { defineField, defineType } from 'sanity'
import { BasketIcon } from '@sanity/icons/Basket'

export const shopItem = defineType({
  name: 'shopItem',
  title: 'Shop item',
  type: 'document',
  icon: BasketIcon,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', description: 'e.g. "Natural honey" or "Bee tote bag"', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
    defineField({ name: 'price', title: 'Price (£)', type: 'number', description: 'Optional. Leave empty to show "Ask in store".', validation: (r) => r.min(0).precision(2) }),
    defineField({ name: 'priceNote', title: 'Price note (optional)', type: 'string', description: 'e.g. "From £6" — shown instead of the price.' }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Leave empty to show the bee monogram instead.',
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })],
    }),
    defineField({ name: 'link', title: 'Buy online link (optional)', type: 'url', description: 'Only if it can be bought online, e.g. an Etsy or TikTok Shop page.' }),
    defineField({ name: 'available', title: 'Show on website', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Position', type: 'number', description: 'Lower numbers show first.', initialValue: 10 }),
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', price: 'price', media: 'image', available: 'available' },
    prepare: ({ title, price, media, available }) => ({
      title,
      subtitle: [typeof price === 'number' ? `£${price.toFixed(2)}` : 'Ask in store', available === false ? 'HIDDEN' : null].filter(Boolean).join(' · '),
      media,
    }),
  },
})

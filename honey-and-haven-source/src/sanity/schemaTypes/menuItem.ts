import { defineField, defineType, defineArrayMember } from 'sanity'
import { BillIcon } from '@sanity/icons/Bill'

export const DIETARY_OPTIONS = [
  { title: 'Vegetarian (V)', value: 'v' },
  { title: 'Vegan (VG)', value: 'vg' },
  { title: 'Gluten free (GF)', value: 'gf' },
  { title: 'Dairy free (DF)', value: 'df' },
  { title: 'Contains nuts (N)', value: 'n' },
]

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu item',
  type: 'document',
  icon: BillIcon,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
    defineField({
      name: 'price',
      title: 'Price (£)',
      type: 'number',
      description: 'Just the number, e.g. 3.80',
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({
      name: 'priceNote',
      title: 'Price note (optional)',
      type: 'string',
      description: 'e.g. "Regular / Large £3.40 / £3.90" — shown instead of the price above if filled in.',
    }),
    defineField({
      name: 'dietary',
      title: 'Dietary labels',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: DIETARY_OPTIONS, layout: 'grid' },
    }),
    defineField({
      name: 'image',
      title: 'Photo (optional)',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })],
    }),
    defineField({
      name: 'available',
      title: 'Show on website',
      type: 'boolean',
      description: 'Switch off to hide the item (e.g. seasonal or sold out) without deleting it.',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Feature on home page',
      type: 'boolean',
      description: 'Shows this item in the "Featured" section on the home page. Pick 3–6 favourites.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Position within category',
      type: 'number',
      description: 'Lower numbers show first.',
      initialValue: 10,
    }),
  ],
  orderings: [{ title: 'Menu position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', price: 'price', category: 'category.title', media: 'image', available: 'available', featured: 'featured' },
    prepare: ({ title, price, category, media, available, featured }) => ({
      title: `${title}${featured ? ' ★' : ''}`,
      subtitle: [category, typeof price === 'number' ? `£${price.toFixed(2)}` : null, available === false ? 'HIDDEN' : null]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})

import { defineArrayMember, defineField, defineType } from 'sanity'
import { BasketIcon } from '@sanity/icons/Basket'
import { photoFields, richText } from './fields'

const OVERSOLD = 'Below zero means more sold online than you had in stock. Set this to how many you really have.'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: BasketIcon,
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'stock', title: 'Price & stock' },
    { name: 'options', title: 'Sizes / options' },
    { name: 'display', title: 'Where it shows' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: 'details', description: 'e.g. "Natural honey 340g" or "Bee tote bag"', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      group: 'details',
      description: 'Click "Generate" to make it from the name. This becomes /shop/your-product.',
      options: { source: 'name', maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'productCategory' }], group: 'details' }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      group: 'details',
      description: 'The first photo is the main one. Drag to reorder. Square photos look best. Leave empty to show the bee monogram.',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: photoFields })],
      options: { layout: 'grid' },
    }),
    defineField({ name: 'summary', title: 'Short description', type: 'text', rows: 2, group: 'details', description: 'One or two lines, shown on the shop page.', validation: (r) => r.max(200) }),
    richText('description', 'Full description', { group: 'details', description: 'Shown on the product’s own page: size, ingredients, care instructions…' }),

    defineField({
      name: 'price',
      title: 'Price (£)',
      type: 'number',
      group: 'stock',
      description: 'Including VAT if you charge it.',
      validation: (r) => r.required().min(0.3).precision(2),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Was price (£, optional)',
      type: 'number',
      group: 'stock',
      description: 'For a sale: fill this with the old price and it shows crossed out next to the new one.',
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({
      name: 'stock',
      title: 'How many in stock',
      type: 'number',
      group: 'stock',
      description: 'Goes down automatically with every online sale and shows “Sold out” at 0. Leave empty if you don’t want to count stock. (If the product has sizes, set stock on each size instead.)',
      validation: (r) => [r.integer(), r.min(0).warning(OVERSOLD)],
    }),
    defineField({
      name: 'collectionOnly',
      title: 'Collection in store only',
      type: 'boolean',
      group: 'stock',
      initialValue: false,
      description: 'Turn on for anything that can’t be posted (fragile, heavy or fresh). Baskets with this item can only be collected.',
    }),

    defineField({
      name: 'optionName',
      title: 'Option name',
      type: 'string',
      group: 'options',
      description: 'Only for products with choices, e.g. "Size" or "Colour". Leave empty for simple products.',
    }),
    defineField({
      name: 'variants',
      title: 'Choices',
      type: 'array',
      group: 'options',
      description: 'e.g. S, M, L, XL. Customers must pick one before adding to their basket.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'variant',
          fields: [
            defineField({ name: 'name', title: 'Choice', type: 'string', description: 'e.g. "M" or "Oat"', validation: (r) => r.required() }),
            defineField({ name: 'price', title: 'Different price (£, optional)', type: 'number', description: 'Leave empty to use the main price.', validation: (r) => r.min(0.3).precision(2) }),
            defineField({ name: 'stock', title: 'How many in stock', type: 'number', description: 'Leave empty to not count.', validation: (r) => [r.integer(), r.min(0).warning(OVERSOLD)] }),
          ],
          preview: {
            select: { title: 'name', price: 'price', stock: 'stock' },
            prepare: ({ title, price, stock }) => ({
              title,
              subtitle: [typeof price === 'number' ? `£${price.toFixed(2)}` : null, typeof stock === 'number' ? (stock > 0 ? `${stock} in stock` : 'SOLD OUT') : null]
                .filter(Boolean)
                .join(' · '),
            }),
          },
        }),
      ],
      hidden: ({ document }) => !document?.optionName && !(document?.variants as unknown[] | undefined)?.length,
    }),

    defineField({ name: 'available', title: 'Show in shop', type: 'boolean', group: 'display', initialValue: true, description: 'Turn off to hide the product without deleting it.' }),
    defineField({ name: 'featured', title: 'Pin to home page', type: 'boolean', group: 'display', initialValue: false, description: 'Pinned products appear in the shop section of the home page (up to 4).' }),
    defineField({ name: 'order', title: 'Position', type: 'number', group: 'display', description: 'Lower numbers show first.', initialValue: 10 }),
  ],
  orderings: [
    { title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Stock (lowest first)', name: 'stockAsc', by: [{ field: 'stock', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', price: 'price', stock: 'stock', media: 'images.0', available: 'available', featured: 'featured', variants: 'variants' },
    prepare: ({ title, price, stock, media, available, featured, variants }) => {
      const vs = (variants as { stock?: number }[] | undefined) ?? []
      const stockText = vs.length
        ? `${vs.length} options${vs.some((v) => v.stock === 0) ? ' · some sold out' : ''}`
        : typeof stock === 'number'
          ? stock > 0
            ? `${stock} in stock`
            : 'SOLD OUT'
          : null
      return {
        title: title ?? 'New product',
        subtitle: [typeof price === 'number' ? `£${price.toFixed(2)}` : 'No price', stockText, featured ? 'Pinned' : null, available === false ? 'HIDDEN' : null].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})

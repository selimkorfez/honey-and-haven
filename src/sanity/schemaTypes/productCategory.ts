import { defineField, defineType } from 'sanity'
import { TagsIcon } from '@sanity/icons/Tags'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Shop category',
  type: 'document',
  icon: TagsIcon,
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'string', description: 'e.g. "Honey", "Merch", "Gifts"', validation: (r) => r.required() }),
    defineField({ name: 'order', title: 'Position', type: 'number', description: 'Lower numbers show first.', initialValue: 10 }),
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
})

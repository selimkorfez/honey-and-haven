import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'

export const menuCategory = defineType({
  name: 'menuCategory',
  title: 'Menu category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'string', description: 'e.g. "Coffee", "Iced drinks", "Bakes"', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Short description (optional)', type: 'string' }),
    defineField({
      name: 'order',
      title: 'Position on the menu',
      type: 'number',
      description: '1 shows first, 2 second, and so on.',
      initialValue: 10,
    }),
  ],
  orderings: [{ title: 'Menu position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', order: 'order' }, prepare: ({ title, order }) => ({ title, subtitle: order != null ? `Position ${order}` : undefined }) },
})

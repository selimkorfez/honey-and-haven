import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
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
      name: 'showMilks',
      title: 'Show the milk line',
      type: 'boolean',
      initialValue: false,
      description: 'Adds the "Swap your milk" line (set on the Menu page) under this section\'s heading. Tick it for milky drinks, not for e.g. Refreshers.',
    }),
    orderRankField({ type: 'menuCategory', hidden: true }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'title', subtitle: 'description' } },
})

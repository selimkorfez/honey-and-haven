import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineField, defineType } from 'sanity'
import { TagsIcon } from '@sanity/icons/Tags'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Shop category',
  type: 'document',
  icon: TagsIcon,
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'string', description: 'e.g. "Honey", "Merch", "Gifts"', validation: (r) => r.required() }),
    orderRankField({ type: 'productCategory', hidden: true }),
  ],
  orderings: [orderRankOrdering],
})

import { defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { richText } from './fields'

export const policyPage = defineType({
  name: 'policyPage',
  title: 'Info page',
  type: 'document',
  icon: DocumentTextIcon,
  description: 'Simple text pages such as Delivery & returns, Privacy or Allergens.',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      description: 'Click "Generate". Delivery & returns must use "delivery-and-returns" and privacy must use "privacy" so the shop links to them.',
      validation: (r) => r.required(),
    }),
    richText('body', 'Text'),
    defineField({ name: 'showInFooter', title: 'Link in footer', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Position in footer', type: 'number', initialValue: 10 }),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/info/${slug}` : '' }) },
})

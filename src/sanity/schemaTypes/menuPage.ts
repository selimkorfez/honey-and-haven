import { defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'

export const menuPage = defineType({
  name: 'menuPage',
  title: 'Menu page',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro text', type: 'text', rows: 3 }),
    defineField({
      name: 'footnote',
      title: 'Note at the bottom',
      type: 'text',
      rows: 2,
      description: 'e.g. allergy information or "Oat, soy & almond milk available".',
    }),
    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Menu page' }) },
})

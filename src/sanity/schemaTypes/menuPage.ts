import { defineArrayMember, defineField, defineType } from 'sanity'
import { DIETARY_OPTIONS } from './menuItem'
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
    defineField({
      name: 'milkLabel',
      title: 'Milk line: wording',
      type: 'string',
      initialValue: 'Swap your milk:',
      description: 'Shown before the milks, e.g. "Swap your milk:". The line appears under the sections ticked "Show the milk line".',
    }),
    defineField({
      name: 'milks',
      title: 'Milk line: milks',
      type: 'array',
      description: 'The milks people can swap to, in order. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'milk',
          fields: [
            defineField({ name: 'name', title: 'Milk', type: 'string', description: 'e.g. "Oat"', validation: (r) => r.required() }),
            defineField({
              name: 'dietary',
              title: 'Allergy labels',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              options: { list: DIETARY_OPTIONS, layout: 'grid' },
              description: 'e.g. tick "Contains nuts" for almond milk.',
            }),
          ],
          preview: { select: { title: 'name', tags: 'dietary' }, prepare: ({ title, tags }) => ({ title, subtitle: (tags ?? []).join(' · ').toUpperCase() }) },
        }),
      ],
    }),
    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Menu page' }) },
})

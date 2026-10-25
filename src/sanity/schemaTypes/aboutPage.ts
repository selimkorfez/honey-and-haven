import { defineArrayMember, defineField, defineType } from 'sanity'
import { UsersIcon } from '@sanity/icons/Users'
import { SparkleIcon } from '@sanity/icons/Sparkle'
import { photoFields, richText } from './fields'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About us page',
  type: 'document',
  icon: UsersIcon,
  groups: [
    { name: 'top', title: 'Top banner', default: true },
    { name: 'story', title: 'Our story' },
    { name: 'visit', title: 'Come and say hello' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({ name: 'heading', title: 'Main heading', type: 'string', group: 'top', validation: (r) => r.required() }),
    defineField({ name: 'intro', title: 'Text under heading', type: 'text', rows: 3, group: 'top' }),
    defineField({
      name: 'heroImage',
      title: 'Banner picture',
      type: 'image',
      group: 'top',
      options: { hotspot: true },
      fields: photoFields,
      description: 'A wide picture works best (like the street illustration). Keep the left side quiet, the heading sits there.',
    }),
    defineField({ name: 'storyHeading', title: 'Heading', type: 'string', group: 'story' }),
    richText('story', 'Text', { group: 'story' }),
    defineField({
      name: 'storyImage',
      title: 'Photo (optional)',
      type: 'image',
      group: 'story',
      options: { hotspot: true },
      fields: photoFields,
    }),
    defineField({
      name: 'values',
      title: 'What we care about',
      type: 'array',
      group: 'story',
      description: 'Up to three short points.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'value',
          icon: SparkleIcon,
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'text', type: 'text', rows: 2 }),
          ],
        }),
      ],
      validation: (r) => r.max(3),
    }),
    defineField({
      name: 'visitHeading',
      title: 'Heading',
      type: 'string',
      group: 'visit',
      initialValue: 'Come and say hello',
      description: 'The closing section at the bottom of the page.',
    }),
    defineField({
      name: 'visitText',
      title: 'Text under heading',
      type: 'text',
      rows: 2,
      group: 'visit',
      description: 'Leave empty to show the café address. The address, the Get directions link and the opening hours are edited in Site settings.',
    }),
    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'About us page' }) },
})

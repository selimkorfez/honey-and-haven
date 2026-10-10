import { defineField, defineType } from 'sanity'
import { SearchIcon } from '@sanity/icons/Search'

export const seo = defineType({
  name: 'seo',
  title: 'Google & social sharing',
  type: 'object',
  icon: SearchIcon,
  description:
    'How this page looks in Google results and when the link is shared on Instagram, Facebook or WhatsApp. Leave blank to use the defaults from Site settings.',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'title',
      title: 'Page title (shown in Google)',
      type: 'string',
      description: 'Aim for 50–60 characters. Include what you are and where, e.g. "Specialty Coffee in Oadby, Leicester".',
      validation: (rule) => rule.max(70).warning('Google usually cuts titles off after ~60 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Description (shown under the title in Google)',
      type: 'text',
      rows: 3,
      description: 'One or two inviting sentences, around 150 characters.',
      validation: (rule) => rule.max(170).warning('Google usually cuts descriptions off after ~160 characters.'),
    }),
    defineField({
      name: 'image',
      title: 'Share image',
      type: 'image',
      description: 'Shown when the link is shared. Landscape works best (1200 × 630).',
      options: { hotspot: true },
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide this page from Google',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})

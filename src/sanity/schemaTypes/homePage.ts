import { defineField, defineType, defineArrayMember } from 'sanity'
import { HomeIcon } from '@sanity/icons/Home'
import { SparkleIcon } from '@sanity/icons/Sparkle'

const imageWithAlt = (name: string, title: string, group: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    group,
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the photo',
        type: 'string',
        description: 'Helps Google and visitors using screen readers, e.g. "Iced Spanish latte on a wooden table".',
      }),
    ],
  })

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: 'Top banner', default: true },
    { name: 'story', title: 'Our story' },
    { name: 'highlights', title: 'Highlights' },
    { name: 'menu', title: 'Featured menu' },
    { name: 'gallery', title: 'Gallery' },
    { name: 'visit', title: 'Visit us' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({ name: 'heroEyebrow', title: 'Small text above heading', type: 'string', group: 'hero' }),
    defineField({ name: 'heroHeading', title: 'Main heading', type: 'string', group: 'hero', validation: (r) => r.required() }),
    defineField({ name: 'heroText', title: 'Text under heading', type: 'text', rows: 2, group: 'hero' }),
    imageWithAlt('heroImage', 'Banner photo', 'hero', 'A big, atmospheric photo. Landscape works best.'),
    defineField({ name: 'storyHeading', title: 'Heading', type: 'string', group: 'story' }),
    defineField({ name: 'storyText', title: 'Text', type: 'text', rows: 6, group: 'story', description: 'Leave an empty line between paragraphs.' }),
    imageWithAlt('storyImage', 'Photo', 'story'),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      group: 'highlights',
      description: 'Three short reasons to visit.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'highlight',
          icon: SparkleIcon,
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'text', type: 'text', rows: 2 }),
          ],
        }),
      ],
      validation: (r) => r.max(4),
    }),
    defineField({ name: 'menuHeading', title: 'Heading', type: 'string', group: 'menu' }),
    defineField({
      name: 'menuText',
      title: 'Text',
      type: 'text',
      rows: 2,
      group: 'menu',
      description: 'Items marked as "Feature on home page" in the Menu appear here automatically.',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery photos',
      type: 'array',
      group: 'gallery',
      description: 'Drag photos in. 4–6 works best. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Describe the photo', type: 'string' })],
        }),
      ],
      options: { layout: 'grid' },
    }),
    defineField({ name: 'visitHeading', title: 'Heading', type: 'string', group: 'visit' }),
    defineField({
      name: 'visitText',
      title: 'Text',
      type: 'text',
      rows: 3,
      group: 'visit',
      description: 'Address and hours come from Site settings.',
    }),
    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})


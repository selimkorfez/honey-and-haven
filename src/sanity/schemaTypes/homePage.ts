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
    { name: 'shop', title: 'Shop' },
    { name: 'gallery', title: 'Gallery' },
    { name: 'visit', title: 'Visit us' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({ name: 'heroHeading', title: 'Main heading', type: 'string', group: 'hero', validation: (r) => r.required() }),
    defineField({ name: 'heroText', title: 'Text under heading', type: 'text', rows: 2, group: 'hero' }),
    defineField({
      name: 'heroSteps',
      title: 'Scroll story',
      type: 'array',
      group: 'hero',
      description: 'The lines that appear one after another as visitors scroll past the 3D cups. Up to three.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heroStep',
          fields: [
            defineField({ name: 'title', title: 'Heading', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
        }),
      ],
      validation: (r) => r.max(3),
    }),
    imageWithAlt('heroImage', 'Banner photo (fallback)', 'hero', 'Shown instead of the 3D cups on devices that can’t display them, and when shared on social media.'),
    defineField({ name: 'storyHeading', title: 'Heading', type: 'string', group: 'story' }),
    defineField({ name: 'storyText', title: 'Text', type: 'text', rows: 6, group: 'story', description: 'Leave an empty line between paragraphs.' }),
    imageWithAlt('storyImage', 'Photo', 'story'),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      group: 'highlights',
      description: 'Up to three short reasons to visit, shown under Our story.',
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
      validation: (r) => r.max(3),
    }),
    defineField({ name: 'menuHeading', title: 'Heading', type: 'string', group: 'menu' }),
    defineField({
      name: 'menuText',
      title: 'Text',
      type: 'text',
      rows: 2,
      group: 'menu',
      description: 'Items marked as "Feature on home page" in the Menu appear here automatically, as a menu board.',
    }),
    defineField({ name: 'shopHeading', title: 'Heading', type: 'string', group: 'shop' }),
    defineField({ name: 'shopText', title: 'Text', type: 'text', rows: 2, group: 'shop', description: 'Items come from "Shop items" in the menu on the left.' }),
    defineField({ name: 'galleryHeading', title: 'Heading', type: 'string', group: 'gallery' }),
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


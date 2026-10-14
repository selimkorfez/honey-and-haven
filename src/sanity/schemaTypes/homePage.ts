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
    { name: 'shop', title: 'Pinned products' },
    { name: 'reviews', title: 'Reviews' },
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
    defineField({
      name: 'heroTone',
      title: 'Backdrop',
      type: 'string',
      group: 'hero',
      options: {
        list: [
          { title: 'Studio brown (like the product photos)', value: 'studio' },
          { title: 'Cream', value: 'cream' },
        ],
        layout: 'radio',
      },
      initialValue: 'studio',
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
    defineField({ name: 'shopText', title: 'Text', type: 'text', rows: 2, group: 'shop', description: 'Shows products marked “Pin to home page” (up to 4). Edit them under Shop → All products.' }),
    defineField({ name: 'reviewsHeading', title: 'Heading', type: 'string', group: 'reviews', initialValue: 'Kind words from our regulars' }),
    defineField({ name: 'reviewsText', title: 'Text', type: 'text', rows: 2, group: 'reviews' }),
    defineField({
      name: 'handpickedReviews',
      title: 'Hand-picked reviews',
      type: 'array',
      group: 'reviews',
      description:
        'Optional. Google reviews show automatically once Google is connected. You can also add real reviews here, copied word for word from Google, TripAdvisor or Instagram, with the reviewer’s first name and a link to the original.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'handpickedReview',
          fields: [
            defineField({ name: 'quote', title: 'Review (word for word)', type: 'text', rows: 4, validation: (r) => r.required().max(600) }),
            defineField({ name: 'name', title: 'Reviewer’s name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'rating', title: 'Stars', type: 'number', options: { list: [5, 4, 3, 2, 1] }, initialValue: 5 }),
            defineField({ name: 'source', title: 'Where it was posted', type: 'string', options: { list: ['Google', 'TripAdvisor', 'Instagram', 'TikTok', 'Facebook'] } }),
            defineField({ name: 'link', title: 'Link to the original review', type: 'url' }),
          ],
          preview: { select: { title: 'quote', subtitle: 'name' } },
        }),
      ],
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


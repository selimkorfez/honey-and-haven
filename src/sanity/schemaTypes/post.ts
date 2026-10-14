import { defineField, defineType } from 'sanity'
import { ComposeIcon } from '@sanity/icons/Compose'
import { photoFields, richText } from './fields'

export const POST_CATEGORIES = ['News', 'New on the menu', 'Events', 'Behind the counter', 'Honey', 'Recipes']

/** Blog posts. Drafts stay private until Publish; Unpublish takes a post down without deleting it. */
export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  icon: ComposeIcon,
  groups: [
    { name: 'post', title: 'Post', default: true },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'post', validation: (r) => r.required().max(110) }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      group: 'post',
      options: { source: 'title', maxLength: 80 },
      description: 'Click "Generate" after writing the title.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date',
      type: 'datetime',
      group: 'post',
      initialValue: () => new Date().toISOString(),
      description: 'Shown on the post. Newest posts appear first.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'category', title: 'Category', type: 'string', group: 'post', options: { list: POST_CATEGORIES } }),
    defineField({
      name: 'excerpt',
      title: 'Short summary',
      type: 'text',
      rows: 3,
      group: 'post',
      description: 'One or two sentences for the blog page and Google.',
      validation: (r) => r.max(240),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover photo',
      type: 'image',
      group: 'post',
      options: { hotspot: true },
      fields: photoFields,
      description: 'Landscape photos work best. Big phone photos are fine: the website resizes them.',
    }),
    richText('body', 'Post', { group: 'post', validation: (r: { required: () => unknown }) => r.required() }, { images: true }),
    defineField({ name: 'author', title: 'Written by (optional)', type: 'string', group: 'post' }),
    defineField({ name: 'seo', title: 'Google & sharing', type: 'seo', group: 'seo' }),
  ],
  orderings: [{ title: 'Newest first', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'coverImage', category: 'category' },
    prepare: ({ title, date, media, category }) => ({
      title,
      subtitle: [date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null, category].filter(Boolean).join(' · '),
      media,
    }),
  },
})

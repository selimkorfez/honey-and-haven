import { defineArrayMember, defineField, defineType } from 'sanity'
import { ImagesIcon } from '@sanity/icons/Images'

/** The photo section on the home page ("Slow mornings, warm cups"). */
export const galleryPage = defineType({
  name: 'galleryPage',
  title: 'Gallery',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string', initialValue: 'Slow mornings, warm cups' }),
    defineField({ name: 'text', title: 'Text under the heading', type: 'text', rows: 2 }),
    defineField({
      name: 'show',
      title: 'What to show on the home page',
      type: 'string',
      options: {
        list: [
          { title: 'Latest Instagram posts (uses the photos below until Instagram is connected)', value: 'instagram' },
          { title: 'Only the photos below', value: 'photos' },
        ],
        layout: 'radio',
      },
      initialValue: 'instagram',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      description: 'Drag photos in (several at once is fine), drag to reorder, and click a photo to replace or describe it. 8 fit best. Big phone photos are fine: the website resizes them.',
      options: { layout: 'grid' },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Describe the photo', type: 'string', description: 'For Google and visitors using screen readers.' }),
            defineField({ name: 'link', title: 'Link (optional)', type: 'url', description: 'e.g. the matching Instagram post. Without one, the photo links to your Instagram profile.' }),
          ],
        }),
      ],
      validation: (r) => r.max(12).warning('Only the first 8 photos are shown.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Gallery' }) },
})

import { defineArrayMember, defineField } from 'sanity'

/** A photo with hotspot (so phones crop it well) and a short description for Google/screen readers. */
export const photoFields = [
  defineField({
    name: 'alt',
    title: 'Describe the photo',
    type: 'string',
    description: 'Helps Google and visitors using screen readers, e.g. "Jar of golden honey on a wooden counter".',
  }),
]

/** Simple rich text: paragraphs, small headings, bullet lists, bold/italic and links (and photos, if asked for). */
export const richText = (name: string, title: string, extra: Record<string, unknown> = {}, opts: { images?: boolean } = {}) =>
  defineField({
    name,
    title,
    type: 'array',
    ...extra,
    of: [
      ...(opts.images
        ? [
            defineArrayMember({
              type: 'image',
              name: 'inlineImage',
              title: 'Photo',
              options: { hotspot: true },
              fields: [
                ...photoFields,
                defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
                defineField({
                  name: 'size',
                  title: 'Size',
                  type: 'string',
                  options: { list: [{ title: 'Text width', value: 'normal' }, { title: 'Wide', value: 'wide' }], layout: 'radio', direction: 'horizontal' },
                  initialValue: 'normal',
                }),
              ],
            }),
          ]
        : []),
      defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Paragraph', value: 'normal' },
          { title: 'Heading', value: 'h2' },
          { title: 'Small heading', value: 'h3' },
        ],
        lists: [
          { title: 'Bullets', value: 'bullet' },
          { title: 'Numbers', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            defineArrayMember({
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [defineField({ name: 'href', title: 'Web address', type: 'url', validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }) })],
            }),
          ],
        },
      }),
    ],
  })

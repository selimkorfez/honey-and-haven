import { defineField, defineType, defineArrayMember } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'visit', title: 'Address & hours' },
    { name: 'social', title: 'Social media' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Café name',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Short tagline',
      type: 'string',
      group: 'general',
      description: 'Appears in the footer, e.g. "Coffee, honey & a little haven on The Parade."',
    }),
    defineField({
      name: 'announcement',
      title: 'Announcement bar (optional)',
      type: 'string',
      group: 'general',
      description: 'A one-line message at the very top of every page, e.g. "Now serving pumpkin spice lattes 🍂". Leave empty to hide it.',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
      group: 'visit',
    }),
    defineField({
      name: 'mapQuery',
      title: 'Google Maps search',
      type: 'string',
      group: 'visit',
      description: 'What to search on Google Maps to find you. Usually your name + postcode.',
    }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'visit' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'visit', validation: (rule) => rule.email() }),
    defineField({
      name: 'hours',
      title: 'Opening hours',
      type: 'array',
      group: 'visit',
      of: [defineArrayMember({ type: 'openingHours' })],
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram link',
      type: 'url',
      group: 'social',
      description: 'Full link, e.g. https://instagram.com/yourname',
    }),
    defineField({ name: 'tiktok', title: 'TikTok link', type: 'url', group: 'social' }),
    defineField({ name: 'facebook', title: 'Facebook link', type: 'url', group: 'social' }),
    defineField({
      name: 'seo',
      title: 'Default Google & sharing settings',
      type: 'seo',
      group: 'seo',
      description: 'Used on every page unless that page has its own.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})

import { defineField, defineType } from 'sanity'
import { CommentIcon } from '@sanity/icons/Comment'

export const FEEDBACK_KINDS = [
  { title: 'Feedback', value: 'feedback' },
  { title: 'Idea or suggestion', value: 'idea' },
  { title: 'Something to recommend', value: 'recommend' },
  { title: 'Something else', value: 'other' },
]

/**
 * Notes sent through the bee on the website. Created by the website only and
 * kept private (their IDs start with "feedback.", so only signed-in staff can read them).
 */
export const feedback = defineType({
  name: 'feedback',
  title: 'Customer note',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Read', value: 'read' },
          { title: 'Done / replied', value: 'done' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'new',
    }),
    defineField({ name: 'kind', title: 'Type', type: 'string', options: { list: FEEDBACK_KINDS }, readOnly: true }),
    defineField({ name: 'message', title: 'Message', type: 'text', rows: 6, readOnly: true }),
    defineField({ name: 'name', title: 'Name', type: 'string', readOnly: true }),
    defineField({
      name: 'email',
      title: 'Email (only if they’d like a reply)',
      type: 'string',
      readOnly: true,
    }),
    defineField({ name: 'page', title: 'Sent from page', type: 'string', readOnly: true }),
    defineField({ name: 'sentAt', title: 'Sent', type: 'datetime', readOnly: true }),
    defineField({ name: 'staffNote', title: 'Staff note', type: 'text', rows: 3, description: 'Private. Only staff see this.' }),
  ],
  orderings: [{ title: 'Newest first', name: 'newest', by: [{ field: 'sentAt', direction: 'desc' }] }],
  preview: {
    select: { message: 'message', kind: 'kind', name: 'name', status: 'status', sentAt: 'sentAt' },
    prepare({ message, kind, name, status, sentAt }) {
      const label = FEEDBACK_KINDS.find((k) => k.value === kind)?.title ?? 'Note'
      const when = sentAt ? new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
      return {
        title: message ? String(message).slice(0, 80) : 'Empty note',
        subtitle: [status === 'new' ? '● New' : null, label, name, when].filter(Boolean).join(' · '),
      }
    },
  },
})

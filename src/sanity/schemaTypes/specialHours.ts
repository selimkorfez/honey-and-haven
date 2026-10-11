import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons/Calendar'

export const specialHours = defineType({
  name: 'specialHours',
  title: 'Special hours',
  type: 'object',
  icon: CalendarIcon,
  fields: [
    defineField({ name: 'label', title: 'What’s the occasion?', type: 'string', description: 'e.g. "Christmas Eve" or "Bank holiday Monday"', validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'date', options: { dateFormat: 'D MMM YYYY' }, validation: (r) => r.required() }),
    defineField({
      name: 'endDate',
      title: 'Until (optional)',
      type: 'date',
      options: { dateFormat: 'D MMM YYYY' },
      description: 'Only for a run of days, e.g. closed 25–27 December.',
    }),
    defineField({ name: 'closed', title: 'Closed', type: 'boolean', initialValue: false }),
    defineField({ name: 'hours', title: 'Hours', type: 'string', description: 'e.g. "10am – 3pm"', hidden: ({ parent }) => Boolean(parent?.closed) }),
  ],
  preview: {
    select: { label: 'label', date: 'date', endDate: 'endDate', closed: 'closed', hours: 'hours' },
    prepare: ({ label, date, endDate, closed, hours }) => ({
      title: label,
      subtitle: `${date ?? ''}${endDate ? ` → ${endDate}` : ''} · ${closed ? 'Closed' : hours || ''}`,
    }),
  },
})

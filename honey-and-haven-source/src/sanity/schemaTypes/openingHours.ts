import { defineField, defineType } from 'sanity'
import { ClockIcon } from '@sanity/icons/Clock'

export const openingHours = defineType({
  name: 'openingHours',
  title: 'Opening hours',
  type: 'object',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'days',
      title: 'Day(s)',
      type: 'string',
      description: 'e.g. "Monday – Friday" or "Sunday"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'string',
      description: 'e.g. "8:00 – 18:00" or "Closed"',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'days', subtitle: 'hours' } },
})

import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons/Tag'

/** Discount codes customers type in their basket. */
export const discountCode = defineType({
  name: 'discountCode',
  title: 'Discount code',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description: 'What customers type, e.g. WELCOME10. Capital letters and numbers, no spaces.',
      validation: (r) =>
        r
          .required()
          .min(3)
          .max(30)
          .custom((v) => (!v || /^[A-Z0-9_-]+$/.test(v) ? true : 'Use capital letters, numbers, - or _ only (no spaces)')),
    }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true, description: 'Switch off to stop the code working straight away.' }),
    defineField({
      name: 'kind',
      title: 'Type of discount',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage off (%)', value: 'percent' },
          { title: 'Amount off (£)', value: 'amount' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'percent',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'value',
      title: 'How much off',
      type: 'number',
      description: 'e.g. 10 for 10% off, or 5 for £5 off.',
      validation: (r) => r.required().min(0).max(1000),
    }),
    defineField({ name: 'freeDelivery', title: 'Also gives free delivery', type: 'boolean', initialValue: false }),
    defineField({ name: 'minSpend', title: 'Minimum spend (£, optional)', type: 'number', validation: (r) => r.min(0) }),
    defineField({ name: 'startsAt', title: 'Starts (optional)', type: 'datetime' }),
    defineField({ name: 'endsAt', title: 'Ends (optional)', type: 'datetime' }),
    defineField({ name: 'maxUses', title: 'Maximum number of orders (optional)', type: 'number', validation: (r) => r.min(1).integer() }),
    defineField({ name: 'uses', title: 'Used so far', type: 'number', readOnly: true, initialValue: 0, description: 'Counts up automatically with each paid order.' }),
  ],
  preview: {
    select: { code: 'code', kind: 'kind', value: 'value', active: 'active', uses: 'uses' },
    prepare: ({ code, kind, value, active, uses }) => ({
      title: code || 'New code',
      subtitle: [active === false ? 'Off' : null, typeof value === 'number' ? (kind === 'amount' ? `£${value} off` : `${value}% off`) : null, `${uses ?? 0} used`]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})

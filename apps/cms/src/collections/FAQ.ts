import type { CollectionConfig } from 'payload'

export const FAQ: CollectionConfig = {
  slug: 'faq',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'order'],
  },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Général', value: 'general' },
        { label: 'Tarifs', value: 'tarifs' },
        { label: 'Technique', value: 'technique' },
        { label: 'Juridique', value: 'juridique' },
      ],
      defaultValue: 'general',
    },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'isPublished', type: 'checkbox', defaultValue: true },
  ],
}

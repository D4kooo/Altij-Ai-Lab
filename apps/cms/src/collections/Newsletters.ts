import type { CollectionConfig } from 'payload'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'status', 'sentAt'],
  },
  versions: { drafts: true },
  fields: [
    { name: 'subject', type: 'text', required: true },
    { name: 'preheader', type: 'text' },
    { name: 'content', type: 'richText', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'sections',
      type: 'array',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richText' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'link', type: 'text' },
        { name: 'linkText', type: 'text' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Planifiée', value: 'scheduled' },
        { label: 'Envoyée', value: 'sent' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'scheduled',
      },
    },
    { name: 'sentAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}

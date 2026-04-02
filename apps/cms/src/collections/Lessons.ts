import type { CollectionConfig } from 'payload'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'order'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Video, audio ou image de la leçon',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'quiz',
      type: 'array',
      admin: {
        description: 'Questions de quiz pour cette leçon',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Choix multiple', value: 'multiple_choice' },
            { label: 'Vrai/Faux', value: 'true_false' },
          ],
          defaultValue: 'multiple_choice',
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'text', type: 'text', required: true },
            { name: 'isCorrect', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          name: 'explanation',
          type: 'textarea',
        },
      ],
    },
  ],
}

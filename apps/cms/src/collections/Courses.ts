import type { CollectionConfig } from 'payload'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'audience', 'category', 'isPublished', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'audience',
      type: 'select',
      required: true,
      options: [
        { label: 'Juniors (7-15 ans)', value: 'juniors' },
        { label: 'Adultes (16-60 ans)', value: 'adultes' },
        { label: 'Seniors (60+ ans)', value: 'seniors' },
        { label: 'Organisation', value: 'organisation' },
      ],
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'icon',
      type: 'text',
      defaultValue: 'BookOpen',
    },
    {
      name: 'color',
      type: 'text',
      defaultValue: '#57C5B6',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}

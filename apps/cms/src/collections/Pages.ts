import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'description', type: 'textarea' },
    { name: 'content', type: 'richText' },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          fields: [
            { name: 'badge', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'subtitle', type: 'textarea' },
            { name: 'ctaText', type: 'text' },
            { name: 'ctaLink', type: 'text' },
            { name: 'ctaSecondaryText', type: 'text' },
            { name: 'ctaSecondaryLink', type: 'text' },
            { name: 'backgroundVideo', type: 'upload', relationTo: 'media' },
            { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          slug: 'features',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'subtitle', type: 'textarea' },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'icon', type: 'text' },
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
              ],
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'buttonText', type: 'text' },
            { name: 'buttonLink', type: 'text' },
          ],
        },
        {
          slug: 'richContent',
          fields: [
            { name: 'content', type: 'richText' },
          ],
        },
        {
          slug: 'imageText',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'description', type: 'richText' },
            { name: 'image', type: 'upload', relationTo: 'media' },
            {
              name: 'imagePosition',
              type: 'select',
              options: [
                { label: 'Gauche', value: 'left' },
                { label: 'Droite', value: 'right' },
              ],
              defaultValue: 'right',
            },
          ],
        },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Publié', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
  ],
}

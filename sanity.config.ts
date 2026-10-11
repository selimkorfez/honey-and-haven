'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schemaTypes, singletonTypes, systemTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Honey & Haven',
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Hide singletons and orders from the "create new document" menu
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType) && !systemTypes.has(schemaType)),
  },
  document: {
    // Singletons can't be duplicated or deleted, only edited & published
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : systemTypes.has(context.schemaType)
          ? input.filter(({ action }) => action !== 'duplicate')
          : input,
  },
  plugins: [structureTool({ structure, title: 'Website' })],
  apiVersion,
})

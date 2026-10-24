'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { apiVersion, dataset, projectId } from './src/sanity/env'
import { ownerOnlyTypes, schemaTypes, singletonTypes, systemTypes } from './src/sanity/schemaTypes'
import { isOwner, structure } from './src/sanity/structure'
import { resolve } from './src/sanity/presentation/resolve'
import { withOrderNotify } from './src/sanity/actions/publishOrder'

export default defineConfig({
  name: 'default',
  title: 'Honey & Haven',
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Hide singletons, orders and notes from the "create new" menu
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType) && !systemTypes.has(schemaType)),
  },
  document: {
    actions: (input, context) => {
      // Site settings and shop settings: Owner only (staff can't change them)
      if (ownerOnlyTypes.has(context.schemaType) && !isOwner(context.currentUser)) return []
      // Singletons can't be duplicated or deleted, only edited & published
      if (singletonTypes.has(context.schemaType)) return input.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
      // Orders: publishing a new status (ready / posted / cancelled) emails the customer
      if (context.schemaType === 'order') input = input.map((a) => (a.action === 'publish' ? withOrderNotify(a) : a))
      if (systemTypes.has(context.schemaType)) return input.filter(({ action }) => action !== 'duplicate')
      return input
    },
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global' ? prev.filter((t) => !singletonTypes.has(t.templateId) && !systemTypes.has(t.templateId)) : prev,
  },
  plugins: [
    structureTool({ structure, title: 'Website' }),
    // "Preview" tab: the real website, showing unpublished changes, side by side with the editor
    presentationTool({
      title: 'Preview',
      resolve,
      previewUrl: { previewMode: { enable: '/api/draft-mode/enable' } },
    }),
  ],
  apiVersion,
})

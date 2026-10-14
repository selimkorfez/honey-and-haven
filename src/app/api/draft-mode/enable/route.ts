import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client, previewToken } from '@/sanity/lib/client'

/** Called by the Studio's Preview tab: checks the editor is signed in, then shows drafts. */
export const { GET } = defineEnableDraftMode({ client: client.withConfig({ token: previewToken() || '' }) })

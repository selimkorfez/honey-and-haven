import type { Metadata } from 'next'
import { NextStudio } from 'next-sanity/studio'
import { metadata as studioMetadata } from 'next-sanity/studio'
import config from '../../../../sanity.config'
import { isConfigured } from '@/sanity/env'

export const dynamic = 'force-static'

export const metadata: Metadata = { ...studioMetadata, title: 'Honey & Haven · Studio' }
export { viewport } from 'next-sanity/studio'

export default function StudioPage() {
  if (!isConfigured) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 48, maxWidth: 560, margin: '10vh auto', lineHeight: 1.6 }}>
        <h1 style={{ fontWeight: 500 }}>Studio not connected yet</h1>
        <p>
          The editor will appear here once a Sanity project ID is added to this site&rsquo;s settings
          (<code>NEXT_PUBLIC_SANITY_PROJECT_ID</code>). The website is showing its starter content until then.
        </p>
      </div>
    )
  }
  return <NextStudio config={config} />
}

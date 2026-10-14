'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { VisualEditing } from 'next-sanity/visual-editing'
import { useIsPresentationTool } from 'next-sanity/hooks'

/**
 * Only rendered in preview. Connects the page to the Studio's Preview tab and
 * reloads it as the editor types; outside the Studio it shows an "Exit preview" button.
 */
export function PreviewBridge() {
  const router = useRouter()
  const inStudio = useIsPresentationTool()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <>
      <VisualEditing
        refresh={(payload) => {
          if (payload.source === 'manual') {
            router.refresh()
            return new Promise((r) => setTimeout(r, 600))
          }
          // Content changed in the Studio: refresh shortly after typing pauses
          if (timer.current) clearTimeout(timer.current)
          return new Promise((r) => {
            timer.current = setTimeout(() => {
              router.refresh()
              setTimeout(r, 600)
            }, 700)
          })
        }}
      />
      {inStudio === false ? (
        <a href="/api/draft-mode/disable" className="preview-exit">
          Previewing unpublished changes · Exit preview
        </a>
      ) : null}
    </>
  )
}

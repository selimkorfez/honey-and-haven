'use client'

import { useEffect, useRef, useState } from 'react'

type Shown = { src: string; srcSet: string; alt: string; name: string }

/**
 * Tapping a menu photo opens it bigger. The thumbnails are plain buttons rendered on the server
 * (with the big photo's address on them), so this only listens for clicks inside the menu.
 */
export function MenuLightbox({ scope }: { scope: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState<Shown | null>(null)

  useEffect(() => {
    const root = document.getElementById(scope)
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button.menu-thumb')
      if (!btn || !root.contains(btn)) return
      // with both photos, show the one the Hot / Iced switch is on
      const iced = btn.dataset.icedSrc && (!btn.dataset.hotSrc || root.dataset.temp === 'iced')
      const d = btn.dataset
      setShown({
        src: (iced ? d.icedSrc : d.hotSrc) || '',
        srcSet: (iced ? d.icedSrcset : d.hotSrcset) || '',
        alt: (iced ? d.icedAlt : d.hotAlt) || '',
        name: d.name || '',
      })
      opener.current = btn
      dialog.current?.showModal()
      document.documentElement.style.overflow = 'hidden'
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [scope])

  const close = () => dialog.current?.close()

  return (
    <dialog
      ref={dialog}
      className="menu-lightbox"
      aria-label={shown ? `Photo: ${shown.name}` : 'Photo'}
      onClose={() => {
        document.documentElement.style.overflow = ''
        opener.current?.focus()
      }}
      // a click on the dark backdrop (outside the photo) closes it
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      {shown ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown.src} srcSet={shown.srcSet} sizes="(max-width: 700px) 92vw, 640px" alt={shown.alt || shown.name} />
          <figcaption>{shown.name}</figcaption>
        </figure>
      ) : null}
      <button type="button" className="menu-lightbox-close" onClick={close} aria-label="Close photo">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  )
}

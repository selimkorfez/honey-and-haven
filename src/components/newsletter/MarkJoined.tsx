'use client'

import { useEffect } from 'react'
import { writeLetter } from '@/lib/newsletter'

/** Remembers in this browser that the visitor confirmed, so the forms show a thank-you instead. */
export function MarkJoined() {
  useEffect(() => {
    writeLetter({ status: 'joined' })
  }, [])
  return null
}

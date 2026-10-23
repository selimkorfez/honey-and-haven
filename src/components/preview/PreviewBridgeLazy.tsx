'use client'

import dynamic from 'next/dynamic'

/**
 * The Studio preview tools are big (around 500 KB). Loading them this way means
 * they're only downloaded when someone is actually previewing from the Studio,
 * not by every visitor.
 */
export const PreviewBridgeLazy = dynamic(() => import('./PreviewBridge').then((m) => m.PreviewBridge), { ssr: false })

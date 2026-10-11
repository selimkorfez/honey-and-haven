import { ImageResponse } from 'next/og'
import { LOGO_PATH, LOGO_TRANSFORM } from '@/components/LogoMark'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** Browser-tab icon: the bee monogram on the café's beige. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e7d8c5', borderRadius: 14 }}>
        <svg width="40" height="51" viewBox="0 0 956 1216">
          <g transform={LOGO_TRANSFORM} fill="#4a2e2b">
            <path d={LOGO_PATH} />
          </g>
        </svg>
      </div>
    ),
    size,
  )
}

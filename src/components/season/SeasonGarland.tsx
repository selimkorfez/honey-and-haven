'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SEASONS, garlandSvg, type SeasonId } from '@/lib/seasons'

/**
 * The seasonal garland hanging under the header (lanterns, holly, bunting…), on the home page
 * while you're at the top of it. Drawn to the screen's width once the page has loaded, so it never
 * changes what the server sent (no hydration surprises). Purely decorative: it ignores the mouse.
 */
export function SeasonGarland({ id }: { id: SeasonId }) {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(Math.round(document.documentElement.clientWidth)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  if (pathname !== '/' || !width) return null
  const { svg, height } = garlandSvg(SEASONS[id], width)
  return <div className="season-garland" aria-hidden="true" style={{ height }} dangerouslySetInnerHTML={{ __html: svg }} />
}

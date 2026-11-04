'use client'

import { useState } from 'react'
import type { Temp } from '@/lib/season'

/** "Hot | Iced" on the menu: swaps drink photos that have an iced version (see .menu-temp in globals.css). */
export function TempSwitch({ initial, target }: { initial: Temp; target: string }) {
  const [temp, setTemp] = useState<Temp>(initial)
  const choose = (t: Temp) => {
    setTemp(t)
    document.getElementById(target)?.setAttribute('data-temp', t)
  }
  return (
    <div className="temp-switch" role="group" aria-label="Show drink photos">
      {(['hot', 'iced'] as const).map((t) => (
        <button key={t} type="button" aria-pressed={temp === t} onClick={() => choose(t)}>
          {t === 'hot' ? 'Hot' : 'Iced'}
        </button>
      ))}
    </div>
  )
}

type P = React.SVGProps<SVGSVGElement>

/** Honeycomb mark used in the logo. */
export function HexMark(props: P) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25L16 2.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 9.5 21.6 12.75v6.5L16 22.5l-5.6-3.25v-6.5L16 9.5Z" fill="currentColor" opacity=".9" />
    </svg>
  )
}

const base = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const, width: 18, height: 18 }
const stroke = { stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function ArrowRight(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" {...stroke} />
    </svg>
  )
}

export function ArrowUpRight(props: P) {
  return (
    <svg {...base} width={14} height={14} {...props}>
      <path d="M7 17 17 7M8.5 7H17v8.5" {...stroke} />
    </svg>
  )
}

export function Pin(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" {...stroke} strokeWidth={1.75} />
      <circle cx="12" cy="10" r="2.3" {...stroke} strokeWidth={1.75} />
    </svg>
  )
}

export function Clock(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" {...stroke} strokeWidth={1.75} />
      <path d="M12 7.5V12l3 2" {...stroke} strokeWidth={1.75} />
    </svg>
  )
}

/** Generic "video" glyph for the TikTok link (not the TikTok logo). */
export function Video(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" {...stroke} strokeWidth={1.75} />
      <path d="m10.5 9.5 4 2.5-4 2.5v-5Z" {...stroke} strokeWidth={1.75} />
    </svg>
  )
}

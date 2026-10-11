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

export function Camera(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...stroke} strokeWidth={1.75} />
      <circle cx="12" cy="12" r="3.8" {...stroke} strokeWidth={1.75} />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function Bag(props: P) {
  return (
    <svg {...base} width={22} height={22} {...props}>
      <path d="M5.5 8.5h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3l-1-11.2Z" {...stroke} strokeWidth={1.75} />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" {...stroke} strokeWidth={1.75} />
    </svg>
  )
}

export function Plus(props: P) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </svg>
  )
}

export function Minus(props: P) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M5 12h14" {...stroke} />
    </svg>
  )
}

export function Close(props: P) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M6 6l12 12M18 6 6 18" {...stroke} />
    </svg>
  )
}

export function Check(props: P) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2.2} />
    </svg>
  )
}

export function Store(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5 5.5 4.5h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12.5v7h13v-7M10 19.5v-4h4v4" {...stroke} strokeWidth={1.6} />
    </svg>
  )
}

export function Truck(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 6.5h10v10h-10zM13.5 10h4l3 3.2v3.3h-7" {...stroke} strokeWidth={1.6} />
      <circle cx="7.5" cy="17.5" r="1.8" fill="var(--white, #fff)" {...stroke} strokeWidth={1.6} />
      <circle cx="17" cy="17.5" r="1.8" fill="var(--white, #fff)" {...stroke} strokeWidth={1.6} />
    </svg>
  )
}

export function Lock(props: P) {
  return (
    <svg {...base} width={14} height={14} {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" {...stroke} />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...stroke} />
    </svg>
  )
}

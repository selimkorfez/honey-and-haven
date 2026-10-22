/*
 * Seasonal themes: the colours, little drawings and decorations for each season, switched on in
 * the Studio (Site settings → Seasonal theme). Shared by the server (top bar) and the browser
 * (garland and falling decorations), so nothing in here touches the page.
 */

export const SEASON_IDS = ['winter', 'spring', 'summer', 'autumn', 'valentines', 'ramadan', 'easter', 'christmas'] as const
export type SeasonId = (typeof SEASON_IDS)[number]
export type SeasonDecoration = 'ribbon' | 'garland' | 'full'
export type SeasonBarStyle = 'plain' | 'pattern'

/** What the page needs once a season is on. */
export type ActiveSeason = { id: SeasonId; decoration: SeasonDecoration; barStyle: SeasonBarStyle; message: string }

/** The Studio fields (Site settings → Seasonal theme). */
export type SeasonSettings = {
  theme?: SeasonId | 'off' | null
  decoration?: SeasonDecoration | null
  barStyle?: SeasonBarStyle | null
  message?: string | null
  start?: string | null
  end?: string | null
} | null

/* ---------- little drawings (24×24 SVG), coloured per theme ---------- */
type Draw = (c: string, d?: string) => string
export const DRAW: Record<string, Draw> = {
  snowflake: (c) =>
    `<g stroke="${c}" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2M4 10.2l3 .5-1 3M20 13.8l-3-.5 1-3M5 14.2l2-.9-.3-3M19 9.8l-2 .9.3 3"/></g>`,
  blossom: (c, d = c) =>
    `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="6.6" rx="3.6" ry="4.6" fill="${c}" transform="rotate(${a} 12 12)"/>`).join('')}<circle cx="12" cy="12" r="2.4" fill="${d}"/></g>`,
  sun: (c) =>
    `<g fill="${c}" stroke="${c}" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.6"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" fill="none"/></g>`,
  leaf: (c, d = 'rgba(0,0,0,.18)') =>
    `<g><path d="M12 2.5C6.5 7 5.5 14 12 21.5 18.5 14 17.5 7 12 2.5Z" fill="${c}"/><path d="M12 5v16M12 10l-3-2M12 14l3-2.5M12 17l-3-2" stroke="${d}" stroke-width="1.1" stroke-linecap="round" fill="none"/></g>`,
  maple: (c) =>
    `<path fill="${c}" d="M12 2l1.6 3.6 2.4-1-.6 3.8 3.4-1.6-1 3 3.2.6-2.6 2.6 1 1.4-4.2.4.6 2.6L13 15.6V22h-2v-6.4l-2.8 1.8.6-2.6-4.2-.4 1-1.4L3 10.4l3.2-.6-1-3 3.4 1.6L8 4.6l2.4 1L12 2z"/>`,
  heart: (c) => `<path fill="${c}" d="M12 21s-7.4-4.6-9.6-9.2C.9 8.6 3 4.5 6.8 4.5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3 3.8 0 5.9 4.1 4.4 7.3C19.4 16.4 12 21 12 21Z"/>`,
  crescent: (c) => `<path fill="${c}" d="M15.5 2.6a9.6 9.6 0 1 0 5.9 15.6A8 8 0 0 1 15.5 2.6Z"/>`,
  star: (c) => `<path fill="${c}" d="m12 2.6 2.7 6 6.5.6-4.9 4.3 1.4 6.4L12 16.6 6.3 19.9l1.4-6.4L2.8 9.2l6.5-.6L12 2.6Z"/>`,
  lantern: (c, d = c) =>
    `<g><path d="M12 0v3" stroke="${c}" stroke-width="1.2"/><path d="M8.5 3h7l-1 2h-5z" fill="${c}"/><path d="M7.5 5h9c.6 3 .6 9 0 12h-9c-.6-3-.6-9 0-12Z" fill="${c}"/><path d="M9.5 7h5c.3 2.4.3 5.6 0 8h-5c-.3-2.4-.3-5.6 0-8Z" fill="${d}"/><path d="M12 7v8" stroke="${c}" stroke-width=".9"/><path d="M9 17h6l-1 2.4h-4z" fill="${c}"/><path d="M12 19.4v3" stroke="${c}" stroke-width="1.2"/></g>`,
  egg: (c, d = '#fff') =>
    `<g><path d="M12 2c4.2 0 7.2 7.4 7.2 12.4A7.2 7.2 0 0 1 4.8 14.4C4.8 9.4 7.8 2 12 2Z" fill="${c}"/><path d="M5.2 12.4l2.3-1.8 2.3 1.8 2.2-1.8 2.3 1.8 2.3-1.8 2.2 1.8" stroke="${d}" stroke-width="1.5" fill="none" stroke-linejoin="round"/><circle cx="9" cy="16.6" r="1" fill="${d}"/><circle cx="12" cy="17.6" r="1" fill="${d}"/><circle cx="15" cy="16.6" r="1" fill="${d}"/></g>`,
  holly: (c, d = '#d8423e') =>
    `<g><path fill="${c}" d="M12 12.5C9.5 9.6 6.5 9 3 10l1.4 1.2-1.6 1.4 2 .3-.6 1.8 2-.7.2 2 1.6-1.4.8 1.8C10.6 15.6 11.6 14.2 12 12.5Z"/><path fill="${c}" d="M12 12.5c2.5-2.9 5.5-3.5 9-2.5l-1.4 1.2 1.6 1.4-2 .3.6 1.8-2-.7-.2 2-1.6-1.4-.8 1.8c-1.8-.8-2.8-2.2-3.2-3.9Z"/><circle cx="10.4" cy="9.4" r="2" fill="${d}"/><circle cx="13.8" cy="9.4" r="2" fill="${d}"/><circle cx="12.1" cy="6.6" r="2" fill="${d}"/></g>`,
  bauble: (c, d = c) =>
    `<g><path d="M12 0v4" stroke="${d}" stroke-width="1"/><rect x="9.8" y="4" width="4.4" height="2.6" rx=".6" fill="${d}"/><circle cx="12" cy="14" r="8" fill="${c}"/><path d="M5 12.4c4.6 1.6 9.4 1.6 14 0" stroke="${d}" stroke-width="1.2" fill="none"/><circle cx="9" cy="10.6" r="1.6" fill="#fff" opacity=".35"/></g>`,
  pennant: (c) => `<path fill="${c}" d="M3 2h18l-9 18z"/>`,
}

export const svgIcon = (inner: string, size = 18) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${inner}</svg>`

export type GarlandSpec =
  | { kind: 'hang'; items: string[]; colors: string[]; detail?: string; string: string }
  | { kind: 'vine'; items: string[]; colors: string[]; leaf: string; string: string }
  | { kind: 'bunting'; colors: string[]; string: string }
  | { kind: 'lanterns'; colors: string[]; glow: string; string: string }
  | { kind: 'holly'; colors: string[]; leaf: string; berry: string; string: string }

export type FxSpec = { type: 'snow' | 'petal' | 'leaf' | 'heart' | 'spark' | 'star' | 'confetti'; colors: string[]; count: number }

export type Season = {
  id: SeasonId
  name: string
  /** top bar background, text and the icon drawn either side */
  bar: string
  text: string
  icon: string
  /** the greeting shown when neither a seasonal message nor an announcement is set */
  message: string
  garland: GarlandSpec
  fx: FxSpec
}

export const SEASONS: Record<SeasonId, Season> = {
  winter: {
    id: 'winter', name: 'Winter', bar: '#2c3d4b', text: '#eef4f7', icon: DRAW.snowflake('#bcd6e4'),
    message: 'Winter warmers are on: hot chocolates & spiced lattes',
    garland: { kind: 'hang', items: ['snowflake'], colors: ['#e9f2f7', '#bcd6e4'], string: 'rgba(235,244,250,.55)' },
    fx: { type: 'snow', colors: ['#ffffff', '#e4eef4'], count: 70 },
  },
  spring: {
    id: 'spring', name: 'Spring', bar: '#f1d5da', text: '#5a2e36', icon: DRAW.blossom('#d9899a', '#f7e9a8'),
    message: 'Spring is here: blossom specials are on the menu',
    garland: { kind: 'vine', items: ['blossom', 'leaf'], colors: ['#f4c4ce', '#e8a3b3', '#f9e2e6'], leaf: '#8aa676', string: '#7f9b6b' },
    fx: { type: 'petal', colors: ['#f6c9d2', '#f2b3c1', '#fbe4e9'], count: 34 },
  },
  summer: {
    id: 'summer', name: 'Summer', bar: '#e9b23b', text: '#3a2410', icon: DRAW.sun('#fff2c4'),
    message: 'Summer is here: iced drinks & refreshers all day',
    garland: { kind: 'bunting', colors: ['#f2c14e', '#fff4d6', '#f08a3c', '#e9d68f'], string: 'rgba(255,240,210,.7)' },
    fx: { type: 'spark', colors: ['#ffe8a3', '#fff6d8'], count: 40 },
  },
  autumn: {
    id: 'autumn', name: 'Autumn', bar: '#8a3f1d', text: '#fbe9d6', icon: DRAW.maple('#e8a24c'),
    message: 'Autumn Specials are in!',
    garland: { kind: 'vine', items: ['maple', 'leaf'], colors: ['#c4622d', '#e09a3e', '#9c4a22', '#b88a3a'], leaf: '#a45a26', string: '#7a4a2a' },
    fx: { type: 'leaf', colors: ['#c4622d', '#e09a3e', '#9c4a22', '#c9893a'], count: 26 },
  },
  valentines: {
    id: 'valentines', name: 'Valentine’s', bar: '#8e1f3a', text: '#fde8ec', icon: DRAW.heart('#f4a9ba'),
    message: 'Treat your Valentine: specials for two this week',
    garland: { kind: 'hang', items: ['heart'], colors: ['#e2546f', '#f4a9ba', '#c2304f'], string: 'rgba(253,232,236,.55)' },
    fx: { type: 'heart', colors: ['#f07e95', '#f4a9ba', '#e2546f'], count: 22 },
  },
  ramadan: {
    id: 'ramadan', name: 'Ramadan', bar: '#1f2347', text: '#f3e7c4', icon: DRAW.crescent('#d9b25f'),
    message: 'Ramadan Mubarak from all of us at Honey & Haven',
    garland: { kind: 'lanterns', colors: ['#d9b25f', '#c99a3e'], glow: '#ffe3a1', string: 'rgba(217,178,95,.6)' },
    fx: { type: 'star', colors: ['#f3e7c4', '#d9b25f'], count: 46 },
  },
  easter: {
    id: 'easter', name: 'Easter', bar: '#e7e0f3', text: '#3d3357', icon: DRAW.egg('#f1cf63', '#ffffff'),
    message: 'Happy Easter: hot cross buns & Easter treats are in',
    garland: { kind: 'hang', items: ['egg'], colors: ['#f1cf63', '#9fd3bb', '#f3b7c8', '#c8b6ea'], detail: '#ffffff', string: 'rgba(255,255,255,.6)' },
    fx: { type: 'confetti', colors: ['#f1cf63', '#9fd3bb', '#f3b7c8', '#c8b6ea'], count: 30 },
  },
  christmas: {
    id: 'christmas', name: 'Christmas', bar: '#1f4a33', text: '#f6ecd9', icon: DRAW.holly('#5f9a6a', '#d8423e'),
    message: 'Merry Christmas: festive drinks & gifts are here',
    garland: { kind: 'holly', colors: ['#c0362f', '#d6ad5b', '#e9e1cf'], leaf: '#2f6a43', berry: '#d8423e', string: '#2f6a43' },
    fx: { type: 'snow', colors: ['#ffffff', '#f1ead8'], count: 70 },
  },
}

/** Today's date in the UK as YYYY-MM-DD (the café's calendar, wherever the server is). */
function ukToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/**
 * The season to show right now, or null. Off unless a theme is picked; with dates set, it only
 * shows from the start date to the end date (inclusive). The top bar message: the seasonal one if
 * written, else the usual announcement, else the theme's own greeting.
 */
export function activeSeason(s: SeasonSettings | undefined, announcement?: string | null, now = new Date()): ActiveSeason | null {
  // For checking a look on a computer without touching the Studio: SEASON_PREVIEW=christmas:full:pattern
  const test = typeof process !== 'undefined' ? process.env.SEASON_PREVIEW : undefined
  if (test) {
    const [theme, decoration, barStyle] = test.split(':')
    s = { theme: theme as SeasonId, decoration: (decoration || 'full') as SeasonDecoration, barStyle: (barStyle || 'plain') as SeasonBarStyle }
  }
  const id = s?.theme
  if (!id || id === 'off' || !(id in SEASONS)) return null
  const today = ukToday(now)
  if (s?.start && today < s.start) return null
  if (s?.end && today > s.end) return null
  return {
    id,
    decoration: s?.decoration ?? 'garland',
    barStyle: s?.barStyle ?? 'plain',
    message: s?.message?.trim() || announcement?.trim() || SEASONS[id].message,
  }
}

/** The repeating pattern for the "patterned" top bar, as a CSS background image. */
export function barPattern(season: Season) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="41" viewBox="0 0 56 41"><g transform="translate(16 10.5) scale(0.9)">${season.icon}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/* ---------- the garland under the header (built in the browser, to the screen's width) ---------- */
function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

/** SVG markup for the garland, `width` px wide; returns the markup and its height. */
export function garlandSvg(season: Season, width: number) {
  const g = season.garland
  const r = seeded(7)
  const phone = width < 600
  const H = phone ? 70 : 96
  const n = Math.max(3, Math.round(width / (phone ? 78 : 128)))
  const step = width / n
  const dip = phone ? 12 : 16
  const place = (inner: string, x: number, y: number, size: number, rot = 0) =>
    `<g transform="translate(${(x - size / 2).toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)} ${size / 2} ${size / 2}) scale(${(size / 24).toFixed(3)})">${inner}</g>`
  // the string: shallow scallops between the hooks
  const sag = (x: number) => {
    const k = (x % step) / step
    return 2 + dip * 4 * k * (1 - k)
  }
  let s = ''
  if (g.kind !== 'lanterns') {
    let d = 'M0 2'
    for (let i = 0; i < n; i++) d += ` Q${(i * step + step / 2).toFixed(1)} ${2 + dip * 2} ${((i + 1) * step).toFixed(1)} 2`
    s += `<path d="${d}" stroke="${g.string}" stroke-width="${phone ? 1.4 : 1.8}" fill="none"/>`
  }
  if (g.kind === 'hang') {
    for (let i = 0; i < n * 2; i++) {
      const x = (i + 0.5) * (step / 2)
      const y0 = sag(x)
      const len = 10 + r() * (phone ? 14 : 22)
      const size = (phone ? 16 : 22) + r() * 6
      s += `<path d="M${x.toFixed(1)} ${y0.toFixed(1)}v${len.toFixed(1)}" stroke="${g.string}" stroke-width="1"/>`
      s += place(DRAW[g.items[i % g.items.length]](g.colors[i % g.colors.length], g.detail ?? season.bar), x, y0 + len - 2, size, (r() - 0.5) * 16)
    }
  } else if (g.kind === 'vine') {
    for (let i = 0; i < n * 3; i++) {
      const x = (i + 0.5) * (step / 3)
      const name = g.items[i % g.items.length]
      const size = (phone ? 14 : 20) + r() * 7
      const inner = name === 'leaf' ? DRAW.leaf(g.leaf) : DRAW[name](g.colors[i % g.colors.length], g.colors[(i + 1) % g.colors.length])
      s += place(inner, x, sag(x) - size * 0.42, size, (r() - 0.5) * 70)
    }
  } else if (g.kind === 'bunting') {
    for (let i = 0; i < n * 3; i++) {
      const x = (i + 0.5) * (step / 3)
      s += place(DRAW.pennant(g.colors[i % g.colors.length]), x, sag(x) - 1, phone ? 16 : 24, (r() - 0.5) * 8)
    }
  } else if (g.kind === 'lanterns') {
    const count = phone ? 5 : 9
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * (width / count) + (r() - 0.5) * 20
      const len = 8 + r() * (phone ? 26 : 46)
      const size = (phone ? 22 : 32) + r() * 8
      s += `<path d="M${x.toFixed(1)} 0v${len.toFixed(1)}" stroke="${g.string}" stroke-width="1"/>`
      s += `<circle cx="${x.toFixed(1)}" cy="${(len + size * 0.5).toFixed(1)}" r="${(size * 0.55).toFixed(1)}" fill="${g.glow}" opacity=".16"/>`
      s += place(DRAW.lantern(g.colors[i % 2], g.glow), x, len - 1, size)
      if (i % 2 === 1) s += place(DRAW.star(g.colors[0]), x + width / count / 2, 6 + r() * 16, phone ? 9 : 12)
    }
  } else if (g.kind === 'holly') {
    for (let i = 0; i < n * 3; i++) {
      const x = (i + 0.5) * (step / 3)
      const y0 = sag(x)
      if (i % 3 === 1) {
        const len = 8 + r() * (phone ? 12 : 20)
        const size = (phone ? 14 : 19) + r() * 4
        s += `<path d="M${x.toFixed(1)} ${y0.toFixed(1)}v${len.toFixed(1)}" stroke="${g.colors[1]}" stroke-width=".9"/>`
        s += place(DRAW.bauble(g.colors[i % 2 === 0 ? 1 : 0], g.colors[1]), x, y0 + len - 3, size)
      } else s += place(DRAW.holly(g.leaf, g.berry), x, y0 - (phone ? 7 : 10), phone ? 18 : 26, (r() - 0.5) * 40)
    }
  }
  return { svg: `<svg viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" aria-hidden="true" focusable="false">${s}</svg>`, height: H }
}

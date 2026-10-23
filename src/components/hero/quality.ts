/*
 * Device checks for the hero scene. Kept free of three.js so the page can decide how to draw the
 * scene (in a background worker, or on the page itself) without loading the 3D code first.
 */

export type HeroTone = 'studio' | 'cream'

/* ------------------------------------------------------------------ */
/* Quality levels: phones get a lighter scene, fast computers the full one */
/* ------------------------------------------------------------------ */
export type Quality = {
  level: 0 | 1 | 2
  dpr: number
  /** shadow map size, and how often (in frames) it's redrawn (every frame: skipping frames made
   *  the cup's own shadows lag and jump as it turns, which read as flickering light on phones) */
  shadowSize: number
  shadowEvery: number
  beanShadows: boolean
  beans: number
  /** see-through honey, ice and droplets (needs an extra render pass) */
  transmission: boolean
  /** clearcoat / sheen materials */
  rich: boolean
  wisps: number
  octaves: number
  runners: boolean
  /** texture resolution multiplier */
  tex: number
  segments: number
}

export const LEVELS: Quality[] = [
  { level: 0, dpr: 1.5, shadowSize: 1024, shadowEvery: 1, beanShadows: true, beans: 20, transmission: false, rich: false, wisps: 1, octaves: 3, runners: false, tex: 0.75, segments: 56 },
  { level: 1, dpr: 1.75, shadowSize: 1024, shadowEvery: 1, beanShadows: true, beans: 32, transmission: true, rich: false, wisps: 2, octaves: 4, runners: false, tex: 0.75, segments: 72 },
  { level: 2, dpr: 2, shadowSize: 1024, shadowEvery: 1, beanShadows: true, beans: 46, transmission: true, rich: true, wisps: 3, octaves: 5, runners: true, tex: 1, segments: 96 },
]

/**
 * The graphics chip's name as the browser reports it (e.g. "Adreno (TM) 740", "Apple M2"), or "".
 * Opening a WebGL context to ask is slow (it starts up the graphics side of the browser and holds
 * up the page for a moment), so with the background worker this runs in the worker, not on the page.
 */
export function gpuName() {
  try {
    const c = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(1, 1)
    const gl = c.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return ''
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return name
  } catch {
    return ''
  }
}

/** Can this browser draw WebGL on the page at all? (Also opens a context, so only used when needed.) */
export function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * How much the graphics chip can take: 0 light, 1 medium, 2 full, or null when the name
 * doesn't tell us (e.g. iPhones just say "Apple GPU"). Only used to step *down*.
 */
export function gpuLevel(name: string): 0 | 1 | 2 | null {
  const s = name.toLowerCase()
  if (!s) return null
  // drawn by the processor instead of a graphics chip: keep it light
  if (/swiftshader|llvmpipe|softpipe|software|basic render/.test(s)) return 0
  // Android: Qualcomm Adreno, e.g. 610 (budget) … 740 (flagship)
  const adreno = s.match(/adreno[^0-9]*(\d{3})/)
  if (adreno) {
    const n = Number(adreno[1])
    const series = Math.floor(n / 100)
    const tier = n % 100
    if (series <= 5) return 0
    if (series === 6) return tier >= 40 ? 2 : tier >= 18 ? 1 : 0
    return tier >= 30 ? 2 : 1
  }
  // Android: Arm Mali / Immortalis
  if (s.includes('immortalis')) return 2
  const mali = s.match(/mali-?\s*([gt])(\d+)/)
  if (mali) {
    if (mali[1] === 't') return 0
    const n = Number(mali[2])
    if (n >= 100) return n >= 700 ? 2 : 1 // G610, G710 …
    return n >= 68 ? 1 : 0 // G52/G57 budget, G76/G78 good
  }
  if (/powervr|img /.test(s)) return 0
  // computers
  if (/apple m\d|nvidia|geforce|radeon|amd /.test(s)) return 2
  if (s.includes('intel')) return 1
  return null
}

let deviceGuess: 0 | 1 | 2 | null = null
/**
 * A first guess from the device alone (processor, memory, screen), without asking the graphics
 * chip; picked once per visit. ?quality=0|1|2 forces a level (handy for checking how each looks).
 */
export function deviceLevel(): 0 | 1 | 2 {
  if (deviceGuess !== null) return deviceGuess
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === '0' || forced === '1' || forced === '2') return (deviceGuess = Number(forced) as 0 | 1 | 2)
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  const cores = nav.hardwareConcurrency || 4
  const memory = nav.deviceMemory ?? 8
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.matchMedia('(max-width: 760px)').matches
  let level: 0 | 1 | 2 = 2
  if (nav.connection?.saveData || cores <= 4 || memory <= 3) level = 0
  else if (coarse || small || cores < 8) level = 1
  return (deviceGuess = level)
}

/** The device's guess, stepped down if the graphics chip is a weak one (it only ever steps down). */
export function capByGpu(level: 0 | 1 | 2): 0 | 1 | 2 {
  const gpu = gpuLevel(gpuName())
  return gpu !== null && gpu < level ? gpu : level
}

let chosenLevel: 0 | 1 | 2 | null = null
/** The level for drawing on the page: the device's guess and the graphics chip (picked once per visit). */
export function startLevel(): 0 | 1 | 2 {
  if (chosenLevel !== null) return chosenLevel
  const level = deviceLevel()
  return (chosenLevel = qualityForced() ? level : capByGpu(level))
}

/** ?quality=… on the address: the level is fixed, so the scene shouldn't adapt it. */
export const qualityForced = () => /[?&]quality=/.test(window.location.search)

/** Phones and tablets: draw fewer frames while nothing is scrolling (see FrameLimiter). */
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/** ?bake=1 repaints the textures for scripts/bake-hero-textures.mjs (always on the page itself). */
// (checks `document`, not `window`: Next.js compiles `typeof window` away, which breaks in the worker)
export const BAKING = typeof document !== 'undefined' && /[?&]bake=1/.test(window.location.search)

/**
 * Can the scene be drawn in a background worker? Needs a canvas that can be handed over
 * (OffscreenCanvas) and WebGL there. Safari and every iPhone browser (all WebKit) only have WebGL
 * in workers from version 17, so older ones stay on the page. ?worker=0 turns the worker off,
 * ?worker=1 tries it anyway. (If it still fails to start, the page draws the scene instead.)
 */
export function workerSupported() {
  if (typeof window === 'undefined' || BAKING) return false
  const asked = new URLSearchParams(window.location.search).get('worker')
  if (asked === '0') return false
  const can =
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    'transferControlToOffscreen' in HTMLCanvasElement.prototype
  if (!can) return false
  if (asked === '1') return true
  const ua = navigator.userAgent
  const webkit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua)
  if (!webkit) return true
  // Safari says "Version/17.x"; other iPhone browsers only give the system, "OS 17_x"
  const v = ua.match(/Version\/(\d+)/) ?? ua.match(/ OS (\d+)_/)
  return v ? Number(v[1]) >= 17 : false
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { LOGO_PATH, LOGO_TRANSFORM } from '../LogoMark'

/* ------------------------------------------------------------------ */
/* Colours (sampled from the café's studio photos)                     */
/* ------------------------------------------------------------------ */
const BROWN = '#4a2e2b' // logo brown
const BAMBOO = '#d6a89b' // blush bamboo-fibre cup
const LID = '#e4cbb6' // its cream lid
const GOLD = '#d2ac55' // honey jar lid

export type HeroTone = 'studio' | 'cream'

/** Backdrop colours: centre of the light pool, and the edges (matches the studio photos). */
const BACKDROP: Record<HeroTone, { centre: string; edge: string; floor: string; steam: string; shadow: number }> = {
  studio: { centre: '#6d5249', edge: '#4c3630', floor: '#6a4f45', steam: '#fff7ee', shadow: 0.5 },
  cream: { centre: '#f6eee3', edge: '#e7d8c5', floor: '#efe3d3', steam: '#8a6a58', shadow: 0.22 },
}

type Progress = { current: number }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** 0 → 1 between a and b, eased */
const ramp = (p: number, a: number, b: number) => {
  const t = clamp01((p - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Seeded random so every visit looks the same */
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/** Draws the H&H bee monogram onto a 2D canvas at (x, y) with the given height. */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string) {
  const s = h / 1216
  const m = LOGO_TRANSFORM.match(/translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+),([-\d.]+)\)/)
  const [tx, ty, sx, sy] = m ? m.slice(1).map(Number) : [0, 1216, 0.1, -0.1]
  ctx.save()
  ctx.translate(x - (956 * s) / 2, y - h / 2)
  ctx.scale(s, s)
  ctx.translate(tx, ty)
  ctx.scale(sx, sy)
  ctx.fillStyle = color
  ctx.fill(new Path2D(LOGO_PATH))
  ctx.restore()
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

/** Fine fibre speckle, like the café's bamboo-fibre reusable cups. */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, rgb: string, max: number, rand: () => number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rgb},${rand() * max})`
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.4, 1 + rand() * 1.4)
  }
}

/** Grey-scale noise used as a bump map (bamboo fibre, paper, brushed metal). */
function noiseTexture(size: number, seed: number, stripes = 0) {
  const [c, ctx] = canvas(size, size)
  const rand = rng(seed)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  if (stripes) {
    // fine vertical ridges (knurled metal lid)
    for (let x = 0; x < size; x += size / stripes) {
      const g = ctx.createLinearGradient(x, 0, x + size / stripes, 0)
      g.addColorStop(0, '#5a5a5a')
      g.addColorStop(0.5, '#b0b0b0')
      g.addColorStop(1, '#5a5a5a')
      ctx.fillStyle = g
      ctx.fillRect(x, 0, size / stripes, size)
    }
  }
  speckle(ctx, size, size, size * size * 0.35, '255,255,255', 0.25, rand)
  speckle(ctx, size, size, size * size * 0.35, '0,0,0', 0.25, rand)
  const tex = toTexture(c, false)
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Turns a height map (white = raised) into a tangent-space normal map. */
function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const { width: w, height: h } = src
  const sctx = src.getContext('2d')!
  const hd = sctx.getImageData(0, 0, w, h).data
  const [c, ctx] = canvas(w, h)
  const out = ctx.createImageData(w, h)
  const H = (x: number, y: number) => hd[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * w + x) * 4
      out.data[i] = (-dx * inv * 0.5 + 0.5) * 255
      out.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255
      out.data[i + 2] = (inv * 0.5 + 0.5) * 255
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  const tex = toTexture(c, false)
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

/**
 * Condensation on a cold cup: a frosty haze (alpha map) broken up by droplets,
 * plus a normal map so every droplet catches the light.
 */
function condensation(w: number, h: number, seed: number) {
  const rand = rng(seed)
  const [heightC, hctx] = canvas(w, h)
  const [fogC, fctx] = canvas(w, h)
  hctx.fillStyle = '#000'
  hctx.fillRect(0, 0, w, h)
  // Haze: thicker lower down where the ice and milk keep the cup coldest
  const g = fctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgb(46,46,46)') // canvas top = top of the cup
  g.addColorStop(0.35, 'rgb(66,66,66)')
  g.addColorStop(1, 'rgb(84,84,84)')
  fctx.fillStyle = g
  fctx.fillRect(0, 0, w, h)
  speckle(fctx, w, h, w * h * 0.25, '255,255,255', 0.16, rand)

  const drop = (x: number, y: number, r: number, stretch = 1) => {
    // height: domed droplet
    const hg = hctx.createRadialGradient(x - r * 0.2, y - r * 0.25, 0, x, y, r)
    hg.addColorStop(0, 'rgba(255,255,255,1)')
    hg.addColorStop(0.65, 'rgba(200,200,200,0.85)')
    hg.addColorStop(1, 'rgba(0,0,0,0)')
    hctx.fillStyle = hg
    hctx.beginPath()
    hctx.ellipse(x, y, r, r * stretch, 0, 0, Math.PI * 2)
    hctx.fill()
    // a droplet clears the haze (a little lens), with a bright rim
    fctx.fillStyle = 'rgba(20,20,20,0.9)'
    fctx.beginPath()
    fctx.ellipse(x, y, r * 0.78, r * 0.78 * stretch, 0, 0, Math.PI * 2)
    fctx.fill()
    fctx.strokeStyle = 'rgba(255,255,255,0.55)'
    fctx.lineWidth = Math.max(1, r * 0.16)
    fctx.beginPath()
    fctx.ellipse(x, y, r * 0.86, r * 0.86 * stretch, 0, Math.PI * 0.95, Math.PI * 1.75)
    fctx.stroke()
  }
  // mist of tiny droplets
  for (let i = 0; i < w * h * 0.0035; i++) drop(rand() * w, rand() * h, 1 + rand() * 2.2)
  // medium droplets
  for (let i = 0; i < w * h * 0.00045; i++) drop(rand() * w, rand() * h, 3 + rand() * 5, 1 + rand() * 0.3)
  // a few drips that have run, with trails
  for (let i = 0; i < 14; i++) {
    const x = rand() * w
    const y0 = rand() * h * 0.6
    const len = 40 + rand() * 160
    hctx.strokeStyle = 'rgba(150,150,150,0.8)'
    fctx.strokeStyle = 'rgba(25,25,25,0.85)'
    const lw = 2 + rand() * 3
    hctx.lineWidth = lw
    fctx.lineWidth = lw * 1.4
    for (const ctx of [hctx, fctx]) {
      ctx.beginPath()
      ctx.moveTo(x, y0)
      ctx.bezierCurveTo(x + (rand() - 0.5) * 8, y0 + len * 0.4, x + (rand() - 0.5) * 8, y0 + len * 0.7, x + (rand() - 0.5) * 6, y0 + len)
      ctx.stroke()
    }
    drop(x, y0 + len + 4, 6 + rand() * 4, 1.25)
  }
  const fog = toTexture(fogC, false)
  fog.wrapT = THREE.RepeatWrapping
  return { fog, normal: heightToNormal(heightC, 5) }
}

/** A lathe from [radius, height] points. */
const lathe = (pts: [number, number][], segments = 96) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(Math.max(0, x), y)),
    segments,
  )

/* ------------------------------------------------------------------ */
/* Shared materials                                                    */
/* ------------------------------------------------------------------ */

/** Reflections only (added on top), so clear plastic and glass sparkle without going grey. */
function glossMaterial(normalMap?: THREE.Texture, intensity = 2) {
  return new THREE.MeshPhysicalMaterial({
    color: '#000000',
    roughness: 0.04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    envMapIntensity: intensity,
    normalMap: normalMap ?? null,
    normalScale: new THREE.Vector2(1.4, 1.4),
    side: THREE.FrontSide,
  })
}

/* ------------------------------------------------------------------ */
/* Steam (hot) and cold mist                                           */
/* ------------------------------------------------------------------ */
const steamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const steamFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uDir;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    // h runs 0 at the source to 1 at the end of the wisp
    float h = uDir > 0.0 ? vUv.y : 1.0 - vUv.y;
    float t = uTime * 0.22 + uSeed * 10.0;
    // the column sways more the higher it rises
    float sway = (fbm(vec2(h * 1.6 - t * 0.6, uSeed)) - 0.5) * 0.9 * h;
    float x = vUv.x - 0.5 - sway;
    float width = mix(0.06, 0.34, pow(h, 0.8));
    float column = smoothstep(width, width * 0.15, abs(x));
    float curls = fbm(vec2(x * 4.0 + uSeed, h * 2.6 - t * 1.6));
    curls = smoothstep(0.38, 0.85, curls);
    float a = column * curls;
    a *= smoothstep(0.0, 0.18, h) * (1.0 - smoothstep(0.55, 1.0, h));
    gl_FragColor = vec4(uColor, a * uOpacity);
    #include <colorspace_fragment>
  }
`

function Wisp({
  color,
  opacity,
  seed,
  dir = 1,
  size,
  position,
  still,
}: {
  color: string
  opacity: number
  seed: number
  dir?: 1 | -1
  size: [number, number]
  position: [number, number, number]
  still: boolean
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: steamVertex,
        fragmentShader: steamFragment,
        uniforms: {
          uTime: { value: seed * 3 },
          uSeed: { value: seed },
          uOpacity: { value: opacity },
          uDir: { value: dir },
          uColor: { value: new THREE.Color(color) },
        },
        transparent: true,
        depthWrite: false,
      }),
    [seed, dir, opacity, color],
  )
  useFrame((_, dt) => {
    if (!still) mat.uniforms.uTime.value += dt
  })
  return (
    <Billboard position={position} lockX lockZ>
      <mesh material={mat} renderOrder={10}>
        <planeGeometry args={size} />
      </mesh>
    </Billboard>
  )
}

/* ------------------------------------------------------------------ */
/* Objects (modelled on the café's own cups and honey jar)             */
/* ------------------------------------------------------------------ */

/** The blush bamboo-fibre reusable cup: matte speckled body, stepped foot, cream lid with a sliding tab. */
function HotCup({ steam, still }: { steam: string; still: boolean }) {
  const wallR = (y: number) => 0.585 + ((0.72 - 0.585) * (y + 0.87)) / (0.86 + 0.87)
  const body = useMemo(
    () =>
      lathe([
        [0, -1.05],
        [0.52, -1.05],
        [0.548, -1.04],
        [0.556, -1.015],
        [0.556, -0.905],
        [0.574, -0.888],
        [wallR(-0.87), -0.87],
        [wallR(0.86), 0.86],
        [0.735, 0.875],
        [0.73, 0.9],
      ]),
    [],
  )
  const lid = useMemo(
    () =>
      lathe([
        [0.71, 0.8],
        [0.762, 0.8],
        [0.784, 0.815],
        [0.792, 0.86],
        [0.787, 0.915],
        [0.765, 0.94],
        [0.7, 0.947],
        [0.684, 0.965],
        [0.664, 1.07],
        [0.646, 1.093],
        [0.6, 1.1],
        [0.2, 1.1],
        [0, 1.1],
      ]),
    [],
  )
  const print = useMemo(() => {
    const [c, ctx] = canvas(2048, 400)
    // front (middle of the texture) and back (split across the seam)
    for (const x of [0, 1024, 2048]) drawMark(ctx, x, 200, 330, '#5a3730')
    return toTexture(c)
  }, [])
  const band = useMemo(() => new THREE.CylinderGeometry(wallR(0.42) + 0.003, wallR(-0.42) + 0.003, 0.84, 128, 1, true, -Math.PI, Math.PI * 2), [])
  const fibre = useMemo(() => {
    const [c, ctx] = canvas(1024, 1024)
    const rand = rng(7)
    ctx.fillStyle = BAMBOO
    ctx.fillRect(0, 0, 1024, 1024)
    speckle(ctx, 1024, 1024, 26000, '120,70,55', 0.12, rand)
    speckle(ctx, 1024, 1024, 12000, '255,240,232', 0.18, rand)
    const t = toTexture(c)
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 2)
    return t
  }, [])
  const tab = useMemo(() => new RoundedBoxGeometry(0.3, 0.07, 0.56, 3, 0.025), [])
  const bump = useMemo(() => {
    const t = noiseTexture(512, 11)
    t.repeat.set(4, 3)
    return t
  }, [])

  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={fibre}
          bumpMap={bump}
          bumpScale={0.6}
          roughness={0.82}
          sheen={0.5}
          sheenColor="#f6dcd2"
          sheenRoughness={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={band} receiveShadow>
        <meshStandardMaterial map={print} transparent alphaTest={0.45} roughness={0.62} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={lid} castShadow receiveShadow>
        <meshPhysicalMaterial color={LID} roughness={0.55} bumpMap={bump} bumpScale={0.25} clearcoat={0.15} clearcoatRoughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* sliding drink-through cover */}
      <mesh position={[0, 1.13, -0.2]} castShadow receiveShadow geometry={tab}>
        <meshPhysicalMaterial color={LID} roughness={0.5} clearcoat={0.15} />
      </mesh>
      {/* the drinking slot */}
      <mesh position={[0, 1.103, 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.24, 0.07]} />
        <meshStandardMaterial color="#3a2420" roughness={0.9} />
      </mesh>
      {/* steam rising from the slot */}
      <Wisp color={steam} opacity={0.5} seed={1.3} size={[1.1, 2.2]} position={[0, 2.15, 0.32]} still={still} />
      <Wisp color={steam} opacity={0.36} seed={4.7} size={[0.95, 1.9]} position={[0.16, 2.0, 0.25]} still={still} />
      <Wisp color={steam} opacity={0.28} seed={8.1} size={[1.3, 2.5]} position={[-0.14, 2.35, 0.2]} still={still} />
    </group>
  )
}

/** Clear PET iced-drink cup: latte and ice inside, condensation and droplets outside, a straw and flat lid. */
function IcedCup({ matcha, still, mist }: { matcha: { current: number }; still: boolean; mist: string }) {
  const R = 0.2
  const wallR = (y: number) => 0.5 + ((0.7 - 0.5) * (y + 1.05)) / 2.05
  /** The cup's outline (rounded base like the café's PET cups), pushed out by `o`, up to `top`. */
  const outline = (o: number, top: number, inset = 0): [number, number][] => {
    const cx = wallR(-1.05 + R) - R
    const pts: [number, number][] = [[0, -1.05 + inset]]
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * R + o - inset, -1.05 + inset + R + Math.sin(a) * R])
    }
    const y0 = -1.05 + inset + R
    for (let i = 1; i <= 28; i++) {
      const y = y0 + ((top - y0) * i) / 28
      pts.push([wallR(y) + o - inset, y])
    }
    return pts
  }
  const LIQ_TOP = 0.02
  const geo = useMemo(() => {
    const shell = (o: number) => lathe([...outline(o, 0.98), [0.71 + o, 1.0]], 96)
    const liquid = lathe([...outline(0, LIQ_TOP, 0.03), [0, LIQ_TOP]], 72)
    // per-vertex colours, recoloured as the drink turns to matcha
    liquid.setAttribute('color', new THREE.BufferAttribute(new Float32Array(liquid.attributes.position.count * 3), 3))
    const lid = lathe([
      [0.66, 0.965],
      [0.725, 0.99],
      [0.745, 1.02],
      [0.742, 1.05],
      [0.71, 1.062],
      [0.62, 1.07],
      [0.56, 1.1],
      [0.2, 1.112],
      [0, 1.112],
    ])
    const band = new THREE.CylinderGeometry(wallR(0.36) + 0.004, wallR(-0.46) + 0.004, 0.82, 128, 1, true, -Math.PI, Math.PI * 2)
    band.translate(0, -0.05, 0)
    return { inner: shell(-0.012), outer: shell(0), frost: shell(0.006), gloss: shell(0.01), liquid, lid, band }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cond = useMemo(() => condensation(1024, 600, 3), [])
  const mats = useMemo(() => {
    const frost = new THREE.MeshPhysicalMaterial({
      color: '#f3f1ee',
      roughness: 0.55,
      alphaMap: cond.fog,
      transparent: true,
      depthWrite: false,
      normalMap: cond.normal,
      normalScale: new THREE.Vector2(1, 1),
    })
    const frostBack = frost.clone()
    frostBack.side = THREE.BackSide
    frostBack.opacity = 0.6
    return {
      frost,
      frostBack,
      gloss: glossMaterial(cond.normal, 2.4),
      tint: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.15, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }),
      lidGloss: glossMaterial(undefined, 2.2),
    }
  }, [cond])
  // Lid is clear too: a faint tint plus reflections
  const lidTint = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.12, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )

  const print = useMemo(() => {
    const [c, ctx] = canvas(2048, 420)
    for (const x of [0, 1024, 2048]) drawMark(ctx, x, 210, 360, BROWN)
    return toTexture(c)
  }, [])

  // Iced latte: espresso and caramel at the top, milky at the bottom → iced matcha
  const coffee = useMemo(() => ['#bf9066', '#a97a4f', '#8a5a34', '#5c3720'].map((c) => new THREE.Color(c)), [])
  const green = useMemo(() => ['#c4cf9a', '#a9bd78', '#86a352', '#5f7e36'].map((c) => new THREE.Color(c)), [])
  const lastMix = useRef(-1)
  const tmpA = useMemo(() => new THREE.Color(), [])
  const tmpB = useMemo(() => new THREE.Color(), [])

  const recolour = (mix: number) => {
    const pos = geo.liquid.attributes.position
    const col = geo.liquid.attributes.color as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      // 0 at the bottom of the cup, 1 at the surface
      const h = clamp01((pos.getY(i) + 1.05) / (LIQ_TOP + 1.05))
      const f = Math.pow(h, 2.2) * 3
      const k = Math.min(2, Math.floor(f))
      const t = f - k
      tmpA.copy(coffee[k]).lerp(coffee[k + 1], t)
      tmpB.copy(green[k]).lerp(green[k + 1], t)
      tmpA.lerp(tmpB, mix)
      col.setXYZ(i, tmpA.r, tmpA.g, tmpA.b)
    }
    col.needsUpdate = true
  }

  const ice = useMemo(() => {
    const rand = rng(21)
    const g = new RoundedBoxGeometry(1, 1, 1, 3, 0.18)
    const list: { pos: [number, number, number]; rot: [number, number, number]; s: [number, number, number] }[] = []
    const ys = [-0.32, -0.12, 0.05, 0.16, 0.28, 0.38, 0.5, 0.6, 0.72]
    ys.forEach((y, i) => {
      const a = i * 2.39 + rand()
      const rr = (wallR(y) - 0.24) * (0.35 + rand() * 0.6)
      list.push({
        pos: [Math.cos(a) * rr, y, Math.sin(a) * rr],
        rot: [rand() * 3, rand() * 3, rand() * 3],
        s: [0.27 + rand() * 0.07, 0.24 + rand() * 0.06, 0.27 + rand() * 0.07],
      })
    })
    return { g, list }
  }, [])

  // Droplets running down the outside
  const runners = useRef<THREE.Group>(null)
  const drops = useMemo(() => {
    const rand = rng(5)
    return Array.from({ length: 11 }, () => ({ a: -1.5 + rand() * 3, y: -0.8 + rand() * 1.6, v: 0.04 + rand() * 0.08, s: 0.75 + rand() * 0.6, phase: rand() * 10 }))
  }, [])
  const dropGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), [])

  useFrame(({ clock }, dt) => {
    const m = matcha.current
    if (Math.abs(m - lastMix.current) > 0.004) {
      lastMix.current = m
      recolour(m)
    }
    if (still || !runners.current) return
    const t = clock.elapsedTime
    runners.current.children.forEach((child, i) => {
      const d = drops[i]
      // stop-start, like real drips
      d.y -= dt * d.v * Math.max(0, Math.sin(t * 0.9 + d.phase) + 0.35) * 1.6
      if (d.y < -0.9) {
        d.y = 0.85
        d.a = -1.5 + Math.random() * 3
      }
      const r = wallR(d.y) + 0.012
      child.position.set(Math.sin(d.a) * r, d.y, Math.cos(d.a) * r)
      child.rotation.set(0, d.a, 0)
    })
  })

  return (
    <group>
      {/* the drink */}
      <mesh geometry={geo.liquid} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors roughness={0.32} sheen={0.4} sheenColor="#fff2df" clearcoat={0.3} />
      </mesh>
      {ice.list.map((c, i) => (
        <mesh key={i} geometry={ice.g} position={c.pos} rotation={c.rot} scale={c.s}>
          <meshPhysicalMaterial
            color="#fffaf2"
            transmission={1}
            thickness={0.35}
            roughness={0.16}
            ior={1.31}
            attenuationColor="#e9d3b8"
            attenuationDistance={1.2}
            envMapIntensity={1.6}
            clearcoat={0.6}
          />
        </mesh>
      ))}
      {/* straw: clear, slightly frosted */}
      <group position={[0.1, 1.0, 0.04]} rotation={[0.06, 0, -0.17]}>
        <mesh renderOrder={2}>
          <cylinderGeometry args={[0.052, 0.052, 2.7, 24, 1, true]} />
          <meshPhysicalMaterial color="#fbf8f2" roughness={0.35} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh renderOrder={3} material={mats.lidGloss}>
          <cylinderGeometry args={[0.054, 0.054, 2.7, 24, 1, true]} />
        </mesh>
      </group>
      {/* the clear cup: back haze, faint tint, print, front haze with droplets, reflections */}
      <mesh geometry={geo.inner} material={mats.frostBack} renderOrder={1} />
      <mesh geometry={geo.outer} material={mats.tint} renderOrder={2} />
      <mesh geometry={geo.band} renderOrder={3}>
        <meshStandardMaterial map={print} transparent alphaTest={0.45} roughness={0.55} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geo.frost} material={mats.frost} renderOrder={4} />
      <mesh geometry={geo.gloss} material={mats.gloss} renderOrder={5} />
      <mesh geometry={geo.lid} material={lidTint} renderOrder={6} />
      <mesh geometry={geo.lid} material={mats.lidGloss} renderOrder={7} />
      {/* fresh drips */}
      <group ref={runners}>
        {drops.map((d, i) => (
          <mesh key={i} geometry={dropGeo} scale={[0.028 * d.s, 0.04 * d.s, 0.012 * d.s]}>
            <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.05} roughness={0.02} ior={1.33} envMapIntensity={2.4} clearcoat={1} />
          </mesh>
        ))}
      </group>
      {/* cold air spilling over the rim and off the base */}
      <Wisp color={mist} opacity={0.14} seed={2.2} dir={-1} size={[1.6, 1.2]} position={[0, -1.25, 0.25]} still={still} />
      <Wisp color={mist} opacity={0.1} seed={6.4} dir={-1} size={[1.4, 1.0]} position={[0.2, 0.75, 0.6]} still={still} />
    </group>
  )
}

/** The café's 340g Pure Honey jar: golden honey in clear glass, cream label, knurled gold lid, brown seal. */
function HoneyJar() {
  const geo = useMemo(() => {
    const glassPts: [number, number][] = [
      [0, -0.8],
      [0.5, -0.8],
      [0.54, -0.785],
      [0.558, -0.75],
      [0.562, -0.7],
      [0.562, 0.36],
      [0.553, 0.43],
      [0.528, 0.485],
      [0.49, 0.52],
      [0.476, 0.545],
      [0.476, 0.72],
      [0.468, 0.74],
    ]
    const honeyPts: [number, number][] = [
      [0, -0.72],
      [0.49, -0.72],
      [0.522, -0.7],
      [0.53, -0.66],
      [0.53, 0.35],
      [0.52, 0.42],
      [0.49, 0.47],
      [0.452, 0.505],
      [0.442, 0.53],
      [0.442, 0.6],
      [0.3, 0.605],
      [0, 0.605],
    ]
    const label = new THREE.CylinderGeometry(0.5655, 0.5655, 0.92, 128, 1, true, -Math.PI, Math.PI * 2)
    label.translate(0, -0.17, 0)
    return {
      glass: lathe(glassPts),
      glassIn: lathe(glassPts.map(([x, y]) => [x - 0.02, y + (y < -0.7 ? 0.05 : 0)])),
      honey: lathe(honeyPts),
      label,
    }
  }, [])

  const labelTex = useMemo(() => {
    const W = 2048
    const H = 524
    const [c, ctx] = canvas(W, H)
    const rand = rng(17)
    ctx.fillStyle = '#efe5d3'
    ctx.fillRect(0, 0, W, H)
    speckle(ctx, W, H, 40000, '140,110,80', 0.06, rand)
    const cx = W / 2
    const serif = '"Times New Roman", Times, "Liberation Serif", Georgia, serif'
    ctx.fillStyle = BROWN
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `${Math.round(H * 0.17)}px ${serif}`
    ctx.fillText('Pure Honey', cx, H * 0.22)
    drawMark(ctx, cx, H * 0.45, H * 0.3, BROWN)
    ctx.font = `${Math.round(H * 0.06)}px ${serif}`
    ctx.fillText('Produced as a collaboration with', cx, H * 0.69)
    ctx.fillText('Tythe Bees in England’s Vale of Belvoir', cx, H * 0.77)
    ctx.font = `${Math.round(H * 0.095)}px ${serif}`
    ctx.fillText('340g', cx, H * 0.92)
    return toTexture(c)
  }, [])
  const knurl = useMemo(() => {
    const t = noiseTexture(512, 3, 96)
    t.repeat.set(3, 1)
    return t
  }, [])
  const glassMats = useMemo(
    () => ({
      gloss: glossMaterial(undefined, 2.6),
      tint: new THREE.MeshPhysicalMaterial({ color: '#f4f6ef', roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    }),
    [],
  )

  return (
    <group>
      {/* honey: light passes through it and turns amber */}
      <mesh geometry={geo.honey} castShadow>
        <meshPhysicalMaterial
          color="#ffd978"
          transmission={1}
          thickness={1.1}
          roughness={0.04}
          ior={1.49}
          attenuationColor="#f2a72a"
          attenuationDistance={1.1}
          emissive="#e0950f"
          emissiveIntensity={0.42}
          envMapIntensity={1.4}
          clearcoat={1}
        />
      </mesh>
      {/* label wraps the jar */}
      <mesh geometry={geo.label} castShadow receiveShadow>
        <meshPhysicalMaterial map={labelTex} roughness={0.78} sheen={0.2} sheenColor="#ffffff" />
      </mesh>
      {/* glass: faint tint and reflections, thick base */}
      <mesh geometry={geo.glassIn} material={glassMats.tint} renderOrder={2} />
      <mesh geometry={geo.glass} material={glassMats.tint} renderOrder={3} />
      <mesh geometry={geo.glass} material={glassMats.gloss} renderOrder={4} />
      {/* screw thread on the neck */}
      {[0.6, 0.655].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0.04]} material={glassMats.gloss} renderOrder={4}>
          <torusGeometry args={[0.478, 0.012, 8, 96]} />
        </mesh>
      ))}
      {/* knurled gold twist-off lid */}
      <group position={[0, 0.83, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.502, 0.506, 0.2, 128, 1, true]} />
          <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.32} bumpMap={knurl} bumpScale={1.2} envMapIntensity={1.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.492, 0.502, 0.02, 128]} />
          <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.22} envMapIntensity={1.5} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.502, 0.012, 10, 128]} />
          <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.25} />
        </mesh>
        {/* brown tamper seal over the lid and down the neck, front and back */}
        <mesh position={[0, 0.113, 0]}>
          <boxGeometry args={[0.115, 0.006, 1.0]} />
          <meshPhysicalMaterial color={BROWN} roughness={0.25} clearcoat={0.8} />
        </mesh>
        {[1, -1].map((side) => (
          <group key={side}>
            <mesh position={[0, 0, 0.51 * side]}>
              <boxGeometry args={[0.115, 0.226, 0.006]} />
              <meshPhysicalMaterial color={BROWN} roughness={0.25} clearcoat={0.8} />
            </mesh>
            <mesh position={[0, -0.24, 0.49 * side]} rotation={[0.12 * side, 0, 0]}>
              <boxGeometry args={[0.115, 0.3, 0.006]} />
              <meshPhysicalMaterial color={BROWN} roughness={0.25} clearcoat={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** A roasted coffee bean: an oval with the crease pressed into its flat side. */
function useBeanGeometry() {
  return useMemo(() => {
    const g = new THREE.SphereGeometry(1, 32, 24)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      // flatter on the creased side
      if (v.y > 0) v.y *= 0.62
      // the S-shaped crease
      const cx = Math.sin(v.z * 2.2) * 0.08
      if (v.y > 0) v.y -= 0.42 * Math.exp(-((v.x - cx) * (v.x - cx)) / 0.012) * (1 - Math.abs(v.z) * 0.6)
      p.setXYZ(i, v.x * 0.078, v.y * 0.06, v.z * 0.108)
    }
    g.computeVertexNormals()
    return g
  }, [])
}

function Beans({ count, progress, still, spread: wide = 1 }: { count: number; progress: { current: number }; still: boolean; spread?: number }) {
  const geo = useBeanGeometry()
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => {
    const rand = rng(99)
    return Array.from({ length: count }, (_, i) => ({
      a: (i / count) * Math.PI * 2 + rand() * 0.4,
      r: 1.55 + rand() * 1.05,
      h: -1.15 + rand() * 2.7,
      speed: 0.1 + rand() * 0.16,
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      rot: rand() * Math.PI * 2,
      s: 0.85 + rand() * 0.5,
      tone: rand(),
    }))
  }, [count])

  // Each bean a slightly different roast
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dark = new THREE.Color('#2e1a10')
    const light = new THREE.Color('#6b4026')
    const c = new THREE.Color()
    seeds.forEach((b, i) => mesh.setColorAt(i, c.copy(dark).lerp(light, b.tone * 0.8)))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [seeds])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = still ? 0 : clock.elapsedTime
    const p = progress.current
    const spread = 1 + ramp(p, 0.15, 0.5) * 0.22 - ramp(p, 0.72, 1) * 0.2
    seeds.forEach((b, i) => {
      const ang = b.a + t * b.speed + p * Math.PI * 1.6
      const R = b.r * spread * wide
      dummy.position.set(Math.cos(ang) * R, b.h + Math.sin(t * 0.6 + b.a * 3) * 0.08 + (p - 0.5) * (b.h * 0.25), Math.sin(ang) * R * 0.62)
      dummy.quaternion.setFromAxisAngle(b.spin, b.rot + t * 0.7 + p * 6)
      dummy.scale.setScalar(b.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow receiveShadow>
      <meshPhysicalMaterial color="#ffffff" roughness={0.42} clearcoat={0.55} clearcoatRoughness={0.35} sheen={0.2} sheenColor="#a07050" />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* Studio backdrop: a seamless paper sweep that catches real shadows   */
/* ------------------------------------------------------------------ */
const backdropVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const backdropFragment = /* glsl */ `
  uniform vec3 uCentre;
  uniform vec3 uEdge;
  uniform vec3 uFloor;
  uniform vec2 uRes;
  uniform vec2 uFocus;
  varying vec3 vWorld;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 d = (uv - uFocus) * vec2(uRes.x / uRes.y, 1.0);
    float pool = smoothstep(1.15, 0.0, length(d));
    vec3 col = mix(uEdge, uCentre, pool);
    // the floor is a touch lighter, like the studio photos
    col = mix(col, uFloor, smoothstep(-1.2, -1.75, vWorld.y) * 0.35);
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // no banding
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function Backdrop({ tone, focus }: { tone: HeroTone; focus: [number, number] }) {
  const { size, gl } = useThree()
  const geometry = useMemo(() => {
    // floor (z from +8 back to the curve), a quarter circle, then the wall
    const floorY = -1.75
    const wallZ = -3.4
    const r = 2.2
    const prof: [number, number][] = [[10, floorY]]
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * (Math.PI / 2)
      prof.push([wallZ + r - Math.sin(a) * r, floorY + r - Math.cos(a) * r])
    }
    prof.push([wallZ, 14])
    const cols = 2
    const pos: number[] = []
    const idx: number[] = []
    prof.forEach(([z, y]) => {
      for (let c = 0; c < cols; c++) pos.push(c === 0 ? -30 : 30, y, z)
    })
    for (let i = 0; i < prof.length - 1; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  const c = BACKDROP[tone]
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        uniforms: {
          uCentre: { value: new THREE.Color(c.centre) },
          uEdge: { value: new THREE.Color(c.edge) },
          uFloor: { value: new THREE.Color(c.floor) },
          uRes: { value: new THREE.Vector2(1, 1) },
          uFocus: { value: new THREE.Vector2(...focus) },
        },
        toneMapped: false,
      }),
    [c, focus],
  )
  useEffect(() => {
    const dpr = gl.getPixelRatio()
    mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
  }, [size, gl, mat])
  useFrame(() => {
    // keep in step with resolution changes from the performance monitor
    const dpr = gl.getPixelRatio()
    mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
  })
  return (
    <group>
      <mesh geometry={geometry} material={mat} />
      <mesh geometry={geometry} receiveShadow renderOrder={1}>
        <shadowMaterial transparent opacity={c.shadow} color="#1a0d08" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Choreography                                                        */
/* ------------------------------------------------------------------ */
function Rig({ progress, still, beanCount, tone, spread = 1 }: { progress: Progress; still: boolean; beanCount: number; tone: HeroTone; spread?: number }) {
  const rig = useRef<THREE.Group>(null)
  const cup = useRef<THREE.Group>(null)
  const bottle = useRef<THREE.Group>(null)
  const jar = useRef<THREE.Group>(null)
  const smooth = useRef(0)
  const matcha = useRef(0)

  useFrame(({ clock, pointer }, dt) => {
    smooth.current += (progress.current - smooth.current) * Math.min(1, dt * 5)
    const p = smooth.current
    const t = still ? 0 : clock.elapsedTime
    matcha.current = ramp(p, 0.42, 0.6) * (1 - ramp(p, 0.86, 1))

    const enter = ramp(p, 0.12, 0.4) // iced cup arrives
    const honey = ramp(p, 0.7, 0.92) // honey jar arrives

    if (cup.current) {
      cup.current.position.set((lerp(0, -1.1, enter) + lerp(0, -0.25, honey)) * spread, Math.sin(t * 0.9) * 0.05 + lerp(0, 0.1, honey), lerp(0, -0.45, honey))
      cup.current.rotation.set(0.06, t * 0.3 + p * Math.PI * 2.2, Math.sin(t * 0.7) * 0.04 + lerp(0, 0.1, enter))
    }
    if (bottle.current) {
      bottle.current.position.set((lerp(4.8, 1.1, enter) + lerp(0, 0.25, honey)) * spread, Math.sin(t * 0.9 + 1.4) * 0.05 + lerp(0, 0.1, honey), lerp(0, -0.45, honey))
      bottle.current.rotation.set(0.05, -t * 0.25 - p * Math.PI * 1.8, lerp(-0.35, -0.08, enter))
      bottle.current.visible = enter > 0.001
    }
    if (jar.current) {
      jar.current.position.set(0.12, lerp(-4, -0.62, honey) + Math.sin(t * 0.9 + 2.2) * 0.04, lerp(0, 1.3, honey))
      // spins in, then settles facing front with a gentle sway
      jar.current.rotation.set(0.08, (1 - honey) * 5 + Math.sin(t * 0.5) * 0.45, 0)
      jar.current.visible = honey > 0.001
    }
    if (rig.current) {
      const s = lerp(1, 0.9, honey)
      rig.current.scale.setScalar(s)
      rig.current.rotation.y += (pointer.x * 0.2 - rig.current.rotation.y) * 0.05
      rig.current.rotation.x += (-pointer.y * 0.08 - rig.current.rotation.x) * 0.05
    }
  })

  const c = BACKDROP[tone]
  return (
    <group ref={rig}>
      <group ref={cup}>
        <HotCup steam={c.steam} still={still} />
      </group>
      <group ref={bottle} visible={false}>
        <IcedCup matcha={matcha} still={still} mist={tone === 'studio' ? '#f4f6f8' : '#9aa3a8'} />
      </group>
      <group ref={jar} visible={false} scale={0.82}>
        <HoneyJar />
      </group>
      <Beans count={beanCount} progress={smooth} still={still} spread={spread} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
function Stage({ tone, small, children }: { tone: HeroTone; small: boolean; children: (spread: number) => React.ReactNode }) {
  const { size, camera } = useThree()
  const aspect = size.width / size.height
  const narrow = aspect < 0.9

  // Pull the camera back on narrow screens so everything fits
  useEffect(() => {
    const z = aspect < 0.75 ? 12 : aspect < 1.1 ? 9.2 : 8.6
    camera.position.set(0, 0.45, z)
    camera.lookAt(0, -0.1, 0)
  }, [aspect, camera])

  // Wide screens: objects sit right of the headline. Phones: objects in the top half, text below.
  const x = aspect > 1.15 ? Math.min(1.5, 0.7 + (aspect - 1.15) * 1.8) : 0
  const y = narrow ? 1.05 : 0
  const focus: [number, number] = narrow ? [0.5, 0.7] : [aspect > 1.15 ? 0.66 : 0.5, 0.55]
  return (
    <>
      <Backdrop tone={tone} focus={focus} />
      <group position={[x, y, 0]}>
        <Lights small={small} />
        {children(narrow ? 0.6 : 1)}
      </group>
    </>
  )
}

function Lights({ small }: { small: boolean }) {
  const key = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    if (key.current) key.current.target = target
  }, [target])
  return (
    <>
      <primitive object={target} position={[0.8, -0.6, 0]} />
      <hemisphereLight args={['#fff4e6', '#6b4a3c', 0.55]} />
      {/* soft key from the front left, like the photographer's softbox */}
      <spotLight
        ref={key}
        position={[-5.5, 7.5, 7]}
        angle={0.5}
        penumbra={1}
        intensity={3.2}
        decay={0}
        color="#fff3e4"
        castShadow
        shadow-mapSize={small ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
        shadow-radius={8}
        shadow-camera-near={4}
        shadow-camera-far={30}
      />
      {/* warm rim from behind: makes honey glow and glass edges shine */}
      <directionalLight position={[4.5, 3.5, -5]} intensity={1.8} color="#ffcf8a" />
      {/* low fill from the right */}
      <directionalLight position={[6, 1, 4]} intensity={0.45} color="#ffe9d6" />
    </>
  )
}

export default function CupScene({ progress, still = false, tone = 'studio' }: { progress: Progress; still?: boolean; tone?: HeroTone }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [small, setSmall] = useState(false)
  const [dpr, setDpr] = useState(1.5)

  // Only render frames while the scene is on screen
  useEffect(() => {
    setSmall(window.matchMedia('(max-width: 760px)').matches)
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop={still ? 'demand' : visible ? 'always' : 'never'}
        dpr={small ? Math.min(dpr, 1.5) : dpr}
        shadows="percentage"
        camera={{ fov: 32, position: [0, 0.45, 8.6], near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        {/* Drop resolution on slower devices, raise it on fast ones */}
        <PerformanceMonitor onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))} onDecline={() => setDpr(1)} />
        {/* What the shiny things reflect: a big softbox left, a strip right, a ceiling panel */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[-5, 2, 3]} rotation-y={Math.PI / 2.6} scale={[4, 6, 1]} color="#fff6ea" />
          <Lightformer form="rect" intensity={2.2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 6, 1]} color="#fff0de" />
          <Lightformer form="rect" intensity={1.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[6, 4, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.4} position={[2, 1, -6]} scale={[8, 4, 1]} color="#f2b56a" />
        </Environment>
        <Stage tone={tone} small={small}>
          {(spread) => <Rig progress={progress} still={still} beanCount={small ? 30 : 56} tone={tone} spread={spread} />}
        </Stage>
      </Canvas>
    </div>
  )
}

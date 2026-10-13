'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { LOGO_PATH, LOGO_TRANSFORM } from '../LogoMark'

/* ------------------------------------------------------------------ */
/* Colours (sampled from the café's logo, cups and honey jar)                        */
/* ------------------------------------------------------------------ */
const BROWN = '#4a2e2b'
const BLUSH = '#cfa294' // reusable cup body
const SLEEVE = '#d4aa9c' // reusable cup sleeve
const LID = '#ddbaa9' // reusable cup lid
const GOLD = '#caa24c' // honey jar lid

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

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    draw(ctx, w, h)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.wrapS = THREE.RepeatWrapping
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Fine fibre speckle, like the café's bamboo-fibre reusable cups. */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, rgb: string, max = 0.08) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(${rgb},${Math.random() * max})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6)
  }
}

/** Monogram printed on a cup: `marks` copies spread around the cup. */
function drawPrint(bg: string | null, ink: string, marks: number, size = 0.5) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h)
    if (bg) {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      speckle(ctx, w, h, 2600, '120,80,60', 0.07)
      speckle(ctx, w, h, 900, '255,250,240', 0.12)
    }
    for (let i = 0; i < marks; i++) drawMark(ctx, (w / marks) * (i + 0.5), h * 0.5, h * size, ink)
  }
}

/** The honey jar label: "Pure Honey", monogram, collaboration line and weight. */
function drawHoneyLabel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f4ebdd'
  ctx.fillRect(0, 0, w, h)
  speckle(ctx, w, h, 1800, '120,90,60', 0.05)
  const cx = w / 2
  ctx.fillStyle = BROWN
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${Math.round(h * 0.17)}px "Times New Roman", Times, Georgia, serif`
  ctx.fillText('Pure Honey', cx, h * 0.23)
  drawMark(ctx, cx, h * 0.47, h * 0.33, BROWN)
  ctx.font = `${Math.round(h * 0.062)}px "Times New Roman", Times, Georgia, serif`
  ctx.fillText('Produced as a collaboration with', cx, h * 0.73)
  ctx.fillText('Tythe Bees in England\u2019s Vale of Belvoir', cx, h * 0.81)
  ctx.font = `${Math.round(h * 0.095)}px "Times New Roman", Times, Georgia, serif`
  ctx.fillText('340g', cx, h * 0.95)
}

function drawGradient(stops: [number, string][]) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    stops.forEach(([o, c]) => g.addColorStop(o, c))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

const lathe = (pts: [number, number][], segments = 72) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )

/* ------------------------------------------------------------------ */
/* Objects (modelled on the café's own cups and honey jar)             */
/* ------------------------------------------------------------------ */

/** The blush bamboo-fibre reusable cup: wide sleeve, narrow base, lipped lid with a sliding cover. */
function HotCup() {
  // inner cup wall radius at height y
  const r = (y: number) => 0.53 + ((0.66 - 0.53) * (y + 1.0)) / 1.92
  const body = useMemo(() => lathe([[0, -1.08], [0.5, -1.08], [0.525, -1.05], [0.53, -1.0], [0.66, 0.92], [0.67, 0.95]]), [])
  const sleeve = useMemo(() => new THREE.CylinderGeometry(r(0.84) + 0.032, r(-0.78) + 0.032, 1.62, 96, 1, true), [])
  const step = useMemo(() => new THREE.RingGeometry(r(-0.78) - 0.002, r(-0.78) + 0.032, 96), [])
  const lid = useMemo(
    () =>
      lathe([[0.66, 0.86], [0.72, 0.87], [0.745, 0.9], [0.75, 0.95], [0.735, 0.99], [0.68, 1.01], [0.67, 1.13], [0.645, 1.165], [0.6, 1.17], [0, 1.17]]),
    [],
  )
  const sleeveTex = useCanvasTexture(drawPrint(SLEEVE, BROWN, 2, 0.38), 1024, 420)

  return (
    <group>
      <mesh geometry={body}>
        <meshStandardMaterial color={BLUSH} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sleeve} position={[0, 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial map={sleeveTex} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={step} position={[0, -0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={BLUSH} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={lid}>
        <meshStandardMaterial color={LID} roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      {/* sliding drink-through cover and its OPEN tab */}
      <mesh position={[0, 1.19, 0]}>
        <boxGeometry args={[0.26, 0.045, 1.2]} />
        <meshStandardMaterial color={LID} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.13, 0.61]}>
        <boxGeometry args={[0.26, 0.13, 0.05]} />
        <meshStandardMaterial color={LID} roughness={0.65} />
      </mesh>
    </group>
  )
}

/** Clear iced-drink cup with flat lid, straw, ice and the monogram printed in brown. */
function IcedCup({ matcha }: { matcha: { current: number } }) {
  const r = (y: number) => 0.45 + ((0.62 - 0.45) * (y + 1.05)) / 2.05
  // Rounded base like the café's PET cups: a soft curve from the flat bottom into the wall
  const roundedBase = (inset: number, top: number): [number, number][] => {
    const R = 0.2
    const cx = r(-1.05 + R) - R - inset
    const pts: [number, number][] = [[0, -1.05 + inset]]
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * R, -1.05 + inset + R + Math.sin(a) * R])
    }
    pts.push([r(top) - inset, top])
    return pts
  }
  const cup = useMemo(() => lathe([...roundedBase(0, 1.0), [0.64, 1.02]]), [])
  const lid = useMemo(() => lathe([[0.6, 0.97], [0.665, 1.0], [0.67, 1.05], [0.62, 1.07], [0, 1.07]]), [])
  const liquid = useMemo(() => lathe([...roundedBase(0.025, 0.4), [0, 0.4]]), [])
  const logoBand = useMemo(() => new THREE.CylinderGeometry(r(0.42) + 0.008, r(-0.42) + 0.008, 0.84, 96, 1, true), [])

  // Iced latte (coffee swirls on top, caramel milk below) that turns into an iced matcha
  const coffee = useMemo(() => ['#5a331e', '#86522f', '#b37d4f', '#c4935f', '#c99a68'].map((c) => new THREE.Color(c)), [])
  const green = useMemo(() => ['#57763a', '#6f8f45', '#9db46f', '#bccb93', '#c7d2a0'].map((c) => new THREE.Color(c)), [])
  const stops = [0, 0.12, 0.3, 0.55, 1]
  const liquidTex = useCanvasTexture(drawGradient(stops.map((o, i) => [o, `#${coffee[i].getHexString()}`])), 8, 256)
  const logoTex = useCanvasTexture(drawPrint(null, BROWN, 2, 0.62), 1024, 256)
  const lastMix = useRef(0)
  const tmp = useMemo(() => new THREE.Color(), [])
  const ice = useMemo(
    () =>
      [
        [0.18, 0.42, 0.12, 0.4],
        [-0.2, 0.47, 0.05, 1.1],
        [0.02, 0.5, -0.24, 2.0],
        [-0.12, 0.33, 0.26, 0.7],
        [0.26, 0.3, -0.1, 1.6],
      ] as const,
    [],
  )

  useFrame(() => {
    const m = matcha.current
    if (Math.abs(m - lastMix.current) < 0.01) return
    lastMix.current = m
    const canvas = liquidTex.image as HTMLCanvasElement
    drawGradient(stops.map((o, i) => [o, `#${tmp.copy(coffee[i]).lerp(green[i], m).getHexString()}`]))(
      canvas.getContext('2d')!,
      canvas.width,
      canvas.height,
    )
    liquidTex.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={liquid}>
        <meshStandardMaterial map={liquidTex} roughness={0.25} />
      </mesh>
      {ice.map(([x, y, z, rot], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[rot, rot * 1.3, rot * 0.6]}>
          <boxGeometry args={[0.2, 0.18, 0.2]} />
          <meshStandardMaterial color="#efe7dc" roughness={0.12} metalness={0.05} />
        </mesh>
      ))}
      {/* straw */}
      <mesh position={[0.12, 1.05, 0.02]} rotation={[0.05, 0, -0.16]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 20, 1, true]} />
        <meshStandardMaterial color="#f5f1ea" roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={cup}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.1}
          transmission={1}
          thickness={0.12}
          ior={1.4}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={lid}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.08} transmission={1} thickness={0.05} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* monogram printed on the plastic */}
      <mesh geometry={logoBand} position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial map={logoTex} transparent alphaTest={0.4} roughness={0.5} side={THREE.FrontSide} />
      </mesh>
    </group>
  )
}

/** The café's 340g Pure Honey jar: gold lid, brown seal strip, cream label. */
function HoneyJar() {
  const glass = useMemo(
    () => lathe([[0, -0.78], [0.5, -0.78], [0.535, -0.74], [0.545, -0.6], [0.545, 0.42], [0.52, 0.52], [0.45, 0.58], [0.44, 0.64], [0.44, 0.7]]),
    [],
  )
  const honey = useMemo(() => lathe([[0, -0.76], [0.52, -0.76], [0.525, -0.6], [0.525, 0.44], [0.47, 0.52], [0, 0.52]]), [])
  const labelTex = useCanvasTexture(drawHoneyLabel, 1024, 470)
  return (
    <group>
      <mesh geometry={honey}>
        <meshStandardMaterial color="#e6b443" roughness={0.12} emissive="#9a6a10" emissiveIntensity={0.32} />
      </mesh>
      <mesh geometry={glass}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.04} transmission={1} thickness={0.2} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* label wraps the front of the jar */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.553, 0.553, 0.78, 72, 1, true, -1.6, 3.2]} />
        <meshStandardMaterial map={labelTex} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* gold twist-off lid */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.2, 72]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.905, 0]}>
        <cylinderGeometry args={[0.47, 0.49, 0.02, 72]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.22} />
      </mesh>
      {/* brown seal strip over the lid */}
      <mesh position={[0, 0.8, 0.496]}>
        <boxGeometry args={[0.1, 0.22, 0.012]} />
        <meshStandardMaterial color={BROWN} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.918, 0.25]}>
        <boxGeometry args={[0.1, 0.012, 0.5]} />
        <meshStandardMaterial color={BROWN} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.505]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.1, 0.24, 0.012]} />
        <meshStandardMaterial color={BROWN} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** A roasted coffee bean: a squashed sphere with a groove pressed into one side. */
function useBeanGeometry() {
  return useMemo(() => {
    const g = new THREE.SphereGeometry(1, 28, 20)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      if (v.y > 0) v.y -= v.y * 0.55 * Math.exp(-(v.x * v.x) / 0.018)
      p.setXYZ(i, v.x * 0.075, v.y * 0.055, v.z * 0.105)
    }
    g.computeVertexNormals()
    return g
  }, [])
}

function Beans({ count, progress, still }: { count: number; progress: { current: number }; still: boolean }) {
  const geo = useBeanGeometry()
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        r: 1.5 + Math.random() * 1.0,
        h: -1.1 + Math.random() * 2.6,
        speed: 0.12 + Math.random() * 0.18,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        rot: Math.random() * Math.PI * 2,
        s: 0.8 + Math.random() * 0.55,
      })),
    [count],
  )

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = still ? 0 : clock.elapsedTime
    const p = progress.current
    const spread = 1 + ramp(p, 0.15, 0.5) * 0.22 - ramp(p, 0.72, 1) * 0.2
    seeds.forEach((b, i) => {
      const ang = b.a + t * b.speed + p * Math.PI * 1.6
      const R = b.r * spread
      dummy.position.set(Math.cos(ang) * R, b.h + Math.sin(t * 0.6 + b.a * 3) * 0.08 + (p - 0.5) * (b.h * 0.25), Math.sin(ang) * R * 0.62)
      dummy.quaternion.setFromAxisAngle(b.spin, b.rot + t * 0.7 + p * 6)
      dummy.scale.setScalar(b.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow>
      <meshStandardMaterial color="#5b3420" roughness={0.38} metalness={0.05} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* Choreography                                                        */
/* ------------------------------------------------------------------ */
function Rig({ progress, still, beanCount }: { progress: Progress; still: boolean; beanCount: number }) {
  const rig = useRef<THREE.Group>(null)
  const cup = useRef<THREE.Group>(null)
  const bottle = useRef<THREE.Group>(null)
  const jar = useRef<THREE.Group>(null)
  const smooth = useRef(0)
  const matcha = useRef(0)
  const { size, camera } = useThree()

  // Pull the camera back on narrow screens so everything fits; on wide screens
  // the objects sit to the right of the headline.
  useEffect(() => {
    const aspect = size.width / size.height
    const z = aspect < 0.75 ? 9.6 : aspect < 1.1 ? 7.9 : 8.4
    camera.position.set(0, 0.35, z)
    camera.lookAt(0, 0, 0)
  }, [size, camera])

  useFrame(({ clock, pointer }, dt) => {
    smooth.current += (progress.current - smooth.current) * Math.min(1, dt * 5)
    const p = smooth.current
    const t = still ? 0 : clock.elapsedTime
    matcha.current = ramp(p, 0.42, 0.6) * (1 - ramp(p, 0.86, 1))

    const enter = ramp(p, 0.12, 0.4) // bottle arrives
    const honey = ramp(p, 0.7, 0.92) // honey jar arrives

    if (cup.current) {
      cup.current.position.set(lerp(0, -1.05, enter) + lerp(0, -0.25, honey), Math.sin(t * 0.9) * 0.05 + lerp(0, 0.1, honey), lerp(0, -0.4, honey))
      cup.current.rotation.set(0.08, t * 0.35 + p * Math.PI * 2.2, Math.sin(t * 0.7) * 0.05 + lerp(0, 0.12, enter))
    }
    if (bottle.current) {
      bottle.current.position.set(lerp(4.6, 1.05, enter) + lerp(0, 0.25, honey), Math.sin(t * 0.9 + 1.4) * 0.05 + lerp(0, 0.1, honey), lerp(0, -0.4, honey))
      bottle.current.rotation.set(0.06, -t * 0.3 - p * Math.PI * 1.8, lerp(-0.35, -0.12, enter))
      bottle.current.visible = enter > 0.001
    }
    if (jar.current) {
      jar.current.position.set(0.15, lerp(-4, -0.55, honey) + Math.sin(t * 0.9 + 2.2) * 0.04, lerp(0, 1.25, honey))
      jar.current.rotation.set(0.1, t * 0.4 + p * 3, 0)
      jar.current.visible = honey > 0.001
    }
    if (rig.current) {
      const s = lerp(1, 0.9, honey)
      rig.current.scale.setScalar(s)
      rig.current.rotation.y += (pointer.x * 0.22 - rig.current.rotation.y) * 0.05
      rig.current.rotation.x += (-pointer.y * 0.1 - rig.current.rotation.x) * 0.05
    }
  })

  return (
    <group ref={rig}>
      <group ref={cup}>
        <HotCup />
      </group>
      <group ref={bottle} visible={false}>
        <IcedCup matcha={matcha} />
      </group>
      <group ref={jar} visible={false} scale={0.8}>
        <HoneyJar />
      </group>
      <Beans count={beanCount} progress={smooth} still={still} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
function Stage({ children }: { children: React.ReactNode }) {
  const { size } = useThree()
  const aspect = size.width / size.height
  // Wide screens: shift everything right so the headline on the left stays clear
  const x = aspect > 1.15 ? Math.min(1.45, 0.7 + (aspect - 1.15) * 1.8) : 0
  return <group position={[x, 0, 0]}>{children}</group>
}

export default function CupScene({ progress, still = false }: { progress: Progress; still?: boolean }) {
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
        camera={{ fov: 32, position: [0, 0.35, 7.4], near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Drop resolution on slower devices, raise it on fast ones */}
        <PerformanceMonitor onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))} onDecline={() => setDpr(1)} />
        <hemisphereLight args={['#fff6e8', '#c9a27a', 0.7]} />
        <directionalLight position={[4, 6, 5]} intensity={1.8} color="#fff4e6" />
        <directionalLight position={[-5, 2, -4]} intensity={1.1} color="#f0b866" />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.2} position={[0, 3, 5]} scale={[7, 2.5, 1]} color="#fff3e0" />
          <Lightformer form="rect" intensity={1.4} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} color="#f2c27e" />
          <Lightformer form="ring" intensity={1.2} position={[4, 2.5, 2]} scale={1.6} color="#ffffff" />
        </Environment>
        <Stage>
          <Rig progress={progress} still={still} beanCount={small ? 34 : 64} />
          <ContactShadows position={[0, -1.45, 0]} opacity={0.32} scale={7} blur={2.6} far={1.2} color={BROWN} frames={still ? 1 : Infinity} />
        </Stage>
      </Canvas>
    </div>
  )
}

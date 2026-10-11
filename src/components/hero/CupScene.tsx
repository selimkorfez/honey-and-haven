'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { LOGO_PATH, LOGO_TRANSFORM } from '../LogoMark'

/* ------------------------------------------------------------------ */
/* Brand colours (sampled from the café's logo)                        */
/* ------------------------------------------------------------------ */
const BROWN = '#4a2e2b'
const KRAFT = '#c79c6c'
const CREAM = '#f3eadf'
const PAPER = '#fbf7f0'

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

/** A label that wraps around a cylinder: logo + wordmark, repeated. */
function drawLabel(bg: string, ink: string, repeats: number) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    // fine paper grain
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(74,46,43,${Math.random() * 0.05})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
    }
    const seg = w / repeats
    for (let r = 0; r < repeats; r++) {
      const cx = seg * r + seg / 2
      drawMark(ctx, cx, h * 0.42, h * 0.56, ink)
      ctx.fillStyle = ink
      ctx.font = `600 ${Math.round(h * 0.085)}px Georgia, serif`
      ctx.textAlign = 'center'
      ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${Math.round(h * 0.02)}px`
      ctx.fillText('HONEY & HAVEN', cx, h * 0.86)
    }
  }
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
/* Objects                                                             */
/* ------------------------------------------------------------------ */
function TakeawayCup() {
  const body = useMemo(() => lathe([[0, -1.1], [0.52, -1.1], [0.535, -1.07], [0.72, 1.0], [0.745, 1.03], [0.75, 1.06]]), [])
  const lid = useMemo(
    () => lathe([[0, 1.24], [0.3, 1.235], [0.48, 1.2], [0.6, 1.17], [0.7, 1.13], [0.785, 1.09], [0.795, 1.04], [0.77, 1.01]]),
    [],
  )
  const sleeveTex = useCanvasTexture(drawLabel(KRAFT, BROWN, 2), 1024, 280)
  // radius of the cup wall at height y (for the sleeve)
  const r = (y: number) => 0.535 + ((0.72 - 0.535) * (y + 1.07)) / 2.07
  const sleeve = useMemo(() => new THREE.CylinderGeometry(r(0.42) + 0.014, r(-0.42) + 0.014, 0.84, 72, 1, true), [])

  return (
    <group>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial color={PAPER} roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sleeve} position={[0, 0, 0]}>
        <meshStandardMaterial map={sleeveTex} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={lid}>
        <meshStandardMaterial color={BROWN} roughness={0.42} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* sip hole */}
      <mesh position={[0.46, 1.215, 0]} rotation={[0, 0, -0.22]}>
        <capsuleGeometry args={[0.035, 0.12, 6, 12]} />
        <meshStandardMaterial color="#1c110f" roughness={0.6} />
      </mesh>
    </group>
  )
}

function IcedBottle({ matcha }: { matcha: { current: number } }) {
  const glass = useMemo(
    () =>
      lathe([[0, -1.2], [0.46, -1.2], [0.52, -1.16], [0.535, -1.08], [0.535, 0.42], [0.5, 0.6], [0.38, 0.78], [0.27, 0.9], [0.25, 0.95], [0.25, 1.06]]),
    [],
  )
  const liquid = useMemo(() => lathe([[0, -1.16], [0.48, -1.16], [0.505, -1.1], [0.505, 0.36], [0, 0.36]]), [])
  // Iced Spanish latte (espresso floating on milk) that turns into an iced matcha
  const coffee = useMemo(() => ['#5e3520', '#7b4a2b', '#b98352', '#e2c9a6', '#f2e6d4'].map((c) => new THREE.Color(c)), [])
  const green = useMemo(() => ['#5f7f3a', '#78984c', '#a9bf7d', '#e5e4c8', '#f2e8d6'].map((c) => new THREE.Color(c)), [])
  const stops = [0, 0.18, 0.42, 0.62, 1]
  const liquidTex = useCanvasTexture(drawGradient(stops.map((o, i) => [o, `#${coffee[i].getHexString()}`])), 8, 256)
  const lastMix = useRef(0)
  const tmp = useMemo(() => new THREE.Color(), [])
  const labelTex = useCanvasTexture(drawLabel(CREAM, BROWN, 2), 1024, 280)

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
        <meshStandardMaterial map={liquidTex} roughness={0.22} />
      </mesh>
      <mesh geometry={glass}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.06}
          transmission={1}
          thickness={0.35}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* label band */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.542, 0.542, 0.62, 72, 1, true]} />
        <meshStandardMaterial map={labelTex} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.24, 48]} />
        <meshStandardMaterial color={BROWN} roughness={0.5} />
      </mesh>
    </group>
  )
}

function HoneyJar() {
  const labelTex = useCanvasTexture(drawLabel(CREAM, BROWN, 1), 512, 280)
  return (
    <group>
      {/* honey */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.86, 64]} />
        <meshPhysicalMaterial color="#d8942a" roughness={0.15} transmission={0.6} thickness={0.8} emissive="#7a4208" emissiveIntensity={0.18} />
      </mesh>
      {/* glass */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 1.04, 64, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={1} thickness={0.2} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* label */}
      <mesh position={[0, -0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.505, 0.505, 0.48, 64, 1, true, -0.9, 1.8]} />
        <meshStandardMaterial map={labelTex} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* lid */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.18, 64]} />
        <meshStandardMaterial color={BROWN} roughness={0.45} />
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
        <TakeawayCup />
      </group>
      <group ref={bottle} visible={false}>
        <IcedBottle matcha={matcha} />
      </group>
      <group ref={jar} visible={false} scale={0.85}>
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
  const x = aspect > 1.15 ? Math.min(1.75, 0.8 + (aspect - 1.15) * 2) : 0
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

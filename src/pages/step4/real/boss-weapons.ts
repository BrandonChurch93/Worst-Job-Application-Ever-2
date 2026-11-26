import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import type { PartMaker, RealContext } from '../../../real/types'
import { controls } from '../../../shell/real/controls'
import type { Shape } from '../../../stage/types'
import { makeSlab } from '../../step1/real/slabs'
import { fx, overlay } from '../../step1/real/turret-fx'

const heights = config.scale.heights
const q = (v: number): number => Math.round(v * 4) / 4
const seed = config.seed + 4409

export const WEAPON_GLOW = {
  dart: [3.4, 3.3, 3.1] as [number, number, number],
  dartRim: [1.5, 1.05, 0.55] as [number, number, number],
  trail: [1.7, 1.45, 1.1] as [number, number, number],
  streak: [0.55, 0.47, 0.36] as [number, number, number],
  halo: [0.34, 0.24, 0.13] as [number, number, number],
  spill: [0.3, 0.2, 0.09] as [number, number, number],
  spark: [6, 5.2, 4] as [number, number, number],
  fleck: [5, 3.9, 2.4] as [number, number, number],
  muzzle: [9, 2.6, 0.7] as [number, number, number]
}

export const WEAPON_EMIT = {
  dart: { colour: [1, 0.8, 0.52] as [number, number, number], power: 0.06, reach: 40 },
  spark: { colour: [1, 0.8, 0.52] as [number, number, number], power: 0.26, reach: 110 },
  muzzle: { colour: [1, 0.36, 0.12] as [number, number, number], power: 0.6, reach: 170 }
}

interface Kit {
  dart: THREE.BufferGeometry
  dartMaterial: THREE.MeshBasicMaterial
  trailMaterial: THREE.MeshBasicMaterial
  streakMaterial: THREE.MeshBasicMaterial
  haloMaterial: THREE.MeshBasicMaterial
  spillMaterial: THREE.MeshBasicMaterial
  sparkMaterial: THREE.MeshBasicMaterial
  fleckMaterial: THREE.MeshBasicMaterial
  muzzleMaterial: THREE.MeshBasicMaterial
  smokeMaterial: THREE.MeshBasicMaterial
}

// The dart is the head of the cursor's own arrow, small: a point, two barbs and a notch, pointing along its flight.
function arrow(grow: number, depth: number): THREE.BufferGeometry {
  const points: [number, number][] = [[16, 0], [-12, 10.5], [-5.5, 0], [-12, -10.5]]
  const shape = new THREE.Shape()
  points.forEach(([x, y], i) => {
    const l = Math.hypot(x, y) || 1
    const px = x + (x / l) * grow
    const py = y + (y / l) * grow
    if (i === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  })
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7, bevelSegments: 2, curveSegments: 2 })
}

const FLECKS = 14
const NEEDLE: [number, number][] = [[0, 0.5], [0, -0.5], [-1, 0], [0.35, 0]]

// The flecks of hot metal of one spark, one mesh: each a thin needle, brightest at its head.
function needles(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const colour: number[] = []
  const index: number[] = []
  for (let i = 0; i < FLECKS; i++) {
    colour.push(1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1)
    index.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 1, i * 4 + 3)
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(FLECKS * 12), 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  g.setIndex(index)
  return g
}

// The dart and the warm rim around it, one mesh: the rim lies under the white head.
function head(): THREE.BufferGeometry {
  const parts: [THREE.BufferGeometry, [number, number, number], number][] = [[arrow(1.1, 1), WEAPON_GLOW.dartRim, 0.4], [arrow(0, 3), WEAPON_GLOW.dart, 1]]
  const position: number[] = []
  const colour: number[] = []
  for (const [g, c, z] of parts) {
    const flat = g.index ? g.toNonIndexed() : g
    const p = flat.getAttribute('position')
    for (let i = 0; i < p.count; i++) {
      position.push(p.getX(i), p.getY(i), p.getZ(i) + z)
      colour.push(...c)
    }
    if (flat !== g) flat.dispose()
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  out.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  return out
}

let made: Kit | null = null

function kit(): Kit {
  if (made) return made
  const f = fx()
  const add = { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false }
  made = {
    dart: head(),
    dartMaterial: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    trailMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.trail), vertexColors: true, ...add }),
    streakMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.streak), vertexColors: true, ...add }),
    haloMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.halo), map: f.halo, ...add }),
    spillMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.spill), map: f.halo, ...add }),
    sparkMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.spark), map: f.star, ...add }),
    fleckMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.fleck), vertexColors: true, ...add }),
    muzzleMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.muzzle), map: f.star, ...add }),
    smokeMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.48, 0.46), alphaMap: f.puff, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.5 })
  }
  return made
}

const plain = (m: THREE.Mesh): THREE.Mesh => {
  m.castShadow = false
  m.receiveShadow = false
  m.frustumCulled = false
  return m
}

function makeDart(): THREE.Object3D {
  const k = kit()
  const f = fx()
  const root = new THREE.Group()
  const halo = overlay(new THREE.Mesh(f.quad, k.haloMaterial), 1)
  halo.scale.set(52, 36, 1)
  halo.position.set(-10, 0, 1)
  halo.name = 'halo'
  // The dart's light on the paper under it: it lies on the page, not on the dart.
  const spill = overlay(new THREE.Mesh(f.quad, k.spillMaterial), 0)
  spill.name = 'spill'
  spill.scale.set(78, 78, 1)
  const streak = overlay(new THREE.Mesh(f.tail, k.streakMaterial), 2)
  streak.name = 'streak'
  streak.position.set(-12, 0, 2)
  const trail = overlay(new THREE.Mesh(f.tail, k.trailMaterial), 3)
  trail.name = 'trail'
  trail.position.set(-10, 0, 2)
  const body = plain(new THREE.Mesh(k.dart, k.dartMaterial))
  body.castShadow = true
  root.add(spill, halo, streak, trail, body)
  return root
}

function makeSpark(): THREE.Object3D {
  const k = kit()
  const f = fx()
  const root = new THREE.Group()
  const star = overlay(new THREE.Mesh(f.quad, k.sparkMaterial), 5)
  star.name = 'star'
  const halo = overlay(new THREE.Mesh(f.quad, k.haloMaterial), 4)
  halo.name = 'halo'
  root.add(halo, star)
  const flecks = overlay(new THREE.Mesh(needles(), k.fleckMaterial), 6)
  flecks.name = 'flecks'
  flecks.frustumCulled = false
  flecks.position.z = 3
  root.add(flecks)
  return root
}

function makeMuzzle(): THREE.Object3D {
  const k = kit()
  const f = fx()
  const root = new THREE.Group()
  const star = overlay(new THREE.Mesh(f.quad, k.muzzleMaterial), 5)
  star.name = 'star'
  const halo = overlay(new THREE.Mesh(f.quad, k.haloMaterial), 4)
  halo.name = 'halo'
  const smoke = overlay(new THREE.Mesh(f.quad, k.smokeMaterial), 3)
  smoke.name = 'smoke'
  root.add(smoke, halo, star)
  return root
}

function makeScorch(s: Shape): THREE.Object3D {
  const f = fx()
  const mark = overlay(new THREE.Mesh(f.quad, f.scorchMaterial), 0)
  mark.scale.set(s.w * 1.25, s.h * 1.25, 1)
  mark.position.z = 0.35
  mark.rotation.z = hash01(Math.round(s.v?.[0] ?? 0), 7, seed) * Math.PI * 2
  const root = new THREE.Group()
  root.add(mark)
  return root
}

const full = (s: Shape, height: number, role: string): Shape => ({ ...s, z0: 0, z1: height, role, rot: 0 })

const kindOf = (s: Shape): string => {
  if (s.id.startsWith('dart-')) return 'dart'
  if (s.id.startsWith('spark-')) return 'spark'
  if (s.id.startsWith('muzzle-')) return 'muzzle'
  if (s.id.startsWith('fired-') || s.id === 'banner-up') return 'slab'
  if (s.id.includes('-chip-')) return 'scorch'
  if (s.id.includes('-button-')) return 'button'
  if (s.id.startsWith('popup-up-')) return 'card'
  return ''
}

const ease = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

export const bossWeapons: PartMaker | null = {
  key(s: Shape, ctx: RealContext): string | null {
    if (s.kind === 'text') return null
    switch (kindOf(s)) {
      case 'dart': return 'dart'
      case 'spark': return 'spark'
      case 'muzzle': return 'muzzle'
      case 'scorch': return `scorch:${Math.round(s.v?.[0] ?? 0)}`
      case 'slab': return `slab:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}`
      case 'button': return `popup-${controls.key(full(s, heights.button, 'button'), ctx)}`
      case 'card': return `popup-${controls.key(full(s, heights.card, 'card'), ctx)}`
      default: return null
    }
  },
  make(s: Shape, ctx: RealContext): THREE.Object3D {
    switch (kindOf(s)) {
      case 'dart': return makeDart()
      case 'spark': return makeSpark()
      case 'muzzle': return makeMuzzle()
      case 'scorch': return makeScorch(s)
      case 'slab': return makeSlab(s.w, s.h, s.r ?? 8, heights.slab)
      case 'button': return controls.make(full(s, heights.button, 'button'), ctx)
      default: return controls.make(full(s, heights.card, 'card'), ctx)
    }
  },
  pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
    const v = s.v ?? []
    const cx = s.x + s.w / 2
    const cy = s.y + s.h / 2
    switch (kindOf(s)) {
      case 'dart': {
        const born = Math.min(1, Math.max(0, v[0] ?? 1))
        const n = Number(s.id.slice(5)) || 0
        const flick = 0.9 + 0.1 * Math.sin(ctx.time * 61 + n * 2.4)
        const trail = o.getObjectByName('trail')!
        trail.scale.set(Math.max(1, 110 * born), 1.7, 1.7)
        const streak = o.getObjectByName('streak')!
        streak.scale.set(Math.max(1, 520 * born), 0.9, 0.9)
        o.getObjectByName('halo')!.scale.set(52 * flick, 36 * flick, 1)
        o.getObjectByName('spill')!.position.set(-4, 0, 0.7 - s.z0)
        ctx.light({ x: cx, y: cy, z: s.z1 + 4, ...WEAPON_EMIT.dart })
        break
      }
      case 'spark': {
        const u = Math.min(1, Math.max(0, v[0] ?? 0))
        const n = Math.round(v[1] ?? 0)
        const hot = (1 - u) * (1 - u)
        const star = o.getObjectByName('star')!
        const size = (40 + 80 * Math.sqrt(u)) * Math.pow(1 - u, 1.4) + 56 * Math.max(0, 1 - u / 0.08)
        star.scale.set(size, size, 1)
        star.rotation.z = hash01(n, 3, seed) * Math.PI * 2
        star.visible = size > 1
        star.position.z = 2
        const halo = o.getObjectByName('halo')!
        halo.scale.set(84 * hot + 4, 84 * hot + 4, 1)
        const at = (o.getObjectByName('flecks') as THREE.Mesh).geometry.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < FLECKS; i++) {
          const a = hash01(n, i, seed + 1) * Math.PI * 2
          const speed = 46 + 130 * hash01(n, i, seed + 2)
          const life = 0.55 + 0.45 * hash01(n, i, seed + 3)
          const t = u / life
          const r = 8 + speed * (1 - Math.pow(1 - Math.min(1, t), 2))
          const long = t < 1 ? (12 + 30 * hash01(n, i, seed + 4)) * (1 - t * 0.7) : 0
          const wide = t < 1 ? 1.3 * (1 - t * 0.5) : 0
          const c = Math.cos(a)
          const d = Math.sin(a)
          NEEDLE.forEach(([x, y], j) => at.setXYZ(i * 4 + j, c * (r + x * long) - d * y * wide, d * (r + x * long) + c * y * wide, 0))
        }
        at.needsUpdate = true
        // The star and the flecks share materials, so the burst dims by shrinking, and by the light it gives off.
        ctx.light({ x: cx, y: cy, z: s.z1 + 6, colour: WEAPON_EMIT.spark.colour, power: WEAPON_EMIT.spark.power * hot, reach: WEAPON_EMIT.spark.reach })
        break
      }
      case 'muzzle': {
        const u = Math.min(1, Math.max(0, v[0] ?? 0))
        const n = Math.round(v[1] ?? 0)
        const hot = (1 - u) * (1 - u)
        const star = o.getObjectByName('star')!
        const size = (70 + 150 * Math.sqrt(u)) * Math.pow(1 - u, 1.2)
        star.scale.set(size, size * 0.62, 1)
        star.position.set(18 + 30 * u, 0, 2)
        star.rotation.z = (hash01(n, 5, seed) - 0.5) * 0.5
        star.visible = size > 1
        const halo = o.getObjectByName('halo')!
        halo.scale.set(230 * hot + 4, 170 * hot + 4, 1)
        halo.position.set(10, 0, 1)
        const smoke = o.getObjectByName('smoke')!
        smoke.scale.set(40 + 70 * u, 40 + 70 * u, 1)
        smoke.position.set(8 + 26 * u, 0, 1.5)
        smoke.rotation.z = hash01(n, 6, seed) * 6
        smoke.visible = u > 0.25
        ctx.light({ x: cx, y: cy, z: s.z1 + 6, colour: WEAPON_EMIT.muzzle.colour, power: WEAPON_EMIT.muzzle.power * hot, reach: WEAPON_EMIT.muzzle.reach })
        break
      }
      case 'slab': {
        const k = Math.min(1, Math.max(0.05, v[0] ?? 1))
        o.scale.setScalar(k)
        if (s.id === 'banner-up') {
          const t = v[1] ?? 0
          const sway = Math.exp(-t * 3.2) * 0.05 * Math.cos(t * 17)
          o.rotation.y += sway
          o.position.z -= Math.abs(Math.sin(sway)) * (s.w / 2)
          break
        }
        const t = v[1] ?? 9
        const ring = t < 2 ? Math.exp(-t * 7) : 0
        const rx = ring * 0.03 * Math.cos(t * 52)
        const ry = ring * 0.008 * Math.sin(t * 41)
        const air = v[2] ?? 9
        const pitch = air < 9 ? 0.02 * Math.sin(air * 23) * ease(air / 0.2) : 0
        o.rotation.x += rx + pitch
        o.rotation.y += ry
        o.position.z -= Math.abs(Math.sin(rx)) * (s.h / 2) + Math.abs(Math.sin(ry)) * (s.w / 2)
        break
      }
      case 'button': {
        o.position.z = s.z1 - heights.button
        break
      }
      case 'card': {
        o.position.z = s.z1 - heights.card
        const struck = v[2] ?? 9
        if (struck < 9) o.rotation.x += 0.012 * Math.sin(struck * 60) * Math.exp(-struck * 14)
        break
      }
      default:
        break
    }
  },
  drop(o: THREE.Object3D): void {
    const flecks = o.getObjectByName('flecks') as THREE.Mesh | undefined
    if (flecks) flecks.geometry.dispose()
  }
}

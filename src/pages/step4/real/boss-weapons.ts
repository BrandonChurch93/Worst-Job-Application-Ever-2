import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import type { PartMaker, RealContext } from '../../../real/types'
import { grainNormalMap } from '../../../shell/materials'
import { controls } from '../../../shell/real/controls'
import type { Shape } from '../../../stage/types'
import { makeSlab } from '../../step1/real/slabs'
import { fx, overlay } from '../../step1/real/turret-fx'

const heights = config.scale.heights
const q = (v: number): number => Math.round(v * 4) / 4
const seed = config.seed + 4409

export const WEAPON_GLOW = {
  dart: [1.2, 1.17, 1.1] as [number, number, number],
  dartRim: [1.5, 1.05, 0.55] as [number, number, number],
  trail: [1.05, 0.9, 0.68] as [number, number, number],
  streak: [0.4, 0.34, 0.26] as [number, number, number],
  halo: [0.34, 0.24, 0.13] as [number, number, number],
  glint: [1.25, 1.02, 0.7] as [number, number, number],
  pool: [0.02, 0.11, 0.3] as [number, number, number],
  shade: [0.3, 0.3, 0.31] as [number, number, number],
  spark: [6, 5.2, 4] as [number, number, number],
  fleck: [5, 3.9, 2.4] as [number, number, number],
  muzzle: [9, 2.6, 0.7] as [number, number, number]
}

export const LACQUER = { colour: 0xa00d0b, rough: 0.46, spec: 0.4, coat: 0.09, env: 1.05 }

let lacquerMade: THREE.MeshPhysicalMaterial | null = null

function lacquer(): THREE.MeshPhysicalMaterial {
  if (!lacquerMade) {
    const grain = grainNormalMap(256, config.seed + 71, 1.6)
    grain.repeat.set(1 / 90, 1 / 90)
    lacquerMade = studio(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHex(LACQUER.colour, THREE.SRGBColorSpace),
        roughness: LACQUER.rough,
        metalness: 0,
        specularIntensity: LACQUER.spec,
        clearcoat: 1,
        clearcoatRoughness: LACQUER.coat,
        clearcoatNormalMap: grain,
        clearcoatNormalScale: new THREE.Vector2(0.035, 0.035),
        envMapIntensity: LACQUER.env
      })
    )
  }
  return lacquerMade
}

export const WEAPON_EMIT = {
  dart: { colour: [1, 0.8, 0.52] as [number, number, number], power: 0.06, reach: 40 },
  spark: { colour: [1, 0.8, 0.52] as [number, number, number], power: 0.26, reach: 110 },
  muzzle: { colour: [1, 0.36, 0.12] as [number, number, number], power: 0.6, reach: 170 }
}

interface Kit {
  dart: THREE.BufferGeometry
  dartMaterial: THREE.MeshBasicMaterial
  tails: THREE.BufferGeometry
  under: THREE.BufferGeometry
  halo: THREE.BufferGeometry
  tailMaterial: THREE.MeshBasicMaterial
  haloMaterial: THREE.MeshBasicMaterial
  glintMaterial: THREE.MeshBasicMaterial
  poolMaterial: THREE.MeshBasicMaterial
  sparkMaterial: THREE.MeshBasicMaterial
  fleckMaterial: THREE.MeshBasicMaterial
  muzzleMaterial: THREE.MeshBasicMaterial
  smokeMaterial: THREE.MeshBasicMaterial
}

// The dart is the head of the cursor's own arrow, small: a point, two barbs and a notch, pointing along its flight.
function arrow(grow: number, depth: number): THREE.BufferGeometry {
  const points: [number, number][] = [[12.5, 0], [-9, 8], [-4, 0], [-9, -8]]
  const shape = new THREE.Shape()
  points.forEach(([x, y], i) => {
    const l = Math.hypot(x, y) || 1
    const px = x + (x / l) * grow
    const py = y + (y / l) * grow
    if (i === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  })
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2, curveSegments: 2 })
}

// Where a dart's light and its shadow fall on the paper beside it, in px of the page.
const POOL = { x: 9, y: 10, wide: 96 }
const SHADE = { x: 16, y: 18, wide: 34 }
const TAIL = { streak: 520, trail: 140 }
const FLECKS = 22
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

// Both tails of a dart, one mesh: a short bright one and a long thin one, each fading to nothing behind the head.
function tails(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const parts: [number, number, number, [number, number, number]][] = [[TAIL.streak, 0.8, -12, WEAPON_GLOW.streak], [TAIL.trail, 1, -10, WEAPON_GLOW.trail]]
  const p = source.getAttribute('position')
  const c = source.getAttribute('color')
  const at = source.index!
  const position: number[] = []
  const colour: number[] = []
  const index: number[] = []
  parts.forEach(([long, thick, x, tint], n) => {
    for (let i = 0; i < p.count; i++) {
      position.push(x / TAIL.streak + (p.getX(i) * long) / TAIL.streak, p.getY(i) * thick, p.getZ(i) * thick)
      colour.push(c.getX(i) * tint[0], c.getY(i) * tint[1], c.getZ(i) * tint[2])
    }
    for (let i = 0; i < at.count; i++) index.push(at.getX(i) + n * p.count)
  })
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  out.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  out.setIndex(index)
  return out
}

// What a dart leaves on the paper under it, one mesh that filters what it lies on: a wide warm pool and a small soft shadow.
function under(): THREE.BufferGeometry {
  return glow([[POOL.wide, POOL.x, -POOL.y, 0, WEAPON_GLOW.pool], [SHADE.wide, SHADE.x, -SHADE.y, 0.1, WEAPON_GLOW.shade]])
}

export const GLOW_RINGS = [0, 0.08, 0.16, 0.25, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.93, 1]
const GLOW_PARTS = 40
const fall = (r: number): number => {
  const edge = Math.min(1, Math.max(0, (1 - r) / 0.3))
  return Math.exp(-(r * r) / 0.09) * edge * edge * (3 - 2 * edge)
}

// A soft round glow as a fan of rings with its light in the corners of its faces: no picture is stretched over it.
export function glow(parts: [number, number, number, number, [number, number, number]][]): THREE.BufferGeometry {
  const position: number[] = []
  const colour: number[] = []
  const index: number[] = []
  let start = 0
  for (const [wide, x, y, z, tint] of parts) {
    GLOW_RINGS.forEach((r, j) => {
      for (let i = 0; i < GLOW_PARTS; i++) {
        const a = (i / GLOW_PARTS) * Math.PI * 2
        position.push(x + Math.cos(a) * r * wide * 0.5, y + Math.sin(a) * r * wide * 0.5, z)
        const g = fall(r)
        colour.push(tint[0] * g, tint[1] * g, tint[2] * g)
        if (j > 0) {
          const now = start + j * GLOW_PARTS + i
          const next = start + j * GLOW_PARTS + ((i + 1) % GLOW_PARTS)
          index.push(now - GLOW_PARTS, now, next - GLOW_PARTS, next - GLOW_PARTS, now, next)
        }
      }
    })
    start += GLOW_RINGS.length * GLOW_PARTS
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((position.length / 3) * 2), 2))
  out.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  out.setIndex(index)
  return out
}

// Of all the darts in the air one gives off true light, the first of the stream, and of all the sparks the newest:
// the others show their light as the pool on the paper. More lamps than a few make every lamp throw a shadow.
const lead = { ctx: null as RealContext | null, dart: '', spark: '', heat: 0 }

function leaders(ctx: RealContext): typeof lead {
  if (lead.ctx === ctx) return lead
  lead.ctx = ctx
  lead.dart = ''
  lead.spark = ''
  lead.heat = 0
  let first = Infinity
  let last = -1
  for (const s of ctx.list) {
    if (s.part !== 'boss-weapons') continue
    if (s.id.startsWith('dart-')) {
      const n = Number(s.id.slice(5))
      if (n < first) {
        first = n
        lead.dart = s.id
      }
    } else if (s.id.startsWith('spark-')) {
      const n = Number(s.id.slice(6))
      const u = Math.min(1, Math.max(0, s.v?.[0] ?? 0))
      lead.heat += (1 - u) * (1 - u)
      if (n > last) {
        last = n
        lead.spark = s.id
      }
    }
  }
  return lead
}

let made: Kit | null = null

function kit(): Kit {
  if (made) return made
  const f = fx()
  const add = { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false }
  made = {
    dart: head(),
    dartMaterial: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    tails: tails(f.tail),
    under: under(),
    halo: glow([[1, 0, 0, 0, [1, 1, 1]]]),
    tailMaterial: new THREE.MeshBasicMaterial({ vertexColors: true, ...add }),
    haloMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.halo), vertexColors: true, ...add }),
    glintMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.glint), map: f.star, ...add }),
    // The pool under a dart takes blue and a little green out of what lies under it: light on white paper can only warm it.
    poolMaterial: new THREE.MeshBasicMaterial({ vertexColors: true, ...add, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }),
    sparkMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.spark), map: f.star, ...add }),
    fleckMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.fleck), vertexColors: true, ...add }),
    muzzleMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(...WEAPON_GLOW.muzzle), map: f.star, ...add }),
    smokeMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.27, 0.26, 0.25), alphaMap: f.puff, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.42 })
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
  const glint = overlay(new THREE.Mesh(f.quad, k.glintMaterial), 4)
  glint.name = 'glint'
  glint.position.set(2, 0, 5)
  const pool = overlay(new THREE.Mesh(k.under, k.poolMaterial), 0)
  pool.name = 'pool'
  const tail = overlay(new THREE.Mesh(k.tails, k.tailMaterial), 2)
  tail.name = 'tail'
  tail.position.z = 2
  const body = plain(new THREE.Mesh(k.dart, k.dartMaterial))
  body.castShadow = false
  root.add(pool, tail, body, glint)
  return root
}

function makeSpark(): THREE.Object3D {
  const k = kit()
  const f = fx()
  const root = new THREE.Group()
  const star = overlay(new THREE.Mesh(f.quad, k.sparkMaterial), 5)
  star.name = 'star'
  const halo = overlay(new THREE.Mesh(k.halo, k.haloMaterial), 4)
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
  const halo = overlay(new THREE.Mesh(k.halo, k.haloMaterial), 4)
  halo.name = 'halo'
  const smoke = overlay(new THREE.Mesh(f.quad, k.smokeMaterial), 3)
  smoke.name = 'smoke'
  const ring = overlay(new THREE.Mesh(ringGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.19, 0.185), vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })), 3)
  ring.name = 'ring'
  root.add(smoke, ring, halo, star)
  return root
}

export const RING = { parts: 48, from: 24, to: 60, flat: 0.44, ahead: 44, z: 34 }
let ringMade: THREE.BufferGeometry | null = null

function ringGeometry(): THREE.BufferGeometry {
  if (ringMade) return ringMade
  const radii = [0.56, 0.74, 0.9, 1.04]
  const alpha = [0, 0.85, 0.7, 0]
  const pos: number[] = []
  const uv: number[] = []
  const colour: number[] = []
  const index: number[] = []
  for (let i = 0; i <= RING.parts; i++) {
    const a = (i / RING.parts) * Math.PI * 2
    const n = i % RING.parts
    const wave = 1 + 0.07 * (hash01(n, 7, seed) - 0.5) + 0.05 * Math.sin(a * 3 + 1.3)
    radii.forEach((r, j) => {
      pos.push(Math.cos(a) * r * wave, Math.sin(a) * r * wave, 0)
      uv.push((i / RING.parts) * 3, j / (radii.length - 1))
      const thin = 0.55 + 0.45 * hash01(n, 9 + j, seed)
      colour.push(1, 1, 1, alpha[j]! * thin)
      if (i < RING.parts && j < radii.length - 1) {
        const at = i * radii.length + j
        index.push(at, at + 1, at + radii.length, at + 1, at + radii.length + 1, at + radii.length)
      }
    })
  }
  ringMade = new THREE.BufferGeometry()
  ringMade.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  ringMade.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  ringMade.setAttribute('color', new THREE.Float32BufferAttribute(colour, 4))
  ringMade.setIndex(index)
  return ringMade
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
      case 'slab': {
        const slab = makeSlab(s.w, s.h, s.r ?? 8, heights.slab)
        ;(slab.children[0] as THREE.Mesh).material = lacquer()
        slab.children[1]!.castShadow = false
        return slab
      }
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
        o.getObjectByName('tail')!.scale.set(Math.max(1, TAIL.streak * born), 1, 1)
        const glint = o.getObjectByName('glint')!
        glint.scale.set(36 * flick, 36 * flick, 1)
        glint.rotation.z = -(s.rot ?? 0) + 0.4
        const pool = o.getObjectByName('pool')!
        pool.position.z = 0.7 - s.z0
        pool.rotation.z = s.rot ?? 0
        if (leaders(ctx).dart === s.id) ctx.light({ x: cx, y: cy, z: s.z1 + 4, ...WEAPON_EMIT.dart })
        break
      }
      case 'spark': {
        const u = Math.min(1, Math.max(0, v[0] ?? 0))
        const n = Math.round(v[1] ?? 0)
        const hot = (1 - u) * (1 - u)
        const star = o.getObjectByName('star')!
        const size = (44 + 50 * Math.sqrt(u)) * Math.pow(1 - u, 1.4) + 56 * Math.max(0, 1 - u / 0.08)
        star.scale.set(size, size, 1)
        star.rotation.z = hash01(n, 3, seed) * Math.PI * 2
        star.visible = size > 1
        star.position.z = 2
        const halo = o.getObjectByName('halo')!
        halo.scale.set(58 * hot + 4, 58 * hot + 4, 1)
        const at = (o.getObjectByName('flecks') as THREE.Mesh).geometry.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < FLECKS; i++) {
          const a = hash01(n, i, seed + 1) * Math.PI * 2
          const speed = 22 + 78 * hash01(n, i, seed + 2)
          const life = 0.55 + 0.45 * hash01(n, i, seed + 3)
          const t = u / life
          const r = 8 + speed * (1 - Math.pow(1 - Math.min(1, t), 2))
          const long = t < 1 ? (5 + 19 * hash01(n, i, seed + 4)) * (1 - t * 0.7) : 0
          const wide = t < 1 ? 0.95 * (1 - t * 0.5) : 0
          const c = Math.cos(a)
          const d = Math.sin(a)
          NEEDLE.forEach(([x, y], j) => at.setXYZ(i * 4 + j, c * (r + x * long) - d * y * wide, d * (r + x * long) + c * y * wide, 0))
        }
        at.needsUpdate = true
        // The star and the flecks share materials, so the burst dims by shrinking, and by the light it gives off.
        const all = leaders(ctx)
        if (all.spark === s.id) ctx.light({ x: cx, y: cy, z: s.z1 + 6, colour: WEAPON_EMIT.spark.colour, power: WEAPON_EMIT.spark.power * Math.min(1.5, all.heat), reach: WEAPON_EMIT.spark.reach })
        break
      }
      case 'muzzle': {
        const u = Math.min(1, Math.max(0, v[0] ?? 0))
        const n = Math.round(v[1] ?? 0)
        const hot = (1 - u) * (1 - u)
        const star = o.getObjectByName('star')!
        const size = (60 + 110 * Math.sqrt(u)) * Math.pow(1 - u, 1.5)
        star.scale.set(size, size * 0.62, 1)
        star.position.set(2 + 26 * u, 0, 2)
        star.rotation.z = (hash01(n, 5, seed) - 0.5) * 0.5
        star.visible = size > 1
        const halo = o.getObjectByName('halo')!
        halo.scale.set(230 * hot + 4, 170 * hot + 4, 1)
        halo.position.set(0, 0, 1)
        const smoke = o.getObjectByName('smoke')!
        smoke.scale.set(40 + 70 * u, 40 + 70 * u, 1)
        smoke.position.set(26 * u, 0, 1.5)
        smoke.rotation.z = hash01(n, 6, seed) * 6
        smoke.visible = u > 0.1
        const ring = o.getObjectByName('ring') as THREE.Mesh
        const wide = RING.from + (RING.to - RING.from) * Math.sqrt(u)
        ring.scale.set(wide * RING.flat, wide, 1)
        ring.position.set(8 + RING.ahead * Math.sqrt(u), 0, RING.z)
        const ringStuff = ring.material as THREE.MeshBasicMaterial
        ringStuff.opacity = 0.85 * Math.min(1, u / 0.12) * Math.pow(1 - u, 1.1)
        ring.visible = u > 0.04 && u < 0.98
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
        o.rotation.x += rx
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
    const ring = o.getObjectByName('ring') as THREE.Mesh | undefined
    if (ring) (ring.material as THREE.Material).dispose()
  }
}

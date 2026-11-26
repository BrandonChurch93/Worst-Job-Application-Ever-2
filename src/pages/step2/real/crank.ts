import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker, RealContext } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { arc, profile, roundedRect, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { CRANK } from '../layout'
import { fuse, lathe, mesh, moved, outline, picture, rise, round, smooth, srgb } from './slot-kit'

export const CRANK_LOOK = {
  full: { base: 26, hub: 22, arm: 10, grip: 24, meter: 20 }, pill: 9.5, pillLit: 1.2,
  plate: 8, rim: 2.6, screwAt: 38, screw: 4.8, washer: 25.5, neck: 20, eye: 23.6, bar: 10.5, end: 8, fillet: 8, cap: 22,
  lamp: { colour: [1, 0.46, 0.12] as [number, number, number], power: 0.075, reach: 150, lift: 16, most: 4 }
}
const L = CRANK_LOOK

let made: { glass: THREE.MeshPhysicalMaterial; lit: THREE.MeshPhysicalMaterial; washer: THREE.MeshPhysicalMaterial; bar: THREE.MeshPhysicalMaterial; textures: THREE.Texture[] } | null = null
const cache = new Map<string, THREE.BufferGeometry>()
const shared = (key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = cache.get(key)
  if (!g) {
    g = build()
    cache.set(key, g)
  }
  return g
}

// How deep a place is inside a meter segment, in page pixels from its rim.
function inPill(u: number, v: number): { depth: number; x: number; y: number } {
  const x = (u - 0.5) * CRANK.segW
  const y = (v - 0.5) * CRANK.segH
  const r = CRANK.segW / 2
  const ds = Math.hypot(x, Math.max(Math.abs(y) - (CRANK.segH / 2 - r), 0))
  return { depth: r - ds, x, y }
}

function own(): NonNullable<typeof made> {
  if (made) return made
  // The unlit segment: clear glass seen from above, a light rim, a darker core, and the light it gathers on its lower right wall.
  const off = picture(32, 128, true, (u, v) => {
    const p = inPill(u, v)
    const core = smooth((p.depth - 1.5) / 5)
    const gather = smooth((p.x / 14) * 0.6 - (p.y / 48) * 0.5) * smooth((p.depth - 2) / 4) * (1 - smooth((p.depth - 6) / 6))
    const k = 0.97 - 0.13 * core + 0.12 * gather
    return [k * 0.965, k * 0.995, k, 1]
  })
  // The lit segment: yellow white along its centre line, orange at the rim.
  const glow = picture(32, 128, true, (u, v) => {
    const p = inPill(u, v)
    const t = Math.pow(smooth(p.depth / 11), 1.3) * (1 - 0.25 * smooth((Math.abs(p.y) - 26) / 20))
    return [1, 0.36 + 0.5 * t, 0.04 + 0.5 * t * t, 1]
  })
  const glass = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe3e8e8), map: off, roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1, envMapIntensity: 1.15 }))
  const lit = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd9772c), emissive: new THREE.Color(1, 1, 1), emissiveMap: glow, emissiveIntensity: 1.25, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1 }))
  const washer = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x2a2826), roughness: 0.6, metalness: 0.4 }))
  const bar = studio(materials().aluminium.clone())
  bar.color = srgb(0x8f9398)
  bar.roughness = 0.36
  bar.normalScale = new THREE.Vector2(0.09, 0.09)
  bar.anisotropyRotation = 0
  made = { glass, lit, washer, bar, textures: [off, glow] }
  return made
}

// A screw head: a chamfered ring, a face with a cross cut through it, and the dark floor of the cut.
function screw(turn: number): { head: THREE.BufferGeometry; floor: THREE.BufferGeometry } {
  const r = L.screw
  const face = new THREE.Shape()
  face.absarc(0, 0, r - 0.9, 0, Math.PI * 2, false)
  const a = 3.1
  const b = 0.62
  const cross = new THREE.Path()
  const pts: [number, number][] = [[b, b], [a, b], [a, -b], [b, -b], [b, -a], [-b, -a], [-b, -b], [-a, -b], [-a, b], [-b, b], [-b, a], [b, a]]
  pts.forEach(([x, y], i) => (i === 0 ? cross.moveTo(x, y) : cross.lineTo(x, y)))
  cross.closePath()
  face.holes.push(cross)
  const top = new THREE.ExtrudeGeometry(face, { depth: 0.9, bevelEnabled: false, curveSegments: 20 })
  const ring = lathe([[r, 0], [r, 0.25, true], [r - 0.9, 0.9, true]], 28)
  const head = fuse([top, ring])
  head.rotateZ(turn)
  const floor = lathe([[a + 0.3, 0.18], [0, 0.18]], 12)
  return { head, floor }
}

function base(): THREE.Group {
  const m = materials()
  const o = own()
  const R = CRANK.base / 2
  const root = new THREE.Group()
  const heads: THREE.BufferGeometry[] = []
  const floors: THREE.BufferGeometry[] = []
  for (let k = 0; k < 4; k++) {
    const at = Math.PI / 4 + (k * Math.PI) / 2
    const s = screw(0.3 + k * 1.13)
    heads.push(moved(s.head, Math.cos(at) * L.screwAt, Math.sin(at) * L.screwAt, L.plate - 0.5))
    floors.push(moved(s.floor, Math.cos(at) * L.screwAt, Math.sin(at) * L.screwAt, L.plate - 0.5))
  }
  root.add(
    mesh(shared('wall', () => lathe([[R - 0.8, 0], [R, 0.8], [R, L.plate - L.rim * 0.8, true]], 96)), m.aluminiumSatin),
    mesh(shared('rim', () => lathe([[R, L.plate - L.rim * 0.8, true], ...round(R, L.plate - L.rim * 0.8, R - L.rim, L.plate, 4)], 96)), m.chrome),
    mesh(shared('face', () => lathe([[R - L.rim, L.plate, true], [0, L.plate]], 96, (R - L.rim) * 2)), m.aluminiumTurned),
    mesh(shared('heads', () => fuse(heads)), m.steel),
    mesh(shared('floors', () => fuse(floors)), o.washer, false, true)
  )
  return root
}

function hub(): THREE.Group {
  const m = materials()
  const o = own()
  const root = new THREE.Group()
  const foot = -(L.full.base - L.plate)
  const top = L.full.hub
  const under = L.full.arm + 8 + 0.4
  root.add(
    mesh(shared('washer', () => lathe([[L.washer, foot], [L.washer, foot + 1.6, true], [L.washer - 0.8, foot + 2.4, true], [L.neck, foot + 2.4]], 72)), o.washer),
    mesh(shared('neck', () => lathe([[L.neck, foot + 2.4], [L.neck, 8]], 72)), m.steel),
    mesh(shared('capSide', () => lathe([[L.cap, under - 1], [L.cap, top - 1.9, true], ...round(L.cap, top - 1.9, L.cap - 1.7, top - 0.3, 4)], 72)), m.chrome),
    mesh(shared('capFace', () => lathe([[L.cap - 1.7, top - 0.3, true], [L.cap * 0.55, top - 0.08], [0, top]], 72, (L.cap - 1.7) * 2)), m.aluminiumTurned)
  )
  return root
}

function armOutline(): ReturnType<typeof outline> {
  const half = CRANK.arm / 2
  const R = L.eye
  const hw = L.bar
  const e = L.end
  const f = L.fillet
  const xc = Math.sqrt((R + f) * (R + f) - (hw + f) * (hw + f))
  const th = Math.atan2(hw + f, xc)
  const pts: [number, number, number, number][] = []
  const line = (x0: number, y0: number, x1: number, y1: number, n: number) => {
    const l = Math.hypot(x1 - x0, y1 - y0)
    const nx = (y1 - y0) / l
    const ny = -(x1 - x0) / l
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, nx, ny])
  }
  const sweepArc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number, inward: boolean) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      const c = Math.cos(a)
      const s = Math.sin(a)
      pts.push([cx + r * c, cy + r * s, inward ? -c : c, inward ? -s : s])
    }
  }
  line(-half + xc, -hw, half, -e, 10)
  sweepArc(half, 0, e, -Math.PI / 2, Math.PI / 2, 16, false)
  line(half, e, -half + xc, hw, 10)
  sweepArc(-half + xc, hw + f, f, Math.PI * 1.5, Math.PI + th, 8, true)
  sweepArc(-half, 0, R, th, Math.PI * 2 - th, 56, false)
  sweepArc(-half + xc, -(hw + f), f, Math.PI - th, Math.PI / 2, 8, true)
  return outline(pts)
}

function arm(): THREE.Group {
  const H = L.full.arm
  const g = shared('arm', () => sweep(armOutline(), profile([[0.7, 0, true], [0, 0.7], [0, H - 1.5], ...arc(0, H - 1.5, 1.5, 1.5, 4)])))
  const root = new THREE.Group()
  root.add(mesh(g, own().bar))
  return root
}

// The grip: a pill lying along the arm, a little fuller at its free end.
export function gripGeometry(len: number, ry: number, rz: number, rings = 30, around = 32): THREE.BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  const power = 3.2
  pos.push(-len / 2, 0, rz)
  for (let i = 1; i < rings; i++) {
    const a = (i / rings) * Math.PI
    const x = (-Math.cos(a) * len) / 2
    const t = Math.abs((2 * x) / len)
    const r = Math.pow(1 - Math.pow(t, power), 1 / power) * (0.96 + (0.04 * (2 * x)) / len)
    for (let j = 0; j < around; j++) {
      const p = (j / around) * Math.PI * 2
      pos.push(x, r * ry * Math.cos(p), rz + r * rz * Math.sin(p))
    }
  }
  pos.push(len / 2, 0, rz)
  const last = pos.length / 3 - 1
  for (let j = 0; j < around; j++) {
    const k = (j + 1) % around
    idx.push(0, 1 + k, 1 + j)
    const end = 1 + (rings - 2) * around
    idx.push(last, end + j, end + k)
  }
  for (let i = 0; i < rings - 2; i++) {
    const a = 1 + i * around
    const b = a + around
    for (let j = 0; j < around; j++) {
      const k = (j + 1) % around
      idx.push(a + j, a + k, b + j, a + k, b + k, b + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return g
}

function grip(): THREE.Group {
  const root = new THREE.Group()
  root.add(mesh(shared('grip', () => gripGeometry(CRANK.gripW, CRANK.gripH / 2, L.full.grip / 2)), materials().orange))
  return root
}

function segment(): THREE.Group {
  const H = L.pill
  const g = shared('segment', () => {
    const out = sweep(roundedRect(CRANK.segW, CRANK.segH, CRANK.segW / 2, 14), profile([[0.4, 0, true], [0, 0.4], [0, H - 5.5], ...arc(0, H - 5.5, 5, 5.1, 8), [9, H - 0.15], [13.5, H]]))
    const uv = out.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / CRANK.segW + 0.5, uv.getY(i) / CRANK.segH + 0.5)
    return out
  })
  const root = new THREE.Group()
  const body = mesh(g, own().glass)
  root.add(body)
  root.userData.body = body
  return root
}

// The lit segments share a few lamps: the middle segment of each group of up to three carries the group's light.
function lamp(s: Shape, ctx: RealContext): void {
  const cut = s.id.lastIndexOf('meter-')
  const tag = s.id.slice(0, cut + 6)
  const mine = Number(s.id.slice(cut + 6))
  let lit = 0
  for (let k = 1; k <= 10; k++) if (ctx.byId.get(`${tag}${k}`)?.tone === 'accent') lit = k
  if (lit === 0 || mine > lit) return
  const groups = Math.min(L.lamp.most, Math.ceil(lit / 3))
  for (let g = 0; g < groups; g++) {
    const from = Math.floor((g * lit) / groups) + 1
    const to = Math.floor(((g + 1) * lit) / groups)
    const bearer = Math.floor((from + to) / 2)
    if (bearer !== mine) continue
    const mid = (from + to) / 2 - mine
    ctx.light({ x: s.x + s.w / 2 + mid * (CRANK.segW + CRANK.segGap), y: s.y + s.h / 2, z: s.z0 + L.pill + L.lamp.lift, colour: L.lamp.colour, power: L.lamp.power * (to - from + 1), reach: L.lamp.reach })
  }
}

const kindOf = (s: Shape): 'base' | 'hub' | 'arm' | 'grip' | 'meter' | null => {
  const id = s.id
  if (/meter-\d+$/.test(id)) return 'meter'
  if (id.endsWith('crank-base')) return 'base'
  if (id.endsWith('crank-hub')) return 'hub'
  if (id.endsWith('crank-arm')) return 'arm'
  if (id.endsWith('crank-grip')) return 'grip'
  return null
}

export const crank: PartMaker | null = {
  key(s) {
    if (s.kind === 'text') return null
    const kind = kindOf(s)
    return kind ? `crank:${kind}` : null
  },
  make(s) {
    const kind = kindOf(s)
    const o = kind === 'base' ? base() : kind === 'hub' ? hub() : kind === 'arm' ? arm() : kind === 'grip' ? grip() : segment()
    o.userData.kind = kind
    return o
  },
  pose(o, s, ctx) {
    const kind = o.userData.kind as keyof typeof L.full
    if (kind !== 'meter') {
      rise(o, s, L.full[kind])
      return
    }
    const on = s.tone === 'accent'
    const up = rise(o, s, on ? L.full.meter + 6 : L.full.meter)
    if (on) o.scale.z *= L.pillLit
    const body = o.userData.body as THREE.Mesh
    const m = own()
    body.material = on ? m.lit : m.glass
    if (on && up > 0.5) lamp(s, ctx)
  }
}

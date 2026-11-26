import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker, RealContext } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { arc, circle, profile, roundedRect, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { scaled } from './sheet'
import { CRANK, ROWS } from '../layout'
import { clamp01, contact, fuse, lathe, mesh, moved, outline, picture, rise, round, smooth, srgb } from './slot-kit'

export const CRANK_LOOK = {
  full: { base: 26, hub: 22, arm: 10, grip: 24, meter: 20 }, pill: 3.4, pillRound: 2.4, pillCorner: 12, clear: { core: 0.42, low: 0.57, gain: 0.3 }, footLine: 1.5, wallRings: 3, picture: [128, 512] as [number, number], rimTone: 0.4,
  plate: 8, rim: 3.6, screwAt: 38, screw: 4.8, washer: 25.5, neck: 20, eye: 3.4, bar: 0.8, end: 0.5, fillet: 9, cap: 16.5,
  grip: { cap: 0.95, round: 2.5, square: 2.5, taper: 0.9, seamAt: 9, seam: 0.07, collar: 0.05 },
  tie: { low: 0.82, gain: 1.7, second: 0.3, sharp: 3, axis: 2.5, capAxis: 2.2 },
  lamp: { colour: [1, 0.42, 0.1] as [number, number, number], power: 0.55, reach: 72, lift: 10, most: 4 }
}
const L = CRANK_LOOK

let made: { glass: THREE.MeshPhysicalMaterial; wall: THREE.MeshPhysicalMaterial; lit: THREE.MeshPhysicalMaterial; washer: THREE.MeshPhysicalMaterial; bar: THREE.MeshPhysicalMaterial; turned: THREE.MeshPhysicalMaterial; textures: THREE.Texture[] } | null = null
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
  const c = L.pillCorner
  const qx = Math.abs(x) - (CRANK.segW / 2 - c)
  const qy = Math.abs(y) - (CRANK.segH / 2 - c)
  const ds = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
  return { depth: c - ds, x, y }
}

function own(): NonNullable<typeof made> {
  if (made) return made
  // The unlit segment: tinted glass seen from above. Its alpha is how much of the ground is hidden: a bright line on the rim where the light comes from, a thin dark line inside it, a grey green core.
  const off = picture(L.picture[0], L.picture[1], true, (u, v) => {
    const p = inPill(u, v)
    const side = (p.x / 14) * 0.6 - (p.y / 48) * 0.55
    const edge = 1 - smooth(p.depth / 0.9)
    const line = smooth((p.depth - 0.5) / 0.8) * (1 - smooth((p.depth - 2.5) / 1.2))
    const dark = smooth((p.depth - 2.9) / 0.8) * (1 - smooth((p.depth - 4.1) / 1.4))
    const gather = smooth(side) * smooth((p.depth - 3.2) / 1.5) * (1 - smooth((p.depth - 5.5) / 4))
    const hi = smooth((0.3 - side) / 0.9)
    const across = smooth(0.5 + 0.5 * ((p.x / 14) * 0.85 - (p.y / 48) * 0.25))
    const k = L.clear.low + L.clear.gain * across + 0.62 * line * (0.4 + 0.6 * hi) - 0.26 * dark * (1 - 0.6 * smooth(side + 0.4)) - 0.3 * edge + 0.12 * gather
    const a = Math.min(1, L.clear.core + (0.3 + 0.4 * hi) * line + 0.44 * edge + 0.3 * dark + 0.1 * gather)
    return [k * 0.955, k * 0.995, k * 0.975, a]
  })
  // The lit segment: a pale orange core, a deeper orange ring, and a bright line at the rim.
  const glow = picture(64, 256, true, (u, v) => {
    const p = inPill(u, v)
    const t = smooth((p.depth - 2.2) / 9) * (1 - 0.25 * smooth((Math.abs(p.y) - 34) / 20))
    const rim = smooth((p.depth - 0.4) / 0.8) * (1 - smooth((p.depth - 1.8) / 1.2))
    return [1, 0.3 + 0.44 * t + 0.14 * rim, 0.03 + 0.46 * Math.pow(t, 1.4) + 0.04 * rim, 1]
  })
  const glass = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf4f7f7), map: off, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.6, transparent: true }))
  const wall = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf4f7f7).multiply(new THREE.Color().setRGB(L.rimTone * 0.955, L.rimTone * 0.995, L.rimTone * 0.975, THREE.SRGBColorSpace)), roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.6 }))
  const lit = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd9772c), emissive: new THREE.Color(1, 1, 1), emissiveMap: glow, emissiveIntensity: 1.0, roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, specularIntensity: 0.5 }))
  const washer = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x2a2826), roughness: 0.6, metalness: 0.4 }))
  const bar = studio(materials().aluminium.clone())
  bar.color = srgb(0x8e9398)
  bar.roughness = 0.4
  bar.normalScale = new THREE.Vector2(0.09, 0.09)
  bar.anisotropyRotation = 0
  const shared = materials().aluminiumTurned
  const turned = shared.clone()
  turned.onBeforeCompile = shared.onBeforeCompile
  turned.customProgramCacheKey = shared.customProgramCacheKey
  turned.normalScale = new THREE.Vector2(0.022, 0.022)
  turned.roughness = 0.3
  turned.vertexColors = true
  made = { glass, wall, lit, washer, bar, turned, textures: [off, glow] }
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
    mesh(shared('foot', () => contact(circle(R + L.footLine, 96), L.footLine + 0.8)), m.gap, false),
    mesh(shared('wall', () => lathe([[R - 0.8, 0], [R, 0.8], [R, L.plate - L.rim * 0.8, true]], 96)), m.aluminiumSatin),
    mesh(shared('rim', () => lathe([[R, L.plate - L.rim * 0.8, true], ...round(R, L.plate - L.rim * 0.8, R - L.rim, L.plate, 4)], 96)), m.chrome),
    mesh(shared('face', () => bowTie(lathe([[R - L.rim, L.plate, true], [0, L.plate]], 96, (R - L.rim) * 2), L.tie.axis)), o.turned),
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
    mesh(shared('capFace', () => bowTie(lathe([[L.cap - 1.7, top - 0.3, true], [L.cap * 0.55, top - 0.08], [0, top]], 72, (L.cap - 1.7) * 2), L.tie.capAxis)), o.turned)
  )
  return root
}

function armOutline(len: number, wide: number): ReturnType<typeof outline> {
  const half = (len - wide) / 2
  const R = CRANK.hub / 2 + L.eye
  const hw = wide * L.bar
  const e = wide * L.end
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

function arm(s: Shape): THREE.Group {
  const H = L.full.arm
  const g = shared(`arm:${s.w}:${s.h}`, () => sweep(armOutline(s.w, s.h), profile([[0.7, 0, true], [0, 0.7], [0, H - 3.1], [0.35, H - 2.4], [2.4, H - 0.35], [3.1, H]])))
  const root = new THREE.Group()
  root.add(mesh(g, own().bar))
  return root
}

// The grip: a bar of soft plastic lying along the arm, flat on top, round at both ends, a little fuller at its free end, with a collar and a seam where the arm goes in.
export function gripGeometry(len: number, ry: number, rz: number, rings = 36, around = 40): THREE.BufferGeometry {
  const G = L.grip
  const cap = ry * G.cap
  const xs: number[] = []
  for (let i = 1; i < rings; i++) xs.push((-Math.cos((i / rings) * Math.PI) * len) / 2)
  for (const d of [G.seamAt - 1.5, G.seamAt - 0.7, G.seamAt, G.seamAt + 0.7, G.seamAt + 1.5]) xs.push(-len / 2 + d)
  xs.sort((p, q) => p - q)
  const at = xs.filter((x, i) => i === 0 || x - xs[i - 1]! > 0.05)
  const pos: number[] = [-len / 2, 0, rz]
  const e = 2 / G.square
  for (const x of at) {
    const d = Math.min(x + len / 2, len / 2 - x)
    const u = clamp01(1 - d / cap)
    const end = Math.pow(1 - Math.pow(u, G.round), 1 / G.round)
    const along = (x + len / 2) / len
    const seam = 1 - G.seam * Math.exp(-Math.pow((x + len / 2 - G.seamAt) / 0.8, 2))
    const collar = 1 - G.collar * (1 - smooth((x + len / 2 - G.seamAt + 1) / 1.2))
    const f = end * (G.taper + (1 - G.taper) * along) * seam * collar
    for (let j = 0; j < around; j++) {
      const p = (j / around) * Math.PI * 2
      const c = Math.cos(p)
      const sn = Math.sin(p)
      pos.push(x, f * ry * Math.sign(c) * Math.pow(Math.abs(c), e), rz + f * rz * Math.sign(sn) * Math.pow(Math.abs(sn), e))
    }
  }
  pos.push(len / 2, 0, rz)
  const count = at.length
  const last = pos.length / 3 - 1
  const idx: number[] = []
  for (let j = 0; j < around; j++) {
    const k = (j + 1) % around
    idx.push(0, 1 + k, 1 + j)
    const tail = 1 + (count - 1) * around
    idx.push(last, tail + j, tail + k)
  }
  for (let i = 0; i < count - 1; i++) {
    const p = 1 + i * around
    const q = p + around
    for (let j = 0; j < around; j++) {
      const k = (j + 1) % around
      idx.push(p + j, p + k, q + j, p + k, q + k, q + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return g
}

// A turned face under one light shows a bow tie through its centre. The anisotropy of the shared metal gives its shape, this gives its depth.
function bowTie(g: THREE.BufferGeometry, axis: number): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const colour = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getY(i))
    const a = Math.atan2(p.getY(i), p.getX(i)) - axis
    const k = r < 0.01 ? 1 : L.tie.low + L.tie.gain * Math.pow(Math.cos(a) * Math.cos(a), L.tie.sharp) + L.tie.second * Math.pow(Math.cos(a - 1.25) * Math.cos(a - 1.25), L.tie.sharp * 2.2)
    colour[i * 3] = k
    colour[i * 3 + 1] = k
    colour[i * 3 + 2] = k
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  return g
}

function grip(): THREE.Group {
  const root = new THREE.Group()
  root.add(mesh(shared('grip', () => gripGeometry(CRANK.gripW, CRANK.gripH / 2, L.full.grip / 2)), materials().orange))
  return root
}

// A segment is two meshes. Its top carries the picture; its upright wall, where a picture seen from above has no room, is plain glass in the tone of the picture's rim.
function segment(): THREE.Group {
  const H = L.pill
  const r = L.pillRound
  const rings = (): ReturnType<typeof profile> => profile([[0.4, 0, true], [0, 0.4], [0, H - r], ...arc(0, H - r, r, r - 0.25, 7), [7, H - 0.1], [13.5, H]])
  const plan = (): ReturnType<typeof roundedRect> => roundedRect(CRANK.segW, CRANK.segH, L.pillCorner, 14)
  const top = shared('segment', () => {
    const out = sweep(plan(), rings().slice(L.wallRings - 1))
    const uv = out.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / CRANK.segW + 0.5, uv.getY(i) / CRANK.segH + 0.5)
    return out
  })
  const side = shared('segment-wall', () => sweep(plan(), rings().slice(0, L.wallRings), false))
  const root = new THREE.Group()
  const body = mesh(top, own().glass)
  const wall = mesh(side, own().wall)
  root.add(body, wall)
  root.userData.body = body
  root.userData.wall = wall
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
    ctx.light({ x: s.x + s.w / 2 + mid * (CRANK.segW + CRANK.segGap), y: s.y + s.h / 2, z: standOf(s, ctx) + L.pill * 1.3 + L.lamp.lift, colour: L.lamp.colour, power: L.lamp.power * (to - from + 1), reach: L.lamp.reach })
  }
}

// Where a segment stands: on the floor of its tray, or on the page when the list has no tray for it (the sheet).
function standOf(s: Shape, ctx: RealContext): number {
  const tag = s.id.slice(0, s.id.lastIndexOf('meter-'))
  return ctx.byId.has(`${tag}${ROWS[2]}-tray`) ? s.z0 : Math.max(s.z0, 0)
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

const plainCrank: PartMaker = {
  key(s) {
    if (s.kind === 'text') return null
    const kind = kindOf(s)
    return kind === 'arm' ? `crank:arm:${s.w}:${s.h}` : kind ? `crank:${kind}` : null
  },
  make(s) {
    const kind = kindOf(s)
    const o = kind === 'base' ? base() : kind === 'hub' ? hub() : kind === 'arm' ? arm(s) : kind === 'grip' ? grip() : segment()
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
    const up = clamp01((s.z1 - s.z0) / L.full.meter)
    o.scale.z = Math.max(0.001, (s.z1 - s.z0) / L.full.meter)
    o.visible = up > 0.02
    const body = o.userData.body as THREE.Mesh
    body.position.z = (standOf(s, ctx) - s.z0) / o.scale.z
    const m = own()
    body.material = on ? m.lit : m.glass
    const wall = o.userData.wall as THREE.Mesh
    wall.material = on ? m.lit : m.wall
    wall.position.z = body.position.z
    if (on && up > 0.5) lamp(s, ctx)
  }
}

export const crank: PartMaker | null = scaled(plainCrank)

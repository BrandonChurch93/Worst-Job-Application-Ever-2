import * as THREE from 'three'
import { config } from '../../../config'
import { studio } from '../../../post/studio'
import type { PartMaker, RealContext } from '../../../real/types'
import { look } from '../../../post/look'
import { materials } from '../../../shell/materials'
import { roundedRect } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { scaled } from './sheet'
import type { LayoutNode } from '../../../copy'
import { SLOT, buildLayout } from '../layout'
import { clamp01, contact, fuse, lathe, loft, mesh, moved, noise, normalsFrom, rise, smooth, srgb, type LoftRing } from './slot-kit'

export const SLOT_LOOK = {
  page: { cabinet: 46, knob: 28, payout: 14, mount: 30, arm: 12 },
  top: 58, corner: 16, window: 13, roundOver: 3, band: 12.4, step: 0.9, ledge: 2.4, chamfer: 4.6, chamferDrop: 3.6, gasket: 2.6, glass: 54.2, floor: 18,
  drum: { r: 62, crest: 50, w: 97, lip: 2.2, flat: 0.4, dark: 0.62, full: 0.88 },
  line: { z: 53.3, r: 0.85, pin: 1.9, glow: 0.1 },
  sheen: { top: 0.06, streak: 0.034, order: 800001 },
  lever: { rod: 5.6, pivotX: 11, pivotZ: 28, barrel: 9, barrelW: 19, collar: 4, foot: -2, head: 22, ferrule: 7, ferruleAt: 27 },
  coin: { r: 13, t: 4, teeth: 64, most: 16, flight: 14, tilt: 1.05 },
  frame: { colour: 0x7e8286, rough: 0.37, grain: 0.08, grainLong: 1200, grainWide: 150, fan: 0.34, fanAcross: 0.6, fanUp: 2.2 },
  bevel: { colour: 0x7c8084, rough: 0.34 },
  glassEnv: 0.7,
  mouthFloor: 8.5,
  glassOrder: 800000,
  footLine: 2.2
}
const L = SLOT_LOOK

// The height the page gives the cabinet when it is fully up, read from the page's own layout.
let cabinetFull = 0
function cabinetHeight(): number {
  if (cabinetFull > 0) return cabinetFull
  const find = (n: LayoutNode): LayoutNode | null => {
    if (n.id === 'slot-cabinet') return n
    for (const c of n.children ?? []) {
      const hit = find(c)
      if (hit) return hit
    }
    return null
  }
  const n = find(buildLayout())
  cabinetFull = n && n.height !== undefined && n.floor !== undefined ? n.height - n.floor : L.page.cabinet
  return cabinetFull
}

interface Own {
  drum: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  well: THREE.MeshPhysicalMaterial
  gold: THREE.MeshPhysicalMaterial
  rod: THREE.MeshPhysicalMaterial
  frame: THREE.MeshPhysicalMaterial
  bevel: THREE.MeshPhysicalMaterial
  mouth: THREE.MeshPhysicalMaterial
  sheen: THREE.MeshBasicMaterial
  line: THREE.MeshPhysicalMaterial
  textures: THREE.Texture[]
}

let made: Own | null = null
const cache = new Map<string, THREE.BufferGeometry>()
const shared = (key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = cache.get(key)
  if (!g) {
    g = build()
    cache.set(key, g)
  }
  return g
}

// The height of a coin's face: a raised rim, a ring of beads, a star struck in the middle, and the wear of a coin that has been paid out before.
export function coinHeight(u: number, v: number, seed: number): number {
  const x = u * 2 - 1
  const y = v * 2 - 1
  const r = Math.hypot(x, y)
  const a = Math.atan2(y, x)
  const rim = smooth((r - 0.8) / 0.05) * 1.0
  const beadAt = ((a / (Math.PI * 2)) * 28 + 28) % 1
  const bead = Math.max(0, 1 - Math.hypot((beadAt - 0.5) * ((Math.PI * 2 * 0.7) / 28), r - 0.7) / 0.045)
  const points = 5
  const wedge = Math.abs((((a + Math.PI / 2) / (Math.PI * 2)) * points + points + 0.5) % 1 - 0.5) * 2
  const reach = 0.2 + 0.32 * (1 - wedge) * (1 - wedge)
  const star = smooth((reach - r) / 0.09)
  const dome = star * (0.55 + 0.45 * (1 - r / 0.55))
  const wear = (noise(u * 22, v * 22, seed) - 0.5) * 0.05 + (noise(u * 70, v * 70, seed + 3) - 0.5) * 0.03
  return rim + Math.sqrt(bead) * 0.55 + dome * 0.8 + wear
}

function own(): Own {
  if (made) return made
  const face = normalsFrom(256, 1.7, (u, v) => coinHeight(u, v, config.seed + 211))
  const m = materials()
  const drum = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xe9e6de), roughness: 0.5, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.3, specularIntensity: 0.3, vertexColors: true }))
  const glass = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x10161b), roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: L.glassEnv, transparent: true, opacity: 0.12, depthWrite: false }))
  const well = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x121211), roughness: 0.85, metalness: 0, specularIntensity: 0.3 }))
  const gold = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd4a543), roughness: 0.6, metalness: 1, envMapIntensity: 1.1, normalMap: face, normalScale: new THREE.Vector2(2, 2) }))
  const rod = studio(new THREE.MeshPhysicalMaterial({ color: m.chrome.color, roughness: 0.14, metalness: 1 }))
  const frame = studio(m.aluminium.clone())
  frame.color = srgb(L.frame.colour)
  frame.roughness = L.frame.rough
  frame.vertexColors = true
  const brushing = m.aluminium.normalMap!.clone()
  brushing.repeat.set(1 / L.frame.grainLong, 1 / L.frame.grainWide)
  brushing.needsUpdate = true
  frame.normalMap = brushing
  const bevel = studio(m.aluminium.clone())
  bevel.color = srgb(L.bevel.colour)
  bevel.roughness = L.bevel.rough
  bevel.normalMap = null
  frame.normalScale = new THREE.Vector2(L.frame.grain, L.frame.grain)
  const mouth = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x0e0e0d), roughness: 0.9, metalness: 0, specularIntensity: 0.2 }))
  const sheen = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const line = studio(m.orange.clone())
  line.emissive = m.orange.color.clone()
  line.emissiveIntensity = L.line.glow
  made = { drum, glass, well, gold, rod, frame, bevel, mouth, sheen, line, textures: [face] }
  return made
}

const ring = (w: number, h: number, r: number, inset: number, z: number, out: number, up: number): LoftRing => ({ o: roundedRect(w - inset * 2, h - inset * 2, Math.max(0.8, inset >= L.band ? L.window - (inset - L.band) : r - inset), 10), z, out, up })

// The frame's upward faces are painted a little lighter toward the key and darker away from it, more from top to bottom than across: a satin band this narrow shows the room as one slow gradient.
export function fanned(g: THREE.BufferGeometry, reach: number): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  const [kx, ky] = look.key.direction
  const kl = Math.hypot(kx, ky) || 1
  const colour = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const toward = (p.getX(i) * kx * L.frame.fanAcross + p.getY(i) * ky * L.frame.fanUp) / kl / reach
    const k = 1 + L.frame.fan * toward * clamp01(n.getZ(i))
    colour[i * 3] = k
    colour[i * 3 + 1] = k
    colour[i * 3 + 2] = k
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  return g
}

function cabinet(): THREE.Group {
  const m = materials()
  const o = own()
  const w = SLOT.w
  const h = SLOT.h
  const R = L.corner
  const T = L.top
  const root = new THREE.Group()
  const body = shared('cabinet', () => {
    const rings: LoftRing[] = [ring(w, h, R, 0.8, 0, 1, -1), ring(w, h, R, 0, 0.8, 1, 0), ring(w, h, R, 0, T - L.roundOver, 1, 0)]
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2)
      rings.push(ring(w, h, R, L.roundOver * (1 - Math.cos(a)), T - L.roundOver + L.roundOver * Math.sin(a), Math.cos(a), Math.sin(a)))
    }
    rings.push(ring(w, h, R, L.band, T, 0, 1))
    return fanned(loft(rings), Math.hypot(w, h) / 2)
  })
  const lip = L.band + 0.6
  const shelf = lip + L.ledge
  const inner = shelf + L.chamfer
  const low = T - L.step - L.chamferDrop
  const slope = shared('chamfer', () =>
    loft([
      ring(w, h, R, L.band, T, 0, 1),
      ring(w, h, R, L.band + 0.3, T - 0.1, -0.5, 0.86),
      ring(w, h, R, lip, T - 0.4, -1, 0),
      ring(w, h, R, lip, T - L.step, -1, 0),
      ring(w, h, R, lip, T - L.step, 0, 1),
      ring(w, h, R, shelf, T - L.step, 0, 1),
      ring(w, h, R, shelf + 0.5, T - L.step - 0.2, -L.chamferDrop, L.chamfer),
      ring(w, h, R, inner, low, -L.chamferDrop, L.chamfer)
    ]))
  const edge = inner + L.gasket
  const well = shared('well', () =>
    loft([
      ring(w, h, R, inner, low, 0, 1), ring(w, h, R, edge, low, 0, 1),
      ring(w, h, R, edge, low, -1, 0), ring(w, h, R, edge, L.floor, -1, 0),
      ring(w, h, R, edge, L.floor, 0, 1)
    ], 1))
  const drums = shared('drums', () => {
    const d = L.drum
    const parts: THREE.BufferGeometry[] = []
    for (let r = 0; r < 3; r++) {
      const g = lathe([[d.r - 14, -d.w / 2], [d.r - d.lip, -d.w / 2, true], [d.r - 0.5, -d.w / 2 + d.lip * 0.5], [d.r, -d.w / 2 + d.lip], [d.r, d.w / 2 - d.lip], [d.r - 0.5, d.w / 2 - d.lip * 0.5], [d.r - d.lip, d.w / 2, true], [d.r - 14, d.w / 2]], 120)
      g.rotateY(Math.PI / 2)
      parts.push(moved(g, SLOT.reelX(r) + SLOT.reelW / 2 - (SLOT.x + w / 2), 0, d.crest - d.r))
    }
    const all = fuse(parts)
    const n = all.getAttribute('normal')
    const colour = new Float32Array(n.count * 3)
    for (let i = 0; i < n.count; i++) {
      const k = 0.04 + 0.96 * smooth((n.getZ(i) - d.dark) / (d.full - d.dark))
      colour[i * 3] = k
      colour[i * 3 + 1] = k
      colour[i * 3 + 2] = k
      const y = n.getY(i) * d.flat
      const l = Math.hypot(n.getX(i), y, n.getZ(i)) || 1
      if (n.getZ(i) > 0) n.setXYZ(i, n.getX(i) / l, y / l, n.getZ(i) / l)
    }
    all.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
    return all
  })
  const line = shared('line', () => {
    const half = w / 2 - edge
    const rod = lathe([[L.line.r, -half], [L.line.r, half]], 10)
    rod.rotateY(Math.PI / 2)
    return moved(rod, 0, 0, L.line.z)
  })
  const pins = shared('pins', () => {
    const parts: THREE.BufferGeometry[] = []
    for (const x of [-52, 52]) parts.push(moved(lathe([[L.line.pin, 0], [L.line.pin, 5], [L.line.pin * 0.5, 6.2], [0, 6.4]], 16), x, 0, L.line.z - 5.9))
    return fuse(parts)
  })
  const glass = mesh(shared('glass', () => loft([ring(w, h, R, inner + 0.3, L.glass, 0, 1)], 1)), o.glass, false, false)
  glass.userData.order = L.glassOrder
  glass.renderOrder = L.glassOrder
  const sheen = mesh(shared('sheen', () => sheenGeometry(w - (inner + 0.6) * 2, h - (inner + 0.6) * 2, L.glass + 0.05)), o.sheen, false, false)
  sheen.userData.order = L.sheen.order
  sheen.renderOrder = L.sheen.order
  const foot = shared('foot', () => contact(roundedRect(w + L.footLine * 2, h + L.footLine * 2, R + L.footLine, 10), L.footLine + 0.8))
  root.add(mesh(foot, m.gap, false), mesh(body, o.frame), mesh(slope, o.bevel), mesh(well, o.well, false, false), mesh(drums, o.drum, false, true), mesh(line, o.line, false, false), mesh(pins, m.steel, false, true), glass, sheen)
  return root
}

// What the glass shows of the room: the soft edge of the light above it along its top, and one faint streak across.
export function sheenGeometry(w: number, h: number, z: number, nx = 48, ny = 16): THREE.BufferGeometry {
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const u = i / nx
      const v = j / ny
      pos.push((u - 0.5) * w, (0.5 - v) * h, z)
      const top = L.sheen.top * Math.pow(1 - smooth(v / 0.3), 2)
      const across = (u * w - v * h * 1.6) / w
      const streak = L.sheen.streak * Math.exp(-Math.pow((across - 0.3) / 0.09, 2)) + L.sheen.streak * 0.5 * Math.exp(-Math.pow((across - 0.47) / 0.03, 2))
      const edge = smooth(Math.min(u, 1 - u) * w / 6) * smooth(Math.min(v, 1 - v) * h / 4)
      const k = (top + streak) * edge
      col.push(k * 0.95, k * 0.99, k * 1.04)
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i
      const b = a + nx + 1
      idx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  const flat = new Float32Array(pos.length)
  for (let i = 2; i < flat.length; i += 3) flat[i] = 1
  g.setAttribute('normal', new THREE.Float32BufferAttribute(flat, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  g.setIndex(idx)
  return g
}

function knob(): THREE.Group {
  const root = new THREE.Group()
  const g = shared('knob', () => {
    const r = SLOT.knob / 2
    const half = L.page.knob / 2
    const pts: [number, number][] = []
    for (let i = 0; i <= 28; i++) {
      const a = -Math.PI / 2 + (i / 28) * Math.PI
      pts.push([r * Math.cos(a), half + half * Math.sin(a)])
    }
    return lathe(pts, 56)
  })
  root.add(mesh(g, materials().orange))
  return root
}

function mount(): THREE.Group {
  const m = materials()
  const root = new THREE.Group()
  const H = L.page.mount - 8
  const block = shared('mount', () => {
    const w = 50
    const h = 20
    const rings: LoftRing[] = [ring(w, h, 4, 0, 0, 1, 0), ring(w, h, 4, 0, H - 2, 1, 0)]
    for (let i = 1; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2)
      rings.push(ring(w, h, 4, 2 * (1 - Math.cos(a)), H - 2 + 2 * Math.sin(a), Math.cos(a), Math.sin(a)))
    }
    return fanned(loft(rings, 1), Math.hypot(SLOT.w, SLOT.h) / 2)
  })
  const barrel = shared('barrel', () => {
    const b = L.lever.barrel
    const half = L.lever.barrelW / 2
    const c = L.lever.collar
    const g = lathe([[0, -half], [b + 0.2, -half, true], [b + 1.4, -half + 1.2, true], [b + 1.4, -half + c - 0.8, true], [b, -half + c, true], [b, half - c, true], [b + 1.4, half - c + 0.8, true], [b + 1.4, half - 1.2, true], [b + 0.2, half, true], [0, half]], 48)
    g.rotateY(Math.PI / 2)
    return moved(g, L.lever.pivotX, 0, L.lever.pivotZ)
  })
  const heads = shared('mountHeads', () => fuse([-19, -8].map((x) => moved(lathe([[2.7, 0], [2.7, 0.7, true], [1.9, 1.25, true], [1.15, 1.3], [1.15, 0.5, true], [0, 0.5]], 20), x, 0, H))))
  root.add(mesh(block, own().frame), mesh(barrel, m.chrome), mesh(heads, m.steel))
  return root
}

function arm(): THREE.Group {
  const root = new THREE.Group()
  const g = shared('rod', () => {
    const out = lathe([[L.lever.rod, 0], [L.lever.rod, 1]], 24)
    out.rotateX(-Math.PI / 2)
    return out
  })
  const rod = mesh(g, own().rod)
  const f = shared('ferrule', () => {
    const r = L.lever.rod
    const out = lathe([[r + 0.3, 0, true], [r + 1.9, 0.9, true], [r + 1.9, L.lever.ferrule - 0.9, true], [r + 0.3, L.lever.ferrule, true]], 28)
    out.rotateX(-Math.PI / 2)
    return out
  })
  const ferrule = mesh(f, materials().chrome)
  const swing = new THREE.Group()
  swing.add(rod, ferrule)
  root.add(swing)
  root.userData.swing = swing
  root.userData.rod = rod
  root.userData.ferrule = ferrule
  return root
}

export function coinGeometry(): THREE.BufferGeometry {
  const c = L.coin
  const half = c.t / 2
  const lip = 0.45
  const n = c.teeth * 2
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const rimUv = 0.5 + 0.47
  for (let i = 0; i < n; i++) {
    for (const k of [0, 1]) {
      const j = i + k
      const a = (j / n) * Math.PI * 2
      const r = c.r - (j % 2 === 0 ? 0 : 0.32)
      const am = ((i + 0.5) / n) * Math.PI * 2
      const lean = i % 2 === 0 ? 0.5 : -0.5
      const nx = Math.cos(am + lean)
      const ny = Math.sin(am + lean)
      for (const z of [-half + lip, half - lip]) {
        pos.push(r * Math.cos(a), r * Math.sin(a), z)
        nor.push(nx, ny, 0)
        uv.push(rimUv, 0.5)
      }
    }
    const b = i * 4
    idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1)
  }
  const edge = new THREE.BufferGeometry()
  edge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  edge.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  edge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  edge.setIndex(idx)
  const face = (): THREE.BufferGeometry => lathe([[c.r - 0.16, half - lip, true], [c.r - lip - 0.16, half, true], [0, half]], 64, c.r * 2 * 1.04)
  const back = face()
  back.rotateX(Math.PI)
  return fuse([edge, face(), back])
}

function payout(): THREE.Group {
  const o = own()
  const root = new THREE.Group()
  const body = new THREE.Group()
  const coins = new THREE.InstancedMesh(shared('coin', coinGeometry), o.gold, L.coin.most)
  coins.castShadow = true
  coins.receiveShadow = true
  coins.frustumCulled = false
  coins.count = 0
  root.add(body, coins)
  root.userData.body = body
  root.userData.coins = coins
  return root
}

const turn = new THREE.Quaternion()
const tip = new THREE.Quaternion()
const axis = new THREE.Vector3()
const up = new THREE.Vector3(0, 0, 1)
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const matrix = new THREE.Matrix4()

// How a coin lies for its numbers: flat on the page when it is down, tumbling while it is in the air.
export function coinPose(x: number, y: number, z: number, rot: number, scale: number, n: number, out: THREE.Matrix4): THREE.Matrix4 {
  const c = L.coin
  const air = smooth(z / c.flight)
  const lean = air * c.tilt * Math.sin(rot * 1.3 + n * 2.4 + z * 0.045)
  const dir = n * 1.9 + rot * 0.21
  axis.set(Math.cos(dir), Math.sin(dir), 0)
  tip.setFromAxisAngle(axis, lean)
  turn.setFromAxisAngle(up, -rot)
  tip.multiply(turn)
  at.set(x, y, z + (c.t / 2) * scale + Math.abs(Math.sin(lean)) * c.r * scale)
  size.set(scale, scale, scale)
  return out.compose(at, tip, size)
}

function poseCoins(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const coins = o.userData.coins as THREE.InstancedMesh
  const tag = s.id.slice(0, s.id.length - 'slot-payout'.length) + 'coin-'
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  let count = 0
  for (const c of ctx.list) {
    if (count >= L.coin.most) break
    if (c.part !== 'slot' || !c.id.startsWith(tag)) continue
    const n = Number(c.id.slice(tag.length))
    const scale = c.w / (L.coin.r * 2)
    if (!(scale > 0.01)) continue
    coins.setMatrixAt(count++, coinPose(c.x + c.w / 2 - cx, cy - (c.y + c.h / 2), c.z0 - s.z0, c.rot ?? 0, scale, n, matrix))
  }
  coins.count = count
  coins.visible = count > 0
  coins.instanceMatrix.needsUpdate = true
}

type Kind = 'cabinet' | 'knob' | 'payout' | 'mount' | 'arm'

const kindOf = (s: Shape): Kind | '' | null => {
  const id = s.id
  if (id.endsWith('slot-cabinet')) return 'cabinet'
  if (id.endsWith('slot-window') || /slot-reel-\d$/.test(id) || /coin-\d+$/.test(id)) return ''
  if (id.endsWith('slot-knob')) return 'knob'
  if (id.endsWith('slot-payout')) return 'payout'
  if (id.endsWith('slot-mount')) return 'mount'
  if (id.endsWith('slot-arm')) return 'arm'
  return null
}

const plainSlot: PartMaker = {
  key(s) {
    if (s.kind === 'text') return null
    const kind = kindOf(s)
    if (kind === null) return null
    return kind === '' ? '' : `slot:${kind}`
  },
  make(s) {
    const kind = kindOf(s) as Kind
    const o = kind === 'cabinet' ? cabinet() : kind === 'knob' ? knob() : kind === 'payout' ? payout() : kind === 'mount' ? mount() : arm()
    o.userData.kind = kind
    return o
  },
  pose(o, s, ctx) {
    const kind = o.userData.kind as Kind
    if (kind === 'payout') {
      const body = o.userData.body as THREE.Group
      const lift = clamp01((s.z1 - s.z0) / L.page.payout)
      body.scale.z = Math.max(0.001, lift)
      body.visible = lift > 0.02
      poseCoins(o, s, ctx)
      return
    }
    rise(o, s, kind === 'cabinet' ? cabinetHeight() : L.page[kind])
    if (kind !== 'arm') return
    const rod = o.userData.rod as THREE.Mesh
    const swing = o.userData.swing as THREE.Group
    swing.rotation.z = (s.v?.[0] ?? 1) < 0 ? Math.PI : 0
    const run = Math.max(1, s.h)
    const climb = L.lever.head - L.lever.foot
    rod.position.set(0, -run / 2, L.lever.foot)
    rod.rotation.x = Math.atan2(climb, run)
    const long = Math.hypot(run, climb)
    rod.scale.y = long
    const ferrule = o.userData.ferrule as THREE.Mesh
    const back = Math.min(L.lever.ferruleAt, long - L.lever.ferrule)
    ferrule.rotation.x = rod.rotation.x
    ferrule.position.set(0, run / 2 - (run / long) * back, L.lever.head - (climb / long) * back)
  }
}

export const slot: PartMaker | null = scaled(plainSlot)

import * as THREE from 'three'
import { hash01 } from '../../core/random'
import { look } from '../../post/look'
import { studio } from '../../post/studio'
import { materials } from '../../shell/materials'
import { outlineOf, profile, sweep, type ProfilePoint } from '../../shell/solids'
import type { Shape } from '../../stage/types'
import { glassPicture, PICTURE } from '../../pages/marketing/real/glass-picture'

type Table = [number, number][]

export interface Pane {
  inset: number
  round: number
  bevel: number
  rise: number
  wash: number
  near: Table
  far: Table
}

// The verify card, read off the approved image edge by edge. `d` is how far in from the outline in page pixels, the number is what the glass's colour is multiplied by.
// Toward the light: a bright hairline on the rim, a dark line under it, the lit bevel, then the edge's own shade seen through the glass, fading into the face.
// Away from the light: the face brightens toward the edge where the light leaves the slab, and the wall below it is in shade.
export const CARD_PANE: Pane = {
  inset: 5.4, round: 1.2, bevel: 7, rise: 2.4, wash: 0.07,
  near: [[0, 0.8], [2.5, 0.84], [4, 1.04], [6.5, 1], [8, 0.87], [13, 0.85], [21, 0.93], [33, 1]],
  far: [[0, 1.16], [3, 1.13], [7, 1.1], [11, 1.07], [19, 1.03], [29, 1]]
}

// The shield: clear glass with a narrow ground edge that shows as one thin bright line all the way round.
export const SHIELD_PANE: Pane = {
  inset: 3, round: 1, bevel: 3, rise: 1.6, wash: 0.05,
  near: [[0, 0.85], [3, 1.08], [5, 0.92], [9, 0.95], [15, 1]],
  far: [[0, 1.15], [3, 1.08], [9, 1.03], [15, 1]]
}

const keyFlat = Math.hypot(look.key.direction[0], look.key.direction[1]) || 1
const KX = look.key.direction[0] / keyFlat
const KY = look.key.direction[1] / keyFlat

const read = (table: Table, d: number): number => {
  if (d <= table[0]![0]) return table[0]![1]
  for (let i = 1; i < table.length; i++) {
    const [d1, v1] = table[i]!
    const [d0, v0] = table[i - 1]!
    if (d <= d1) return v0 + ((v1 - v0) * (d - d0)) / (d1 - d0 || 1)
  }
  return table[table.length - 1]![1]
}

export function edgeTone(P: Pane, d: number, facing: number): number {
  const side = Math.max(-1, Math.min(1, facing / 0.7))
  return side >= 0 ? 1 + side * (read(P.near, d) - 1) : 1 - side * (read(P.far, d) - 1)
}

function face(s: Shape, half: number, P: Pane): THREE.BufferGeometry {
  const foot = half - P.rise
  const top = P.round + P.bevel
  const lowest = Math.min(s.w, s.h) / 2 - P.inset
  const rings: { d: number; z: number }[] = [{ d: 0, z: 0 }, { d: 0, z: foot - P.round }, { d: P.round * 0.3, z: foot - P.round * 0.3 }, { d: P.round, z: foot }]
  for (let i = 1; i <= 6; i++) {
    const t = i / 6
    rings.push({ d: P.round + P.bevel * t, z: foot + P.rise * Math.sin((t * Math.PI) / 2) })
  }
  const last = Math.max(P.near[P.near.length - 1]![0], P.far[P.far.length - 1]![0])
  const reach = Math.min(last, lowest - 1)
  const steps = Math.max(2, Math.round((reach - top) / 2.4))
  for (let i = 1; i <= steps; i++) rings.push({ d: top + ((reach - top) * i) / steps, z: half })
  const outline = outlineOf(s, P.inset, 14)
  const n = outline.count
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const span = Math.hypot(s.w / 2, s.h / 2)
  let wide = 0
  let tall = 0
  for (let i = 0; i < n; i++) {
    wide = Math.max(wide, outline.x[i]!)
    tall = Math.max(tall, outline.y[i]!)
  }
  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, v: number, ux: number, uy: number): void => {
    const wash = 1 - P.wash * ((x * KX + y * KY) / span)
    pos.push(x, y, z)
    nor.push(nx, ny, nz)
    uv.push(ux, uy)
    col.push(v * wash, v * wash, v * wash)
  }
  rings.forEach((ring, r) => {
    const before = rings[Math.max(0, r - 1)]!
    const after = rings[Math.min(rings.length - 1, r + 1)]!
    const run = after.d - before.d
    const up = after.z - before.z
    const l = Math.hypot(run, up) || 1
    const lean = ring.z >= half ? 0 : ring.d <= P.round ? 1 : 0.1
    for (let i = 0; i < n; i++) {
      const ox = outline.nx[i]!
      const oy = outline.ny[i]!
      const side = ox * KX + oy * KY
      const v = r === 0 ? (side > 0 ? 0.95 : 0.7) : edgeTone(P, ring.d, side)
      const out = (up / l) * lean
      const rise = Math.sqrt(Math.max(0, 1 - out * out))
      const x = Math.max(-(wide - ring.d), Math.min(wide - ring.d, outline.x[i]! - ring.d * ox))
      const y = Math.max(-(tall - ring.d), Math.min(tall - ring.d, outline.y[i]! - ring.d * oy))
      const down = Math.max(0, foot - ring.z)
      put(x, y, ring.z, ox * out, oy * out, rise, v, x + ox * down, y + oy * down)
    }
  })
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(r * n + i, r * n + j, (r + 1) * n + i, r * n + j, (r + 1) * n + j, (r + 1) * n + i)
    }
  }
  const end = (rings.length - 1) * n
  put(0, 0, half, 0, 0, 1, 1, 0, 0)
  for (let i = 0; i < n; i++) idx.push(rings.length * n, end + i, end + ((i + 1) % n))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// One pane of glass built round its middle: the upper face with its ground edge and half of the wall, and the same below.
export function paneGeometry(s: Shape, thick: number, P: Pane): THREE.BufferGeometry {
  const upper = face(s, thick / 2, P).toNonIndexed()
  const lower = face(s, thick / 2, P).toNonIndexed().rotateX(Math.PI)
  const g = new THREE.BufferGeometry()
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const a = upper.getAttribute(name).array as Float32Array
    const b = lower.getAttribute(name).array as Float32Array
    const all = new Float32Array(a.length + b.length)
    all.set(a, 0)
    all.set(b, a.length)
    g.setAttribute(name, new THREE.BufferAttribute(all, name === 'uv' ? 2 : 3))
  }
  upper.dispose()
  lower.dispose()
  return g
}

export const RIM = { card: 7.4, shield: 5 }

// The polished edge of a pane: a round bead of the same glass that runs all the way round, stands a little above the face and takes the room's light as one bright line.
export function rimGeometry(s: Shape, thick: number, wide: number, inset: number): THREE.BufferGeometry {
  const half = thick / 2
  const r = wide / 2
  const base = half - r * 0.7
  const points: ProfilePoint[] = [[0, -half, true], [0, base]]
  for (let i = 1; i <= 11; i++) {
    const a = (i / 12) * Math.PI
    points.push([r - r * Math.cos(a), base + (r * 0.7 + 0.5) * Math.sin(a)])
  }
  points.push([wide, half - 0.4, true])
  return sweep(outlineOf(s, inset, 14), profile(points), false)
}

export const CARD_GLASS = { colour: 0x9fb1ae, through: 0.86, perPx: 2.4 }
export const CLEAR_GLASS = { colour: 0x93a099, through: 0.8, up: 0.92 }

let picture: THREE.Texture | null = null

function under(): THREE.Texture {
  if (!picture) {
    picture = glassPicture().clone()
    picture.repeat.set(CARD_GLASS.perPx / PICTURE.size, CARD_GLASS.perPx / PICTURE.size)
    picture.needsUpdate = true
  }
  return picture
}

export interface GlassKit {
  card: THREE.MeshPhysicalMaterial
  clear: THREE.MeshPhysicalMaterial
  rim: THREE.MeshPhysicalMaterial
  crackLight: THREE.MeshPhysicalMaterial
  crackDark: THREE.MeshPhysicalMaterial
  crackSheet: THREE.MeshPhysicalMaterial
}

let kit: GlassKit | null = null

export const clearTone = (): THREE.Color => new THREE.Color().setHex(CLEAR_GLASS.colour, THREE.SRGBColorSpace).multiplyScalar(1 / PICTURE.level)

// Both are blended over what lies behind them, so the page, its grain and its shadows are seen through the glass itself.
export function glassKit(): GlassKit {
  if (kit) return kit
  const grain = materials().ceramic.normalMap
  kit = {
    card: studio(new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(CARD_GLASS.colour, THREE.SRGBColorSpace).multiplyScalar(1 / PICTURE.level), map: under(), roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2,
      specularIntensity: 0.6, vertexColors: true, shadowSide: THREE.BackSide, normalMap: grain, normalScale: new THREE.Vector2(0.02, 0.02), transparent: true, opacity: CARD_GLASS.through
    })),
    clear: studio(new THREE.MeshPhysicalMaterial({
      color: clearTone(), map: under(), roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 0.9, vertexColors: true, shadowSide: THREE.BackSide,
      normalMap: grain, normalScale: new THREE.Vector2(0.012, 0.012), transparent: true, opacity: CLEAR_GLASS.through
    })),
    rim: studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0xb7c4c0, THREE.SRGBColorSpace), roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1 })),
    crackLight: studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.96, 0.99, 0.97), emissive: new THREE.Color(0.22, 0.23, 0.22), roughness: 0.25, metalness: 0, specularIntensity: 1, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false })),
    crackDark: studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.08, 0.1, 0.095), roughness: 0.6, metalness: 0, specularIntensity: 0.2, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false })),
    crackSheet: studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.9, 0.95, 0.93), roughness: 0.2, metalness: 0, specularIntensity: 1, vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }))
  }
  return kit
}

export interface Fracture {
  light: THREE.BufferGeometry
  dark: THREE.BufferGeometry
  sheet: THREE.BufferGeometry
}

// A crack through a pane is a surface inside the glass, not a line on it. Seen from above it is a hairline on the top face that is bright
// on the side the light enters, the same line again on the under face, moved by the depth of the glass, and between the two the broken
// surface itself, which catches the light as a pale sheet. The line is walked in short uneven steps and throws off hairline branches.
export function fracture(lines: [number, number][][], thick: number, seed: number): Fracture {
  const light: number[] = []
  const lightCol: number[] = []
  const dark: number[] = []
  const darkCol: number[] = []
  const sheet: number[] = []
  const sheetCol: number[] = []
  const sheetNor: number[] = []
  const strip = (into: number[], col: number[], a: [number, number], b: [number, number], wa: number, wb: number, z: number, ta: number, tb: number, off: number): void => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / l
    const ny = (b[0] - a[0]) / l
    const ax = a[0] + nx * off
    const ay = a[1] + ny * off
    const bx = b[0] + nx * off
    const by = b[1] + ny * off
    into.push(ax - nx * wa, ay - ny * wa, z, bx - nx * wb, by - ny * wb, z, ax + nx * wa, ay + ny * wa, z, ax + nx * wa, ay + ny * wa, z, bx - nx * wb, by - ny * wb, z, bx + nx * wb, by + ny * wb, z)
    col.push(ta, ta, ta, tb, tb, tb, ta, ta, ta, ta, ta, ta, tb, tb, tb, tb, tb, tb)
  }
  const walk = (line: [number, number][], n: number, wide: number, branches: boolean): void => {
    const pts: [number, number][] = []
    for (let i = 0; i < line.length - 1; i++) {
      const [x0, y0] = line[i]!
      const [x1, y1] = line[i + 1]!
      const l = Math.hypot(x1 - x0, y1 - y0)
      const cuts = Math.max(2, Math.round(l / 7))
      for (let j = i === 0 ? 0 : 1; j <= cuts; j++) {
        const t = j / cuts
        const ends = (i === 0 && j === 0) || (i === line.length - 2 && j === cuts)
        const jig = ends ? 0 : (hash01(n * 97 + i * 13 + j, 1, seed) - 0.5) * 3.2
        pts.push([x0 + (x1 - x0) * t - ((y1 - y0) / l) * jig, y0 + (y1 - y0) * t + ((x1 - x0) / l) * jig])
      }
    }
    const count = pts.length - 1
    const lean = (hash01(n, 7, seed) - 0.5) * 0.9
    const dx = thick * (0.16 + lean * 0.12)
    const dy = -thick * (0.13 - lean * 0.1)
    for (let i = 0; i < count; i++) {
      const a = pts[i]!
      const b = pts[i + 1]!
      const taper = (j: number): number => wide * (0.25 + 0.75 * Math.sin((Math.PI * Math.min(count, j + 0.4)) / (count + 0.8)))
      const bright = (j: number): number => 0.45 + 0.55 * hash01(n * 31 + j, 2, seed)
      strip(light, lightCol, a, b, taper(i), taper(i + 1), thick / 2 + 0.1, bright(i), bright(i + 1), 0)
      strip(dark, darkCol, a, b, taper(i) * 0.9, taper(i + 1) * 0.9, thick / 2 + 0.08, 1, 1, wide * 1.7)
      strip(dark, darkCol, [a[0] + dx, a[1] + dy], [b[0] + dx, b[1] + dy], taper(i) * 1.5, taper(i + 1) * 1.5, -thick / 2 + 0.3, 0.7, 0.7, 0)
      const ka = 0.25 + 0.75 * hash01(n * 53 + (i >> 1), 3, seed)
      const kb = 0.25 + 0.75 * hash01(n * 53 + ((i + 1) >> 1), 3, seed)
      const top = thick / 2 - 0.2
      const low = -thick / 2 + 0.4
      sheet.push(a[0], a[1], top, b[0], b[1], top, a[0] + dx, a[1] + dy, low, b[0], b[1], top, b[0] + dx, b[1] + dy, low, a[0] + dx, a[1] + dy, low)
      sheetCol.push(ka, ka, ka, kb, kb, kb, ka * 0.3, ka * 0.3, ka * 0.3, kb, kb, kb, kb * 0.3, kb * 0.3, kb * 0.3, ka * 0.3, ka * 0.3, ka * 0.3)
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const sx = -(b[1] - a[1]) / l
      const sy = (b[0] - a[0]) / l
      for (let v = 0; v < 6; v++) sheetNor.push(sx * 0.5, sy * 0.5, 0.86)
      if (branches && i > 0 && i < count - 1 && hash01(n * 71 + i, 4, seed) > 0.72) {
        const turn = (hash01(n * 71 + i, 5, seed) > 0.5 ? 1 : -1) * (0.5 + 0.7 * hash01(n * 71 + i, 6, seed))
        const dirx = (b[0] - a[0]) / l
        const diry = (b[1] - a[1]) / l
        const len = 7 + 12 * hash01(n * 71 + i, 8, seed)
        const ex = a[0] + (dirx * Math.cos(turn) - diry * Math.sin(turn)) * len
        const ey = a[1] + (dirx * Math.sin(turn) + diry * Math.cos(turn)) * len
        strip(light, lightCol, a, [ex, ey], wide * 0.5, wide * 0.12, thick / 2 + 0.1, 0.7, 0.3, 0)
      }
    }
  }
  lines.forEach((line, n) => walk(line, n, n === 0 ? 0.42 : 0.3, true))
  const build = (pos: number[], col: number[], nor?: number[]): THREE.BufferGeometry => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    const flat = new Float32Array(pos.length)
    for (let i = 2; i < flat.length; i += 3) flat[i] = 1
    g.setAttribute('normal', nor ? new THREE.Float32BufferAttribute(nor, 3) : new THREE.BufferAttribute(flat, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
    return g
  }
  return { light: build(light, lightCol), dark: build(dark, darkCol), sheet: build(sheet, sheetCol, sheetNor) }
}

import * as THREE from 'three'
import type { GroundMaker, RealContext } from '../../real/types'
import type { Shape, Tone } from '../../stage/types'
import { materials, type Materials } from '../materials'
import { collar, merge, outlineOf, pocketCut, pocketProfile, sweep, translate } from '../solids'

export const SLAB_THICKNESS = 28
const OVERLAP = 0.25
const q = (v: number): number => Math.round(v * 4) / 4

export interface Cut { id: string; kind: string; x: number; y: number; w: number; h: number; r: number; z0: number; role: string; depth: number; lip: number; margin: number }
export interface Opening { x0: number; x1: number; y0: number; y1: number; z: number; tone: Tone }

const inside = (s: Shape, ctx: { width: number; top: number; tall: number }): boolean => s.x >= 0 && s.x + s.w <= ctx.width && s.y >= ctx.top && s.y + s.h <= ctx.top + ctx.tall

// Every pocket the slab is cut for: the shapes of the list that carry `pocket`, each with its depth and its lip.
export function cutsOf(list: Shape[], ctx: { width: number; top: number; tall: number }): Cut[] {
  const out: Cut[] = []
  for (const s of list) {
    if (!s.pocket || s.kind === 'well' || s.kind === 'text' || s.kind === 'ball' || s.rot || !inside(s, ctx)) continue
    const cut = pocketCut(s)
    out.push({ id: s.id, kind: s.kind, x: q(s.x), y: q(s.y), w: q(s.w), h: q(s.h), r: q(s.r ?? 0), z0: q(s.z0), role: s.role ?? '', depth: cut.depth, lip: cut.lip, margin: cut.lip + 1 })
  }
  return out
}

// Every opening of the slab on this frame: the wells of the list, cut to the slab.
export function openingsOf(list: Shape[], ctx: { width: number; top: number; tall: number }): Opening[] {
  const out: Opening[] = []
  for (const s of list) {
    if (s.kind !== 'well') continue
    const x0 = Math.max(0, s.x)
    const x1 = Math.min(ctx.width, s.x + s.w)
    const y0 = Math.max(ctx.top, s.y)
    const y1 = Math.min(ctx.top + ctx.tall, s.y + s.h)
    if (x1 - x0 > 0.5 && y1 - y0 > 0.5 && s.z0 < 0) out.push({ x0, x1, y0, y1, z: s.z0, tone: s.tone })
  }
  return out
}

export const groundKey = (ctx: { page: string; width: number; top: number; tall: number; list: Shape[] }): string =>
  `${ctx.page}|${ctx.width}|${q(ctx.top)}|${q(ctx.tall)}|${cutsOf(ctx.list, ctx).map((c) => `${c.id}:${c.kind}:${c.x},${c.y},${c.w},${c.h},${c.r},${c.z0},${c.role}`).join(';')}`

const TONE_MATERIAL: Record<Tone, keyof Materials> = {
  page: 'ceramic', pocket: 'pocket', raised: 'keycap', metal: 'aluminium', accent: 'orange', danger: 'red', paper: 'paper', dark: 'gap', glass: 'pocket', light: 'enamel', ink: 'ink', inkLight: 'inkOnOrange'
}
const TONES = Object.keys(TONE_MATERIAL) as Tone[]

interface Cell { z: number; tone: Tone; state: 0 | 1 | 2 }

export interface Carved { groups: { tone: Tone; pos: number[]; nor: number[] }[]; deepest: number }

// The flat of the slab and the walls and floors of its openings, as plain numbers in world units.
// The page is cut into a grid along every edge of a pocket's tile and of an opening, so walls and the steps between floors come by themselves.
export function carve(cuts: Cut[], wells: Opening[], width: number, top: number, tall: number): Carved {
  const tiles = cuts.map((c) => ({ x0: c.x - c.margin, x1: c.x + c.w + c.margin, y0: c.y - c.margin, y1: c.y + c.h + c.margin }))
  const xs = [...new Set([0, width, ...tiles.flatMap((t) => [t.x0, t.x1]), ...wells.flatMap((w) => [w.x0, w.x1])])].filter((v) => v >= 0 && v <= width).sort((a, b) => a - b)
  const ys = [...new Set([top, top + tall, ...tiles.flatMap((t) => [t.y0, t.y1]), ...wells.flatMap((w) => [w.y0, w.y1])])].filter((v) => v >= top && v <= top + tall).sort((a, b) => a - b)
  const nx = xs.length - 1
  const ny = ys.length - 1
  const cells: Cell[] = []
  let deepest = 0
  for (let j = 0; j < ny; j++) {
    const cy = (ys[j]! + ys[j + 1]!) / 2
    for (let i = 0; i < nx; i++) {
      const cx = (xs[i]! + xs[i + 1]!) / 2
      const cell: Cell = { z: 0, tone: 'page', state: 0 }
      for (const w of wells) {
        if (cx > w.x0 && cx < w.x1 && cy > w.y0 && cy < w.y1 && w.z < cell.z) {
          cell.z = w.z
          cell.tone = w.tone
          cell.state = 2
        }
      }
      if (cell.state === 0) for (const t of tiles) if (cx > t.x0 && cx < t.x1 && cy > t.y0 && cy < t.y1) cell.state = 1
      deepest = Math.min(deepest, cell.z)
      cells.push(cell)
    }
  }
  const byTone = new Map<Tone, { tone: Tone; pos: number[]; nor: number[] }>()
  const quad = (tone: Tone, a: number[], b: number[], c: number[], d: number[], n: number[]): void => {
    let g = byTone.get(tone)
    if (!g) {
      g = { tone, pos: [], nor: [] }
      byTone.set(tone, g)
    }
    for (const v of [a, b, c, a, c, d]) {
      g.pos.push(v[0]! - 960, 540 - v[1]!, v[2]!)
      g.nor.push(n[0]!, n[1]!, n[2]!)
    }
  }
  const at = (i: number, j: number): Cell | null => (i < 0 || j < 0 || i >= nx || j >= ny ? null : cells[j * nx + i]!)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const c = cells[j * nx + i]!
      const x0 = xs[i]!
      const x1 = xs[i + 1]!
      const y0 = ys[j]!
      const y1 = ys[j + 1]!
      const west = at(i - 1, j)
      const east = at(i + 1, j)
      const north = at(i, j - 1)
      const south = at(i, j + 1)
      if (c.state === 0) {
        // A hair of overlap into a pocket's tile, so no seam can open between the two.
        const l = west?.state === 1 ? OVERLAP : 0
        const r = east?.state === 1 ? OVERLAP : 0
        const u = north?.state === 1 ? OVERLAP : 0
        const d = south?.state === 1 ? OVERLAP : 0
        quad('page', [x0 - l, y1 + d, 0], [x1 + r, y1 + d, 0], [x1 + r, y0 - u, 0], [x0 - l, y0 - u, 0], [0, 0, 1])
      } else if (c.state === 2) quad(c.tone, [x0, y1, c.z], [x1, y1, c.z], [x1, y0, c.z], [x0, y0, c.z], [0, 0, 1])
      const side: Tone = c.z === 0 ? 'page' : c.tone
      if (west && west.z < c.z) quad(side, [x0, y0, west.z], [x0, y1, west.z], [x0, y1, c.z], [x0, y0, c.z], [-1, 0, 0])
      if (east && east.z < c.z) quad(side, [x1, y1, east.z], [x1, y0, east.z], [x1, y0, c.z], [x1, y1, c.z], [1, 0, 0])
      if (north && north.z < c.z) quad(side, [x1, y0, north.z], [x0, y0, north.z], [x0, y0, c.z], [x1, y0, c.z], [0, 1, 0])
      if (south && south.z < c.z) quad(side, [x0, y1, south.z], [x1, y1, south.z], [x1, y1, c.z], [x0, y1, c.z], [0, -1, 0])
    }
  }
  return { groups: [...byTone.values()], deepest }
}

interface Kept { cuts: Cut[]; width: number; top: number; tall: number; sign: string; flat: THREE.Mesh; edge: THREE.Mesh; backing: THREE.Mesh; capacity: number }

function fill(mesh: THREE.Mesh, kept: Kept, carved: Carved): void {
  let count = 0
  for (const g of carved.groups) count += g.pos.length / 3
  let geometry = mesh.geometry
  if (count > kept.capacity) {
    geometry.dispose()
    kept.capacity = Math.ceil(count * 1.5)
    geometry = new THREE.BufferGeometry()
    for (const [name, size] of [['position', 3], ['normal', 3], ['uv', 2]] as const) {
      const attribute = new THREE.BufferAttribute(new Float32Array(kept.capacity * size), size)
      attribute.setUsage(THREE.DynamicDrawUsage)
      geometry.setAttribute(name, attribute)
    }
    mesh.geometry = geometry
  }
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute
  const nor = geometry.getAttribute('normal') as THREE.BufferAttribute
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute
  geometry.clearGroups()
  let k = 0
  for (const g of carved.groups) {
    const n = g.pos.length / 3
    ;(pos.array as Float32Array).set(g.pos, k * 3)
    ;(nor.array as Float32Array).set(g.nor, k * 3)
    for (let i = 0; i < n; i++) {
      const z = g.pos[i * 3 + 2]!
      uv.setXY(k + i, g.pos[i * 3]! + z * 0.7, g.pos[i * 3 + 1]! + z * 0.7)
    }
    geometry.addGroup(k, n, TONES.indexOf(g.tone))
    k += n
  }
  geometry.setDrawRange(0, k)
  pos.needsUpdate = true
  nor.needsUpdate = true
  uv.needsUpdate = true
}

function edgeGeometry(width: number, top: number, tall: number): THREE.BufferGeometry {
  const x0 = -960
  const x1 = width - 960
  const y0 = 540 - top
  const y1 = 540 - top - tall
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const wall = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number): void => {
    for (const [x, y, z] of [[ax, ay, -1], [bx, by, -1], [bx, by, 0], [ax, ay, -1], [bx, by, 0], [ax, ay, 0]] as const) {
      pos.push(x, y, z)
      nor.push(nx, ny, 0)
      uv.push(x + y, z * 28)
    }
  }
  wall(x0, y1, x1, y1, 0, -1)
  wall(x1, y1, x1, y0, 1, 0)
  wall(x1, y0, x0, y0, 0, 1)
  wall(x0, y0, x0, y1, -1, 0)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

let backingMaterial: THREE.MeshBasicMaterial | null = null

export const ground: GroundMaker = {
  key: (ctx) => groundKey(ctx),
  make(ctx: RealContext): THREE.Object3D {
    const m = materials()
    const cuts = cutsOf(ctx.list, ctx)
    const root = new THREE.Group()
    const walls: THREE.BufferGeometry[] = []
    const floors: THREE.BufferGeometry[] = []
    for (const c of cuts) {
      const cx = c.x + c.w / 2 - 960
      const cy = 540 - (c.y + c.h / 2)
      const r = Math.max(0.6, c.r)
      const outline = outlineOf({ kind: c.kind, w: c.w, h: c.h, r }, 0, 12)
      const lipped = outlineOf({ kind: c.kind, w: c.w + c.lip * 2, h: c.h + c.lip * 2, r: r + c.lip }, 0, 12)
      walls.push(translate(collar(c.w / 2 + c.margin, c.h / 2 + c.margin, lipped), cx, cy))
      walls.push(translate(sweep(outline, pocketProfile(c.depth, c.lip, 4), false), cx, cy))
      floors.push(translate(sweep(outline, [{ inset: 0, z: -c.depth, out: 0, up: 1 }]), cx, cy))
    }
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[]): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      root.add(mesh)
      return mesh
    }
    if (walls.length) {
      add(merge(walls), m.ceramic)
      add(merge(floors), m.pocket)
    }
    const flat = add(new THREE.BufferGeometry(), TONES.map((t) => m[TONE_MATERIAL[t]] as THREE.Material))
    const edge = add(edgeGeometry(ctx.width, ctx.top, ctx.tall), m.ceramic)
    backingMaterial ??= new THREE.MeshBasicMaterial({ color: new THREE.Color(0.016, 0.016, 0.018), side: THREE.DoubleSide })
    const backing = add(new THREE.PlaneGeometry(ctx.width, ctx.tall), backingMaterial)
    backing.castShadow = false
    backing.receiveShadow = false
    backing.position.set(ctx.width / 2 - 960, 540 - ctx.top - ctx.tall / 2, -SLAB_THICKNESS)
    const kept: Kept = { cuts, width: ctx.width, top: ctx.top, tall: ctx.tall, sign: '?', flat, edge, backing, capacity: 0 }
    root.userData.ground = kept
    return root
  },
  pose(o: THREE.Object3D, ctx: RealContext): void {
    const kept = o.userData.ground as Kept
    const wells = openingsOf(ctx.list, kept)
    const sign = wells.map((w) => `${w.x0},${w.x1},${w.y0},${w.y1},${w.z},${w.tone}`).join(';')
    if (sign === kept.sign) return
    kept.sign = sign
    const carved = carve(kept.cuts, wells, kept.width, kept.top, kept.tall)
    fill(kept.flat, kept, carved)
    const thick = Math.max(SLAB_THICKNESS, -carved.deepest + 10)
    kept.edge.scale.z = thick
    kept.backing.position.z = -thick
  },
  drop(o: THREE.Object3D): void {
    o.traverse((c) => {
      const mesh = c as THREE.Mesh
      if (mesh.isMesh) mesh.geometry.dispose()
    })
  }
}

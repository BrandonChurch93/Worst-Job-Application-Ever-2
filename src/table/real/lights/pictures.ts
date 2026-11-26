import * as THREE from 'three'
import { BALL, COLS, table } from '../../layout'
import { localBalls, type Zone } from '../zone'
import { CHANNELS, LAMP, groupsOf, type Group, type Source } from './groups'

// The light pictures of a zone: how much light of each group arrives at each place of the zone's floor, seen from straight above.
// Three textures of four channels: the groups, how far the general lighting leans from straight above (in the last group channel, which the flash leaves free), and the side it comes from.
export interface Pictures {
  width: number
  height: number
  // CHANNELS + 2 planes of width * height, row 0 at the foot of the zone.
  planes: Float32Array[]
  textures: THREE.DataTexture[]
}

export const TEXEL = 6
// The body of every lamp, as the renderer's true lights have it, so a lamp may change from a picture to a true light and back unseen.
export const BODY = 20
export const LEAN = CHANNELS - 1
const SLING_TOP = 0.22
export const CORE = { level: 80, radius: 13, light: 2.6 }

interface Blocker { kind: 0 | 1 | 2; id: string; a: number; b: number; c: number; d: number; h: number }

// What stands in a lamp's way, in the zone's frame: boxes (min x, min y, max x, max y), walls (a to b) and discs (centre, radius), each with its height.
export function blockersOf(z: Zone): Blocker[] {
  const out: Blocker[] = []
  if (z.tier < 0) return out
  const k = z.tier
  const box = (id: string, u: number, v: number, w: number, h: number, tall: number): void => {
    const p = localBalls(z, u, v)
    out.push({ kind: 0, id, a: p[0], b: p[1] - h * BALL, c: p[0] + w * BALL, d: p[1], h: tall })
  }
  for (const m of table.models) {
    if (m.tier !== k || m.base) continue
    // The garage is a spiral of open decks round a core: only the core stands in a lamp's way.
    if (m.part === 'model-garage') {
      const p = localBalls(z, m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2)
      out.push({ kind: 2, id: m.id, a: p[0], b: p[1], c: m.box[2] * BALL * 0.15, d: 0, h: m.h * BALL })
      continue
    }
    box(m.id, m.box[0], m.box[1], m.box[2], m.box[3], m.h * BALL)
  }
  const top = z.top / BALL
  const tall = z.height / BALL
  box('rail.left', 0, top, COLS.liftA, tall, -z.floor)
  box('rail.right', COLS.launchB, top, 20 - COLS.launchB, tall, -z.floor)
  box('wall.lift', COLS.liftB, top, COLS.left - COLS.liftB, tall, 60)
  box('wall.launch', COLS.right, top, COLS.launchA - COLS.right, tall, 60)
  for (const s of table.segs) {
    if (s.tier !== k || s.kind === 'rubber') continue
    const a = localBalls(z, s.a[0], s.a[1])
    const b = localBalls(z, s.b[0], s.b[1])
    out.push({ kind: 1, id: `seg.${s.id}`, a: a[0], b: a[1], c: b[0], d: b[1], h: s.kind === 'guide' ? 40 : 56 })
  }
  for (const s of table.slings) {
    if (s.tier !== k) continue
    const pts = [s.a, s.b, s.c].map((p) => localBalls(z, p[0], p[1]))
    for (let i = 0; i < 3; i++) out.push({ kind: 1, id: `sling.${s.id}`, a: pts[i]![0], b: pts[i]![1], c: pts[(i + 1) % 3]![0], d: pts[(i + 1) % 3]![1], h: 44 })
  }
  for (const b of table.bumpers) {
    if (b.tier !== k) continue
    const p = localBalls(z, b.c[0], b.c[1])
    out.push({ kind: 2, id: `bumper.${b.id}`, a: p[0], b: p[1], c: b.r * BALL, d: 0, h: 80 })
  }
  for (const p of table.posts) {
    if (p.tier !== k) continue
    const q = localBalls(z, p.c[0], p.c[1])
    out.push({ kind: 2, id: `post.${p.id}`, a: q[0], b: q[1], c: p.r * BALL, d: 0, h: p.lamp ? 30 : 52 })
  }
  return out
}

// True when the straight way from a lamp at (sx, sy, sz) to the floor at (x, y) passes through the thing.
function blocks(o: Blocker, sx: number, sy: number, sz: number, x: number, y: number): boolean {
  const dx = x - sx
  const dy = y - sy
  let out = 1
  if (o.kind === 0) {
    let t0 = 0
    let t1 = 1
    if (Math.abs(dx) < 1e-9) {
      if (sx < o.a || sx > o.c) return false
    } else {
      const u = (o.a - sx) / dx
      const v = (o.c - sx) / dx
      t0 = Math.max(t0, Math.min(u, v))
      t1 = Math.min(t1, Math.max(u, v))
    }
    if (Math.abs(dy) < 1e-9) {
      if (sy < o.b || sy > o.d) return false
    } else {
      const u = (o.b - sy) / dy
      const v = (o.d - sy) / dy
      t0 = Math.max(t0, Math.min(u, v))
      t1 = Math.min(t1, Math.max(u, v))
    }
    if (t1 <= t0) return false
    out = t1
  } else if (o.kind === 1) {
    const ex = o.c - o.a
    const ey = o.d - o.b
    const den = dx * ey - dy * ex
    if (Math.abs(den) < 1e-9) return false
    const t = ((o.a - sx) * ey - (o.b - sy) * ex) / den
    const u = ((o.a - sx) * dy - (o.b - sy) * dx) / den
    if (t <= 0 || t >= 1 || u < 0 || u > 1) return false
    out = t
  } else {
    const fx = sx - o.a
    const fy = sy - o.b
    const A = dx * dx + dy * dy
    const B = 2 * (fx * dx + fy * dy)
    const Cc = fx * fx + fy * fy - o.c * o.c
    const disc = B * B - 4 * A * Cc
    if (disc <= 0 || A < 1e-9) return false
    const r = Math.sqrt(disc)
    const t0 = (-B - r) / (2 * A)
    const t1 = (-B + r) / (2 * A)
    if (t1 <= 0 || t0 >= 1) return false
    out = Math.min(1, t1)
  }
  return sz * (1 - out) < o.h
}

// The fall of a lamp's light with distance, the same law the renderer's true lights keep.
export function fall(d2: number, reach: number): number {
  const q = d2 / (reach * reach)
  if (q >= 1) return 0
  const w = 1 - q * q
  return (w * w * (100 * 100 + BODY * BODY)) / (d2 + BODY * BODY)
}

function blur(p: Float32Array, w: number, h: number): void {
  const t = new Float32Array(p.length)
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) t[j * w + i] = (p[j * w + Math.max(0, i - 1)]! + 2 * p[j * w + i]! + p[j * w + Math.min(w - 1, i + 1)]!) / 4
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p[j * w + i] = (t[Math.max(0, j - 1) * w + i]! + 2 * t[j * w + i]! + t[Math.min(h - 1, j + 1) * w + i]!) / 4
  }
}

function addSource(z: Zone, s: Source, plane: Float32Array, dir: Float32Array[] | null, w: number, h: number, all: Blocker[]): void {
  const x0 = Math.max(0, Math.floor((s.x - s.reach + 960) / TEXEL))
  const x1 = Math.min(w - 1, Math.ceil((s.x + s.reach + 960) / TEXEL))
  const y0 = Math.max(0, Math.floor((s.y - s.reach + z.height / 2) / TEXEL))
  const y1 = Math.min(h - 1, Math.ceil((s.y + s.reach + z.height / 2) / TEXEL))
  const near = all.filter((o) => {
    if (o.id === s.on) return false
    const cx = o.kind === 2 ? o.a : (o.a + o.c) / 2
    const cy = o.kind === 2 ? o.b : (o.b + o.d) / 2
    const r = o.kind === 2 ? o.c : Math.hypot(o.c - o.a, o.d - o.b) / 2
    return Math.hypot(cx - s.x, cy - s.y) < s.reach + r
  })
  const soft = Math.min(14, s.z * 0.5 + 4)
  // A sling's lamp stands under its plastic: the top of the plastic takes a little of it, the floor round its foot the most.
  const own = s.on !== undefined && s.on.startsWith('sling.') ? table.slings.find((q) => `sling.${q.id}` === s.on) : undefined
  const tri = own ? [own.a, own.b, own.c].map((q) => localBalls(z, q[0], q[1])) : null
  const under = (x: number, y: number): boolean => {
    if (!tri) return false
    let pos = 0
    let neg = 0
    for (let n = 0; n < 3; n++) {
      const a = tri[n]!
      const b = tri[(n + 1) % 3]!
      const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
      if (c > 0) pos++
      else neg++
    }
    return pos === 0 || neg === 0
  }
  for (let j = y0; j <= y1; j++) {
    const y = (j + 0.5) * TEXEL - z.height / 2
    for (let i = x0; i <= x1; i++) {
      const x = (i + 0.5) * TEXEL - 960
      const dx = s.x - x
      const dy = s.y - y
      const flat = dx * dx + dy * dy
      const f = fall(flat + s.z * s.z, s.reach) * s.power * (under(x, y) ? SLING_TOP : 1)
      if (f <= 0) continue
      const len = Math.sqrt(flat) || 1
      const nx = (-dy / len) * soft
      const ny = (dx / len) * soft
      let open = 0
      for (let n = -1; n <= 1; n++) {
        const sx = s.x + nx * n
        const sy = s.y + ny * n
        let hit = false
        for (const o of near) {
          if (blocks(o, sx, sy, s.z, x, y)) {
            hit = true
            break
          }
        }
        if (!hit) open++
      }
      if (open === 0) continue
      const v = (f * open) / 3
      plane[j * w + i]! += v
      if (dir) {
        const d = Math.sqrt(flat + s.z * s.z)
        dir[0]![j * w + i]! += (v * dx) / d
        dir[1]![j * w + i]! += (v * dy) / d
        dir[2]![j * w + i]! += (v * len) / d
        dir[3]![j * w + i]! += v
      }
    }
  }
}

// The lamp itself, a small disc written into the texture of its group below zero, where no light is: what the lacquer mirrors of it. The planes keep the light alone.
function addCore(z: Zone, s: Source, plane: Float32Array, w: number, h: number): void {
  const i0 = Math.floor((s.x + 960) / TEXEL)
  const j0 = Math.floor((s.y + z.height / 2) / TEXEL)
  for (let j = Math.max(0, j0 - 3); j <= Math.min(h - 1, j0 + 3); j++) {
    for (let i = Math.max(0, i0 - 3); i <= Math.min(w - 1, i0 + 3); i++) {
      const d = Math.hypot((i + 0.5) * TEXEL - 960 - s.x, (j + 0.5) * TEXEL - z.height / 2 - s.y)
      plane[j * w + i]! += CORE.level * Math.max(0, 1 - d / CORE.radius)
    }
  }
}

const made = new Map<string, Pictures>()

export function picturesOf(z: Zone): Pictures {
  const have = made.get(z.id)
  if (have) return have
  const w = Math.round(1920 / TEXEL)
  const h = Math.max(1, Math.round(z.height / TEXEL))
  const groups: Group[] = groupsOf(z)
  const planes: Float32Array[] = []
  for (let c = 0; c < CHANNELS + 2; c++) planes.push(new Float32Array(w * h))
  const dir = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)]
  const all = blockersOf(z)
  const cores = new Map<number, Float32Array>()
  for (const g of groups) {
    const plane = planes[g.index]!
    if (g.name === 'flash') continue
    if (g.index === LEAN) throw new Error(`The last channel of "${z.id}" is kept for the lean of the light and "${g.id}" is in it`)
    for (const s of g.sources) addSource(z, s, plane, g.mode === 2 ? dir : null, w, h, all)
    blur(plane, w, h)
    if (g.mode === 2) {
      const core = new Float32Array(w * h)
      for (const s of g.sources) if (s.z === LAMP.z) addCore(z, s, core, w, h)
      cores.set(g.index, core)
    }
  }
  for (const d of dir) blur(d, w, h)
  for (let i = 0; i < w * h; i++) {
    const sum = dir[3]![i]!
    planes[LEAN]![i] = sum > 1e-9 ? dir[2]![i]! / sum : 0
    planes[CHANNELS]![i] = sum > 1e-9 ? dir[0]![i]! / sum : 0
    planes[CHANNELS + 1]![i] = sum > 1e-9 ? dir[1]![i]! / sum : 0
  }
  const textures: THREE.DataTexture[] = []
  for (let t = 0; t < 3; t++) {
    const data = new Uint16Array(w * h * 4)
    for (let c = 0; c < 4; c++) {
      const core = cores.get(t * 4 + c)
      for (let i = 0; i < w * h; i++) data[i * 4 + c] = THREE.DataUtils.toHalfFloat(core && core[i]! > 0 ? -core[i]! : Math.max(-60000, Math.min(60000, planes[t * 4 + c]![i]!)))
    }
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType)
    tex.name = `table-lights.${z.id}.${t}`
    tex.colorSpace = THREE.NoColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.generateMipmaps = false
    tex.needsUpdate = true
    textures.push(tex)
  }
  const p = { width: w, height: h, planes, textures }
  made.set(z.id, p)
  return p
}

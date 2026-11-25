import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { table, type Sling } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { hex, Kit, matsOf, meshOf, shade, SURF, type V2, type V3 } from './kit'

const C = {
  red: hex(0xa30d1b),
  plate: hex(0x6e0c16),
  steel: hex(0xb4b8bc),
  chrome: hex(0xd6d9dc),
  rubber: hex(0x222223),
  staple: hex(0xc9ccd0),
  dark: hex(0x2c2d30)
}

// The shoulders of the sling posts, from the owner of the hardware: 46 px over the floor, and the plate keeps within the post triangle plus 6 px so the rubber band shows under it.
export const PLATE = { z: 46, thick: 4, round: 7 }
const OPEN = 0.2
const MAG = 0.05
const PIN = { x: 9, z: 12 }
const BACK: V3 = [0.784, 0.133, 0.083]
const FRONT: V3 = [0.072, 0.111, 0.817]

interface Frame { a: V2; b: V2; c: V2; s: V2; e: V2; length: number; turn: number }

function frameOf(z: Zone, g: Sling): Frame {
  const p = (q: [number, number]): V2 => {
    const l = localBalls(z, q[0], q[1])
    return [l[0], l[1]]
  }
  const a = p(g.a)
  const b = p(g.b)
  const c = p(g.c)
  const w = (k: V3): V2 => [a[0] * k[0] + b[0] * k[1] + c[0] * k[2], a[1] * k[0] + b[1] * k[1] + c[1] * k[2]]
  const s = w(BACK)
  const e = w(FRONT)
  return { a, b, c, s, e, length: Math.hypot(e[0] - s[0], e[1] - s[1]), turn: Math.atan2(e[1] - s[1], e[0] - s[0]) }
}

const slingsOf = (z: Zone): Sling[] => table.slings.filter((s) => s.tier === z.tier)

function plateOutline(f: Frame): V2[] {
  const pts = [f.a, f.b, f.c]
  let area = 0
  for (let i = 0; i < 3; i++) area += pts[i]![0] * pts[(i + 1) % 3]![1] - pts[(i + 1) % 3]![0] * pts[i]![1]
  const order = area > 0 ? pts : [pts[0]!, pts[2]!, pts[1]!]
  const out: V2[] = []
  for (let i = 0; i < 3; i++) {
    const prev = order[(i + 2) % 3]!
    const cur = order[i]!
    const next = order[(i + 1) % 3]!
    const n0 = Math.atan2(-(cur[0] - prev[0]), cur[1] - prev[1])
    let n1 = Math.atan2(-(next[0] - cur[0]), next[1] - cur[1])
    while (n1 < n0) n1 += Math.PI * 2
    const steps = 6
    for (let k = 0; k <= steps; k++) {
      const ang = n0 + ((n1 - n0) * k) / steps
      out.push([cur[0] + Math.cos(ang) * PLATE.round, cur[1] + Math.sin(ang) * PLATE.round])
    }
  }
  return out
}

const taper = (f: Frame, x: number): number => 14.5 - (2.5 * Math.max(0, Math.min(f.length, x))) / f.length

function body(k: Kit, f: Frame): void {
  const L = f.length
  const strip = (x0: number, x1: number, grow: number): V2[] => {
    const out: V2[] = []
    const n = 8
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n
      out.push([x, -(taper(f, x) + grow)])
    }
    for (let i = n; i >= 0; i--) {
      const x = x0 + ((x1 - x0) * i) / n
      out.push([x, taper(f, x) + grow])
    }
    return out
  }
  k.poly(strip(3, L - 3, -2.2), 0, 1.6, C.rubber, SURF.rubber, 0.3)
  k.poly(strip(0, L, 0), 1.4, 3, C.steel, SURF.brushed, 0.9)
  k.poly(strip(18, L - 30, -5), 4.2, 0.9, shade(C.steel, 0.94), SURF.brushed, 0.5)
  k.box(L - 15, 0, 4.2, 20, 17, 1.2, C.chrome, SURF.chrome, 0.4)
  for (const y of [-3.2, 3.2]) k.box(L - 14, y, 5.3, 9, 2.4, 0.25, C.dark, SURF.steel, 0)
  k.cyl(L - 24.5, 0, 5.3, 1.6, 0.6, shade(C.chrome, 0.8), SURF.steel, 8, 0.3)
  for (const s of [-1, 1]) {
    const y = s * (taper(f, PIN.x) - 0.2)
    k.poly([[0.5, y - 1.1], [19, y - 1.1], [19, y + 1.1], [0.5, y + 1.1]], 3.6, 12.6, C.steel, SURF.brushed, 0.7)
    k.at(PIN.x, y + s * 1.1, PIN.z, 0, s * -Math.PI * 0.5)
    k.cyl(0, 0, 0, 3.4, 1.6, C.chrome, SURF.chrome, 12, 0.7)
    k.back()
  }
  k.at(PIN.x, 0, PIN.z, 0, 0, -MAG)
  const ml = L - PIN.x - 14
  k.box(ml / 2 - 2, 0, -6.8, ml, 15.4, 1.6, C.chrome, SURF.chrome, 0.4)
  for (const s of [-1, 1]) k.box(ml / 2 - 2, s * 7, -5.4, ml, 1.5, 6.4, C.chrome, SURF.chrome, 0.4)
  k.box(ml - 3.4, 0, -5.4, 1.6, 12.6, 5.4, C.chrome, SURF.chrome, 0.3)
  const row = ml * 0.62
  const x0 = ml - 5.4 - row
  const n = Math.floor(row / 1.5)
  for (let i = 0; i < n; i++) k.box(x0 + i * 1.5 + 0.75, 0, -5.2, 1.05, 11, i % 2 ? 4.4 : 4.15, i % 3 ? C.staple : shade(C.staple, 0.82), SURF.steel, 0)
  k.box(x0 - 4.5, 0, -5.2, 8, 11.4, 4.8, C.dark, SURF.plastic, 0.6)
  k.tube([[4, 0, -2.8], [x0 - 8.5, 0, -2.8]], 1.1, shade(C.steel, 0.8), SURF.steel, 5)
  k.back()
}

function arm(k: Kit, f: Frame): void {
  const L = f.length - PIN.x
  const section = (x: number, grow: number, wide: number, tall: number, skirt: number): V3[] => {
    const w = (taper(f, x + PIN.x) - 2.2) * wide * grow
    const h = (7.5 + (4.5 * Math.max(0, x)) / L) * tall * grow
    const out: V3[] = [[x, -w, -skirt]]
    const n = 12
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI
      const cs = Math.cos(a)
      out.push([x, -w * Math.sign(cs) * Math.pow(Math.abs(cs), 0.45), 1 + h * Math.pow(Math.sin(a), 0.62)])
    }
    out.push([x, w, -skirt])
    return out
  }
  const xs: [number, number][] = [[-9.5, 0.5], [-8.6, 0.74], [-6.5, 0.92], [-3, 1], [L * 0.2, 1], [L * 0.45, 1], [L * 0.7, 1], [L - 12, 1], [L - 5, 0.97], [L - 1, 0.86], [L + 1.2, 0.66], [L + 2, 0.42]]
  k.loft(xs.map(([x, g]) => section(x, g, 1, 1, 5 * g)), C.red, SURF.enamel)
  const rib = (x: number, g: number): V3[] => {
    const h = 1 + 7.5 + (4.5 * Math.max(0, x)) / L
    const w = 4.2 * g
    return [[x, -w, h - 1.2], [x, -w * 0.8, h + 0.9 * g], [x, -w * 0.3, h + 1.5 * g], [x, w * 0.3, h + 1.5 * g], [x, w * 0.8, h + 0.9 * g], [x, w, h - 1.2]]
  }
  k.loft([[6, 0.3], [10, 0.8], [16, 1], [L * 0.5, 1], [L - 34, 1], [L - 27, 0.8], [L - 23, 0.3]].map(([x, g]) => rib(x!, g!)), shade(C.red, 1.04), SURF.enamel)
  k.box(L - 12, 0, 12.6, 15, 12, 1.1, shade(C.red, 0.9), SURF.plastic, 0.5)
  k.box(L - 9, 0, -6.2, 5, 9, 2.4, C.chrome, SURF.chrome, 0.3)
}

interface Built { arms: { mesh: THREE.Mesh; ids: string[]; turn: number }[] }
const built = new WeakMap<THREE.Object3D, Built>()

export function staplerScrews(z: Zone): [number, number, number][] {
  const out: [number, number, number][] = []
  for (const g of slingsOf(z)) {
    const f = frameOf(z, g)
    for (const q of [f.a, f.b, f.c]) out.push([q[0], q[1], PLATE.z + PLATE.thick])
  }
  return out
}

export function buildStaplers(z: Zone): THREE.Object3D {
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.staplers'
  const k = new Kit()
  const arms: Built['arms'] = []
  for (const g of slingsOf(z)) {
    const f = frameOf(z, g)
    k.poly(plateOutline(f), PLATE.z, PLATE.thick, C.plate, SURF.satin, 1.3, shade(C.plate, 1.08))
    for (const q of [f.a, f.b, f.c]) k.cyl(q[0], q[1], PLATE.z + PLATE.thick, 5.6, 0.7, C.steel, SURF.steel, 12, 0.25)
    k.at(f.s[0], f.s[1], PLATE.z + PLATE.thick, f.turn)
    body(k, f)
    k.back()
    const a = new Kit()
    arm(a, f)
    const mesh = meshOf(a.done(), mats.solid, `office.stapler.arm.${g.side}`, { cast: true })
    mesh.rotation.order = 'ZYX'
    mesh.position.set(f.s[0] + Math.cos(f.turn) * PIN.x, f.s[1] + Math.sin(f.turn) * PIN.x, PLATE.z + PLATE.thick + PIN.z)
    mesh.rotation.set(0, -OPEN, f.turn)
    root.add(mesh)
    arms.push({ mesh, ids: [1, 2, 3].map((n) => `sling.${g.id}.${n}`), turn: f.turn })
  }
  root.add(meshOf(k.done(), mats.solid, 'office.staplers.base', { cast: true }))
  built.set(root, { arms })
  return root
}

// How far open the top arm is, 0 shut to 1 at rest, from the seconds since its slingshot was struck: down in three hundredths of a second, back in a quarter with one small overshoot.
export function openAt(since: number): number {
  if (since < 0) return 1
  if (since < 0.03) return 1 - since / 0.03
  const u = (since - 0.03) / 0.25
  if (u >= 1.6) return 1
  return 1 - Math.exp(-5.2 * u) * Math.cos(u * Math.PI * 1.5)
}

export function poseStaplers(o: THREE.Object3D, _z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  for (const a of b.arms) {
    let since = 9
    for (const id of a.ids) since = Math.min(since, ctx.byId.get(id)?.v?.[0] ?? 9)
    a.mesh.rotation.set(0, -OPEN * openAt(since), a.turn)
  }
}

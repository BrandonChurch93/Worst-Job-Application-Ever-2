import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, roundedLoop, type RGB, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, mix, moved, place, poseGlow, screw, shade, signBoard, textAt, washer } from './mats'

const SEED = 20261125
const SAND = hex(0xf0dcae)
const GLASS: RGB = [0.3, 0.42, 0.42]
const EDGE: RGB = [2.3, 2.6, 2.6]
const STRIPE: { pale: RGB; blue: RGB } = { pale: [0.93, 0.9, 0.82], blue: [0.1, 0.3, 0.62] }
export const CASE = { base: 7, wall: 5, lid: 5, sun: 0.17, sky: 0.5, lamp: 0.9 }

const both = (g: Geo, pts: V3[], n: V3, along: V3, col: RGB, under: RGB = shade(col, 0.72)): void => {
  g.face(pts, n, along, col)
  g.face(pts, [-n[0], -n[1], -n[2]], along, under)
}

export function buildBeach(z: Zone, ctx: RealContext): THREE.Object3D {
  const m = table.models.find((x) => x.id === 'corporate.beach')
  if (!m) throw new Error('No beach in the layout')
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const G = new Geo()
  const C = new Geo()
  const rnd = new Random(SEED, 'beach')
  const a = localBalls(z, m.box[0], m.box[1] + m.box[3])
  const b = localBalls(z, m.box[0] + m.box[2], m.box[1])
  const cx = (a[0] + b[0]) / 2
  const cy = (a[1] + b[1]) / 2
  const hw = (b[0] - a[0]) / 2
  const hd = (b[1] - a[1]) / 2
  const H = m.h * 96
  const iw = hw - CASE.wall - 1.5
  const id = hd - CASE.wall - 1.5
  const lid0 = H - CASE.lid
  const shore = id * 0.16
  const ground = (x: number, y: number): number => {
    const dune = 5.5 * Math.exp(-((x + iw * 0.55) ** 2 + (y + id * 0.1) ** 2) / 2600) + 3 * Math.exp(-((x - iw * 0.5) ** 2 + (y + id * 0.5) ** 2) / 1800)
    const ripple = 0.6 * Math.sin(y * 0.46 + Math.sin(x * 0.05) * 2.2) + 0.25 * Math.sin(x * 0.13 + y * 0.21)
    const fall = Math.max(0, (y - shore + 26) / 26)
    return CASE.base + 5 + dune + ripple * (1 - Math.min(1, fall)) - fall * fall * 4.2
  }
  const sea = CASE.base + 2.6

  moved(S, place(cx, cy, 0), () => {
    // The plinth the case stands in: brushed steel with a brass line.
    fin(S, FINISH.brushed, () => {
      S.slab(roundedLoop(-hw + 0.3, hw - 0.3, -hd + 0.3, hd - 0.3, 5, 3), 0, CASE.base, TONE.steelDark, { bevel: 1.2 })
      S.slab(roundedLoop(-hw + 2, hw - 2, -hd + 2, hd - 2, 4, 3), CASE.base, CASE.base + 0.8, TONE.steel, { bevel: 0.4 })
    })
    fin(S, FINISH.polished, () => {
      S.box(-hw + 0.5, hw - 0.5, -hd, -hd + 0.4, 2.4, 3.6, TONE.gold)
      S.box(-hw, -hw + 0.4, -hd + 0.4, hd - 0.4, 2.4, 3.6, TONE.gold)
      S.box(hw - 0.4, hw, -hd + 0.4, hd - 0.4, 2.4, 3.6, TONE.gold)
    })
    // The lid's four screws.
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        washer(S, sx * (hw - 9), sy * (hd - 9), H, 4.6, TONE.brass)
        screw(S, sx * (hw - 9), sy * (hd - 9), H + 0.55, 3, TONE.gold)
        fin(S, FINISH.polished, () => S.lathe([[1.5, 0], [1.5, CASE.lid + 4]], sx * (hw - 9), sy * (hd - 9), 6, TONE.brassDark, lid0 - 4))
      }
    }
  })

  moved(C, place(cx, cy, 0), () => {
    // Four walls and a lid of clear glass, sealed: the faces are clear, every edge is polished and bright.
    fin(C, FINISH.stone, () => {
      C.box(-hw + 1, hw - 1, -hd + 1, -hd + 1 + CASE.wall, CASE.base, lid0, GLASS)
      C.box(-hw + 1, hw - 1, hd - 1 - CASE.wall, hd - 1, CASE.base, lid0, GLASS)
      C.box(-hw + 1, -hw + 1 + CASE.wall, -hd + 1 + CASE.wall, hd - 1 - CASE.wall, CASE.base, lid0, GLASS)
      C.box(hw - 1 - CASE.wall, hw - 1, -hd + 1 + CASE.wall, hd - 1 - CASE.wall, CASE.base, lid0, GLASS)
      C.slab(roundedLoop(-hw, hw, -hd, hd, 4, 3), lid0, H, GLASS, { bottom: true })
    }, 2 * 0.045)
    fin(C, FINISH.stone, () => {
      const e = 1.5
      const edge = (x0: number, x1: number, y0: number, y1: number, zz: number): void => {
        C.face([[x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz]], [0, 0, 1], [1, 0, 0], EDGE)
      }
      for (const [d, zz] of [[0, H + 0.1], [CASE.wall + 1, H + 0.05]] as V2[]) {
        edge(-hw + d, hw - d, -hd + d, -hd + d + e, zz)
        edge(-hw + d, hw - d, hd - d - e, hd - d, zz)
        edge(-hw + d, -hw + d + e, -hd + d + e, hd - d - e, zz)
        edge(hw - d - e, hw - d, -hd + d + e, hd - d - e, zz)
      }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) C.box(sx * (hw - 1) - 0.8, sx * (hw - 1) + 0.8, sy * (hd - 1) - 0.8, sy * (hd - 1) + 0.8, CASE.base, lid0, EDGE)
    }, 2 * 0.7)
    // What the lid mirrors: two soft streaks of the room's light across it.
    fin(C, FINISH.stone, () => {
      for (const [x, w] of [[-hw * 0.62, 16], [-hw * 0.4, 5], [hw * 0.2, 9]] as V2[]) {
        C.face([[x, -hd + 4, H + 0.2], [x + w, -hd + 4, H + 0.2], [x + w + hd * 0.5, hd - 4, H + 0.2], [x + hd * 0.5, hd - 4, H + 0.2]], [0, 0, 1], [1, 0, 0], [1.6, 1.8, 1.85])
      }
    }, 2 * 0.035)
  })

  moved(G, place(cx, cy, 0), () => {
    // The lamp: a warm strip under the lid, all the way round.
    fin(G, FINISH.satin, () => {
      const r = 1.3
      for (const s of [-1, 1]) {
        G.box(-iw, iw, s > 0 ? id - r : -id, s > 0 ? id : -id + r, lid0 - 2.2, lid0 - 0.2, [1, 0.93, 0.8], { bottom: true })
        G.box(s > 0 ? iw - r : -iw, s > 0 ? iw : -iw + r, -id + r, id - r, lid0 - 2.2, lid0 - 0.2, [1, 0.93, 0.8], { bottom: true })
      }
    }, CASE.lamp)
    // The painted sky on the back wall, pale at the horizon, with three clouds.
    fin(G, FINISH.matte, () => {
      const rows = 8
      for (let k = 0; k < rows; k++) {
        const z0 = sea + ((lid0 - 3 - sea) * k) / rows
        const z1 = sea + ((lid0 - 3 - sea) * (k + 1)) / rows
        const u = (k + 0.5) / rows
        const col = mix(hex(0xd9eef5), hex(0x3f8fd6), Math.pow(u, 0.8))
        G.face([[-iw, id - 0.5, z0], [iw, id - 0.5, z0], [iw, id - 0.5, z1], [-iw, id - 0.5, z1]], [0, -1, 0], [1, 0, 0], col)
      }
      for (let k = 0; k < 3; k++) {
        const x = -iw * 0.62 + k * iw * 0.56 + rnd.range(-8, 8)
        const zc = sea + (lid0 - sea) * rnd.range(0.52, 0.8)
        for (let j = 0; j < 5; j++) {
          const px = x + (j - 2) * 7.5
          const r = (j === 2 ? 7 : j === 1 || j === 3 ? 5.6 : 3.8) * rnd.range(0.85, 1.15)
          const pts: V3[] = []
          for (let q = 0; q < 12; q++) pts.push([px + Math.cos((q / 12) * Math.PI * 2) * r * 1.25, id - 0.8 - j * 0.02, zc + Math.max(-1.2, Math.sin((q / 12) * Math.PI * 2) * r * 0.8)])
          G.face(pts, [0, -1, 0], [1, 0, 0], hex(0xf7f6f0))
        }
      }
      // A far headland on the horizon.
      G.face([[iw * 0.2, id - 0.7, sea], [iw * 0.45, id - 0.7, sea + 7], [iw * 0.72, id - 0.7, sea + 4.5], [iw, id - 0.7, sea + 6.5], [iw, id - 0.7, sea]], [0, -1, 0], [1, 0, 0], hex(0x6fa9a6))
    }, CASE.sky)
    // The water: deep at the back, clear at the shore, with a white edge that wanders.
    fin(G, FINISH.stone, () => {
      const cols = 26
      const edge = (x: number): number => shore - 9 + 3.2 * Math.sin(x * 0.045 + 1.3) + 1.6 * Math.sin(x * 0.13)
      for (let i = 0; i < cols; i++) {
        const x0 = -iw + (iw * 2 * i) / cols
        const x1 = -iw + (iw * 2 * (i + 1)) / cols
        const bands: [number, RGB][] = [[1, hex(0x1b9fc4)], [0.78, hex(0x22b4d0)], [0.56, hex(0x34c8d8)], [0.36, hex(0x58d8dc)], [0.2, hex(0x86e6de)], [0.08, hex(0xb4f0e2)], [0, hex(0xd6f6ea)]]
        for (let k = 0; k < bands.length - 1; k++) {
          const y = (x: number, u: number): number => edge(x) + (id - edge(x)) * u
          const u0 = bands[k]![0]
          const u1 = bands[k + 1]![0]
          G.blend([[x0, y(x0, u1), sea], [x1, y(x1, u1), sea], [x1, y(x1, u0), sea], [x0, y(x0, u0), sea]], [0, 0, 1], [1, 0, 0], [bands[k + 1]![1], bands[k + 1]![1], bands[k]![1], bands[k]![1]])
        }
        G.face([[x0, edge(x0) - 2.6, sea + 0.25], [x1, edge(x1) - 2.6, sea + 0.25], [x1, edge(x1) + 1.2, sea + 0.25], [x0, edge(x0) + 1.2, sea + 0.25]], [0, 0, 1], [1, 0, 0], TONE.foam)
        if (i % 3 === 1) G.face([[x0, edge(x0) + 7 + (i % 5), sea + 0.2], [x1 + 6, edge(x1) + 7.6 + (i % 5), sea + 0.2], [x1 + 6, edge(x1) + 8.6 + (i % 5), sea + 0.2], [x0, edge(x0) + 8 + (i % 5), sea + 0.2]], [0, 0, 1], [1, 0, 0], hex(0xd5f1ee))
      }
    }, CASE.sun)
    // The sand, raked by the wind.
    fin(G, FINISH.cloth, () => {
      const nx = 56
      const ny = 38
      const blob = (x: number, y: number, bx: number, by: number, r: number): number => Math.max(0, 1 - ((x - bx) ** 2 + (y - by) ** 2) / (r * r))
      const shadow = (x: number, y: number): number => 0.5 * blob(x, y, -iw * 0.56 + 34, -id * 0.05 - 18, 40) * (0.55 + 0.45 * Math.sin(Math.atan2(y + id * 0.05 + 18, x + iw * 0.56 - 34) * 9)) + 0.5 * blob(x, y, iw * 0.5 + 5, -id * 0.3 - 8, 27)
      const y1 = shore - 4
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const x0 = -iw + (iw * 2 * i) / nx
          const x1 = -iw + (iw * 2 * (i + 1)) / nx
          const ya = -id + ((y1 + id) * j) / ny
          const yb = -id + ((y1 + id) * (j + 1)) / ny
          const p: [V3, V3, V3, V3] = [[x0, ya, ground(x0, ya)], [x1, ya, ground(x1, ya)], [x1, yb, ground(x1, yb)], [x0, yb, ground(x0, yb)]]
          const sx = (p[1][2] - p[0][2]) / (x1 - x0)
          const sy = (p[3][2] - p[0][2]) / (yb - ya)
          const at = (q: V3): RGB => {
            const gx = (ground(q[0] + 1.5, q[1]) - ground(q[0] - 1.5, q[1])) / 3
            const gy = (ground(q[0], q[1] + 1.5) - ground(q[0], q[1] - 1.5)) / 3
            const wet = Math.max(0, Math.min(1, (q[1] - (shore - 16)) / 12))
            const grain = 0.012 * Math.sin(q[0] * 12.9898 + q[1] * 78.233)
            return shade(mix(SAND, hex(0xb89a6a), wet), (1 + Math.max(-0.2, Math.min(0.16, gy * 1.1 + gx * 0.4)) + grain) * (1 - Math.min(0.5, shadow(q[0], q[1]))))
          }
          G.blend(p, [-sx, -sy, 1], [1, 0, 0], [at(p[0]), at(p[1]), at(p[2]), at(p[3])])
        }
      }
      G.box(-iw, iw, -id - 0.4, -id, CASE.base, ground(0, -id) + 0.2, shade(SAND, 0.8))
    }, CASE.sun)
    // The palm: a trunk of rings that leans, a crown of fronds that hang.
    const foot: V3 = [-iw * 0.56, -id * 0.05, 0]
    foot[2] = ground(foot[0], foot[1]) - 1
    const rings = 10
    const tall = lid0 - foot[2] - 30
    const spine = (u: number): V3 => [foot[0] + 22 * u * u + 5 * Math.sin(u * 3), foot[1] - 3 * u, foot[2] + tall * u]
    fin(G, FINISH.matte, () => {
      for (let k = 0; k < rings; k++) {
        const p = spine(k / rings)
        const q = spine((k + 1) / rings)
        const r = 4.4 - 1.9 * (k / rings)
        const d = new THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2])
        const len = d.length()
        const mq = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()), new THREE.Vector3(1, 1, 1))
        moved(G, mq, () => G.lathe([[r * 0.86, 0], [r * 1.08, len * 0.72], [r * 0.8, len * 1.02]], 0, 0, 7, (i) => (i ? shade(TONE.trunk, 0.62) : shade(TONE.trunk, k % 2 ? 1 : 0.88))))
      }
      const head = spine(1)
      G.lathe([[2.2, -2], [4.2, 0.5], [3, 3.2], [0, 4.2]], head[0], head[1], 8, shade(TONE.trunk, 0.7), head[2])
      for (let k = 0; k < 3; k++) G.lathe([[0, -2.6], [2.5, -1.4], [2.5, 1.2], [0, 2.4]], head[0] + Math.cos(k * 2.1) * 4.2, head[1] + Math.sin(k * 2.1) * 4.2, 7, hex(0x5a3b22), head[2] - 2.5)
    }, CASE.sun)
    fin(G, FINISH.satin, () => {
      const head = spine(1)
      const fronds = 17
      for (let f = 0; f < fronds; f++) {
        const upper = f % 3 === 2
        const turn = (f / fronds) * Math.PI * 2 + rnd.range(-0.16, 0.16)
        const len = (upper ? rnd.range(30, 40) : rnd.range(46, 60)) * (Math.sin(turn) > 0.5 ? 0.74 : 1)
        const rise = upper ? rnd.range(0.7, 0.95) : rnd.range(0.15, 0.55)
        const dx = Math.cos(turn)
        const dy = Math.sin(turn)
        const steps = 10
        const tone = rnd.range(0, 1)
        const rib = (u: number): V3 => [head[0] + dx * len * u, head[1] + dy * len * u, head[2] + 3 + len * (rise * u - (0.55 + rise) * u * u)]
        const path: V3[] = []
        for (let k = 0; k <= steps; k += 2) path.push(rib(k / steps))
        G.pipe(path, 0.75, 3, upper ? hex(0xb4c45a) : hex(0x6f7f30))
        const wide = (k: number): number => (k === 0 ? 0.6 : (upper ? 4.6 : 6) * Math.pow(Math.sin(Math.PI * Math.min(1, (k / steps) * 0.86 + 0.1)), 0.7) * (k % 2 ? 1 : 0.78))
        for (const s of [-1, 1]) {
          const edge = (k: number): V3 => {
            const q = rib(k / steps)
            const w = wide(k)
            return [q[0] - dy * s * w + dx * w * 0.42, q[1] + dx * s * w + dy * w * 0.42, q[2] - w * 0.55 - 0.3]
          }
          for (let k = 0; k < steps; k++) {
            const u = (k + 0.5) / steps
            const col = shade(mix(mix(TONE.palmDark, TONE.palm, tone), hex(0x9fbf4a), (upper ? 0.3 : 0.08) + 0.25 * u), (k % 2 ? 1.08 : 0.84) * (s > 0 ? 1 : 0.86) * (upper ? 1.22 : 0.74 + 0.3 * u))
            const p0 = rib(k / steps)
            const p1 = rib((k + 1) / steps)
            both(G, [p0, p1, edge(k + 1), edge(k)], [dy * s * 0.45, -dx * s * 0.45, 1], [dx, dy, 0], col, shade(col, 0.55))
          }
        }
      }
    }, CASE.sun)
    // The deck chair: a folding frame of wood and a sling of striped cloth.
    moved(G, place(iw * 0.5, -id * 0.3, ground(iw * 0.5, -id * 0.3) - 0.6, 2.5).multiply(new THREE.Matrix4().makeScale(1.55, 1.55, 1.55)), () => {
      const wood = hex(0xb98a55)
      const w = 10
      fin(G, FINISH.satin, () => {
        for (const s of [-1, 1]) {
          G.pipe([[-14, s * w, 0], [15, s * w, 27]], 1, 5, wood)
          G.pipe([[9, s * w, 0], [-11, s * w, 17]], 1, 5, wood)
          G.pipe([[-2, s * w, 9.6], [12, s * w, 0.4]], 0.8, 5, shade(wood, 0.85))
        }
        for (const p of [[15, 27], [-11, 17], [-14, 0], [9, 0]] as V2[]) G.pipe([[p[0], -w - 1, p[1]], [p[0], w + 1, p[1]]], 0.9, 5, shade(wood, 0.9))
      }, CASE.sun)
      fin(G, FINISH.satin, () => {
        const n = 10
        const sag = (u: number): V3 => [-11 + 26 * u, 0, 17.6 + 10 * u - 5 * Math.sin(u * Math.PI) * (1 - u * 0.35)]
        const stripes = 5
        for (let k = 0; k < n; k++) {
          const p = sag((k + 0.12) / n)
          const q = sag((k + 0.88) / n)
          for (let s = 0; s < stripes; s++) {
            const y0 = -w + 1 + ((w * 2 - 2) * s) / stripes
            const y1 = -w + 1 + ((w * 2 - 2) * (s + 1)) / stripes
            both(G, [[p[0], y0, p[2]], [q[0], y0, q[2]], [q[0], y1, q[2]], [p[0], y1, p[2]]], [-(q[2] - p[2]), 0, q[0] - p[0]], [1, 0, 0], shade(s % 2 ? STRIPE.pale : STRIPE.blue, k % 2 ? 1.06 : 0.94))
          }
        }
      }, CASE.sun)
    })
    // What the tide left: a few shells and a starfish.
    fin(G, FINISH.satin, () => {
      for (let k = 0; k < 7; k++) {
        const x = rnd.range(-iw + 12, iw - 12)
        const y = shore - rnd.range(14, 26)
        G.lathe([[1.6, 0], [1.1, 0.9], [0, 1.2]], x, y, 6, mix(TONE.foam, hex(0xe7b9a0), rnd.next()), ground(x, y) - 0.2)
      }
      const sx = -iw * 0.1
      const sy = -id * 0.62
      const star: V2[] = []
      for (let k = 0; k < 10; k++) star.push([sx + Math.cos((k / 10) * Math.PI * 2 + 0.4) * (k % 2 ? 1.7 : 4.4), sy + Math.sin((k / 10) * Math.PI * 2 + 0.4) * (k % 2 ? 1.7 : 4.4)])
      G.slab(star, ground(sx, sy) - 0.3, ground(sx, sy) + 0.9, hex(0xe0764a), { bevel: 0.6 })
    }, CASE.sun)
  })

  // The brass plate on the back edge of the lid, tipped back.
  const fallback = { c: [cx, cy + hd - 20, H + 13] as V3, w: 120, h: 24, tilt: Math.PI / 6 }
  const t = textAt(ctx, z, 'sign.corporate.beach', fallback)
  signBoard(S, t.c, t.w, t.h, t.tilt, H, TONE.brass, hex(0xe6d9b8), { pad: [10, 5] })

  o.add(mesh(S, mats.solid, `beach.solid.${z.id}`, { cast: true }))
  o.add(mesh(G, mats.glow, `beach.scene.${z.id}`, { group: mats.group }))
  o.add(mesh(C, mats.pane, `beach.case.${z.id}`, { order: 5 }))
  return o
}

export function poseBeach(_o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  poseGlow(z, ctx)
}

export const dropBeach = free

import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type RGB, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, matsOf, mesh, mix, screw } from './mats'

const SEED = 20261125
const MARBLE: RGB = [0.11, 0.13, 0.19]
const VEIN: RGB = [0.016, 0.021, 0.036]
const RIM = { tone: [1, 0.7, 0.36] as RGB, glow: 1.1, low: 2.2 }
export const WEDGE = { under: 46, thick: 7, out: 6, bevel: 1.5 }

const inside = (p: V2, t: V2[]): boolean => {
  let s = 0
  for (let i = 0; i < 3; i++) {
    const a = t[i]!
    const b = t[(i + 1) % 3]!
    const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    if (c === 0) continue
    if (s === 0) s = Math.sign(c)
    else if (Math.sign(c) !== s) return false
  }
  return true
}

const plan = (z: Zone, s: (typeof table.slings)[number]): V2[] => {
  const t: V2[] = [s.a, s.b, s.c].map((p) => {
    const l = localBalls(z, p[0], p[1])
    return [l[0], l[1]] as V2
  })
  const area = (t[1]![0] - t[0]![0]) * (t[2]![1] - t[0]![1]) - (t[1]![1] - t[0]![1]) * (t[2]![0] - t[0]![0])
  return area < 0 ? [t[0]!, t[2]!, t[1]!] : t
}

// A warm line of light under the lip of each slab, where the lamp below it shows.
export function wedgeRims(G: Geo, z: Zone): void {
  for (const s of table.slings.filter((x) => x.tier === z.tier)) {
    const t = plan(z, s)
    fin(G, FINISH.stone, () => {
      for (let i = 0; i < 3; i++) {
        const a = t[i]!
        const b = t[(i + 1) % 3]!
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        const d: V2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]
        const n: V2 = [d[1], -d[0]]
        const out = WEDGE.out + 0.2
        const p: V2 = [a[0] + n[0] * out, a[1] + n[1] * out]
        const q: V2 = [b[0] + n[0] * out, b[1] + n[1] * out]
        G.face([[p[0] + n[0] * RIM.low, p[1] + n[1] * RIM.low, WEDGE.under], [q[0] + n[0] * RIM.low, q[1] + n[1] * RIM.low, WEDGE.under], [q[0], q[1], WEDGE.under + 2.6], [p[0], p[1], WEDGE.under + 2.6]], [n[0] * 0.6, n[1] * 0.6, 0.8], [d[0], d[1], 0], RIM.tone)
      }
    }, RIM.glow)
  }
}

export function buildWedges(z: Zone, _ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const top = WEDGE.under + WEDGE.thick
  for (const s of table.slings.filter((x) => x.tier === z.tier)) {
    const rnd = new Random(SEED, `marble.${s.id}`)
    const t = plan(z, s)
    const loop: V2[] = []
    for (let i = 0; i < 3; i++) {
      const p = t[i]!
      const a = t[(i + 2) % 3]!
      const b = t[(i + 1) % 3]!
      const a0 = Math.atan2(p[1] - a[1], p[0] - a[0]) - Math.PI / 2
      let a1 = Math.atan2(b[1] - p[1], b[0] - p[0]) - Math.PI / 2
      while (a1 < a0) a1 += Math.PI * 2
      const n = 7
      for (let k = 0; k <= n; k++) {
        const an = a0 + ((a1 - a0) * k) / n
        loop.push([p[0] + Math.cos(an) * WEDGE.out, p[1] + Math.sin(an) * WEDGE.out])
      }
    }
    const grain = rnd.range(0, Math.PI)
    const along: V3 = [Math.cos(grain), Math.sin(grain), 0]
    fin(S, FINISH.satin, () => {
      S.slab(loop, WEDGE.under, top, MARBLE, { bevel: WEDGE.bevel, bottom: true, along })
      const cx = (t[0]![0] + t[1]![0] + t[2]![0]) / 3
      const cy = (t[0]![1] + t[1]![1] + t[2]![1]) / 3
      const vein = (from: V2, turn: number, len: number, wide: number, dark: number, deep: number): void => {
        let p = from
        let a = turn
        let w = wide
        const col = mix(MARBLE, VEIN, dark)
        const steps = Math.max(3, Math.round(len / 7))
        for (let k = 0; k < steps; k++) {
          a += rnd.range(-0.3, 0.3) + (turn - a) * 0.25
          const q: V2 = [p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7]
          const w1 = Math.max(0.25, w * rnd.range(0.7, 1.25))
          if (inside(p, t) && inside(q, t)) {
            const nx = -Math.sin(a)
            const ny = Math.cos(a)
            const zz = top + 0.05 + deep
            const strip = (k0: number, k1: number, lift: number, c: typeof col): void => {
              S.face([[p[0] - nx * w * k0, p[1] - ny * w * k0, zz + lift], [q[0] - nx * w1 * k0, q[1] - ny * w1 * k0, zz + lift], [q[0] + nx * w1 * k1, q[1] + ny * w1 * k1, zz + lift], [p[0] + nx * w * k1, p[1] + ny * w * k1, zz + lift]], [0, 0, 1], along, c)
            }
            if (deep < 0.03) {
              strip(3.2, 2.4, -0.02, mix(MARBLE, VEIN, dark * 0.16))
              strip(1.7, 2, -0.01, mix(MARBLE, VEIN, dark * 0.42))
            }
            strip(1, 1, 0, col)
          }
          if (deep === 0 && k > 1 && rnd.next() < 0.13) vein(q, a + rnd.pick([-1, 1]) * rnd.range(0.5, 1.1), len * 0.45, w * 0.6, dark * 0.8, 0.02)
          p = q
          w = w1
        }
      }
      for (let k = 0; k < 6; k++) {
        const side = -100 + k * 40 + rnd.range(-14, 14)
        const start: V2 = [cx - Math.cos(grain) * 140 - Math.sin(grain) * side, cy - Math.sin(grain) * 140 + Math.cos(grain) * side]
        vein(start, grain + rnd.range(-0.25, 0.25), 290, rnd.range(1.1, 2.2), rnd.range(0.6, 0.95), 0)
      }
      for (let k = 0; k < 3; k++) {
        const side = rnd.range(-100, 100)
        const start: V2 = [cx - Math.cos(grain) * 140 - Math.sin(grain) * side, cy - Math.sin(grain) * 140 + Math.cos(grain) * side]
        vein(start, grain + rnd.range(-0.5, 0.5), 290, rnd.range(3, 7), rnd.range(0.07, 0.14), 0.03)
      }
      for (let k = 0; k < 10; k++) {
        const side = rnd.range(-110, 110)
        const start: V2 = [cx - Math.cos(grain) * 140 - Math.sin(grain) * side, cy - Math.sin(grain) * 140 + Math.cos(grain) * side]
        vein(start, grain + rnd.range(-0.7, 0.7), 290, rnd.range(0.45, 0.8), rnd.range(0.4, 0.7), 0.04)
      }
    })
    for (const p of t) {
      // The steel cap of the corner: a turned cup over the stone, a domed screw in it, and the collar of the post under.
      fin(S, FINISH.brushed, () => S.lathe([[7.6, 0], [7.6, 1.1], [6.7, 2], [4.8, 2], [4.4, 1.2]], p[0], p[1], 16, (k) => (k === 2 ? TONE.steel : TONE.nickel), top))
      screw(S, p[0], p[1], top + 1.1, 4.3, TONE.nickel)
      fin(S, FINISH.brushed, () => S.lathe([[7.6, 0], [7.6, 3], [6.4, 3]], p[0], p[1], 12, TONE.steelDark, WEDGE.under - 3))
    }
  }
  o.add(mesh(S, mats.solid, `wedges.${z.id}`, { cast: true }))
  return o
}

export const dropWedges = free

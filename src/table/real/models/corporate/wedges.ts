import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, matsOf, mesh, mix, screw, shade, washer } from './mats'

const SEED = 20261125
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

export function buildWedges(z: Zone, _ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const top = WEDGE.under + WEDGE.thick
  for (const s of table.slings.filter((x) => x.tier === z.tier)) {
    const rnd = new Random(SEED, `marble.${s.id}`)
    let t: V2[] = [s.a, s.b, s.c].map((p) => {
      const l = localBalls(z, p[0], p[1])
      return [l[0], l[1]] as V2
    })
    const area = (t[1]![0] - t[0]![0]) * (t[2]![1] - t[0]![1]) - (t[1]![1] - t[0]![1]) * (t[2]![0] - t[0]![0])
    if (area < 0) t = [t[0]!, t[2]!, t[1]!]
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
    fin(S, FINISH.stone, () => {
      S.slab(loop, WEDGE.under, top, TONE.marble, { bevel: WEDGE.bevel, bottom: true, along })
      const cx = (t[0]![0] + t[1]![0] + t[2]![0]) / 3
      const cy = (t[0]![1] + t[1]![1] + t[2]![1]) / 3
      const vein = (from: V2, turn: number, len: number, wide: number, dark: number, deep: number): void => {
        let p = from
        let a = turn
        let w = wide
        const col = mix(TONE.marble, TONE.vein, dark)
        const steps = Math.max(3, Math.round(len / 7))
        for (let k = 0; k < steps; k++) {
          a += rnd.range(-0.42, 0.42)
          const q: V2 = [p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7]
          const w1 = Math.max(0.25, w * rnd.range(0.7, 1.25))
          if (inside(p, t) && inside(q, t)) {
            const nx = -Math.sin(a)
            const ny = Math.cos(a)
            const zz = top + 0.05 + deep
            S.face([[p[0] - nx * w, p[1] - ny * w, zz], [q[0] - nx * w1, q[1] - ny * w1, zz], [q[0] + nx * w1, q[1] + ny * w1, zz], [p[0] + nx * w, p[1] + ny * w, zz]], [0, 0, 1], along, col)
          }
          if (deep === 0 && k > 0 && rnd.next() < 0.3) vein(q, a + rnd.pick([-1, 1]) * rnd.range(0.5, 1.1), len * 0.4, w * 0.5, dark * 0.7, 0.02)
          p = q
          w = w1
        }
      }
      for (let k = 0; k < 6; k++) {
        const side = rnd.range(-70, 70)
        const start: V2 = [cx - Math.cos(grain) * 90 - Math.sin(grain) * side, cy - Math.sin(grain) * 90 + Math.cos(grain) * side]
        vein(start, grain + rnd.range(-0.25, 0.25), 190, rnd.range(0.5, 1.5), rnd.range(0.35, 0.95), 0)
      }
      for (let k = 0; k < 5; k++) {
        const side = rnd.range(-60, 60)
        const start: V2 = [cx - Math.cos(grain) * 90 - Math.sin(grain) * side, cy - Math.sin(grain) * 90 + Math.cos(grain) * side]
        vein(start, grain + rnd.range(-0.5, 0.5), 190, rnd.range(2.5, 5), rnd.range(0.06, 0.14), 0.03)
      }
    })
    for (const p of t) {
      washer(S, p[0], p[1], top, 6.2, TONE.brass)
      screw(S, p[0], p[1], top + 0.74, 4.1, TONE.gold)
      fin(S, FINISH.brushed, () => S.lathe([[7.6, 0], [7.6, 3], [6.4, 3]], p[0], p[1], 12, shade(TONE.brass, 0.85), WEDGE.under - 3))
    }
  }
  o.add(mesh(S, mats.solid, `wedges.${z.id}`, { cast: true }))
  return o
}

export const dropWedges = free

import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, roundedLoop, type RGB, type V2 } from './geo'
import { NOTE } from './notes'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, moved, place, shade } from './mats'

const SEED = 20261125
const SCALE = new THREE.Vector3(0.9, 0.9, 0.93)
const WALNUT: RGB = [0.56, 0.17, 0.05]
const HIDE = hex(0x0d0c0b)
const flatStreak = (g: Geo, x0: number, x1: number, y0: number, y1: number, zz: number, col: RGB): void => {
  g.face([[x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz]], [0, 0, 1], [0, 1, 0], col)
}
export const ROOM = { top: 50, slab: 4.5, seat: 31, back: 84, chair: 23, pitch: 24, most: 8 }

// One chair, facing +x, its post on the origin.
function chair(): Geo {
  const g = new Geo()
  fin(g, FINISH.polished, () => {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3
      g.pipe([[0, 0, 5.4], [Math.cos(a) * 11.5, Math.sin(a) * 11.5, 1.6]], 1.3, 4, TONE.steel)
    }
    g.lathe([[2.6, 4], [1.5, 8], [1.5, ROOM.seat - 8], [3.4, ROOM.seat - 5]], 0, 0, 6, TONE.steel)
    for (const s of [-1, 1]) g.pipe([[-5.5, s * 11.2, ROOM.seat - 2], [-5.5, s * 11.2, ROOM.seat + 13], [7, s * 11.2, ROOM.seat + 14.5]], 1, 4, TONE.steel)
    // A steel hoop round the back.
    moved(g, place(-9.2, 0, ROOM.seat - 1, 0, 0, -0.16), () => {
      const h = ROOM.back - ROOM.seat + 1
      g.pipe([[0.6, -11.2, 2], [0.6, -11.2, h - 1], [0.6, -9.6, h + 0.9], [0.6, 9.6, h + 0.9], [0.6, 11.2, h - 1], [0.6, 11.2, 2]], 0.95, 5, TONE.steel)
    })
  })
  fin(g, FINISH.leather, () => {
    g.slab(roundedLoop(-10.5, 11, -10.5, 10.5, 3.2, 2), ROOM.seat - 5, ROOM.seat + 1, HIDE, { bevel: 1.8, bottom: true, top: HIDE })
    for (const s of [-1, 1]) g.box(-4.5, 7.5, s * 11.2 - 1.9, s * 11.2 + 1.9, ROOM.seat + 14.5, ROOM.seat + 16.6, HIDE)
    // The back: a padded slab leaning away, in three stitched rolls.
    moved(g, place(-9.2, 0, ROOM.seat - 1, 0, 0, -0.16), () => {
      const h = ROOM.back - ROOM.seat + 1
      g.slab(roundedLoop(-2.4, 2.2, -10.4, 10.4, 2, 2), 0, h, HIDE, { bevel: 1.6 })
      for (let k = 0; k < 3; k++) g.box(2.2, 3.5, -8.8, 8.8, 6 + k * (h - 10) / 3, 6 + (k + 1) * (h - 10) / 3 - 1.2, shade(HIDE, 1.5), { bevel: 0.6 })
      for (let k = 0; k < 3; k++) g.box(-3, -2.4, -8.8, 8.8, 6 + k * (h - 10) / 3, 6 + (k + 1) * (h - 10) / 3 - 1.2, shade(HIDE, 1.5), { bevel: 0.6 })
    })
  })
  return g
}

export function buildBoardroom(z: Zone, _ctx: RealContext): THREE.Object3D {
  const m = table.models.find((x) => x.id === 'corporate.boardroom')
  if (!m) throw new Error('No boardroom in the layout')
  const mats = matsOf(z)
  const o = new THREE.Group()
  const S = new Geo()
  const D = new Geo()
  const rnd = new Random(SEED, 'boardroom')
  const a = localBalls(z, m.box[0], m.box[1] + m.box[3])
  const b = localBalls(z, m.box[0] + m.box[2], m.box[1])
  const cx = (a[0] + b[0]) / 2
  const cy = (a[1] + b[1]) / 2
  const hw = (b[0] - a[0]) / 2
  const hd = (b[1] - a[1]) / 2
  // The notes stand at the foot of the room and lean back into it: the table ends short of them.
  const reach = NOTE.leaf * Math.sin(NOTE.rest + 0.1) + 4
  const lean = table.targets.filter((t) => t.tier === z.tier && t.id.startsWith('corporate.note')).map((t) => localBalls(z, t.box[0] + t.box[2] / 2, t.box[1] + t.box[3] / 2)).filter((p) => p[0] > a[0] - 10 && p[0] < b[0] + 10 && p[1] < cy)
  const south = Math.max(-hd + 7, ...lean.map((p) => p[1] - cy + reach))
  const ex = hw
  const ey = (hd - south + 7) / 2
  const ty = (hd + south - 7) / 2
  // The table lies along the longer way of the room, and the chairs follow it.
  const rot = ex > ey ? Math.PI / 2 : 0
  const tl = Math.max(ex, ey) - 7
  const tw = Math.min(ex, ey) - ROOM.chair - 7
  const places = Math.max(2, Math.min(ROOM.most, Math.floor((tl * 2 - 22) / ROOM.pitch)))
  moved(S, place(cx, cy, 0), () => {
    // The floor of the room: a dark carpet in a brass edge.
    fin(S, FINISH.brushed, () => S.slab(roundedLoop(-hw, hw, -hd, hd, 5, 3), 0, 2.2, TONE.brassDark, { bevel: 0.7 }))
    fin(S, FINISH.cloth, () => {
      S.slab(roundedLoop(-hw + 2.5, hw - 2.5, -hd + 2.5, hd - 2.5, 3.5, 3), 2.2, 2.9, hex(0x070b14), { bevel: 0.3 })
      for (let k = 0; k < 9; k++) {
        const y = -hd + 8 + ((hd * 2 - 16) * k) / 8
        S.box(-hw + 6, hw - 6, y - 0.5, y + 0.5, 2.9, 2.98, hex(0x0c1422))
      }
    })
  })
  moved(S, place(cx, cy + ty, 0, rot), () => {
    // The table: two pedestals, an apron and a top of dark wood with a light line let into it.
    fin(S, FINISH.satin, () => {
      for (const s of [-1, 1]) {
        S.slab(roundedLoop(-tw * 0.52, tw * 0.52, s * tl * 0.52 - 9, s * tl * 0.52 + 9, 3, 3), 2.9, 5.4, shade(TONE.wood, 0.7), { bevel: 0.8 })
        S.box(-tw * 0.3, tw * 0.3, s * tl * 0.52 - 4.5, s * tl * 0.52 + 4.5, 5.4, ROOM.top - ROOM.slab - 4, shade(TONE.wood, 0.8))
      }
      S.slab(roundedLoop(-tw + 5, tw - 5, -tl + 7, tl - 7, 7, 4), ROOM.top - ROOM.slab - 4, ROOM.top - ROOM.slab, shade(TONE.wood, 0.75), { bottom: true })
    })
    fin(S, FINISH.stone, () => {
      const loop = (inset: number): V2[] => {
        const out: V2[] = []
        const n = 14
        // Boat shaped: the long sides bow out a little.
        const side = (x: number, y0: number, y1: number): void => {
          for (let k = 0; k <= n; k++) {
            const u = k / n
            const y = y0 + (y1 - y0) * u
            out.push([x * (1 - 0.1 * Math.pow(Math.abs(y) / tl, 2)) - Math.sign(x) * inset, y * (1 - inset / tl)])
          }
        }
        side(tw, -tl + 5, tl - 5)
        out.push([(tw - 5) * 0.9 - inset, tl - inset], [-(tw - 5) * 0.9 + inset, tl - inset])
        side(-tw, tl - 5, -tl + 5)
        out.push([-(tw - 5) * 0.9 + inset, -tl + inset], [(tw - 5) * 0.9 - inset, -tl + inset])
        return out
      }
      S.slab(loop(0), ROOM.top - ROOM.slab, ROOM.top, WALNUT, { bevel: 1.3, bottom: true, along: [0, 1, 0] })
      S.slab(loop(5), ROOM.top, ROOM.top + 0.05, TONE.woodLight, { sides: false, along: [0, 1, 0] })
      S.slab(loop(6.2), ROOM.top, ROOM.top + 0.1, shade(WALNUT, 1.1), { sides: false, along: [0, 1, 0] })
      for (let k = 0; k < 34; k++) {
        const x = rnd.range(-tw + 9, tw - 9)
        const y = rnd.range(-tl + 9, tl - 40)
        flatStreak(S, x, x + rnd.range(0.4, 1.8), y, Math.min(tl - 9, y + rnd.range(30, 120)), ROOM.top + 0.14, shade(WALNUT, rnd.range(0.55, 1.5)))
      }
    })
  })
  moved(D, place(cx, cy + ty, 0, rot), () => {
    const T = ROOM.top + 0.14
    // The speaker phone: three arms round a dark dome with a ring of holes.
    moved(D, place(0, 0, T, 0.35), () => {
      fin(D, FINISH.satin, () => {
        for (let k = 0; k < 3; k++) {
          moved(D, place(0, 0, 0, (k * Math.PI * 2) / 3), () => {
            D.slab([[2, -3.2], [10.5, -2.2], [12, 0], [10.5, 2.2], [2, 3.2]], 0, 1.6, TONE.graphite, { bevel: 0.6 })
            D.box(8.2, 10.2, -0.9, 0.9, 1.6, 1.75, hex(0x54c08a))
          })
        }
        D.lathe([[5.6, 0], [5.6, 1.6], [4.6, 2.6], [0, 2.9]], 0, 0, 14, shade(TONE.graphite, 0.8))
      })
      fin(D, FINISH.matte, () => {
        for (let k = 0; k < 8; k++) D.lathe([[0.55, 0], [0, 0.02]], Math.cos((k / 8) * Math.PI * 2) * 3.1, Math.sin((k / 8) * Math.PI * 2) * 3.1, 5, TONE.rubber, 2.72)
      })
    })
  })
  o.add(mesh(D, mats.solid, `boardroom.places.${z.id}`, { fine: true }))
  o.add(mesh(S, mats.solid, `boardroom.${z.id}`, { cast: true }))
  // Empty chairs down both long sides, no two quite in line.
  const chairs = new THREE.InstancedMesh(chair().done(), mats.solid, places * 2)
  chairs.name = `boardroom.chairs.${z.id}`
  chairs.castShadow = true
  chairs.receiveShadow = true
  const pitch = (tl * 2 - 22) / places
  const cr = Math.cos(rot)
  const sr = Math.sin(rot)
  const M = new THREE.Matrix4()
  let i = 0
  for (const s of [-1, 1]) {
    for (let k = 0; k < places; k++) {
      const ly = -tl + 11 + pitch * (k + 0.5) + rnd.range(-1.2, 1.2)
      const lx = s * (tw + 9.5 + rnd.range(-2, 1))
      chairs.setMatrixAt(i++, M.copy(place(cx + lx * cr - ly * sr, cy + ty + lx * sr + ly * cr, 2.9, rot + (s > 0 ? Math.PI : 0) + rnd.range(-0.3, 0.3))).scale(SCALE))
    }
  }
  chairs.instanceMatrix.needsUpdate = true
  chairs.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, 40), Math.hypot(hw, hd) + 40)
  o.add(chairs)
  return o
}

export const dropBoardroom = free

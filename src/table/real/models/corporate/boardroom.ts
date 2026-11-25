import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { Random } from '../../../../core/random'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, moved, place, shade } from './mats'

const SEED = 20261125
const SCALE = new THREE.Vector3(0.9, 0.9, 0.93)
export const ROOM = { top: 50, slab: 4.5, seat: 31, back: 84, chair: 23, places: 6 }

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
  })
  fin(g, FINISH.leather, () => {
    g.slab(roundedLoop(-10.5, 11, -10.5, 10.5, 3.2, 2), ROOM.seat - 5, ROOM.seat + 1, TONE.leather, { bevel: 1.8, bottom: true, top: shade(TONE.leather, 1.5) })
    for (const s of [-1, 1]) g.box(-4.5, 7.5, s * 11.2 - 1.9, s * 11.2 + 1.9, ROOM.seat + 14.5, ROOM.seat + 16.6, TONE.leather)
    // The back: a padded slab leaning away, in three stitched rolls.
    moved(g, place(-9.2, 0, ROOM.seat - 1, 0, 0, -0.16), () => {
      const h = ROOM.back - ROOM.seat + 1
      g.slab(roundedLoop(-2.4, 2.2, -10.4, 10.4, 2, 2), 0, h, TONE.leather, { bevel: 1.6 })
      for (let k = 0; k < 3; k++) g.box(2.2, 3.5, -8.8, 8.8, 6 + k * (h - 10) / 3, 6 + (k + 1) * (h - 10) / 3 - 1.2, shade(TONE.leather, 1.5))
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
  const tw = hw - ROOM.chair - 7
  const tl = hd - 7
  moved(S, place(cx, cy, 0), () => {
    // The floor of the room: a dark carpet in a brass edge.
    fin(S, FINISH.brushed, () => S.slab(roundedLoop(-hw, hw, -hd, hd, 5, 3), 0, 2.2, TONE.brassDark, { bevel: 0.7 }))
    fin(S, FINISH.cloth, () => {
      S.slab(roundedLoop(-hw + 2.5, hw - 2.5, -hd + 2.5, hd - 2.5, 3.5, 3), 2.2, 2.9, hex(0x23303f), { bevel: 0.3 })
      for (let k = 0; k < 9; k++) {
        const y = -hd + 8 + ((hd * 2 - 16) * k) / 8
        S.box(-hw + 6, hw - 6, y - 0.5, y + 0.5, 2.9, 2.98, hex(0x2f4054))
      }
    })
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
      S.slab(loop(0), ROOM.top - ROOM.slab, ROOM.top, TONE.wood, { bevel: 1.3, bottom: true, along: [0, 1, 0] })
      S.slab(loop(5), ROOM.top, ROOM.top + 0.05, TONE.woodLight, { sides: false, along: [0, 1, 0] })
      S.slab(loop(6.2), ROOM.top, ROOM.top + 0.1, shade(TONE.wood, 1.12), { sides: false, along: [0, 1, 0] })
      for (let k = 0; k < 7; k++) {
        const x = rnd.range(-tw + 9, tw - 9)
        S.box(x, x + rnd.range(0.5, 2.2), -tl + 9, tl - 9, ROOM.top + 0.1, ROOM.top + 0.14, shade(TONE.wood, rnd.range(0.8, 1.3)), { along: [0, 1, 0] })
      }
    })
  })
  moved(D, place(cx, cy, 0), () => {
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
    // Each place: a closed folder a little askew and a glass of water.
    const pitch = (tl * 2 - 16) / ROOM.places
    for (const s of [-1, 1]) {
      for (let k = 0; k < ROOM.places; k++) {
        const y = -tl + 8 + pitch * (k + 0.5)
        const x = s * (tw - 12.5)
        moved(D, place(x + rnd.range(-1, 1), y + rnd.range(-1.5, 1.5), T, (s > 0 ? 0 : Math.PI) + rnd.range(-0.16, 0.16)), () => {
          fin(D, FINISH.satin, () => {
            D.box(-5.2, 5.2, -7.2, 7.2, 0, 1.1, TONE.folder, { bevel: 0.3 })
            D.box(-4.8, 4.9, -6.9, 6.9, 0.3, 0.8, TONE.white)
            D.box(-5.2, -3.9, -7.2, 7.2, 1.1, 1.2, shade(TONE.folder, 0.7))
            D.box(0.6, 3.6, -2.4, 2.4, 1.1, 1.2, TONE.white)
          })
          fin(D, FINISH.polished, () => D.pipe([[4.3, -6, 1.5], [4.3, 3.5, 1.5]], 0.45, 5, TONE.steel))
        })
        fin(D, FINISH.stone, () => {
          const gx = s * (tw - 22.5) + rnd.range(-1, 1)
          const gy = y + pitch * 0.3 + rnd.range(-1, 1)
          D.lathe([[1.9, 0], [2.4, 5.6], [2.05, 5.6], [1.7, 3.6], [0, 3.6]], gx, gy, 10, (i) => (i > 2 ? hex(0xbfe0ea) : hex(0xdfeaec)), T)
          D.lathe([[3.3, 0], [3.3, 0.3], [0, 0.3]], gx, gy, 10, hex(0xcfc9b8), T)
        })
      }
    }
  })
  o.add(mesh(D, mats.solid, `boardroom.places.${z.id}`, { fine: true }))
  o.add(mesh(S, mats.solid, `boardroom.${z.id}`, { cast: true }))
  // Twelve empty chairs, six a side, no two quite in line.
  const chairs = new THREE.InstancedMesh(chair().done(), mats.solid, ROOM.places * 2)
  chairs.name = `boardroom.chairs.${z.id}`
  chairs.castShadow = true
  chairs.receiveShadow = true
  const pitch = (tl * 2 - 16) / ROOM.places
  const M = new THREE.Matrix4()
  let i = 0
  for (const s of [-1, 1]) {
    for (let k = 0; k < ROOM.places; k++) {
      const y = cy - tl + 8 + pitch * (k + 0.5) + rnd.range(-2.2, 2.2)
      const x = cx + s * (tw + 9.5 + rnd.range(-2, 1))
      chairs.setMatrixAt(i++, M.copy(place(x, y, 2.9, (s > 0 ? Math.PI : 0) + rnd.range(-0.3, 0.3))).scale(SCALE))
    }
  }
  chairs.instanceMatrix.needsUpdate = true
  chairs.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, 40), Math.hypot(hw, hd) + 40)
  o.add(chairs)
  return o
}

export const dropBoardroom = free

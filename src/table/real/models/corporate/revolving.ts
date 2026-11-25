import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { holdOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, roundedLoop, type V2 } from './geo'
import { FINISH, TONE, drop as free, fin, matsOf, mesh, moved, place, screw, shade } from './mats'

export const DOOR = { reach: 66, foot: 10, tall: 112, thick: 5, post: 6.5, ring: 70, rest: Math.PI / 4, turn: 0.85 }

const built = new WeakMap<THREE.Object3D, THREE.Object3D>()

export function buildRevolving(z: Zone, _ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const o = new THREE.Group()
  const h = holdOf('corporate.revolving')
  const c = localBalls(z, h.c[0], h.c[1])
  const rotor = new THREE.Group()
  rotor.position.set(c[0], c[1], 0)
  const S = new Geo()
  const C = new Geo()
  const F = new Geo()
  const top = DOOR.foot + DOOR.tall
  // The floor ring and the turned post: round, so they may turn with the rest and no one can tell.
  fin(S, FINISH.brushed, () => {
    S.lathe([[DOOR.ring, 0], [DOOR.ring, 4.2], [DOOR.ring - 1.2, 5.2], [DOOR.ring - 5, 5.2], [DOOR.ring - 6, 4.2], [DOOR.ring - 6, 0]], 0, 0, 40, TONE.brass)
    S.lathe([[24, 0], [24, 2.2], [22.5, 3.4], [15, 4.4], [12.5, 6.2], [12.5, 8], [9, 9.4], [DOOR.post, 10.2]], 0, 0, 20, (k) => (k % 2 ? TONE.brass : TONE.gold))
  })
  fin(S, FINISH.polished, () => {
    const mid = DOOR.foot + DOOR.tall / 2
    S.lathe([[DOOR.post, 10.2], [DOOR.post, 16], [8.4, 17.2], [8.4, 19.6], [DOOR.post, 20.8], [DOOR.post - 0.9, mid - 4], [8, mid - 2.6], [8, mid + 2.6], [DOOR.post - 0.9, mid + 4], [DOOR.post, top - 9], [8.4, top - 7.6], [8.4, top - 5], [DOOR.post, top - 3.6], [DOOR.post, top + 1]], 0, 0, 14, TONE.gold)
    S.lathe([[DOOR.post, top + 1], [11.5, top + 2], [12.5, top + 4.4], [11, top + 6.6], [6, top + 8.4], [3.4, top + 10], [3.8, top + 12.5], [2.4, top + 14.6], [0, top + 15.2]], 0, 0, 14, TONE.gold)
  })
  for (let k = 0; k < 8; k++) screw(F, Math.cos((k / 8) * Math.PI * 2 + 0.39) * (DOOR.ring - 3), Math.sin((k / 8) * Math.PI * 2 + 0.39) * (DOOR.ring - 3), 5.2, 1.3, TONE.brassDark)
  const t = DOOR.thick / 2
  const r0 = DOOR.post + 1.5
  for (let k = 0; k < 4; k++) {
    const m = place(0, 0, 0, (k * Math.PI) / 2)
    moved(S, m, () => {
      fin(S, FINISH.polished, () => {
        // A thin brass frame: a rail under, a rail over and a stile at the free edge, with a clamp at the post.
        S.box(r0, DOOR.reach, -t - 0.6, t + 0.6, DOOR.foot, DOOR.foot + 3, TONE.brass, { bevel: 0.5, bottom: true })
        S.box(r0, DOOR.reach, -t - 0.6, t + 0.6, top - 3, top, TONE.brass, { bevel: 0.5, bottom: true })
        S.box(DOOR.reach - 2.6, DOOR.reach, -t - 0.6, t + 0.6, DOOR.foot + 3, top - 3, TONE.brass, { bevel: 0.5 })
        for (const zc of [DOOR.foot + 14, top - 14]) S.box(DOOR.post - 1, r0 + 6, -t - 1.6, t + 1.6, zc - 4, zc + 4, TONE.brassDark, { bevel: 0.7, bottom: true })
        // The push bar, on both faces.
        const bz = DOOR.foot + DOOR.tall * 0.46
        for (const s of [-1, 1]) {
          const y = s * (t + 4.2)
          S.pipe([[r0 + 12, y, bz], [DOOR.reach - 9, y, bz]], 1.5, 6, TONE.gold)
          for (const x of [r0 + 14, DOOR.reach - 11]) {
            S.pipe([[x, s * t, bz], [x, y, bz]], 1.1, 4, TONE.brassDark)
            moved(F, m.clone().multiply(place(x, s * t, bz, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)), () => F.lathe([[2.6, 0], [2.6, 0.7], [1.2, 1.1]], 0, 0, 8, TONE.gold))
          }
          for (const x of [r0, DOOR.reach - 5.2]) S.box(x, x + 5.2, s > 0 ? t : -t - 0.5, s > 0 ? t + 0.5 : -t, bz - 1.2, bz + 1.2, TONE.gold)
        }
      })
      fin(S, FINISH.matte, () => S.box(r0 + 3, DOOR.reach - 3, -1.6, 1.6, DOOR.foot - 2.2, DOOR.foot, TONE.rubber, { bottom: true }))
    })
    // The pane: thick, clear, its edges polished and its corners rounded.
    const from = C.vertices
    const pane: V2[] = roundedLoop(r0 + 0.6, DOOR.reach - 2.6, DOOR.foot + 3, top - 3, 2.2, 3)
    C.prism(pane, [0, -t], [0, t], [1, 1, 1])
    C.move(from, m)
  }
  rotor.add(mesh(S, mats.solid, `revolving.rotor.${z.id}`, { cast: true }))
  rotor.add(mesh(F, mats.solid, `revolving.screws.${z.id}`, { fine: true }))
  rotor.add(mesh(C, mats.clear, `revolving.glass.${z.id}`, { order: 4 }))
  rotor.rotation.z = DOOR.rest
  o.add(rotor)
  built.set(o, rotor)
  return o
}

// A quarter turn that starts fast and runs down.
const quarter = (t: number): number => {
  if (t >= DOOR.turn) return 1
  const u = t / DOOR.turn
  const run = 1 - (1 - u) * (1 - u) * (1 - u)
  return run + 0.035 * Math.sin(u * Math.PI * 3) * (1 - u)
}

export function poseRevolving(o: THREE.Object3D, _z: Zone, ctx: RealContext): void {
  const rotor = built.get(o)
  if (!rotor) return
  const v = ctx.byId.get('hold.corporate.revolving')?.v ?? [0, 9, 9]
  rotor.rotation.z = DOOR.rest - (Math.PI / 2) * (quarter(v[1] ?? 9) + quarter(v[2] ?? 9))
}

export const dropRevolving = free

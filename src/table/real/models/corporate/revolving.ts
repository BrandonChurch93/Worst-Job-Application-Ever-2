import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { holdOf } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, roundedLoop, type RGB, type V2, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, matsOf, mesh, moved, place } from './mats'

export const DOOR = { reach: 66, foot: 9, tall: 108, thick: 6, post: 12.5, disc: 33, rest: Math.PI / 4, turn: 0.85 }

// The glass of a slab: its faces, the ground band round each face, and its polished edge.
const FACE: RGB = [0.3, 0.46, 0.44]
const BAND: RGB = [1.05, 1.22, 1.18]
const RIM: RGB = [1.25, 1.6, 1.52]
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
  const mid = DOOR.foot + DOOR.tall / 2
  const R = DOOR.post
  // The stepped disc the post stands on.
  fin(S, FINISH.brushed, () => {
    S.lathe([[DOOR.disc, 0], [DOOR.disc, 2.4], [DOOR.disc - 1.4, 3.6], [R + 9.5, 3.6]], 0, 0, 32, (k) => (k === 2 ? TONE.gold : TONE.brass))
  })
  fin(S, FINISH.polished, () => {
    S.lathe([[R + 9.5, 3.6], [R + 9.5, 6.6], [R + 8.3, 7.8], [R + 3, 7.8], [R + 3, 9.4], [R + 1.8, 10.6]], 0, 0, 28, (k) => (k % 2 ? TONE.brass : TONE.gold))
    // The post, turned, with a collar low, a slim one at the middle and a collar high, and its cap.
    const turned = S.vertices
    const collar = (at: number, half: number, out: number): V2[] => [[R, at - half - 1.4], [R + out, at - half], [R + out, at + half], [R, at + half + 1.4]]
    S.lathe([[R + 1.8, 10.6], [R + 1.8, 15], [R, 16.4], ...collar(DOOR.foot + 16, 3.2, 2.4), ...collar(mid, 1.1, 1.3), ...collar(top - 12, 3.2, 2.4), [R, top - 3], [R + 1.6, top - 1.8], [R + 1.6, top + 2.2], [R + 0.4, top + 3.4], [R - 3, top + 3.4], [R - 3.6, top + 4.8], [R - 6.5, top + 5.6], [0, top + 5.6]], 0, 0, 24, (k) => (k % 4 === 1 ? TONE.brass : TONE.gold))
    // Turned brass shows the room in upright streaks: four round the post, so a quarter turn leaves them where they were.
    S.tint(turned, (nx, ny, nz) => 1 + (1 - nz * nz) * (-0.62 + 1.5 * Math.pow(0.5 + 0.5 * Math.cos(4 * Math.atan2(ny, nx) + 0.9), 3)))
  })
  const t = DOOR.thick / 2
  const r0 = R + 4
  const round = 7
  const outer: V2[] = roundedLoop(r0, DOOR.reach, DOOR.foot, top, round, 4)
  const inner: V2[] = roundedLoop(r0 + 2.4, DOOR.reach - 2.4, DOOR.foot + 2.4, top - 2.4, round - 2.4, 4)
  for (let k = 0; k < 4; k++) {
    const m = place(0, 0, 0, (k * Math.PI) / 2)
    // The clamps that hold the slab at the post: one at each collar, with a screw through each cheek.
    moved(S, m, () => {
      fin(S, FINISH.polished, () => {
        for (const zc of [DOOR.foot + 16, top - 12]) {
          S.box(R - 1, r0 + 3.6, -t - 0.9, t + 0.9, zc - 1.9, zc + 1.9, TONE.brass, { bevel: 0.7, bottom: true })
        }
      })
    })
    for (const zc of [DOOR.foot + 16, top - 12]) for (const s of [-1, 1]) moved(F, m.clone().multiply(place(r0 + 1.7, s * (t + 0.9), zc, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)), () => F.lathe([[1.1, 0], [1.1, 0.4], [0.5, 0.7]], 0, 0, 8, TONE.brassDark))
    // The slab: thick clear glass with round corners. Its faces are clear, the ground band round them catches the light, and its edge is bright.
    const from = C.vertices
    for (const s of [-1, 1]) {
      fin(C, FINISH.stone, () => C.face(inner.map((p): V3 => [p[0], s * t, p[1]]), [0, s, 0], [1, 0, 0], FACE), 2 * 0.05)
      fin(C, FINISH.stone, () => {
        for (let i = 0; i < outer.length; i++) {
          const a = outer[i]!
          const b = outer[(i + 1) % outer.length]!
          const c2 = inner[(i + 1) % outer.length]!
          const d = inner[i]!
          C.face([[a[0], s * t, a[1]], [b[0], s * t, b[1]], [c2[0], s * t, c2[1]], [d[0], s * t, d[1]]], [0, s, 0], [1, 0, 0], BAND)
        }
      }, 2 * 0.13)
    }
    fin(C, FINISH.stone, () => C.prism(outer, [0, -t], [0, t], RIM, [false, false]), 2 * 0.34)
    // What each slab mirrors: one slanting streak of the room's light.
    fin(C, FINISH.stone, () => {
      const x = r0 + 9
      C.face([[x, t + 0.06, DOOR.foot + 3], [x + 11, t + 0.06, DOOR.foot + 3], [x + 27, t + 0.06, top - 3], [x + 16, t + 0.06, top - 3]], [0, 1, 0], [1, 0, 0], [1.4, 1.6, 1.6])
    }, 2 * 0.05)
    C.move(from, m)
  }
  rotor.add(mesh(S, mats.solid, `revolving.rotor.${z.id}`, { cast: true }))
  rotor.add(mesh(F, mats.solid, `revolving.screws.${z.id}`, { fine: true }))
  rotor.add(mesh(C, mats.pane, `revolving.glass.${z.id}`, { order: 4 }))
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

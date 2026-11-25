import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { Geo, type V3 } from './geo'
import { FINISH, TONE, drop as free, fin, hex, matsOf, mesh, moved, place, screw, shade } from './mats'

export const NOTE = { leaf: 44, wide: 30, paper: 32, hinge: 4, lean: 0.3, rest: 0.62 }

interface Built { leaves: THREE.InstancedMesh; tick: THREE.Mesh; at: { id: string; p: V3; turn: number }[] }
const built = new WeakMap<THREE.Object3D, Built>()
const M = new THREE.Matrix4()
const Q = new THREE.Quaternion()
const Q2 = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)
const UP = new THREE.Vector3(0, 0, 1)
const ONE = new THREE.Vector3(1, 1, 1)
const P = new THREE.Vector3()

const paperAt = (u: number): [number, number] => {
  const curl = Math.max(0, u - 0.45) / 0.55
  return [-0.62 - curl * curl * 6.5, NOTE.leaf - 1.5 - u * NOTE.paper + curl * curl * 2.2]
}

// One leaf of spring steel with its note, its hinge on the x axis, its face to -y.
function leaf(): Geo {
  const g = new Geo()
  const w = NOTE.wide / 2
  fin(g, FINISH.brushed, () => {
    g.box(-w, w, -0.5, 0.5, 0, NOTE.leaf, TONE.steel, { bottom: true, along: [0, 0, 1] })
    g.box(-w, w, 0.5, 1.6, 0, 9, TONE.steelDark, { along: [1, 0, 0] })
    g.box(-w + 3, w - 3, 0.5, 1.2, NOTE.leaf - 9, NOTE.leaf - 3, TONE.steelDark)
  })
  fin(g, FINISH.polished, () => {
    g.pipe([[-w - 2, 0, 0], [w + 2, 0, 0]], 2.4, 8, TONE.steel)
    for (const x of [-w + 4.5, w - 4.5]) moved(g, place(x, -0.5, 4.5, 0, Math.PI / 2), () => g.lathe([[2, 0], [1.7, 0.7], [0, 0.9]], 0, 0, 8, TONE.steelDark))
  })
  const p = NOTE.paper / 2
  const rows = 9
  fin(g, FINISH.cloth, () => {
    for (let k = 0; k < rows; k++) {
      const a = paperAt(k / rows)
      const b = paperAt((k + 1) / rows)
      const n: V3 = [0, -(a[1] - b[1]), -(a[0] - b[0])]
      const col = shade(TONE.paper, 1 - 0.1 * (k / rows) - (k < 2 ? 0.07 : 0))
      g.face([[-p, a[0], a[1]], [p, a[0], a[1]], [p, b[0], b[1]], [-p, b[0], b[1]]], n, [1, 0, 0], col)
      g.face([[-p, a[0] + 0.12, a[1]], [p, a[0] + 0.12, a[1]], [p, b[0] + 0.12, b[1]], [-p, b[0] + 0.12, b[1]]], [-n[0], -n[1], -n[2]], [1, 0, 0], TONE.paperShade)
    }
  })
  return g
}

export function buildNotes(z: Zone, _ctx: RealContext): THREE.Object3D {
  const mats = matsOf(z)
  const o = new THREE.Group()
  const at = table.targets.filter((t) => t.tier === z.tier && t.id.startsWith('corporate.note')).map((t) => {
    const c = localBalls(z, t.box[0] + t.box[2] / 2, t.box[1] + t.box[3] / 2)
    return { id: `target.${t.id}`, p: [c[0], c[1], NOTE.hinge] as V3, turn: Math.atan2(-t.n[1], t.n[0]) + Math.PI / 2 }
  })
  const leaves = new THREE.InstancedMesh(leaf().done(), mats.solid, Math.max(1, at.length))
  leaves.name = `notes.leaves.${z.id}`
  leaves.castShadow = true
  leaves.receiveShadow = true
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  leaves.count = at.length
  let far = 0
  for (const n of at) far = Math.max(far, Math.hypot(n.p[0], n.p[1]))
  leaves.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), far + 80)
  o.add(leaves)
  // What only a close look shows: the foot of each leaf with its two screws, and one pencil tick.
  const F = new Geo()
  const w = NOTE.wide / 2
  for (const n of at) {
    moved(F, place(n.p[0], n.p[1], 0, n.turn), () => {
      fin(F, FINISH.brushed, () => {
        F.box(-w - 5, w + 5, -1.5, 9, 0, 1.6, TONE.steelDark, { bevel: 0.5 })
        F.box(-w - 3, w + 3, 0.8, 3.4, 1.6, 3.4, TONE.steel, { bevel: 0.4 })
      })
      for (const x of [-w, w]) screw(F, x, 6.2, 1.6, 1.9, TONE.steel)
    })
  }
  o.add(mesh(F, mats.solid, `notes.feet.${z.id}`, { fine: true }))
  const T = new Geo()
  const pencil = hex(0x4a4c52)
  fin(T, FINISH.cloth, () => {
    const zc = NOTE.leaf - 1.5 - NOTE.paper * 0.3
    const stroke = (x0: number, z0: number, x1: number, z1: number): void => {
      const l = Math.hypot(x1 - x0, z1 - z0)
      const nx = (-(z1 - z0) / l) * 0.55
      const nz = ((x1 - x0) / l) * 0.55
      T.face([[x0 - nx, -0.72, z0 - nz], [x1 - nx * 0.5, -0.72, z1 - nz * 0.5], [x1 + nx * 0.5, -0.72, z1 + nz * 0.5], [x0 + nx, -0.72, z0 + nz]], [0, -1, 0], [1, 0, 0], pencil)
    }
    stroke(-6, zc + 1, -2, zc - 4.5)
    stroke(-2, zc - 4.5, 7, zc + 7)
  })
  const tick = mesh(T, mats.solid, `notes.tick.${z.id}`, { fine: true })
  tick.matrixAutoUpdate = false
  tick.visible = at.length > 1
  o.add(tick)
  built.set(o, { leaves, tick, at })
  poseNotes(o, z, null)
  return o
}

export function poseNotes(o: THREE.Object3D, _z: Zone, ctx: RealContext | null): void {
  const b = built.get(o)
  if (!b) return
  b.at.forEach((n, i) => {
    const t = ctx?.byId.get(n.id)?.v?.[1] ?? 9
    let a = NOTE.rest + (i - 1) * 0.045
    if (t < 2.2) {
      a += NOTE.lean * Math.min(1, t / 0.035) * Math.exp(-t * 3.4) * Math.cos(t * 17.5)
      a += 0.02 * Math.exp(-t * 1.6) * Math.sin(t * 61 + i)
    }
    Q.setFromAxisAngle(UP, n.turn + (i - 1) * 0.07 + (i === 1 ? -0.05 : 0))
    Q2.setFromAxisAngle(X, -a)
    M.compose(P.set(n.p[0], n.p[1], n.p[2]), Q.multiply(Q2), ONE)
    b.leaves.setMatrixAt(i, M)
    if (i === 1) b.tick.matrix.copy(M)
  })
  b.leaves.instanceMatrix.needsUpdate = true
}

export const dropNotes = free

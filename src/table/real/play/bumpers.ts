import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, table } from '../../layout'
import { colours, groupsOf, levels } from '../lights'
import { lit } from '../light'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, ball, box, ease, lathe, look, mat, prism, rod, type V2 } from './g'
import { drop, matsOf, part } from './mats'

const PLATE = look(0xdde0e3, 0.2, 0.78, 0)
const PRINT = look(0x20262a, 0.55, 0, 0.4)
const PRINT_PALE = look(0xd9d4c4, 0.55, 0, 0.4)
const SKIRT = look(0xbdbab2, 0.42, 0, 0.5)
const PAPER = look(0xe6dfd0, 0.86, 0, 0)
const KRAFT = look(0x7c4727, 0.82, 0, 0)
const KRAFT_DARK = look(0x5e351d, 0.85, 0, 0)
const LID = look(0xe4e1da, 0.34, 0, 0.6)
const LID_DARK = look(0x2a2826, 0.7, 0, 0)
const CHROME = look(0xf4f6f8, 0.18, 0.32, 1)
const SCREW = look(0xd2d5d8, 0.26, 0.76, 0)

// The heights of a cup, in page pixels over the floor.
export const CUP = { foot: 12, footR: 46, rimZ: 88, rimR: 58, sleeve0: 22, sleeve1: 68, ringRest: 89, ringDown: 34, ringIn: 77.5, ringOut: 84.5, lidZ: 86, lidR: 76, deck: 100, top: 108, flutes: 60 }
const wallR = (z: number): number => CUP.footR + ((CUP.rimR - CUP.footR) * (z - CUP.foot)) / (CUP.rimZ - CUP.foot)

// The corrugated sleeve: a cone whose wall runs in and out in flutes.
function sleeve(): THREE.BufferGeometry {
  const p: number[] = []
  const n = CUP.flutes * 2
  const at = (i: number, z: number): [number, number, number] => {
    const a = (i / n) * Math.PI * 2
    const r = wallR(z) + 1.5 + (i % 2 === 0 ? 0.95 : -0.2)
    return [r * Math.cos(a), r * Math.sin(a), z]
  }
  for (let i = 0; i < n; i++) {
    const a = at(i, CUP.sleeve0)
    const b = at(i + 1, CUP.sleeve0)
    const c = at(i + 1, CUP.sleeve1)
    const d = at(i, CUP.sleeve1)
    p.push(...a, ...b, ...c, ...a, ...c, ...d)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.computeVertexNormals()
  return g
}

function cup(b: Bag, x: number, y: number, seam: number): void {
  const m = mat({ x, y })
  const turn = mat({ x, y, rz: seam })
  b.add(lathe([[97, 0.15], [97, 0.5], [91, 0.5]], 48), PRINT, m)
  b.add(lathe([[90.6, 0.15], [90.6, 0.6], [89.4, 0.6]], 48), PRINT_PALE, m)
  b.add(lathe([[89, 0], [89, 1.6], [87.6, 2.7], [78.4, 2.7], [77.6, 2.1], [76.4, 2.1], [75.6, 2.7], [70, 2.7]], 48), PLATE, m)
  b.add(lathe([[74.5, 2.6], [74.5, 4], [72.8, 5], [55, 12.6], [53.4, 13.6], [47.4, 13.8]], 48), SKIRT, m)
  b.add(lathe([[wallR(CUP.foot), CUP.foot], [wallR(CUP.rimZ), CUP.rimZ]], 48), PAPER, m)
  b.add(lathe([[CUP.rimR, CUP.rimZ - 2], [CUP.rimR + 2.6, CUP.rimZ - 1.2], [CUP.rimR + 3.4, CUP.rimZ + 0.8], [CUP.rimR + 2.4, CUP.rimZ + 2.6], [CUP.rimR - 1, CUP.rimZ + 3]], 48, 80), PAPER, m)
  b.add(sleeve(), KRAFT, m)
  for (const z of [CUP.sleeve0, CUP.sleeve1]) b.add(lathe([[wallR(z) + 0.2, z - 0.3], [wallR(z) + 2.7, z - 0.3], [wallR(z) + 2.7, z + 0.3], [wallR(z) + 0.2, z + 0.3]], 48), KRAFT_DARK, m)
  const tilt = Math.atan2(CUP.rimR - CUP.footR, CUP.rimZ - CUP.foot)
  const mid = (CUP.sleeve0 + CUP.sleeve1) / 2
  b.add(box(1.2, 11, CUP.sleeve1 - CUP.sleeve0 + 0.8), KRAFT_DARK, turn.clone().multiply(mat({ x: wallR(mid) + 2.5, z: mid, ry: tilt })))
  b.add(rod([wallR(CUP.foot) + 0.3, 2.2, CUP.foot], [wallR(CUP.rimZ) + 0.3, 2.2, CUP.rimZ - 2], 0.8, 5), PAPER, turn)
  for (const side of [-1, 1]) {
    const s = mat({ x: x + side * 60.5, y: y + side * 60.5 })
    b.add(lathe([[4.6, 2.6], [4.6, 3.6], [3.6, 4.4], [1.6, 4.4]], 10), SCREW, s)
    b.add(box(5.6, 0.9, 0.5), LID_DARK, s.clone().multiply(mat({ z: 4.4, rz: side * 0.6 })))
  }
}

// The steel ring and its two rods, round the z axis with the ring's middle at z = 0.
function ringGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const section: V2[] = [[CUP.ringIn, -2.4], [CUP.ringIn + 1.6, -3.6], [CUP.ringOut - 2, -3.6], [CUP.ringOut, -1.8], [CUP.ringOut, 1.8], [CUP.ringOut - 2, 3.6], [CUP.ringIn + 1.6, 3.6], [CUP.ringIn, 2.4], [CUP.ringIn, -2.4]]
  b.add(lathe(section, 56, 50), CHROME)
  for (const side of [-1, 1]) {
    const x = side * (CUP.ringIn + CUP.ringOut) * 0.5
    b.add(rod([x, 0, -CUP.ringRest - 4], [x, 0, 3.4], 1.9, 8), SCREW)
    b.add(lathe([[4.2, 3.4], [4.2, 5.6], [3.2, 6.4], [0, 6.4]], 6, 30), SCREW, mat({ x }))
  }
  return b.done()
}

const lidProfile = (): V2[] => {
  const t = CUP.top
  const d = CUP.deck
  const r = CUP.lidR
  const z = CUP.lidZ
  return [[r - 3, z - 1], [r - 0.8, z - 0.4], [r, z + 1.4], [r, z + 4.6], [r - 1, z + 6], [r - 3, z + 6.6], [r - 8, z + 6.8], [r - 9.4, z + 8], [r - 11, t - 2], [r - 12.2, t - 0.4], [r - 14, t], [r - 19, t], [r - 20.6, t - 0.6], [r - 21.4, t - 2.2], [r - 22.6, d + 1.2], [r - 24, d], [40, d], [39.2, d + 0.9], [37.4, d + 0.9], [36.6, d], [0, d]]
}

function lidGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const t = CUP.top
  const d = CUP.deck
  b.add(lathe(lidProfile(), 64, 28), LID)
  const hole: V2[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    hole.push([5.2 * Math.cos(a), 2.3 * Math.sin(a)])
  }
  b.add(prism(hole, t - 0.4, t + 0.25, 0), LID_DARK, mat({ x: CUP.lidR - 16.5, rz: Math.PI / 2 }).premultiply(mat({ rz: -2.2 })))
  b.add(lathe([[1.3, d + 0.05], [1.3, d + 0.3], [0, d + 0.3]], 8), LID_DARK, mat({ x: 22 }).premultiply(mat({ rz: 0.9 })))
  b.add(ball(2.2, 8, 5), LID, mat({ x: 46, z: d - 0.6, s: [1, 1, 0.5] }).premultiply(mat({ rz: 0.9 })))
  return b.done()
}

// The lamp in the cup, as it shows: through the lid, brightest in the middle, and in the gap under the lid.
function glowGeometry(): THREE.BufferGeometry {
  const p: number[] = []
  const c: number[] = []
  const n = 48
  const lid = lidProfile().map((q) => [q[0] + 0.5, q[1] + 0.6] as V2)
  const deckR = CUP.lidR - 24
  const shine = (r: number, z: number): number => {
    if (z < CUP.lidZ + 5.4) return 0.2
    if (z < CUP.lidZ + 8) return 0.32
    if (r > deckR + 0.6) return z > CUP.top ? 0.5 : 0.27
    return 0.4 + 0.6 * Math.pow(Math.max(0, 1 - r / deckR), 1.1)
  }
  const band = (r0: number, z0: number, v0: number, r1: number, z1: number, v1: number, tint: [number, number, number] = [1, 1, 1]): void => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2
      const a1 = ((i + 1) / n) * Math.PI * 2
      const q = (r: number, a: number, z: number): number[] => [r * Math.cos(a), r * Math.sin(a), z]
      p.push(...q(r0, a0, z0), ...q(r0, a1, z0), ...q(r1, a1, z1), ...q(r0, a0, z0), ...q(r1, a1, z1), ...q(r1, a0, z1))
      for (const v of [v0, v0, v1, v0, v1, v1]) c.push(v * tint[0], v * tint[1], v * tint[2])
    }
  }
  for (let k = 1; k < lid.length; k++) {
    const a = lid[k - 1]!
    const b = lid[k]!
    if (b[0] < 30 && a[0] > 30) {
      for (let j = 0; j < 4; j++) {
        const r0 = a[0] * (1 - j / 4)
        const r1 = a[0] * (1 - (j + 1) / 4)
        band(r0, a[1], shine(r0, a[1]), r1, b[1], shine(r1, b[1]))
      }
    } else band(a[0], a[1], shine(a[0], a[1]), b[0], b[1], shine(b[0], b[1]))
  }
  band(wallR(CUP.sleeve1) + 1, CUP.sleeve1 + 0.6, 0.55, wallR(CUP.lidZ) + 4, CUP.lidZ - 1, 1, [1, 0.74, 0.4])
  band(wallR(CUP.sleeve0) + 3.2, CUP.sleeve0, 0.02, wallR(CUP.sleeve1) + 3.2, CUP.sleeve1, 0.3, [1, 0.42, 0.14])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
  g.computeBoundingSphere()
  return g
}

const bumpersOf = (z: Zone) => table.bumpers.filter((b) => b.tier === z.tier)
const SEAMS = [2.5, 3.6, 1.9]

interface Built { rings: THREE.InstancedMesh; lids: THREE.InstancedMesh; glows: THREE.Mesh[]; at: [number, number][]; m: THREE.Matrix4 }

// How far the ring is down, 0 to 1: down in three hundredths of a second, up again in a tenth.
export const ringDown = (t: number): number => (t < 0.03 ? t / 0.03 : 1 - ease(0.03, 0.13, t))
// How far the lid stands off its seat, in pixels.
export const lidJump = (t: number): number => (t > 0.7 ? 0 : 4.5 * Math.exp(-7 * t) * Math.abs(Math.sin((Math.PI * t) / 0.14)))

export const bumpers = whole('bumpers', {
  version: 'play-bumpers-12',
  build(z) {
    const g = new THREE.Group()
    g.name = `play.bumpers.${z.id}`
    const m = matsOf(z)
    const list = bumpersOf(z)
    const at = list.map((b) => {
      const p = localBalls(z, b.c[0], b.c[1])
      return [p[0], p[1]] as [number, number]
    })
    const bag = new Bag()
    at.forEach((p, i) => cup(bag, p[0], p[1], SEAMS[i % SEAMS.length]!))
    g.add(part(bag.done(), m.solid, `play.bumpers.cups.${z.id}`, { cast: true }))
    const rings = new THREE.InstancedMesh(ringGeometry(), m.solid, list.length)
    rings.name = `play.bumpers.rings.${z.id}`
    rings.receiveShadow = true
    const lids = new THREE.InstancedMesh(lidGeometry(), m.solid, list.length)
    lids.name = `play.bumpers.lids.${z.id}`
    lids.castShadow = true
    lids.receiveShadow = true
    const mm = new THREE.Matrix4()
    at.forEach((p, i) => {
      rings.setMatrixAt(i, mm.makeRotationZ(0.5 + i * 0.4).setPosition(p[0], p[1], CUP.ringRest))
      lids.setMatrixAt(i, mm.makeRotationZ(SEAMS[i % SEAMS.length]! + 2.4).setPosition(p[0], p[1], 0))
    })
    rings.computeBoundingSphere()
    lids.computeBoundingSphere()
    g.add(rings, lids)
    const groups = groupsOf(z)
    const glowShape = glowGeometry()
    const glows = list.map((b, i) => {
      const mat = lit(new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), z)
      mat.userData.unlit = true
      const glow = new THREE.Mesh(glowShape, mat)
      glow.name = `play.bumpers.lamp.${b.id}`
      glow.position.set(at[i]![0], at[i]![1], 0)
      glow.userData.lightGroup = groups.find((x) => x.name === `bumper.${i + 1}`)?.id ?? `${z.id}.bumper.${i + 1}`
      glow.renderOrder = 2
      glow.userData.order = 2
      g.add(glow)
      return glow
    })
    g.userData.built = { rings, lids, glows, at, m: mm } satisfies Built
    return g
  },
  pose(o, z, ctx: RealContext) {
    const b = o.userData.built as Built
    const L = levels(ctx, z)
    const col = colours.OFFICE_BUMPER
    bumpersOf(z).forEach((bumper, i) => {
      const t = ctx.byId.get(`bumper.${bumper.id}`)?.v?.[0] ?? 9
      const p = b.at[i]!
      b.rings.setMatrixAt(i, b.m.makeRotationZ(0.5 + i * 0.4).setPosition(p[0], p[1], CUP.ringRest - (CUP.ringRest - CUP.ringDown) * ringDown(t)))
      const jump = lidJump(t)
      b.lids.setMatrixAt(i, b.m.makeRotationZ(SEAMS[i % SEAMS.length]! + 2.4).setPosition(p[0], p[1], jump))
      const level = (L.byName[`bumper.${i + 1}`] ?? 0) * 1.5
      const glow = b.glows[i]!
      ;(glow.material as THREE.MeshBasicMaterial).color.setRGB(col[0] * level, col[1] * level, col[2] * level)
      glow.position.z = jump
      glow.visible = level > 0.004
    })
    b.rings.instanceMatrix.needsUpdate = true
    b.lids.instanceMatrix.needsUpdate = true
  },
  drop(o) {
    drop(o)
    for (const g of (o.userData.built as Built).glows) (g.material as THREE.Material).dispose()
  }
})

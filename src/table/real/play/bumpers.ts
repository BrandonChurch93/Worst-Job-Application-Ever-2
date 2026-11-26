import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, table } from '../../layout'
import { colours, groupsOf, levels } from '../lights'
import { lit } from '../light'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, box, ease, lathe, look, mat, rod, type V2 } from './g'
import { drop, matsOf, part } from './mats'

const PLATE = look(0xe6e9ec, 0.11, 1, 0)
const PRINT = look(0x20262a, 0.55, 0, 0.4)
const PRINT_PALE = look(0xd9d4c4, 0.55, 0, 0.4)
const SKIRT = look(0xe2e5e8, 0.1, 1, 0)
const PAPER = look(0x8c4a25, 0.22, 1, 0)
const KRAFT = look(0x9a562c, 0.26, 1, 0)
const KRAFT_DARK = look(0xf0f2f4, 0.09, 1, 0)
const LID = look(0xf8f7f3, 0.46, 0, 0.3)
const LID_DARK = look(0x2a2826, 0.7, 0, 0)
const CHROME = look(0xf4f6f8, 0.09, 1, 0)
const SCREW = look(0xd2d5d8, 0.26, 1, 0)

// The heights of a cup, in page pixels over the floor.
export const CUP = { foot: 12, footR: 46, rimZ: 88, rimR: 58, sleeve0: 22, sleeve1: 68, ringRest: 89, ringDown: 34, ringIn: 79.7, ringOut: 84.5, lidZ: 86, lidR: 76, deck: 100, top: 108, flutes: 60 }
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

function cup(b: Bag, x: number, y: number): void {
  const m = mat({ x, y })
  b.add(lathe([[97, 0.15], [97, 0.5], [91, 0.5]], 48), PRINT, m)
  b.add(lathe([[90.6, 0.15], [90.6, 0.6], [89.4, 0.6]], 48), PRINT_PALE, m)
  b.add(lathe([[89, 0], [89, 1.6], [87.6, 2.7], [78.4, 2.7], [77.6, 2.1], [76.4, 2.1], [75.6, 2.7], [70, 2.7]], 48), PLATE, m)
  b.add(lathe([[74.5, 2.6], [74.5, 4], [72.8, 5], [55, 12.6], [53.4, 13.6], [47.4, 13.8]], 48), SKIRT, m)
  b.add(lathe([[wallR(CUP.foot), CUP.foot], [wallR(CUP.rimZ), CUP.rimZ]], 48), PAPER, m)
  b.add(lathe([[CUP.rimR, CUP.rimZ - 2], [CUP.rimR + 2.6, CUP.rimZ - 1.2], [CUP.rimR + 3.4, CUP.rimZ + 0.8], [CUP.rimR + 2.4, CUP.rimZ + 2.6], [CUP.rimR - 1, CUP.rimZ + 3]], 48, 80), PAPER, m)
  b.add(sleeve(), KRAFT, m)
  for (const z of [CUP.sleeve0, CUP.sleeve1]) b.add(lathe([[wallR(z) + 0.2, z - 0.3], [wallR(z) + 2.7, z - 0.3], [wallR(z) + 2.7, z + 0.3], [wallR(z) + 0.2, z + 0.3]], 48), KRAFT_DARK, m)
  for (const side of [-1, 1]) {
    const s = mat({ x: x + side * 60.5, y: y + side * 60.5 })
    b.add(lathe([[4.6, 2.6], [4.6, 3.6], [3.6, 4.4], [1.6, 4.4]], 10), SCREW, s)
    b.add(box(5.6, 0.9, 0.5), LID_DARK, s.clone().multiply(mat({ z: 4.4, rz: side * 0.6 })))
  }
}

// The steel ring and its two rods, round the z axis with the ring's middle at z = 0. The ring is a round bar: it shows the lamps as lines that run right round it.
function ringGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const mid = (CUP.ringIn + CUP.ringOut) * 0.5
  const half = (CUP.ringOut - CUP.ringIn) * 0.5
  const section: V2[] = []
  for (let i = 0; i <= 12; i++) section.push([mid - half * Math.cos((i / 12) * Math.PI * 2), -half * Math.sin((i / 12) * Math.PI * 2)])
  b.add(lathe(section, 56, 50), CHROME)
  for (const side of [-1, 1]) {
    const x = side * mid
    b.add(rod([x, 0, -CUP.ringRest - 4], [x, 0, 2.6], 1.9, 8), SCREW)
  }
  return b.done()
}

// The cap is a takeaway lid, read from straight above: a rolled bead at the rim, a groove inside it, a step up to a raised ring, and a step down again to a deck that domes a little. Each point carries how much of the lamp shows through it there.
const LID_DECK = 32
const SIP = { at: 19.5, long: 8.2, wide: 4.3, turn: -0.37 }
const lidPoints = (): [number, number, number][] => {
  const r = CUP.lidR
  const z = CUP.lidZ
  const out: [number, number, number][] = [
    [r - 3.5, z - 1.5, 0.36], [r - 1, z - 1.2, 0.36], [r, z + 0.6, 0.38], [r, z + 2.6, 0.42], [r - 1.2, z + 4.2, 0.5],
    [r - 3.4, z + 4.8, 0.55], [r - 5.4, z + 4, 0.48], [r - 6.6, z + 2.8, 0.26], [r - 8.6, z + 2.8, 0.26],
    [r - 9.8, z + 5.4, 0.36], [r - 10.6, z + 10.4, 0.46], [r - 12.2, z + 12.6, 0.56], [r - 15, z + 13.5, 0.62],
    [r - 24, z + 13.9, 0.62], [r - 26.6, z + 13.3, 0.56], [r - 28, z + 11.4, 0.4], [r - 29.4, z + 9.5, 0.3], [r - LID_DECK, z + 9.2, 0.5]
  ]
  const deck = r - LID_DECK
  for (let i = 1; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2)
    out.push([deck * Math.cos(a), z + 9.2 + 2.4 * Math.sin(a), 0.5 + 0.36 * Math.pow(1 - Math.cos(a), 1.3)])
  }
  return out
}
const lidProfile = (): V2[] => lidPoints().map((q) => [q[0], q[1]])

function lidGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  b.add(lathe(lidProfile(), 64, 28), LID)
  // The drinking opening: a small oval let into the raised ring, dark inside a pressed lip. A pin hole for the air stands across the deck from it.
  const r = CUP.lidR - SIP.at
  const top = CUP.lidZ + 13.7
  const oval = mat({ x: r * Math.cos(SIP.turn), y: r * Math.sin(SIP.turn), z: top, rz: SIP.turn + Math.PI / 2, s: [SIP.long / SIP.wide, 1, 1] })
  b.add(lathe([[SIP.wide + 2.6, -0.3], [SIP.wide + 1.4, 2.2], [SIP.wide + 0.6, 2.7], [SIP.wide, 2.7], [SIP.wide - 0.5, 2.1]], 20, 60), LID, oval)
  b.add(lathe([[SIP.wide - 0.5, 2.15], [0, 2.15]], 20), LID_DARK, oval)
  b.add(lathe([[1.6, 0], [0, 0]], 8), LID_DARK, mat({ x: -(CUP.lidR - LID_DECK - 7) * Math.cos(SIP.turn), y: -(CUP.lidR - LID_DECK - 7) * Math.sin(SIP.turn), z: CUP.lidZ + 13.2 }))
  return b.done()
}

const WELL: [number, number, number] = [1, 0.97, 0.91]
const RIM: [number, number, number] = [1, 0.97, 0.9]

// The lamp in the cup, as it shows: through the lid, brightest in the middle, and in the gap under the lid.
function glowGeometry(): THREE.BufferGeometry {
  const p: number[] = []
  const c: number[] = []
  const n = 64
  const lid = lidPoints().map((q, i) => [q[0] + (i < 5 ? 0.5 : 0), q[1] + (i < 5 ? 0.6 : 0.9), q[2]] as [number, number, number])
  const deckR = CUP.lidR - LID_DECK
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
    band(a[0], a[1], a[2] * 1.4, b[0], b[1], b[2] * 1.4, b[0] < deckR + 0.6 ? WELL : RIM)
  }
  band(wallR(CUP.sleeve1) + 1, CUP.sleeve1 + 0.6, 0.55, wallR(CUP.lidZ) + 4, CUP.lidZ - 1, 1, [1, 0.86, 0.62])
  band(wallR(CUP.sleeve0) + 3.2, CUP.sleeve0, 0.02, wallR(CUP.sleeve1) + 3.2, CUP.sleeve1, 0.3, [1, 0.74, 0.46])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
  g.computeBoundingSphere()
  return g
}

const bumpersOf = (z: Zone) => table.bumpers.filter((b) => b.tier === z.tier)
const SEAMS = [2.5, 3.6, 1.9]

interface Built { rings: THREE.InstancedMesh; lids: THREE.InstancedMesh; glows: THREE.Mesh[]; at: [number, number][]; m: THREE.Matrix4; r: THREE.Matrix4; s: THREE.Vector3 }

// How far the ring is down, 0 to 1: down in three hundredths of a second, up again in a tenth.
export const ringDown = (t: number): number => (t < 0.03 ? t / 0.03 : 1 - ease(0.03, 0.13, t))
// How far the lid stands off its seat, in pixels.
export const lidJump = (t: number): number => (t < 0 || t > 0.7 ? 0 : 9 * Math.exp(-9 * t) * Math.abs(Math.cos((Math.PI * t) / 0.13)))
// The cap answers on the frame of the hit: it is thrown up toward the eye and rocks on its posts, and the ring under it is flung wide.
export const lidPop = (t: number): number => (t < 0 || t > 0.7 ? 0 : Math.exp(-11 * t))
export const lidRock = (t: number): number => (t < 0 || t > 0.7 ? 0 : 0.085 * Math.exp(-6 * t) * Math.cos((2 * Math.PI * t) / 0.1))

export const bumpers = whole('bumpers', {
  version: 'play-bumpers-26',
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
    at.forEach((p) => cup(bag, p[0], p[1]))
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
      glow.rotation.z = SEAMS[i % SEAMS.length]! + 2.4
      glow.userData.lightGroup = groups.find((x) => x.name === `bumper.${i + 1}`)?.id ?? `${z.id}.bumper.${i + 1}`
      glow.renderOrder = 2
      glow.userData.order = 2
      g.add(glow)
      return glow
    })
    g.userData.built = { rings, lids, glows, at, m: mm, r: new THREE.Matrix4(), s: new THREE.Vector3() } satisfies Built
    return g
  },
  pose(o, z, ctx: RealContext) {
    const b = o.userData.built as Built
    const L = levels(ctx, z)
    const col = colours.OFFICE_BUMPER
    bumpersOf(z).forEach((bumper, i) => {
      const t = ctx.byId.get(`bumper.${bumper.id}`)?.v?.[0] ?? 9
      const p = b.at[i]!
      const pop = lidPop(t)
      b.rings.setMatrixAt(i, b.m.makeRotationZ(0.5 + i * 0.4).scale(b.s.set(1 + 0.11 * pop, 1 + 0.11 * pop, 1)).setPosition(p[0], p[1], CUP.ringRest - (CUP.ringRest - CUP.ringDown) * ringDown(t)))
      const jump = lidJump(t)
      b.lids.setMatrixAt(i, b.m.makeRotationZ(SEAMS[i % SEAMS.length]! + 2.4).multiply(b.r.makeRotationX(lidRock(t))).scale(b.s.setScalar(1 + 0.06 * pop)).setPosition(p[0], p[1], jump))
      const level = (L.byName[`bumper.${i + 1}`] ?? 0) * 1.5
      const glow = b.glows[i]!
      ;(glow.material as THREE.MeshBasicMaterial).color.setRGB(col[0] * level, col[1] * level, col[2] * level)
      glow.position.z = jump
      glow.scale.setScalar(1 + 0.06 * pop)
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

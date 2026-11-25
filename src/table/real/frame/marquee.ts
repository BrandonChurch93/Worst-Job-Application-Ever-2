import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { BOARD } from '../../draw'
import { lit } from '../light'
import { colours, groupsOf, levels } from '../lights'
import { localOf, shapesIn, type Zone } from '../zone'
import { Geo, type V2 } from './geo'
import { Screws, TONE, aluOf, mesh, paintOf, screwOf } from './mats'
import { skyline } from './skyline'

// The housing of the marquee, in page pixels, measured from the face: `off` is out of the face, towards who looks at it.
const BOX = { rim: 20, proud: 15, deep: 46, inner: 7, innerProud: 6, bevel: 3, lamps: 15, vents: 12 }
const POCKET = { w: 472, h: 68, up: 88, bar: 7, proud: 5 }
const GLOW = { rest: 0.05, lit: 1.15, lens: 2.0 }

interface Built { face: THREE.MeshPhysicalMaterial; lens: THREE.MeshPhysicalMaterial }
const built = new WeakMap<THREE.Object3D, Built>()

export function marquee(z: Zone, ctx: RealContext): THREE.Object3D {
  const shapes = shapesIn(ctx, 'marquee', z)
  const back = shapes.find((s) => s.id === 'marquee.back')
  const stand = shapes.find((s) => s.id === 'marquee.stand')
  const o = new THREE.Group()
  o.name = `marquee.${z.id}`
  if (!back || !stand) return o
  const A = new Geo()
  const P = new Geo()
  const F = new Geo()
  const screws = new Screws()
  const w = back.w / 2
  const h = back.h
  const thick = back.z1 - back.z0
  // The middle of the board's shape lies half its thickness behind the face.
  const mid = localOf(z, back)
  const midZ = mid[2] + thick / 2
  const toBoard = new THREE.Matrix4().makeTranslation(mid[0], mid[1] - (thick / 2) * BOARD.sin, midZ + (thick / 2) * BOARD.cos).multiply(new THREE.Matrix4().makeRotationX(BOARD.turn))
  // From here on a place is (across, up the board from its middle, out of the face).
  const h2 = h / 2
  const r = BOX.rim
  const body = A.vertices
  A.box(-w - r, w + r, -h2 - r, h2 + r + BOX.lamps, -BOX.deep, -1, TONE.alu, { bevel: BOX.bevel, bottom: true })
  const frame = (x0: number, x1: number, y0: number, y1: number, along: [number, number, number]): void => {
    A.box(x0, x1, y0, y1, -1, BOX.proud, TONE.alu, { bevel: BOX.bevel, along })
  }
  frame(-w - r, w + r, h2, h2 + r + BOX.lamps, [1, 0, 0])
  frame(-w - r, w + r, -h2 - r, -h2, [1, 0, 0])
  frame(-w - r, -w, -h2, h2, [0, 1, 0])
  frame(w, w + r, -h2, h2, [0, 1, 0])
  // The hinge the board is turned on.
  for (let i = 0; i < 7; i++) {
    const x0 = -w + 30 + (i * (2 * w - 60)) / 7
    const x1 = x0 + (2 * w - 60) / 7 - 3
    A.pipe([[x0, -h2 - r - 4, -BOX.deep / 2], [x1, -h2 - r - 4, -BOX.deep / 2]], 8.5, 12, i % 2 === 0 ? TONE.alu : TONE.aluDark)
  }
  A.move(body, toBoard)
  const dark = P.vertices
  const step = BOX.inner
  const inner = (x0: number, x1: number, y0: number, y1: number): void => {
    P.box(x0, x1, y0, y1, 0, BOX.innerProud, TONE.bezel, { bevel: 1.6 })
  }
  inner(-w, w, h2 - step, h2)
  inner(-w, w, -h2, -h2 + step)
  inner(-w, -w + step, -h2 + step, h2 - step)
  inner(w - step, w, -h2 + step, h2 - step)
  // The pocket the main display sits in, under the title.
  const py = -h2 + POCKET.up
  const pw = POCKET.w / 2
  const ph = POCKET.h / 2
  inner(-pw - POCKET.bar, pw + POCKET.bar, py + ph, py + ph + POCKET.bar)
  inner(-pw - POCKET.bar, pw + POCKET.bar, py - ph - POCKET.bar, py - ph)
  inner(-pw - POCKET.bar, -pw, py - ph, py + ph)
  inner(pw, pw + POCKET.bar, py - ph, py + ph)
  P.box(-pw, pw, py - ph, py + ph, 0, 0.9, TONE.pocket)
  // Vents in the back, and the dark of the gap between the two bezels.
  for (let i = 0; i < BOX.vents; i++) {
    const x = -w * 0.72 + (i * (w * 1.44)) / (BOX.vents - 1)
    P.box(x - 26, x + 26, h2 * 0.2, h2 * 0.2 + 7, -BOX.deep - 0.6, -BOX.deep + 0.5, TONE.vent, { bottom: true })
    P.box(x - 26, x + 26, h2 * 0.2 - 16, h2 * 0.2 - 9, -BOX.deep - 0.6, -BOX.deep + 0.5, TONE.vent, { bottom: true })
  }
  P.move(dark, toBoard)
  const face = F.vertices
  F.face([[-w + step, -h2 + step, 0.4], [w - step, -h2 + step, 0.4], [w - step, h2 - step, 0.4], [-w + step, h2 - step, 0.4]], [0, 0, 1], [1, 0, 0], [1, 1, 1])
  F.map(face, (x, y) => [(x + w) / (2 * w), (y + h2) / h])
  F.move(face, toBoard)
  for (const sx of [-w - r / 2, w + r / 2]) for (const t of [-0.9, -0.3, 0.3, 0.9]) {
    const p = new THREE.Vector3(sx, t * h2, BOX.proud).applyMatrix4(toBoard)
    screws.add(p.x, p.y, p.z, 0.8, sx + t, new THREE.Vector3(0, -BOARD.sin, BOARD.cos))
  }
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Vector3(-w + 40 + (i * (2 * w - 80)) / 8, -h2 - r / 2, BOX.proud).applyMatrix4(toBoard)
    screws.add(p.x, p.y, p.z, 0.8, i * 1.3, new THREE.Vector3(0, -BOARD.sin, BOARD.cos))
  }

  // The foot: a plate bolted to the page and a brace the housing leans on.
  const sp = localOf(z, stand)
  const sw = stand.w / 2
  const sh = stand.h / 2
  const tall = stand.z1 - stand.z0
  A.box(sp[0] - sw, sp[0] + sw, sp[1] - sh, sp[1] + sh, 0, 9, TONE.alu, { bevel: 2.4 })
  const hinge = new THREE.Vector3(0, -h2 - r, -BOX.deep).applyMatrix4(toBoard)
  const lean = new THREE.Vector3(0, -h2 * 0.35, -BOX.deep).applyMatrix4(toBoard)
  const brace: V2[] = [[-(sp[1] - sh + 10), 9], [-(hinge.y - 2), Math.min(tall, hinge.z)], [-lean.y, lean.z], [-(sp[1] + sh - 16), 9]]
  for (const bx of [-0.82, -0.28, 0.28, 0.82]) A.prism(brace, [sp[0] + bx * sw - 9, 0], [sp[0] + bx * sw + 9, 0], TONE.stand)
  A.box(sp[0] - sw + 12, sp[0] + sw - 12, hinge.y - 7, hinge.y + 9, 9, Math.min(tall, hinge.z) - 2, TONE.stand, { bevel: 2 })
  for (let i = 0; i < 9; i++) for (const sy of [-sh + 9, sh - 9]) screws.add(sp[0] - sw + 18 + (i * (2 * sw - 36)) / 8, sp[1] + sy, 9, 1.25, i + sy)

  const pictures = skyline()
  const faceMat = studio(new THREE.MeshPhysicalMaterial({ map: pictures.art, emissive: 0xffffff, emissiveMap: pictures.glow, emissiveIntensity: GLOW.rest, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, specularIntensity: 0.6 }))
  faceMat.userData.lit = true
  lit(faceMat, z)
  faceMat.name = `marquee.face.${z.id}`
  faceMat.userData.own = true
  faceMat.userData.pictures = [pictures.art, pictures.glow]
  const group = groupsOf(z).find((g) => g.name === 'panel')
  const faceMesh = mesh(F, faceMat, `marquee.face.${z.id}`)
  if (group) faceMesh.userData.lightGroup = group.id
  o.add(mesh(A, aluOf(z), `marquee.metal.${z.id}`, { cast: true }))
  o.add(mesh(P, paintOf(z), `marquee.paint.${z.id}`))
  o.add(faceMesh)

  // The row of small lamps along the top edge, under their lenses.
  const lensMat = studio(new THREE.MeshPhysicalMaterial({ color: 0xe8ecf2, emissive: new THREE.Color(...colours.MARQUEE_PANEL), emissiveIntensity: 0, roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }))
  lensMat.name = `marquee.lens.${z.id}`
  lensMat.userData.own = true
  const dome = new Geo()
  dome.lathe([[7, 0], [7, 1.2], [6.2, 2.6], [4.2, 4.1], [0, 4.8]], 0, 0, 16, [1, 1, 1])
  const n = 18
  const lenses = new THREE.InstancedMesh(dome.done(), lensMat, n)
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), BOARD.turn)
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector3(-w + 30 + (i * (2 * w - 60)) / (n - 1), h2 + (r + BOX.lamps) / 2, BOX.proud).applyMatrix4(toBoard)
    lenses.setMatrixAt(i, new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)))
  }
  lenses.instanceMatrix.needsUpdate = true
  lenses.computeBoundingSphere()
  lenses.name = `marquee.lenses.${z.id}`
  lenses.userData.fine = true
  if (group) lenses.userData.lightGroup = group.id
  o.add(lenses)
  const sc = screws.mesh(screwOf(z), `marquee.screws.${z.id}`)
  if (sc) o.add(sc)
  built.set(o, { face: faceMat, lens: lensMat })
  return o
}

export function marqueePose(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  const level = levels(ctx, z).byName.panel ?? 0
  b.face.emissiveIntensity = GLOW.rest + (GLOW.lit - GLOW.rest) * level
  b.lens.emissiveIntensity = GLOW.lens * level
}

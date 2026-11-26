import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { BOARD } from '../../draw'
import { lit } from '../light'
import { ask } from '../assets'
import { BALL, MARQUEE_H, MARQUEE_Y } from '../../layout'
import { groupsOf, levels } from '../lights'
import type { Shape } from '../../../stage/types'
import { localOf, shapesIn, type Zone } from '../zone'
import { Geo, grooved, type V2 } from './geo'
import { Screws, TONE, aluOf, hex, mesh, paintOf, screwOf } from './mats'
import { skyline } from './skyline'

// The seat of the main display: a dark floor `w` by `h` in the middle of the strip, `floor` out of the face, inside a bezel `bar` wide and `proud` high. `seatOf` says where its middle is.
export const POCKET = { w: 472, h: 116, bar: 7, proud: 6, floor: 0.9, rest: 0.26 }
// The housing of the marquee, in page pixels, measured from the face: `off` is out of the face, towards who looks at it.
const BOX = { rim: 30, proud: 16, deep: 46, inner: POCKET.bar, innerProud: POCKET.proud, bevel: 4.5, vents: 12, bar: 12, barProud: 9 }
const STRIP = { slot: 4.5, pitch: 11, slotPad: 7 }
const BEAM = { thick: 16, first: 12, pitch: 400, wide: 3, deep: 1.2 }
const GLOW = { rest: 0.05, lit: 1.0 }
export const PLATE = { proud: 2.4, pad: 22, most: 0.6, bar: 2.2, floor: 0.3, dusk: hex(0x2b2236) }
// Where the foot of the face lies on the page while the board is not stood up: `boardAt` in `draw.ts` turns the board about it.
const flatFoot = (MARQUEE_Y + MARQUEE_H - 0.25) * BALL
const sky = ask('table/frame/marquee-skyline.webp', { colour: true })
export const skyReady = (): boolean => sky.ready()

const boardOf = (z: Zone, back: Shape): THREE.Matrix4 => {
  const thick = back.z1 - back.z0
  const mid = localOf(z, back)
  return new THREE.Matrix4().makeTranslation(mid[0], mid[1] - (thick / 2) * BOARD.sin, mid[2] + thick / 2 + (thick / 2) * BOARD.cos).multiply(new THREE.Matrix4().makeRotationX(BOARD.turn))
}

// How far up the board from its middle the main display's words are centred, whether they lie on the page or stand on the board.
function upOf(z: Zone, ctx: RealContext, h: number, fromBoard: THREE.Matrix4): number {
  const score = ctx.byId.get('marquee-score')
  if (!score) return -h / 2 + h * POCKET.rest
  const c = localOf(z, score)
  return score.turnX ? new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(fromBoard).y : -h / 2 + flatFoot - (score.y + score.h / 2)
}

// For the maker of the displays: the matrix that takes (across, up the board, out of the face) into the zone's frame with the middle of the seat's floor at its origin, or null where the marquee is not.
export function seatOf(z: Zone, ctx: RealContext): THREE.Matrix4 | null {
  const back = shapesIn(ctx, 'marquee', z).find((s) => s.id === 'marquee.back')
  if (!back) return null
  const toBoard = boardOf(z, back)
  const half = POCKET.h / 2 + POCKET.bar
  const up = Math.min(back.h * 0.1, Math.max(-back.h / 2 + half + 12, upOf(z, ctx, back.h, toBoard.clone().invert())))
  return toBoard.multiply(new THREE.Matrix4().makeTranslation(0, up, POCKET.floor))
}

interface Built { face: THREE.MeshPhysicalMaterial }
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
  const toBoard = boardOf(z, back)
  const fromBoard = toBoard.clone().invert()
  // From here on a place is (across, up the board from its middle, out of the face).
  const h2 = h / 2
  const r = BOX.rim
  // The main display's words say where its seat is: the strip is centred on them, whether they lie on the page or stand on the board.
  const score = ctx.byId.get('marquee-score')
  const half = POCKET.h / 2 + POCKET.bar
  const up = Math.min(h2 * 0.2, Math.max(-h2 + half + 12, upOf(z, ctx, h, fromBoard)))
  const s0 = up - half
  const s1 = up + half
  const p0 = s1 + BOX.bar
  const step = BOX.inner
  const body = A.vertices
  const dark = P.vertices
  A.box(-w - r, w + r, -h2 - r, h2 + r, -BOX.deep, -1, TONE.alu, { bevel: BOX.bevel, bottom: true })
  const frame = (x0: number, x1: number, y0: number, y1: number, along: [number, number, number]): void => {
    A.box(x0, x1, y0, y1, -1, BOX.proud, TONE.alu, { bevel: BOX.bevel, along })
  }
  frame(-w - r, w + r, h2, h2 + r, [1, 0, 0])
  frame(-w - r, w + r, -h2 - r, -h2, [1, 0, 0])
  frame(-w - r, -w, -h2, h2, [0, 1, 0])
  frame(w, w + r, -h2, h2, [0, 1, 0])
  // A fine line runs round the frame a third of the way in, as on a milled bezel.
  const line = r * 0.36
  for (const [x0, x1, y0, y1] of [[-w - r + line, w + r - line, h2 + r - line - 1.4, h2 + r - line], [-w - r + line, w + r - line, -h2 - r + line, -h2 - r + line + 1.4], [-w - r + line, -w - r + line + 1.4, -h2 - r + line, h2 + r - line], [w + r - line - 1.4, w + r - line, -h2 - r + line, h2 + r - line]] as const) {
    P.face([[x0, y0, BOX.proud + 0.15], [x1, y0, BOX.proud + 0.15], [x1, y1, BOX.proud + 0.15], [x0, y1, BOX.proud + 0.15]], [0, 0, 1], [1, 0, 0], TONE.gap)
  }
  // The bar between the picture and the display, and the sill under the display with its row of slots.
  A.box(-w, w, s1, p0, 0, BOX.barProud, TONE.alu, { bevel: 2, along: [1, 0, 0] })
  A.box(-w, w, -h2, s0, 0, BOX.barProud, TONE.alu, { bevel: 2, along: [1, 0, 0] })
  const slots = Math.floor((w * 1.5) / STRIP.pitch)
  for (let i = 0; i < slots; i++) {
    const x = -((slots - 1) * STRIP.pitch) / 2 + i * STRIP.pitch
    const y0 = -h2 + STRIP.slotPad
    const y1 = s0 - STRIP.slotPad
    if (y1 - y0 < 6) break
    P.face([[x - STRIP.slot / 2, y0, BOX.barProud + 0.15], [x + STRIP.slot / 2, y0, BOX.barProud + 0.15], [x + STRIP.slot / 2, y1, BOX.barProud + 0.15], [x - STRIP.slot / 2, y1, BOX.barProud + 0.15]], [0, 0, 1], [0, 1, 0], TONE.vent)
  }
  // The hinge the board is turned on.
  for (let i = 0; i < 7; i++) {
    const x0 = -w + 30 + (i * (2 * w - 60)) / 7
    const x1 = x0 + (2 * w - 60) / 7 - 3
    A.pipe([[x0, -h2 - r - 4, -BOX.deep / 2], [x1, -h2 - r - 4, -BOX.deep / 2]], 8.5, 12, i % 2 === 0 ? TONE.alu : TONE.aluDark)
  }
  // The picture sits inside a second, lower frame of bright aluminium.
  const lip = (x0: number, x1: number, y0: number, y1: number, along: [number, number, number]): void => {
    A.box(x0, x1, y0, y1, 0, BOX.innerProud, TONE.aluBright, { bevel: 1.6, along })
  }
  lip(-w, w, h2 - step, h2, [1, 0, 0])
  lip(-w, w, p0, p0 + step, [1, 0, 0])
  lip(-w, -w + step, p0 + step, h2 - step, [0, 1, 0])
  lip(w - step, w, p0 + step, h2 - step, [0, 1, 0])
  A.move(body, toBoard)
  const inner = (x0: number, x1: number, y0: number, y1: number): void => {
    P.box(x0, x1, y0, y1, 0, BOX.innerProud, TONE.bezel, { bevel: 1.6 })
  }
  // The seat of the main display: a dark strip the whole width of the face.
  inner(-w, w, s1 - step, s1)
  inner(-w, w, s0, s0 + step)
  inner(-w, -w + step, s0 + step, s1 - step)
  inner(w - step, w, s0 + step, s1 - step)
  P.box(-w + step, w - step, s0 + step, s1 - step, 0, POCKET.floor, TONE.pocket)
  // Vents in the back.
  for (let i = 0; i < BOX.vents; i++) {
    const x = -w * 0.72 + (i * (w * 1.44)) / (BOX.vents - 1)
    P.box(x - 26, x + 26, h2 * 0.2, h2 * 0.2 + 7, -BOX.deep - 0.6, -BOX.deep + 0.5, TONE.vent, { bottom: true })
    P.box(x - 26, x + 26, h2 * 0.2 - 16, h2 * 0.2 - 9, -BOX.deep - 0.6, -BOX.deep + 0.5, TONE.vent, { bottom: true })
  }
  P.move(dark, toBoard)
  // The title stands on a calm dark plate of its own, let into the picture in a thin bright frame, so the words are read against one dark tone and not against the sky.
  const name = ctx.byId.get('marquee-title')
  let hole: [number, number, number, number] | null = null
  if (name) {
    const c = localOf(z, name)
    const q = new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(fromBoard)
    const cy = name.turnX ? q.y : -h2 + flatFoot - (name.y + name.h / 2)
    const hw = Math.min(name.w / 2 + PLATE.pad, w * PLATE.most)
    const y0 = Math.max(p0 + step + 3, cy - name.h / 2 - PLATE.pad * 0.4)
    const y1 = Math.min(h2 - step - 3, cy + name.h / 2 + PLATE.pad * 0.4)
    hole = [q.x - hw, q.x + hw, y0, y1]
    const plate = P.vertices
    P.box(q.x - hw, q.x + hw, y0, y1, 0.05, PLATE.floor, PLATE.dusk)
    P.move(plate, toBoard)
    const frame = A.vertices
    const b = PLATE.bar
    for (const [x0, x1, ya, yb, along] of [[q.x - hw - b, q.x + hw + b, y1, y1 + b, [1, 0, 0]], [q.x - hw - b, q.x + hw + b, y0 - b, y0, [1, 0, 0]], [q.x - hw - b, q.x - hw, y0, y1, [0, 1, 0]], [q.x + hw, q.x + hw + b, y0, y1, [0, 1, 0]]] as [number, number, number, number, [number, number, number]][]) A.box(x0, x1, ya, yb, 0.3, PLATE.proud, TONE.aluDeep, { bevel: 0.8, along, top: TONE.aluDark })
    A.move(frame, toBoard)
  }
  const face = F.vertices
  const pane = (x0: number, x1: number, y0: number, y1: number): void => {
    if (x1 - x0 > 0.01 && y1 - y0 > 0.01) F.face([[x0, y0, 0.4], [x1, y0, 0.4], [x1, y1, 0.4], [x0, y1, 0.4]], [0, 0, 1], [1, 0, 0], [1, 1, 1])
  }
  const fx0 = -w + step
  const fx1 = w - step
  const fy0 = p0 + step
  const fy1 = h2 - step
  if (hole) {
    pane(fx0, hole[0], fy0, fy1)
    pane(hole[1], fx1, fy0, fy1)
    pane(hole[0], hole[1], fy0, hole[2])
    pane(hole[0], hole[1], hole[3], fy1)
  } else pane(fx0, fx1, fy0, fy1)
  F.map(face, (x, y) => [(x + w) / (2 * w), (y + h2) / h])
  F.move(face, toBoard)
  const out = new THREE.Vector3(0, -BOARD.sin, BOARD.cos)
  for (const sx of [-w - r / 2, w + r / 2]) for (const t of [-0.94, -0.32, 0.32, 0.94]) {
    const p = new THREE.Vector3(sx, t * (h2 + r / 2), BOX.proud).applyMatrix4(toBoard)
    screws.add(p.x, p.y, p.z, 0.95, sx + t, out)
  }
  for (const sy of [-h2 - r / 2, h2 + r / 2]) for (let i = 1; i < 8; i++) {
    const p = new THREE.Vector3(-w + (i * 2 * w) / 8, sy, BOX.proud).applyMatrix4(toBoard)
    screws.add(p.x, p.y, p.z, 0.95, i * 1.3 + sy, out)
  }
  for (const sx of [-w * 0.86, w * 0.86]) {
    const p = new THREE.Vector3(sx, (-h2 + s0) / 2, BOX.barProud).applyMatrix4(toBoard)
    screws.add(p.x, p.y, p.z, 0.8, sx, out)
  }

  // The foot: a plate bolted to the page and a brace the housing leans on.
  const sp = localOf(z, stand)
  const sw = stand.w / 2
  const sh = stand.h / 2
  const tall = stand.z1 - stand.z0
  A.box(sp[0] - sw, sp[0] + sw, sp[1] - sh, sp[1] + sh, 0, 9, TONE.alu, { bevel: 2.4, along: [1, 0, 0] })
  const hinge = new THREE.Vector3(0, -h2 - r, -BOX.deep).applyMatrix4(toBoard)
  const lean = new THREE.Vector3(0, -h2 * 0.35, -BOX.deep).applyMatrix4(toBoard)
  const brace: V2[] = [[-(sp[1] - sh + 10), 9], [-(hinge.y - 2), Math.min(tall, hinge.z)], [-lean.y, lean.z], [-(sp[1] + sh - 16), 9]]
  for (const bx of [-0.82, -0.28, 0.28, 0.82]) A.prism(brace, [sp[0] + bx * sw - 9, 0], [sp[0] + bx * sw + 9, 0], TONE.aluDark)
  // The beam the housing is hinged on: one ribbed extrusion across the foot.
  const beamTall = Math.min(tall, hinge.z) - 11
  const ribs = (side: number, into: 1 | -1): V2[] => {
    const out: V2[] = []
    for (let g = BEAM.first; g < beamTall - BEAM.first; g += BEAM.pitch) out.push([side, g], [side + into * BEAM.deep, g + 1.2], [side + into * BEAM.deep, g + BEAM.wide - 1.2], [side, g + BEAM.wide])
    return out
  }
  const bw = BEAM.thick / 2
  const beam: V2[] = [[-bw, 0], ...ribs(-bw, 1), [-bw, beamTall - 2.5], [-bw + 2.5, beamTall], [bw - 2.5, beamTall], [bw, beamTall - 2.5], ...ribs(bw, -1).reverse(), [bw, 0]]
  if (beamTall > 12) A.prism(beam, [sp[0] - sw + 12, hinge.y + 1], [sp[0] + sw - 12, hinge.y + 1], grooved(beam, [-bw + BEAM.deep, bw - BEAM.deep], TONE.alu, TONE.aluDark), [true, true], 9)
  for (let i = 0; i < 9; i++) for (const sy of [-sh + 9, sh - 9]) screws.add(sp[0] - sw + 18 + (i * (2 * sw - 36)) / 8, sp[1] + sy, 9, 1.25, i + sy)

  const drawn = sky.ready() ? null : skyline()
  const art = drawn ? drawn.art : sky.texture()
  const faceMat = studio(new THREE.MeshPhysicalMaterial({ map: art, emissive: 0xffffff, emissiveMap: drawn ? drawn.glow : art, emissiveIntensity: GLOW.rest, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, specularIntensity: 0.6 }))
  faceMat.userData.lit = true
  lit(faceMat, z)
  faceMat.name = `marquee.face.${z.id}`
  faceMat.userData.own = true
  if (drawn) faceMat.userData.pictures = [drawn.art, drawn.glow]
  const group = groupsOf(z).find((g) => g.name === 'panel')
  const faceMesh = mesh(F, faceMat, `marquee.face.${z.id}`)
  if (group) faceMesh.userData.lightGroup = group.id
  o.add(mesh(A, aluOf(z), `marquee.metal.${z.id}`, { cast: true }))
  o.add(mesh(P, paintOf(z), `marquee.paint.${z.id}`))
  o.add(faceMesh)
  const sc = screws.mesh(screwOf(z), `marquee.screws.${z.id}`)
  if (sc) o.add(sc)
  built.set(o, { face: faceMat })
  return o
}

export function marqueePose(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  const level = levels(ctx, z).byName.panel ?? 0
  b.face.emissiveIntensity = GLOW.rest + (GLOW.lit - GLOW.rest) * level
}

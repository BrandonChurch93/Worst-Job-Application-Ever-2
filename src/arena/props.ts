// What stands in the arena: eight pillars, two panes, a rotary gun in each corner, and the health bar in its bolted frame.
import { makeGun as makeLookGun, poseGun as poseLookGun, type Gun as LookGun } from '../boss/look1/gun'
import * as THREE from 'three'
import type { BossView, ViewCorner } from '../boss/view'
import { studio } from '../post/studio'
import type { Emitter } from '../real/types'
import { materials } from '../shell/materials'
import { merge, outlineOf, profile, roundedRect, sweep, type ProfilePoint } from '../shell/solids'
import { barDrop, clamp01, rise } from './change'
import { ARENA, EYE, PAGE, PANES, PILLARS } from './layout'

const wx = (x: number): number => x - PAGE.w / 2
const wy = (y: number): number => PAGE.h / 2 - y

const lit = (g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh => {
  const out = new THREE.Mesh(g, m)
  out.castShadow = cast
  out.receiveShadow = true
  return out
}

// A square column: four sides whose brushing runs up the column, and a top.
export function columnGeometry(side: number, high: number, bevel = 1.6): THREE.BufferGeometry {
  const o = roundedRect(side, side, 2.2, 3)
  const pts: ProfilePoint[] = [[0, 0, true], [0, high - bevel], [bevel, high]]
  const wall = sweep(o, profile(pts), true)
  const p = wall.getAttribute('position')
  const uv = wall.getAttribute('uv') as THREE.BufferAttribute
  const n = wall.getAttribute('normal')
  for (let i = 0; i < p.count; i++) {
    if (n.getZ(i) > 0.9) continue
    // Sides: the grain runs with the height.
    const round = Math.abs(n.getX(i)) > Math.abs(n.getY(i)) ? p.getY(i) : p.getX(i)
    uv.setXY(i, p.getZ(i) * 1.7, round * 6)
  }
  return wall
}

export interface Kit {
  aluminium: THREE.Material
  satin: THREE.Material
  steel: THREE.Material
  dark: THREE.Material
  chrome: THREE.Material
  glass: THREE.MeshPhysicalMaterial
  glassEdge: THREE.MeshPhysicalMaterial
  shard: THREE.MeshPhysicalMaterial
  tooth: THREE.MeshPhysicalMaterial
  orange: THREE.Material
  broken: THREE.MeshPhysicalMaterial
  fallen: THREE.MeshPhysicalMaterial
  hot: THREE.MeshBasicMaterial
  own: THREE.Material[]
  chip: THREE.Material
}

export function makeKit(): Kit {
  const m = materials()
  const glass = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.5, 0.7, 0.62), emissive: new THREE.Color(0.2, 0.3, 0.26), roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.4, specularIntensity: 0.7, transparent: true, opacity: 0.72, depthWrite: true, side: THREE.FrontSide }))
  const glassEdge = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.8, 0.93, 0.88), roughness: 0.35, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2, specularIntensity: 0.9, transparent: true, opacity: 0.9 }))
  const shard = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.62, 0.84, 0.75), emissive: new THREE.Color(0.1, 0.16, 0.14), roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, specularIntensity: 1, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, flatShading: true }))
  // What is left standing of a shattered pane: the same glass as the whole one, seen from both sides.
  const tooth = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.55, 0.76, 0.67), emissive: new THREE.Color(0.17, 0.26, 0.225), roughness: 0.3, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.15, specularIntensity: 0.9, transparent: true, opacity: 0.74, side: THREE.DoubleSide, flatShading: true }))
  const broken = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.34, 0.34, 0.355), roughness: 0.62, metalness: 0.55, specularIntensity: 0.7, flatShading: true }))
  // The upper part of a pillar that lies where it fell: the same metal, dulled by the blast, so that its broad side neither mirrors the sky nor goes black as it turns.
  const fallen = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.47, 0.47, 0.49), roughness: 0.74, metalness: 0.35, specularIntensity: 0.5 }))
  // A bit of the ceramic, broken off: the page's white, matt where it broke.
  const chip = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.84, 0.83, 0.81), roughness: 0.6, metalness: 0, specularIntensity: 0.5, flatShading: true }))
  const hot = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.1, 0.16), toneMapped: false })
  return { aluminium: m.aluminium, satin: m.aluminiumSatin, steel: m.steel, dark: m.gap, chrome: m.chrome, glass, glassEdge, shard, tooth, orange: m.orange, broken, fallen, hot, chip, own: [glass, glassEdge, shard, tooth, broken, fallen, hot, chip] }
}

export interface Pillar { root: THREE.Group; foot: THREE.Mesh; body: THREE.Mesh; x: number; y: number; order: number }

// A thing that stands: its foot at a place on the page, its top leaning up the screen as the picture has it. What is put in `root` rises by root.scale.z.
export function stand(x: number, y: number): { lean: THREE.Group; root: THREE.Group } {
  const lean = new THREE.Group()
  lean.matrixAutoUpdate = false
  // The camera's own lean, away from the middle of the page, is taken out, so that every thing leans the same way wherever it stands.
  lean.matrix.set(1, 0, ARENA.leanX - wx(x) / EYE, wx(x), 0, 1, ARENA.lean - wy(y) / EYE, wy(y), 0, 0, 1, 0, 0, 0, 0, 1)
  const root = new THREE.Group()
  lean.add(root)
  return { lean, root }
}

// After the rise nothing of a pillar moves: the eight bodies are then drawn as one thing and the eight feet as another. `show` says which bodies stand, a bit each.
export interface PillarsAsOne { bodies: THREE.Mesh; feet: THREE.Mesh; show(standing: number): void }

export function makePillars(kit: Kit): { object: THREE.Group; list: Pillar[]; one: PillarsAsOne; dispose(): void } {
  const P = ARENA.pillar
  const body = columnGeometry(P.side, P.high)
  const plate = sweep(roundedRect(P.foot, P.foot, 5, 6), profile([[0, 0, true], [0, P.footHigh - 2], [2, P.footHigh], [9, P.footHigh]]), true)
  const object = new THREE.Group()
  const baked: THREE.BufferGeometry[] = []
  const plates: THREE.BufferGeometry[] = []
  const list: Pillar[] = PILLARS.map((p, i) => {
    const { lean, root } = stand(p.x, p.y)
    const b = lit(body, kit.aluminium)
    const foot = lit(plate, kit.satin)
    foot.position.set(wx(p.x), wy(p.y), 0)
    root.add(b)
    object.add(foot, lean)
    baked.push(body.clone().applyMatrix4(lean.matrix))
    plates.push(plate.clone().translate(wx(p.x), wy(p.y), 0))
    // The inner four first, then the outer four.
    const inner = Math.abs(p.x - 960) < 500
    return { root, foot, body: b, x: p.x, y: p.y, order: (inner ? 0 : 0.28) + 0.04 * (i % 4) }
  })
  const allBodies = merge(baked)
  const allFeet = merge(plates)
  for (const g of [...baked, ...plates]) g.dispose()
  const each = body.getIndex()!.count
  const index = allBodies.getIndex()!
  const whole = Uint32Array.from(index.array as ArrayLike<number>)
  index.setUsage(THREE.DynamicDrawUsage)
  const bodies = lit(allBodies, kit.aluminium)
  const feet = lit(allFeet, kit.satin)
  bodies.name = 'arena-pillars'
  feet.name = 'arena-feet'
  for (const x of [bodies, feet]) {
    x.frustumCulled = false
    x.visible = false
    object.add(x)
  }
  let shown = (1 << PILLARS.length) - 1
  const show = (standing: number): void => {
    if (standing === shown) return
    shown = standing
    const to = index.array as Uint32Array
    let n = 0
    for (let i = 0; i < PILLARS.length; i++) {
      if (!(standing & (1 << i))) continue
      to.set(whole.subarray(i * each, (i + 1) * each), n)
      n += each
    }
    index.needsUpdate = true
    allBodies.setDrawRange(0, n)
  }
  return { object, list, one: { bodies, feet, show }, dispose: () => { body.dispose(); plate.dispose(); allBodies.dispose(); allFeet.dispose() } }
}

export interface Pane { root: THREE.Group; foot: THREE.Mesh; shade: THREE.Mesh; whole: THREE.Group; x: number; y0: number; y1: number; order: number }

export function makePanes(kit: Kit): { object: THREE.Group; list: Pane[]; dispose(): void } {
  const T = ARENA.pane
  const made: THREE.BufferGeometry[] = []
  const object = new THREE.Group()
  const shadeStuff = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false })
  const list: Pane[] = PANES.map((p, i) => {
    const long = p.y1 - p.y0
    const sheet = new THREE.BoxGeometry(T.thick, long, T.high - 3)
    sheet.translate(0, 0, (T.high - 3) / 2)
    const cap = new THREE.BoxGeometry(T.thick, long, 3)
    cap.translate(0, 0, T.high - 1.5)
    const shoe = new THREE.BoxGeometry(T.thick + 10, long + 10, 5)
    shoe.translate(0, 0, 2.5)
    made.push(sheet, cap, shoe)
    const { lean, root } = stand(p.x, (p.y0 + p.y1) / 2)
    const whole = new THREE.Group()
    const s = lit(sheet, kit.glass, false)
    s.renderOrder = 4
    const c = lit(cap, kit.glassEdge, false)
    c.renderOrder = 5
    whole.add(s, c)
    const rail = lit(shoe, kit.satin)
    rail.position.set(wx(p.x), wy((p.y0 + p.y1) / 2), 0)
    root.add(whole)
    // Light through glass: a soft green shade on the ground where the key would throw the pane's shadow, in place of a hard dark one.
    const shadeGeo = paneShade(p.x, p.y0, p.y1)
    made.push(shadeGeo)
    const shade = new THREE.Mesh(shadeGeo, shadeStuff)
    shade.position.z = 0.5
    shade.frustumCulled = false
    object.add(rail, lean, shade)
    return { root, foot: rail, shade, whole, x: p.x, y0: p.y0, y1: p.y1, order: 0.5 + 0.08 * i }
  })
  return { object, list, dispose: () => { made.forEach((g) => g.dispose()); shadeStuff.dispose() } }
}

// The shade of a pane: a sheet on the ground that runs from the pane's foot the way the key's shadows fall, green and strong at the foot, gone at its far edge and at both ends.
function paneShade(x: number, y0: number, y1: number): THREE.BufferGeometry {
  const reach = { x: 250, y: 120 }
  const tint = [0.5, 0.72, 0.63]
  const cols = 9, rows = 7
  const pos: number[] = [], col: number[] = [], idx: number[] = []
  for (let r = 0; r <= rows; r++) {
    const t = r / rows
    for (let c = 0; c <= cols; c++) {
      const u = -0.1 + 1.2 * (c / cols)
      const ends = Math.min(1, Math.max(0, Math.min(u + 0.1, 1.1 - u) / 0.22))
      const a = ends * ends * (3 - 2 * ends) * (1 - t) ** 1.6 * (r === 0 ? 0.9 : 1)
      pos.push(wx(x + reach.x * t), wy(y0 + (y1 - y0) * u + reach.y * t), 0)
      col.push(1 + (tint[0]! - 1) * a, 1 + (tint[1]! - 1) * a, 1 + (tint[2]! - 1) * a)
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1
      idx.push(a, b, d, b, e, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// The corner guns are the rotary gun of the boss's own sides (src/boss/look1/gun.ts), a little larger.
export interface Gun { root: THREE.Group; look: LookGun; order: number }

let dotMade: THREE.DataTexture | null = null
// A soft round dot, bright in the middle, for a flash or a puff.
export function softDot(): THREE.DataTexture {
  if (dotMade) return dotMade
  const n = 64
  const data = new Uint8Array(n * n * 4)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - (n - 1) / 2, y - (n - 1) / 2) / (n / 2)
      const v = Math.max(0, 1 - d)
      const a = Math.round(255 * v * v * (3 - 2 * v))
      data.set([255, 255, 255, a], (y * n + x) * 4)
    }
  }
  dotMade = new THREE.DataTexture(data, n, n, THREE.RGBAFormat)
  dotMade.magFilter = THREE.LinearFilter
  dotMade.minFilter = THREE.LinearFilter
  dotMade.needsUpdate = true
  return dotMade
}

export function makeGuns(_kit: Kit): { object: THREE.Group; list: Gun[]; dispose(): void } {
  const object = new THREE.Group()
  const list: Gun[] = ARENA.corners.map((c, i) => {
    const look = makeLookGun()
    const root = new THREE.Group()
    root.position.set(wx(c.x), wy(c.y), 0)
    root.add(look.root)
    object.add(root)
    return { root, look, order: 0.86 + 0.045 * i }
  })
  return { object, list, dispose: () => list.forEach((g) => g.look.dispose()) }
}

export const GUN_LIGHT = { tell: { colour: [1, 0.42, 0.1] as [number, number, number], power: 0.5, reach: 150 }, fire: { colour: [1, 0.62, 0.25] as [number, number, number], power: 1.4, reach: 260 } }

export function poseGun(gun: Gun, c: ViewCorner, time: number, light?: (e: Emitter) => void): void {
  const up = rise(time, gun.order)
  gun.root.visible = up > 0
  if (!gun.root.visible) return
  const k = ARENA.gun.scale
  gun.root.position.set(wx(c.x), wy(c.y), 0)
  gun.root.scale.set(k, k, k * Math.max(0.02, up))
  const tell = clamp01(c.tell)
  const since = c.firedAt === null ? 9 : time - c.firedAt
  const kick = since >= 0 && since < 0.5 ? Math.exp(-since / 0.07) : 0
  const flash = since >= 0 && since < 0.09 ? 1 - since / 0.09 : 0
  // 0 along +x, growing clockwise on the page: on the page y runs down, here it runs up. The cluster spins up with the tell; its angle is a function of the time alone.
  poseLookGun(gun.look, { yaw: -c.aim, spin: time * 26 * tell * tell + (since >= 0 && since < 0.4 ? since * 30 * (1 - since / 0.4) : 0), recoil: 16 * kick + 7 * tell, lamp: tell, flash })
  if (light) {
    const reach = ARENA.gun.reach
    const mx = c.x + Math.cos(c.aim) * reach, my = c.y + Math.sin(c.aim) * reach
    if (flash > 0) light({ x: mx, y: my, z: 36, colour: GUN_LIGHT.fire.colour, power: GUN_LIGHT.fire.power * flash, reach: GUN_LIGHT.fire.reach })
    else if (tell > 0.3) light({ x: mx, y: my, z: 34, colour: GUN_LIGHT.tell.colour, power: GUN_LIGHT.tell.power * tell, reach: GUN_LIGHT.tell.reach })
  }
}

export interface Bar { root: THREE.Group; fill: THREE.Mesh; rest: Float32Array; full: number; now: number }

export function makeBar(kit: Kit): { bar: Bar; dispose(): void } {
  const B = ARENA.bar
  const w = B.x1 - B.x0, h = B.y1 - B.y0
  const trackW = w - B.trackInset * 2 - 14, trackH = B.trackHalf * 2
  const outer = roundedRect(w, h, 13, 8)
  const wall = sweep(outer, profile([[0, 0, true], [0, B.high - 2.2], [2.2, B.high]]), false)
  const shape = new THREE.Shape()
  for (let i = 0; i < outer.count; i++) {
    const x = outer.x[i]! - 2.2 * outer.nx[i]!, y = outer.y[i]! - 2.2 * outer.ny[i]!
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const hole = outlineOf({ kind: 'capsule', w: trackW + 3, h: trackH + 3 }, 0, 18)
  const path = new THREE.Path()
  for (let i = 0; i < hole.count; i++) {
    if (i === 0) path.moveTo(hole.x[i]!, hole.y[i]!)
    else path.lineTo(hole.x[i]!, hole.y[i]!)
  }
  path.closePath()
  shape.holes.push(path)
  const top = new THREE.ShapeGeometry(shape)
  top.translate(0, 0, B.high)
  const tp = top.getAttribute('position')
  const tuv = top.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < tp.count; i++) tuv.setXY(i, tp.getX(i), tp.getY(i))
  const lip = sweep(hole, profile([[0, B.high, true], [1.5, B.high - 1.4], [1.5, 2.5, true]]), false)
  const floor = sweep(outlineOf({ kind: 'capsule', w: trackW, h: trackH }, 0, 18), [{ inset: 0, z: 2.5, out: 0, up: 1 }])
  const frame = merge([wall, top, lip])
  // Two bolts at each end.
  const bolts: THREE.BufferGeometry[] = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const head = sweep(outlineOf({ kind: 'disc', w: 13, h: 13 }), profile([[0, 0, true], [0, 2.2], [1.4, 3.2], [6.5, 3.4]]), true)
      head.translate(sx * (w / 2 - 15), sy * (h / 2 - 17), B.high)
      bolts.push(head)
    }
  }
  const boltGeo = merge(bolts)
  const fullW = trackW - 3, fillH = trackH - 3
  const half = fillH / 2
  const fillGeo = sweep(outlineOf({ kind: 'capsule', w: fullW, h: fillH }, 0, 18), profile([[0, 2.5, true], [0, 5], [1.2, 7.4], [3.4, 8.8], [half * 0.5, 9.6], [half * 0.97, 9.9]]))
  const root = new THREE.Group()
  root.position.set(wx((B.x0 + B.x1) / 2), wy((B.y0 + B.y1) / 2), 0)
  const floorStuff = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.02, 0.022), roughness: 0.6, metalness: 0.3 }))
  const fill = lit(fillGeo, kit.orange)
  fill.frustumCulled = false
  root.add(lit(frame, kit.aluminium), lit(floor, floorStuff, false), lit(boltGeo, kit.chrome), fill)
  const rest = Float32Array.from(fillGeo.getAttribute('position').array as ArrayLike<number>)
  return {
    bar: { root, fill, rest, full: fullW, now: fullW },
    dispose: () => { for (const g of [wall, top, lip, floor, frame, boltGeo, fillGeo]) g.dispose(); floorStuff.dispose() }
  }
}

export function poseBar(bar: Bar, view: BossView): void {
  const d = barDrop(view.time)
  bar.root.visible = d.shown > 0
  if (!bar.root.visible) return
  bar.root.position.z = d.lift
  const fillH = ARENA.bar.trackHalf * 2 - 8
  const health = clamp01(view.boss.health)
  bar.fill.visible = health > 0.004
  const w = Math.max(fillH, bar.full * health)
  if (Math.abs(w - bar.now) < 0.01) return
  bar.now = w
  const at = bar.fill.geometry.getAttribute('position') as THREE.BufferAttribute
  const shift = bar.full - w
  // The left end stays where it is; the right end comes to meet it.
  for (let i = 0; i < at.count; i++) {
    const x = bar.rest[i * 3]!
    at.setX(i, x > 0.01 ? x - shift : x < -0.01 ? x : x - shift / 2)
  }
  at.needsUpdate = true
}

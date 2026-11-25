import * as THREE from 'three'
import { config } from '../../../config'
import { hash01, hashName } from '../../../core/random'
import type { PartMaker, RealContext } from '../../../real/types'
import { circle, merge } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { TURRET } from '../turrets'
import { BRUSH, kit, lit, turn } from './keyboard-kit'
import { EMIT, fx, GLOW, overlay } from './turret-fx'

const heights = config.scale.heights

export const TURRET_LOOK = {
  collar: 46, head: 40, axis: -17, muzzle: 98, sunk: 9, socket: 56, socketDepth: 36, bezel: 63.5, door: 58, doorDrop: 2.2,
  flashSeconds: 0.05, steam: 6, sparks: 8
}

const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}
const m4 = new THREE.Matrix4()
const q4 = new THREE.Quaternion()
const e3 = new THREE.Euler()
const v3 = new THREE.Vector3()
const w3 = new THREE.Vector3()
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

interface Shared {
  collar: THREE.BufferGeometry
  head: THREE.BufferGeometry
  headDark: THREE.BufferGeometry
  barrel: THREE.BufferGeometry
  barrelDark: THREE.BufferGeometry
  bezel: THREE.BufferGeometry
  socket: THREE.BufferGeometry
  door: THREE.BufferGeometry
}

let shared: Shared | null = null

function along(g: THREE.BufferGeometry): THREE.BufferGeometry {
  return g.rotateY(Math.PI / 2)
}

function place(g: THREE.BufferGeometry, x: number, y: number, z: number, turnZ = 0): THREE.BufferGeometry {
  if (turnZ) g.rotateZ(turnZ)
  return g.translate(x, y, z)
}

function flat(points: [number, number][], z: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ShapeGeometry(shape)
  g.translate(0, 0, z)
  return g
}

function slot(w: number, h: number): [number, number][] {
  const out: [number, number][] = []
  const r = h / 2
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI
    out.push([w / 2 - r + Math.cos(a) * r, Math.sin(a) * r])
  }
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI / 2 + (i / 6) * Math.PI
    out.push([-w / 2 + r + Math.cos(a) * r, Math.sin(a) * r])
  }
  return out
}

function geometries(): Shared {
  if (shared) return shared
  const L = TURRET_LOOK
  const collar = turn([[L.collar, -112], [L.collar, -48], [L.collar - 2, -46], [L.head + 1.2, -46], [L.head + 1.2, -50]], 56, 4)
  const fillet = 9
  const crown: [number, number][] = []
  for (let i = 1; i <= 6; i++) crown.push([L.head - fillet + fillet * Math.cos((i * Math.PI) / 12), -fillet + fillet * Math.sin((i * Math.PI) / 12)])
  for (let i = 3; i >= 0; i--) crown.push([((L.head - fillet) * i) / 4, 1.1 * (1 - (i / 4) ** 2)])
  const headParts: THREE.BufferGeometry[] = [
    turn([[L.head, -56], [L.head, -30], [L.head - 0.9, -29.2], [L.head - 0.9, -27.8], [L.head, -27], [L.head, -fillet], ...crown], 56, 4)
  ]
  const headDark: THREE.BufferGeometry[] = []
  headDark.push(place(turn([[17.4, 0], [17.4, 4.5], [16, 5.2], [16, 0]], 24, 1), 0, 0, 0).rotateY(Math.PI / 2).translate(L.head - 1.5, 0, L.axis))
  const barrel = along(turn([[15.4, 24], [15.4, 45], [14.4, 46], [13.4, 46], [10.6, 83], [12.9, 84.2], [12.9, 87.4], [12.1, 88.1], [12.1, 89.5], [12.9, 90.2], [12.9, 96.4], [11.6, L.muzzle], [7.8, L.muzzle]], 28, 2))
  const barrelDark = along(turn([[7.8, L.muzzle], [7.8, 84], [0, 84]], 20, 1))
  const bezel = turn([[L.bezel, -0.2], [L.bezel - 1.1, 0.9], [L.socket + 1.6, 0.9], [L.socket, -0.6]], 64, 5)
  const socket = merge([turn([[L.socket, -0.6], [L.socket, -L.socketDepth], [0, -L.socketDepth]], 48, 1)])
  const half = circle(L.door, 64)
  const pts: [number, number][] = []
  for (let i = 0; i <= 32; i++) pts.push([half.x[i]!, Math.max(0.35, half.y[i]!)])
  const lid = flat(pts, 0)
  const lu = lid.getAttribute('uv')
  for (let i = 0; i < lu.count; i++) lu.setXY(i, lid.getAttribute('position').getX(i) / BRUSH.u, lid.getAttribute('position').getY(i) / BRUSH.v)
  shared = { collar, head: merge(headParts), headDark: merge(headDark), barrel, barrelDark, bezel, socket, door: lid }
  return shared
}

interface TurretData {
  rise: THREE.Group
  head: THREE.Group
  barrel: THREE.Group
  metal: THREE.MeshPhysicalMaterial
  steel: THREE.MeshPhysicalMaterial
  cool: [THREE.Color, THREE.Color]
  charge: THREE.Mesh
  chargeMaterial: THREE.MeshBasicMaterial
  sparks: THREE.InstancedMesh
  flash: THREE.Mesh
  flashMaterial: THREE.MeshBasicMaterial
  steam: THREE.Mesh[]
  steamMaterials: THREE.MeshBasicMaterial[]
  seed: number
}

function makeTurret(s: Shape): THREE.Object3D {
  const k = kit()
  const f = fx()
  const g = geometries()
  const root = new THREE.Group()
  const rise = new THREE.Group()
  const head = new THREE.Group()
  const barrel = new THREE.Group()
  const own = (from: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial => {
    const m = from.clone()
    m.onBeforeCompile = from.onBeforeCompile
    m.customProgramCacheKey = from.customProgramCacheKey
    m.emissive = new THREE.Color(0, 0, 0)
    return m
  }
  const metal = own(k.turned)
  const steel = own(k.barrel)
  rise.add(new THREE.Mesh(g.collar, metal))
  const slots = new THREE.Mesh(g.headDark, k.dark)
  const bore = new THREE.Mesh(g.barrelDark, k.dark)
  head.add(new THREE.Mesh(g.head, metal), slots)
  barrel.add(new THREE.Mesh(g.barrel, steel), bore)
  barrel.position.z = TURRET_LOOK.axis
  head.add(barrel)
  rise.add(head)
  root.add(rise)
  lit(root)
  slots.castShadow = false
  bore.castShadow = false
  const chargeMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(...GLOW.chargeLow), toneMapped: false })
  const charge = overlay(new THREE.Mesh(f.orb, chargeMaterial))
  charge.position.set(TURRET_LOOK.muzzle + 1, 0, 0)
  barrel.add(charge)
  const sparks = overlay(new THREE.InstancedMesh(f.orb, chargeMaterial, TURRET_LOOK.sparks), 1) as THREE.InstancedMesh
  sparks.frustumCulled = false
  barrel.add(sparks)
  const flashMaterial = f.flashMaterial.clone()
  const flash = overlay(new THREE.Mesh(f.quad, flashMaterial), 2)
  flash.position.set(TURRET_LOOK.muzzle + 6, 0, 2)
  barrel.add(flash)
  const steam: THREE.Mesh[] = []
  const steamMaterials: THREE.MeshBasicMaterial[] = []
  for (let i = 0; i < TURRET_LOOK.steam; i++) {
    const m = f.puffMaterial.clone()
    m.color.setRGB(1, 1, 1)
    const puff = overlay(new THREE.Mesh(f.quad, m), 3 + i)
    steam.push(puff)
    steamMaterials.push(m)
    rise.add(puff)
  }
  const data: TurretData = { rise, head, barrel, metal, steel, cool: [metal.color.clone(), steel.color.clone()], charge, chargeMaterial, sparks, flash, flashMaterial, steam, steamMaterials, seed: hashName(s.id) & 0xffff }
  root.userData.turret = data
  return root
}

function poseTurret(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const d = o.userData.turret as TurretData
  const v = s.v ?? [1, 0, 0, 1, 0, 0, 1, 0]
  const full = heights.turret - heights.keyboardDeck
  const up = Math.min(1, Math.max(0, (s.z1 - s.z0) / full))
  d.rise.position.z = s.z1 - s.z0 - TURRET_LOOK.sunk * (1 - smooth(up * 4))
  const a = Math.atan2(v[1]!, v[0]!)
  d.head.rotation.z = -a
  const charge = Math.min(1, Math.max(0, v[2]!))
  const since = v[3]!
  const heat = Math.min(1, Math.max(0, v[4]!))
  const kick = since < 0.12 ? -5 * Math.exp(-since / 0.03) * Math.sin(Math.min(1, since / 0.03) * Math.PI * 0.5) : 0
  d.barrel.position.x = -v[5]! * 0.55 + kick
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const tip = TURRET_LOOK.muzzle + 2 + d.barrel.position.x
  const mx = cx + Math.cos(a) * tip
  const my = cy + Math.sin(a) * tip
  const mz = s.z0 + d.rise.position.z + TURRET_LOOK.axis

  d.charge.visible = charge > 0.02
  d.sparks.visible = false
  if (d.charge.visible) {
    const flicker = 0.88 + 0.12 * Math.sin(ctx.time * 91 + d.seed)
    const r = (1.6 + 4.6 * charge * charge) * flicker
    d.charge.scale.set(r, r, r)
    d.chargeMaterial.color.setRGB(...mix(GLOW.chargeLow, GLOW.chargeHigh, charge))
    d.sparks.visible = charge < 0.96
    for (let i = 0; i < TURRET_LOOK.sparks; i++) {
      const life = (charge * 2.2 + hash01(i, 3, d.seed)) % 1
      const dir = hash01(i, 5, d.seed) * Math.PI * 2
      const tilt = (hash01(i, 7, d.seed) - 0.3) * 1.6
      const far = (1 - life) ** 1.6 * (16 + 14 * hash01(i, 9, d.seed))
      const size = 0.35 + 0.9 * life * charge
      d.sparks.setMatrixAt(i, m4.compose(v3.set(TURRET_LOOK.muzzle + 1 + Math.cos(tilt) * Math.abs(Math.cos(dir)) * far, Math.sin(dir) * far, Math.sin(tilt) * far * 0.6), q4.identity(), w3.set(size, size, size)))
    }
    d.sparks.instanceMatrix.needsUpdate = true
    ctx.light({ x: mx, y: my, z: mz, colour: EMIT.charge.colour, power: EMIT.charge.power * charge * charge * flicker, reach: EMIT.charge.reach })
  }

  const flashing = since < TURRET_LOOK.flashSeconds && up >= 1
  d.flash.visible = flashing
  if (flashing) {
    const t = since / TURRET_LOOK.flashSeconds
    const power = (1 - t) ** 1.5
    const size = 86 + 44 * t
    d.flash.scale.set(size, size, 1)
    d.flash.rotation.z = hash01(Math.round(v[7] ?? 0), 13, d.seed) * Math.PI * 2
    d.flashMaterial.color.setRGB(GLOW.flash[0] * power, GLOW.flash[1] * power, GLOW.flash[2] * power)
    ctx.light({ x: mx + Math.cos(a) * 8, y: my + Math.sin(a) * 8, z: mz + 4, colour: EMIT.flash.colour, power: EMIT.flash.power * power, reach: EMIT.flash.reach })
  }

  const glow = heat * (0.85 + 0.15 * Math.sin(ctx.time * 2.3 + d.seed))
  d.metal.emissive.setRGB(GLOW.hot[0] * glow, GLOW.hot[1] * glow, GLOW.hot[2] * glow)
  d.steel.emissive.setRGB(GLOW.hot[0] * glow * 2.2, GLOW.hot[1] * glow * 3.2, GLOW.hot[2] * glow * 2.2)
  d.metal.color.copy(d.cool[0]).multiplyScalar(1 - 0.94 * heat)
  d.steel.color.copy(d.cool[1]).multiplyScalar(1 - 0.94 * heat)
  if (heat > 0.02) ctx.light({ x: cx, y: cy, z: s.z1 + 6, colour: EMIT.hot.colour, power: EMIT.hot.power * glow, reach: EMIT.hot.reach })
  d.steam.forEach((puff, i) => {
    puff.visible = heat > 0.02
    if (!puff.visible) return
    const u = (ctx.time * 0.42 + i / TURRET_LOOK.steam + hash01(i, 17, d.seed)) % 1
    const sway = Math.sin(ctx.time * 1.7 + i * 2.1 + d.seed) * (6 + 14 * u)
    const from = hash01(i, 19, d.seed) * Math.PI * 2
    const size = 30 + 84 * u
    puff.position.set(Math.cos(from) * 18 + sway + (d.seed & 1 ? -1 : 1) * 30 * u, Math.sin(from) * 18 + 96 * u, 6 + 110 * u)
    puff.scale.set(size, size, 1)
    puff.rotation.z = from + u * 1.3
    d.steamMaterials[i]!.opacity = 0.62 * heat * smooth(u / 0.18) * (1 - u) ** 1.3
  })
}

interface HatchData { doors: THREE.InstancedMesh }

function makeHatch(): THREE.Object3D {
  const k = kit()
  const g = geometries()
  const root = new THREE.Group()
  root.add(new THREE.Mesh(g.bezel, k.turned), new THREE.Mesh(g.socket, k.seat))
  const doors = new THREE.InstancedMesh(g.door, k.deck, 2)
  doors.frustumCulled = false
  root.add(doors)
  lit(root, false, true)
  const data: HatchData = { doors }
  root.userData.hatch = data
  return root
}

function poseHatch(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const d = o.userData.hatch as HatchData
  const side = s.id.endsWith('1') ? 1 : 0
  const turret = ctx.byId.get(`turret-${side}`)
  const open = turret?.v ? smooth(turret.v[6] ?? 1) : turret ? 1 : 0
  const slide = open * (TURRET_LOOK.door + 3)
  d.doors.setMatrixAt(0, m4.compose(v3.set(0, slide, -TURRET_LOOK.doorDrop), q4.identity(), w3.set(1, 1, 1)))
  d.doors.setMatrixAt(1, m4.compose(v3.set(0, -slide, -TURRET_LOOK.doorDrop), q4.setFromEuler(e3.set(0, 0, Math.PI)), w3.set(1, 1, 1)))
  d.doors.instanceMatrix.needsUpdate = true
}

interface BoltData { head: THREE.Mesh; tails: THREE.InstancedMesh }

function makeBolt(): THREE.Object3D {
  const f = fx()
  const root = new THREE.Group()
  const len = TURRET.bolt
  const head = overlay(new THREE.Mesh(f.head, f.headMaterial), 6)
  head.scale.set(9, 3.8, 3.8)
  head.position.set(len / 2 - 11, 0, 8)
  const tails = overlay(new THREE.InstancedMesh(f.tail, f.tailMaterial, 2), 4) as THREE.InstancedMesh
  tails.frustumCulled = false
  root.add(tails, head)
  const data: BoltData = { head, tails }
  root.userData.bolt = data
  return root
}

function poseBolt(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const d = o.userData.bolt as BoltData
  const born = s.v ? Math.min(1, Math.max(0, s.v[1] ?? 1)) : 1
  const flick = 0.92 + 0.08 * Math.sin(ctx.time * 140 + (hashName(s.id) & 255))
  v3.set(TURRET.bolt / 2 - 12, 0, 8)
  d.tails.setMatrixAt(0, m4.compose(v3, q4.identity(), w3.set(30 + 82 * born, 3.8 * flick, 3.8 * flick)))
  d.tails.setMatrixAt(1, m4.compose(v3, q4, w3.set(14 + 34 * born, 2.2, 2.2)))
  d.tails.instanceMatrix.needsUpdate = true
  const a = s.rot ?? 0
  const half = TURRET.bolt / 2 - 9
  ctx.light({ x: s.x + s.w / 2 + Math.cos(a) * half, y: s.y + s.h / 2 + Math.sin(a) * half, z: s.z0 + 8, colour: EMIT.bolt.colour, power: EMIT.bolt.power * flick, reach: EMIT.bolt.reach, shadow: true })
}

interface ScorchData {
  mark: THREE.Mesh
  geometry: THREE.BufferGeometry
  material: THREE.MeshBasicMaterial
  smoke: THREE.Mesh[]
  smokeMaterials: THREE.MeshBasicMaterial[]
  seed: number
  wide: number
  tall: number
  turn: number
  at: [number, number]
  sparks: THREE.InstancedMesh
  sparkMaterial: THREE.MeshBasicMaterial
}

const SCORCH = { size: 62, smoke: 2, smokeSeconds: 1.5, shoulder: 4.5, core: 14, sparks: 9, sparkSeconds: 0.55, fall: 900, ember: 0.35, snap: 36 }

function makeScorch(s: Shape): THREE.Object3D {
  const f = fx()
  const root = new THREE.Group()
  const seed = hashName(s.id) & 0xffff
  const material = f.scorchMaterial.clone()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  const mark = overlay(new THREE.Mesh(geometry, material), -8)
  mark.frustumCulled = false
  mark.position.z = 1.25
  root.add(mark)
  const wide = SCORCH.size * (0.85 + 0.3 * hash01(seed, 1, 2))
  const smoke: THREE.Mesh[] = []
  const smokeMaterials: THREE.MeshBasicMaterial[] = []
  for (let i = 0; i < SCORCH.smoke; i++) {
    const m = f.puffMaterial.clone()
    m.color.setRGB(0.42, 0.4, 0.38)
    const puff = overlay(new THREE.Mesh(f.quad, m), 10 + i)
    smoke.push(puff)
    smokeMaterials.push(m)
    root.add(puff)
  }
  const sparkMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(...GLOW.chargeHigh), toneMapped: false })
  const sparks = overlay(new THREE.InstancedMesh(f.orb, sparkMaterial, SCORCH.sparks), 20) as THREE.InstancedMesh
  sparks.frustumCulled = false
  root.add(sparks)
  const data: ScorchData = { mark, geometry, material, smoke, smokeMaterials, sparks, sparkMaterial, seed, wide, tall: wide * (0.85 + 0.25 * hash01(seed, 3, 4)), turn: hash01(seed, 5, 6) * Math.PI * 2, at: [0, 0] }
  root.userData.scorch = data
  return root
}

// A scorch lies on the top of the cap it struck, or of the nearest cap when it struck a gap, and ends at that cap's shoulder.
function layScorch(d: ScorchData, s: Shape, ctx: RealContext): void {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const reach = Math.max(d.wide, d.tall) / 2
  let ox = 0
  let oy = 0
  let x0 = -reach
  let x1 = reach
  let y0 = -reach
  let y1 = reach
  let cap: Shape | null = null
  let near = SCORCH.snap
  for (const c of ctx.list) {
    if (c.role !== 'keycap' || c.kind === 'text' || Math.abs(c.z1 - s.z0) > 3) continue
    const far = Math.hypot(Math.max(c.x - cx, 0, cx - c.x - c.w), Math.max(c.y - cy, 0, cy - c.y - c.h))
    if (far >= near) continue
    near = far
    cap = c
  }
  if (cap) {
    const e = SCORCH.shoulder
    const left = cap.x + e - cx
    const right = cap.x + cap.w - e - cx
    const low = -(cap.y + cap.h - e - cy)
    const high = -(cap.y + e - cy)
    const m = Math.min(SCORCH.core, (right - left) / 2, (high - low) / 2)
    ox = Math.min(right - m, Math.max(left + m, 0))
    oy = Math.min(high - m, Math.max(low + m, 0))
    x0 = Math.max(ox - reach, left)
    x1 = Math.min(ox + reach, right)
    y0 = Math.max(oy - reach, low)
    y1 = Math.min(oy + reach, high)
  }
  d.at = [ox, oy]
  d.mark.visible = x1 > x0 && y1 > y0
  if (!d.mark.visible) return
  const p = d.geometry.getAttribute('position') as THREE.BufferAttribute
  const uv = d.geometry.getAttribute('uv') as THREE.BufferAttribute
  const cos = Math.cos(d.turn)
  const sin = Math.sin(d.turn)
  const corners: [number, number][] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  corners.forEach(([x, y], i) => {
    p.setXYZ(i, x, y, 0)
    uv.setXY(i, 0.5 + ((x - ox) * cos + (y - oy) * sin) / d.wide, 0.5 + ((y - oy) * cos - (x - ox) * sin) / d.tall)
  })
  p.needsUpdate = true
  uv.needsUpdate = true
}

function poseScorch(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const d = o.userData.scorch as ScorchData
  const left = s.v ? s.v[0]! : 1
  const age = (1 - left) * TURRET.scorchSeconds
  layScorch(d, s, ctx)
  d.material.opacity = smooth((left * TURRET.scorchSeconds) / TURRET.scorchFade)
  const ember = Math.exp(-age / SCORCH.ember)
  const spent = age / SCORCH.sparkSeconds
  d.sparkMaterial.color.setRGB(...mix(GLOW.chargeHigh, GLOW.boltTail, Math.min(1, spent)))
  d.sparks.visible = spent < 1 && left * TURRET.scorchSeconds > TURRET.scorchFade
  for (let i = 0; d.sparks.visible && i < SCORCH.sparks; i++) {
    const out = 50 + 130 * hash01(i, d.seed, 31)
    const up = 150 + 170 * hash01(i, d.seed, 32)
    const t = age * (0.8 + 0.4 * hash01(i, d.seed, 33))
    const z = 2 + up * t - (SCORCH.fall / 2) * t * t
    const a = hash01(i, d.seed, 34) * Math.PI * 2
    const long = z > 0 ? 1.2 + 3.2 * (1 - spent) : 0
    q4.setFromEuler(e3.set(0, -Math.atan2(up - SCORCH.fall * t, out), a, 'ZYX'))
    d.sparks.setMatrixAt(i, m4.compose(v3.set(d.at[0] + Math.cos(a) * out * t, d.at[1] + Math.sin(a) * out * t, Math.max(0, z)), q4, w3.set(long, long > 0 ? 0.85 : 0, long > 0 ? 0.85 : 0)))
  }
  if (d.sparks.visible) d.sparks.instanceMatrix.needsUpdate = true
  d.material.color.setRGB(1 + 6 * ember, 1 + 6 * ember, 1 + ember)
  d.smoke.forEach((puff, i) => {
    const u = age / SCORCH.smokeSeconds - i * 0.22
    puff.visible = u > 0 && u < 1 && left * TURRET.scorchSeconds > TURRET.scorchFade
    if (!puff.visible) return
    const sway = Math.sin(u * 5 + i * 1.9 + d.seed) * 7 * u
    const size = 12 + 34 * u
    puff.position.set(d.at[0] + sway - 10 * u, d.at[1] + 46 * u, 4 + 70 * u)
    puff.scale.set(size, size * 1.25, 1)
    puff.rotation.z = hash01(i, d.seed, 21) * 6.28 + u
    d.smokeMaterials[i]!.opacity = 0.36 * smooth(u / 0.15) * (1 - u) ** 1.5
  })
}

const kind = (s: Shape): 'hatch' | 'turret' | 'bolt' | 'scorch' | 'part' | null => {
  if (s.role === 'hatch') return 'hatch'
  if (/^turret-\d+$/.test(s.id)) return 'turret'
  if (/^bolt-\d+$/.test(s.id)) return 'bolt'
  if (/^scorch-\d+$/.test(s.id)) return 'scorch'
  if (/^(turret|bolt)-\d+-/.test(s.id)) return 'part'
  return null
}

// The hatches, the turrets, their bolts and what the bolts leave behind.
export const turrets: PartMaker = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    const k = kind(s)
    return k === 'part' ? '' : k
  },
  make(s) {
    const k = kind(s)
    if (k === 'hatch') return makeHatch()
    if (k === 'turret') return makeTurret(s)
    if (k === 'bolt') return makeBolt()
    return makeScorch(s)
  },
  pose(o, s, ctx) {
    if (o.userData.turret) poseTurret(o, s, ctx)
    else if (o.userData.hatch) poseHatch(o, s, ctx)
    else if (o.userData.bolt) poseBolt(o, s, ctx)
    else if (o.userData.scorch) poseScorch(o, s, ctx)
  },
  drop(o) {
    const t = o.userData.turret as TurretData | undefined
    if (t) {
      t.metal.dispose()
      t.steel.dispose()
      t.chargeMaterial.dispose()
      t.flashMaterial.dispose()
      for (const m of t.steamMaterials) m.dispose()
    }
    const c = o.userData.scorch as ScorchData | undefined
    if (c) {
      c.material.dispose()
      c.sparkMaterial.dispose()
      c.geometry.dispose()
      for (const m of c.smokeMaterials) m.dispose()
    }
  }
}

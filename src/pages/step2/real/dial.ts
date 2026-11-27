import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { scaled } from './sheet'
import { look } from '../../../post/look'
import { materials } from '../../../shell/materials'
import { arc, circle, merge, profile, roundedRect, sweep, type ProfilePoint, type Ring } from '../../../shell/solids'
import { DIAL, DIAL_BODY, dialPlate } from '../layout'
import { studio } from '../../../post/studio'
import { contact, outline, srgb } from './slot-kit'

const B = DIAL_BODY
const H = B.tall
const flat = (inset: number, z: number): Ring => ({ inset, z, out: 0, up: 1 })

const OWN = /^(sheet-)?dial-(wheel|centre|stop|hole-\d+)$/
const WHEEL = /^(sheet-)?dial-wheel$/

// A turned face reads its pictures across the whole disc once.
function discUv(g: THREE.BufferGeometry, d: number): THREE.BufferGeometry {
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / d + 0.5, uv.getY(i) / d + 0.5)
  return g
}

const holeAt = (k: number): [number, number] => {
  const a = DIAL.holeAngle(k)
  return [DIAL.ring * Math.cos(a), -DIAL.ring * Math.sin(a)]
}

// The ring the body stands in: a turned base ring on the tray's floor, a step lower than the bezel, and the dark gap the body rises through.
export function seatGeometry(): { collar: THREE.BufferGeometry; gap: THREE.BufferGeometry } {
  const r = DIAL.r
  const w = B.seat - B.seatGap
  const t = B.seatTall
  const collar = sweep(circle(r + B.seat, 120), profile([[0, 0.02, true], [0, t - 2.4, true], [1.2, t - B.seatSlope, true], [w - 1, t, true], [w, t - 1, true], [w, 0.02, true]]), false)
  const gap = sweep(circle(r + B.seatGap + 0.2, 96), [flat(0, 0.05), flat(B.seatGap + 0.6, 0.05)], false)
  return { collar, gap }
}

// The housing: a straight wall, a flat turned bezel between two crisp chamfers, and the groove down to the numeral plate.
export function housingGeometry(): THREE.BufferGeometry {
  const top = H - B.bezelDrop
  const c = B.bezelChamfer
  const points: ProfilePoint[] = [
    [0, -B.below, true], [0, top - B.bezelSlope - c, true], [c, top - B.bezelSlope, true], [B.bezel - c * 0.7, top, true], [B.bezel, top - c * 0.7, true], [B.bezel, H - B.plate, true]
  ]
  return sweep(circle(DIAL.r, 144), profile(points), false)
}

export function plateGeometry(): THREE.BufferGeometry {
  return sweep(circle(DIAL.r - B.bezel + 0.2, 72), [flat(0, H - B.plate)])
}

// The groove between the wheel and the bezel: dark, so the pale plate does not show as a line round the wheel.
export function grooveGeometry(): THREE.BufferGeometry {
  const out = DIAL.r - B.bezel + 0.4
  return sweep(circle(out, 144), [flat(0, H - B.plate + B.grooveOver), flat(out - (B.wheel - B.grooveUnder), H - B.plate + B.grooveOver)], false)
}

// The finger wheel's face, with its ten holes cut through.
export function faceGeometry(): THREE.BufferGeometry {
  const r = B.wheel - B.chamfer
  const shape = new THREE.Shape()
  const n = 120
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a))
    else shape.lineTo(r * Math.cos(a), r * Math.sin(a))
  }
  shape.closePath()
  const hr = DIAL.hole + B.holeRim
  for (let k = 1; k <= 10; k++) {
    const [cx, cy] = holeAt(k)
    const path = new THREE.Path()
    for (let i = 0; i < 40; i++) {
      const a = -(i / 40) * Math.PI * 2
      if (i === 0) path.moveTo(cx + hr * Math.cos(a), cy + hr * Math.sin(a))
      else path.lineTo(cx + hr * Math.cos(a), cy + hr * Math.sin(a))
    }
    path.closePath()
    shape.holes.push(path)
  }
  const hubR = B.hub + B.hubSeat
  const hub = new THREE.Path()
  for (let i = 0; i < 48; i++) {
    const a = -(i / 48) * Math.PI * 2
    if (i === 0) hub.moveTo(hubR * Math.cos(a), hubR * Math.sin(a))
    else hub.lineTo(hubR * Math.cos(a), hubR * Math.sin(a))
  }
  hub.closePath()
  shape.holes.push(hub)
  const g = new THREE.ShapeGeometry(shape)
  g.translate(0, 0, H)
  const p = g.getAttribute('position')
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / B.turned + 0.5
    uv[i * 2 + 1] = p.getY(i) / B.turned + 0.5
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(p.count * 3).fill(1), 3))
  return g
}

// A turned face under one light shows a bow tie through its centre, and the bow tie stays with the light while the wheel turns under it.
// The anisotropy of the shared metal gives its shape; this lays its depth into the face for the wheel's angle `turn`.
export function fanFace(g: THREE.BufferGeometry, turn: number): void {
  const p = g.getAttribute('position')
  const c = g.getAttribute('color')
  const [kx, ky] = look.key.direction
  const axis = Math.atan2(ky, kx) + B.fanAxis
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getY(i), p.getX(i)) - turn - axis
    const k = B.fanLow + B.fanGain * Math.pow(Math.cos(a) * Math.cos(a), B.fanSharp)
    c.setXYZ(i, k, k, k)
  }
  c.needsUpdate = true
}

// The machined rim of the wheel.
export function edgesGeometry(): THREE.BufferGeometry {
  const under = H - B.thick
  return sweep(circle(B.wheel, 144), profile([[0, under, true], [0, H - B.chamfer, true], [B.chamfer, H, true]]), false)
}

// The countersink and the wall of every finger hole, and of the seat the hub stands in.
export function holesGeometry(): THREE.BufferGeometry {
  const under = H - B.thick
  const c = B.holeChamfer
  const parts: THREE.BufferGeometry[] = []
  for (let k = 1; k <= 10; k++) {
    const [cx, cy] = holeAt(k)
    const g = sweep(circle(DIAL.hole + B.holeRim, 48), profile([[0, H, true], [c, H - c * 0.8, true], [c, under, true]]), false)
    g.translate(cx, cy, 0)
    parts.push(g)
  }
  parts.push(sweep(circle(B.hub + B.hubSeat, 72), profile([[0, H, true], [1, H - 1, true], [1, H - B.hubSeatDeep, true]]), false))
  return merge(parts)
}

// The hub: a moulded dome on a short straight foot, round all the way over so the light runs off it.
export function hubGeometry(): THREE.BufferGeometry {
  const r = B.hub
  const foot = B.hubFoot
  const step = B.hubStep
  const dome = B.hubTall - foot
  const n = 18
  const points: ProfilePoint[] = [[0, H - B.hubSeatDeep, true], [0, H + foot - 0.8], [0.8, H + foot], [step, H + foot + 0.3]]
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2)
    points.push([Math.min(r - 0.01, step + (r - step) * (1 - Math.pow(Math.cos(a), B.hubCrown))), H + foot + 0.3 + (dome - 0.3) * Math.pow(Math.sin(a), B.hubShoulder)])
  }
  return sweep(circle(r, 72), profile(points))
}

// The floor of the seat the hub stands in: a dark ring a little under the wheel's face.
// The boss in the middle of the wheel, a step proud of the turned face and of the same metal, and the fine seam round it.
export function innerGeometry(): { disc: THREE.BufferGeometry; seam: THREE.BufferGeometry; ring: THREE.BufferGeometry } {
  const r = B.inner
  const disc = sweep(circle(r - B.innerRing + 0.3, 96), profile([[0, H - 0.2, true], [0, H + B.innerTall - 0.2, true], [0.4, H + B.innerTall, true]]))
  const w = B.innerRing
  const t = B.innerRingTall
  const ring = sweep(circle(r, 96), profile([[0, H - 0.2, true], [0, H + t - 0.5, true], [0.5, H + t, true], [w - 0.5, H + t, true], [w, H + t - 0.5, true], [w, H + B.innerTall - 0.1, true]]), false)
  const seam = sweep(circle(r + B.innerSeam, 96), [flat(0, H + 0.06), flat(B.innerSeam + 0.6, H + 0.06)], false)
  return { disc, seam, ring }
}

export function hubRingGeometry(): THREE.BufferGeometry {
  return sweep(circle(B.hub + B.hubSeat - 0.8, 72), [flat(0, H - B.hubSeatDeep), flat(B.hubSeat + 0.4, H - B.hubSeatDeep)], false)
}

// The one point of light the lacquer holds: a small soft glint on the dome's shoulder toward the key, laid on in the light's own colour.
export function glintGeometry(): THREE.BufferGeometry {
  const rings = 6
  const n = 24
  const pos: number[] = [0, 0, 0]
  const col: number[] = [B.glint, B.glint, B.glint]
  const idx: number[] = []
  for (let k = 1; k <= rings; k++) {
    const t = k / rings
    const v = B.glint * Math.pow(1 - t, 2)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pos.push(B.glintLong * t * Math.cos(a), B.glintWide * t * Math.sin(a), 0)
      col.push(v, v, v)
    }
  }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n))
  for (let k = 1; k < rings; k++) {
    const a = 1 + (k - 1) * n
    const b = 1 + k * n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(a + i, b + i, b + j, a + i, b + j, a + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// The finger stop: a flat wedge that stands on the bezel's edge and reaches in over the wheel, broad at the bezel and narrow at its tip.
export function wedge(long: number, wide: number, tip: number, n = 12): ReturnType<typeof roundedRect> {
  const r0 = tip / 2
  const r1 = wide / 2
  const x0 = -long / 2 + r0
  const x1 = long / 2 - r1
  const lean = Math.asin((r1 - r0) / (x1 - x0))
  const pts: [number, number, number, number][] = []
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 - lean + ((Math.PI + 2 * lean) * i) / n
    pts.push([x1 + r1 * Math.cos(a), r1 * Math.sin(a), Math.cos(a), Math.sin(a)])
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + lean + ((Math.PI - 2 * lean) * i) / n
    pts.push([x0 + r0 * Math.cos(a), r0 * Math.sin(a), Math.cos(a), Math.sin(a)])
  }
  return outline(pts)
}

export function stopGeometry(): THREE.BufferGeometry {
  const long = B.stopOut - B.stopIn
  const mid = (B.stopOut + B.stopIn) / 2
  const z0 = H + B.stopClear
  const z1 = z0 + B.stopTall
  const bar = sweep(wedge(long, B.stopWide, B.stopTip), profile([[0.5, z0, true], [0, z0 + 0.5, true], [0, z1 - 0.9, true], [0.9, z1, true], [B.stopTip / 2 - 0.4, z1 + 0.12]]))
  bar.translate(mid, 0, 0)
  const footLong = B.stopOut - (DIAL.r - B.bezel + 1.5)
  const foot = sweep(roundedRect(footLong, B.stopWide - 3, (B.stopWide - 3) / 2, 10), profile([[0, H - B.stopFoot, true], [0, z0 + 0.4, true]]), false)
  foot.translate(B.stopOut - footLong / 2 - 1.5, 0, 0)
  const g = merge([bar, foot])
  g.rotateZ(-DIAL.stop)
  return g
}

// The shade a hole's wall lays on the plate under it: deepest against the wall on the light's side, gone before the far wall.
export function holeShadeGeometry(): THREE.BufferGeometry {
  const r = DIAL.hole + B.holeRim - B.holeChamfer + 0.3
  const [lx, ly] = look.key.direction
  const l = Math.hypot(lx, ly) || 1
  const rings = 7
  const n = 40
  const pos: number[] = [0, 0, 0]
  const at = (x: number, y: number): number => {
    const along = (x * lx + y * ly) / l
    const reach = Math.sqrt(Math.max(0, r * r - (x * x + y * y - along * along))) - along
    const t = Math.min(1, Math.max(0, reach / (r * 2 * B.shadeReach)))
    return 1 - B.shade * (1 - t) * (1 - t)
  }
  const col: number[] = []
  const v0 = at(0, 0)
  col.push(v0, v0, v0)
  const idx: number[] = []
  for (let k = 1; k <= rings; k++) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const x = ((r * k) / rings) * Math.cos(a)
      const y = ((r * k) / rings) * Math.sin(a)
      pos.push(x, y, 0)
      const v = at(x, y)
      col.push(v, v, v)
    }
  }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n))
  for (let k = 1; k < rings; k++) {
    const a = 1 + (k - 1) * n
    const b = 1 + k * n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(a + i, b + i, b + j, a + i, b + j, a + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.filter((_, i) => i % 3 !== 2), 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

let shadeMaterial: THREE.MeshBasicMaterial | null = null
let faceMaterial: THREE.MeshPhysicalMaterial | null = null
let hubMaterial: THREE.MeshPhysicalMaterial | null = null
let housingMaterial: THREE.MeshPhysicalMaterial | null = null
let stopMaterial: THREE.MeshPhysicalMaterial | null = null
let seatMaterial: THREE.MeshPhysicalMaterial | null = null
let innerMaterial: THREE.MeshPhysicalMaterial | null = null
let glintMaterial: THREE.MeshBasicMaterial | null = null

// The housing and its base ring are the shared steel, a shade darker: the approved housing is a dark turned ring round a pale wheel.
function darkSteel(shared: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const m = shared.clone()
  m.onBeforeCompile = shared.onBeforeCompile
  m.customProgramCacheKey = shared.customProgramCacheKey
  m.color.multiplyScalar(B.housingDark)
  m.roughness = B.housingRough
  m.name = 'dial-housing'
  return m
}

// The wheel's face is the page's turned aluminium with a finer cut: at this size the shared cut reads as rings, and the approved face is fans of light.
// It keeps the shared material's shader rules, so it stands under the same studio as everything else.
function turnedFine(shared: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const m = shared.clone()
  m.onBeforeCompile = shared.onBeforeCompile
  m.customProgramCacheKey = shared.customProgramCacheKey
  m.normalScale.set(B.cut, B.cut)
  m.roughness = B.faceRough
  m.anisotropy = B.faceStretch
  m.color.multiplyScalar(B.faceLight)
  m.vertexColors = true
  m.name = 'dial-face'
  return m
}

// The soft shade the risen dial lays on the tray's floor on the side away from the key: the sunk glass is filled with light and holds little of a lamp's shadow.
export function castGeometry(): THREE.BufferGeometry {
  const from = DIAL.r + B.bezel - B.castIn
  const to = DIAL.r + B.bezel + B.castOut
  const rings = 10
  const n = 64
  const pos: number[] = [0, 0, 0]
  const col: number[] = [1 - B.cast, 1 - B.cast, 1 - B.cast]
  const idx: number[] = []
  for (let k = 0; k <= rings; k++) {
    const t = k / rings
    const r = from + (to - from) * t
    const v = 1 - B.cast * (1 - t * t * (3 - 2 * t))
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pos.push(r * Math.cos(a), r * Math.sin(a), 0)
      col.push(v, v, v)
    }
  }
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n))
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = 1 + k * n
      const b = a + n
      idx.push(a + i, b + i, a + j, a + j, b + i, b + j)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}

// The hub is the shared orange under a harder lacquer: a turned knob this small is polished, and the approved hub holds one clear point of light.
function lacquered(shared: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const m = shared.clone()
  m.onBeforeCompile = shared.onBeforeCompile
  m.customProgramCacheKey = shared.customProgramCacheKey
  m.clearcoat = 1
  m.clearcoatRoughness = B.hubCoat
  m.roughness = B.hubRough
  m.ior = B.hubIor
  m.specularIntensity = 1
  m.specularColor.setScalar(1)
  m.envMapIntensity = B.hubEnv
  m.normalScale = m.normalScale.clone().multiplyScalar(B.hubGrain)
  m.name = 'dial-hub'
  return m
}

interface Kit { inner: THREE.BufferGeometry; innerRing: THREE.BufferGeometry; seam: THREE.BufferGeometry; foot: THREE.BufferGeometry; seat: THREE.BufferGeometry; gap: THREE.BufferGeometry; groove: THREE.BufferGeometry; housing: THREE.BufferGeometry; plate: THREE.BufferGeometry; face: THREE.BufferGeometry; edges: THREE.BufferGeometry; holes: THREE.BufferGeometry; glint: THREE.BufferGeometry; hub: THREE.BufferGeometry; hubRing: THREE.BufferGeometry; stop: THREE.BufferGeometry; shade: THREE.BufferGeometry; cast: THREE.BufferGeometry }
let kit: Kit | null = null

function geometries(): Kit {
  if (!kit) {
    const seat = seatGeometry()
    const inner = innerGeometry()
    kit = { inner: inner.disc, innerRing: inner.ring, seam: inner.seam, foot: contact(circle(DIAL.r + B.seat + B.footLine, 120), B.footLine + 0.8), seat: seat.collar, gap: seat.gap, groove: grooveGeometry(), housing: housingGeometry(), plate: plateGeometry(), face: faceGeometry(), edges: edgesGeometry(), holes: holesGeometry(), glint: glintGeometry(), hub: hubGeometry(), hubRing: hubRingGeometry(), stop: stopGeometry(), shade: holeShadeGeometry(), cast: castGeometry() }
  }
  return kit
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

// Where the dial lies under the page on the live site, each of its solids is drawn no taller than `wall` and no higher than the dial's top, from `margin` px past the opening's edge on. A wall on edge under the page shows through it as dots where a pixel has more than one sample, the taller the wall the further up. Only a corner whose every triangle lies wholly past that line is moved, so that nothing in the opening changes.
export const DIAL_UNDER = { wall: 0.1, margin: 2 }

interface Level { whole: THREE.BufferGeometry; low: THREE.BufferGeometry; at: number[] }
const reach = new THREE.Matrix4()
const point = new THREE.Vector3()

// `edge` is how far below the dial's centre the opening ends, in px of the page, or null when all of the dial is in the opening or the picture is the film's: then every solid is whole. `top` is the dial's top over the floor it stands on.
export function levelDial(root: THREE.Object3D, edge: number | null, top: number): void {
  root.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh || (c as THREE.InstancedMesh).isInstancedMesh || (m.material as THREE.Material).transparent) return
    const u = m.userData as { level?: Level }
    const whole = u.level ? u.level.whole : m.geometry
    if (edge === null) {
      m.geometry = whole
      return
    }
    reach.identity()
    for (let p: THREE.Object3D | null = m; p && p !== root; p = p.parent) {
      if (p.matrixAutoUpdate) p.updateMatrix()
      reach.premultiply(p.matrix)
    }
    const at = [edge, top, ...reach.elements]
    if (u.level && u.level.at.length === at.length && u.level.at.every((v, i) => v === at[i])) {
      m.geometry = u.level.low
      return
    }
    const from = whole.getAttribute('position') as THREE.BufferAttribute
    const tall = reach.elements[10]!
    const past = new Uint8Array(from.count)
    let most = -Infinity
    for (let i = 0; i < from.count; i++) {
      point.fromBufferAttribute(from, i).applyMatrix4(reach)
      most = Math.max(most, point.z)
      if (point.y < -(edge + DIAL_UNDER.margin)) past[i] = 1
    }
    const low = Uint8Array.from(past)
    const index = whole.getIndex()
    const corners = index ? index.count : from.count
    for (let t = 0; t + 2 < corners; t += 3) {
      const a = index ? index.getX(t) : t
      const b = index ? index.getX(t + 1) : t + 1
      const c = index ? index.getX(t + 2) : t + 2
      if (past[a] && past[b] && past[c]) continue
      low[a] = low[b] = low[c] = 0
    }
    if (!low.includes(1) || tall < 1e-6) {
      m.geometry = whole
      if (u.level) u.level.at = []
      return
    }
    u.level ??= { whole, low: whole.clone(), at: [] }
    const to = u.level.low.getAttribute('position') as THREE.BufferAttribute
    const hi = Math.min(most, top)
    for (let i = 0; i < from.count; i++) {
      if (!low[i]) {
        to.setZ(i, from.getZ(i))
        continue
      }
      point.fromBufferAttribute(from, i).applyMatrix4(reach)
      to.setZ(i, from.getZ(i) + (Math.min(hi, Math.max(hi - DIAL_UNDER.wall, point.z)) - point.z) / tall)
    }
    to.needsUpdate = true
    u.level.at = at
    m.geometry = u.level.low
  })
}

// While the dial lies housed, the pale inner disc and the dark ring under it sink this far into the wheel and the hub, pressed flat, lies on the disc: an orange disc in sight, the whole of it under the floor of a field. They come up again as the body rises.
export const HUB_HOUSED = { drop: 0.3 }

interface Kept { ring: THREE.Mesh; body: THREE.Group; wheel: THREE.Group; face: THREE.Mesh; shades: THREE.InstancedMesh; hub: THREE.Mesh; stop: THREE.Mesh; plate: THREE.Mesh; cast: THREE.Mesh; seat: THREE.Mesh; glint: THREE.Mesh; inner: THREE.Mesh; hubRing: THREE.Mesh }
const place = new THREE.Matrix4()

const plainDial: PartMaker = {
  key(s: Shape): string | null {
    if (!OWN.test(s.id)) return null
    return WHEEL.test(s.id) ? 'dial' : ''
  },
  make(): THREE.Object3D {
    const m = materials()
    const g = geometries()
    const root = new THREE.Group()
    housingMaterial ??= darkSteel(m.steel)
    if (!seatMaterial) {
      seatMaterial = darkSteel(m.steel)
      seatMaterial.color.multiplyScalar(B.seatDark)
      seatMaterial.name = 'dial-seat'
    }
    const seat = mesh(g.seat, seatMaterial)
    root.add(seat)
    root.add(mesh(g.gap, m.gap, false))
    root.add(mesh(g.foot, m.gap, false))
    const body = new THREE.Group()
    body.add(mesh(g.housing, housingMaterial))
    const plate = mesh(g.plate, m.keycap, false)
    body.add(plate)
    plate.add(mesh(g.groove, m.gap, false))
    if (!stopMaterial) {
      stopMaterial = darkSteel(m.steel)
      stopMaterial.color.multiplyScalar(B.stopDark)
      stopMaterial.name = 'dial-stop'
    }
    const stop = mesh(g.stop, stopMaterial)
    body.add(stop)
    const wheel = new THREE.Group()
    faceMaterial ??= turnedFine(m.aluminiumTurned)
    const face = mesh(g.face, faceMaterial)
    wheel.add(face)
    wheel.add(mesh(g.edges, housingMaterial))
    wheel.add(mesh(g.holes, m.aluminiumSatin))
    innerMaterial ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(B.innerTone), roughness: B.innerRough, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.5, specularIntensity: 0.4, name: 'dial-inner' }))
    const inner = mesh(g.inner, innerMaterial, false)
    wheel.add(inner)
    const ring = mesh(g.innerRing, m.aluminiumSatin)
    wheel.add(ring)
    const hubRing = mesh(g.hubRing, m.gap, false)
    hubRing.position.z = B.innerTall + B.hubSeatDeep - 0.1
    wheel.add(hubRing)
    hubMaterial ??= lacquered(m.orange)
    const hub = mesh(g.hub, hubMaterial)
    wheel.add(hub)
    body.add(wheel)
    glintMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: new THREE.Color(...look.key.colour) })
    const glint = mesh(g.glint, glintMaterial, false)
    glint.receiveShadow = false
    const [kx, ky] = look.key.direction
    const kl = Math.hypot(kx, ky) || 1
    glint.position.set((kx / kl) * B.glintOut, (ky / kl) * B.glintOut, H + B.glintUp)
    glint.rotation.z = Math.atan2(ky, kx) + Math.PI / 2
    body.add(glint)
    shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false })
    const shades = new THREE.InstancedMesh(g.shade, shadeMaterial, 10)
    shades.position.z = H - B.plate + 0.12
    shades.frustumCulled = false
    body.add(shades)
    root.add(body)
    const cast = mesh(g.cast, shadeMaterial, false)
    cast.receiveShadow = false
    cast.position.z = B.castOver
    root.add(cast)
    root.userData.dial = { ring, body, wheel, face, shades, hub, stop, plate, cast, seat, glint, inner, hubRing } satisfies Kept
    return root
  },
  pose(o: THREE.Object3D, s: Shape, _ctx: RealContext): void {
    const kept = o.userData.dial as Kept
    const top = Math.max(B.rest, s.z1 - s.z0)
    const low = 1 - Math.min(1, Math.max(0, (top - B.rest) / (H - B.rest)))
    kept.body.position.z = top - H
    const up = dialPlate(top) - (top - B.plate)
    kept.plate.position.z = up
    kept.shades.position.z = H - B.plate + 0.12 + up
    const swell = B.hubFlat + (1 - B.hubFlat) * (1 - low)
    const sunk = HUB_HOUSED.drop * low
    const on = H + B.innerTall - sunk
    kept.inner.position.z = -sunk
    kept.hubRing.position.z = B.innerTall + B.hubSeatDeep - 0.1 - sunk
    kept.hub.scale.z = swell
    kept.hub.position.z = on * (1 - swell)
    kept.stop.position.z = -(B.stopClear + B.stopTall + 0.5) * low
    kept.ring.position.z = -B.innerRingTall * low
    kept.seat.scale.z = Math.max(0.1, 1 - low)
    kept.glint.visible = low < 1
    kept.glint.scale.setScalar(Math.max(1e-6, 1 - low))
    kept.glint.position.z = on * (1 - swell) + (H + B.glintUp) * swell
    const [lx, ly] = look.key.direction
    const l = Math.hypot(lx, ly) || 1
    const risen = 1 - low
    const small = (DIAL.r - B.castIn) / (DIAL.r + B.bezel + B.castOut)
    kept.cast.position.x = (-lx / l) * B.castAway * risen
    kept.cast.position.y = (-ly / l) * B.castAway * risen
    kept.cast.scale.setScalar(small + (1 - small) * risen)
    const turn = s.v?.[0] ?? 0
    kept.wheel.rotation.z = -turn
    fanFace(kept.face.geometry, turn)
    for (let k = 1; k <= 10; k++) {
      const a = DIAL.holeAngle(k) + turn
      place.makeTranslation(DIAL.ring * Math.cos(a), -DIAL.ring * Math.sin(a), 0)
      kept.shades.setMatrixAt(k - 1, place)
    }
    kept.shades.instanceMatrix.needsUpdate = true
    levelDial(o, s.v !== undefined && s.v.length > 1 ? s.v[1]! : null, top)
  }
}

export const dial: PartMaker = scaled(plainDial)

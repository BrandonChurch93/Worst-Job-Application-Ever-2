import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { look } from '../../../post/look'
import { materials } from '../../../shell/materials'
import { arc, circle, merge, profile, roundedRect, sweep, type ProfilePoint, type Ring } from '../../../shell/solids'
import { DIAL, DIAL_BODY, dialPlate } from '../layout'

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
  return g
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
    points.push([Math.min(r - 0.01, step + (r - step) * (1 - Math.pow(Math.cos(a), 0.9))), H + foot + 0.3 + (dome - 0.3) * Math.pow(Math.sin(a), 0.8)])
  }
  return sweep(circle(r, 72), profile(points))
}

// The floor of the seat the hub stands in: a dark ring a little under the wheel's face.
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

// The finger stop: a bar that stands on the bezel's edge and reaches in over the wheel.
export function stopGeometry(): THREE.BufferGeometry {
  const long = B.stopOut - B.stopIn
  const mid = (B.stopOut + B.stopIn) / 2
  const z0 = H + B.stopClear
  const z1 = z0 + B.stopTall
  const round = 2.2
  const bar = sweep(roundedRect(long, B.stopWide, B.stopWide / 2, 10), profile([[0.6, z0, true], [0, z0 + 0.6], [0, z1 - round], ...arc(0, z1 - round, round, round, 6).slice(1), [B.stopWide / 2 - 0.4, z1 + 0.25]]))
  bar.translate(mid, 0, 0)
  const footLong = B.stopOut - (DIAL.r - B.bezel + 1.5)
  const foot = sweep(roundedRect(footLong, B.stopWide - 1.6, (B.stopWide - 1.6) / 2, 10), profile([[0, H - B.stopFoot, true], [0, z0 + 0.4, true]]), false)
  foot.translate(B.stopOut - footLong / 2 - 0.8, 0, 0)
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
  m.color.multiplyScalar(B.hubLift)
  m.name = 'dial-hub'
  return m
}

interface Kit { seat: THREE.BufferGeometry; gap: THREE.BufferGeometry; housing: THREE.BufferGeometry; plate: THREE.BufferGeometry; face: THREE.BufferGeometry; edges: THREE.BufferGeometry; holes: THREE.BufferGeometry; glint: THREE.BufferGeometry; hub: THREE.BufferGeometry; hubRing: THREE.BufferGeometry; stop: THREE.BufferGeometry; shade: THREE.BufferGeometry; cast: THREE.BufferGeometry }
let kit: Kit | null = null

function geometries(): Kit {
  if (!kit) {
    const seat = seatGeometry()
    kit = { seat: seat.collar, gap: seat.gap, housing: housingGeometry(), plate: plateGeometry(), face: faceGeometry(), edges: edgesGeometry(), holes: holesGeometry(), glint: glintGeometry(), hub: hubGeometry(), hubRing: hubRingGeometry(), stop: stopGeometry(), shade: holeShadeGeometry(), cast: castGeometry() }
  }
  return kit
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

interface Kept { body: THREE.Group; wheel: THREE.Group; shades: THREE.InstancedMesh; hub: THREE.Mesh; stop: THREE.Mesh; plate: THREE.Mesh; cast: THREE.Mesh; seat: THREE.Mesh; glint: THREE.Mesh }
const place = new THREE.Matrix4()

export const dial: PartMaker = {
  key(s: Shape): string | null {
    if (!OWN.test(s.id)) return null
    return WHEEL.test(s.id) ? 'dial' : ''
  },
  make(): THREE.Object3D {
    const m = materials()
    const g = geometries()
    const root = new THREE.Group()
    housingMaterial ??= darkSteel(m.steel)
    const seat = mesh(g.seat, housingMaterial)
    root.add(seat)
    root.add(mesh(g.gap, m.gap, false))
    const body = new THREE.Group()
    body.add(mesh(g.housing, housingMaterial))
    const plate = mesh(g.plate, m.keycap, false)
    body.add(plate)
    const stop = mesh(g.stop, m.steel)
    body.add(stop)
    const wheel = new THREE.Group()
    faceMaterial ??= turnedFine(m.aluminiumTurned)
    wheel.add(mesh(g.face, faceMaterial))
    wheel.add(mesh(g.edges, m.chrome))
    wheel.add(mesh(g.holes, m.aluminiumSatin))
    wheel.add(mesh(g.hubRing, m.gap, false))
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
    root.userData.dial = { body, wheel, shades, hub, stop, plate, cast, seat, glint } satisfies Kept
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
    kept.hub.scale.z = swell
    kept.hub.position.z = H * (1 - swell)
    kept.stop.position.z = -(B.stopClear + B.stopTall + 0.5) * low
    kept.seat.scale.z = Math.max(0.1, 1 - low)
    kept.glint.visible = low < 0.5
    kept.glint.position.z = H * (1 - swell) + (H + B.glintUp) * swell
    const [lx, ly] = look.key.direction
    const l = Math.hypot(lx, ly) || 1
    const risen = 1 - low
    const small = (DIAL.r - B.castIn) / (DIAL.r + B.bezel + B.castOut)
    kept.cast.position.x = (-lx / l) * B.castAway * risen
    kept.cast.position.y = (-ly / l) * B.castAway * risen
    kept.cast.scale.setScalar(small + (1 - small) * risen)
    const turn = s.v?.[0] ?? 0
    kept.wheel.rotation.z = -turn
    for (let k = 1; k <= 10; k++) {
      const a = DIAL.holeAngle(k) + turn
      place.makeTranslation(DIAL.ring * Math.cos(a), -DIAL.ring * Math.sin(a), 0)
      kept.shades.setMatrixAt(k - 1, place)
    }
    kept.shades.instanceMatrix.needsUpdate = true
  }
}

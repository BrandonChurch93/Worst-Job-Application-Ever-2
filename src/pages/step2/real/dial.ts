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

// The ring the body stands in: a thin collar on the tray's floor and the dark gap the body rises through.
export function seatGeometry(): { collar: THREE.BufferGeometry; gap: THREE.BufferGeometry } {
  const r = DIAL.r
  const collar = sweep(circle(r + B.seat, 96), profile([[0, 0.02, true], [0, 0.5], [0.5, 0.9], [B.seat - B.seatGap - 0.4, 0.9], [B.seat - B.seatGap, 0.4], [B.seat - B.seatGap, 0.02, true]]), false)
  const gap = sweep(circle(r + B.seatGap + 0.2, 96), [flat(0, 0.05), flat(B.seatGap + 0.6, 0.05)], false)
  return { collar, gap }
}

// The housing: a straight wall, a rounded bezel and the step down to the numeral plate.
export function housingGeometry(): THREE.BufferGeometry {
  const top = H - B.bezelDrop
  const points: ProfilePoint[] = [
    [0, -B.below, true], [0, top - 3], ...arc(0, top - 3, 3, 3, 7).slice(1), [B.bezel - 2.4, top],
    ...[1, 2, 3, 4, 5].map((i): ProfilePoint => [B.bezel - 2.4 + 2.4 * Math.sin((i / 5) * (Math.PI / 2)), top - 2 * (1 - Math.cos((i / 5) * (Math.PI / 2)))]),
    [B.bezel, H - B.plate, true]
  ]
  return sweep(circle(DIAL.r, 120), profile(points), false)
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
  const hubR = B.hub - 1
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
    uv[i * 2] = p.getX(i) / (B.wheel * 2) + 0.5
    uv[i * 2 + 1] = p.getY(i) / (B.wheel * 2) + 0.5
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}

// The machined edges of the wheel: its rim and the chamfer and wall of every hole.
export function edgesGeometry(): THREE.BufferGeometry {
  const under = H - B.thick
  const parts: THREE.BufferGeometry[] = [sweep(circle(B.wheel, 120), profile([[0, under, true], [0, H - B.chamfer, true], [B.chamfer, H, true]]), false)]
  for (let k = 1; k <= 10; k++) {
    const [cx, cy] = holeAt(k)
    const g = sweep(circle(DIAL.hole + B.holeRim, 40), profile([[0, H, true], [B.holeChamfer, H - B.holeChamfer * 0.75, true], [B.holeChamfer, under, true]]), false)
    g.translate(cx, cy, 0)
    parts.push(g)
  }
  return merge(parts)
}

// The hub: a moulded dome on a short straight foot.
export function hubGeometry(): THREE.BufferGeometry {
  const r = B.hub
  const tall = B.hubTall
  const foot = 2.4
  const wide = 9
  const crown = 2.6
  const points: ProfilePoint[] = [
    [0, H - 0.4, true], [0, H + foot], ...arc(0, H + foot, wide, tall - foot - crown, 12).slice(1),
    ...[0.8, 0.6, 0.4, 0.22, 0.08].map((t): ProfilePoint => [r - (r - wide) * t, H + tall - crown * t * t])
  ]
  return sweep(circle(r, 72), profile(points))
}

export function hubRingGeometry(): THREE.BufferGeometry {
  return sweep(circle(B.hub + 2.2, 72), [flat(0, H + 0.06), flat(3.4, H + 0.06)], false)
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

interface Kit { seat: THREE.BufferGeometry; gap: THREE.BufferGeometry; housing: THREE.BufferGeometry; plate: THREE.BufferGeometry; face: THREE.BufferGeometry; edges: THREE.BufferGeometry; hub: THREE.BufferGeometry; hubRing: THREE.BufferGeometry; stop: THREE.BufferGeometry; shade: THREE.BufferGeometry }
let kit: Kit | null = null

function geometries(): Kit {
  if (!kit) {
    const seat = seatGeometry()
    kit = { seat: seat.collar, gap: seat.gap, housing: housingGeometry(), plate: plateGeometry(), face: faceGeometry(), edges: edgesGeometry(), hub: hubGeometry(), hubRing: hubRingGeometry(), stop: stopGeometry(), shade: holeShadeGeometry() }
  }
  return kit
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = true
  return m
}

interface Kept { body: THREE.Group; wheel: THREE.Group; shades: THREE.InstancedMesh; hub: THREE.Mesh; stop: THREE.Mesh; plate: THREE.Mesh }
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
    root.add(mesh(g.seat, m.aluminiumSatin, false))
    root.add(mesh(g.gap, m.gap, false))
    const body = new THREE.Group()
    body.add(mesh(g.housing, m.aluminiumEdge))
    const plate = mesh(g.plate, m.keycap, false)
    body.add(plate)
    const stop = mesh(g.stop, m.aluminium)
    body.add(stop)
    const wheel = new THREE.Group()
    wheel.add(mesh(g.face, m.aluminiumTurned))
    wheel.add(mesh(g.edges, m.aluminiumEdge))
    wheel.add(mesh(g.hubRing, m.gap, false))
    const hub = mesh(g.hub, m.orange)
    wheel.add(hub)
    body.add(wheel)
    shadeMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, toneMapped: false })
    const shades = new THREE.InstancedMesh(g.shade, shadeMaterial, 10)
    shades.position.z = H - B.plate + 0.12
    shades.frustumCulled = false
    body.add(shades)
    root.add(body)
    root.userData.dial = { body, wheel, shades, hub, stop, plate } satisfies Kept
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
    kept.hub.position.z = -B.hubTall * low
    kept.stop.position.z = -(B.stopClear + B.stopTall + 0.5) * low
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

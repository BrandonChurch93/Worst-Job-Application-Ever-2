import * as THREE from 'three'
import { config } from '../../config'
import { studio } from '../../post/studio'
import { grainNormalMap } from '../../shell/materials'
import type { ArmsLook, ArmsModel } from '../contract'

// Sizes in page pixels. The arm is a rubber hose 7% of the body's height thick, the hand a fifth of it long.
// A hose is `rest` long and never shorter. A hand nearer than that leaves the rest as slack: the hose leaves the body outward (`out`), bows round in one loop and comes to the hand along the line of its reach (`into`). A hand further away stretches it: it is still `taut` longer than the straight line, so it keeps a curve, and it thins by `thin` at full strain and by the root of its stretch. `most` is the longest a short reach may be for its length, so a hand that is still growing out does not throw a loop. An open hand that pushes bends back at the wrist by `wrist`; an open hand that hangs lets its fingers fall by `droop`.
const H = config.cursor.heightPxAt1080
export const ARM = { radius: H * 0.04, rest: 43, taut: 1.15, most: 2.1, out: 0.16, into: 0.3, ease: 0.45, thin: 0.12, along: 34, round: 12, grainPx: 64, wrist: 2.5, droop: 0.6, low: 0.15, rise: 0.55, thick: 1.3, taper: 0.4, cuff: [1.3, 1.62, 1.62, 1.2] }
const HAND = { palm: [4.5, 4, 2.3], palmY: 3.6, finger: 1.42, joint: 2.9, joints: 8, curl: 0.5, knuckle: 0.65 }
// A hand that holds a sheet by its side edge: the arm leaves the shoulder outward and back (`side`, `back`), bends at an elbow and comes to the edge from outside the sheet (`into`). The two arms are not a pair: `lead` and `hand` set how far each elbow stands off at its shoulder end and at its hand end, first the left arm, then the right.
const ELBOW = { lead: [0.8, 0.7], back: [0.4, 0.1], hand: [0.55, 1], side: 0.6, into: 0.3, least: 0.22 }
// The same hand: the palm stands outside the edge, the fingers go down behind the sheet and the thumb lies on its face.
// An open hand: the two arms hang and reach each in its own way, the left with the wider bow. An open hand that reaches past the far side of the body goes over the white face: the arm swings `swing` out round the body's edge, is `clear` over the face by `up` of its length and stays there.
const OPEN = { lead: [1.1, 0.72], ease: [0.3, 0.62], swing: 9, clear: 1.5, up: 0.17, root: 8.5, turn: 0.24 }
const WRAP = { low: 0.76, rise: 0.22, dive: 1.05, tip: 0.5, under: -1.4, thumb: [1.7, 5.2, 2.1], turn: 0.3, flat: 0.12 }

export interface Arms extends ArmsModel {
  // How far the arms have grown, 0 to 1 and a little over: the hands swell with it.
  grown: number
  // The height of the body's top face, in the same space as the shoulders.
  over: number
  // From the first shoulder to the second, a unit vector in the plane of the page: each hose bows away from the other.
  axis: [number, number]
  // For each hand that holds a sheet by its side edge, the unit vector from that edge into the sheet. Null for a hand that holds nothing.
  inward: [[number, number] | null, [number, number] | null]
}

let shared: { rubber: THREE.MeshPhysicalMaterial; grain: THREE.DataTexture; palm: THREE.BufferGeometry; joint: THREE.BufferGeometry } | null = null

function parts() {
  if (shared) return shared
  const grain = grainNormalMap(ARM.grainPx, config.seed + 7, 1.6)
  grain.repeat.set(2, 5)
  const rubber = studio(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(0x222223, THREE.SRGBColorSpace),
      roughness: 0.56,
      metalness: 0,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.04, 0.04),
      specularIntensity: 0.85
    })
  )
  const palm = new THREE.SphereGeometry(1, 20, 14).scale(HAND.palm[0]!, HAND.palm[1]!, HAND.palm[2]!)
  const joint = new THREE.CapsuleGeometry(HAND.finger, HAND.joint, 4, 10).translate(0, HAND.joint / 2, 0)
  shared = { rubber, grain, palm, joint }
  return shared
}

interface Finger { base: THREE.Object3D; tip: THREE.Object3D; x: number; y: number; open: number; shut: number; thumb: boolean }

const RING = ARM.round + 1
const RINGS = ARM.along + 1

// One arm: a tube written into the shared tube of the pair, and a hand whose pieces are instances of three shared shapes.
class Limb {
  readonly hand = new THREE.Group()
  private palm = new THREE.Object3D()
  private fingers: Finger[] = []
  private c = new THREE.Vector3()
  private e = new THREE.Vector3()
  private lift = 0
  private wrap = 0
  private cross = 0
  private top = 0
  private sx = 0
  private ox = 0
  private oy = 0
  private sy = 0
  private lx = 0
  private ly = 0
  private ax = 0
  private ay = 0
  private p = new THREE.Vector3()
  private t = new THREE.Vector3()
  private n1 = new THREE.Vector3()
  private n2 = new THREE.Vector3()
  private basis = new THREE.Matrix4()

  constructor(private side: number, private slot: number) {
    this.palm.position.set(0, HAND.palmY, 0)
    this.hand.add(this.palm)
    const lay: [number, number, number, number, number, boolean][] = [
      [-3, 6.2, 0.2, 0.14, 1, false], [0, 6.9, 0, 0, 1.1, false], [3, 6.2, -0.2, -0.14, 1, false], [3.7, 2.6, -1, -0.6, 0.8, true]
    ]
    for (const [x, y, open, shut, long, thumb] of lay) {
      const base = new THREE.Object3D()
      base.rotation.order = 'ZXY'
      base.scale.set(1, long, 1)
      const tip = new THREE.Object3D()
      tip.position.set(0, HAND.joint, 0)
      tip.scale.set(0.92, 0.9, 0.92)
      base.add(tip)
      this.hand.add(base)
      this.fingers.push({ base, tip, x: x * side, y, open: open * side, shut: shut * side, thumb })
    }
  }

  private at(out: THREE.Vector3, u: number, from: THREE.Vector3, to: THREE.Vector3): void {
    const v = 1 - u
    const a = v * v * v
    const b = 3 * v * v * u
    const c = 3 * v * u * u
    const d = u * u * u
    const w = Math.min(1, Math.max(0, (u - ARM.low) / ARM.rise))
    const z = from.z + (to.z - from.z) * u + this.lift * 4 * u * v
    let high = from.z + (z - from.z) * w * w * (3 - 2 * w)
    if (this.cross > 0) {
      const r = Math.min(1, u / OPEN.up)
      const f = Math.min(1, Math.max(0, (u - 0.72) / 0.28))
      const over = from.z + (this.top - from.z) * r * r * (3 - 2 * r)
      high += (over + (to.z - this.top) * f * f * (3 - 2 * f) - high) * this.cross
    }
    if (this.wrap > 0) {
      const f = Math.min(1, Math.max(0, (u - WRAP.low) / WRAP.rise))
      high += (from.z + (to.z - from.z) * f * f * (3 - 2 * f) - high) * this.wrap
    }
    const off = u < OPEN.turn ? OPEN.root * this.cross * Math.sin((Math.PI * u) / OPEN.turn) : 0
    out.set(a * from.x + b * this.c.x + c * this.e.x + d * to.x + this.side * this.ox * off, a * from.y + b * this.c.y + c * this.e.y + d * to.y + this.side * this.oy * off, high)
  }

  private bow(from: THREE.Vector3, to: THREE.Vector3, ex: number, ey: number, px: number, py: number, d: number, h: number): number {
    const g = this.wrap
    const lead = h * ELBOW.lead[this.slot]!
    const hand = h * ELBOW.hand[this.slot]! + ELBOW.least * d
    const o = h * OPEN.lead[this.slot]!
    const ease = OPEN.ease[this.slot]!
    this.c.set(from.x + (px * o - ex * ARM.out * o + this.sx) * (1 - g) + this.lx * lead * g, from.y + (py * o - ey * ARM.out * o + this.sy) * (1 - g) + this.ly * lead * g, 0)
    this.e.set(to.x + (px * o * ease - ex * ARM.into * d) * (1 - g) + this.ax * hand * g, to.y + (py * o * ease - ey * ARM.into * d) * (1 - g) + this.ay * hand * g, 0)
    let length = 0
    let x0 = from.x
    let y0 = from.y
    let z0 = from.z
    for (let i = 1; i <= 16; i++) {
      this.at(this.p, i / 16, from, to)
      length += Math.hypot(this.p.x - x0, this.p.y - y0, this.p.z - z0)
      x0 = this.p.x
      y0 = this.p.y
      z0 = this.p.z
    }
    return length
  }

  pose(d3: Draw, from: THREE.Vector3, to: THREE.Vector3, grip: number, strain: number, grown: number, axis: [number, number], inward: [number, number] | null, over: number): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const d = Math.max(1e-3, Math.hypot(dx, dy, to.z - from.z))
    const flat = Math.max(1e-3, Math.hypot(dx, dy))
    const ex = dx / flat
    const ey = dy / flat
    const length = Math.min(d * ARM.most, Math.max(ARM.rest * Math.min(1, Math.max(0.2, grown)), d * ARM.taut))
    let px = -ey
    let py = ex
    const want = (px * axis[0] + py * axis[1]) * this.side * 0.857 + py * 0.514
    if (want < 0) {
      px = -px
      py = -py
    }
    // An arm whose hand is on the far side of the body goes under it and comes out at the far edge: no arm lies over the white face.
    const across = Math.min(1, Math.max(0, (-this.side * (dx * axis[0] + dy * axis[1]) - 6) / 10))
    this.wrap = inward ? grip : 0
    this.cross = across * (1 - grip)
    this.top = Math.max(to.z, over + ARM.radius * ARM.thick + OPEN.clear)
    this.ox = axis[0]
    this.oy = axis[1]
    this.sx = this.side * axis[0] * OPEN.swing * this.cross
    this.sy = this.side * axis[1] * OPEN.swing * this.cross
    if (inward) {
      this.lx = this.side * axis[0] * ELBOW.side - ex * ELBOW.back[this.slot]!
      this.ly = this.side * axis[1] * ELBOW.side - ey * ELBOW.back[this.slot]!
      const ix = -inward[0] - ex * ELBOW.into
      const iy = -inward[1] - ey * ELBOW.into
      const il = Math.hypot(ix, iy) || 1
      this.ax = ix / il
      this.ay = iy / il
    }
    this.lift = 0
    let lo = 0
    let hi = length
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (this.bow(from, to, ex, ey, px, py, flat, mid) < length) lo = mid
      else hi = mid
    }
    const h = lo * (Math.min(1, Math.abs(want) * 3) * (1 - this.wrap) + this.wrap)
    this.bow(from, to, ex, ey, px, py, flat, h)
    this.lift = (1 + h * 0.1) * (1 - across)
    const thin = Math.pow(Math.min(1, ARM.rest / length), 0.2) * (1 - ARM.thin * strain)
    const pos = d3.position.array as Float32Array
    const nor = d3.normal.array as Float32Array
    let k = this.slot * RINGS * RING * 3
    for (let i = 0; i <= ARM.along; i++) {
      const u = i / ARM.along
      this.at(this.t, Math.min(1, u + 0.015), from, to)
      this.at(this.p, Math.max(0, u - 0.015), from, to)
      this.t.sub(this.p).normalize()
      this.at(this.p, u, from, to)
      this.n1.set(this.t.y, -this.t.x, 0)
      if (this.n1.lengthSq() < 1e-6) this.n1.set(1, 0, 0)
      this.n1.normalize()
      this.n2.crossVectors(this.n1, this.t)
      // The shoulder end is closed to a round nose: an arm that starts on the body's face must not show an open tube.
      const nose = i === 0 ? 0.04 : i === 1 ? 0.6 : i === 2 ? 0.9 : 1
      const cuff = ARM.cuff[i - ARM.along + ARM.cuff.length - 1] ?? 1
      const r = ARM.radius * thin * (ARM.thick - ARM.taper * u) * (0.35 + 0.65 * Math.min(1, grown)) * nose * cuff
      for (let j = 0; j <= ARM.round; j++) {
        const w = (j / ARM.round) * Math.PI * 2
        const cx = Math.cos(w)
        const sx = Math.sin(w)
        const nx = this.n1.x * cx + this.n2.x * sx
        const ny = this.n1.y * cx + this.n2.y * sx
        const nz = this.n1.z * cx + this.n2.z * sx
        pos[k] = this.p.x + nx * r
        pos[k + 1] = this.p.y + ny * r
        pos[k + 2] = this.p.z + nz * r
        nor[k] = nx
        nor[k + 1] = ny
        nor[k + 2] = nz
        k += 3
      }
    }
    this.at(this.t, 1, from, to)
    this.at(this.p, 0.9, from, to)
    this.t.sub(this.p)
    this.t.z *= 0.5
    this.t.normalize()
    const open = 1 - grip
    const hang = open * (1 - strain) * ARM.droop * Math.max(0, -this.t.y)
    const back = Math.min(1, open * strain * ARM.wrist)
    if (hang > 0 || back > 0) {
      const flatT = Math.hypot(this.t.x, this.t.y) || 1
      let a = Math.atan2(this.t.y, this.t.x)
      const turn = (goal: number, share: number): void => {
        let by = goal - a
        while (by > Math.PI) by -= Math.PI * 2
        while (by < -Math.PI) by += Math.PI * 2
        a += by * share
      }
      turn(-Math.PI / 2, hang)
      turn(Math.PI / 2, back)
      this.t.set(Math.cos(a) * flatT, Math.sin(a) * flatT, this.t.z).normalize()
    }
    this.n1.set(this.t.y, -this.t.x, 0)
    if (this.n1.lengthSq() < 1e-6) this.n1.set(1, 0, 0)
    this.n1.normalize()
    this.n2.crossVectors(this.n1, this.t)
    this.basis.makeBasis(this.n1, this.t, this.n2)
    this.hand.quaternion.setFromRotationMatrix(this.basis)
    this.hand.position.copy(to)
    const size = (0.25 + 0.75 * Math.min(1.15, Math.max(0, grown))) * HAND_SCALE * (1 + FIST * grip)
    this.hand.scale.setScalar(size)
    const w = this.wrap
    const v = 1 - w
    for (const f of this.fingers) {
      const splay = f.open + (f.shut - f.open) * grip
      if (f.thumb) {
        f.base.position.set(f.x * v + WRAP.thumb[0]! * this.side * w, f.y * v + WRAP.thumb[1]! * w, -0.4 * grip * v + WRAP.thumb[2]! * w)
        f.base.rotation.set(-0.9 * grip * v - WRAP.flat * w, -0.5 * grip * this.side * v, splay * v + WRAP.turn * this.side * w)
        f.tip.rotation.x = (-0.9 * grip - 0.1) * v - WRAP.flat * w
      } else {
        f.base.position.set(f.x, f.y, WRAP.under * w)
        f.base.rotation.set((-HAND.curl * grip - 0.14) * v - WRAP.dive * w, 0, splay)
        f.tip.rotation.x = (-HAND.knuckle * grip - 0.22) * v - WRAP.tip * w
      }
    }
    this.hand.updateMatrixWorld(true)
    d3.palms.setMatrixAt(this.slot, this.palm.matrixWorld)
    this.fingers.forEach((f, i) => {
      d3.joints.setMatrixAt(this.slot * HAND.joints + i * 2, f.base.matrixWorld)
      d3.joints.setMatrixAt(this.slot * HAND.joints + i * 2 + 1, f.tip.matrixWorld)
    })
  }
}

const HAND_SCALE = 1.3
// A closed hand is a touch larger than an open one, so it is not lost on the sheet it holds.
const FIST = 0.08

interface Draw { position: THREE.BufferAttribute; normal: THREE.BufferAttribute; palms: THREE.InstancedMesh; joints: THREE.InstancedMesh }

// Two thin matte black rubber arms with small plain hands of three fingers and a thumb. Three draws for the pair: both tubes as one mesh, then the palms and the finger joints as instances.
export const makeArms: (() => Arms) | null = () => {
  const s = parts()
  const root = new THREE.Group()
  const count = 2 * RINGS * RING
  const geometry = new THREE.BufferGeometry()
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  const uv = new Float32Array(count * 2)
  const index: number[] = []
  for (let limb = 0; limb < 2; limb++) {
    for (let i = 0; i < RINGS; i++) {
      for (let j = 0; j < RING; j++) {
        const a = limb * RINGS * RING + i * RING + j
        uv[a * 2] = j / ARM.round
        uv[a * 2 + 1] = i / ARM.along
        if (i === ARM.along || j === ARM.round) continue
        const b = a + RING
        index.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
  }
  geometry.setAttribute('position', position)
  geometry.setAttribute('normal', normal)
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setIndex(index)
  const add = <T extends THREE.Mesh>(m: T): T => {
    m.castShadow = true
    m.receiveShadow = true
    m.frustumCulled = false
    root.add(m)
    return m
  }
  add(new THREE.Mesh(geometry, s.rubber))
  const draw: Draw = {
    position,
    normal,
    palms: add(new THREE.InstancedMesh(s.palm, s.rubber, 2)),
    joints: add(new THREE.InstancedMesh(s.joint, s.rubber, 2 * HAND.joints))
  }
  const limbs = [new Limb(-1, 0), new Limb(1, 1)]
  const arms: Arms = {
    root,
    grown: 1,
    over: 0,
    axis: [1, 0],
    inward: [null, null],
    apply(from: [THREE.Vector3, THREE.Vector3], to: [THREE.Vector3, THREE.Vector3], look: ArmsLook): void {
      for (let i = 0; i < 2; i++) limbs[i]!.pose(draw, from[i]!, to[i]!, Math.min(1, Math.max(0, look.grip[i]!)), Math.min(1, Math.max(0, look.strain)), arms.grown, arms.axis, arms.inward[i]!, arms.over)
      position.needsUpdate = true
      normal.needsUpdate = true
      draw.palms.instanceMatrix.needsUpdate = true
      draw.joints.instanceMatrix.needsUpdate = true
    },
    dispose(): void {
      geometry.dispose()
      draw.palms.dispose()
      draw.joints.dispose()
    }
  }
  return arms
}

// What the arms are built from, for the notes and the report.
export const armsTextures = (): { name: string; px: number; megabytes: number }[] => [{ name: 'rubber grain, a tiling normal picture made from the seed', px: ARM.grainPx, megabytes: (ARM.grainPx * ARM.grainPx * 4 * 4) / 3 / 1048576 }]

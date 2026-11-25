import * as THREE from 'three'
import { config } from '../../config'
import { studio } from '../../post/studio'
import { grainNormalMap } from '../../shell/materials'
import type { ArmsLook, ArmsModel } from '../contract'

// Sizes in page pixels. The arm is a rubber hose 7% of the body's height thick, the hand a fifth of it long.
// A hose is `rest` long and never shorter. A hand nearer than that leaves the rest as slack: the hose leaves the body outward (`out`), bows round in one loop and comes to the hand along the line of its reach (`into`). A hand further away stretches it: it is still `taut` longer than the straight line, so it keeps a curve, and it thins by `thin` at full strain and by the root of its stretch. `most` is the longest a short reach may be for its length, so a hand that is still growing out does not throw a loop. An open hand that pushes bends back at the wrist by `wrist`; an open hand that hangs lets its fingers fall by `droop`.
const H = config.cursor.heightPxAt1080
export const ARM = { radius: H * 0.04, rest: 50, taut: 1.12, most: 2.1, out: 0.16, into: 0.3, ease: 0.45, thin: 0.12, along: 34, round: 12, grainPx: 64, wrist: 1, droop: 0.6, low: 0.15, rise: 0.55 }
const HAND = { palm: [4.6, 4.7, 2.7], palmY: 4.8, finger: 1.5, joint: 3.1, joints: 8 }

export interface Arms extends ArmsModel {
  // How far the arms have grown, 0 to 1 and a little over: the hands swell with it.
  grown: number
  // The height of the body's top face, in the same space as the shoulders.
  over: number
  // From the first shoulder to the second, a unit vector in the plane of the page: each hose bows away from the other.
  axis: [number, number]
}

let shared: { rubber: THREE.MeshPhysicalMaterial; grain: THREE.DataTexture; palm: THREE.BufferGeometry; joint: THREE.BufferGeometry } | null = null

function parts() {
  if (shared) return shared
  const grain = grainNormalMap(ARM.grainPx, config.seed + 7, 1.6)
  grain.repeat.set(2, 5)
  const rubber = studio(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(0x1b1b1c, THREE.SRGBColorSpace),
      roughness: 0.6,
      metalness: 0,
      sheen: 0.25,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color().setHex(0x8a8680, THREE.SRGBColorSpace),
      normalMap: grain,
      normalScale: new THREE.Vector2(0.07, 0.07),
      specularIntensity: 0.5
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
  private p = new THREE.Vector3()
  private t = new THREE.Vector3()
  private n1 = new THREE.Vector3()
  private n2 = new THREE.Vector3()
  private basis = new THREE.Matrix4()

  constructor(private side: number, private slot: number) {
    this.palm.position.set(0, HAND.palmY, 0)
    this.hand.add(this.palm)
    const lay: [number, number, number, number, number, boolean][] = [
      [-2.5, 7.4, 0.11, 0.04, 1, false], [0, 8.1, 0, 0, 1.12, false], [2.5, 7.4, -0.11, -0.04, 1, false], [3.6, 3.4, -0.95, -0.45, 0.86, true]
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
    out.set(a * from.x + b * this.c.x + c * this.e.x + d * to.x, a * from.y + b * this.c.y + c * this.e.y + d * to.y, from.z + (z - from.z) * w * w * (3 - 2 * w))
  }

  private bow(from: THREE.Vector3, to: THREE.Vector3, ex: number, ey: number, px: number, py: number, d: number, h: number): number {
    this.c.set(from.x + px * h - ex * ARM.out * h, from.y + py * h - ey * ARM.out * h, 0)
    this.e.set(to.x + px * h * ARM.ease - ex * ARM.into * d, to.y + py * h * ARM.ease - ey * ARM.into * d, 0)
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

  pose(d3: Draw, from: THREE.Vector3, to: THREE.Vector3, grip: number, strain: number, grown: number, axis: [number, number]): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const d = Math.max(1e-3, Math.hypot(dx, dy, to.z - from.z))
    const flat = Math.max(1e-3, Math.hypot(dx, dy))
    const ex = dx / flat
    const ey = dy / flat
    const length = Math.min(d * ARM.most, Math.max(ARM.rest, d * ARM.taut))
    let px = -ey
    let py = ex
    const want = (px * axis[0] + py * axis[1]) * this.side * 0.857 + py * 0.514
    if (want < 0) {
      px = -px
      py = -py
    }
    // An arm whose hand is on the far side of the body goes under it and comes out at the far edge: no arm lies over the white face.
    const across = Math.min(1, Math.max(0, (-this.side * (dx * axis[0] + dy * axis[1]) - 6) / 10))
    this.lift = 0
    let lo = 0
    let hi = length
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (this.bow(from, to, ex, ey, px, py, flat, mid) < length) lo = mid
      else hi = mid
    }
    const h = lo * Math.min(1, Math.abs(want) * 3)
    this.bow(from, to, ex, ey, px, py, flat, h)
    this.lift = (1 + h * 0.1) * (1 - across)
    const thin = Math.pow(Math.min(1, ARM.rest / length), 0.3) * (1 - ARM.thin * strain)
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
      const r = ARM.radius * thin * (0.94 + 0.12 * u) * (0.35 + 0.65 * Math.min(1, grown)) * nose
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
    for (const f of this.fingers) {
      const splay = f.open + (f.shut - f.open) * grip
      f.base.position.set(f.x, f.y, f.thumb ? -0.4 * grip : 0)
      f.base.rotation.set(f.thumb ? -0.9 * grip : -0.95 * grip - 0.14, f.thumb ? -0.5 * grip * this.side : 0, splay)
      f.tip.rotation.x = f.thumb ? -0.9 * grip - 0.1 : -1.1 * grip - 0.22
    }
    this.hand.updateMatrixWorld(true)
    d3.palms.setMatrixAt(this.slot, this.palm.matrixWorld)
    this.fingers.forEach((f, i) => {
      d3.joints.setMatrixAt(this.slot * HAND.joints + i * 2, f.base.matrixWorld)
      d3.joints.setMatrixAt(this.slot * HAND.joints + i * 2 + 1, f.tip.matrixWorld)
    })
  }
}

const HAND_SCALE = 1.05
// A clenched fist bulges: without this a closed hand is half the size of an open one and is lost on the sheet it holds.
const FIST = 0.4

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
    apply(from: [THREE.Vector3, THREE.Vector3], to: [THREE.Vector3, THREE.Vector3], look: ArmsLook): void {
      for (let i = 0; i < 2; i++) limbs[i]!.pose(draw, from[i]!, to[i]!, Math.min(1, Math.max(0, look.grip[i]!)), Math.min(1, Math.max(0, look.strain)), arms.grown, arms.axis)
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

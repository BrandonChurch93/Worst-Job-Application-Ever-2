import * as THREE from 'three'
import { config } from '../../config'
import { studio } from '../../post/studio'
import { grainNormalMap } from '../../shell/materials'
import type { ArmsLook, ArmsModel } from '../contract'

// Sizes in page pixels. The arm is 6% of the body's height thick.
const H = config.cursor.heightPxAt1080
export const ARM = { radius: H * 0.03, rest: 62, along: 22, round: 10, grainPx: 64 }
const HAND = { palm: [4.9, 4.9, 3.3], palmY: 5.0, finger: 1.95, joint: 2.5, cuff: 3.0, cuffTube: 1.3 }

export interface Arms extends ArmsModel {
  // How far the arms have grown, 0 to 1 and a little over: the hands swell with it.
  grown: number
}

let shared: { rubber: THREE.MeshPhysicalMaterial; grain: THREE.DataTexture; palm: THREE.BufferGeometry; joint: THREE.BufferGeometry; cuff: THREE.BufferGeometry } | null = null

function parts() {
  if (shared) return shared
  const grain = grainNormalMap(ARM.grainPx, config.seed + 7, 1.6)
  grain.repeat.set(3, 9)
  const rubber = studio(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHex(0x1d1c1b, THREE.SRGBColorSpace),
      roughness: 0.72,
      metalness: 0,
      sheen: 0.55,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color().setHex(0x6a6661, THREE.SRGBColorSpace),
      normalMap: grain,
      normalScale: new THREE.Vector2(0.45, 0.45),
      specularIntensity: 0.5
    })
  )
  const palm = new THREE.SphereGeometry(1, 20, 14).scale(HAND.palm[0]!, HAND.palm[1]!, HAND.palm[2]!)
  const joint = new THREE.CapsuleGeometry(HAND.finger, HAND.joint, 4, 10).translate(0, HAND.joint / 2, 0)
  const cuff = new THREE.TorusGeometry(HAND.cuff, HAND.cuffTube, 8, 18).rotateX(Math.PI / 2)
  shared = { rubber, grain, palm, joint, cuff }
  return shared
}

interface Finger { base: THREE.Mesh; tip: THREE.Mesh; x: number; y: number; open: number; shut: number; thumb: boolean }

class Limb {
  readonly tube: THREE.Mesh
  readonly hand = new THREE.Group()
  private fingers: Finger[] = []
  private position: THREE.BufferAttribute
  private normal: THREE.BufferAttribute
  private c = new THREE.Vector3()
  private p = new THREE.Vector3()
  private t = new THREE.Vector3()
  private n1 = new THREE.Vector3()
  private n2 = new THREE.Vector3()
  private basis = new THREE.Matrix4()

  constructor(private side: number) {
    const s = parts()
    const rings = ARM.along + 1
    const geometry = new THREE.BufferGeometry()
    this.position = new THREE.BufferAttribute(new Float32Array(rings * (ARM.round + 1) * 3), 3)
    this.normal = new THREE.BufferAttribute(new Float32Array(rings * (ARM.round + 1) * 3), 3)
    const uv = new Float32Array(rings * (ARM.round + 1) * 2)
    const index: number[] = []
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j <= ARM.round; j++) {
        uv[(i * (ARM.round + 1) + j) * 2] = j / ARM.round
        uv[(i * (ARM.round + 1) + j) * 2 + 1] = i / ARM.along
        if (i === ARM.along || j === ARM.round) continue
        const a = i * (ARM.round + 1) + j
        const b = a + ARM.round + 1
        index.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
    geometry.setAttribute('position', this.position)
    geometry.setAttribute('normal', this.normal)
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    geometry.setIndex(index)
    this.tube = new THREE.Mesh(geometry, s.rubber)
    this.tube.frustumCulled = false
    const add = (m: THREE.Mesh, to: THREE.Object3D): THREE.Mesh => {
      m.castShadow = true
      m.receiveShadow = true
      to.add(m)
      return m
    }
    add(this.tube, new THREE.Group())
    const palm = add(new THREE.Mesh(s.palm, s.rubber), this.hand)
    palm.position.set(0, HAND.palmY, 0)
    add(new THREE.Mesh(s.cuff, s.rubber), this.hand).position.set(0, 0.4, 0)
    const lay: [number, number, number, number, number, boolean][] = [
      [-2.95, 7.6, 0.24, 0.06, 1, false], [0, 8.3, 0, 0, 1.12, false], [2.95, 7.6, -0.24, -0.06, 1, false], [3.7, 3.4, -1.1, -0.45, 0.9, true]
    ]
    for (const [x, y, open, shut, long, thumb] of lay) {
      const base = add(new THREE.Mesh(s.joint, s.rubber), this.hand)
      base.rotation.order = 'ZXY'
      base.scale.set(1, long, 1)
      const tip = add(new THREE.Mesh(s.joint, s.rubber), base)
      tip.position.set(0, HAND.joint, 0)
      tip.scale.set(0.94, 0.9, 0.94)
      this.fingers.push({ base, tip, x, y, open, shut, thumb })
    }
  }

  pose(from: THREE.Vector3, to: THREE.Vector3, grip: number, strain: number, grown: number): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const d = Math.max(1e-3, Math.hypot(dx, dy, to.z - from.z))
    const flat = Math.max(1e-3, Math.hypot(dx, dy))
    const length = Math.min(ARM.rest, Math.max(14, d * 1.07))
    let px = -dy / flat
    let py = dx / flat
    const want = px * this.side * 0.857 - py * 0.514
    if (want < 0) {
      px = -px
      py = -py
    }
    const sag = Math.sqrt((3 * d * Math.max(0, length - d)) / 8) * (1 - 0.86 * strain) * Math.min(1, Math.abs(want) * 3) + 0.035 * d
    this.c.set((from.x + to.x) / 2 + px * sag * 2, (from.y + to.y) / 2 + py * sag * 2, (from.z + to.z) / 2 + 1.5 + sag * 0.3)
    const thin = Math.max(0.55, Math.sqrt(Math.min(1, ARM.rest / d))) * (1 - 0.3 * strain)
    const pos = this.position.array as Float32Array
    const nor = this.normal.array as Float32Array
    let k = 0
    for (let i = 0; i <= ARM.along; i++) {
      const u = i / ARM.along
      const a = (1 - u) * (1 - u)
      const b = 2 * u * (1 - u)
      const c = u * u
      this.p.set(a * from.x + b * this.c.x + c * to.x, a * from.y + b * this.c.y + c * to.y, a * from.z + b * this.c.z + c * to.z)
      this.t.set((1 - u) * (this.c.x - from.x) + u * (to.x - this.c.x), (1 - u) * (this.c.y - from.y) + u * (to.y - this.c.y), (1 - u) * (this.c.z - from.z) + u * (to.z - this.c.z)).normalize()
      this.n1.set(this.t.y, -this.t.x, 0)
      if (this.n1.lengthSq() < 1e-6) this.n1.set(1, 0, 0)
      this.n1.normalize()
      this.n2.crossVectors(this.n1, this.t)
      const r = ARM.radius * thin * (1.1 - 0.2 * u) * (0.35 + 0.65 * Math.min(1, grown))
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
    this.position.needsUpdate = true
    this.normal.needsUpdate = true
    this.t.set(to.x - this.c.x, to.y - this.c.y, (to.z - this.c.z) * 0.5).normalize()
    this.n1.set(this.t.y, -this.t.x, 0)
    if (this.n1.lengthSq() < 1e-6) this.n1.set(1, 0, 0)
    this.n1.normalize()
    this.n2.crossVectors(this.n1, this.t)
    this.basis.makeBasis(this.n1, this.t, this.n2)
    this.hand.quaternion.setFromRotationMatrix(this.basis)
    this.hand.position.copy(to)
    const size = 0.25 + 0.75 * Math.min(1.15, Math.max(0, grown))
    this.hand.scale.set(this.side < 0 ? -size : size, size, size)
    for (const f of this.fingers) {
      const splay = f.open + (f.shut - f.open) * grip
      f.base.position.set(f.x, f.y, f.thumb ? -0.4 * grip : 0)
      f.base.rotation.set(f.thumb ? -0.9 * grip : -1.25 * grip - 0.08, f.thumb ? -0.5 * grip : 0, splay)
      f.tip.rotation.x = f.thumb ? -0.9 * grip - 0.1 : -1.45 * grip - 0.12
    }
  }

  dispose(): void {
    this.tube.geometry.dispose()
  }
}

// Two thin matte black rubber arms with small plain mitt hands. Each is a tube laid along a bending chain from its shoulder to its hand.
export const makeArms: (() => Arms) | null = () => {
  const root = new THREE.Group()
  const limbs = [new Limb(-1), new Limb(1)]
  for (const l of limbs) root.add(l.tube.parent!, l.hand)
  const arms: Arms = {
    root,
    grown: 1,
    apply(from: [THREE.Vector3, THREE.Vector3], to: [THREE.Vector3, THREE.Vector3], look: ArmsLook): void {
      for (let i = 0; i < 2; i++) limbs[i]!.pose(from[i]!, to[i]!, Math.min(1, Math.max(0, look.grip[i]!)), Math.min(1, Math.max(0, look.strain)), arms.grown)
    },
    dispose(): void {
      for (const l of limbs) l.dispose()
    }
  }
  return arms
}

// What the arms are built from, for the notes and the report.
export const armsTextures = (): { name: string; px: number; megabytes: number }[] => [{ name: 'rubber grain, a tiling normal picture made from the seed', px: ARM.grainPx, megabytes: (ARM.grainPx * ARM.grainPx * 4 * 4) / 3 / 1048576 }]

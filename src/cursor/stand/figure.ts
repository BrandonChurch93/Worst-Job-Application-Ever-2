// The standing arrow: the approved body and the approved arms, with two hose legs of the arms' own rubber and small shoes.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import { makeArms, ARM, type Arms } from '../act/arms'
import { UNIT, restLook, type BodyModel } from '../contract'
import { makeBody } from '../model/body'
import { STAND, type StandPose } from './rig'

const ALONG = 22
const ROUND = 10
const RING = ROUND + 1
const RINGS = ALONG + 1

export interface Stand {
  object: THREE.Object3D
  apply(p: StandPose, time: number): void
  // What it is drawn with: draw calls and triangles, for the report.
  counts(): { draws: number; triangles: number }
  dispose(): void
}

function shoeShape(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 20, 14)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const [long, tall, deep] = STAND.shoe
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // A flat sole, a round toe box a little taller than the heel.
    const toe = x > 0 ? 1.18 : 0.72
    const top = y > 0 ? tall * (0.86 + 0.14 * x) : 1.4
    pos.setXYZ(i, x * long * toe + 2, y * top + 1.4, z * deep * (x > 0 ? 1 : 0.86))
  }
  g.computeVertexNormals()
  return g
}

export function makeStand(): Stand {
  if (!makeBody || !makeArms) throw new Error('The standing arrow needs the body and the arms')
  const object = new THREE.Group()
  object.name = 'stand'
  const plane = new THREE.Group()
  object.add(plane)
  const body: BodyModel = makeBody()
  const arms: Arms = makeArms()
  plane.add(body.root, arms.root)
  const rubber = (arms.root.children[0] as THREE.Mesh).material as THREE.Material

  const count = 2 * RINGS * RING
  const geometry = new THREE.BufferGeometry()
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage)
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage)
  const uv = new Float32Array(count * 2)
  const index: number[] = []
  for (let leg = 0; leg < 2; leg++) {
    for (let i = 0; i < RINGS; i++) {
      for (let j = 0; j < RING; j++) {
        const a = leg * RINGS * RING + i * RING + j
        uv[a * 2] = j / ROUND
        uv[a * 2 + 1] = i / ALONG
        if (i === ALONG || j === ROUND) continue
        const b = a + RING
        index.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
  }
  geometry.setAttribute('position', position)
  geometry.setAttribute('normal', normal)
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setIndex(index)
  const hose = new THREE.Mesh(geometry, rubber)
  const shoe = shoeShape()
  const shoes = new THREE.InstancedMesh(shoe, rubber, 2)
  for (const m of [hose, shoes]) {
    m.castShadow = true
    m.receiveShadow = true
    m.frustumCulled = false
    plane.add(m)
  }

  const from: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]
  const to: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()]
  const hip = new THREE.Vector3()
  const p3 = new THREE.Vector3()
  const t3 = new THREE.Vector3()
  const n1 = new THREE.Vector3()
  const n2 = new THREE.Vector3()
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const qy = new THREE.Quaternion()
  const e = new THREE.Euler()
  const sc = new THREE.Vector3()
  const Y = new THREE.Vector3(0, 1, 0)

  // A point of the outline, as the body is drawn now, in the figure's plane.
  const onBody = (ux: number, uy: number, out: THREE.Vector3): THREE.Vector3 => body.anchor(ux, uy, out).applyEuler(body.root.rotation).add(body.root.position)

  const apply = (p: StandPose, time: number): void => {
    object.position.set(p.x - 960, 540 - p.y, p.ground)
    plane.rotation.set(STAND.rise * p.rise, 0, 0)
    const look = restLook(time)
    look.body.stretch = p.stretch
    look.body.puff = p.puff
    look.body.tremble = p.tremble
    body.root.rotation.set(0, 0, p.lean)
    body.root.position.set(0, 0, 0)
    body.apply(look.body)
    // The body is carried by its pivot: the pivot as it is drawn now stands on the pose's hip.
    body.anchor(STAND.pivot[0], STAND.pivot[1], p3).applyEuler(body.root.rotation)
    body.root.position.set(p.hip[0] - p3.x, p.hip[1] - p3.y, 0)

    arms.root.visible = p.arms > 0.02
    if (arms.root.visible) {
      for (let i = 0; i < 2; i++) {
        const s = STAND.shoulders[i]!
        onBody(s[0], s[1], from[i]!)
        const h = p.hands[i]!
        to[i]!.set(h[0], h[1], h[2]).lerpVectors(from[i]!, to[i]!, Math.min(1.12, p.arms))
      }
      const ax = from[1]!.x - from[0]!.x
      const ay = from[1]!.y - from[0]!.y
      const al = Math.hypot(ax, ay) || 1
      arms.axis = [ax / al, ay / al]
      arms.inward = [null, null]
      arms.grown = p.arms
      arms.over = 2 * Math.max(from[0]!.z, from[1]!.z)
      look.arms.grip = [p.grip[0], p.grip[1]]
      look.arms.strain = p.strain
      arms.apply(from, to, look.arms)
    }

    const out = p.legs
    hose.visible = shoes.visible = out > 0.02
    if (!hose.visible) return
    const pos = position.array as Float32Array
    const nor = normal.array as Float32Array
    let k = 0
    for (let i = 0; i < 2; i++) {
      const h = STAND.hips[i]!
      onBody(h[0], h[1], hip)
      hip.z = 2.2 - i * 0.8
      const f = p.feet[i]!
      const sx = hip.x + (f[0] - hip.x) * out
      const sy = hip.y + (f[1] - hip.y) * out
      const ax = sx
      const ay = sy + STAND.ankle * out
      const az = hip.z + (i === 0 ? 1.2 : -1.2) * out
      const dx = ax - hip.x
      const dy = ay - hip.y
      const d = Math.max(1e-3, Math.hypot(dx, dy))
      const long = STAND.leg * out
      const bend = d < long ? Math.sqrt((long * long - d * d) / 4) : 0
      const side = p.knees[i]!
      const cx = (hip.x + ax) / 2 + (-dy / d) * (bend * 2 + 1.5) * side
      const cy = (hip.y + ay) / 2 + (dx / d) * (bend * 2 + 1.5) * side
      const thick = (STAND.hose / 2) * (0.4 + 0.6 * out)
      for (let a = 0; a <= ALONG; a++) {
        const u = a / ALONG
        const v = 1 - u
        p3.set(v * v * hip.x + 2 * v * u * cx + u * u * ax, v * v * hip.y + 2 * v * u * cy + u * u * ay, hip.z + (az - hip.z) * u)
        t3.set(2 * v * (cx - hip.x) + 2 * u * (ax - cx), 2 * v * (cy - hip.y) + 2 * u * (ay - cy), az - hip.z)
        if (t3.lengthSq() < 1e-8) t3.set(0, -1, 0)
        t3.normalize()
        n1.set(t3.y, -t3.x, 0)
        if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0)
        n1.normalize()
        n2.crossVectors(n1, t3)
        const nose = a === 0 ? 0.05 : a === 1 ? 0.62 : a === 2 ? 0.92 : 1
        const cuff = a === ALONG ? 1.15 : a === ALONG - 1 ? 1.5 : a === ALONG - 2 ? 1.5 : a === ALONG - 3 ? 1.2 : 1
        const r = thick * (ARM.thick - 0.2 * u) * nose * cuff
        for (let j = 0; j <= ROUND; j++) {
          const w = (j / ROUND) * Math.PI * 2
          const c = Math.cos(w)
          const s = Math.sin(w)
          const nx = n1.x * c + n2.x * s
          const ny = n1.y * c + n2.y * s
          const nz = n1.z * c + n2.z * s
          pos[k] = p3.x + nx * r
          pos[k + 1] = p3.y + ny * r
          pos[k + 2] = p3.z + nz * r
          nor[k] = nx
          nor[k + 1] = ny
          nor[k + 2] = nz
          k += 3
        }
      }
      const dir = p.toes[i]!
      qy.setFromAxisAngle(Y, ((1 - dir) / 2) * Math.PI)
      q.setFromEuler(e.set(0, 0, -p.pitch[i]! * (dir >= 0 ? 1 : -1))).multiply(qy)
      const size = 0.3 + 0.7 * out
      shoes.setMatrixAt(i, m4.compose(p3.set(sx, sy, az), q, sc.set(size, size, size)))
    }
    position.needsUpdate = true
    normal.needsUpdate = true
    shoes.instanceMatrix.needsUpdate = true
  }

  return {
    object,
    apply,
    counts(): { draws: number; triangles: number } {
      let draws = 0
      let triangles = 0
      object.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh || !m.visible) return
        let seen = true
        for (let a: THREE.Object3D | null = m; a; a = a.parent) if (!a.visible) seen = false
        if (!seen) return
        draws++
        const g = m.geometry
        const n = (g.index ? g.index.count : g.getAttribute('position').count) / 3
        triangles += n * ((m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh).count : 1)
      })
      return { draws, triangles }
    },
    dispose(): void {
      body.dispose()
      arms.dispose()
      geometry.dispose()
      shoe.dispose()
      shoes.dispose()
    }
  }
}

export const STAND_UNIT = UNIT

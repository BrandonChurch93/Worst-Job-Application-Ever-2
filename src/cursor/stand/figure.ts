// The standing arrow: the approved body and the approved arms, with two hose legs of the arms' own rubber and small shoes.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
import * as THREE from 'three'
import { makeArms, ARM, type Arms } from '../act/arms'
import { UNIT, restLook, type BodyModel } from '../contract'
import { makeBody } from '../model/body'
import { look as picture } from '../../post/look'
import { STAND, type StandPose } from './rig'

const ALONG = 22
const ROUND = 10
const RING = ROUND + 1
const RINGS = ALONG + 1

export interface Stand {
  object: THREE.Object3D
  // `shade`: how dark the long shadow is, 0 to 1 (a flame beside the figure washes it out), and which way it falls when another light than the key throws it: px along the page (x right, y up the page) for each px of height.
  apply(p: StandPose, time: number, shade?: number, fall?: [number, number] | null): void
  // A thin warm rim on the legs, the arms and the gloves, 0 to 1: the light of embers on black rubber over burnt ground. The white body has none.
  rim(k: number): void
  // The live site's level: at `low` the long shadow is thrown by fewer pieces.
  setLevel(level: 'low' | 'medium' | 'high' | null): void
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

// The long shadow: every piece of the figure once more, laid flat on the ground the way the key's shadows fall, from the shoes outward.
// The site's light keeps the shadow of anything tall short; a figure that stands needs the one that starts at its feet and runs.
function shadeStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: true, depthFunc: THREE.LessDepth, toneMapped: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uToGround: { value: new THREE.Matrix4() }, uFall: { value: new THREE.Vector3() }, uK: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform mat4 uToGround; uniform vec3 uFall;
      varying float vH;
      void main() {
        vec4 at = vec4(position, 1.0);
        #ifdef USE_INSTANCING
        at = instanceMatrix * at;
        #endif
        vec4 g = uToGround * at;
        float h = max(g.z, 0.0);
        vH = h;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(g.x + uFall.x * h, g.y + uFall.y * h, uFall.z, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uK;
      varying float vH;
      void main() {
        float a = uK * mix(1.0, 0.42, clamp(vH / 85.0, 0.0, 1.0));
        if (a < 0.004) discard;
        gl_FragColor = vec4(0.07, 0.065, 0.075, a);
      }`
  })
}

// The ember rim: each piece of rubber once more, a little larger and seen from inside, so only its edge shows round the piece itself.
function rimStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.BackSide,
    uniforms: { uK: { value: 0 }, uWide: { value: STAND.rim } },
    vertexShader: /* glsl */ `
      uniform float uWide;
      void main() {
        vec4 at = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
        at = instanceMatrix * at;
        n = mat3(instanceMatrix) * n;
        #endif
        at.xyz += normalize(n) * uWide;
        gl_Position = projectionMatrix * modelViewMatrix * at;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uK;
      void main() {
        if (uK < 0.004) discard;
        gl_FragColor = vec4(1.0, 0.46, 0.12, uK);
      }`
  })
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

  const shades: { of: THREE.Mesh; twin: THREE.Mesh; stuff: THREE.ShaderMaterial; small: boolean }[] = []
  const shadeBase = shadeStuff()
  const shadow = new THREE.Group()
  object.add(shadow)
  plane.traverse((o) => {
    const of = o as THREE.Mesh
    if (!of.isMesh || !of.castShadow) return
    const stuff = shadeBase.clone()
    const inst = of as unknown as THREE.InstancedMesh
    const twin = inst.isInstancedMesh ? new THREE.InstancedMesh(of.geometry, stuff, inst.count) : new THREE.Mesh(of.geometry, stuff)
    if (inst.isInstancedMesh) (twin as THREE.InstancedMesh).instanceMatrix = inst.instanceMatrix
    twin.frustumCulled = false
    twin.renderOrder = 6
    twin.userData.order = 6
    shadow.add(twin)
    shades.push({ of, twin, stuff, small: inst.isInstancedMesh && inst.count > 2 })
  })
  // The rim's pieces: children of the rubber pieces they follow, added after the shadows are gathered so they throw none.
  const rimMat = rimStuff()
  // The hoses are wound the other way round from the gloves and the shoes: their rim is the same one seen from the other side.
  const rimHose = rimStuff()
  rimHose.side = THREE.FrontSide
  const rims: { of: THREE.Mesh; twin: THREE.Mesh }[] = []
  for (const of of [...(arms.root.children as THREE.Mesh[]), hose, shoes]) {
    if (!of.isMesh) continue
    const inst = of as unknown as THREE.InstancedMesh
    const twin = inst.isInstancedMesh ? new THREE.InstancedMesh(of.geometry, rimMat, inst.count) : new THREE.Mesh(of.geometry, rimHose)
    if (inst.isInstancedMesh) (twin as THREE.InstancedMesh).instanceMatrix = inst.instanceMatrix
    twin.frustumCulled = false
    twin.visible = false
    twin.renderOrder = 7
    of.add(twin)
    rims.push({ of, twin })
  }
  const rim = (k: number): void => {
    const on = k > 0.004
    rimMat.uniforms.uK!.value = rimHose.uniforms.uK!.value = Math.min(1, Math.max(0, k)) * STAND.ember
    for (const r of rims) {
      r.twin.visible = on
      const inst = r.of as unknown as THREE.InstancedMesh
      if (on && inst.isInstancedMesh) (r.twin as THREE.InstancedMesh).count = inst.count
    }
  }
  let few = false
  const inv = new THREE.Matrix4()
  const key = picture.key.direction
  const layShadow = (shade: number, fall: [number, number] | null): void => {
    shadow.visible = shade > 0.01
    if (!shadow.visible) return
    object.updateMatrixWorld(true)
    inv.copy(object.matrixWorld).invert()
    for (const s of shades) {
      let seen = s.of.visible && !(few && s.small)
      for (let a: THREE.Object3D | null = s.of.parent; a && a !== object; a = a.parent) if (!a.visible) seen = false
      s.twin.visible = seen
      if (!seen) continue
      const inst = s.of as unknown as THREE.InstancedMesh
      if (inst.isInstancedMesh) (s.twin as THREE.InstancedMesh).count = inst.count
      const u = s.stuff.uniforms
      ;(u.uToGround!.value as THREE.Matrix4).multiplyMatrices(inv, s.of.matrixWorld)
      if (fall) (u.uFall!.value as THREE.Vector3).set(fall[0], fall[1], 0.22)
      else (u.uFall!.value as THREE.Vector3).set((-key[0] / key[2]) * STAND.shadow, (-key[1] / key[2]) * STAND.shadow, 0.22)
      u.uK!.value = STAND.shade * shade
    }
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

  const apply = (p: StandPose, time: number, shade = 1, fall: [number, number] | null = null): void => {
    pose(p, time)
    layShadow(shade * Math.min(1, p.rise * 2.5), fall)
  }

  const pose = (p: StandPose, time: number): void => {
    object.position.set(p.x - 960, 540 - p.y, p.ground)
    object.scale.setScalar(p.scale ?? 1)
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
        onBody(s[0], s[1] + STAND.tuck * Math.min(1, Math.max(0, p.tuck ?? 0)), from[i]!)
        const h = p.hands[i]!
        to[i]!.set(h[0], h[1], h[2]).lerpVectors(from[i]!, to[i]!, Math.min(1.12, p.arms))
      }
      const ax = from[1]!.x - from[0]!.x
      const ay = from[1]!.y - from[0]!.y
      const al = Math.hypot(ax, ay) || 1
      arms.axis = [ax / al, ay / al]
      arms.inward = [null, null]
      arms.grown = p.arms
      arms.bulk = 1 + (STAND.bulk - 1) * Math.min(1, p.legs)
      arms.glove = 1 + (STAND.glove - 1) * Math.min(1, p.legs)
      arms.clench = Math.min(1, p.legs)
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
    rim,
    setLevel(level: 'low' | 'medium' | 'high' | null): void {
      few = level === 'low'
    },
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
      shadeBase.dispose()
      rimMat.dispose()
      rimHose.dispose()
      for (const s of shades) s.stuff.dispose()
    }
  }
}

export const STAND_UNIT = UNIT

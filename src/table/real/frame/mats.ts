import * as THREE from 'three'
import { studio } from '../../../post/studio'
import { materials } from '../../../shell/materials'
import { lit } from '../light'
import { LIT } from '../lights/groups'
import { zone, type Zone } from '../zone'
import { Geo, type RGB } from './geo'
import { steel } from './steel'

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
// The machine's orange, on the bats, the plunger's knob, the lift's doors and elbows: the colour that reads as the approved bats under the lamps of a tier.
export const MACHINE_ORANGE = 0xc48004
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]

export const TONE = {
  alu: hex(0xdde0e3),
  aluDark: hex(0xa3a7ac),
  aluDeep: hex(0x777b80),
  aluBright: hex(0xeceef0),
  brass: hex(0xc9a45c),
  ceramic: hex(0xecebe6),
  gap: hex(0x23211f),
  bezel: hex(0x1d1d1f),
  pocket: hex(0x101113),
  laminate: hex(0x8f9498),
  kerb: hex(0xa3a19a),
  kerbBlack: hex(0x1e1e1f),
  kerbYellow: hex(0xd9b21c),
  enamel: hex(0xe9e4d6),
  enamelRing: hex(0x2a2c30),
  paper: hex(0xf3efe6),
  vent: hex(0x141516),
  stand: hex(0x4a4d52)
}

const own = <T extends THREE.Material>(m: T, name: string): T => {
  m.name = name
  m.userData.own = true
  return m
}

// The shell's brushed picture again, drawn finer: a rail is seen from closer than the page's own metal. It shares the picture, so it costs no memory.
const fineOf = new WeakMap<THREE.Texture, THREE.Texture>()
const fine = (src: THREE.Texture): THREE.Texture => {
  let t = fineOf.get(src)
  if (!t) {
    t = src.clone()
    t.repeat.set(src.repeat.x * 1.6, src.repeat.y * 3.2)
    t.needsUpdate = true
    fineOf.set(src, t)
  }
  return t
}

// The lit zone whose room a zone's metal mirrors: its own, or the street's for the apron at the street's foot.
export const roomOf = (z: Zone): Zone | undefined => (LIT.includes(z.id) ? z : z.id === 'apron' ? zone('street') : undefined)

export const aluOf = (z: Zone, name = 'alu'): THREE.MeshPhysicalMaterial => {
  const src = materials().aluminium
  const on = roomOf(z) !== undefined
  const m = steel(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: on ? 0.27 : 0.4, metalness: on ? 1 : 0.4, normalMap: src.normalMap ? fine(src.normalMap) : null, normalScale: new THREE.Vector2(on ? 0.24 : 0.15, on ? 0.24 : 0.15), anisotropy: 0.72, anisotropyRotation: Math.PI / 2 })), z, { ceiling: 1, panel: 1.3, wide: 0.3, horizon: 1.3, direct: 0.3, under: 0.5, wall: 0.12 }, roomOf(z))
  if (!on) {
    const room = m.onBeforeCompile
    const key = m.customProgramCacheKey
    m.onBeforeCompile = (shader, renderer) => {
      room.call(m, shader, renderer)
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nfloat wjfDim = clamp( dot( vColor.rgb, vec3( 0.3333 ) ) * 9.0, 0.1, 1.0 );\nmaterial.specularColor *= wjfDim;\nmaterial.specularF90 *= wjfDim;')
    }
    m.customProgramCacheKey = () => `${key.call(m)}|wjf-dim`
  }
  return own(lit(m, z), `frame.${name}.${z.id}`)
}

// A zone the lamps do not reach keeps its pale parts pale when the website's light goes down: its paint is lifted by the share of that light that is off.
const lifts = new Map<string, { value: number }>()
export const liftOf = (z: Zone): { value: number } => {
  let u = lifts.get(z.id)
  if (!u) lifts.set(z.id, (u = { value: 1 }))
  return u
}
const LIFT = { keeps: 0.92, least: 0.03 }
export const liftFor = (website: number): number => (website + LIFT.keeps * (1 - website)) / Math.max(website, LIFT.least)

export const paintOf = (z: Zone, name = 'paint', grain = 0.035): THREE.MeshPhysicalMaterial => {
  const src = materials().ceramic
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.66, metalness: 0, normalMap: src.normalMap, normalScale: new THREE.Vector2(grain, grain), specularIntensity: 0.55 }))
  if (!LIT.includes(z.id)) {
    const room = m.onBeforeCompile
    m.onBeforeCompile = (shader, renderer) => {
      room.call(m, shader, renderer)
      shader.uniforms.wjfLift = liftOf(z)
      shader.fragmentShader = 'uniform float wjfLift;\n' + shader.fragmentShader.replace('#include <aomap_fragment>', 'reflectedLight.directDiffuse *= wjfLift;\nreflectedLight.indirectDiffuse *= wjfLift;\n#include <aomap_fragment>')
    }
    m.customProgramCacheKey = () => 'wja-studio-frame-paint-lift'
  }
  return own(lit(m, z), `frame.${name}.${z.id}`)
}

export const steelOf = (z: Zone): THREE.MeshPhysicalMaterial => {
  const on = roomOf(z) !== undefined
  return own(lit(steel(studio(new THREE.MeshPhysicalMaterial({ color: 0xe2e5e8, roughness: on ? 0.1 : 0.2, metalness: on ? 1 : 0.55 })), z, { panel: 0.22, horizon: 1.5, lamps: 1.4 }, roomOf(z)), z), `frame.steel.${z.id}`)
}

export const screwOf = (z: Zone): THREE.MeshPhysicalMaterial => own(lit(steel(studio(new THREE.MeshPhysicalMaterial({ color: 0xc4c8cc, roughness: 0.2, metalness: 1, vertexColors: true })), z, { panel: 0.6, horizon: 1.4 }, roomOf(z)), z), `frame.screw.${z.id}`)

// Clear plastic with no light passed through it: thin where it is seen straight on, bright where it turns away and wherever a lamp shines in it, with the dark line a clear wall shows just inside its edge.
export const clearOf = (z: Zone, name = 'clear', base = 0.06): THREE.MeshPhysicalMaterial => {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0x8a9296, roughness: 0.06, metalness: 0, transparent: true, opacity: base, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04 }))
  const room = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    room.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float wjfTurn = 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) );\nfloat wjfEdge = pow( wjfTurn, 1.6 );\nfloat wjfDark = smoothstep( 0.6, 0.78, wjfTurn ) * ( 1.0 - smoothstep( 0.86, 0.96, wjfTurn ) );\ngl_FragColor.rgb *= 1.0 - 0.72 * wjfDark;\ngl_FragColor.a = clamp( diffuseColor.a + wjfEdge * 0.62 + wjfDark * 0.22 + dot( outgoingLight, vec3( 0.3333 ) ) * 0.45, 0.0, 1.0 );\n#include <tonemapping_fragment>'
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-frame-clear'
  return own(lit(m, z), `frame.${name}.${z.id}`)
}

export function mesh(g: Geo, m: THREE.Material, name: string, o: { cast?: boolean; fine?: boolean } = {}): THREE.Mesh {
  const out = new THREE.Mesh(g.done(), m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = true
  if (o.fine) out.userData.fine = true
  return out
}

// Every screw of a zone is one drawing.
export class Screws {
  private at: THREE.Matrix4[] = []
  add(x: number, y: number, z: number, size = 1, turn = 0, to?: THREE.Vector3): this {
    const q = new THREE.Quaternion()
    if (to) q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), to.clone().normalize())
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), turn))
    this.at.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(size, size, size)))
    return this
  }
  get count(): number {
    return this.at.length
  }
  mesh(m: THREE.Material, name: string): THREE.InstancedMesh | null {
    if (this.at.length === 0) return null
    const g = new Geo()
    g.lathe([[5.0, 0], [4.7, 0.9], [3.9, 1.3], [2.3, 1.3]], 0, 0, 12, [1, 1, 1])
    g.lathe([[2.3, 1.3], [2.1, 0.1], [0, 0.1]], 0, 0, 6, [0.35, 0.35, 0.36])
    const out = new THREE.InstancedMesh(g.done(), m, this.at.length)
    this.at.forEach((mat, i) => out.setMatrixAt(i, mat))
    out.instanceMatrix.needsUpdate = true
    out.computeBoundingSphere()
    out.name = name
    out.receiveShadow = true
    out.userData.fine = true
    return out
  }
}

export function drop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh) return
    m.geometry.dispose()
    const mat = m.material as THREE.Material
    if (mat.userData.own) {
      const tex = mat.userData.pictures as THREE.Texture[] | undefined
      tex?.forEach((t) => t.dispose())
      mat.dispose()
    }
  })
}

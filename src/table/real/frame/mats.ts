import * as THREE from 'three'
import { studio } from '../../../post/studio'
import { materials } from '../../../shell/materials'
import { lit } from '../light'
import type { Zone } from '../zone'
import { Geo, type RGB } from './geo'

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]

export const TONE = {
  alu: hex(0xd3d6d9),
  aluDark: hex(0xa3a7ac),
  aluBright: hex(0xe6e8ea),
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
  vent: hex(0x141516)
}

const own = <T extends THREE.Material>(m: T, name: string): T => {
  m.name = name
  m.userData.own = true
  return m
}

export const aluOf = (z: Zone, name = 'alu'): THREE.MeshPhysicalMaterial => {
  const src = materials().aluminium
  return own(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.36, metalness: 0.72, normalMap: src.normalMap, normalScale: new THREE.Vector2(0.22, 0.22), anisotropy: 0.72, anisotropyRotation: Math.PI / 2 })), z), `frame.${name}.${z.id}`)
}

export const paintOf = (z: Zone, name = 'paint'): THREE.MeshPhysicalMaterial => {
  const src = materials().ceramic
  return own(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.66, metalness: 0, normalMap: src.normalMap, normalScale: new THREE.Vector2(0.085, 0.085), specularIntensity: 0.55 })), z), `frame.${name}.${z.id}`)
}

export const steelOf = (z: Zone): THREE.MeshPhysicalMaterial => own(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xc9cdd1, roughness: 0.17, metalness: 1 })), z), `frame.steel.${z.id}`)

export const screwOf = (z: Zone): THREE.MeshPhysicalMaterial => own(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xaeb2b6, roughness: 0.32, metalness: 1, vertexColors: true })), z), `frame.screw.${z.id}`)

// Clear plastic with no light passed through it: thin where it is seen straight on, bright where it turns away and wherever a lamp shines in it.
export const clearOf = (z: Zone, name = 'clear', base = 0.06): THREE.MeshPhysicalMaterial => {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xdfe8ea, roughness: 0.06, metalness: 0, transparent: true, opacity: base, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04 }))
  const room = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    room.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float wjfEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 2.2 );\ngl_FragColor.a = clamp( diffuseColor.a + wjfEdge * 0.5 + dot( outgoingLight, vec3( 0.3333 ) ) * 0.22, 0.0, 1.0 );\n#include <tonemapping_fragment>'
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

import * as THREE from 'three'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import { lit } from '../light'
import type { Zone } from '../zone'
import { Geo, type RGB } from './geo'

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]

// The finishes of the hardware. One material carries them all: a vertex picks its finish through its texture coordinate.
export const FIN = { steel: 0, alu: 1, brass: 2, rubber: 3, gloss: 4, dark: 5, zinc: 6, satin: 7, chrome: 8 }
// Clear coat, roughness, metalness of each finish.
const FINISH: [number, number, number][] = [
  [0, 0.09, 1],
  [0, 0.34, 0.85],
  [0, 0.22, 0.95],
  [0, 0.9, 0],
  [1, 0.34, 0],
  [0, 0.5, 0.6],
  [0, 0.38, 0.92],
  [0, 0.5, 0],
  [0, 0.035, 1]
]

export const TONE = {
  steel: hex(0xd0d4d8),
  steelDim: hex(0xa9aeb4),
  alu: hex(0xcfd3d6),
  aluDark: hex(0x9da2a8),
  brass: hex(0xd0a858),
  brassDark: hex(0x9a7636),
  rubber: hex(0xdcd8cc),
  rubberLine: hex(0xeeeae0),
  rubberWorn: hex(0xbdb8aa),
  rubberBlack: hex(0x222223),
  orange: hex(0xc24400),
  orangeSeam: hex(0xa83a00),
  grey: hex(0x8e9398),
  greyDark: hex(0x5c6066),
  yellow: hex(0xd9b21c),
  black: hex(0x1b1b1d),
  white: hex(0xe9e6de),
  pocket: hex(0x0d0e10),
  pocketDeep: hex(0x1a1c1f),
  pin: hex(0x2d5fa8),
  pocketWall: hex(0x4a4e54),
  zinc: hex(0xc4c8cc),
  slot: hex(0x2a2b2e),
  chrome: hex(0xd6d9dc),
  clear: hex(0xdfe8ea)
}

let palette: THREE.DataTexture | null = null
function finishes(): THREE.DataTexture {
  if (palette) return palette
  const data = new Uint8Array(16 * 4)
  for (let i = 0; i < 16; i++) {
    const f = FINISH[i] ?? FINISH[0]!
    data[i * 4] = Math.round(f[0] * 255)
    data[i * 4 + 1] = Math.round(f[1] * 255)
    data[i * 4 + 2] = Math.round(f[2] * 255)
    data[i * 4 + 3] = 255
  }
  palette = new THREE.DataTexture(data, 16, 1, THREE.RGBAFormat)
  palette.magFilter = palette.minFilter = THREE.NearestFilter
  palette.generateMipmaps = false
  palette.colorSpace = THREE.NoColorSpace
  palette.needsUpdate = true
  return palette
}

const made = new Map<string, THREE.MeshPhysicalMaterial>()

// The one material of the hardware in a zone.
export const metalOf = (z: Zone): THREE.MeshPhysicalMaterial => {
  let m = made.get(z.id)
  if (m) return m
  const map = finishes()
  m = lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.07, roughnessMap: map, metalnessMap: map, clearcoatMap: map })), z)
  m.name = `hardware.${z.id}`
  made.set(z.id, m)
  return m
}

const clear = new Map<string, THREE.MeshPhysicalMaterial>()

// Clear acrylic: nothing in the middle but what glints, bright where the wall turns away from the eye.
export const tubeOf = (z: Zone, base: number): THREE.MeshPhysicalMaterial => {
  let m = clear.get(z.id)
  if (m) return m
  m = studio(new THREE.MeshPhysicalMaterial({ color: 0x6a747a, roughness: 0.05, metalness: 0, transparent: true, opacity: base, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04 }))
  const room = m.onBeforeCompile
  const made = m
  m.onBeforeCompile = (shader, renderer) => {
    room.call(made, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float hwEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 2.4 );\ngl_FragColor.rgb *= mix( 1.0, 4.2, hwEdge );\ngl_FragColor.a = clamp( diffuseColor.a + hwEdge * 0.55 + dot( gl_FragColor.rgb, vec3( 0.3333 ) ) * 0.22, 0.0, 1.0 );\n#include <tonemapping_fragment>'
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-hardware-clear'
  m = lit(m, z)
  m.name = `hardware.tube.${z.id}`
  clear.set(z.id, m)
  return m
}

export function mesh(g: Geo, m: THREE.Material, name: string, o: { cast?: boolean; fine?: boolean } = {}): THREE.Mesh {
  const out = new THREE.Mesh(g.done(), m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = true
  if (o.fine) out.userData.fine = true
  return out
}

// Every screw of a zone is one drawing: a pan head with a cross in it, each turned to its own angle.
export class Screws {
  private at: THREE.Matrix4[] = []
  add(x: number, y: number, z: number, size = 1, to?: THREE.Vector3): this {
    const q = new THREE.Quaternion()
    if (to) q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), to.clone().normalize())
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), hash01(Math.round(x * 7), Math.round(y * 7), this.at.length) * Math.PI))
    this.at.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(size, size, size)))
    return this
  }
  get count(): number {
    return this.at.length
  }
  mesh(m: THREE.Material, name: string): THREE.InstancedMesh | null {
    if (this.at.length === 0) return null
    const g = new Geo()
    g.f(FIN.zinc)
    g.lathe([[6.6, 0], [6.6, 0.6], [4.8, 0.8]], 0, 0, 10, shade(TONE.zinc, 0.8))
    g.lathe([[4.8, 0.8], [4.7, 1.6], [3.7, 2.5], [0, 2.7]], 0, 0, 10, TONE.zinc)
    g.f(FIN.dark)
    g.box(-3.0, 3.0, -0.55, 0.55, 2.4, 2.78, TONE.slot)
    g.box(-0.55, 0.55, -3.0, 3.0, 2.4, 2.79, TONE.slot)
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
    if (m.isMesh) m.geometry.dispose()
  })
}

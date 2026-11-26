import * as THREE from 'three'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import { lit } from '../light'
import { LIT } from '../lights/groups'
import type { Zone } from '../zone'
import { MACHINE_ORANGE, liftOf, roomOf } from '../frame/mats'
import { steel } from '../frame/steel'
import { Geo, type RGB } from './geo'

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]

// The finishes of the hardware. One material carries them all: a vertex picks its finish through its texture coordinate.
export const FIN = { steel: 0, alu: 1, brass: 2, rubber: 3, gloss: 4, dark: 5, zinc: 6, satin: 7, chrome: 8, spring: 9 }
// Clear coat, roughness, metalness of each finish.
const FINISH: [number, number, number][] = [
  [0, 0.09, 1],
  [0, 0.3, 1],
  [0, 0.2, 1],
  [0, 0.68, 0],
  [1, 0.22, 0],
  [0, 0.5, 0.6],
  [0, 0.3, 1],
  [0, 0.5, 0],
  [0, 0.035, 1],
  [0, 0.26, 0.35]
]

export const TONE = {
  steel: hex(0xd0d4d8),
  steelDim: hex(0xa9aeb4),
  alu: hex(0xcfd3d6),
  aluDark: hex(0x9da2a8),
  brass: hex(0xd0a858),
  brassDark: hex(0x9a7636),
  rubber: hex(0x1c1c1e),
  rubberLine: hex(0x38383b),
  rubberWorn: hex(0x2a2a2c),
  rubberBlack: hex(0x222223),
  orange: hex(MACHINE_ORANGE),
  knob: hex(MACHINE_ORANGE),
  orangeSeam: shade(hex(MACHINE_ORANGE), 0.68),
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

// What polished metal sends back is what it sees: a softly lit ceiling with a window and one small lamp in it, the walls of the cabinet and what stands before them round the horizon, the floor of its tier below with two warm lamps on it and its own shadow straight under it. The smoother the metal the more of this it shows.
const MIRROR = /* glsl */ `
{
	float hwGloss = metalnessFactor * ( 1.0 - smoothstep( 0.04, 0.4, roughnessFactor ) );
	if ( hwGloss > 0.01 ) {
		vec3 hwR = normalize( ( wjaViewInverse * vec4( reflect( - normalize( vViewPosition ), normal ), 0.0 ) ).xyz );
		float hwSoft = 0.02 + roughnessFactor * 1.6;
		vec3 hwD = vec3( -0.66, 0.56, 0.5 );
		vec3 hwX = vec3( 0.647, 0.763, 0.0 );
		vec3 hwY = cross( hwD, hwX );
		float hwF = dot( hwR, hwD );
		vec2 hwP = vec2( dot( hwR, hwX ), dot( hwR, hwY ) ) / max( hwF, 0.001 );
		float hwWin = step( 0.0, hwF ) * ( 1.0 - smoothstep( 0.39 - hwSoft, 0.39 + hwSoft, abs( hwP.x ) ) ) * ( 1.0 - smoothstep( 0.23 - hwSoft, 0.23 + hwSoft, abs( hwP.y ) ) );
		hwWin *= mix( smoothstep( 0.012, 0.03, abs( hwP.x ) ), 1.0, smoothstep( 0.03, 0.08, roughnessFactor ) );
		float hwLamp = smoothstep( 0.965 - hwSoft * 0.3, 0.99, dot( hwR, vec3( 0.58, -0.33, 0.744 ) ) );
		float hwSky = 0.55 + 2.3 * smoothstep( 0.0, 0.95, hwF );
		vec3 hwLow = hwFloor * mix( 0.35, 1.0, smoothstep( -1.0, -0.55, hwR.z ) ) * ( 1.5 + 1.6 * smoothstep( -0.2, 0.9, dot( hwR.xy, vec2( -0.5, 0.86 ) ) ) );
		float hwAz = atan( hwR.y, hwR.x );
		float hwThings = 0.5 + 0.5 * sin( hwAz * 3.0 + 1.3 ) * sin( hwAz * 5.0 + 0.4 );
		float hwWall = 1.0 - smoothstep( 0.03, 0.13 + hwSoft, abs( hwR.z - 0.05 ) );
		vec3 hwRoom = mix( mix( hwLow, vec3( hwSky ), smoothstep( -0.03, 0.03, hwR.z ) ), vec3( mix( 0.16, 1.1, hwThings * hwThings ) ), hwWall );
		vec3 hwGlow = vec3( 1.0, 0.7, 0.4 ) * ( smoothstep( 0.955 - hwSoft * 0.3, 0.99, dot( hwR, vec3( 0.66, 0.51, -0.55 ) ) ) + smoothstep( 0.97 - hwSoft * 0.3, 0.992, dot( hwR, vec3( -0.52, 0.62, -0.59 ) ) ) );
		diffuseColor.rgb *= mix( vec3( 1.0 ), hwRoom + hwWin * 14.0 + hwLamp * 7.0 + hwGlow * 8.0, hwGloss );
	}
}
`

// The floor of each zone as polished metal sees it.
const FLOOR: Record<string, [number, number, number]> = { corporate: [0.5, 0.58, 0.82], office: [0.62, 0.8, 0.72], street: [0.5, 0.76, 0.8] }

const made = new Map<string, THREE.MeshPhysicalMaterial>()

// The one material of the hardware in a zone.
export const metalOf = (z: Zone): THREE.MeshPhysicalMaterial => {
  let m = made.get(z.id)
  if (m) return m
  const from = roomOf(z)
  const map = finishes()
  m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.07, roughnessMap: map, metalnessMap: map, clearcoatMap: map }))
  const room = m.onBeforeCompile
  const made0 = m
  m.onBeforeCompile = (shader, renderer) => {
    room.call(made0, shader, renderer)
    shader.uniforms.hwFloor = { value: new THREE.Vector3(...(FLOOR[z.id] ?? [0.72, 0.72, 0.72])) }
    if (!from) shader.fragmentShader = 'uniform vec3 hwFloor;\n' + shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + MIRROR)
    else if (from !== z) {
      shader.uniforms.wjfLift = liftOf(z)
      shader.fragmentShader = 'uniform float wjfLift;\n' + shader.fragmentShader.replace('#include <aomap_fragment>', 'reflectedLight.directDiffuse *= wjfLift;\nreflectedLight.indirectDiffuse *= wjfLift;\n#include <aomap_fragment>')
    }
  }
  m.customProgramCacheKey = () => `wja-studio-hardware-metal-${from === z ? 'lit' : from ? 'foot' : 'page'}`
  m = lit(steel(m, z, { ceiling: 0.3, panel: 0.5, wide: 0.12, horizon: 1.25, sky: 0.8, paint: 0.4 }, from), z)
  m.name = `hardware.${z.id}`
  made.set(z.id, m)
  return m
}

// The window of the room on clear acrylic: on a tube it is drawn out into one long bright line down the wall that faces it.
const STREAK = /* glsl */ `
{
	vec3 hwR = normalize( ( wjaViewInverse * vec4( reflect( - normalize( vViewPosition ), normalize( normal ) ), 0.0 ) ).xyz );
	vec3 hwD = vec3( -0.66, 0.56, 0.5 );
	vec3 hwX = vec3( 0.647, 0.763, 0.0 );
	float hwF = dot( hwR, hwD );
	vec2 hwP = vec2( dot( hwR, hwX ), dot( hwR, cross( hwD, hwX ) ) ) / max( hwF, 0.001 );
	float hwWin = step( 0.0, hwF ) * ( 1.0 - smoothstep( 0.3, 0.48, abs( hwP.x ) ) ) * ( 1.0 - smoothstep( 0.15, 0.31, abs( hwP.y ) ) );
	float hwHalo = step( 0.0, hwF ) * ( 1.0 - smoothstep( 0.3, 0.95, length( hwP * vec2( 0.55, 1.0 ) ) ) );
	float hwLine = gl_FrontFacing ? exp( - ( hwR.z - 0.84 ) * ( hwR.z - 0.84 ) / 0.0009 ) * ( 0.2 + 0.8 * smoothstep( -0.25, 0.3, hwR.x + 0.6 * hwR.y ) ) : 0.0;
	gl_FragColor.rgb += vec3( 0.8, 0.86, 0.88 ) * ( hwWin * 0.75 + hwHalo * 0.08 + hwLine * 0.9 * step( 0.5, hwEdgeGain ) );
}
`

// How the wall of a clear tube shows where it turns away from the eye: bright over the dark table, dark over the pale page.
const EDGE = { table: 3, page: 0.3 }

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
    shader.uniforms.hwEdgeGain = { value: z.id === 'last' ? EDGE.page : EDGE.table }
    shader.fragmentShader = 'uniform float hwEdgeGain;\n' + shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float hwEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 1.9 );\ngl_FragColor.rgb *= mix( 1.0, hwEdgeGain, hwEdge );\n' + STREAK + 'gl_FragColor.a = clamp( diffuseColor.a + hwEdge * 0.55 + dot( gl_FragColor.rgb, vec3( 0.3333 ) ) * 0.13, 0.0, 1.0 );\n#include <tonemapping_fragment>'
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-hardware-clear-7'
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

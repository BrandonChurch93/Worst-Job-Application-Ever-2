import * as THREE from 'three'
import { config } from '../config'
import { Random } from '../core/random'
import { studio } from '../post/studio'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

function blurWrap(src: Float32Array, size: number, sigma: number): Float32Array {
  const reach = Math.max(1, Math.ceil(sigma * 3))
  const weights: number[] = []
  let sum = 0
  for (let i = -reach; i <= reach; i++) {
    const w = Math.exp((-i * i) / (2 * sigma * sigma))
    weights.push(w)
    sum += w
  }
  const mask = size - 1
  const mid = new Float32Array(size * size)
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0
      for (let i = -reach; i <= reach; i++) v += src[y * size + ((x + i) & mask)]! * weights[i + reach]!
      mid[y * size + x] = v / sum
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0
      for (let i = -reach; i <= reach; i++) v += mid[((y + i) & mask) * size + x]! * weights[i + reach]!
      out[y * size + x] = v / sum
    }
  }
  return out
}

function unit(h: Float32Array): Float32Array {
  let mean = 0
  for (let i = 0; i < h.length; i++) mean += h[i]!
  mean /= h.length
  let spread = 0
  for (let i = 0; i < h.length; i++) spread += (h[i]! - mean) ** 2
  spread = Math.sqrt(spread / h.length) || 1
  for (let i = 0; i < h.length; i++) h[i] = (h[i]! - mean) / spread
  return h
}

const PIT_FROM = 0.7
const TOOTH = 0.07
const GRAIN_PER_PIXEL = 2
const FROST = 0.022

// The eggshell grain as heights, one number a texel, with a mean of nought and a spread of one. The size is a power of two and the picture tiles.
export function grainHeights(size: number, seed: number): Float32Array {
  const rnd = new Random(seed, 'grain')
  const white = new Float32Array(size * size)
  for (let i = 0; i < white.length; i++) white[i] = rnd.next() - 0.5
  const band = (near: number, far: number): Float32Array => {
    const a = blurWrap(white, size, near)
    const b = blurWrap(white, size, far)
    for (let i = 0; i < a.length; i++) a[i] = a[i]! - b[i]!
    return unit(a)
  }
  // Two texels are one page pixel, so the bands are twice as wide in texels as they are on the page.
  const fine = band(0.8, 1.8)
  const coarse = band(2.4, 6)
  const tooth = band(0.4, 0.9)
  const h = new Float32Array(size * size)
  for (let i = 0; i < h.length; i++) {
    // Pits read as eggshell: only the low places of the fine grain are kept as pits, the rest is nearly flat.
    // The tooth is finer than a page pixel: it shows only when the camera comes close or the picture is larger.
    const f = fine[i]!
    h[i] = -1.6 * Math.max(0, -f - PIT_FROM) + 0.22 * f + 0.34 * coarse[i]! + TOOTH * tooth[i]!
  }
  return unit(h)
}

function normalsOf(h: Float32Array, size: number, strength: number, heightScale = 0.18): Uint8Array {
  const data = new Uint8Array(size * size * 4)
  const mask = size - 1
  const at = (x: number, y: number) => h[(y & mask) * size + (x & mask)]!
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const l = Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * size + x) * 4
      data[i] = Math.round((-dx / l) * 127.5 + 127.5)
      data[i + 1] = Math.round((-dy / l) * 127.5 + 127.5)
      data[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      data[i + 3] = Math.round(Math.min(1, Math.max(0, 0.5 + at(x, y) * heightScale)) * 255)
    }
  }
  return data
}

function dataTexture(data: Uint8Array, size: number, repeat: boolean): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
  tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

// The grain of the ceramic: its slopes in red, green and blue and its height in alpha. It tiles.
export function grainNormalMap(size: number, seed: number, strength: number): THREE.DataTexture {
  return dataTexture(normalsOf(grainHeights(size, seed), size, strength), size, true)
}

// Straight brushing: fine lines that run along u, each a little uneven along its length, and a few strays.
export function brushedHeights(size: number, seed: number): Float32Array {
  const rnd = new Random(seed, 'brushed')
  const h = new Float32Array(size * size)
  const mask = size - 1
  for (let y = 0; y < size; y++) {
    const level = rnd.next() - 0.5
    const knots = Array.from({ length: 9 }, () => rnd.next() - 0.5)
    knots[8] = knots[0]!
    for (let x = 0; x < size; x++) {
      const t = (x / size) * 8
      const k = Math.floor(t)
      const f = t - k
      const e = f * f * (3 - 2 * f)
      h[y * size + x] = level + 0.45 * (knots[k]! + (knots[k + 1]! - knots[k]!) * e)
    }
  }
  const soft = blurWrap(h, size, 0.7)
  for (let n = 0; n < 14; n++) {
    let y = rnd.int(size)
    const x0 = rnd.int(size)
    const run = 60 + rnd.int(size / 2)
    const drift = (rnd.next() - 0.5) * 0.16
    for (let i = 0; i < run; i++) {
      soft[(Math.round(y + i * drift) & mask) * size + ((x0 + i) & mask)]! -= 0.5
    }
    y++
  }
  return unit(soft)
}

// Circular brushing for a turned face, laid once across the disc: rings of fine lines round the centre.
function turnedMaps(size: number, seed: number, strength: number): { normal: THREE.DataTexture; direction: THREE.DataTexture } {
  const rnd = new Random(seed, 'turned')
  const rings = new Float32Array(size)
  for (let i = 0; i < size; i++) rings[i] = rnd.next() - 0.5
  const smooth = new Float32Array(size)
  for (let i = 0; i < size; i++) smooth[i] = 0.25 * rings[Math.max(0, i - 1)]! + 0.5 * rings[i]! + 0.25 * rings[Math.min(size - 1, i + 1)]!
  const ring = (r: number): number => {
    const k = Math.min(size - 2, Math.floor(r))
    const f = r - k
    return smooth[k]! + (smooth[k + 1]! - smooth[k]!) * f
  }
  const normal = new Uint8Array(size * size * 4)
  const direction = new Uint8Array(size * size * 4)
  const c = (size - 1) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - c
      const dy = y - c
      const r = Math.hypot(dx, dy)
      const ux = r > 0.5 ? dx / r : 1
      const uy = r > 0.5 ? dy / r : 0
      const slope = (ring(r + 1) - ring(Math.max(0, r - 1))) * strength * Math.min(1, r / 6)
      const l = Math.sqrt(slope * slope + 1)
      const i = (y * size + x) * 4
      normal[i] = Math.round(((-slope * ux) / l) * 127.5 + 127.5)
      normal[i + 1] = Math.round(((-slope * uy) / l) * 127.5 + 127.5)
      normal[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      normal[i + 3] = 255
      direction[i] = Math.round(ux * 127.5 + 127.5)
      direction[i + 1] = Math.round(uy * 127.5 + 127.5)
      direction[i + 2] = Math.round(255 * Math.min(1, r / 5))
      direction[i + 3] = 255
    }
  }
  return { normal: dataTexture(normal, size, false), direction: dataTexture(direction, size, false) }
}

// Adds to a material's shader after the studio rule has had its turn.
function also<T extends THREE.Material>(material: T, name: string, patch: (shader: THREE.WebGLProgramParametersWithUniforms) => void): T {
  const before = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer)
    patch(shader)
  }
  material.customProgramCacheKey = () => `wja-studio-${name}`
  return material
}

const grainGlsl = `
float wjaGrainHeight = 0.0;
vec3 wjaGrain( vec2 uv ) {
	vec4 a = texture2D( normalMap, uv );
	vec2 uvB = mat2( 0.7986, 0.6018, -0.6018, 0.7986 ) * uv * 1.1180 + vec2( 0.371, 0.113 );
	vec4 b = texture2D( normalMap, uvB );
	vec2 tilt = mat2( 0.7986, -0.6018, 0.6018, 0.7986 ) * ( b.xy * 2.0 - 1.0 );
	wjaGrainHeight = a.a + b.a - 1.0;
	return normalize( vec3( a.xy * 2.0 - 1.0 + 0.5 * tilt, a.z * 2.0 - 1.0 ) );
}
`

// Two layers of one grain picture, the second turned and larger, so no repeat shows across a page. The height also moves the roughness.
function grained<T extends THREE.MeshStandardMaterial>(material: T, rough: number): T {
  return also(material, `grain-${rough}`, (shader) => {
    const sample = 'texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0'
    const chunk = THREE.ShaderChunk.normal_fragment_maps
    if (!chunk.includes(`vec3 mapN = ${sample}`)) throw new Error('The normal code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <normalmap_pars_fragment>', `#include <normalmap_pars_fragment>\n${grainGlsl}`)
      .replace('#include <normal_fragment_maps>', `${chunk.replace(`vec3 mapN = ${sample}`, 'vec3 mapN = wjaGrain( vNormalMapUv )')}\n\troughnessFactor = clamp( roughnessFactor - wjaGrainHeight * ${rough.toFixed(3)}, 0.06, 1.0 );\n`)
  })
}

const stretchGlsl = `
#ifdef USE_ENVMAP
vec3 wjaStretched( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 along, const in float anisotropy ) {
	vec3 sum = vec3( 0.0 );
	float total = 0.0;
	for ( int i = -4; i <= 4; i ++ ) {
		float t = float( i ) / 4.0;
		float w = exp( -2.0 * t * t );
		sum += w * getIBLRadiance( viewDir, normalize( normal + along * ( t * anisotropy * 0.26 ) ), roughness );
		total += w;
	}
	return sum / total;
}
#endif
`

// A brushed face mirrors the room stretched across its brushing. The stock code only bends the mirror when the face is seen from the side,
// so a turned face seen from above showed no fan of light. This reads the room along the stretch instead.
function stretched<T extends THREE.MeshPhysicalMaterial>(material: T): T {
  return also(material, 'stretched', (shader) => {
    const call = 'getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy )'
    if (!shader.fragmentShader.includes(call) || !shader.fragmentShader.includes('void main() {')) throw new Error('The light code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `${stretchGlsl}\nvoid main() {`)
      .replace(call, 'wjaStretched( geometryViewDir, geometryNormal, material.roughness, material.anisotropyT, material.anisotropy )')
  })
}

export interface Materials {
  ceramic: THREE.MeshPhysicalMaterial
  pocket: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  glassThick: THREE.MeshPhysicalMaterial
  glassSunk: THREE.MeshPhysicalMaterial
  aluminium: THREE.MeshPhysicalMaterial
  aluminiumTurned: THREE.MeshPhysicalMaterial
  aluminiumEdge: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  gap: THREE.MeshPhysicalMaterial
  ink: THREE.MeshPhysicalMaterial
  inkOnOrange: THREE.MeshPhysicalMaterial
  enamel: THREE.MeshPhysicalMaterial
  edge: THREE.MeshPhysicalMaterial
  smoked: THREE.MeshPhysicalMaterial
  paper: THREE.MeshPhysicalMaterial
  red: THREE.MeshPhysicalMaterial
  keycap: THREE.MeshPhysicalMaterial
  steel: THREE.MeshPhysicalMaterial
  rubber: THREE.MeshPhysicalMaterial
  textures: THREE.Texture[]
}

export function makeMaterials(seed: number): Materials {
  // Two texels of grain are one page pixel: the surface's coordinates are page pixels.
  const grain = grainNormalMap(1024, seed, 0.5 * GRAIN_PER_PIXEL)
  grain.repeat.set(GRAIN_PER_PIXEL / 1024, GRAIN_PER_PIXEL / 1024)
  // The glass reads the same picture again, finer and far weaker: the frost of its face. It shares the picture, so it costs no memory.
  const frost = grain.clone()
  frost.repeat.set(5 / 1024, 5 / 1024)
  const frosted = { normalMap: frost, normalScale: new THREE.Vector2(FROST, FROST) }
  const brushed = dataTexture(normalsOf(brushedHeights(512, seed), 512, 1.4), 512, true)
  brushed.repeat.set(1 / 720, 1 / 420)
  const turned = turnedMaps(256, seed, 2.2)
  const physical = (o: THREE.MeshPhysicalMaterialParameters) => studio(new THREE.MeshPhysicalMaterial(o))
  const ceramic = grained(physical({ color: srgb(0xecebe6), roughness: 0.74, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.085, 0.085), specularIntensity: 0.6 }), 0.5)
  const pocket = grained(physical({ color: srgb(0xdcdfdc), roughness: 0.8, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.08, 0.08), specularIntensity: 0.4 }), 0.3)
  const glass = physical({ color: srgb(0xbdc5c2), roughness: 0.44, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, ...frosted })
  const glassSunk = physical({ color: srgb(0xbdc5c2), roughness: 0.44, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, vertexColors: true, ...frosted })
  const glassThick = physical({ color: srgb(0x9aa3a4), roughness: 0.48, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, ...frosted })
  const aluminium = physical({
    color: srgb(0xb9bdc1), roughness: 0.3, metalness: 1, normalMap: brushed, normalScale: new THREE.Vector2(0.22, 0.22), anisotropy: 0.72, anisotropyRotation: Math.PI / 2
  })
  const aluminiumTurned = stretched(physical({
    color: srgb(0x8e9399), roughness: 0.2, metalness: 1, normalMap: turned.normal, normalScale: new THREE.Vector2(0.06, 0.06), anisotropy: 0.85, anisotropyMap: turned.direction
  }))
  const aluminiumEdge = physical({ color: srgb(0xb9bdc1), roughness: 0.3, metalness: 1 })
  const orange = physical({ color: srgb(0xc24400), roughness: 0.5, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.09, specularIntensity: 0.8, specularColor: srgb(0xff9a52) })
  const gap = physical({ color: srgb(0x23211f), roughness: 0.85, metalness: 0, specularIntensity: 0.3 })
  const ink = physical({ color: srgb(0x2a2927), roughness: 0.48, metalness: 0, specularIntensity: 0.2 })
  const inkOnOrange = physical({ color: srgb(0xfbf6ee), roughness: 0.4, metalness: 0, specularIntensity: 0.4 })
  const enamel = physical({ color: srgb(0xf7f5f0), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 })
  const edge = physical({ color: srgb(0x1b1a19), roughness: 0.35, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 })
  const smoked = physical({ color: srgb(0x6c6e70), roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, specularIntensity: 0.7 })
  const paper = physical({ color: srgb(0xf3efe6), roughness: 0.9, metalness: 0, specularIntensity: 0.25, side: THREE.DoubleSide })
  const red = physical({ color: srgb(0xc22a1e), roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1 })
  const keycap = physical({ color: srgb(0xece4d4), roughness: 0.52, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.4 })
  const steel = physical({ color: srgb(0x9a9ea3), roughness: 0.24, metalness: 1 })
  const rubber = physical({ color: srgb(0x1c1c1d), roughness: 0.92, metalness: 0, specularIntensity: 0.4 })
  for (const m of [ink, inkOnOrange]) {
    m.polygonOffset = true
    m.polygonOffsetFactor = -1
    m.polygonOffsetUnits = -2
  }
  return {
    ceramic, pocket, glass, glassThick, glassSunk, aluminium, aluminiumTurned, aluminiumEdge, orange, gap, ink, inkOnOrange, enamel, edge, smoked, paper, red, keycap, steel, rubber,
    textures: [grain, brushed, turned.normal, turned.direction]
  }
}

let made: Materials | null = null
// The one set of materials every part shares, so the orange is the same orange everywhere.
export function materials(): Materials {
  made ??= makeMaterials(config.seed)
  return made
}

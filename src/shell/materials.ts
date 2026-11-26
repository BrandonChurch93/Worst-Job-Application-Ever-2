import * as THREE from 'three'
import { config } from '../config'
import { Random } from '../core/random'
import { look } from '../post/look'
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
const PIT_DEPTH = 1
const COARSE = 0.34
const TOOTH = 0.07
const GRAIN_PER_PIXEL = 2
const FROST = 0.022
const PAGE_PITS = 0.16
const PAGE_COARSE = 0.03
const PAGE_GRAIN = 0.04
const CLOSE_FALL = 1.5
const CLOSE_FLOOR = 0.03
const CLOSE_TOOTH = 2.85
const SHEET_TOOTH = 0.4
const HOME_TOOTH = 0.6
const FIBRE = 14
const HOME_GAIN = 0.5
const MOTTLE = 0.015

// The eggshell grain as heights, one number a texel, with a mean of nought and a spread of one. The size is a power of two and the picture tiles.
export function grainHeights(size: number, seed: number, pits = PIT_DEPTH, lumps = COARSE): Float32Array {
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
    h[i] = -pits * Math.max(0, -f - PIT_FROM) + 0.22 * f + lumps * coarse[i]! + TOOTH * tooth[i]!
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
export function grainNormalMap(size: number, seed: number, strength: number, pits = PIT_DEPTH, lumps = COARSE): THREE.DataTexture {
  return dataTexture(normalsOf(grainHeights(size, seed, pits, lumps), size, strength), size, true)
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

// Circular brushing for a turned face, laid once across the disc: rings of fine lines round the centre, each band of them worn deeper on one side than the other and a little off centre, as a lathe leaves them.
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
  const BAND = 7
  const bands = Array.from({ length: Math.ceil(size / BAND) + 2 }, () => ({ turns: 1 + rnd.int(4), at: rnd.next() * Math.PI * 2, drift: (rnd.next() - 0.5) * 2.4 }))
  const worn = (r: number, a: number): number => {
    const b = bands[Math.floor(r / BAND)]!
    return 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(a * b.turns + b.at))
  }
  const off = (r: number, a: number): number => bands[Math.floor(r / BAND)]!.drift * Math.sin(a + bands[Math.floor(r / BAND)]!.at)
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
      const a = Math.atan2(dy, dx)
      const rr = Math.max(0, r + off(r, a))
      const slope = (ring(rr + 1) - ring(Math.max(0, rr - 1))) * strength * Math.min(1, r / 6) * worn(r, a)
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
#ifndef USE_TRANSMISSION
uniform mat4 projectionMatrix;
#endif
float wjaGrainHeight = 0.0;
float wjaMottle = 0.0;
float wjaOctave( float texel ) {
	return smoothstep( 0.22, 0.45, texel ) * max( pow( max( 2.0 * texel, 1.0 ), -CLOSE_FALL ), CLOSE_FLOOR );
}
vec3 wjaGrain( vec2 uv ) {
	float close = max( projectionMatrix[ 1 ][ 1 ] * 540.0 / ( isOrthographic ? 1.0 : max( vViewPosition.z, 1.0 ) ), 1.0 );
	float relief = max( pow( close, -CLOSE_FALL ), CLOSE_FLOOR );
	vec4 a = texture2D( normalMap, uv );
	vec2 uvB = mat2( 0.7986, 0.6018, -0.6018, 0.7986 ) * uv * 1.1180 + vec2( 0.371, 0.113 );
	vec4 b = texture2D( normalMap, uvB );
	vec2 tilt = mat2( 0.7986, -0.6018, 0.6018, 0.7986 ) * ( b.xy * 2.0 - 1.0 );
	vec2 uvD = mat2( 0.4540, 0.8910, -0.8910, 0.4540 ) * uv * 2.0 + vec2( 0.173, 0.591 );
	vec2 uvE = mat2( -0.3090, 0.9511, -0.9511, -0.3090 ) * uv * 4.0 + vec2( 0.731, 0.297 );
	vec2 uvF = mat2( 0.9659, 0.2588, -0.2588, 0.9659 ) * uv * 8.0 + vec2( 0.419, 0.857 );
	vec2 d = mat2( 0.4540, -0.8910, 0.8910, 0.4540 ) * ( texture2D( normalMap, uvD ).xy - texture2D( normalMap, uvD, 2.0 ).xy );
	vec2 e = mat2( -0.3090, -0.9511, 0.9511, -0.3090 ) * ( texture2D( normalMap, uvE ).xy - texture2D( normalMap, uvE, 2.0 ).xy );
	vec2 f = mat2( 0.9659, -0.2588, 0.2588, 0.9659 ) * ( texture2D( normalMap, uvF ).xy - texture2D( normalMap, uvF, 2.0 ).xy );
	vec2 fine = 2.0 * ( wjaOctave( 0.25 * close ) * d + wjaOctave( 0.125 * close ) * e + wjaOctave( 0.0625 * close ) * f );
	vec2 uvC = mat2( 0.9063, 0.4226, -0.4226, 0.9063 ) * uv * 0.8 + vec2( 0.527, 0.341 );
	vec2 c = mat2( 0.9063, -0.4226, 0.4226, 0.9063 ) * ( texture2D( normalMap, uvC ).xy - texture2D( normalMap, uvC, 2.0 ).xy );
	float tooth = mix( SHEET_TOOTH, CLOSE_TOOTH, smoothstep( 2.4, 2.9, close ) * ( 1.0 - smoothstep( 3.47, 3.6, close ) ) );
	wjaGrainHeight = relief * ( a.a + b.a - 1.0 );
	vec2 uvM = mat2( 0.8829, 0.4695, -0.4695, 0.8829 ) * uv;
	wjaMottle = 2.3 * ( texture2D( normalMap, uvM * 0.125 + vec2( 0.613, 0.277 ), 2.0 ).a - 0.5 ) + 1.5 * ( texture2D( normalMap, uvM.yx * 0.25 + vec2( 0.211, 0.671 ), 2.0 ).a - 0.5 );
	vec2 uvG = mat2( 0.5736, 0.8192, -0.8192, 0.5736 ) * uv * vec2( 0.3, 1.6 ) + vec2( 0.137, 0.733 );
	vec2 g = vec2( 0.3, 1.6 ) * ( texture2D( normalMap, uvG ).xy - texture2D( normalMap, uvG, 2.0 ).xy );
	vec2 uvH = mat2( 0.7431, 0.6691, -0.6691, 0.7431 ) * uv * vec2( 0.27, 1.9 ) + vec2( 0.613, 0.291 );
	vec2 h = vec2( 0.27, 1.9 ) * ( texture2D( normalMap, uvH ).xy - texture2D( normalMap, uvH, 2.0 ).xy );
	vec2 fibre = mat2( 0.5736, -0.8192, 0.8192, 0.5736 ) * g + 0.7 * ( mat2( 0.7431, -0.6691, 0.6691, 0.7431 ) * h );
	float home = mix( HOME_GAIN, 1.0, smoothstep( 1.5, 2.4, close ) );
	return normalize( vec3( home * ( relief * ( a.xy * 2.0 - 1.0 + 0.5 * tilt ) + tooth * fine + relief * ( HOME_TOOTH * c + FIBRE * fibre ) ), a.z * 2.0 - 1.0 ) );
}
`.replace(/CLOSE_FALL/g, CLOSE_FALL.toFixed(3)).replace(/CLOSE_FLOOR/g, CLOSE_FLOOR.toFixed(3)).replace(/CLOSE_TOOTH/g, CLOSE_TOOTH.toFixed(3)).replace(/SHEET_TOOTH/g, SHEET_TOOTH.toFixed(3)).replace(/HOME_TOOTH/g, HOME_TOOTH.toFixed(3)).replace(/FIBRE/g, FIBRE.toFixed(3)).replace(/HOME_GAIN/g, HOME_GAIN.toFixed(3))

// Two layers of one grain picture, the second turned and larger, so no repeat shows across a page. The height also moves the roughness.
// The same picture is read three more times, each twice as fine as the one before and each less its own blurred copy. A reading comes in
// when its texel nears half a pixel in the picture and falls away as the camera goes on in, and so does the first. So the tooth stays
// a pixel or two wide however near the camera stands, and what was tooth further out is left as a faint unevenness under it.
// Two blurred readings of the height, far larger, shade the colour by a hair: the faint clouding a fired face has.
function grained<T extends THREE.MeshStandardMaterial>(material: T, rough: number): T {
  return also(material, `grain-${rough}`, (shader) => {
    const sample = 'texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0'
    const chunk = THREE.ShaderChunk.normal_fragment_maps
    if (!chunk.includes(`vec3 mapN = ${sample}`)) throw new Error('The normal code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <normalmap_pars_fragment>', `#include <normalmap_pars_fragment>\n${grainGlsl}`)
      .replace('#include <normal_fragment_maps>', `${chunk.replace(`vec3 mapN = ${sample}`, 'vec3 mapN = wjaGrain( vNormalMapUv )')}\n\troughnessFactor = clamp( roughnessFactor - wjaGrainHeight * ${rough.toFixed(3)}, 0.06, 1.0 );\n\tdiffuseColor.rgb *= 1.0 + ${MOTTLE.toFixed(4)} * wjaMottle;\n`)
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
		sum += w * getIBLRadiance( viewDir, normalize( normal + along * ( t * anisotropy * WJA_REACH ) ), roughness );
		total += w;
	}
	return sum / total;
}
#endif
`

// A brushed face mirrors the room stretched across its brushing. The stock code only bends the mirror when the face is seen from the side,
// so a turned face seen from above showed no fan of light. This reads the room along the stretch instead.
function stretched<T extends THREE.MeshPhysicalMaterial>(material: T, reach = 0.26): T {
  return also(material, `stretched-${reach}`, (shader) => {
    const call = 'getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy )'
    if (!shader.fragmentShader.includes(call) || !shader.fragmentShader.includes('void main() {')) throw new Error('The light code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `${stretchGlsl.replace('WJA_REACH', reach.toFixed(3))}\nvoid main() {`)
      .replace(call, 'wjaStretched( geometryViewDir, geometryNormal, material.roughness, material.anisotropyT, material.anisotropy )')
  })
}

const SLAB = { bend: 14, through: 0.06, cloud: 0.004, frost: 0.034, hair: 0.007, glint: 0.2, tooth: 0.235, sand: 1.5, sheen: 0.045, wash: 0.05, shoulder: 0.5, far: 0.16, farSide: 0.14, farLow: 0.1, farLowEnd: 0.05, spill: 0.16, spillLow: 0.05, bevelEnd: 14.9, flat: 0.24, bandSide: 0.78, bandSideLow: 0.66, bandTopNear: 0.94, bandTop: 0.78, dipTop: 0.12, dipTopFar: 0.12, dipSide: 0.22, dipSideLow: 0.07, rim: 1.2, rimFar: 0.4, level: 0.99, pool: 0.13, poolRise: 0.18, dash: 0.42, dashInset: 26, dashDepth: 9, dashPitch: 30, dashWide: 1.0 }

// A slab of frosted glass seen from above. Its geometry carries where each point lies on the card (`slab`: x, y, half width, half height,
// and `slabEdge`: the corner's radius and whether a panel is sunk in the face), and the face is worked out from that for every pixel:
// the shoulder toward the light lies in the glass's own shade and the one away from it lets the light out; inside the engraved line the panel
// is sunk a hair and shaded where the light enters; the page's tooth shows faintly through, bent where the face slopes; the frost is a slow
// cloud with a fine tooth, hairline polishing marks and a few bright points; and the soft light lies across the face as a wide sheen.
function slabbed<T extends THREE.MeshPhysicalMaterial>(material: T, grain: THREE.Texture, brushed: THREE.Texture, key: [number, number, number]): T {
  const flat = Math.hypot(key[0], key[1]) || 1
  const kx = (key[0] / flat).toFixed(4)
  const ky = (key[1] / flat).toFixed(4)
  const n = (v: number): string => v.toFixed(4)
  const body = `
	float wjaSlabGlow = 0.0;
	float wjaSlabShade = 1.0;
	{
		vec3 wjaAt = ( wjaViewInverse * vec4( - vViewPosition, 1.0 ) ).xyz;
		vec3 wjaFace = normalize( ( wjaViewInverse * vec4( nonPerturbedNormal, 0.0 ) ).xyz );
		vec2 sp = wjaSlab.xy;
		vec2 sh = wjaSlab.zw;
		float sr = wjaSlabEdge.x;
		float panel = wjaSlabEdge.y;
		vec2 sq = abs( sp ) - ( sh - sr );
		float D = sr - length( max( sq, 0.0 ) ) - min( max( sq.x, sq.y ), 0.0 );
		vec4 sw = exp( - vec4( sh.y - sp.y, sh.y + sp.y, sh.x + sp.x, sh.x - sp.x ) / 34.0 );
		float lit = clamp( dot( sw, vec4( ${ky}, - ( ${ky} ), - ( ${kx} ), ${kx} ) ) / ( ( sw.x + sw.y + sw.z + sw.w ) * 0.62 ), - 1.0, 1.0 );
		float toLight = max( lit, 0.0 );
		float away = max( - lit, 0.0 );
		float wash = dot( sp, vec2( ${kx}, ${ky} ) ) / length( sh );
		float cloud = 2.3 * ( texture2D( wjaSlabGrain, wjaAt.xy * 0.00006 + vec2( 0.613, 0.277 ), 3.0 ).a - 0.5 ) + 1.5 * ( texture2D( wjaSlabGrain, wjaAt.yx * 0.00013 + vec2( 0.211, 0.671 ), 3.0 ).a - 0.5 );
		float ramp = smoothstep( 5.5, 23.0, D );
		float u = sign( ${kx} ) * sp.x / sh.x;
		float v = sign( ${ky} ) * sp.y / sh.y;
		float dT = sh.y - sign( ${ky} ) * sp.y;
		float dS = sh.x - sign( ${kx} ) * sp.x;
		float E = mix( D, - 9.0 * log( exp( - dT / 9.0 ) + exp( - dS / 9.0 ) + exp( - ( 2.0 * sh.y - dT ) / 9.0 ) + exp( - ( 2.0 * sh.x - dS ) / 9.0 ) ), smoothstep( 14.0, 24.0, D ) );
		float dL = - 14.0 * log( exp( - dT / 14.0 ) + exp( - dS / 14.0 ) );
		float wT = exp( - dT / 34.0 );
		float wS = exp( - dS / 34.0 );
		float nearT = wT / ( wT + wS );
		float past = 1.0 - smoothstep( mix( 24.0, 14.0, panel ), mix( 36.0, 46.0, panel ), E );
		float fallU = smoothstep( 0.7, - 0.7, u );
		float fallV = smoothstep( 0.6, - 0.6, v );
		float bandL = mix( 0.45, 1.0, smoothstep( 3.0, mix( 10.0, 16.0, nearT ), D ) ) * mix( mix( ${n(SLAB.bandSide)}, ${n(SLAB.bandSideLow)}, fallV ), mix( ${n(SLAB.bandTopNear)}, ${n(SLAB.bandTop)}, fallU ), nearT );
		float mL = mix( mix( ${n(SLAB.shoulder)}, 1.0, ramp ), mix( bandL, 1.0, smoothstep( 12.0, 46.0, E ) ), panel );
		float wB = exp( - ( 2.0 * sh.y - dT ) / 34.0 );
		float wR = exp( - ( 2.0 * sh.x - dS ) / 34.0 );
		float mF = 1.0 + mix( ${n(SLAB.far)}, mix( ${n(SLAB.farSide)}, mix( ${n(SLAB.farLow)}, ${n(SLAB.farLowEnd)}, fallU ), wB / ( wB + wR ) ), panel ) * past;
		float mN = 1.0 + 0.1 * past;
		float m = mN + toLight * ( mL - mN ) + away * ( mF - mN );
		float dipL = mix( ${n(SLAB.dipSide)} + ${n(SLAB.dipSideLow)} * fallV, ${n(SLAB.dipTop)} + ${n(SLAB.dipTopFar)} * fallU, nearT ) * exp( - max( dL - 40.0, 0.0 ) / mix( 31.0, mix( 12.0, 25.0, fallU ), nearT ) );
		m *= 1.0 - panel * smoothstep( 8.0, 46.0, E ) * dipL;
		m *= 1.0 + panel * smoothstep( 10.0, 40.0, E ) * ( ${n(SLAB.spill)} * exp( - max( 2.0 * sh.x - dS - 30.0, 0.0 ) / 18.0 ) + ${n(SLAB.spillLow)} * exp( - max( 2.0 * sh.y - dT - 30.0, 0.0 ) / 14.0 ) );
		float seam = exp( - pow( ( D - ${n(SLAB.bevelEnd)} ) / 1.2, 2.0 ) );
		m *= 1.0 + mix( 0.1, 0.02, panel ) * seam * ( away - 0.6 * toLight );
		m *= mix( 1.0 - ${n(SLAB.wash)} * wash, mix( ${n(SLAB.level)} * ( 1.0 + ${n(SLAB.pool)} * u + ${n(SLAB.poolRise)} * max( u, 0.0 ) * v ), 1.0, away * past ), panel );
		m = mix( m, ${n(SLAB.rim)} + ${n(SLAB.rimFar)} * away, panel * ( 1.0 - smoothstep( 3.6 + 2.2 * away, 5.0 + 2.6 * away, D ) ) );
		wjaSlabShade = m;
		m = 1.0 + ${n(SLAB.cloud)} * cloud;
		float thin = 1.0 - smoothstep( 3.0, ${n(SLAB.bevelEnd)}, D );
		float near = smoothstep( 1.0, 2.6, projectionMatrix[ 1 ][ 1 ] * 540.0 / ( isOrthographic ? 1.0 : max( vViewPosition.z, 1.0 ) ) );
		vec4 under = texture2D( wjaSlabGrain, ( wjaAt.xy - wjaFace.xy * ${n(SLAB.bend)} ) * ( 2.0 / 1024.0 ), 0.5 );
		vec2 uvT = mat2( 0.4540, 0.8910, - 0.8910, 0.4540 ) * ( wjaAt.xy - wjaFace.xy * ${n(SLAB.bend)} ) * ( 4.0 / 1024.0 ) + vec2( 0.173, 0.591 );
		vec2 tooth = mat2( 0.4540, - 0.8910, 0.8910, 0.4540 ) * ( texture2D( wjaSlabGrain, uvT ).xy - texture2D( wjaSlabGrain, uvT, 2.0 ).xy );
		m *= 1.0 + ${n(SLAB.through)} * ( 0.6 + 0.3 * near + 0.5 * thin ) * dot( under.xy * 2.0 - 1.0, vec2( ${kx}, ${ky} ) ) + ${n(SLAB.tooth)} * ( 0.3 + 0.35 * near ) * 2.0 * dot( tooth, vec2( ${kx}, ${ky} ) );
		vec2 uvS = mat2( - 0.3090, 0.9511, - 0.9511, - 0.3090 ) * wjaAt.xy * ( 12.0 / 1024.0 ) + vec2( 0.731, 0.297 );
		vec2 uvR = mat2( 0.9659, 0.2588, - 0.2588, 0.9659 ) * wjaAt.xy * ( 7.0 / 1024.0 ) + vec2( 0.419, 0.857 );
		float sand = texture2D( wjaSlabGrain, uvS ).a - texture2D( wjaSlabGrain, uvS, 2.0 ).a + 0.7 * ( texture2D( wjaSlabGrain, uvR ).a - texture2D( wjaSlabGrain, uvR, 2.0 ).a );
		vec2 uvO = mat2( 0.4540, 0.8910, - 0.8910, 0.4540 ) * wjaAt.xy * ( 3.0 / 1024.0 ) + vec2( 0.173, 0.591 );
		sand += 1.6 * ( 1.0 - near ) * ( texture2D( wjaSlabGrain, uvO ).a - texture2D( wjaSlabGrain, uvO, 2.0 ).a );
		m *= 1.0 + ${n(SLAB.sand)} * ( 0.35 + 0.65 * near ) * sand;
		vec3 wjaEye = normalize( cameraPosition - wjaAt );
		vec2 dp = sp - wjaEye.xy * ( ${n(SLAB.dashDepth)} / ( 1.5 * max( wjaEye.z, 0.2 ) ) );
		float dr = max( 12.0, sr - 6.0 );
		vec2 da = sh - ${n(SLAB.dashInset)} - dr;
		vec2 de = abs( dp ) - da;
		float dd = length( max( de, 0.0 ) ) + min( max( de.x, de.y ), 0.0 ) - dr;
		float dturn = de.x > 0.0 && de.y > 0.0 ? dr * ( atan( de.x, de.y ) - 0.7854 ) : ( de.y > de.x ? - 0.7854 * dr - da.x + abs( dp.x ) : 0.7854 * dr + da.y - abs( dp.y ) );
		float dl = 0.7854 * dr + ( dturn < 0.0 ? da.x : da.y );
		float dpitch = dl / max( floor( dl / ${n(SLAB.dashPitch)} + 0.5 ), 1.0 );
		float ds = dturn;
		float dsoft = 0.55 + 0.25 * near;
		float dline = ( 1.0 - smoothstep( 0.29 * dpitch - dsoft, 0.29 * dpitch + dsoft, abs( fract( ds / dpitch + 0.5 ) - 0.5 ) * dpitch ) ) * ( 1.0 - smoothstep( ${n(SLAB.dashWide)} - 0.5 * dsoft, ${n(SLAB.dashWide)} + dsoft, abs( dd ) ) );
		m *= 1.0 - panel * ${n(SLAB.dash)} * dline;
		diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.83, 0.83, 0.8 ), 0.3 * thin * ( 0.35 + 0.65 * away ) ) * m;
		vec2 fu = mat2( 0.819, 0.574, - 0.574, 0.819 ) * wjaAt.xy;
		vec4 f1 = texture2D( wjaSlabGrain, fu * ( 3.0 / 1024.0 ) );
		vec4 f2 = texture2D( wjaSlabGrain, fu.yx * ( 2.3 / 1024.0 ) + vec2( 0.37, 0.71 ) );
		vec4 hair = texture2D( wjaSlabBrushed, mat2( 0.94, 0.342, - 0.342, 0.94 ) * wjaAt.xy * vec2( 1.0 / 900.0, 1.0 / 190.0 ) );
		vec2 slope = ${n(SLAB.frost)} * ( 0.6 - 0.25 * near ) * ( ( f1.xy * 2.0 - 1.0 ) + 0.2 * ( f2.xy * 2.0 - 1.0 ) ) + ${n(SLAB.hair)} * ( mat2( 0.94, - 0.342, 0.342, 0.94 ) * ( hair.xy * 2.0 - 1.0 ) );
		vec3 wjaUp = normalize( ( viewMatrix * vec4( 0.0, 0.0, 1.0, 0.0 ) ).xyz );
		normal = normalize( mix( wjaUp, normal, ${n(SLAB.flat)} ) + ( viewMatrix * vec4( slope, 0.0, 0.0 ) ).xyz );
		roughnessFactor = clamp( roughnessFactor + 0.02 * cloud, 0.1, 1.0 );
		float top = smoothstep( 3.5, 6.0, D );
		wjaSlabGlow = top * ( ${n(SLAB.glint)} * ( 1.0 - near ) * smoothstep( 0.3, 0.42, f2.a - f1.a ) + ${n(SLAB.sheen)} * smoothstep( mix( 0.75, - 0.65, panel ), mix( - 0.65, 0.75, panel ), wash + 0.08 * cloud ) );
	}
`
  return also(material, 'slab', (shader) => {
    shader.uniforms.wjaSlabGrain = { value: grain }
    shader.uniforms.wjaSlabBrushed = { value: brushed }
    const maps = '#include <clearcoat_normal_fragment_maps>'
    const end = '#include <lights_fragment_end>'
    const out = '#include <opaque_fragment>'
    if (!shader.fragmentShader.includes(maps) || !shader.fragmentShader.includes(end) || !shader.fragmentShader.includes(out) || !shader.vertexShader.includes('#include <begin_vertex>')) throw new Error('The surface code of this three.js release is not the one this build was written for')
    shader.vertexShader = 'attribute vec4 slab;\nattribute vec2 slabEdge;\nvarying vec4 wjaSlab;\nvarying vec2 wjaSlabEdge;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\twjaSlab = slab;\n\twjaSlabEdge = slabEdge;')
    shader.fragmentShader = '#ifndef USE_TRANSMISSION\nuniform mat4 projectionMatrix;\n#endif\nvarying vec4 wjaSlab;\nvarying vec2 wjaSlabEdge;\nuniform sampler2D wjaSlabGrain;\nuniform sampler2D wjaSlabBrushed;\n' + shader.fragmentShader
      .replace(maps, `${maps}\n${body}`)
      .replace(end, `${end}\n\treflectedLight.indirectSpecular += vec3( wjaSlabGlow ) * mix( 1.0, wjaOpen, 0.6 );`)
      .replace(out, `outgoingLight *= wjaSlabShade;\n\t${out}`)
  })
}

const SUNK_FILL = 0.4

// Frosted glass carries light sideways inside itself, so a shadow that falls on it is never as deep as one on the page.
function lightFilled<T extends THREE.MeshPhysicalMaterial>(material: T, fill: number): T {
  return also(material, `filled-${fill}`, (shader) => {
    const end = '#include <lights_fragment_end>'
    if (!shader.fragmentShader.includes(end)) throw new Error('The surface code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader.replace(end, `${end}\n\treflectedLight.indirectDiffuse += diffuseColor.rgb * ( ( 1.0 - wjaOpen ) * ${fill.toFixed(3)} );`)
  })
}

// The orange is a day-glow pigment: it gives back more of the lamps' light than its colour says. What reads the colour of the material reads the pigment, not this.
export const ORANGE_LIFT = 1.7
function lifted<T extends THREE.MeshPhysicalMaterial>(material: T, gain: number): T {
  return also(material, `lifted-${gain}`, (shader) => {
    const end = '#include <lights_fragment_end>'
    if (!shader.fragmentShader.includes(end)) throw new Error('The surface code of this three.js release is not the one this build was written for')
    shader.fragmentShader = shader.fragmentShader.replace(end, `${end}\n\treflectedLight.directDiffuse *= ${gain.toFixed(3)};\n\treflectedLight.indirectDiffuse *= ${gain.toFixed(3)};`)
  })
}

export interface Materials {
  ceramic: THREE.MeshPhysicalMaterial
  pocket: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  glassThick: THREE.MeshPhysicalMaterial
  glassSunk: THREE.MeshPhysicalMaterial
  glassCard: THREE.MeshPhysicalMaterial
  aluminium: THREE.MeshPhysicalMaterial
  aluminiumTurned: THREE.MeshPhysicalMaterial
  aluminiumEdge: THREE.MeshPhysicalMaterial
  aluminiumSatin: THREE.MeshPhysicalMaterial
  cardSeal: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  chrome: THREE.MeshPhysicalMaterial
  railSatin: THREE.MeshPhysicalMaterial
  railFlat: THREE.MeshPhysicalMaterial
  capFace: THREE.MeshPhysicalMaterial
  capRim: THREE.MeshPhysicalMaterial
  gap: THREE.MeshPhysicalMaterial
  ink: THREE.MeshPhysicalMaterial
  inkOnOrange: THREE.MeshPhysicalMaterial
  enamel: THREE.MeshPhysicalMaterial
  edge: THREE.MeshPhysicalMaterial
  smoked: THREE.MeshPhysicalMaterial
  chip: THREE.MeshPhysicalMaterial
  waiting: THREE.MeshPhysicalMaterial
  paper: THREE.MeshPhysicalMaterial
  red: THREE.MeshPhysicalMaterial
  keycap: THREE.MeshPhysicalMaterial
  steel: THREE.MeshPhysicalMaterial
  rubber: THREE.MeshPhysicalMaterial
  textures: THREE.Texture[]
}

export function makeMaterials(seed: number): Materials {
  // Two texels of grain are one page pixel: the surface's coordinates are page pixels.
  const grain = grainNormalMap(1024, seed, 0.5 * GRAIN_PER_PIXEL, PAGE_PITS, PAGE_COARSE)
  grain.repeat.set(GRAIN_PER_PIXEL / 1024, GRAIN_PER_PIXEL / 1024)
  // The glass reads the same picture again, finer and far weaker: the frost of its face. It shares the picture, so it costs no memory.
  const frost = grain.clone()
  frost.repeat.set(5 / 1024, 5 / 1024)
  const frosted = { normalMap: frost, normalScale: new THREE.Vector2(FROST, FROST) }
  const brushed = dataTexture(normalsOf(brushedHeights(512, seed), 512, 1.4), 512, true)
  brushed.repeat.set(1 / 720, 1 / 420)
  const turned = turnedMaps(256, seed, 2.2)
  const physical = (o: THREE.MeshPhysicalMaterialParameters) => studio(new THREE.MeshPhysicalMaterial(o))
  const ceramic = grained(physical({ color: srgb(0xf2f1ee), roughness: 0.74, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(PAGE_GRAIN, PAGE_GRAIN), specularIntensity: 0.6 }), 0.5)
  const pocket = grained(physical({ color: srgb(0xdcdfdc), roughness: 0.8, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.08, 0.08), specularIntensity: 0.4 }), 0.3)
  const glass = physical({ color: srgb(0xbdc5c2), roughness: 0.44, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, ...frosted })
  const glassSunk = lightFilled(physical({ color: srgb(0xd0d8d9), roughness: 0.44, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, vertexColors: true, ...frosted }), SUNK_FILL)
  const glassCard = slabbed(physical({ color: srgb(0xa8b1b4), roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3, specularIntensity: 0.8 }), grain, brushed, look.key.direction)
  const glassThick = physical({ color: srgb(0xa8b0af), roughness: 0.48, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.34, specularIntensity: 0.8, ...frosted })
  const aluminium = physical({
    color: srgb(0xb9bdc1), roughness: 0.3, metalness: 1, normalMap: brushed, normalScale: new THREE.Vector2(0.22, 0.22), anisotropy: 0.72, anisotropyRotation: Math.PI / 2
  })
  const aluminiumTurned = stretched(physical({
    color: srgb(0x92969b), roughness: 0.25, metalness: 1, normalMap: turned.normal, normalScale: new THREE.Vector2(0.06, 0.06), anisotropy: 0.85, anisotropyMap: turned.direction
  }))
  const aluminiumEdge = physical({ color: srgb(0xd0d4d7), roughness: 0.34, metalness: 0.8 })
  const capFace = stretched(physical({
    color: srgb(0x7f8388), roughness: 0.2, metalness: 1, normalMap: turned.normal, normalScale: new THREE.Vector2(0.1, 0.1), anisotropy: 0.9, anisotropyMap: turned.direction
  }), 0.42)
  const capRim = physical({ color: srgb(0xc2c6ca), roughness: 0.3, metalness: 1 })
  const railFlat = physical({ color: srgb(0x7b8085), roughness: 0.5, metalness: 0.55, normalMap: brushed, normalScale: new THREE.Vector2(0.12, 0.12), anisotropy: 0.5, anisotropyRotation: Math.PI / 2 })
  const cardSeal = physical({ color: srgb(0xa2a4a3), roughness: 0.7, metalness: 0 })
  const aluminiumSatin = physical({ color: srgb(0xb7bbbe), roughness: 0.3, metalness: 0.8 })
  const orange = lifted(physical({ color: srgb(0xbe5418), roughness: 0.55, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.1, specularIntensity: 0.3, specularColor: srgb(0xff9a52), envMapIntensity: 0.5 }), ORANGE_LIFT)
  const chrome = physical({ color: srgb(0xdfe1e3), roughness: 0.16, metalness: 1 })
  const railSatin = physical({ color: srgb(0xd2d6d9), roughness: 0.36, metalness: 0.85, normalMap: brushed, normalScale: new THREE.Vector2(0.2, 0.2), anisotropy: 0.6, anisotropyRotation: Math.PI / 2 })
  const gap = physical({ color: srgb(0x23211f), roughness: 0.85, metalness: 0, specularIntensity: 0.3 })
  const ink = physical({ color: srgb(0x2a2927), roughness: 0.48, metalness: 0, specularIntensity: 0.2 })
  const inkOnOrange = physical({ color: srgb(0xfdfdfd), roughness: 0.4, metalness: 0, specularIntensity: 0.4 })
  const enamel = physical({ color: srgb(0xf7f5f0), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 })
  const edge = physical({ color: srgb(0x1b1a19), roughness: 0.35, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 })
  const smoked = physical({ color: srgb(0x676d75), roughness: 0.55, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.32, specularIntensity: 0.7 })
  const chip = physical({ color: srgb(0x666c74), roughness: 0.56, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3, specularIntensity: 0.6, vertexColors: true })
  const waiting = physical({ color: srgb(0x6e7379), roughness: 0.5, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.1, specularIntensity: 0.8, specularColor: srgb(0xc9d6e2), sheen: 0.5, sheenRoughness: 0.4, sheenColor: srgb(0x8f9aa6) })
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
    ceramic, pocket, glass, glassThick, glassSunk, glassCard, aluminium, aluminiumTurned, aluminiumEdge, aluminiumSatin, cardSeal, orange, chrome, railSatin, railFlat, capFace, capRim, gap, ink, inkOnOrange, enamel, edge, smoked, chip, waiting, paper, red, keycap, steel, rubber,
    textures: [grain, brushed, turned.normal, turned.direction]
  }
}

let made: Materials | null = null
// The one set of materials every part shares, so the orange is the same orange everywhere.
export function materials(): Materials {
  made ??= makeMaterials(config.seed)
  return made
}

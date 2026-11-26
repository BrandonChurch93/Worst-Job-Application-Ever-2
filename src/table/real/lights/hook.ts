import * as THREE from 'three'
import type { Zone } from '../zone'
import { BALL, COLS, W } from '../../layout'
import { FLASH } from './colours'
import { CHANNELS, LAMP, LIT, SPILLS } from './groups'
import { BODY, CORE } from './pictures'
import { zoneLight, type ZoneLight } from './state'
import { surroundOf } from './surround'

const pars = /* glsl */ `
uniform sampler2D wjlA;
uniform sampler2D wjlB;
uniform sampler2D wjlC;
uniform mat4 wjlViewInverse;
uniform vec3 wjlFrame;
uniform vec2 wjlSize;
uniform vec3 wjlCol[ ${CHANNELS} ];
uniform vec3 wjlFull[ ${CHANNELS} ];
uniform vec4 wjlSpill[ ${SPILLS} ];
uniform vec3 wjlSpillCol[ ${SPILLS} ];
uniform vec4 wjlAt[ ${CHANNELS} ];
uniform vec3 wjlFill;
uniform vec4 wjlHole[ 2 ];
uniform float wjlEnv;
`

// The deck of the frame outside a tier's pit stands at the page's surface, over every lamp of the tier: no lamp reaches its top.
const EDGE = (COLS.launchB - W / 2) * BALL

// A lacquered floor is never a clean mirror: the fine scratches of play spread each lamp near it into a soft pool in the lamp's own colour, whatever the colour of the print under the lacquer.
const HAZE = 0.042

// Lacquer seen along the floor sends back more of the light on it than lacquer seen from above: the sheen of a waxed floor from across the room. Nothing is added straight down.
const SHEEN = { coat: 0.03, pools: 0.0 }

// Metal leaf laid in a floor is not a mirror: it is beaten thin over the grain of the print and throws a lamp's light back in every direction, in its own colour.
const LEAF = 1.1

// Lacquer is not a flat mirror: the orange peel of the coat draws each lamp out into a streak that runs toward the eye, longer the lower the eye. A lamp is looked for at several heights along the turned line of sight, a different set for each pixel.
const STREAK = { taps: 6, near: 0.5, far: 2.6, level: 2.6, long: 3.5 }

// How much of a lamp wet lacquer shows from straight above. Dry lacquer shows 0.04; the approved floors are wetter than that.
const WET = 0.1

// How bright the floor before a lit opening is with what the opening throws on it.
const SPILL = 1.6

// The lacquer is a dark mirror too: it shows each lamp over it as a small bright spot where the eye's line, turned by the floor, meets the lamp. From straight above the spot lies under its lamp, from a low eye it runs out toward the eye.
const GLINT = { level: 5.0, body: 13, low: 30 }

// For each group: its picture at the fragment's place, a term for the fragment's height and for the way its surface faces the lamps, the group's colour and level.
const body = /* glsl */ `
{
	vec3 wjlP = ( wjlViewInverse * vec4( - vViewPosition, 1.0 ) ).xyz - wjlFrame;
	vec3 wjlN = normalize( ( wjlViewInverse * vec4( geometryNormal, 0.0 ) ).xyz );
	vec2 wjlUv = wjlP.xy / wjlSize + 0.5;
	vec4 wjlTa = texture2D( wjlA, wjlUv );
	vec4 wjlTb = texture2D( wjlB, wjlUv );
	vec4 wjlTc = texture2D( wjlC, wjlUv );
	float wjlPhi[ ${CHANNELS} ];
	wjlPhi[ 0 ] = wjlTa.r; wjlPhi[ 1 ] = wjlTa.g; wjlPhi[ 2 ] = wjlTa.b; wjlPhi[ 3 ] = wjlTa.a;
	wjlPhi[ 4 ] = wjlTb.r; wjlPhi[ 5 ] = wjlTb.g; wjlPhi[ 6 ] = wjlTb.b; wjlPhi[ 7 ] = wjlTb.a;
	wjlPhi[ 8 ] = wjlTc.r; wjlPhi[ 9 ] = wjlTc.g;
	for ( int i = 0; i < ${CHANNELS - 1}; i ++ ) if ( wjlPhi[ i ] < 0.0 ) wjlPhi[ i ] = ${CORE.light.toFixed(1)};
	float wjlInside = step( abs( wjlUv.x - 0.5 ), 0.5 ) * step( abs( wjlUv.y - 0.5 ), 0.5 );
	float wjlSide = length( wjlTc.ba );
	vec2 wjlToward = wjlSide > 0.0001 ? wjlTc.ba / wjlSide : vec2( 1.0, 0.0 );
	float wjlLean = clamp( wjlPhi[ ${CHANNELS - 1} ], 0.2, 0.999 );
	float wjlRun = wjlLean / sqrt( 1.0 - wjlLean * wjlLean );
	float wjlCut = 1.0;
	for ( int h = 0; h < 2; h ++ ) {
		vec2 wjlOff = wjlP.xy - wjlHole[ h ].xy;
		wjlCut -= wjlHole[ h ].w * exp( - dot( wjlOff, wjlOff ) / ( wjlHole[ h ].z * wjlHole[ h ].z ) );
	}
	wjlCut = max( wjlCut, 0.0 );
	float wjlUp = max( wjlP.z, 0.0 );
	#ifdef WJL_GLASS
	float wjlClear = 0.25;
	#else
	float wjlClear = 1.0;
	#endif
	float wjlWall = 1.0 - smoothstep( 0.3, 0.9, wjlN.z );
	float wjlTop = 1.0 - wjlWall;
	float wjlRim = wjlFrame.z < - 1.0 ? - wjlFrame.z : 1.0e6;
	float wjlPit = 1.0 - wjlTop * smoothstep( wjlRim - 24.0, wjlRim - 4.0, wjlUp ) * smoothstep( ${EDGE.toFixed(1)}, ${(EDGE + 36).toFixed(1)}, abs( wjlP.x ) );
	wjlInside *= wjlPit;
	float wjlShine = 1.0 - smoothstep( 0.9, 0.995, wjlN.z ) * ( 1.0 - smoothstep( 4.0, 16.0, wjlUp ) );
	IncidentLight wjlLight;
	wjlLight.visible = true;
	vec3 wjlField = vec3( 0.0 );
	vec3 wjlHaze = vec3( 0.0 );
	vec3 wjlSeen = vec3( 0.0 );
	vec3 wjlSpilt = vec3( 0.0 );
	float wjlFlat = 1.0 - wjlShine;
	vec3 wjlBack = normalize( ( wjlViewInverse * vec4( geometryViewDir, 0.0 ) ).xyz );
	vec3 wjlRay = vec3( - wjlBack.xy, max( wjlBack.z, 0.06 ) );
	float wjlFace = 1.0 - clamp( wjlBack.z, 0.0, 1.0 );
	float wjlMirror = wjlFlat * ( ${WET.toFixed(2)} + ${(1 - WET).toFixed(2)} * wjlFace * wjlFace * wjlFace ) * smoothstep( 0.02, 0.12, wjlBack.z );
	if ( wjlMirror > 0.0 ) {
		float wjlGrain = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
		for ( int t = 0; t < ${STREAK.taps}; t ++ ) {
			float wjlStep = ( float( t ) + wjlGrain ) / ${STREAK.taps.toFixed(1)};
			float wjlHigh = ${STREAK.near.toFixed(2)} * pow( ${(STREAK.far / STREAK.near).toFixed(3)}, wjlStep );
			float wjlPart = ${(STREAK.level / STREAK.taps).toFixed(4)} * ( 1.0 - 0.7 * abs( 2.0 * wjlStep - 1.0 ) );
			vec2 wjlOver = ( wjlP.xy + wjlRay.xy / wjlRay.z * ${LAMP.z.toFixed(1)} * wjlHigh ) / wjlSize + 0.5;
			float wjlIn = step( abs( wjlOver.x - 0.5 ), 0.5 ) * step( abs( wjlOver.y - 0.5 ), 0.5 ) * wjlPart;
			vec4 wjlRa = texture2D( wjlA, wjlOver );
			vec4 wjlRb = texture2D( wjlB, wjlOver );
			vec4 wjlRc = texture2D( wjlC, wjlOver );
			float wjlRho[ ${CHANNELS} ];
			wjlRho[ 0 ] = wjlRa.r; wjlRho[ 1 ] = wjlRa.g; wjlRho[ 2 ] = wjlRa.b; wjlRho[ 3 ] = wjlRa.a;
			wjlRho[ 4 ] = wjlRb.r; wjlRho[ 5 ] = wjlRb.g; wjlRho[ 6 ] = wjlRb.b; wjlRho[ 7 ] = wjlRb.a;
			wjlRho[ 8 ] = wjlRc.r; wjlRho[ 9 ] = 0.0;
			for ( int i = 0; i < ${CHANNELS}; i ++ ) {
				if ( wjlAt[ i ].w > 1.5 && wjlAt[ i ].w < 2.5 ) wjlSeen += wjlFull[ i ] * smoothstep( ${(CORE.level * 0.12).toFixed(1)}, ${(CORE.level * 0.5).toFixed(1)}, - wjlRho[ i ] ) * wjlIn;
			}
		}
		vec3 wjlLine = wjlRay / length( wjlRay );
		vec3 wjlSide = normalize( vec3( wjlLine.y, - wjlLine.x, 0.0001 ) );
		vec3 wjlRise = cross( wjlSide, wjlLine );
		for ( int i = 0; i < ${CHANNELS}; i ++ ) {
			vec4 at = wjlAt[ i ];
			if ( at.w > 0.5 && at.w < 1.5 && at.z > ${GLINT.low.toFixed(1)} ) {
				vec3 wjlTo = at.xyz - wjlP;
				float wjlAcross = dot( wjlTo, wjlSide );
				float wjlOver2 = dot( wjlTo, wjlRise ) / ${STREAK.long.toFixed(1)};
				wjlSeen += wjlFull[ i ] * step( 0.0, dot( wjlTo, wjlLine ) ) * exp( - ( wjlAcross * wjlAcross + wjlOver2 * wjlOver2 ) / ${(GLINT.body * GLINT.body).toFixed(1)} ) * step( 0.0001, wjlPhi[ i ] );
			}
		}
		vec2 wjlEye = wjlBack.xy / max( length( wjlBack.xy ), 0.001 );
		float wjlLow = length( wjlBack.xy ) / max( wjlBack.z, 0.2 );
		for ( int k = 0; k < ${SPILLS}; k ++ ) {
			vec4 sp = wjlSpill[ k ];
			if ( sp.z <= 0.0 ) continue;
			vec2 d = wjlP.xy - sp.xy;
			float wjlFar = dot( d, wjlEye );
			float wjlOut = dot( d, vec2( - wjlEye.y, wjlEye.x ) );
			float wjlLong = sp.w * ( 0.5 + wjlLow );
			wjlSpilt += wjlSpillCol[ k ] * exp( - wjlOut * wjlOut / ( sp.z * sp.z ) ) * smoothstep( - 0.4 * sp.z, 0.1 * sp.z, wjlFar ) * ( 1.0 - smoothstep( 0.2 * wjlLong, wjlLong, wjlFar ) ) * ( 0.35 + 0.65 * wjlFace ) * wjlFlat;
		}
	}
	for ( int i = 0; i < ${CHANNELS}; i ++ ) {
		vec3 c = wjlCol[ i ];
		if ( c.r + c.g + c.b <= 0.0 ) continue;
		vec4 at = wjlAt[ i ];
		if ( at.w > 2.5 ) {
			wjlField += c * ( ${FLASH.flat.toFixed(3)} + ${FLASH.lamps.toFixed(3)} * min( 1.6, wjlPhi[ 0 ] ) ) * wjlInside * wjlClear * ( 0.58 + 0.42 * wjlN.z );
			continue;
		}
		float amount = wjlPhi[ i ] * wjlInside * wjlClear;
		if ( at.w < 0.5 ) {
			wjlField += c * amount * ( 0.34 + 0.66 * max( wjlN.z, 0.0 ) ) / ( 1.0 + wjlUp * wjlUp * at.z );
			wjlHaze += c * amount * smoothstep( 0.8, 2.6, amount );
			continue;
		}
		vec3 from = at.xyz;
		if ( at.w > 1.5 ) {
			from = vec3( wjlP.xy + wjlToward * at.z * wjlRun, at.z + wjlUp * wjlTop );
			amount *= wjlCut / ( 1.0 + wjlTop * wjlUp * wjlUp * ${(1 / (170 * 170)).toExponential(4)} );
			amount = mix( amount, 0.6 * amount / ( 1.0 + 1.5 * amount ), max( wjlWall, smoothstep( 40.0, 100.0, wjlUp ) ) );
			wjlHaze += c * amount * smoothstep( 0.8, 2.6, amount );
		}
		vec3 low = vec3( from.xy - wjlP.xy, at.z );
		vec3 to = from - wjlP;
		amount *= min( ( dot( low, low ) + ${(BODY * BODY).toFixed(1)} ) / ( dot( to, to ) + ${(BODY * BODY).toFixed(1)} ), at.w > 1.5 ? 1.4 : 3.0 );
		wjlLight.direction = normalize( ( viewMatrix * vec4( to, 0.0 ) ).xyz );
		wjlLight.color = c * amount * PI;
		vec3 wjlGloss = reflectedLight.directSpecular;
		#ifdef USE_CLEARCOAT
		vec3 wjlCoat = clearcoatSpecularDirect;
		#endif
		RE_Direct( wjlLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
		if ( at.w > 1.5 ) {
			reflectedLight.directSpecular = mix( wjlGloss, reflectedLight.directSpecular, wjlShine * ( 1.0 - 0.6 * wjlWall ) );
			#ifdef USE_CLEARCOAT
			clearcoatSpecularDirect = mix( wjlCoat, clearcoatSpecularDirect, wjlShine );
			#endif
		}
	}
	wjlField += wjlFill * ( 0.5 + 0.5 * wjlN.z ) * ( 1.0 + 1.6 * wjlTop * smoothstep( 20.0, 130.0, wjlUp ) ) * wjlPit;
	reflectedLight.directDiffuse += wjlField * material.diffuseColor;
	#ifdef USE_CLEARCOAT
	clearcoatSpecularDirect += wjlHaze * ${HAZE.toFixed(3)} * ( 1.0 + ${SHEEN.pools.toFixed(2)} * wjlFace * wjlFace ) * ( 1.0 - wjlShine ) / ( 1.0 + 0.25 * ( wjlHaze.r + wjlHaze.g + wjlHaze.b ) );
	clearcoatSpecularDirect += wjlField * ${SHEEN.coat.toFixed(3)} * wjlFlat * wjlFace * wjlFace;
	clearcoatSpecularDirect += wjlSeen * ${GLINT.level.toFixed(2)} * wjlMirror * wjlClear;
	clearcoatSpecularDirect += wjlSpilt * ${SPILL.toFixed(2)} * wjlClear;
	#endif
	#ifdef STANDARD
	reflectedLight.directSpecular += wjlField * material.specularColor * ( 0.12 + ${LEAF.toFixed(2)} * wjlFlat );
	#endif
}
`

const END = '#include <lights_fragment_end>'

const emits = (m: THREE.Material): boolean => {
  const s = m as THREE.MeshStandardMaterial
  if (s.emissiveMap) return true
  return s.emissive !== undefined && s.emissive.r + s.emissive.g + s.emissive.b > 0 && (s.emissiveIntensity ?? 1) > 0
}

// A material that gives light itself and one that asks to be left unlit pass untouched. `userData.lit` asks for the light all the same.
const skips = (m: THREE.Material): boolean => m.userData.unlit === true || (m.userData.lit !== true && emits(m))

const seen = new WeakSet<THREE.Material>()

// Clear glass sends back almost none of a lamp's light as a matte thing does: it shows the lamps in its reflection.
const glass = (m: THREE.Material): boolean => m.transparent === true && m.opacity < 0.5

function patch(shader: THREE.WebGLProgramParametersWithUniforms, s: ZoneLight, light: boolean, own: boolean, clear: boolean): void {
  if (shader.fragmentShader.includes('wjlEnv')) return
  const lights = light && shader.fragmentShader.includes(END)
  if (!lights && !own) return
  Object.assign(shader.uniforms, s.uniforms)
  let f = (clear ? '#define WJL_GLASS\n' : '') + pars + (lights ? shader.fragmentShader.replace(END, body + END) : shader.fragmentShader)
  if (own) {
    if (f.includes('( envMapIntensity * wjaEnvOwn )')) f = f.replaceAll('( envMapIntensity * wjaEnvOwn )', '( wjaEnvOwn * wjlEnv )')
    else if (f.includes('#include <envmap_physical_pars_fragment>')) f = f.replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll('* envMapIntensity', '* ( envMapIntensity * wjlEnv )'))
  }
  shader.fragmentShader = f
}

// Every material of a lit zone passes here once. From then on the light of the zone's lamps reaches it, and it reflects the zone's own dark surround.
export const hook: ((m: THREE.Material, z: Zone) => void) | null = (m, z) => {
  if (!LIT.includes(z.id) || seen.has(m)) return
  seen.add(m)
  const s = zoneLight(z)
  const standard = (m as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
  const compiles = [m.onBeforeCompile]
  const keys = [m.customProgramCacheKey]
  let depth = 0
  let keyDepth = 0
  const compile = function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms, renderer: THREE.WebGLRenderer): void {
    const f = compiles[compiles.length - 1 - depth]
    depth++
    try {
      if (f) f.call(m, shader, renderer)
    } finally {
      depth--
    }
    if (depth === 0) patch(shader, s, !skips(m), standard && (m as THREE.MeshStandardMaterial).envMap === surroundOf(z), glass(m))
  }
  const key = (): string => {
    const f = keys[keys.length - 1 - keyDepth]
    keyDepth++
    let k = ''
    try {
      k = f ? f.call(m) : ''
    } finally {
      keyDepth--
    }
    return keyDepth === 0 ? `${k}|wjl${skips(m) ? 0 : 1}${standard ? 1 : 0}${glass(m) ? 1 : 0}` : k
  }
  Object.defineProperty(m, 'onBeforeCompile', { configurable: true, enumerable: true, get: () => compile, set: (f: (typeof compiles)[number]) => { if (f !== compile) compiles.push(f) } })
  Object.defineProperty(m, 'customProgramCacheKey', { configurable: true, enumerable: true, get: () => key, set: (f: (typeof keys)[number]) => { if (f !== key) keys.push(f) } })
  if (standard && !(m as THREE.MeshStandardMaterial).envMap) (m as THREE.MeshStandardMaterial).envMap = surroundOf(z)
  m.userData.lightZone = z.id
  m.needsUpdate = true
}

import * as THREE from 'three'
import type { Zone } from '../zone'
import { CHANNELS, LIT } from './groups'
import { BODY } from './pictures'
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
uniform vec4 wjlAt[ ${CHANNELS} ];
uniform vec3 wjlFill;
uniform vec4 wjlHole[ 2 ];
uniform float wjlEnv;
`

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
	float wjlWall = 1.0 - smoothstep( 0.3, 0.9, wjlN.z );
	float wjlTop = 1.0 - wjlWall;
	float wjlShine = 1.0 - smoothstep( 0.9, 0.995, wjlN.z ) * ( 1.0 - smoothstep( 4.0, 16.0, wjlUp ) );
	IncidentLight wjlLight;
	wjlLight.visible = true;
	vec3 wjlField = vec3( 0.0 );
	for ( int i = 0; i < ${CHANNELS}; i ++ ) {
		vec3 c = wjlCol[ i ];
		if ( c.r + c.g + c.b <= 0.0 ) continue;
		vec4 at = wjlAt[ i ];
		if ( at.w > 2.5 ) {
			wjlField += c * ( 0.34 + 0.5 * min( 1.6, wjlPhi[ 0 ] ) ) * wjlInside * ( 0.58 + 0.42 * wjlN.z );
			continue;
		}
		float amount = wjlPhi[ i ] * wjlInside;
		if ( at.w < 0.5 ) {
			wjlField += c * amount * ( 0.58 + 0.42 * wjlN.z ) / ( 1.0 + wjlUp * wjlUp * at.z );
			continue;
		}
		vec3 from = at.xyz;
		if ( at.w > 1.5 ) {
			from = vec3( wjlP.xy + wjlToward * at.z * wjlRun, at.z + wjlUp * wjlTop );
			amount *= wjlCut / ( 1.0 + wjlTop * wjlUp * wjlUp * ${(1 / (170 * 170)).toExponential(4)} );
			amount = mix( amount, 0.6 * amount / ( 1.0 + 1.5 * amount ), wjlWall );
		}
		vec3 low = vec3( from.xy - wjlP.xy, at.z );
		vec3 to = from - wjlP;
		amount *= ( dot( low, low ) + ${(BODY * BODY).toFixed(1)} ) / ( dot( to, to ) + ${(BODY * BODY).toFixed(1)} );
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
	wjlField += wjlFill * ( 0.5 + 0.5 * wjlN.z ) * ( 1.0 + 1.6 * wjlTop * smoothstep( 20.0, 130.0, wjlUp ) );
	reflectedLight.directDiffuse += wjlField * material.diffuseColor;
	#ifdef STANDARD
	reflectedLight.directSpecular += wjlField * material.specularColor * 0.12;
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

function patch(shader: THREE.WebGLProgramParametersWithUniforms, s: ZoneLight, light: boolean, own: boolean): void {
  if (shader.fragmentShader.includes('wjlEnv')) return
  const lights = light && shader.fragmentShader.includes(END)
  if (!lights && !own) return
  Object.assign(shader.uniforms, s.uniforms)
  let f = pars + (lights ? shader.fragmentShader.replace(END, body + END) : shader.fragmentShader)
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
    if (depth === 0) patch(shader, s, !skips(m), standard && (m as THREE.MeshStandardMaterial).envMap === surroundOf(z))
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
    return keyDepth === 0 ? `${k}|wjl${skips(m) ? 0 : 1}${standard ? 1 : 0}` : k
  }
  Object.defineProperty(m, 'onBeforeCompile', { configurable: true, enumerable: true, get: () => compile, set: (f: (typeof compiles)[number]) => { if (f !== compile) compiles.push(f) } })
  Object.defineProperty(m, 'customProgramCacheKey', { configurable: true, enumerable: true, get: () => key, set: (f: (typeof keys)[number]) => { if (f !== key) keys.push(f) } })
  if (standard && !(m as THREE.MeshStandardMaterial).envMap) (m as THREE.MeshStandardMaterial).envMap = surroundOf(z)
  m.userData.lightZone = z.id
  m.needsUpdate = true
}

import * as THREE from 'three'
import { look } from './look'

// The small studio the surfaces reflect: one large soft light at the upper left and dim surroundings.
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene()
  const room = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.09, 0.09, 0.095), side: THREE.BackSide }))
  scene.add(room)
  const d = new THREE.Vector3(...look.studio.direction).normalize()
  const box = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(7.5, 7.2, 6.9), side: THREE.DoubleSide }))
  box.position.copy(d).multiplyScalar(20)
  box.lookAt(0, 0, 0)
  scene.add(box)
  const glowBox = new THREE.Mesh(new THREE.PlaneGeometry(44, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.54, 0.53), side: THREE.DoubleSide }))
  glowBox.position.copy(d).multiplyScalar(22)
  glowBox.lookAt(0, 0, 0)
  scene.add(glowBox)
  // A long dim strip behind the viewer keeps flat glossy faces from reading as a black mirror.
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.22, 0.225), side: THREE.DoubleSide }))
  back.position.set(0, 0, 30)
  back.lookAt(0, 0, 0)
  scene.add(back)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(scene, 0.03, 0.1, 200)
  pmrem.dispose()
  room.geometry.dispose()
  box.geometry.dispose()
  glowBox.geometry.dispose()
  back.geometry.dispose()
  return target.texture
}

// What every material that passed through studio() reads for the frame. The light rig writes them for each sample.
export const lightLaw = {
  envDiffuse: { value: look.envDiffuse },
  keySpecular: { value: look.keySpecular },
  // The camera's place in the world, so a surface knows where on the page it is.
  viewInverse: { value: new THREE.Matrix4() },
  // No surface sends back more light than this, so only a thing that gives off light is bright enough to glow.
  cap: { value: new THREE.Vector2(look.glow.surfaceKnee, look.glow.surfaceMax) },
  // Where the key stands, in world units, and the square of its distance to the middle of the view.
  keyAt: { value: new THREE.Vector4(0, 0, 1, 1) }
}

const fail = () => new Error('The light code of this three.js release is not the one this build was written for')

// One shadow law for every surface, also for the diagnostic views: a blocker search, then a filter as wide as the
// light's area makes the shadow at that distance. Tight at the contact, softer with height.
// A light's shadow radius holds two numbers: the whole part is the width of the blur in texels for a blocker one whole
// depth range away, the rest says which of the picture's samples this is. Its shadow intensity holds the number of
// taps and the number of samples. The taps of all the samples of a picture make one even disk between them.
const softShadow = /* glsl */ `
	#else

		float wjaNoise( vec2 p ) {
			return fract( 52.9829189 * fract( dot( p, vec2( 0.06711056, 0.00583715 ) ) ) );
		}

		vec2 wjaTap( float i, float part, float n, float phi, float power ) {
			float r = pow( ( i + part ) / n, power );
			float a = i * 2.399963229728653 + phi;
			return vec2( cos( a ), sin( a ) ) * r;
		}

		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			shadowCoord.xyz /= shadowCoord.w;
			vec3 ax = dFdx( shadowCoord.xyz );
			vec3 ay = dFdy( shadowCoord.xyz );
			float det = ax.x * ay.y - ax.y * ay.x;
			vec2 slope = abs( det ) > 1e-20 ? vec2( ay.y * ax.z - ax.y * ay.z, ax.x * ay.z - ay.x * ax.z ) / det : vec2( 0.0 );
			float steep = WJA_SLOPE_MAX * abs( shadowBias ) * shadowMapSize.x;
			slope = clamp( slope, - steep, steep );
			shadowCoord.z += shadowBias;

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			if ( ! ( inFrustum && shadowCoord.z <= 1.0 ) ) return 1.0;

			float code = floor( shadowIntensity + 0.5 );
			float count = max( 1.0, floor( code / 32.0 ) );
			float taps = clamp( code - count * 32.0, 2.0, float( WJA_BLUR_TAPS ) );
			float looks = max( 6.0, floor( taps * 0.75 ) );
			float spread = floor( shadowRadius );
			float part = fract( shadowRadius );
			float turn = floor( part * count );
			float phi = ( wjaNoise( gl_FragCoord.xy + turn * 5.588238 ) + turn * 0.6180339887 ) * 6.283185307;
			vec2 texel = 1.0 / shadowMapSize;
			float zr = shadowCoord.z;

			float reach = clamp( spread * WJA_SEARCH_DEPTH, 2.5, WJA_SEARCH_MAX );
			float here = texture2D( shadowMap, shadowCoord.xy ).r;
			float hits = step( here, zr - 0.0000001 );
			float sum = here * hits;
			for ( int i = 0; i < WJA_BLUR_TAPS; i ++ ) {
				if ( float( i ) >= looks ) break;
				vec2 o = wjaTap( float( i ), part, looks, phi + 1.9, 0.85 ) * reach * texel;
				float d = texture2D( shadowMap, shadowCoord.xy + o ).r - dot( o, slope );
				if ( d < zr ) { sum += d; hits += 1.0; }
			}
			if ( hits < 0.5 ) return 1.0;

			float wide = clamp( ( zr - sum / hits ) * spread, WJA_BLUR_MIN, WJA_BLUR_MAX );
			float lit = 0.0;
			for ( int i = 0; i < WJA_BLUR_TAPS; i ++ ) {
				if ( float( i ) >= taps ) break;
				vec2 o = wjaTap( float( i ), part, taps, phi, 0.5 ) * wide * texel;
				lit += step( zr + dot( o, slope ), texture2D( shadowMap, shadowCoord.xy + o ).r );
			}
			return lit / taps;

		}

	#endif
`

// The widest blur and search in texels, and the blur no shadow goes below so a texel never shows.
export const shadowFilter = { blurTaps: 16, minTaps: 8, tapsPerPicture: 64, slopeMax: 40, searchDepth: 0.07, searchMax: 40, blurMin: 1.1, blurMax: 44 }

function patchShadows(): void {
  const chunk = THREE.ShaderChunk.shadowmap_pars_fragment
  if (chunk.includes('wjaTap')) return
  const head = 'float getShadow( sampler2D shadowMap'
  const body = chunk.lastIndexOf(head)
  const from = chunk.lastIndexOf('#else', body)
  const last = chunk.indexOf('return mix( 1.0, shadow, shadowIntensity );', body)
  const to = chunk.indexOf('#endif', last)
  if (body < 0 || body === chunk.indexOf(head) || from < 0 || last < 0 || to < 0) throw fail()
  const f = shadowFilter
  const defines = `#define WJA_BLUR_TAPS ${f.blurTaps}\n#define WJA_SLOPE_MAX ${f.slopeMax.toFixed(1)}\n#define WJA_SEARCH_DEPTH ${f.searchDepth.toFixed(4)}\n#define WJA_SEARCH_MAX ${f.searchMax.toFixed(1)}\n#define WJA_BLUR_MIN ${f.blurMin.toFixed(2)}\n#define WJA_BLUR_MAX ${f.blurMax.toFixed(1)}\n`
  THREE.ShaderChunk.shadowmap_pars_fragment = defines + chunk.slice(0, from) + softShadow.trim() + chunk.slice(to + '#endif'.length)
}

// A thing that gives off light is a small body, not a point: its light does not burn what it touches.
export const EMITTER_BODY_PX = 20
function patchFalloff(): void {
  const chunk = THREE.ShaderChunk.lights_pars_begin
  const line = 'float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );'
  if (chunk.includes('WJA_BODY')) return
  if (!chunk.includes(line)) throw fail()
  THREE.ShaderChunk.lights_pars_begin = chunk.replace(line, `float distanceFalloff = 1.0 / ( pow( lightDistance, decayExponent ) + ${(EMITTER_BODY_PX * EMITTER_BODY_PX).toFixed(1)} ); // WJA_BODY`)
}

patchShadows()
patchFalloff()

const dirStart = '#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )'
function patchedBegin(): string {
  const chunk = THREE.ShaderChunk.lights_fragment_begin
  const at = chunk.indexOf(dirStart)
  const end = chunk.indexOf('#pragma unroll_loop_end', at)
  if (at < 0 || end < 0) throw fail()
  const stop = end + '#pragma unroll_loop_end'.length
  const info = 'getDirectionalLightInfo( directionalLight, directLight );'
  const loop = chunk.slice(at + dirStart.length, stop)
  if (!loop.includes(info)) throw fail()
  const before =
    '\n\tvec3 wjaSpec0 = reflectedLight.directSpecular;\n\t#ifdef USE_CLEARCOAT\n\tvec3 wjaCoat0 = clearcoatSpecularDirect;\n\t#endif\n' +
    '\tvec3 wjaToKey = wjaKeyAt.xyz - ( wjaViewInverse * vec4( - vViewPosition, 1.0 ) ).xyz;\n\tfloat wjaNear = wjaKeyAt.w / dot( wjaToKey, wjaToKey );\n\tfloat wjaFall = wjaNear * sqrt( wjaNear );\n'
  const after = '\n\treflectedLight.directSpecular = mix( wjaSpec0, reflectedLight.directSpecular, wjaKeySpecular );\n\t#ifdef USE_CLEARCOAT\n\tclearcoatSpecularDirect = mix( wjaCoat0, clearcoatSpecularDirect, wjaKeySpecular );\n\t#endif\n'
  const fall = info + '\n\t\t#if UNROLLED_LOOP_INDEX == 0\n\t\tdirectLight.color *= wjaFall;\n\t\t#endif\n'
  return chunk.slice(0, at + dirStart.length) + before + loop.replace(info, fall) + after + chunk.slice(stop)
}
function patchedMaps(): string {
  const chunk = THREE.ShaderChunk.lights_fragment_maps
  const line = 'iblIrradiance += getIBLIrradiance( geometryNormal );'
  if (!chunk.includes(line)) throw fail()
  return chunk.replace(line, 'iblIrradiance += wjaEnvDiffuse * getIBLIrradiance( geometryNormal );')
}

// The scene's environment is drawn at one strength for every surface. This gives each material its own share of it back.
function patchedEnv(): string {
  const chunk = THREE.ShaderChunk.envmap_physical_pars_fragment
  if (!chunk.includes('* envMapIntensity')) throw fail()
  return chunk.replaceAll('* envMapIntensity', '* ( envMapIntensity * wjaEnvOwn )')
}

const capped = /* glsl */ `
	{
		vec3 wjaBack = max( outgoingLight - totalEmissiveRadiance, vec3( 0.0 ) );
		float wjaTop = max( wjaBack.r, max( wjaBack.g, wjaBack.b ) );
		float wjaRoom = wjaCap.y - wjaCap.x;
		if ( wjaTop > wjaCap.x ) wjaBack *= ( wjaCap.x + wjaRoom * ( 1.0 - exp( - ( wjaTop - wjaCap.x ) / wjaRoom ) ) ) / wjaTop;
		outgoingLight = wjaBack + totalEmissiveRadiance;
	}
`

// The studio rule: lamps with shadows give the diffuse light, the studio's reflection gives the highlights,
// and the key is nearer to the upper left of the page than to the lower right.
export function studio<T extends THREE.MeshStandardMaterial>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.wjaEnvDiffuse = lightLaw.envDiffuse
    shader.uniforms.wjaKeySpecular = lightLaw.keySpecular
    shader.uniforms.wjaViewInverse = lightLaw.viewInverse
    shader.uniforms.wjaKeyAt = lightLaw.keyAt
    shader.uniforms.wjaCap = lightLaw.cap
    shader.uniforms.wjaEnvOwn = { get value() { return material.envMapIntensity } } as THREE.IUniform
    shader.fragmentShader =
      'uniform float wjaEnvDiffuse;\nuniform float wjaKeySpecular;\nuniform mat4 wjaViewInverse;\nuniform vec4 wjaKeyAt;\nuniform float wjaEnvOwn;\nuniform vec2 wjaCap;\n' +
      shader.fragmentShader.replace('#include <opaque_fragment>', capped + '#include <opaque_fragment>').replace('#include <lights_fragment_begin>', patchedBegin()).replace('#include <lights_fragment_maps>', patchedMaps()).replace('#include <envmap_physical_pars_fragment>', patchedEnv())
  }
  material.customProgramCacheKey = () => 'wja-studio'
  return material
}

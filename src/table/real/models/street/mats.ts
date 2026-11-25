import * as THREE from 'three'
import { studio } from '../../../../post/studio'
import { lit } from '../../light'
import type { Zone } from '../../zone'

type Shader = THREE.WebGLProgramParametersWithUniforms

const named = <T extends THREE.Material>(m: T, name: string): T => {
  m.name = name
  return m
}

// Lays one more step over the material's compile, as the frame's clear plastic does, and names the program.
const over = (m: THREE.Material, key: string, patch: (shader: Shader) => void): void => {
  const before = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    before.call(m, shader, renderer)
    patch(shader)
  }
  m.customProgramCacheKey = () => key
}

const surface = /* glsl */ `
float wsHash( vec2 p ) {
	vec3 q = fract( vec3( p.xyx ) * 0.1031 );
	q += dot( q, q.yzx + 33.33 );
	return fract( ( q.x + q.y ) * q.z );
}
float wsNoise( vec2 p ) {
	vec2 i = floor( p );
	vec2 f = fract( p );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( wsHash( i ), wsHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( wsHash( i + vec2( 0.0, 1.0 ) ), wsHash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
// A grid of cells with a joint between them: x the joint (1 in the joint), y a number for the cell.
vec2 wsCells( vec2 uv, vec2 size, float shift, float joint ) {
	float row = floor( uv.y / size.y );
	vec2 q = vec2( uv.x + shift * size.x * mod( row, 2.0 ), uv.y );
	vec2 cell = floor( q / size );
	vec2 f = q - cell * size;
	vec2 w = max( fwidth( uv ), vec2( 0.0001 ) );
	vec2 edge = min( f, size - f );
	float jx = 1.0 - smoothstep( joint * 0.5 - w.x, joint * 0.5 + w.x, edge.x );
	float jy = 1.0 - smoothstep( joint * 0.5 - w.y, joint * 0.5 + w.y, edge.y );
	float fade = clamp( 1.6 - max( w.x / size.x, w.y / size.y ) * 5.0, 0.0, 1.0 );
	return vec2( max( jx, jy ) * fade, wsHash( cell + 7.0 ) );
}
// The surface a face is moulded with: xyz the tone its paint is multiplied by, w its height for the relief. wsGloss is taken off the roughness.
float wsGloss = 0.0;
vec4 wsOver = vec4( 0.0 );
vec4 wsSurface( vec3 face ) {
	vec2 uv = face.xy;
	float kind = floor( face.z + 0.1 );
	float upright = 1.0 - step( 0.12, face.z - kind );
	float grain = wsNoise( uv * 0.9 ) * 0.5 + wsNoise( uv * 0.23 ) * 0.5;
	vec3 tone = vec3( 1.0 );
	float h = 0.0;
	if ( kind == 1.0 || kind == 10.0 ) {
		vec2 c = wsCells( uv, vec2( 6.0, 2.5 ), 0.5, 0.5 );
		float burnt = step( 0.86, wsHash( vec2( c.y * 53.0, 11.0 ) ) );
		if ( kind == 1.0 ) {
			tone = vec3( 0.78 + 0.4 * c.y ) * vec3( 1.0, 0.92 + 0.14 * wsHash( vec2( c.y * 91.0, 3.0 ) ), 0.9 ) * ( 1.0 - 0.4 * burnt ) * ( 0.9 + 0.2 * grain );
			wsOver = vec4( vec3( 0.33, 0.3, 0.27 ) * ( 0.7 + 0.5 * grain ), c.x * 0.6 );
		} else {
			tone = vec3( 0.9 + 0.18 * c.y ) * ( 1.0 - 0.3 * c.x ) * ( 0.92 + 0.14 * grain );
		}
		h = ( 1.0 - c.x ) * 0.12 + grain * 0.3;
	} else if ( kind == 2.0 ) {
		vec2 c = wsCells( uv, vec2( 22.0, 9.6 ), 0.5, 1.3 );
		tone = vec3( 0.84 + 0.22 * c.y + 0.1 * grain ) * ( 1.0 - 0.2 * c.x );
		h = ( 1.0 - c.x ) * 0.3 + grain * 0.35;
	} else if ( kind == 3.0 ) {
		vec2 c = wsCells( uv, vec2( 400.0, 13.0 ), 0.37, 0.45 );
		float stain = wsNoise( vec2( uv.x * 0.11, uv.y * 0.035 ) );
		tone = vec3( 0.93 + 0.05 * c.y + 0.08 * grain ) * ( 1.0 - 0.1 * c.x ) * ( 0.88 + 0.18 * stain );
		h = ( 1.0 - c.x ) * 0.25 + grain * 0.3;
	} else if ( kind == 4.0 ) {
		vec2 c = wsCells( uv, vec2( 3.4, 2.6 ), 0.5, 0.45 );
		float lap = fract( uv.y / 2.6 );
		tone = vec3( 0.74 + 0.36 * c.y ) * ( 0.8 + 0.26 * lap ) * ( 1.0 - 0.28 * c.x ) * ( 0.78 + 0.4 * wsNoise( uv * 0.13 ) );
		h = lap * 0.7;
	} else if ( kind == 5.0 ) {
		float lap = fract( uv.y / 4.2 );
		float w = max( fwidth( uv.y ) / 4.2, 0.0001 );
		float line = 1.0 - smoothstep( 0.1 - w, 0.1 + w, lap );
		tone = vec3( 0.9 + 0.1 * grain ) * ( 1.0 - 0.36 * line ) * ( 0.9 + 0.14 * lap );
		h = lap * 0.9;
	} else if ( kind == 6.0 ) {
		tone = vec3( 0.9 + 0.16 * wsNoise( uv * 2.1 ) );
		h = wsNoise( uv * 2.1 ) * 0.5;
	} else if ( kind == 7.0 ) {
		wsGloss = 0.42;
	} else if ( kind == 8.0 ) {
		vec2 q = uv / 2.6;
		q.x += 0.5 * mod( floor( q.y ), 2.0 );
		vec2 f = abs( fract( q ) - 0.5 );
		float cell = smoothstep( 0.5, 0.34, max( f.x, f.y ) );
		float fade = clamp( 1.4 - fwidth( uv.x ) * 0.9, 0.0, 1.0 );
		tone = vec3( 1.0 - 0.16 * ( 1.0 - cell ) * fade );
		h = cell * 0.35 * fade;
		wsGloss = 0.4;
	} else if ( kind == 9.0 ) {
		float speck = wsNoise( uv * 1.1 );
		tone = vec3( 0.86 + 0.12 * speck * speck ) * ( 0.74 + 0.4 * wsNoise( uv * 0.06 ) ) * ( 0.9 + 0.2 * wsNoise( uv * 0.4 ) );
		h = speck * 0.1;
	} else {
		tone = vec3( 0.95 + 0.08 * grain );
	}
	if ( kind == 1.0 || kind == 2.0 || kind == 3.0 || kind == 5.0 || kind == 6.0 || kind == 10.0 ) {
		float stain = wsNoise( uv * 0.05 + 3.7 ) * 0.6 + wsNoise( vec2( uv.x * 0.31, uv.y * 0.045 ) ) * 0.4;
		float foot = smoothstep( -2.0, 24.0, uv.y + 9.0 * wsNoise( uv * 0.16 ) );
		float streak = wsNoise( vec2( uv.x * 0.45, uv.y * 0.022 ) );
		tone *= ( 0.7 + 0.42 * stain ) * mix( 1.0, 0.78 + 0.3 * streak, upright ) * mix( 1.0, mix( 0.45, 1.0, foot ), upright );
		wsOver.a *= mix( 1.0, 0.75 + 0.25 * foot, upright );
	}
	return vec4( tone, h );
}
`

// The moulded and painted plastic of the models: one material for the zone, a colour for each vertex and a kind of surface for each face.
export function paintOf(z: Zone): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, metalness: 0, specularIntensity: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.38 }))
  over(m, 'wja-studio-street-paint-10', (shader) => {
    shader.vertexShader = 'attribute vec3 face;\nvarying vec3 vWsFace;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvWsFace = face;')
    shader.fragmentShader =
      'varying vec3 vWsFace;\n' +
      shader.fragmentShader
        .replace('void main() {', surface + '\nvoid main() {\n\tvec4 wsS = wsSurface( vWsFace );')
        .replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb = mix( diffuseColor.rgb * wsS.xyz, wsOver.rgb, wsOver.a );')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = clamp( roughnessFactor - wsGloss, 0.05, 1.0 );')
        .replace(
          '#include <normal_fragment_maps>',
          '#include <normal_fragment_maps>\n\t{\n\t\tvec2 wsD = vec2( dFdx( wsS.w ), dFdy( wsS.w ) );\n\t\tvec3 wsX = dFdx( - vViewPosition );\n\t\tvec3 wsY = dFdy( - vViewPosition );\n\t\tvec3 wsR1 = cross( wsY, normal );\n\t\tvec3 wsR2 = cross( normal, wsX );\n\t\tfloat wsDet = dot( wsX, wsR1 );\n\t\tvec3 wsGrad = sign( wsDet ) * ( wsD.x * wsR1 + wsD.y * wsR2 );\n\t\tnormal = normalize( abs( wsDet ) * normal - 1.1 * wsGrad );\n\t}'
        )
  })
  return named(lit(m, z), `street.paint.${z.id}`)
}

// Chrome, brass, bronze and bare aluminum: one material, a colour for each vertex.
export const metalOf = (z: Zone): THREE.MeshPhysicalMaterial => named(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.24, metalness: 1 })), z), `street.metal.${z.id}`)

// A surface that gives light: its colour is the group's, each vertex says how much of it, and its level is set in pose.
export function glowOf(z: Zone, name: string, colour: [number, number, number]): THREE.MeshStandardMaterial {
  const m = studio(new THREE.MeshStandardMaterial({ color: 0x0b0906, vertexColors: true, roughness: 0.5, metalness: 0, emissive: new THREE.Color(colour[0], colour[1], colour[2]), emissiveIntensity: 1 }))
  m.userData.unlit = true
  over(m, 'wja-studio-street-glow', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;')
  })
  return named(lit(m, z), `street.glow.${name}.${z.id}`)
}

// The lens of a beacon: clear coloured plastic that glows with its lamp and still takes the light round it.
export function lensOf(z: Zone, name: string, colour: [number, number, number]): THREE.MeshPhysicalMaterial {
  const m = studio(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colour[0] * 0.55 + 0.01, colour[1] * 0.3 + 0.005, colour[2] * 0.55 + 0.01),
      roughness: 0.12,
      metalness: 0,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      emissive: new THREE.Color(colour[0], colour[1], colour[2]),
      emissiveIntensity: 1
    })
  )
  m.userData.lit = true
  return named(lit(m, z), `street.lens.${name}.${z.id}`)
}

// Clear plastic: panes and the panel of the shelter.
export const glassOf = (z: Zone): THREE.MeshPhysicalMaterial =>
  named(lit(studio(new THREE.MeshPhysicalMaterial({ color: 0xcfdde2, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1 })), z), `street.glass.${z.id}`)

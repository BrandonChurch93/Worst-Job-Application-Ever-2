import * as THREE from 'three'
import { LIT } from '../lights/groups'
import { zoneLight } from '../lights/state'
import type { Zone } from '../zone'

// The lamps of the lanes stand in rows along the table: this far apart, this far from the metal that mirrors them, this far above it.
const ROW = { step: 72, away: 96, high: 45, strength: 5 }

// What the metal of a zone mirrors once the website's light is down: a dark room with one soft panel overhead, a row of small lamps round the table, the lit edge of the table at the horizon and the tier's own floor below.
// A flat top seen from above shows the dark ceiling and the panel's slow gradient, a chamfer shows the horizon as one hard bright line, a wire shows all of it across its width.
const ROOM: Record<string, { lamp: [number, number, number]; floor: [number, number, number] }> = {
  marquee: { lamp: [0.72, 0.8, 1.0], floor: [0.1, 0.1, 0.12] },
  corporate: { lamp: [1.0, 0.86, 0.62], floor: [0.1, 0.15, 0.34] },
  office: { lamp: [0.88, 1.0, 0.94], floor: [0.3, 0.38, 0.34] },
  street: { lamp: [1.0, 0.8, 0.56], floor: [0.08, 0.15, 0.24] }
}

const PARS = /* glsl */ `
uniform float wjsLevel;
uniform vec3 wjsLamp;
uniform vec3 wjsFloor;
uniform vec4 wjsPanel;
uniform vec4 wjsRow;
uniform float wjsDirect;
uniform float wjsKeep;
varying vec3 wjsAt;
float wjsGlint( float across, float along, float up, float at, float rough ) {
	float a = abs( across );
	if ( a < 0.04 ) return 0.0;
	float t = wjsRow.y / a;
	float h = up * t - wjsRow.z;
	float d = ( fract( ( at + along * t ) / wjsRow.x ) - 0.5 ) * wjsRow.x;
	float s = 6.0 + rough * 70.0;
	return exp( - ( d * d + h * h ) / ( s * s ) ) / ( 1.0 + rough * rough * 40.0 );
}
vec3 wjsLamps( vec3 R, float rough ) {
	return mix( wjsLamp, vec3( 1.0 ), 0.35 ) * wjsRow.w * ( wjsGlint( R.x, R.y, R.z, wjsAt.y, rough ) + wjsGlint( R.y, R.x, R.z, wjsAt.x, rough ) );
}
vec3 wjsRoom( vec3 R, float rough ) {
	float soft = 0.015 + rough * 0.75;
	float az = atan( R.y, R.x );
	vec2 c = R.xy - vec2( -0.1, 0.07 );
	float panel = exp( - dot( c, c ) / ( wjsPanel.z + soft * soft ) );
	float up = smoothstep( 0.5 - soft * 1.8, 0.86 - soft * 0.6, R.z );
	vec3 col = vec3( 0.016, 0.017, 0.02 ) + up * ( wjsPanel.x + wjsPanel.y * panel ) * vec3( 1.0, 0.985, 0.96 );
	float wide = 0.06 + soft;
	float band = exp( - ( R.z - 0.66 ) * ( R.z - 0.66 ) / ( wide * wide ) );
	float row = pow( 0.5 + 0.5 * cos( az * 9.0 + 0.6 ), mix( 16.0, 1.5, clamp( rough * 2.6, 0.0, 1.0 ) ) );
	col += wjsLamp * band * row * 2.2 / ( 1.0 + soft * 7.0 );
	float edge = 0.085 + soft;
	float hor = exp( - ( R.z - 0.03 ) * ( R.z - 0.03 ) / ( edge * edge ) );
	float sides = 0.6 + 0.4 * sin( az * 2.0 + 0.9 ) * sin( az * 3.0 - 0.4 );
	col += mix( wjsLamp, vec3( 1.0 ), 0.45 ) * hor * sides * wjsPanel.w;
	float low = smoothstep( -0.04, -0.34, R.z );
	col = mix( col, wjsFloor * ( 0.16 + 0.3 * ( 0.5 + 0.5 * sin( az * 5.0 + 1.7 ) ) ), low );
	return col;
}
`

const BODY = /* glsl */ `
{
	vec3 wjsR = normalize( ( wjaViewInverse * vec4( reflect( - geometryViewDir, geometryNormal ), 0.0 ) ).xyz );
	reflectedLight.directSpecular *= wjsPanel.w > 0.0 ? wjsDirect : 1.0;
	reflectedLight.indirectSpecular = reflectedLight.indirectSpecular * wjsKeep + material.specularColor * ( wjsRoom( wjsR, material.roughness ) + wjsLamps( wjsR, material.roughness ) ) * wjsLevel;
}
`

const AT = '#include <aomap_fragment>'

export interface SteelLook {
  // The dark ceiling, the soft panel in it, how wide the panel is, and how bright the horizon is that the chamfers show.
  ceiling?: number
  panel?: number
  wide?: number
  horizon?: number
  // How strongly the rows of lamps show in it.
  lamps?: number
  // How much of the lamps' own broad shine stays on it: a polished face shows the lamp, not a pale sheet.
  direct?: number
  // How much of the surround the lights give stays in it beside the room.
  keep?: number
}

// Lays the room over a material that has passed through studio() and has not yet passed through lit(). In a zone the lamps do not light, the material keeps the website's own studio.
export function steel<T extends THREE.MeshPhysicalMaterial>(m: T, z: Zone, o: SteelLook = {}): T {
  if (!LIT.includes(z.id)) return m
  const room = ROOM[z.id]!
  const before = m.onBeforeCompile
  const key = m.customProgramCacheKey
  const panel = new THREE.Vector4(o.ceiling ?? 0.03, o.panel ?? 0.3, o.wide ?? 0.1, o.horizon ?? 1.15)
  const row = new THREE.Vector4(ROW.step, ROW.away, ROW.high, ROW.strength * (o.lamps ?? 1))
  m.onBeforeCompile = (shader, renderer) => {
    before.call(m, shader, renderer)
    if (!shader.fragmentShader.includes(AT)) throw new Error('The light code of this three.js release is not the one the steel was written for')
    shader.uniforms.wjsLevel = zoneLight(z).uniforms.wjlEnv
    shader.uniforms.wjsLamp = { value: new THREE.Vector3(...room.lamp) }
    shader.uniforms.wjsFloor = { value: new THREE.Vector3(...room.floor) }
    shader.uniforms.wjsPanel = { value: panel }
    shader.uniforms.wjsRow = { value: row }
    shader.uniforms.wjsDirect = { value: o.direct ?? 0.35 }
    shader.uniforms.wjsKeep = { value: o.keep ?? 0 }
    shader.vertexShader = 'varying vec3 wjsAt;\n' + shader.vertexShader.replace('#include <project_vertex>', 'wjsAt = transformed;\n#include <project_vertex>')
    shader.fragmentShader = PARS + shader.fragmentShader.replace(AT, BODY + AT)
  }
  m.customProgramCacheKey = () => `${key.call(m)}|wjs6`
  return m
}

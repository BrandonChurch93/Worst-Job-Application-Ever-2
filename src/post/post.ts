import * as THREE from 'three'
import { fullscreen, Quad } from '../core/accumulator'
import { look } from './look'

// Runs once, after the samples are averaged: exposure, the tone curve, the grade, grain and dither.
export class Post {
  private quad = new Quad()
  private material: THREE.RawShaderMaterial

  constructor() {
    this.material = fullscreen(
      /* glsl */ `
uniform sampler2D tMean;
uniform float exposure;
uniform float knee;
uniform float saturation;
uniform float grain;
uniform int frame;
uniform int flat_;
uniform int encoded;

uint hash( uint x ) {
  x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
  return x;
}
float rnd( uvec3 p ) {
  return float( hash( p.x + hash( p.y + hash( p.z ) ) ) >> 8 ) * ( 1.0 / 16777216.0 );
}
vec3 shoulder( vec3 x ) {
  vec3 over = max( x - knee, 0.0 );
  return min( x, vec3( knee ) ) + ( 1.0 - knee ) * ( 1.0 - exp( - over / ( 1.0 - knee ) ) );
}
vec3 toSrgb( vec3 c ) {
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow( max( c, vec3( 0.0 ) ), vec3( 1.0 / 2.4 ) ) - 0.055;
  return mix( lo, hi, step( vec3( 0.0031308 ), c ) );
}
vec3 fromSrgb( vec3 c ) {
  vec3 lo = c / 12.92;
  vec3 hi = pow( ( max( c, vec3( 0.0 ) ) + 0.055 ) / 1.055, vec3( 2.4 ) );
  return mix( lo, hi, step( vec3( 0.04045 ), c ) );
}
void main() {
  vec3 c = texture( tMean, vUv ).rgb;
  if ( encoded == 1 ) c = fromSrgb( c );
  uvec2 px = uvec2( gl_FragCoord.xy );
  if ( flat_ == 1 ) {
    outColor = vec4( toSrgb( clamp( c, 0.0, 1.0 ) ), 1.0 );
    return;
  }
  c = max( c, vec3( 0.0 ) ) * exposure;
  c = shoulder( c );
  float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
  c = max( mix( vec3( l ), c, saturation ), vec3( 0.0 ) );
  vec3 d = toSrgb( c );
  float g = rnd( uvec3( px, uint( frame ) * 2U ) ) + rnd( uvec3( px, uint( frame ) * 2U + 1U ) ) - 1.0;
  d += g * grain * ( 0.35 + 0.65 * ( 1.0 - l ) );
  float t = rnd( uvec3( px, uint( frame ) + 7919U ) ) + rnd( uvec3( px, uint( frame ) + 104729U ) ) - 1.0;
  d += t / 255.0;
  outColor = vec4( clamp( d, 0.0, 1.0 ), 1.0 );
}`,
      {
        tMean: { value: null },
        exposure: { value: look.exposure },
        knee: { value: look.knee },
        saturation: { value: look.saturation },
        grain: { value: look.grain },
        frame: { value: 0 },
        flat_: { value: 0 },
        encoded: { value: 0 }
      }
    )
  }

  draw(renderer: THREE.WebGLRenderer, mean: THREE.Texture, frame: number, flat: boolean, encoded: boolean): void {
    const u = this.material.uniforms
    u.tMean!.value = mean
    u.frame!.value = frame
    u.flat_!.value = flat ? 1 : 0
    u.encoded!.value = encoded ? 1 : 0
    u.exposure!.value = look.exposure
    u.knee!.value = look.knee
    u.saturation!.value = look.saturation
    u.grain!.value = look.grain
    this.quad.draw(renderer, this.material, null)
  }
}

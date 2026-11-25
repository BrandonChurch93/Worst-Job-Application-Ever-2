import * as THREE from 'three'
import { fullscreen, Quad } from '../core/accumulator'
import { look } from './look'

const linearTarget = (): THREE.WebGLRenderTarget => {
  const t = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false })
  t.texture.colorSpace = THREE.NoColorSpace
  return t
}

// The glow: what is too bright for the picture, spread by the lens. Each ring is half the size of the one before,
// and the rings are counted from a fixed share of the picture's height, so the glow is the same at every format.
export function glowLevels(height: number, rings: number): { levels: number; first: number } {
  const shift = Math.round(Math.log2(Math.max(1, height) / 1080))
  const levels = Math.max(1, rings + shift)
  return { levels, first: levels - rings }
}

class Glow {
  private quad = new Quad()
  private down: THREE.WebGLRenderTarget[] = []
  private up: THREE.WebGLRenderTarget[] = []
  private bright = fullscreen(
    /* glsl */ `
uniform sampler2D tMean;
uniform float exposure;
uniform float threshold;
uniform float knee;
uniform float depth;
void main() {
  ivec2 size = textureSize( tMean, 0 );
  ivec2 base = ivec2( gl_FragCoord.xy ) * 2;
  vec3 sum = vec3( 0.0 );
  for ( int y = 0; y < 2; y ++ ) {
    for ( int x = 0; x < 2; x ++ ) {
      vec3 c = texelFetch( tMean, min( base + ivec2( x, y ), size - 1 ), 0 ).rgb;
      c = clamp( c, 0.0, 4096.0 ) * exposure;
      float l = max( c.r, max( c.g, c.b ) );
      float soft = clamp( l - threshold + knee, 0.0, 2.0 * knee );
      float over = max( soft * soft / ( 4.0 * knee + 0.00001 ), l - threshold );
      sum += c * pow( c / max( l, 0.0001 ), vec3( depth ) ) * ( over / max( l, 0.0001 ) );
    }
  }
  outColor = vec4( sum * 0.25, 1.0 );
}`,
    { tMean: { value: null }, exposure: { value: 1 }, threshold: { value: 1 }, knee: { value: 0.5 }, depth: { value: 0 } }
  )
  private half = fullscreen(
    /* glsl */ `
uniform sampler2D tFrom;
uniform vec2 texel;
void main() {
  vec3 c = texture( tFrom, vUv ).rgb * 4.0;
  c += texture( tFrom, vUv + texel * vec2( -1.0, -1.0 ) ).rgb;
  c += texture( tFrom, vUv + texel * vec2( 1.0, -1.0 ) ).rgb;
  c += texture( tFrom, vUv + texel * vec2( -1.0, 1.0 ) ).rgb;
  c += texture( tFrom, vUv + texel * vec2( 1.0, 1.0 ) ).rgb;
  outColor = vec4( c / 8.0, 1.0 );
}`,
    { tFrom: { value: null }, texel: { value: new THREE.Vector2() } }
  )
  private join = fullscreen(
    /* glsl */ `
uniform sampler2D tWide;
uniform sampler2D tHere;
uniform vec2 texel;
uniform float share;
uniform float wide;
void main() {
  vec3 c = texture( tWide, vUv ).rgb * 4.0;
  c += ( texture( tWide, vUv + texel * vec2( -1.0, 0.0 ) ).rgb + texture( tWide, vUv + texel * vec2( 1.0, 0.0 ) ).rgb + texture( tWide, vUv + texel * vec2( 0.0, -1.0 ) ).rgb + texture( tWide, vUv + texel * vec2( 0.0, 1.0 ) ).rgb ) * 2.0;
  c += texture( tWide, vUv + texel * vec2( -1.0, -1.0 ) ).rgb + texture( tWide, vUv + texel * vec2( 1.0, -1.0 ) ).rgb + texture( tWide, vUv + texel * vec2( -1.0, 1.0 ) ).rgb + texture( tWide, vUv + texel * vec2( 1.0, 1.0 ) ).rgb;
  outColor = vec4( c / 16.0 * wide + texture( tHere, vUv ).rgb * share, 1.0 );
}`,
    { tWide: { value: null }, tHere: { value: null }, texel: { value: new THREE.Vector2() }, share: { value: 1 }, wide: { value: 1 } }
  )

  // The spread light of this picture, or null when nothing in the settings asks for it.
  draw(renderer: THREE.WebGLRenderer, mean: THREE.Texture, width: number, height: number): THREE.Texture | null {
    const g = look.glow
    if (!(g.strength > 0) || g.rings.length === 0) return null
    const { levels, first } = glowLevels(height, g.rings.length)
    while (this.down.length < levels) {
      this.down.push(linearTarget())
      this.up.push(linearTarget())
    }
    const total = g.rings.reduce((a, b) => a + b, 0)
    const share = (i: number) => (i >= first ? g.rings[i - first]! / total : 0)
    for (let i = 0; i < levels; i++) {
      const w = Math.max(1, Math.round(width / 2 ** (i + 1)))
      const h = Math.max(1, Math.round(height / 2 ** (i + 1)))
      this.down[i]!.setSize(w, h)
      this.up[i]!.setSize(w, h)
    }
    const b = this.bright.uniforms
    b.tMean!.value = mean
    b.exposure!.value = look.exposure
    b.threshold!.value = g.threshold
    b.knee!.value = g.knee
    b.depth!.value = g.depth
    this.quad.draw(renderer, this.bright, this.down[0]!)
    for (let i = 1; i < levels; i++) {
      const from = this.down[i - 1]!
      this.half.uniforms.tFrom!.value = from.texture
      ;(this.half.uniforms.texel!.value as THREE.Vector2).set(1 / from.width, 1 / from.height)
      this.quad.draw(renderer, this.half, this.down[i]!)
    }
    let wide: THREE.WebGLRenderTarget | null = null
    for (let i = levels - 1; i >= 0; i--) {
      const u = this.join.uniforms
      const src: THREE.WebGLRenderTarget = wide ?? this.down[i]!
      u.tWide!.value = src.texture
      u.tHere!.value = this.down[i]!.texture
      ;(u.texel!.value as THREE.Vector2).set(1 / src.width, 1 / src.height)
      u.share!.value = share(i)
      u.wide!.value = wide ? 1 : 0
      this.quad.draw(renderer, this.join, this.up[i]!)
      wide = this.up[i]!
    }
    return wide!.texture
  }
}

// Runs once, after the samples are averaged: glow, exposure, the tone curve, the grade, grain and dither.
export class Post {
  private quad = new Quad()
  private glow = new Glow()
  private material: THREE.RawShaderMaterial

  constructor() {
    this.material = fullscreen(
      /* glsl */ `
uniform sampler2D tMean;
uniform sampler2D tGlow;
uniform float glow;
uniform float cover;
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
  if ( glow > 0.0 ) {
    vec3 g = texture( tGlow, vUv ).rgb * glow;
    float behind = 1.0 - smoothstep( 1.25, 2.5, max( c.r, max( c.g, c.b ) ) );
    c = c * ( 1.0 - cover * behind * min( 1.0, max( g.r, max( g.g, g.b ) ) ) ) + g;
  }
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
        tGlow: { value: null },
        glow: { value: 0 },
        cover: { value: 0 },
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
    const size = renderer.getDrawingBufferSize(new THREE.Vector2())
    const spread = flat || encoded ? null : this.glow.draw(renderer, mean, size.x, size.y)
    u.tGlow!.value = spread
    u.glow!.value = spread ? look.glow.strength : 0
    u.cover!.value = look.glow.cover
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

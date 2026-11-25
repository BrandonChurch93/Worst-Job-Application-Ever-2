import * as THREE from 'three'
import { look as picture } from '../../post/look'
import { studio } from '../../post/studio'
import { materials } from '../../shell/materials'
import { UNIT } from '../contract'
import { detailTexture } from './texture'

export const MAX_HOLES = 4

export interface BodyUniforms {
  // pale, heat, char, melt
  uState: { value: THREE.Vector4 }
  // crack, seam, the number of strips the seams are drawn for, time
  uMarks: { value: THREE.Vector4 }
  // The band the strips are cut across: its start and the width of one strip, in outline units.
  uCut: { value: THREE.Vector2 }
  // flat, and three spare numbers.
  uShape: { value: THREE.Vector4 }
  // x, y, radius, glow of each hole, in outline units.
  uHoles: { value: THREE.Vector4[] }
  // How burnt each hole is: 1 a charred burn, 0 a clean punched hole.
  uBurnt: { value: THREE.Vector4 }
  uDetail: { value: THREE.Texture }
}

export function bodyUniforms(): BodyUniforms {
  return {
    uState: { value: new THREE.Vector4() },
    uMarks: { value: new THREE.Vector4() },
    uCut: { value: new THREE.Vector2(-6.1, 1.4) },
    uShape: { value: new THREE.Vector4() },
    uHoles: { value: Array.from({ length: MAX_HOLES }, () => new THREE.Vector4()) },
    uBurnt: { value: new THREE.Vector4(1, 1, 1, 1) },
    uDetail: { value: detailTexture() }
  }
}

const HOLE_COMMON = /* glsl */ `
#ifndef WJA_HOLE_WIDE
#define WJA_HOLE_WIDE 1.0
#endif
uniform vec4 uHoles[${MAX_HOLES}];
uniform vec4 uBurnt;
float wjaRag( vec2 d, float burnt ) {
  float a = atan( d.y, d.x );
  return 1.0 + ( 0.25 + 0.3 * burnt ) * ( 0.06 * sin( 3.0 * a + 1.3 ) + 0.04 * sin( 7.0 * a + 0.4 ) + 0.03 * sin( 11.0 * a + 2.1 ) );
}
void wjaHoles( vec3 rest ) {
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 h = uHoles[ i ];
    if ( h.z <= 0.0 ) continue;
    vec2 d = rest.xy - h.xy;
    float k = clamp( rest.z / 2.3, 0.0, 1.0 );
    float r = WJA_HOLE_WIDE * h.z * wjaRag( d, uBurnt[ i ] ) * mix( 0.7 + 0.3 * k, 0.7 + 0.3 * pow( k, 1.6 ), uBurnt[ i ] );
    if ( dot( d, d ) < r * r ) discard;
  }
}
`

const VERTEX_HEAD = /* glsl */ `
attribute vec3 aRest;
attribute float aInk;
attribute float aInset;
varying vec3 vRest;
varying float vInk;
varying float vInset;
varying vec3 vAcross;
varying vec3 vDown;
`

const FRAGMENT_HEAD = /* glsl */ `
varying vec3 vRest;
varying float vInk;
varying float vInset;
varying vec3 vAcross;
varying vec3 vDown;
uniform vec4 uState;
uniform vec4 uMarks;
uniform vec2 uCut;
uniform vec4 uShape;
uniform sampler2D uDetail;
${HOLE_COMMON}
vec3 wjaGlow = vec3( 0.0 );
float wjaRough = 0.3;
float wjaFill = 0.0;
float wjaPlain = 0.0;
float wjaCoat = 1.0;
float wjaSpec = 1.0;
float wjaCoatRough = 0.05;
vec2 wjaTilt = vec2( 0.0 );
vec2 wjaCoatTilt = vec2( 0.0 );
vec2 wjaHash2( vec2 p ) {
  vec3 a = fract( p.xyx * vec3( 0.1031, 0.1030, 0.0973 ) );
  a += dot( a, a.yzx + 33.33 );
  return fract( ( a.xx + a.yz ) * a.zy );
}
vec3 wjaCells( vec2 x ) {
  vec2 n = floor( x );
  vec2 f = fract( x );
  vec2 mg = vec2( 0.0 );
  vec2 mr = vec2( 0.0 );
  float md = 8.0;
  for ( int j = -1; j <= 1; j ++ ) for ( int i = -1; i <= 1; i ++ ) {
    vec2 g = vec2( float( i ), float( j ) );
    vec2 r = g + wjaHash2( n + g ) - f;
    float d = dot( r, r );
    if ( d < md ) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for ( int j = -2; j <= 2; j ++ ) for ( int i = -2; i <= 2; i ++ ) {
    vec2 g = mg + vec2( float( i ), float( j ) );
    vec2 r = g + wjaHash2( n + g ) - f;
    vec2 between = r - mr;
    if ( dot( between, between ) > 0.00001 ) md = min( md, dot( 0.5 * ( mr + r ), normalize( between ) ) );
  }
  return vec3( md, wjaHash2( n + mg ) );
}
vec3 wjaSurface( vec3 enamel, vec3 edge ) {
  vec2 q = vRest.xy;
  float pale = uState.x;
  float heat = uState.y;
  float charred = uState.z;
  float melt = uState.w;
  float along = dot( q, vec2( 0.409, 0.912 ) );
  vec4 wide = texture2D( uDetail, q / 17.0 + vec2( 0.13, 0.41 ) );
  vec4 mid = texture2D( uDetail, q / 6.1 + vec2( 0.57, 0.22 ) );
  vec4 fine = texture2D( uDetail, q / 1.9 );
  float e = 0.012;
  vec2 grain = vec2(
    texture2D( uDetail, q / 1.9 + vec2( e, 0.0 ) ).g - texture2D( uDetail, q / 1.9 - vec2( e, 0.0 ) ).g,
    texture2D( uDetail, q / 1.9 + vec2( 0.0, e ) ).g - texture2D( uDetail, q / 1.9 - vec2( 0.0, e ) ).g );
  float bare = step( 1.5, vInk );
  float reach = clamp( 3.4 * fwidth( vInset ), 0.545, 0.92 );
  float ink = max( smoothstep( 0.3, 0.7, vInk ), 1.0 - smoothstep( reach - 0.03, reach + 0.03, vInset ) ) * ( 1.0 - bare ) * ( 1.0 - smoothstep( 0.0, 0.55, melt ) );
  float face = 1.0 - ink;
  vec3 col = mix( enamel, edge * 0.62, ink );
  wjaRough = mix( 0.3, 0.46, ink );
  wjaCoatRough = mix( 0.09, 0.26, ink );
  wjaCoat = mix( 1.0, 0.32, ink );
  wjaSpec = mix( 1.0, 0.3, ink );

  // A cut face: bare fired clay, with the dark of the edge band only at its foot.
  if ( bare > 0.5 ) {
    vec3 clay = vec3( 0.56, 0.52, 0.45 ) * ( 0.84 + 0.2 * fine.g + 0.12 * mid.b );
    col = mix( edge, clay, smoothstep( 0.3, 1.5, vRest.z ) );
    wjaGlow += col * 0.05;
    wjaRough = 0.92;
    wjaCoat = 0.0;
    wjaSpec = 0.3;
    wjaTilt += grain * 2.5;
  }

  // Crazing: a web of hairline cracks, and each plate between them tipped a hair its own way.
  float crack = uMarks.x * face;
  if ( crack > 0.0 ) {
    vec2 cq = q + ( mid.gb - 0.5 ) * 0.8 + ( wide.gb - 0.5 ) * 2.4;
    vec3 cell = wjaCells( cq / 4.2 + vec2( 0.37, 0.61 ) );
    vec3 twig = wjaCells( cq / 1.9 + vec2( 0.11, 0.83 ) );
    float thin = 0.002 + 0.002 * fine.g;
    float line = 1.0 - smoothstep( thin, thin + max( fwidth( cell.x ) * 1.2, 0.005 ), cell.x );
    float branch = ( 1.0 - smoothstep( thin * 2.0, thin * 2.0 + max( fwidth( twig.x ) * 1.2, 0.01 ), twig.x ) ) * step( 0.45, cell.z ) * ( 1.0 - smoothstep( 0.1, 0.34, cell.x ) );
    float plate = cell.y * 6.2832;
    float near = 1.0 - smoothstep( 0.0, 0.05, cell.x );
    wjaCoatTilt += crack * vec2( cos( plate ), sin( plate ) ) * 0.012;
    wjaTilt += wjaCoatTilt;
    vec2 across = vec2( dFdx( cell.x ), -dFdy( cell.x ) );
    vec2 toGap = -across / max( length( across ), 1e-6 );
    float lip = ( 1.0 - smoothstep( thin, thin + 0.016, cell.x ) ) * ( 1.0 - line );
    wjaTilt += crack * lip * toGap * 0.5;
    col = mix( col, vec3( 0.80, 0.75, 0.65 ), crack * lip * 0.1 * smoothstep( 0.0, 0.8, dot( toGap, vec2( 0.6, 0.8 ) ) ) );
    col *= 1.0 - crack * ( 0.3 * line + 0.12 * branch + 0.02 * near );
    col *= 1.0 - crack * 0.012 * ( cell.z - 0.5 );
    wjaCoat *= 1.0 - 0.8 * crack * line;
  }

  // The seams of a body put back together.
  if ( uMarks.y > 0.0 ) {
    float across = ( q.x * 0.912 - q.y * 0.409 - uCut.x ) / uCut.y;
    float from = abs( across - floor( across + 0.5 ) ) * uCut.y;
    float edgeOfCut = step( 0.5, across ) * step( across, uMarks.z - 0.5 );
    float seam = ( 1.0 - smoothstep( 0.015, 0.075, from ) ) * edgeOfCut * uMarks.y;
    col *= 1.0 - 0.7 * seam;
    wjaCoat *= 1.0 - 0.7 * seam;
  }

  // Pale: the gloss dies and the body turns to stone. The black edge stays, as a thin dark line round it.
  if ( pale > 0.0 ) {
    float pit = smoothstep( 0.68, 0.86, fine.b * 0.62 + mid.g * 0.5 );
    float bloom = smoothstep( 0.3, 0.75, wide.b * 0.6 + mid.b * 0.45 );
    vec3 stone = vec3( 0.73, 0.722, 0.7 ) * ( 0.8 + 0.16 * wide.g + 0.1 * mid.b + 0.08 * fine.g ) * ( 1.0 - 0.14 * pit ) * mix( vec3( 1.0 ), vec3( 1.05, 1.04, 1.0 ), bloom );
    float thin = clamp( 1.5 * fwidth( vInset ), 0.24, 0.5 );
    float line = ( 1.0 - smoothstep( thin - 0.12, thin + 0.12, vInset ) ) * ( 1.0 - bare );
    col = mix( col, mix( stone, edge * 1.5 + vec3( 0.03, 0.028, 0.025 ), line ), pale );
    wjaRough = mix( wjaRough, 0.96, pale );
    wjaCoat *= 1.0 - pale;
    wjaSpec *= 1.0 - 0.85 * pale;
    wjaTilt += grain * 0.5 * pale;
  }

  // Char: a black crust of glossy lumps that crumbles at its edge and grows back from the tip, with a narrow amber fringe.
  if ( charred > 0.0 ) {
    float front = charred * 7.4;
    float ragged = along + ( wide.g - 0.5 ) * 2.0 + ( mid.b - 0.5 ) * 1.8 + ( fine.g - 0.5 ) * 1.1;
    float crust = smoothstep( front + 0.12, front - 0.2, ragged );
    float near = along + ( wide.g - 0.5 ) * 2.0 + ( mid.b - 0.5 ) * 1.2;
    float soot = smoothstep( front + 1.25, front + 0.05, near ) * smoothstep( 0.0, 0.12, charred );
    vec3 scorch = mix( vec3( 0.85, 0.48, 0.16 ), vec3( 0.14, 0.05, 0.012 ), soot * soot );
    col = mix( col, col * scorch, pow( soot, 0.7 ) * ( 1.0 - crust ) * mix( 1.0, 0.55, ink ) );
    wjaSpec *= 1.0 - 0.7 * soot;
    float lump = smoothstep( 0.38, 0.78, mid.g * 0.6 + fine.b * 0.5 );
    float glint = smoothstep( 0.74, 0.9, fine.g * 0.62 + mid.b * 0.5 );
    col = mix( col, vec3( 0.008, 0.0075, 0.007 ) + 0.03 * lump * fine.g, crust );
    wjaRough = mix( wjaRough, mix( 0.9, 0.26, lump ), crust );
    wjaCoat *= 1.0 - max( crust, soot * 0.7 );
    wjaSpec = mix( wjaSpec, 0.4 + 1.1 * lump, crust );
    wjaTilt += grain * 12.0 * crust;
    wjaGlow += vec3( 0.2, 0.195, 0.185 ) * glint * crust;
    float coal = crust * smoothstep( front - 1.3, front - 0.2, ragged ) * smoothstep( 0.66, 0.8, fine.b * 0.55 + mid.g * 0.6 );
    wjaGlow += vec3( 1.3, 0.42, 0.05 ) * coal * 1.2;
  }

  // Heat: the enamel glows from inside, deep red at the tip, through orange to a pale warm white where it dies out.
  if ( heat > 0.0 ) {
    float on = smoothstep( 0.05, 0.3, heat );
    float front = 4.6 + 4.2 * heat;
    float h = smoothstep( front + 2.4, front - 5.6, along + ( wide.g - 0.5 ) * 1.3 + ( mid.b - 0.5 ) * 0.5 ) * on;
    vec3 ember = mix( vec3( 1.3, 0.8, 0.35 ), vec3( 1.25, 0.3, 0.02 ), smoothstep( 0.05, 0.36, h ) );
    ember = mix( ember, vec3( 0.9, 0.015, 0.003 ), smoothstep( 0.4, 0.68, h ) );
    ember = mix( ember, vec3( 0.16, 0.003, 0.001 ), smoothstep( 0.78, 1.0, h ) );
    float warm = smoothstep( 0.0, 0.25, h ) * face;
    float body = smoothstep( 0.03, 0.36, h ) * face;
    col = mix( col, col * vec3( 1.0, 0.8, 0.5 ), warm * 0.8 );
    col = mix( col, ember * 0.12, body );
    float vein = smoothstep( 0.7, 0.82, fine.b * 0.8 + mid.g * 0.4 ) * smoothstep( 0.15, 0.4, h ) * ( 1.0 - smoothstep( 0.8, 1.0, h ) );
    wjaGlow += ember * body * ( 0.95 + 0.3 * mid.g );
    wjaGlow += vec3( 1.5, 0.95, 0.3 ) * vein * face * 1.2;
    wjaGlow += ember * h * ink * 0.1;
    wjaCoat *= 1.0 - 0.88 * body;
    wjaSpec *= 1.0 - 0.8 * body;
  }

  // Melt: the enamel runs over its own edge, wet and a little warmer.
  if ( melt > 0.0 ) {
    col = mix( col, col * vec3( 1.0, 0.95, 0.83 ), melt );
    float side = q.x * 0.912 - q.y * 0.409;
    float vein = sin( side * 1.05 + 1.5 * sin( along * 0.42 + 1.0 ) + 0.7 * sin( along * 1.05 + side * 0.7 ) + 0.9 );
    float blot = 0.5 + 0.5 * sin( along * 0.55 + side * 0.3 + 2.2 );
    float streak = smoothstep( 0.05, 0.85, vein ) * smoothstep( 0.25, 1.0, vInset ) * ( 0.55 + 0.45 * blot );
    col = mix( col, col * vec3( 0.36, 0.31, 0.25 ), streak * melt * 0.8 );
    wjaRough = mix( wjaRough, 0.14, melt );
    wjaCoatRough = mix( wjaCoatRough, 0.04, melt );
  }

  // Holes: a burn has a tight crust, a brown fall-off and a broken line of hot specks on its lip; a punched one has a lip broken inward and chips of bare clay.
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 hole = uHoles[ i ];
    if ( hole.z <= 0.0 ) continue;
    float burnt = uBurnt[ i ];
    vec2 d = q - hole.xy;
    vec2 dn = d / max( length( d ), 1e-4 );
    float r = hole.z * wjaRag( d, burnt );
    float rr = length( d ) / r;
    float far = dot( dn, vec2( 0.73, 0.68 ) );
    float from = rr + ( mid.g - 0.5 ) * 0.16 + ( fine.b - 0.5 ) * 0.14;
    float soot = ( 1.0 - smoothstep( 1.02, 1.7, from ) ) * burnt;
    float tiny = smoothstep( 0.035, 0.085, fwidth( rr ) );
    float crust = ( 1.0 - smoothstep( 1.05 + 0.2 * tiny, 1.2 + 0.36 * tiny, from + ( wide.b - 0.5 ) * 0.3 + ( fine.g - 0.5 ) * 0.22 ) ) * burnt;
    col = mix( col, col * vec3( 0.6, 0.36, 0.16 ), min( 1.0, soot * soot * 1.5 ) );
    col = mix( col, vec3( 0.014, 0.012, 0.010 ) + 0.03 * fine.g * mid.b, crust );
    float turn = atan( d.y, d.x ) + float( i ) * 1.7;
    float bite = sin( turn + 0.6 ) * sin( turn * 3.0 + 1.9 ) + 0.3 * sin( turn * 7.0 + 0.4 ) + ( mid.g - 0.5 ) * 1.3;
    float chipAt = rr - 0.2 * smoothstep( 0.3, 1.0, bite ) - 0.03 - ( fine.b - 0.5 ) * 0.07;
    float clean = 1.0 - burnt;
    float chip = ( 1.0 - smoothstep( 1.0, 1.03, chipAt ) ) * clean;
    float step_ = smoothstep( 0.93, 1.0, chipAt ) * chip;
    float brink = smoothstep( 1.0, 1.03, chipAt ) * ( 1.0 - smoothstep( 1.03, 1.1, chipAt ) ) * clean;
    vec3 clay = vec3( 0.93, 0.87, 0.74 ) * ( 0.7 + 0.34 * fine.b * mid.g + 0.2 * fine.g );
    col = mix( col, clay * mix( 0.6, 1.0, smoothstep( -0.7, 0.7, far ) ), chip );
    col *= 1.0 - 0.55 * step_ * smoothstep( 0.2, -0.6, far );
    col *= 1.0 - 0.1 * brink * smoothstep( 0.0, -0.8, far );
    wjaGlow += vec3( 0.07, 0.068, 0.062 ) * brink * smoothstep( 0.0, 0.8, far );
    float roll = ( 1.0 - smoothstep( 1.0, 1.16, rr ) ) * ( 1.0 - chip );
    wjaTilt -= dn * roll * mix( 0.55, 0.2, burnt );
    wjaCoatTilt -= dn * roll * 0.55 * clean;
    float dull = max( max( crust, soot * 0.5 ), chip );
    wjaRough = mix( wjaRough, 0.95, dull );
    wjaCoat *= 1.0 - max( max( crust, soot * 0.7 ), chip );
    wjaSpec *= 1.0 - 0.8 * chip;
    wjaTilt += grain * ( 5.0 * crust + 3.0 * chip );
    float lip = ( 1.0 - smoothstep( 1.0, 1.1, from ) ) * pow( hole.w, 0.5 ) * burnt;
    float spark = smoothstep( 0.6, 0.7, fine.b * 0.5 + mid.g * 0.7 + 0.12 * hole.w );
    float fleck = smoothstep( 0.68, 0.76, fine.g * 0.6 + mid.b * 0.6 ) * ( 1.0 - smoothstep( 1.06, 1.24, from ) ) * hole.w * burnt;
    wjaGlow += vec3( 1.0, 0.36, 0.04 ) * 0.05 * hole.w * burnt * ( 1.0 - smoothstep( 1.1, 1.7, from ) ) * ( 1.0 - crust );
    wjaGlow += mix( vec3( 1.0, 0.13, 0.015 ), vec3( 1.5, 0.78, 0.16 ), fine.g * ( 0.4 + 0.6 * hole.w ) ) * ( lip * spark * 4.2 + fleck * 1.4 ) * ( 1.0 - 0.85 * tiny );
  }
  wjaFill = 0.9 * mix( face, 0.3, pale );
  wjaPlain = face;
  return col;
}
`

let latest: BodyUniforms | null = null
let enamelColour: THREE.Color | null = null
let edgeColour: THREE.Color | null = null

// The body's one material: the shared enamel and the shared edge, mixed by where on the body a point is, and every state the surface can be in.
export function bodyMaterial(uniforms: BodyUniforms): THREE.MeshPhysicalMaterial {
  latest = uniforms
  const shared = materials()
  enamelColour ??= shared.enamel.color.clone()
  edgeColour ??= shared.edge.color.clone()
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: shared.enamel.envMapIntensity }))
  const law = m.onBeforeCompile
  const enamel = enamelColour
  const edge = edgeColour
  m.onBeforeCompile = (shader, renderer) => {
    law.call(m, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.uniforms.uEnamel = { value: enamel }
    shader.uniforms.uEdge = { value: edge }
    shader.vertexShader = VERTEX_HEAD + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvRest = aRest;\nvInk = aInk;\nvInset = aInset;\nvAcross = normalize( normalMatrix * vec3( 1.0, 0.0, 0.0 ) );\nvDown = normalize( normalMatrix * vec3( 0.0, -1.0, 0.0 ) );'
    )
    shader.fragmentShader = ('uniform vec3 uEnamel;\nuniform vec3 uEdge;\n' + FRAGMENT_HEAD + shader.fragmentShader)
      .replace('#include <color_fragment>', '#include <color_fragment>\nwjaHoles( vRest );\ndiffuseColor.rgb = wjaSurface( uEnamel, uEdge );')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = wjaRough;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize( normal + vAcross * wjaTilt.x + vDown * wjaTilt.y );')
      .replace('#include <clearcoat_normal_fragment_maps>', '#include <clearcoat_normal_fragment_maps>\nclearcoatNormal = normalize( clearcoatNormal + vAcross * wjaCoatTilt.x + vDown * wjaCoatTilt.y );')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.clearcoat = saturate( wjaCoat );\nmaterial.specularColor *= wjaSpec;\nmaterial.specularF90 *= wjaSpec;\nmaterial.clearcoatRoughness = max( wjaCoatRough, 0.0525 );\n' + FILL_TERM + '')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += wjaGlow;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nvec3 wjaTone = max( diffuseColor.rgb, vec3( 1e-4 ) );\nreflectedLight.directDiffuse = mix( reflectedLight.directDiffuse, wjaTone * vec3( 1.0, 0.975, 0.945 ) * dot( reflectedLight.directDiffuse / wjaTone, vec3( 0.25, 0.6, 0.15 ) ), 0.85 * wjaPlain );')
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-body'
  return m
}

// The shadow's own material: it lets light through the holes. The light that comes down a bore is let fall on the page under the bore,
// most of the way back along the light's own slant, so that what is seen through a hole is the page lit and not a disc of shade.
const BORE_SHARE = 0.5
const KEY = new THREE.Vector3(...picture.key.direction).normalize()
// A face tilted away from the lamp gets back this share of the lamp's light it lost by tilting, and a face tilted toward it gets nothing.
const FILL = (picture.key.intensity / Math.PI) * 0.8
const FILL_TERM = `totalEmissiveRadiance += diffuseColor.rgb * wjaFill * ${FILL.toFixed(4)} * max( ${KEY.z.toFixed(4)} - max( dot( normal, normalize( ( viewMatrix * vec4( ${KEY.x.toFixed(4)}, ${KEY.y.toFixed(4)}, ${KEY.z.toFixed(4)}, 0.0 ) ).xyz ) ), 0.0 ), 0.0 );`
export function bodyDepthMaterial(uniforms: BodyUniforms): THREE.MeshDepthMaterial {
  const m = new THREE.MeshDepthMaterial()
  const low = picture.shadowHeights
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uHoles = uniforms.uHoles
    shader.uniforms.uBurnt = uniforms.uBurnt
    shader.vertexShader =
      'attribute vec3 aRest;\nvarying vec3 vRest;\nvarying vec2 vShift;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vRest = aRest;
vec4 wjaAt = modelMatrix * vec4( transformed, 1.0 );
float wjaHigh = min( wjaAt.z, ${low.knee.toFixed(2)} ) + max( wjaAt.z - ${low.knee.toFixed(2)}, 0.0 ) * ${low.keep.toFixed(4)};
vec3 wjaLamp = vec3( viewMatrix[ 0 ][ 2 ], viewMatrix[ 1 ][ 2 ], viewMatrix[ 2 ][ 2 ] );
vec3 wjaOff = transpose( mat3( modelMatrix ) ) * vec3( wjaLamp.xy / max( wjaLamp.z, 0.05 ) * wjaHigh, 0.0 ) / dot( modelMatrix[ 0 ].xyz, modelMatrix[ 0 ].xyz );
vShift = vec2( wjaOff.x, - wjaOff.y ) * ${(BORE_SHARE / UNIT).toFixed(5)};`
      )
    shader.fragmentShader = '#define WJA_HOLE_WIDE 1.0\nvarying vec3 vRest;\nvarying vec2 vShift;\n' + HOLE_COMMON + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nwjaHoles( vec3( vRest.xy - vShift, 2.3 ) );')
  }
  m.customProgramCacheKey = () => 'wja-cursor-body-depth'
  return m
}

// The wall of a hole. A burnt one is ash with hot specks, its glow carried in the colour of each point. A punched one is bare crumbling clay:
// the side that faces the lamp is lit as far down as the light comes across the bore, the side under the lamp is in its own shade.
export function charMaterial(): THREE.MeshStandardMaterial {
  const u = latest ?? bodyUniforms()
  const m = studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.02, 0.017, 0.015), roughness: 0.95, metalness: 0, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.3 }))
  const law = m.onBeforeCompile
  const key = new THREE.Vector3(...picture.key.direction).normalize()
  m.onBeforeCompile = (shader, renderer) => {
    law.call(m, shader, renderer)
    shader.uniforms.uHoles = u.uHoles
    shader.uniforms.uBurnt = u.uBurnt
    shader.uniforms.uDetail = u.uDetail
    shader.uniforms.uKey = { value: key }
    shader.vertexShader = ('varying vec3 vObj;\n' + shader.vertexShader).replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;')
    shader.fragmentShader = (`varying vec3 vObj;\nuniform vec4 uHoles[${MAX_HOLES}];\nuniform vec4 uBurnt;\nuniform sampler2D uDetail;\nuniform vec3 uKey;\n` + shader.fragmentShader)
      .replace('#include <color_fragment>', '')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
#ifdef USE_COLOR
{
  vec2 wjaQ = vec2( vObj.x, - vObj.y ) / ${UNIT.toFixed(5)};
  float wjaBurnt = 1.0;
  float wjaBest = 1e9;
  float wjaR = 1.0;
  vec2 wjaD = vec2( 1.0, 0.0 );
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 h = uHoles[ i ];
    if ( h.z <= 0.0 ) continue;
    vec2 d = wjaQ - h.xy;
    float l = dot( d, d );
    if ( l < wjaBest ) { wjaBest = l; wjaBurnt = uBurnt[ i ]; wjaR = h.z; wjaD = d; }
  }
  float wjaDeep = 1.0 - clamp( vObj.z / ${(2.3 * UNIT).toFixed(4)}, 0.0, 1.0 );
  vec3 wjaN = inverseTransformDirection( normal, viewMatrix );
  vec2 wjaIn = wjaN.xy / max( length( wjaN.xy ), 1e-4 );
  float wjaFace = dot( wjaIn, normalize( uKey.xy ) );
  float wjaDown = 2.0 * wjaR * max( wjaFace, 0.0 ) * uKey.z / length( uKey.xy );
  float wjaTurn = atan( wjaD.y, wjaD.x );
  vec2 wjaUv = vec2( wjaTurn * wjaR * 0.42, wjaDeep * 0.8 );
  vec4 wjaFine = texture2D( uDetail, wjaUv * 0.9 + vec2( 0.21, 0.63 ) );
  vec4 wjaMid = texture2D( uDetail, wjaUv * 0.27 + vec2( 0.71, 0.13 ) );
  float wjaCrumb = 0.62 + 0.5 * wjaFine.g * ( 0.6 + 0.8 * wjaMid.b );
  float wjaPit = smoothstep( 0.56, 0.7, wjaFine.b * 0.6 + wjaMid.g * 0.5 );
  float wjaSun = max( wjaFace, 0.0 ) * ( 1.0 - smoothstep( 0.5 * wjaDown, 1.1 * wjaDown + 0.12, wjaDeep * 2.3 ) );
  float wjaSky = ( 0.4 + 0.2 * dot( wjaIn, vec2( 0.85, -0.3 ) ) ) * ( 1.0 - 0.55 * wjaDeep ) * ( 0.75 + 0.25 * smoothstep( 0.0, 0.12, wjaDeep ) );
  vec3 wjaClay = vec3( 0.82, 0.69, 0.52 ) * wjaCrumb * ( 1.0 - 0.5 * wjaPit ) * ( wjaSky + 0.7 * wjaSun );
  float wjaHot = max( vColor.r - 1.25 * vColor.b, 0.0 ) / 0.9375;
  vec3 wjaAsh = vec3( 1.14, 1.08, 1.0 ) * max( vColor.b - 0.05 * wjaHot, 0.0 ) * ( 0.35 + 0.75 * wjaFine.g ) * ( 1.0 - 0.6 * wjaDeep * step( wjaFace, 0.0 ) );
  float wjaSpeck = smoothstep( 0.56, 0.68, wjaFine.b * 0.55 + wjaMid.g * 0.6 );
  vec3 wjaEmber = ( 1.0 - exp( - 0.8 * wjaHot ) ) * vec3( 1.0, 0.4, 0.05 ) * wjaSpeck * 1.8;
  totalEmissiveRadiance += mix( wjaClay, wjaAsh * vec3( 0.26, 0.22, 0.18 ) + wjaEmber, wjaBurnt );
}
#endif`
      )
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-char'
  return m
}

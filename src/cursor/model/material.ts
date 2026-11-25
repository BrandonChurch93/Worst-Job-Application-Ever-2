import * as THREE from 'three'
import { studio } from '../../post/studio'
import { materials } from '../../shell/materials'
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
    vec3 cell = wjaCells( q / 11.0 + vec2( 0.37, 0.61 ) + ( mid.gb - 0.5 ) * 0.16 + ( wide.gb - 0.5 ) * 0.3 );
    float thin = 0.0007 + 0.0008 * fine.g;
    float line = 1.0 - smoothstep( thin, thin + max( fwidth( cell.x ) * 1.2, 0.002 ), cell.x );
    float plate = cell.y * 6.2832;
    float near = 1.0 - smoothstep( 0.0, 0.02, cell.x );
    wjaCoatTilt += crack * vec2( cos( plate ), sin( plate ) ) * 0.012;
    wjaTilt += wjaCoatTilt;
    vec2 across = vec2( dFdx( cell.x ), -dFdy( cell.x ) );
    vec2 toGap = -across / max( length( across ), 1e-6 );
    float lip = ( 1.0 - smoothstep( thin, thin + 0.006, cell.x ) ) * ( 1.0 - line );
    wjaTilt += crack * lip * toGap * 0.5;
    col = mix( col, vec3( 0.80, 0.75, 0.65 ), crack * lip * 0.1 * smoothstep( 0.0, 0.8, dot( toGap, vec2( 0.6, 0.8 ) ) ) );
    col *= 1.0 - crack * ( 0.3 * line + 0.02 * near );
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
    float speck = smoothstep( 0.62, 0.78, texture2D( uDetail, q / 0.83 + vec2( 0.31, 0.77 ) ).b );
    vec3 stone = vec3( 0.7, 0.695, 0.675 ) * ( 0.88 + 0.12 * wide.g + 0.08 * mid.b + 0.06 * fine.g ) * ( 1.0 - 0.16 * speck );
    float thin = clamp( 1.5 * fwidth( vInset ), 0.24, 0.5 );
    float line = ( 1.0 - smoothstep( thin - 0.12, thin + 0.12, vInset ) ) * ( 1.0 - bare );
    col = mix( col, mix( stone, edge * 1.5 + vec3( 0.03, 0.028, 0.025 ), line ), pale );
    wjaRough = mix( wjaRough, 0.96, pale );
    wjaCoat *= 1.0 - pale;
    wjaSpec *= 1.0 - 0.85 * pale;
    wjaTilt += grain * 0.22 * pale;
  }

  // Char: a black blistered crust that grows back from the tip, with a scorched brown fringe.
  if ( charred > 0.0 ) {
    float front = charred * 7.4;
    float ragged = along + ( wide.g - 0.5 ) * 2.0 + ( mid.b - 0.5 ) * 1.6 + ( fine.g - 0.5 ) * 0.6;
    float crust = smoothstep( front + 0.2, front - 0.3, ragged );
    float soot = smoothstep( front + 1.3, front - 0.1, ragged ) * smoothstep( 0.0, 0.12, charred );
    vec3 scorch = mix( vec3( 0.80, 0.52, 0.24 ), vec3( 0.36, 0.17, 0.06 ), soot );
    col = mix( col, col * scorch, pow( soot, 1.5 ) * ( 1.0 - crust ) * mix( 1.0, 0.55, ink ) );
    float blister = smoothstep( 0.5, 0.82, fine.b * 0.7 + mid.g * 0.5 );
    col = mix( col, vec3( 0.011, 0.010, 0.009 ) + 0.035 * fine.g * mid.b + 0.02 * blister, crust );
    wjaRough = mix( wjaRough, mix( 0.97, 0.42, blister ), crust );
    wjaCoat *= 1.0 - max( crust, soot * 0.6 );
    wjaSpec = mix( wjaSpec, 0.5 + 0.8 * blister, crust );
    wjaTilt += grain * 7.0 * crust;
    float coal = crust * smoothstep( front - 1.3, front - 0.2, ragged ) * smoothstep( 0.6, 0.76, fine.b * 0.55 + mid.g * 0.6 );
    wjaGlow += vec3( 1.3, 0.42, 0.05 ) * coal * 1.6;
  }

  // Heat: a glow inside the enamel that climbs from the tip.
  if ( heat > 0.0 ) {
    float front = heat * 8.8;
    float h = smoothstep( front + 0.7, front - 4.0, along + ( wide.g - 0.5 ) * 2.4 + ( mid.b - 0.5 ) * 1.2 ) * smoothstep( 0.3, 0.6, heat );
    vec3 ember = mix( vec3( 1.1, 0.7, 0.3 ), vec3( 1.25, 0.56, 0.06 ), smoothstep( 0.04, 0.2, h ) );
    ember = mix( ember, vec3( 1.2, 0.3, 0.02 ), smoothstep( 0.2, 0.42, h ) );
    ember = mix( ember, vec3( 0.86, 0.04, 0.012 ), smoothstep( 0.42, 0.8, h ) );
    float streak = 0.82 + 0.36 * mid.g * fine.b * 2.0;
    float body = smoothstep( 0.0, 0.2, h ) * face;
    col = mix( col, ember * 0.1, body );
    wjaGlow += ember * body * 0.72 * streak;
    wjaGlow += ember * h * ink * 0.1;
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

  // Holes: a burn has soot round it and a lip that glows and cools; a punched one has a broken rim of bare clay.
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 hole = uHoles[ i ];
    if ( hole.z <= 0.0 ) continue;
    float burnt = uBurnt[ i ];
    vec2 d = q - hole.xy;
    float r = hole.z * wjaRag( d, burnt );
    float from = length( d ) / r + ( mid.g - 0.5 ) * 0.16 + ( fine.b - 0.5 ) * 0.14;
    float soot = ( 1.0 - smoothstep( 1.12, 2.3, from ) ) * burnt;
    float crust = ( 1.0 - smoothstep( 1.16, 1.4, from + ( wide.b - 0.5 ) * 0.25 + ( fine.g - 0.5 ) * 0.2 ) ) * burnt;
    col = mix( col, col * vec3( 0.2, 0.13, 0.08 ), min( 1.0, soot * soot * 1.15 ) );
    col = mix( col, vec3( 0.014, 0.012, 0.010 ) + 0.03 * fine.g * mid.b, crust );
    float turn = atan( d.y, d.x ) + float( i ) * 1.7;
    float bite = sin( turn + 0.6 ) * sin( turn * 3.0 + 1.9 ) + 0.3 * sin( turn * 7.0 + 0.4 );
    float chipAt = length( d ) / r + ( mid.b - 0.5 ) * 0.1 - 0.15 * smoothstep( 0.4, 1.0, bite );
    float chip = ( 1.0 - smoothstep( 1.03, 1.06, chipAt ) ) * ( 1.0 - burnt );
    float nick = smoothstep( 1.0, 1.06, chipAt ) * ( 1.0 - smoothstep( 1.06, 1.16, chipAt ) ) * ( 1.0 - burnt );
    float lipSide = 0.5 + 0.5 * dot( normalize( d ), vec2( 0.5, 0.86 ) );
    vec3 clay = vec3( 0.8, 0.73, 0.6 ) * ( 0.6 + 0.5 * fine.b * mid.g + 0.16 * fine.g );
    col = mix( col, clay * mix( 0.62, 1.05, lipSide ), chip );
    col *= 1.0 - 0.16 * nick * ( 1.0 - lipSide );
    wjaGlow += vec3( 0.05 ) * nick * lipSide;
    float dull = max( max( crust, soot * 0.5 ), chip );
    wjaRough = mix( wjaRough, 0.95, dull );
    wjaCoat *= 1.0 - max( max( crust, soot * 0.7 ), chip );
    wjaSpec *= 1.0 - 0.8 * chip;
    wjaTilt += grain * ( 4.0 * crust + 2.0 * chip );
    float lip = ( 1.0 - smoothstep( 1.0, 1.26, from ) ) * pow( hole.w, 0.5 ) * burnt;
    wjaGlow += vec3( 1.0, 0.36, 0.04 ) * 0.22 * hole.w * burnt * ( 1.0 - smoothstep( 1.1, 2.1, from ) ) * ( 1.0 - crust );
    float spark = smoothstep( 0.46, 0.66, fine.b * 0.5 + mid.g * 0.7 - 0.2 * ( 1.0 - hole.w ) );
    float lee = 0.4 + 0.6 * smoothstep( -0.6, 0.9, dot( normalize( d ), vec2( -0.5, 0.86 ) ) );
    wjaGlow += mix( vec3( 1.0, 0.13, 0.015 ), vec3( 1.45, 0.72, 0.14 ), fine.g * ( 0.4 + 0.6 * hole.w ) ) * lip * lee * ( 0.8 + 3.6 * spark );
  }
  wjaFill = 0.9 * mix( face, 0.3, pale );
  return col;
}
`

let enamelColour: THREE.Color | null = null
let edgeColour: THREE.Color | null = null

// The body's one material: the shared enamel and the shared edge, mixed by where on the body a point is, and every state the surface can be in.
export function bodyMaterial(uniforms: BodyUniforms): THREE.MeshPhysicalMaterial {
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
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.clearcoat = saturate( wjaCoat );\nmaterial.specularColor *= wjaSpec;\nmaterial.specularF90 *= wjaSpec;\nmaterial.clearcoatRoughness = max( wjaCoatRough, 0.0525 );\ntotalEmissiveRadiance += diffuseColor.rgb * wjaFill * ( 1.0 - dot( normal, normalize( ( viewMatrix * vec4( 0.0, 0.0, 1.0, 0.0 ) ).xyz ) ) );')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += wjaGlow;')
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-body'
  return m
}

// The shadow's own material: it lets light through the holes.
export function bodyDepthMaterial(uniforms: BodyUniforms): THREE.MeshDepthMaterial {
  const m = new THREE.MeshDepthMaterial()
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uHoles = uniforms.uHoles
    shader.uniforms.uBurnt = uniforms.uBurnt
    shader.vertexShader = 'attribute vec3 aRest;\nvarying vec3 vRest;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = aRest;')
    shader.fragmentShader = '#define WJA_HOLE_WIDE 1.6\nvarying vec3 vRest;\n' + HOLE_COMMON + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nwjaHoles( vec3( vRest.xy, 2.3 ) );')
  }
  m.customProgramCacheKey = () => 'wja-cursor-body-depth'
  return m
}

// The wall of a burn hole: char, with its glow carried in the colour of each point.
export function charMaterial(): THREE.MeshStandardMaterial {
  const m = studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.02, 0.017, 0.015), roughness: 0.95, metalness: 0, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.3 }))
  const law = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    law.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <color_fragment>', '')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance += vColor.rgb;\n#endif')
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-char'
  return m
}

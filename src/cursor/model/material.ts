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
  // x, y, radius, glow of each hole, in outline units.
  uHoles: { value: THREE.Vector4[] }
  uDetail: { value: THREE.Texture }
}

export function bodyUniforms(): BodyUniforms {
  return {
    uState: { value: new THREE.Vector4() },
    uMarks: { value: new THREE.Vector4() },
    uCut: { value: new THREE.Vector2(-6.1, 1.4) },
    uHoles: { value: Array.from({ length: MAX_HOLES }, () => new THREE.Vector4()) },
    uDetail: { value: detailTexture() }
  }
}

const HOLE_COMMON = /* glsl */ `
uniform vec4 uHoles[${MAX_HOLES}];
float wjaRag( vec2 d ) {
  float a = atan( d.y, d.x );
  return 1.0 + 0.06 * sin( 3.0 * a + 1.3 ) + 0.04 * sin( 7.0 * a + 0.4 ) + 0.03 * sin( 11.0 * a + 2.1 );
}
void wjaHoles( vec3 rest ) {
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 h = uHoles[ i ];
    if ( h.z <= 0.0 ) continue;
    vec2 d = rest.xy - h.xy;
    float r = h.z * wjaRag( d ) * ( 0.74 + 0.26 * clamp( rest.z / 2.3, 0.0, 1.0 ) );
    if ( dot( d, d ) < r * r ) discard;
  }
}
`

const VERTEX_HEAD = /* glsl */ `
attribute vec3 aRest;
attribute float aInk;
varying vec3 vRest;
varying float vInk;
varying vec3 vAcross;
varying vec3 vDown;
`

const FRAGMENT_HEAD = /* glsl */ `
varying vec3 vRest;
varying float vInk;
varying vec3 vAcross;
varying vec3 vDown;
uniform vec4 uState;
uniform vec4 uMarks;
uniform vec2 uCut;
uniform sampler2D uDetail;
${HOLE_COMMON}
vec3 wjaGlow = vec3( 0.0 );
float wjaRough = 0.3;
float wjaCoat = 1.0;
float wjaSpec = 1.0;
float wjaCoatRough = 0.05;
vec2 wjaTilt = vec2( 0.0 );
vec2 wjaCoatTilt = vec2( 0.0 );
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
  float ink = smoothstep( 0.3, 0.7, vInk ) * ( 1.0 - smoothstep( 0.0, 0.55, melt ) );
  float face = 1.0 - ink;
  vec3 col = mix( enamel, edge, ink );
  wjaRough = mix( 0.3, 0.55, ink );
  wjaCoatRough = mix( 0.05, 0.3, ink );
  wjaCoat = mix( 1.0, 0.45, ink );
  wjaSpec = mix( 1.0, 0.35, ink );

  // Crazing: a web of hairline cracks, and each plate between them tipped a hair its own way.
  float crack = uMarks.x * face;
  if ( crack > 0.0 ) {
    vec2 cq = q / 62.0 + vec2( 0.21, 0.37 ) + ( wide.gb - 0.5 ) * 0.012;
    float c0 = texture2D( uDetail, cq ).r;
    float line = 1.0 - smoothstep( 0.012, 0.045, c0 );
    float plate = texture2D( uDetail, cq ).a * 6.2832;
    float cx = texture2D( uDetail, cq + vec2( 0.004, 0.0 ) ).r - texture2D( uDetail, cq - vec2( 0.004, 0.0 ) ).r;
    float cy = texture2D( uDetail, cq + vec2( 0.0, 0.004 ) ).r - texture2D( uDetail, cq - vec2( 0.0, 0.004 ) ).r;
    float near = 1.0 - smoothstep( 0.0, 0.2, c0 );
    wjaCoatTilt += crack * ( vec2( cos( plate ), sin( plate ) ) * 0.035 - vec2( cx, cy ) * near * 0.7 );
    wjaTilt += wjaCoatTilt;
    col *= 1.0 - 0.6 * crack * line;
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

  // Pale: the gloss dies and the body turns to stone, the black edge to grey.
  if ( pale > 0.0 ) {
    float speck = smoothstep( 0.62, 0.78, texture2D( uDetail, q / 0.83 + vec2( 0.31, 0.77 ) ).b );
    vec3 stone = vec3( 0.70, 0.69, 0.655 ) * ( 0.9 + 0.14 * mid.b + 0.1 * fine.g ) * ( 1.0 - 0.3 * speck );
    col = mix( col, mix( stone, stone * 0.93, ink ), pale );
    wjaRough = mix( wjaRough, 0.94, pale );
    wjaCoat *= 1.0 - pale;
    wjaTilt += grain * 1.6 * pale;
  }

  // Char: a black crust that grows back from the tip, with a scorched brown fringe.
  if ( charred > 0.0 ) {
    float front = charred * 7.5;
    float ragged = along + ( wide.g - 0.5 ) * 3.0 + ( mid.b - 0.5 ) * 1.6 + ( fine.g - 0.5 ) * 0.5;
    float crust = smoothstep( front + 0.25, front - 0.45, ragged );
    float soot = smoothstep( front + 2.6, front - 0.2, ragged );
    col = mix( col, col * vec3( 0.50, 0.33, 0.17 ), soot * soot * ( 1.0 - crust ) * 0.95 * face );
    col = mix( col, vec3( 0.012, 0.011, 0.010 ) + 0.03 * fine.g * mid.b, crust );
    wjaRough = mix( wjaRough, 0.96, crust );
    wjaCoat *= 1.0 - max( crust, soot * 0.6 );
    wjaTilt += grain * 5.0 * crust;
  }

  // Heat: a glow inside the enamel that climbs from the tip.
  if ( heat > 0.0 ) {
    float front = heat * 12.5;
    float h = smoothstep( front + 1.2, front - 5.0, along + ( wide.g - 0.5 ) * 2.4 + ( mid.b - 0.5 ) * 1.2 );
    vec3 ember = mix( vec3( 1.0, 0.82, 0.45 ), vec3( 1.25, 0.62, 0.08 ), smoothstep( 0.06, 0.3, h ) );
    ember = mix( ember, vec3( 1.2, 0.3, 0.02 ), smoothstep( 0.3, 0.58, h ) );
    ember = mix( ember, vec3( 0.74, 0.035, 0.012 ), smoothstep( 0.58, 0.96, h ) );
    float streak = 0.82 + 0.36 * mid.g * fine.b * 2.0;
    float body = smoothstep( 0.0, 0.28, h ) * face;
    col = mix( col, ember * 0.1, body );
    wjaGlow += ember * body * 0.72 * streak;
    wjaGlow += ember * h * ink * 0.1;
  }

  // Melt: the enamel runs over its own edge, wet and a little warmer.
  if ( melt > 0.0 ) {
    col = mix( col, col * vec3( 1.0, 0.985, 0.94 ), melt );
    wjaRough = mix( wjaRough, 0.2, melt );
  }

  // Burn holes: soot round each, and a rim that glows and cools.
  for ( int i = 0; i < ${MAX_HOLES}; i ++ ) {
    vec4 hole = uHoles[ i ];
    if ( hole.z <= 0.0 ) continue;
    vec2 d = q - hole.xy;
    float r = hole.z * wjaRag( d );
    float from = length( d ) / r + ( mid.g - 0.5 ) * 0.5 + ( fine.b - 0.5 ) * 0.25;
    float soot = 1.0 - smoothstep( 1.2, 1.85, from );
    float crust = 1.0 - smoothstep( 1.2, 1.5, from );
    col = mix( col, col * vec3( 0.42, 0.27, 0.14 ), soot * soot * 0.95 );
    col = mix( col, vec3( 0.016, 0.013, 0.011 ) + 0.035 * fine.g * mid.b, crust );
    wjaRough = mix( wjaRough, 0.95, max( crust, soot * 0.5 ) );
    wjaCoat *= 1.0 - max( crust, soot * 0.7 );
    wjaTilt += grain * 4.0 * crust;
    float lip = ( 1.0 - smoothstep( 1.0, 1.16, from ) ) * hole.w;
    float spark = smoothstep( 0.42, 0.7, fine.b * 0.6 + mid.g * 0.6 - 0.25 * ( 1.0 - hole.w ) );
    wjaGlow += mix( vec3( 0.85, 0.07, 0.01 ), vec3( 1.2, 0.55, 0.1 ), hole.w * fine.g ) * lip * ( 0.25 + 1.9 * spark );
  }
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
      '#include <begin_vertex>\nvRest = aRest;\nvInk = aInk;\nvAcross = normalize( normalMatrix * vec3( 1.0, 0.0, 0.0 ) );\nvDown = normalize( normalMatrix * vec3( 0.0, -1.0, 0.0 ) );'
    )
    shader.fragmentShader = ('uniform vec3 uEnamel;\nuniform vec3 uEdge;\n' + FRAGMENT_HEAD + shader.fragmentShader)
      .replace('#include <color_fragment>', '#include <color_fragment>\nwjaHoles( vRest );\ndiffuseColor.rgb = wjaSurface( uEnamel, uEdge );')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = wjaRough;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize( normal + vAcross * wjaTilt.x + vDown * wjaTilt.y );')
      .replace('#include <clearcoat_normal_fragment_maps>', '#include <clearcoat_normal_fragment_maps>\nclearcoatNormal = normalize( clearcoatNormal + vAcross * wjaCoatTilt.x + vDown * wjaCoatTilt.y );')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.clearcoat = saturate( wjaCoat );\nmaterial.specularColor *= wjaSpec;\nmaterial.specularF90 *= wjaSpec;\nmaterial.clearcoatRoughness = max( wjaCoatRough, 0.0525 );')
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
    shader.vertexShader = 'attribute vec3 aRest;\nvarying vec3 vRest;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = aRest;')
    shader.fragmentShader = 'varying vec3 vRest;\n' + HOLE_COMMON + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nwjaHoles( vec3( vRest.xy, 0.0 ) );')
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

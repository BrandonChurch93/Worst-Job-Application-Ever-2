import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { studio } from '../../../post/studio'
import { dataOf, geometryOf, groundOf, styleName, styles } from '../../../shell/real/type'
import { words } from '../../../shell/words'
import type { Shape } from '../../../stage/types'
import { lit } from '../light'
import { levels } from '../lights'
import { zone } from '../zone'

// The title on the marquee's picture: the type's own run of letters, as cream print on the lit picture. The print lets the panel's light through, so it glows with the picture behind it.
const TITLE = 'marquee-title'
const PRINT = { ink: 0xe9dfc8, tone: 0xe9dfc8, rest: 0.22, lit: 0.85 }
const HOVER = 0.05
const NEAR = `
float wjtDepth = - ( modelViewMatrix * vec4( position, 1.0 ) ).z;
float wjtPixel = projectionMatrix[ 3 ][ 3 ] == 1.0 ? 2.0 / ( projectionMatrix[ 1 ][ 1 ] * 1080.0 ) : wjtDepth * 2.0 / ( projectionMatrix[ 1 ][ 1 ] * 1080.0 );
float wjtUnit = clamp( wjtPixel / length( modelMatrix[ 0 ].xyz ), 0.0, 1.0 );
transformed -= wjaRing * ( 1.0 - wjtUnit );
`

export const titled = (s: Shape): boolean => s.id === TITLE && s.kind === 'text' && !!s.type && !!s.words

let glowing: THREE.MeshPhysicalMaterial | null = null

function material(): THREE.MeshPhysicalMaterial {
  if (glowing) return glowing
  const m = lit(studio(new THREE.MeshPhysicalMaterial({ color: PRINT.ink, vertexColors: true, emissive: PRINT.tone, emissiveIntensity: PRINT.rest, roughness: 0.5, metalness: 0, specularIntensity: 0.15 })), zone('marquee'))
  m.name = 'marquee.title'
  const room = m.onBeforeCompile
  const key = m.customProgramCacheKey
  m.onBeforeCompile = (shader, renderer) => {
    room.call(m, shader, renderer)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 wjaRing;').replace('#include <begin_vertex>', `#include <begin_vertex>\n${NEAR}`)
  }
  m.customProgramCacheKey = () => `${key.call(m)}|wjf-title`
  m.polygonOffset = true
  m.polygonOffsetFactor = -1
  m.polygonOffsetUnits = -2
  m.blending = THREE.CustomBlending
  m.blendSrc = THREE.SrcAlphaFactor
  m.blendDst = THREE.OneMinusSrcAlphaFactor
  m.blendSrcAlpha = THREE.OneFactor
  m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
  glowing = m
  return m
}

export const title: PartMaker = {
  key(s, ctx) {
    if (!titled(s)) return null
    const t = s.type!
    const name = styleName(groundOf(s, ctx), s.tone, t.font, t.ink)
    return `title|${name}|${t.font}|${t.px}|${t.wrap ?? ''}|${t.align ?? ''}|${t.lead ?? ''}|${Math.round(s.w * 4) / 4}|${Math.round(s.h * 4) / 4}|${s.words}|${words(s.words!, s.text)}`
  },
  make(s, ctx) {
    const t = s.type!
    const name = styleName(groundOf(s, ctx), s.tone, t.font, t.ink)
    const o = new THREE.Mesh(geometryOf(dataOf(s, words(s.words!, s.text), styles()[name]!)), material())
    o.name = 'marquee.title'
    o.position.z = HOVER
    o.castShadow = false
    o.receiveShadow = false
    return o
  },
  pose(_o, _s, ctx) {
    if (!glowing) return
    const level = levels(ctx, zone('marquee')).byName.panel ?? 0
    glowing.emissiveIntensity = PRINT.rest + (PRINT.lit - PRINT.rest) * level
  }
}

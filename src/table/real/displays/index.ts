import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { BOARD } from '../../draw'
import { table } from '../../layout'
import * as frameMarquee from '../frame/marquee'
import { lit } from '../light'
import { colours, groupsOf, levels } from '../lights'
import { balls, localBalls, localOf, whole, type Zone } from '../zone'
import { pick } from './pick'
import { COLS, ROWS, compose, keyOf } from './screen'

// How a display is put together, in page pixels. The seat round it is the frame's: its floor and the height of its bars are read from the frame where it gives them.
const TIER = { floor: 1.4, glassOver: 4.5, dotsUnder: 1.8, margin: 0 }
const MAIN = { w: 472, h: 68, up: 88, floor: 0.9, proud: 6, glassUnder: 1.6, maskOver: 1.1, dotsUnder: 1.5, margin: 2 }
const GLASS = { smoke: [0.0, 0.0, 0.0] as const, dust: [0.05, 0.047, 0.042] as const, clear: 0.36, dusty: 0.6, edge: 2.4, corner: 7, haze: 0.07 }
const LINER = { thick: 0.3, tone: [0.014, 0.013, 0.012] as const }
const SWEEP = { every: 9, takes: 2.6 }
const MIRROR = { spots: 8, away: 250, near: 300, deep: 26, gain: 0.1, size: 3, grows: 2.5 }

interface Seat { matrix: THREE.Matrix4; w: number; h: number; glass: number; mask: number; dotsUnder: number; pitch: number }

interface Frame { POCKET?: { w: number; h: number; floor?: number; proud?: number }; seatOf?: (z: Zone, ctx: RealContext) => THREE.Matrix4 | null }
const frame = frameMarquee as unknown as Frame

function seatOf(z: Zone, ctx: RealContext): Seat | null {
  if (z.tier >= 0) {
    const d = table.displays.find((x) => x.tier === z.tier)
    if (!d) return null
    const stand = ctx.byId.get(`display.${d.id}`)
    const top = stand ? stand.z1 - stand.z0 : 30
    const c = localBalls(z, d.box[0] + d.box[2] / 2, d.box[1] + d.box[3] / 2)
    const w = balls(d.box[2])
    const h = balls(d.box[3])
    return { matrix: new THREE.Matrix4().makeTranslation(c[0], c[1], 0), w, h, glass: top, mask: top - TIER.glassOver, dotsUnder: TIER.dotsUnder, pitch: Math.min((w - 2 * TIER.margin) / COLS, (h - 2 * TIER.margin) / ROWS) }
  }
  if (z.id !== 'marquee') return null
  const pocket = frame.POCKET
  const w = pocket?.w ?? MAIN.w
  const h = pocket?.h ?? MAIN.h
  const proud = pocket?.proud ?? MAIN.proud
  const floor = pocket?.floor ?? MAIN.floor
  let matrix: THREE.Matrix4 | null = null
  let base = floor
  if (frame.seatOf) {
    matrix = frame.seatOf(z, ctx)
    base = 0
  } else {
    const back = ctx.byId.get('marquee.back')
    if (back) {
      const thick = back.z1 - back.z0
      const mid = localOf(z, back)
      matrix = new THREE.Matrix4()
        .makeTranslation(mid[0], mid[1] - (thick / 2) * BOARD.sin, mid[2] + thick / 2 + (thick / 2) * BOARD.cos)
        .multiply(new THREE.Matrix4().makeRotationX(BOARD.turn))
        .multiply(new THREE.Matrix4().makeTranslation(0, -back.h / 2 + MAIN.up, 0))
    }
  }
  if (!matrix) return null
  const glass = base + (proud - floor) - MAIN.glassUnder
  return { matrix, w, h, glass, mask: base + MAIN.maskOver, dotsUnder: MAIN.dotsUnder, pitch: Math.min((w - 2 * MAIN.margin) / COLS, (h - 2 * MAIN.margin) / ROWS) }
}

// One grid for all four displays: they show the same thing at the same time. Two pictures of the same dots, one read dot by dot and one read softly for the halo.
const grid = new Uint8Array(COLS * ROWS)
const texels = new Uint8Array(COLS * ROWS)
let dots: THREE.DataTexture | null = null
let soft: THREE.DataTexture | null = null
let shown = ''

function pictures(): { dots: THREE.DataTexture; soft: THREE.DataTexture } {
  if (!dots || !soft) {
    dots = new THREE.DataTexture(texels, COLS, ROWS, THREE.RedFormat, THREE.UnsignedByteType)
    dots.magFilter = dots.minFilter = THREE.NearestFilter
    soft = new THREE.DataTexture(texels, COLS, ROWS, THREE.RedFormat, THREE.UnsignedByteType)
    soft.magFilter = THREE.LinearFilter
    soft.minFilter = THREE.LinearMipmapLinearFilter
    for (const t of [dots, soft]) {
      t.colorSpace = THREE.NoColorSpace
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
      t.generateMipmaps = t === soft
      t.needsUpdate = true
    }
    shown = ''
  }
  return { dots, soft }
}

function show(ctx: RealContext): boolean {
  const what = pick(ctx)
  const key = keyOf(what)
  if (key !== shown) {
    compose(what, grid)
    for (let y = 0; y < ROWS; y++) texels.set(grid.subarray(y * COLS, (y + 1) * COLS), (ROWS - 1 - y) * COLS)
    const p = pictures()
    p.dots.needsUpdate = true
    p.soft.needsUpdate = true
    shown = key
  }
  return what.kind === 'score'
}

const pars = /* glsl */ `
uniform sampler2D wjdDots;
uniform sampler2D wjdSoft;
uniform vec4 wjdMap;
uniform vec4 wjdDeep;
uniform vec4 wjdLight;
uniform vec3 wjdAmber;
varying vec2 vWjdUv;
varying vec3 vWjdEye;
const vec2 wjdGrid = vec2( ${COLS}.0, ${ROWS}.0 );
float wjdAt( vec2 cell ) {
	vec2 ok = step( vec2( 0.0 ), cell ) * step( cell, wjdGrid - 1.0 );
	return texture2D( wjdDots, ( cell + 0.5 ) / wjdGrid ).r * ok.x * ok.y;
}
float wjdField( vec2 q ) {
	vec2 uv = q / wjdGrid;
	vec2 ok = step( vec2( 0.0 ), uv ) * step( uv, vec2( 1.0 ) );
	return textureLod( wjdSoft, uv, 0.0 ).r * ok.x * ok.y;
}
float wjdGlow( vec2 q ) {
	vec2 uv = clamp( q / wjdGrid, 0.0, 1.0 );
	return 0.6 * textureLod( wjdSoft, uv, 2.6 ).r + 0.4 * textureLod( wjdSoft, uv, 3.8 ).r;
}
`

// The mask with a round hole for every dot, the dots a little behind it, and the halo each lit dot lays on the inside of the glass, all found along the line of sight so the layers part as the camera moves.
const body = /* glsl */ `
{
	vec3 wjdE = normalize( vWjdEye );
	vec2 wjdLean = wjdE.xy / max( wjdE.z, 0.25 ) / wjdDeep.w;
	vec2 wjdP = vWjdUv * wjdMap.zw + wjdMap.xy;
	float wjdGrain = max( fwidth( wjdP.x ), fwidth( wjdP.y ) );
	float wjdFar = smoothstep( 0.42, 1.05, wjdGrain );
	float wjdW = wjdGrain * 0.7;
	vec2 wjdCellM = floor( wjdP );
	float wjdRows = step( 0.0, wjdCellM.y ) * step( wjdCellM.y, wjdGrid.y - 1.0 ) * step( 0.0, wjdCellM.x ) * step( wjdCellM.x, wjdGrid.x - 1.0 );
	float wjdHole = ( 1.0 - smoothstep( 0.41 - wjdW, 0.41 + wjdW, length( fract( wjdP ) - 0.5 ) ) ) * wjdRows;
	vec2 wjdQ = wjdP - wjdLean * wjdDeep.x;
	float wjdLv = wjdAt( floor( wjdQ ) );
	float wjdR = length( fract( wjdQ ) - 0.5 );
	float wjdBead = 1.0 - smoothstep( 0.3 - wjdW, 0.37 + wjdW, wjdR );
	float wjdCore = exp( - wjdR * wjdR / 0.045 );
	float wjdPass = exp( - pow( ( wjdQ.x - wjdDeep.z ) / 11.0, 2.0 ) );
	float wjdSweep = 1.0 + 0.3 * wjdPass;
	vec3 wjdHot = vec3( 1.0, 0.66, 0.26 );
	vec3 wjdOn = ( wjdAmber * ( 0.55 + 2.7 * wjdCore ) + wjdHot * 1.5 * wjdCore * wjdCore ) * wjdSweep;
	vec3 wjdOff = wjdAmber * ( ( 0.012 + 0.03 * wjdCore ) * wjdLight.y + 0.014 * wjdLight.x );
	vec3 wjdNear = wjdHole * wjdBead * ( wjdOff + wjdOn * wjdLv * wjdLight.x );
	wjdNear += wjdAmber * 0.12 * wjdLv * wjdLight.x * wjdHole * ( 1.0 - wjdBead );
	wjdNear += vec3( 0.0042, 0.0038, 0.0034 ) * wjdLight.y * ( 1.0 - wjdHole );
	vec2 wjdG = wjdP + wjdLean * wjdDeep.y;
	float wjdTight = wjdField( wjdG );
	float wjdWide = 0.0;
	float wjdWider = 0.0;
	for ( int k = 0; k < 8; k ++ ) {
		float a = 0.7853982 * float( k );
		vec2 d = vec2( cos( a ), sin( a ) );
		wjdWide += wjdField( wjdG + d * 1.6 );
		wjdWider += wjdField( wjdG + vec2( d.x * 0.9239 - d.y * 0.3827, d.x * 0.3827 + d.y * 0.9239 ) * 3.3 );
	}
	vec3 wjdHalo = ( wjdAmber * ( 0.1 * wjdTight + 0.015 * wjdWide + 0.011 * wjdWider ) + wjdAmber * vec3( 1.0, 0.72, 0.5 ) * 0.32 * wjdGlow( wjdG ) * wjdRows ) * wjdLight.x * ( 1.0 + 0.9 * wjdPass );
	vec3 wjdCoarse = ( wjdAmber * 1.05 + wjdHot * 0.3 ) * 0.8 * wjdField( wjdQ ) * wjdLight.x * wjdSweep + wjdAmber * 0.006 * wjdLight.y * wjdRows;
	totalEmissiveRadiance = mix( wjdNear, wjdCoarse, wjdFar ) + wjdHalo;
}
`

interface Uniforms { map: THREE.Vector4; deep: THREE.Vector4; light: THREE.Vector4 }

function dotMaterial(z: Zone, u: Uniforms): THREE.MeshStandardMaterial {
  const p = pictures()
  const amber = new THREE.Vector3(...colours.DISPLAY_AMBER)
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.004, 0.004, 0.004), roughness: 1, metalness: 0, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1 })
  lit(studio(m), z)
  const inner = m.onBeforeCompile
  m.onBeforeCompile = function (shader, renderer) {
    inner.call(m, shader, renderer)
    shader.uniforms.wjdDots = { value: p.dots }
    shader.uniforms.wjdSoft = { value: p.soft }
    shader.uniforms.wjdMap = { value: u.map }
    shader.uniforms.wjdDeep = { value: u.deep }
    shader.uniforms.wjdLight = { value: u.light }
    shader.uniforms.wjdAmber = { value: amber }
    shader.vertexShader = ('varying vec2 vWjdUv;\nvarying vec3 vWjdEye;\n' + shader.vertexShader).replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvWjdUv = uv;\n\tvWjdEye = ( inverse( modelMatrix ) * vec4( cameraPosition, 1.0 ) ).xyz - position;')
    shader.fragmentShader = (pars + shader.fragmentShader).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + body)
  }
  const key = m.customProgramCacheKey
  m.customProgramCacheKey = () => `${key.call(m)}|wjd-dots`
  return m
}

// One finish for the housing and its pane: what differs from place to place is the colour and the cover of each corner, and a picture of two texels that says which is matte and which is polished.
let finish: THREE.DataTexture | null = null
const finishOf = (): THREE.DataTexture => {
  if (!finish) {
    finish = new THREE.DataTexture(new Uint8Array([0, 224, 0, 255, 0, 26, 0, 255]), 2, 1, THREE.RGBAFormat, THREE.UnsignedByteType)
    finish.magFilter = finish.minFilter = THREE.NearestFilter
    finish.colorSpace = THREE.NoColorSpace
    finish.generateMipmaps = false
    finish.needsUpdate = true
  }
  return finish
}

interface Mirror { spots: THREE.Vector4[]; colour: THREE.Vector3; tint: readonly [number, number, number] }

// The pane is taken to bulge a hair, as a pressed pane does: the lamps of the tier stand in it small and in a row, the near ones larger, and they slide as the camera moves.
function mirrorOf(z: Zone, s: Seat): Mirror {
  const group = groupsOf(z).find((g) => g.name === 'general')
  const back = s.matrix.clone().invert()
  const found: { q: THREE.Vector4; gain: number }[] = []
  const seen = new Set<string>()
  for (const src of group ? group.sources : []) {
    const p = new THREE.Vector3(src.x, src.y, src.z).applyMatrix4(back)
    const key = `${Math.round(p.x)},${Math.round(p.y)}`
    if (seen.has(key)) continue
    seen.add(key)
    const far = Math.hypot(p.x, p.y)
    const gain = Math.min(1, MIRROR.near / Math.max(1, far))
    const q = new THREE.Vector4(((s.w / 2 - 4) * p.x) / (far + MIRROR.away), ((s.h / 2 - 2) * p.y) / (far + MIRROR.away), MIRROR.size + MIRROR.grows * gain, gain)
    found.push({ q, gain })
  }
  found.sort((a, b) => b.gain - a.gain)
  const spots: THREE.Vector4[] = []
  for (let i = 0; i < MIRROR.spots; i++) spots.push(found[i] ? found[i]!.q : new THREE.Vector4(0, 0, 1, 0))
  return { spots, colour: new THREE.Vector3(), tint: group ? group.colour : [0, 0, 0] }
}

function housingMaterial(z: Zone, mirror: Mirror): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0, roughnessMap: finishOf(), specularIntensity: 1, transparent: true, premultipliedAlpha: false })
  m.blending = THREE.CustomBlending
  m.blendEquation = THREE.AddEquation
  m.blendSrc = THREE.OneFactor
  m.blendDst = THREE.OneMinusSrcAlphaFactor
  m.blendSrcAlpha = THREE.OneFactor
  m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
  lit(studio(m), z)
  const inner = m.onBeforeCompile
  m.onBeforeCompile = function (shader, renderer) {
    inner.call(m, shader, renderer)
    shader.uniforms.wjgSpots = { value: mirror.spots }
    shader.uniforms.wjgColour = { value: mirror.colour }
    shader.vertexShader = ('varying vec2 vWjgAt;\nvarying vec3 vWjgEye;\n' + shader.vertexShader).replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvWjgAt = position.xy;\n\tvWjgEye = ( inverse( modelMatrix ) * vec4( cameraPosition, 1.0 ) ).xyz - position;')
    shader.fragmentShader = (`uniform vec4 wjgSpots[ ${MIRROR.spots} ];\nuniform vec3 wjgColour;\nvarying vec2 vWjgAt;\nvarying vec3 vWjgEye;\n` + shader.fragmentShader).replace(
      '#include <lights_fragment_end>',
      `#include <lights_fragment_end>
{
	vec3 wjgE = normalize( vWjgEye );
	vec2 wjgP = vWjgAt + wjgE.xy / max( wjgE.z, 0.25 ) * ${MIRROR.deep.toFixed(1)};
	float wjgSum = 0.0;
	for ( int i = 0; i < ${MIRROR.spots}; i ++ ) {
		vec2 d = ( wjgP - wjgSpots[ i ].xy ) / wjgSpots[ i ].z;
		float r = dot( d, d );
		wjgSum += wjgSpots[ i ].w * ( exp( - r ) + 0.3 * exp( - r / 7.0 ) );
	}
	reflectedLight.indirectSpecular += wjgColour * wjgSum * step( roughnessFactor, 0.5 );
}`
    )
  }
  const key = m.customProgramCacheKey
  m.customProgramCacheKey = () => `${key.call(m)}|wjd-pane`
  return m
}

class Mesh {
  position: number[] = []
  normal: number[] = []
  colour: number[] = []
  uv: number[] = []
  index: number[] = []
  point(p: readonly [number, number, number], n: readonly [number, number, number], c: readonly [number, number, number], a: number, polished: boolean): number {
    this.position.push(...p)
    this.normal.push(...n)
    this.colour.push(c[0], c[1], c[2], a)
    this.uv.push(polished ? 0.75 : 0.25, 0.5)
    return this.position.length / 3 - 1
  }
  quad(a: number, b: number, c: number, d: number): void {
    this.index.push(a, b, c, a, c, d)
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.position, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normal, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colour, 4))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setIndex(this.index)
    return g
  }
}

const mix3 = (a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function housing(s: Seat): THREE.BufferGeometry {
  const m = new Mesh()
  const w = s.w / 2
  const h = s.h / 2
  const t = LINER.thick
  const low = s.mask - 0.6
  const high = s.glass
  // The liner: four thin walls from under the mask up to the pane, seen through the pane when the camera stands to one side.
  const wall = (x0: number, y0: number, x1: number, y1: number, n: [number, number, number]): void => {
    const a = m.point([x0, y0, low], n, LINER.tone, 1, false)
    const b = m.point([x1, y1, low], n, LINER.tone, 1, false)
    const c = m.point([x1, y1, high], n, mix3(LINER.tone, [0.03, 0.026, 0.02], 1), 1, false)
    const d = m.point([x0, y0, high], n, mix3(LINER.tone, [0.03, 0.026, 0.02], 1), 1, false)
    m.quad(a, b, c, d)
  }
  wall(-w + t, -h + t, w - t, -h + t, [0, 1, 0])
  wall(w - t, h - t, -w + t, h - t, [0, -1, 0])
  wall(-w + t, h - t, -w + t, -h + t, [1, 0, 0])
  wall(w - t, -h + t, w - t, h - t, [-1, 0, 0])
  // The pane: smoked, clear in the middle, with a hair of dust where it meets the liner and a little more in the corners, and a faint haze that is thicker toward the top edge.
  const up: [number, number, number] = [0, 0, 1]
  const xs = [-w + t, -w + t + GLASS.edge, -w + GLASS.corner * 2.2, 0, w - GLASS.corner * 2.2, w - t - GLASS.edge, w - t]
  const ys = [-h + t, -h + t + GLASS.edge, -h + GLASS.corner, 0, h - GLASS.corner, h - t - GLASS.edge, h - t]
  const ids: number[][] = []
  ys.forEach((y, j) => {
    ids.push(
      xs.map((x, i) => {
        const rim = i === 0 || i === xs.length - 1 || j === 0 || j === ys.length - 1
        const corner = (i <= 1 || i >= xs.length - 2) && (j <= 1 || j >= ys.length - 2)
        const dust = rim ? (corner ? 1 : 0.7) : corner ? 0.45 : 0
        const haze = GLASS.haze * (0.35 + 0.65 * ((y + h) / (2 * h))) * (0.6 + 0.4 * (1 - (x + w) / (2 * w)))
        const k = Math.min(1, dust + haze)
        return m.point([x, y, high], up, mix3(GLASS.smoke, GLASS.dust, k), GLASS.clear + (GLASS.dusty - GLASS.clear) * dust, true)
      })
    )
  })
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) m.quad(ids[j]![i]!, ids[j]![i + 1]!, ids[j + 1]![i + 1]!, ids[j + 1]![i]!)
  return m.geometry()
}

interface Built { u: Uniforms; mirror: Mirror }
const built = new WeakMap<THREE.Object3D, Built>()

function build(z: Zone, ctx: RealContext): THREE.Object3D {
  const o = new THREE.Group()
  o.name = `displays.${z.id}`
  const s = seatOf(z, ctx)
  if (!s) return o
  const group = groupsOf(z).find((g) => g.name === 'display')
  const inner = new THREE.Group()
  inner.matrixAutoUpdate = false
  inner.matrix.copy(s.matrix)
  o.add(inner)
  const u: Uniforms = {
    map: new THREE.Vector4(-(s.w / s.pitch - COLS) / 2, -(s.h / s.pitch - ROWS) / 2, s.w / s.pitch, s.h / s.pitch),
    deep: new THREE.Vector4(s.dotsUnder / s.pitch, (s.glass - s.mask) / s.pitch, -1000, s.pitch),
    light: new THREE.Vector4(0, 0, 0, 0)
  }
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(s.w - 2 * LINER.thick, s.h - 2 * LINER.thick), dotMaterial(z, u))
  const trim = (2 * LINER.thick) / s.pitch
  u.map.set(u.map.x + trim / 2, u.map.y + trim / 2, u.map.z - trim, u.map.w - trim)
  quad.position.z = s.mask
  quad.name = `displays.${z.id}.dots`
  quad.userData.lightGroup = group ? group.id : `${z.id}.display`
  inner.add(quad)
  const mirror = mirrorOf(z, s)
  const box = new THREE.Mesh(housing(s), housingMaterial(z, mirror))
  box.name = `displays.${z.id}.housing`
  box.receiveShadow = true
  inner.add(box)
  built.set(o, { u, mirror })
  return o
}

function pose(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  if (!b) return
  const score = show(ctx)
  const L = levels(ctx, z)
  b.u.light.set(L.byName.display ?? 0, Math.min(1, 0.55 * L.website + 0.6 * L.general + 0.3 * L.flash), 0, 0)
  const lamps = (L.byName.general ?? 0) * MIRROR.gain
  b.mirror.colour.set(b.mirror.tint[0] * lamps, b.mirror.tint[1] * lamps, b.mirror.tint[2] * lamps)
  const at = (((ctx.time % SWEEP.every) + SWEEP.every) % SWEEP.every) / SWEEP.takes
  b.u.deep.z = score && at < 1 ? -24 + at * (COLS + 48) : -1000
}

const maker = whole('displays', { version: 'displays-1', build, pose, words: true })

export const parts: Record<string, PartMaker | null> = { 'displays': maker }

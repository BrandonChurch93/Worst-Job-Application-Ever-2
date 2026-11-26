import * as THREE from 'three'
import { studio } from '../../post/studio'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { materials } from '../materials'
import { block, font, measure } from '../metrics'
import { words } from '../words'

// What the type lies on decides how it is set: sunk print, flat print or raised print.
export type Ground = 'page' | 'cap' | 'glass' | 'paper' | 'metal' | 'smoked' | 'gloss'
export type Setting = 'sunk' | 'flat' | 'raised'

type Rgb = [number, number, number]

// One ring of the shoulder that runs round every outline: how far out, how opaque, which colour.
interface Ring { d: number; a: number; c: Rgb }

export interface Style {
  setting: Setting
  fill: Rgb
  // Sine of the tilt of the shoulder's normal. Positive leans toward the ink (a wall going down into the surface), negative away from it (the edge of a raised layer).
  lean: number
  rings: Ring[]
}

interface Glyph { fill: Float32Array; index: Uint32Array; contours: { p: Float32Array; m: Float32Array }[] }

const glyphs = new Map<string, Glyph>()

export const segmentsFor = (px: number): number => (px <= 20 ? 3 : px <= 30 ? 4 : px <= 64 ? 6 : 10)

function glyph(name: string, code: number, segments: number): Glyph {
  const key = `${name}:${code}:${segments}`
  const hit = glyphs.get(key)
  if (hit) return hit
  const out: Glyph = { fill: new Float32Array(0), index: new Uint32Array(0), contours: [] }
  glyphs.set(key, out)
  const g = font(name).glyphs[String(code)]
  if (!g || g.p.length === 0) return out
  const path = new THREE.ShapePath()
  const p = g.p
  for (let i = 0; i < p.length; ) {
    const c = p[i]!
    if (c === 0) {
      path.moveTo(p[i + 1]!, p[i + 2]!)
      i += 3
    } else if (c === 1) {
      path.lineTo(p[i + 1]!, p[i + 2]!)
      i += 3
    } else if (c === 2) {
      path.quadraticCurveTo(p[i + 1]!, p[i + 2]!, p[i + 3]!, p[i + 4]!)
      i += 5
    } else if (c === 3) {
      path.bezierCurveTo(p[i + 1]!, p[i + 2]!, p[i + 3]!, p[i + 4]!, p[i + 5]!, p[i + 6]!)
      i += 7
    } else {
      path.currentPath?.closePath()
      i += 1
    }
  }
  const shapes = path.toShapes()
  const geo = new THREE.ShapeGeometry(shapes, segments)
  const src = geo.getAttribute('position')
  out.fill = new Float32Array(src.count * 2)
  for (let i = 0; i < src.count; i++) {
    out.fill[i * 2] = src.getX(i)
    out.fill[i * 2 + 1] = src.getY(i)
  }
  out.index = new Uint32Array(geo.getIndex()!.array)
  geo.dispose()
  // Every contour is turned so that the ink lies on its left: the outside of the ink is then always to the right of travel.
  const turn = (pts: THREE.Vector2[], hole: boolean): void => {
    const list = pts.slice()
    while (list.length > 1 && list[0]!.distanceToSquared(list[list.length - 1]!) < 1e-6) list.pop()
    const clean: THREE.Vector2[] = []
    for (const v of list) if (!clean.length || clean[clean.length - 1]!.distanceToSquared(v) > 1e-6) clean.push(v)
    if (clean.length < 3) return
    if (THREE.ShapeUtils.isClockWise(clean) !== hole) clean.reverse()
    const n = clean.length
    const pos = new Float32Array(n * 2)
    const mit = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      const a = clean[(i + n - 1) % n]!
      const b = clean[i]!
      const c = clean[(i + 1) % n]!
      let ax = b.y - a.y
      let ay = -(b.x - a.x)
      let bx = c.y - b.y
      let by = -(c.x - b.x)
      const al = Math.hypot(ax, ay) || 1
      const bl = Math.hypot(bx, by) || 1
      ax /= al
      ay /= al
      bx /= bl
      by /= bl
      let mx = ax + bx
      let my = ay + by
      const ml = Math.hypot(mx, my)
      if (ml < 1e-4) {
        mx = ax
        my = ay
      } else {
        mx /= ml
        my /= ml
      }
      const cos = Math.max(0.42, mx * ax + my * ay)
      pos[i * 2] = b.x
      pos[i * 2 + 1] = b.y
      mit[i * 2] = mx / cos
      mit[i * 2 + 1] = my / cos
    }
    out.contours.push({ p: pos, m: mit })
  }
  for (const shape of shapes) {
    const pts = shape.extractPoints(segments)
    turn(pts.shape, false)
    for (const hole of pts.holes) turn(hole, true)
  }
  return out
}

export interface RunSpec {
  font: string
  px: number
  lines: string[]
  align: 'left' | 'centre' | 'right'
  // Where the lines hang from, in the run's own coordinates: x of the anchor, y of the first baseline, and the lead between baselines.
  x: number
  y: number
  lead: number
  style: Style
}

export interface RunData { position: Float32Array; normal: Float32Array; colour: Float32Array; ring: Float32Array; index: Uint32Array; triangles: number }

const LIFT = 0.03

// One run of type as plain numbers: first the shoulders of every glyph, then every fill, so that ink always lies over a neighbour's shoulder.
export function setRun(spec: RunSpec): RunData {
  const f = font(spec.font)
  const scale = spec.px / f.unitsPerEm
  const segments = segmentsFor(spec.px)
  const st = spec.style
  const rings = st.rings
  const bands = rings.length
  const placed: { g: Glyph; x: number; y: number }[] = []
  let vertices = 0
  let indices = 0
  spec.lines.forEach((line, row) => {
    if (!line) return
    const m = measure(spec.font, line, spec.px)
    const left = spec.align === 'centre' ? spec.x - m.width / 2 : spec.align === 'right' ? spec.x - m.width : spec.x
    const codes = Array.from(line, (ch) => ch.codePointAt(0)!)
    codes.forEach((code, i) => {
      const g = glyph(spec.font, code, segments)
      if (!g.index.length) return
      placed.push({ g, x: left + m.advances[i]!, y: spec.y - row * spec.lead })
      vertices += g.fill.length / 2
      indices += g.index.length
      for (const c of g.contours) {
        const n = c.p.length / 2
        vertices += n * (bands + 1)
        indices += n * bands * 6
      }
    })
  })
  const position = new Float32Array(vertices * 3)
  const normal = new Float32Array(vertices * 3)
  const colour = new Float32Array(vertices * 4)
  const ring = new Float32Array(vertices * 2)
  const index = new Uint32Array(indices)
  let v = 0
  let k = 0
  const lean = st.lean
  const up = Math.sqrt(1 - lean * lean)
  if (bands > 0) {
    for (const { g, x, y } of placed) {
      for (const c of g.contours) {
        const n = c.p.length / 2
        const base = v
        for (let r = 0; r <= bands; r++) {
          const d = r === 0 ? 0 : rings[r - 1]!.d
          const a = r === 0 ? rings[0]!.a : r < bands ? rings[r]!.a : 0
          const col = rings[Math.min(r, bands - 1)]!.c
          for (let i = 0; i < n; i++) {
            const mx = c.m[i * 2]!
            const my = c.m[i * 2 + 1]!
            const ml = Math.hypot(mx, my)
            position[v * 3] = x + c.p[i * 2]! * scale + mx * d
            position[v * 3 + 1] = y + c.p[i * 2 + 1]! * scale + my * d
            ring[v * 2] = mx * d
            ring[v * 2 + 1] = my * d
            normal[v * 3] = (-mx / ml) * lean
            normal[v * 3 + 1] = (-my / ml) * lean
            normal[v * 3 + 2] = up
            colour[v * 4] = col[0]
            colour[v * 4 + 1] = col[1]
            colour[v * 4 + 2] = col[2]
            colour[v * 4 + 3] = a
            v++
          }
        }
        for (let r = 0; r < bands; r++) {
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n
            const a0 = base + r * n + i
            const a1 = base + r * n + j
            const b0 = base + (r + 1) * n + i
            const b1 = base + (r + 1) * n + j
            index[k++] = a0
            index[k++] = b0
            index[k++] = b1
            index[k++] = a0
            index[k++] = b1
            index[k++] = a1
          }
        }
      }
    }
  }
  for (const { g, x, y } of placed) {
    const n = g.fill.length / 2
    for (let i = 0; i < n; i++) {
      position[v * 3 + i * 3] = x + g.fill[i * 2]! * scale
      position[v * 3 + i * 3 + 1] = y + g.fill[i * 2 + 1]! * scale
      position[v * 3 + i * 3 + 2] = LIFT
      normal[v * 3 + i * 3 + 2] = 1
      colour[v * 4 + i * 4] = st.fill[0]
      colour[v * 4 + i * 4 + 1] = st.fill[1]
      colour[v * 4 + i * 4 + 2] = st.fill[2]
      colour[v * 4 + i * 4 + 3] = 1
    }
    for (let i = 0; i < g.index.length; i++) index[k++] = g.index[i]! + v
    v += n
  }
  return { position, normal, colour, ring, index: index.subarray(0, k), triangles: k / 3 }
}

const lin = (c: THREE.Color): Rgb => [c.r, c.g, c.b]
const hex = (h: number): Rgb => lin(new THREE.Color().setHex(h, THREE.SRGBColorSpace))

const INK = 0x302e2b
const INK_WARM = 0x52473c
const INK_SOFT = 0x67625c
const SOFT_FONT = 'inter-400'
const INK_LIGHT = 0xfdf3e6
const LIP = 0xf2efe8
const INK_ON_METAL = 0x232427
const INK_ON_GLASS = 0x262827

let styleSet: Record<string, Style> | null = null

// The settings of the type, one for each pair of what it lies on and what its ink is.
export function styles(): Record<string, Style> {
  if (styleSet) return styleSet
  const ink = hex(INK)
  const warm = hex(INK_WARM)
  const soft = hex(INK_SOFT)
  const light = hex(INK_LIGHT)
  const lip = hex(LIP)
  const onMetal = hex(INK_ON_METAL)
  const onGlass = hex(INK_ON_GLASS)
  styleSet = {
    'page:ink': { setting: 'sunk', fill: ink, lean: 0.5, rings: [{ d: 0.3, a: 0.8, c: ink }, { d: 0.9, a: 0.5, c: lip }] },
    'page:soft': { setting: 'sunk', fill: soft, lean: 0.5, rings: [{ d: 0.3, a: 0.8, c: soft }, { d: 0.9, a: 0.5, c: lip }] },
    'cap:ink': { setting: 'sunk', fill: warm, lean: 0.42, rings: [{ d: 0.3, a: 0.8, c: warm }, { d: 0.8, a: 0.4, c: lip }] },
    'glass:ink': { setting: 'flat', fill: onGlass, lean: 0, rings: [{ d: 0.45, a: 0.85, c: onGlass }] },
    'paper:ink': { setting: 'flat', fill: ink, lean: 0, rings: [{ d: 0.5, a: 0.8, c: ink }] },
    'metal:ink': { setting: 'flat', fill: onMetal, lean: 0, rings: [{ d: 0.4, a: 0.9, c: onMetal }] },
    'gloss:ink': { setting: 'flat', fill: ink, lean: 0, rings: [{ d: 0.45, a: 0.85, c: ink }] },
    'page:light': { setting: 'raised', fill: light, lean: -0.5, rings: [{ d: 0.4, a: 0.85, c: light }] },
    'gloss:light': { setting: 'raised', fill: light, lean: -0.55, rings: [{ d: 0.4, a: 0.85, c: light }] }
  }
  return styleSet
}

// The regular weight on the page is the quiet voice (sublines, helpers, body) and takes the softer ink.
export function styleName(ground: Ground, tone: string, font = ''): string {
  if (ground === 'smoked') return 'gloss:light'
  const inkName = tone === 'inkLight' || tone === 'light' ? 'light' : 'ink'
  if (inkName === 'light') return ground === 'gloss' || ground === 'metal' ? 'gloss:light' : 'page:light'
  return ground === 'page' && font === SOFT_FONT ? 'page:soft' : `${ground}:ink`
}

const GROUND_OF_TONE: Record<string, Ground> = { metal: 'metal', accent: 'gloss', danger: 'gloss', dark: 'gloss', glass: 'glass', raised: 'cap', light: 'cap', paper: 'paper', page: 'page', pocket: 'page' }

const SMOKED_ROLES = new Set(['chip', 'button', 'heroButton'])

// A chip or a button of tone metal is the smoked grey capsule of the surface, dark enough that only light type reads on it.
const groundOfShape = (u: Shape): Ground => (u.role === 'field' ? 'glass' : u.tone === 'metal' && SMOKED_ROLES.has(u.role ?? '') ? 'smoked' : (GROUND_OF_TONE[u.tone] ?? 'page'))

let seenList: Shape[] | null = null
const seenGround = new Map<string, Ground>()

// What a run lies on: the part its id names when the run's middle is over it, or else the highest thing whose top is at the run's height under its middle.
export function groundOf(s: Shape, ctx: RealContext): Ground {
  if (ctx.list !== seenList) {
    seenList = ctx.list
    seenGround.clear()
  }
  const hit = seenGround.get(s.id)
  if (hit) return hit
  let found: Ground | null = null
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const cut = s.id.lastIndexOf('-')
  if (cut > 0) {
    const stem = s.id.slice(0, cut)
    for (const id of [`${stem}-cap`, `${stem}-pocket`, stem]) {
      const u = ctx.byId.get(id)
      if (u && u.kind !== 'text' && u.kind !== 'well' && cx >= u.x && cx <= u.x + u.w && cy >= u.y && cy <= u.y + u.h) {
        found = groundOfShape(u)
        break
      }
    }
  }
  if (!found) {
    let best: Shape | null = null
    for (const u of ctx.list) {
      if (u.kind === 'text' || u.kind === 'well' || u === s) continue
      if (cx < u.x || cx > u.x + u.w || cy < u.y || cy > u.y + u.h) continue
      const top = u.pocket ? u.z0 : u.z1
      if (Math.abs(top - s.z1) > 0.75) continue
      if (!best || top >= (best.pocket ? best.z0 : best.z1)) best = u
    }
    found = best ? groundOfShape(best) : 'page'
  }
  seenGround.set(s.id, found)
  return found
}

interface Kit { opaque: THREE.MeshPhysicalMaterial; over: THREE.MeshPhysicalMaterial }
const kits = new Map<string, Kit>()

// The material's own colour is the ink, so that whatever reads a material reads the ink. The colours of a run's vertices are then counted from it.
function kit(name: string): Kit {
  const hit = kits.get(name)
  if (hit) return hit
  const style = styles()[name]!
  const setting = style.setting
  const make = (over: boolean): THREE.MeshPhysicalMaterial => {
    const m = studio(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setRGB(style.fill[0], style.fill[1], style.fill[2]),
        vertexColors: true,
        roughness: setting === 'raised' ? 0.5 : 0.62,
        metalness: 0,
        specularIntensity: 0.15
      })
    )
    m.name = `type-${name}${over ? '-over' : ''}`
    const lit = m.onBeforeCompile
    m.onBeforeCompile = (shader, renderer) => {
      lit.call(m, shader, renderer)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 wjaRing;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${NEAR_GLSL}`)
    }
    m.customProgramCacheKey = () => 'wja-studio-type'
    if (setting === 'sunk') {
      m.normalMap = materials().ceramic.normalMap
      m.normalScale.set(GRAIN, GRAIN)
    }
    m.polygonOffset = true
    m.polygonOffsetFactor = -1
    m.polygonOffsetUnits = -2
    if (over) {
      m.transparent = true
      m.depthWrite = false
    } else {
      m.blending = THREE.CustomBlending
      m.blendSrc = THREE.SrcAlphaFactor
      m.blendDst = THREE.OneMinusSrcAlphaFactor
      m.blendSrcAlpha = THREE.OneFactor
      m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
    }
    return m
  }
  const made = { opaque: make(false), over: make(true) }
  kits.set(name, made)
  return made
}

const GRAIN = 0.16

// The shoulders are set in page pixels. A camera that comes nearer than the home view would widen them on screen, so they are drawn in by as much as it is nearer.
const NEAR_GLSL = `
float wjaDepth = - ( modelViewMatrix * vec4( position, 1.0 ) ).z;
float wjaPixel = projectionMatrix[ 3 ][ 3 ] == 1.0 ? 2.0 / ( projectionMatrix[ 1 ][ 1 ] * 1080.0 ) : wjaDepth * 2.0 / ( projectionMatrix[ 1 ][ 1 ] * 1080.0 );
float wjaUnit = clamp( wjaPixel / length( modelMatrix[ 0 ].xyz ), 0.0, 1.0 );
transformed -= wjaRing * ( 1.0 - wjaUnit );
`

const q = (v: number): number => Math.round(v * 4) / 4

const HOVER = 0.05
const UNSEEN = 31

function dataOf(s: Shape, said: string, style: Style): RunData {
  const t = s.type!
  const b = block(t.font, said, t.px, t.wrap, t.lead)
  const align = t.align ?? 'left'
  const x = align === 'centre' ? 0 : align === 'right' ? s.w / 2 : -s.w / 2
  const data = setRun({ font: t.font, px: t.px, lines: b.lines, align, x, y: s.h / 2 - b.cap, lead: b.lead, style })
  const tint = data.colour
  for (let i = 0; i < tint.length; i += 4) {
    tint[i] = tint[i]! / style.fill[0]
    tint[i + 1] = tint[i + 1]! / style.fill[1]
    tint[i + 2] = tint[i + 2]! / style.fill[2]
  }
  return data
}

// A run that is drawn alone: type under or on glass, which has to keep its own place in the order of drawing, and type whose words are made while the page runs, which would set the whole sheet again at every change.
function geometryOf(data: RunData): THREE.BufferGeometry {
  const n = data.position.length / 3
  const ring = new Float32Array(n * 3)
  const uv = new Float32Array(n * 2)
  for (let i = 0; i < n; i++) {
    ring[i * 3] = data.ring[i * 2]!
    ring[i * 3 + 1] = data.ring[i * 2 + 1]!
    uv[i * 2] = data.position[i * 3]!
    uv[i * 2 + 1] = data.position[i * 3 + 1]!
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(data.position, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(data.colour, 4))
  geometry.setAttribute('wjaRing', new THREE.BufferAttribute(ring, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setIndex(new THREE.BufferAttribute(data.index, 1))
  return geometry
}

const boxOf = (data: RunData): THREE.BufferGeometry => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(data.position, 3))

interface Member { hold: THREE.Object3D; proxy: THREE.Mesh; data: RunData; first: number; at: THREE.Vector3; turn: THREE.Quaternion; sheet: Sheet | null }

const ONE = new THREE.Vector3(1, 1, 1)
const placing = new THREE.Matrix4()

// The runs of one band of a page that share a setting, as one mesh and one draw call. It lies in the page's own space beside the runs.
// A band is one picture's height of the page, so a camera that sees one screen draws the type of that screen and not of the whole page.
// Each run keeps an empty holder that the view places, shows and hides; the sheet reads those holders just before it is drawn and sets itself again only when a run came or went, and where a run moved.
export class Sheet extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial> {
  members: Member[] = []
  private set: Member[] = []

  constructor(material: THREE.MeshPhysicalMaterial, readonly key: string) {
    super(new THREE.BufferGeometry(), material)
    this.frustumCulled = true
    this.receiveShadow = true
    this.castShadow = false
    this.visible = false
    this.userData.part = 'type'
    this.userData.type = material.name
  }

  override updateMatrixWorld(force?: boolean): void {
    this.sync()
    super.updateMatrixWorld(force)
  }

  sync(): void {
    const live: Member[] = []
    let changed = false
    let order = 0
    for (const m of this.members) {
      if (!m.hold.visible) continue
      if (this.set[live.length] !== m) changed = true
      live.push(m)
      if (m.proxy.renderOrder > order) order = m.proxy.renderOrder
    }
    if (live.length !== this.set.length) changed = true
    this.visible = live.length > 0
    this.renderOrder = order
    if (changed) {
      this.build(live)
      return
    }
    let moved = false
    for (const m of live) {
      if (m.at.equals(m.hold.position) && m.turn.equals(m.hold.quaternion)) continue
      this.bake(m)
      moved = true
    }
    if (!moved) return
    for (const name of ['position', 'normal', 'wjaRing', 'uv']) this.geometry.getAttribute(name).needsUpdate = true
    this.geometry.boundingSphere = null
  }

  private build(live: Member[]): void {
    let vertices = 0
    let indices = 0
    for (const m of live) {
      vertices += m.data.position.length / 3
      indices += m.data.index.length
    }
    this.geometry.dispose()
    const geometry = new THREE.BufferGeometry()
    const colour = new Float32Array(vertices * 4)
    const index = new Uint32Array(indices)
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3))
    geometry.setAttribute('wjaRing', new THREE.BufferAttribute(new Float32Array(vertices * 3), 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vertices * 2), 2))
    geometry.setAttribute('color', new THREE.BufferAttribute(colour, 4))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.geometry = geometry
    let v = 0
    let k = 0
    for (const m of live) {
      m.first = v
      colour.set(m.data.colour, v * 4)
      const from = m.data.index
      for (let i = 0; i < from.length; i++) index[k++] = from[i]! + v
      this.bake(m)
      v += m.data.position.length / 3
    }
    this.geometry.boundingSphere = null
    this.set = live
  }

  private bake(m: Member): void {
    const e = placing.compose(m.hold.position, m.hold.quaternion, ONE).elements
    const position = this.geometry.getAttribute('position').array as Float32Array
    const normal = this.geometry.getAttribute('normal').array as Float32Array
    const ring = this.geometry.getAttribute('wjaRing').array as Float32Array
    const uv = this.geometry.getAttribute('uv').array as Float32Array
    const P = m.data.position
    const N = m.data.normal
    const R = m.data.ring
    const n = P.length / 3
    for (let i = 0; i < n; i++) {
      const o = (m.first + i) * 3
      const x = P[i * 3]!
      const y = P[i * 3 + 1]!
      const z = P[i * 3 + 2]! + HOVER
      const px = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!
      const py = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!
      position[o] = px
      position[o + 1] = py
      position[o + 2] = e[2]! * x + e[6]! * y + e[10]! * z + e[14]!
      const nx = N[i * 3]!
      const ny = N[i * 3 + 1]!
      const nz = N[i * 3 + 2]!
      normal[o] = e[0]! * nx + e[4]! * ny + e[8]! * nz
      normal[o + 1] = e[1]! * nx + e[5]! * ny + e[9]! * nz
      normal[o + 2] = e[2]! * nx + e[6]! * ny + e[10]! * nz
      const rx = R[i * 2]!
      const ry = R[i * 2 + 1]!
      ring[o] = e[0]! * rx + e[4]! * ry
      ring[o + 1] = e[1]! * rx + e[5]! * ry
      ring[o + 2] = e[2]! * rx + e[6]! * ry
      uv[(m.first + i) * 2] = px
      uv[(m.first + i) * 2 + 1] = py
    }
    m.at.copy(m.hold.position)
    m.turn.copy(m.hold.quaternion)
  }
}

const sheets = new WeakMap<THREE.Object3D, Map<string, Sheet>>()

// The page's top edge stands at BAND_TOP and a band is BAND tall, in page pixels.
const BAND_TOP = 540
const BAND = 1080

function join(m: Member, style: string, page: THREE.Object3D): void {
  let of = sheets.get(page)
  if (!of) sheets.set(page, (of = new Map()))
  const key = `${style}|${Math.floor((BAND_TOP - m.hold.position.y) / BAND)}`
  let sheet = of.get(key)
  if (!sheet) of.set(key, (sheet = new Sheet(kit(style).opaque, key)))
  if (sheet.parent !== page) page.add(sheet)
  sheet.members.push(m)
  m.sheet = sheet
}

function leave(m: Member): void {
  const sheet = m.sheet
  if (!sheet) return
  m.sheet = null
  sheet.members.splice(sheet.members.indexOf(m), 1)
  if (sheet.members.length > 0) return
  const page = sheet.parent
  if (page) {
    sheets.get(page)?.delete(sheet.key)
    page.remove(sheet)
  }
  sheet.geometry.dispose()
}

interface Held { said: string; style: string; member: Member | null }

export const type: PartMaker = {
  key(s, ctx) {
    if (s.kind !== 'text' || !s.type || !s.words) return null
    const t = s.type
    const name = styleName(groundOf(s, ctx), s.tone, t.font)
    const said = s.words.startsWith('runtime:') ? '' : words(s.words)
    return `${name}|${t.font}|${t.px}|${t.wrap ?? ''}|${t.align ?? ''}|${t.lead ?? ''}|${q(s.w)}|${q(s.h)}|${s.words}|${said}`
  },
  make(s, ctx) {
    const ground = groundOf(s, ctx)
    const name = styleName(ground, s.tone, s.type!.font)
    const said = words(s.words!, s.text)
    const data = dataOf(s, said, styles()[name]!)
    const over = ground === 'glass'
    if (over || s.words!.startsWith('runtime:')) {
      const mesh = new THREE.Mesh(geometryOf(data), over ? kit(name).over : kit(name).opaque)
      mesh.position.z = HOVER
      mesh.receiveShadow = true
      mesh.castShadow = false
      const held: Held = { said, style: name, member: null }
      mesh.userData.held = held
      return mesh
    }
    const hold = new THREE.Group()
    const proxy = new THREE.Mesh(boxOf(data), kit(name).opaque)
    proxy.position.z = HOVER
    proxy.layers.set(UNSEEN)
    proxy.castShadow = false
    hold.add(proxy)
    const member: Member = { hold, proxy, data, first: 0, at: new THREE.Vector3(), turn: new THREE.Quaternion(), sheet: null }
    const held: Held = { said, style: name, member }
    hold.userData.held = held
    return hold
  },
  pose(o, s) {
    const held = o.userData.held as Held
    const m = held.member
    if (m) {
      if (!m.sheet && o.parent) join(m, held.style, o.parent)
      return
    }
    const said = words(s.words!, s.text)
    if (said === held.said) return
    held.said = said
    const mesh = o as THREE.Mesh
    mesh.geometry.dispose()
    mesh.geometry = geometryOf(dataOf(s, said, styles()[held.style]!))
  },
  drop(o) {
    const held = o.userData.held as Held
    if (!held.member) {
      ;(o as THREE.Mesh).geometry.dispose()
      return
    }
    leave(held.member)
    held.member.proxy.geometry.dispose()
  }
}

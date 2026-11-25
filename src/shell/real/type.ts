import * as THREE from 'three'
import { studio } from '../../post/studio'
import type { PartMaker, RealContext } from '../../real/types'
import type { Shape } from '../../stage/types'
import { materials } from '../materials'
import { block, font, measure } from '../metrics'
import { words } from '../words'

// What the type lies on decides how it is set: sunk print, flat print, raised print or a cut.
export type Ground = 'page' | 'cap' | 'glass' | 'paper' | 'metal' | 'gloss'
export type Setting = 'sunk' | 'flat' | 'raised' | 'cut'

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

export interface RunData { position: Float32Array; normal: Float32Array; colour: Float32Array; index: Uint32Array; triangles: number }

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
  const index = new Uint32Array(indices)
  let v = 0
  let k = 0
  const lean = st.lean
  const up = Math.sqrt(1 - lean * lean)
  const grow = st.setting === 'cut' ? Math.min(2, Math.max(0.6, spec.px / 28)) : 1
  if (bands > 0) {
    for (const { g, x, y } of placed) {
      for (const c of g.contours) {
        const n = c.p.length / 2
        const base = v
        for (let r = 0; r <= bands; r++) {
          const d = r === 0 ? 0 : rings[r - 1]!.d * grow
          const a = r === 0 ? rings[0]!.a : r < bands ? rings[r]!.a : 0
          const col = rings[Math.min(r, bands - 1)]!.c
          for (let i = 0; i < n; i++) {
            const mx = c.m[i * 2]!
            const my = c.m[i * 2 + 1]!
            const ml = Math.hypot(mx, my)
            position[v * 3] = x + c.p[i * 2]! * scale + mx * d
            position[v * 3 + 1] = y + c.p[i * 2 + 1]! * scale + my * d
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
  return { position, normal, colour, index: index.subarray(0, k), triangles: k / 3 }
}

const lin = (c: THREE.Color): Rgb => [c.r, c.g, c.b]
const hex = (h: number): Rgb => lin(new THREE.Color().setHex(h, THREE.SRGBColorSpace))
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

const INK = 0x28292b
const INK_WARM = 0x342d26
const INK_LIGHT = 0xf6f1e8
const LIP = 0xf2efe8
const CUT_FLOOR = 0x1d1e21

let styleSet: Record<string, Style> | null = null

// The settings of the type, one for each pair of what it lies on and what its ink is.
export function styles(): Record<string, Style> {
  if (styleSet) return styleSet
  const mat = materials()
  const ink = hex(INK)
  const warm = hex(INK_WARM)
  const light = hex(INK_LIGHT)
  const lip = hex(LIP)
  const metal = lin(mat.aluminium.color)
  const floor = hex(CUT_FLOOR)
  styleSet = {
    'page:ink': { setting: 'sunk', fill: ink, lean: 0.5, rings: [{ d: 0.3, a: 0.8, c: ink }, { d: 0.9, a: 0.5, c: lip }] },
    'cap:ink': { setting: 'sunk', fill: warm, lean: 0.42, rings: [{ d: 0.3, a: 0.8, c: warm }, { d: 0.8, a: 0.4, c: lip }] },
    'glass:ink': { setting: 'flat', fill: ink, lean: 0, rings: [{ d: 0.45, a: 0.85, c: ink }] },
    'paper:ink': { setting: 'flat', fill: ink, lean: 0, rings: [{ d: 0.5, a: 0.8, c: ink }] },
    'metal:ink': { setting: 'cut', fill: floor, lean: 0.6, rings: [{ d: 0.5, a: 1, c: mix(metal, floor, 0.55) }, { d: 0.95, a: 0.5, c: metal }] },
    'gloss:ink': { setting: 'flat', fill: ink, lean: 0, rings: [{ d: 0.45, a: 0.85, c: ink }] },
    'page:light': { setting: 'raised', fill: light, lean: -0.5, rings: [{ d: 0.6, a: 1, c: light }] },
    'gloss:light': { setting: 'raised', fill: light, lean: -0.55, rings: [{ d: 0.7, a: 1, c: light }] }
  }
  return styleSet
}

export function styleName(ground: Ground, tone: string): string {
  const inkName = tone === 'inkLight' || tone === 'light' ? 'light' : 'ink'
  if (inkName === 'light') return ground === 'gloss' || ground === 'metal' ? 'gloss:light' : 'page:light'
  return `${ground}:ink`
}

const GROUND_OF_TONE: Record<string, Ground> = { metal: 'metal', accent: 'gloss', danger: 'gloss', dark: 'gloss', glass: 'glass', raised: 'cap', light: 'cap', paper: 'paper', page: 'page', pocket: 'page' }

const groundOfShape = (u: Shape): Ground => (u.role === 'field' ? 'glass' : (GROUND_OF_TONE[u.tone] ?? 'page'))

let seenList: Shape[] | null = null
const seenGround = new Map<string, Ground>()

// What a run lies on: the part its id names, or else the highest thing whose top is at the run's height under its middle.
export function groundOf(s: Shape, ctx: RealContext): Ground {
  if (ctx.list !== seenList) {
    seenList = ctx.list
    seenGround.clear()
  }
  const hit = seenGround.get(s.id)
  if (hit) return hit
  let found: Ground | null = null
  const cut = s.id.lastIndexOf('-')
  if (cut > 0) {
    const stem = s.id.slice(0, cut)
    for (const id of [`${stem}-cap`, `${stem}-pocket`, stem]) {
      const u = ctx.byId.get(id)
      if (u && u.kind !== 'text' && u.kind !== 'well') {
        found = groundOfShape(u)
        break
      }
    }
  }
  if (!found) {
    const cx = s.x + s.w / 2
    const cy = s.y + s.h / 2
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
const kits = new Map<Setting, Kit>()

function kit(setting: Setting): Kit {
  const hit = kits.get(setting)
  if (hit) return hit
  const cut = setting === 'cut'
  const make = (over: boolean): THREE.MeshPhysicalMaterial => {
    const m = studio(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: cut ? 0.5 : setting === 'raised' ? 0.5 : 0.62,
        metalness: cut ? 0.85 : 0,
        specularIntensity: cut ? 1 : 0.15
      })
    )
    m.name = `type-${setting}${over ? '-over' : ''}`
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
  kits.set(setting, made)
  return made
}

const q = (v: number): number => Math.round(v * 4) / 4

interface Held { said: string; style: string; over: boolean }

function geometryOf(s: Shape, said: string, style: Style): THREE.BufferGeometry {
  const t = s.type!
  const b = block(t.font, said, t.px, t.wrap, t.lead)
  const align = t.align ?? 'left'
  const x = align === 'centre' ? 0 : align === 'right' ? s.w / 2 : -s.w / 2
  const data = setRun({ font: t.font, px: t.px, lines: b.lines, align, x, y: s.h / 2 - b.cap, lead: b.lead, style })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(data.position, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(data.normal, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(data.colour, 4))
  geometry.setIndex(new THREE.BufferAttribute(data.index, 1))
  return geometry
}

const HOVER = 0.05

export const type: PartMaker = {
  key(s, ctx) {
    if (s.kind !== 'text' || !s.type || !s.words) return null
    const t = s.type
    const name = styleName(groundOf(s, ctx), s.tone)
    const said = s.words.startsWith('runtime:') ? '' : words(s.words)
    return `${name}|${t.font}|${t.px}|${t.wrap ?? ''}|${t.align ?? ''}|${t.lead ?? ''}|${q(s.w)}|${q(s.h)}|${s.words}|${said}`
  },
  make(s, ctx) {
    const ground = groundOf(s, ctx)
    const name = styleName(ground, s.tone)
    const style = styles()[name]!
    const said = words(s.words!, s.text)
    const over = ground === 'glass'
    const mesh = new THREE.Mesh(geometryOf(s, said, style), over ? kit(style.setting).over : kit(style.setting).opaque)
    mesh.position.z = HOVER
    mesh.receiveShadow = true
    mesh.castShadow = false
    const held: Held = { said, style: name, over }
    mesh.userData.held = held
    return mesh
  },
  pose(o, s) {
    const mesh = o as THREE.Mesh
    const held = mesh.userData.held as Held
    const said = words(s.words!, s.text)
    if (said === held.said) return
    mesh.geometry.dispose()
    mesh.geometry = geometryOf(s, said, styles()[held.style]!)
    held.said = said
  },
  drop(o) {
    ;(o as THREE.Mesh).geometry.dispose()
  }
}

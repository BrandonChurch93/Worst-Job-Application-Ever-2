import * as THREE from 'three'
import type { LayoutNode } from '../../../copy'
import type { PartMaker } from '../../../real/types'
import { find } from '../../../shell/layout'
import { dataOf, geometryOf, type Style } from '../../../shell/real/type'
import { outlineOf, type Outline } from '../../../shell/solids'
import { words } from '../../../shell/words'
import type { Shape } from '../../../stage/types'
import { APPLY, CARDS, careersLayout, COLOUR, GLOW, TABLE } from '../layout'
import { mesh, q } from './careers-solids'
import { flat, ink, Paint, shade, share, tint, type Rgb } from './flat'

export const INKS: Record<string, number> = { ink: COLOUR.ink, inkLight: COLOUR.white, accent: COLOUR.onWhite, danger: COLOUR.onPeach, metal: COLOUR.greyType }
export const inkOf = (s: Pick<Shape, 'tone' | 'type'>): number => (s.tone === 'ink' && s.type?.ink === 'soft' ? COLOUR.soft : (INKS[s.tone] ?? COLOUR.ink))

const styles = new Map<number, Style>()
function styleOf(hex: number): Style {
  let s = styles.get(hex)
  if (!s) {
    const c = tint(hex)
    s = { setting: 'flat', fill: c, lean: 0, rings: [{ d: 0.5, a: 0.8, c }] }
    styles.set(hex, s)
  }
  return s
}

const HOVER = 0.05

// Type printed flat on the website: its own colour wherever the lamp stands.
export const flatType: PartMaker = {
  key(s) {
    if (s.kind !== 'text' || !s.type || !s.words) return null
    const t = s.type
    return `flat:${inkOf(s)}|${t.font}|${t.px}|${t.wrap ?? ''}|${t.align ?? ''}${t.cut ? ' cut' : ''}|${t.lead ?? ''}|${q(s.w)}|${q(s.h)}|${s.words}|${words(s.words, s.text)}`
  },
  make(s) {
    const hex = inkOf(s)
    const m = new THREE.Mesh(geometryOf(dataOf(s, words(s.words!, s.text), styleOf(hex))), ink(hex))
    m.position.z = HOVER
    m.castShadow = false
    m.receiveShadow = false
    const root = new THREE.Group()
    root.add(m)
    return root
  },
  drop(o) {
    o.traverse((c) => (c as THREE.Mesh).geometry?.dispose())
  }
}

export const LAYER = { white: 0, glow: 0.12, shadow: 0.16, fill: 0.3, inner: 0.45, mark: 0.6, top: 0.75 }
// A painted shadow is given as the colour the white sheet shows under it. It lies `drop` lower than what casts it and `inset` inside its outline, and fades out over `spread`.
export const SHADOW = { card: 0xe0e0e4, button: 0xf0cdb4, spread: 26, drop: 14, inset: 12 }

const WHITE = tint(COLOUR.white)
const LINE = tint(COLOUR.line)
const BAND = tint(COLOUR.band)
const PEACH = tint(COLOUR.peach)
const DEEP = tint(COLOUR.deep)
const GREY = tint(COLOUR.grey)
const WREATH = tint(COLOUR.wreath)
const TICK = tint(COLOUR.tick)
const EDGE = tint(COLOUR.edge)
const CARD_SHADOW: Rgb = share(SHADOW.card)
const BUTTON_SHADOW: Rgb = share(SHADOW.button)

interface Brush { s: Shape; flat: Paint; shade: Paint }

const xOf = (b: Brush, x: number): number => x - (b.s.x + b.s.w / 2)
const yOf = (b: Brush, y: number): number => b.s.y + b.s.h / 2 - y
const boxOf = (n: LayoutNode): { x: number; y: number; w: number; h: number; cx: number; cy: number } => ({ x: n.box[0]!, y: n.box[1]!, w: n.box[2]!, h: n.box[3]!, cx: n.box[0]! + n.box[2]! / 2, cy: n.box[1]! + n.box[3]! / 2 })
const outline = (n: LayoutNode, inset = 0): Outline => outlineOf({ kind: n.shape ?? 'box', w: n.box[2]!, h: n.box[3]!, r: n.r ?? 0 }, inset, 12)

function rect(b: Brush, x: number, y: number, w: number, h: number, z: number, c: Rgb, r = 0.6): void {
  b.flat.face(outlineOf({ kind: 'box', w, h, r }, 0, r > 1 ? 10 : 2), xOf(b, x + w / 2), yOf(b, y + h / 2), z, c)
}

// A card of the website: a hairline round a white face, and its soft shadow on the sheet.
function card(b: Brush, n: LayoutNode): void {
  const o = outline(n)
  const { cx, cy } = boxOf(n)
  b.shade.soft(outline(n, SHADOW.inset), xOf(b, cx), yOf(b, cy + SHADOW.drop), LAYER.shadow, SHADOW.spread, CARD_SHADOW)
  b.flat.face(o, xOf(b, cx), yOf(b, cy), LAYER.fill, EDGE)
  b.flat.face(outline(n, 1.5), xOf(b, cx), yOf(b, cy), LAYER.inner, WHITE)
}

// One branch of a laurel wreath: a stem bent like a bracket with leaves in pairs along it. `side` is -1 for the left branch.
function branch(b: Brush, cx: number, cy: number, side: number): void {
  const r = 62
  const mid = cx - side * (r - 16)
  const at = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180
    return [xOf(b, mid + side * r * Math.cos(a)), yOf(b, cy - r * Math.sin(a))]
  }
  const from = -64
  const to = 54
  const stem: [number, number][] = []
  for (let i = 0; i <= 14; i++) stem.push(at(from + ((to - from) * i) / 14))
  b.flat.line(stem, 2.2, LAYER.fill, WREATH)
  const leaves = 8
  for (let i = 0; i < leaves; i++) {
    const deg = from + ((to - from) * (i + 0.9)) / leaves
    const [x, y] = at(deg)
    const [x2, y2] = at(deg + 2)
    const along = Math.atan2(y2 - y, x2 - x)
    for (const turn of i === leaves - 1 ? [0] : [-0.72, 0.72]) {
      const a = along + turn
      const long = 21 - i * 0.8
      const pts: [number, number][] = []
      for (let k = 0; k < 12; k++) {
        const u = (k / 12) * Math.PI * 2
        const lx = (0.5 - 0.5 * Math.cos(u)) * long
        const ly = Math.sin(u) * 4.7
        pts.push([x + Math.cos(a) * lx - Math.sin(a) * ly, y + Math.sin(a) * lx + Math.cos(a) * ly])
      }
      b.flat.poly(pts, LAYER.inner, WREATH)
    }
  }
}

function award(b: Brush, n: LayoutNode): void {
  const { cx, y } = boxOf(n)
  for (const side of [-1, 1]) branch(b, cx + side * 108, y + 61, side)
}

function tableCard(b: Brush, n: LayoutNode): void {
  card(b, n)
  const box = boxOf(n)
  const x = box.x + TABLE.pad
  const w = box.w - TABLE.pad * 2
  const top = box.y + TABLE.pad
  const rows = (box.h - TABLE.pad * 2 - TABLE.head) / TABLE.row
  rect(b, x, top, w, TABLE.head, LAYER.mark, BAND, 8)
  rect(b, TABLE.us[0], top + TABLE.head, TABLE.us[1] - TABLE.us[0], rows * TABLE.row, LAYER.mark, PEACH)
  for (let i = 1; i <= rows; i++) rect(b, x, top + TABLE.head + i * TABLE.row - 0.5, w, 1, LAYER.top, LINE)
}

function tick(b: Brush, n: LayoutNode): void {
  const { x, y, w, cx, cy } = boxOf(n)
  b.flat.face(outline(n), xOf(b, cx), yOf(b, cy), LAYER.top, TICK)
  const k = w / 26
  const p = (px: number, py: number): [number, number] => [xOf(b, x + px * k), yOf(b, y + py * k)]
  b.flat.line([p(6.5, 13.5), p(11.2, 18.2), p(19.5, 8.6)], 3 * k, LAYER.top + 0.15, WHITE)
}

function faqRow(b: Brush, n: LayoutNode): void {
  const { x, w, cx, cy } = boxOf(n)
  b.flat.face(outline(n), xOf(b, cx), yOf(b, cy), LAYER.fill, EDGE)
  b.flat.face(outline(n, 1.5), xOf(b, cx), yOf(b, cy), LAYER.inner, WHITE)
  const px = x + w - 37
  b.flat.line([[xOf(b, px - 8), yOf(b, cy)], [xOf(b, px + 8), yOf(b, cy)]], 2, LAYER.mark, GREY)
  b.flat.line([[xOf(b, px), yOf(b, cy - 8)], [xOf(b, px), yOf(b, cy + 8)]], 2, LAYER.mark, GREY)
}

function paint(b: Brush, n: LayoutNode): void {
  const box = boxOf(n)
  const part = n.part
  if (part === CARDS && n.kind === 'perkCard') return
  if (part === APPLY) {
    b.shade.soft(outline(n, SHADOW.inset), xOf(b, box.cx), yOf(b, box.cy + SHADOW.drop), LAYER.shadow, SHADOW.spread, BUTTON_SHADOW)
  } else if (n.kind === 'hairline') rect(b, box.x, box.y, box.w, box.h, LAYER.fill, LINE)
  else if (n.kind === 'pill') b.flat.face(outline(n), xOf(b, box.cx), yOf(b, box.cy), LAYER.fill, n.tone === 'pocket' ? BAND : PEACH)
  else if (n.kind === 'tickerBand') rect(b, box.x, box.y, box.w, box.h, LAYER.fill, BAND)
  else if (n.kind === 'award') award(b, n)
  else if (n.kind === 'quoteCard') card(b, n)
  else if (n.kind === 'tableCard') tableCard(b, n)
  else if (n.kind === 'tick') tick(b, n)
  else if (n.kind === 'faqRow') faqRow(b, n)
  else if (n.kind === 'stepDisc') b.flat.face(outline(n), xOf(b, box.cx), yOf(b, box.cy), LAYER.mark, DEEP)
  for (const c of n.children ?? []) paint(b, c)
}

// One stretch of the website: the white sheet and everything printed on it that never moves, as two meshes.
function sheet(s: Shape): THREE.Object3D {
  const root = new THREE.Group()
  const b: Brush = { s, flat: new Paint(), shade: new Paint() }
  rect(b, s.x, s.y, s.w, s.h, LAYER.white, WHITE, 0.6)
  if (s.id === 'sheet-top') b.shade.fan(xOf(b, GLOW.x), yOf(b, GLOW.y), GLOW.rx, GLOW.ry, LAYER.glow, share(COLOUR.glow), [1, 1, 1], GLOW.hold)
  const n = find(careersLayout().layout, s.id)
  for (const c of n.children ?? []) paint(b, c)
  const z = s.z1 - s.z0
  const face = mesh(b.flat.geometry(), flat(), false, true)
  face.position.z = z
  root.add(face)
  if (!b.shade.empty) {
    const soft = mesh(b.shade.geometry(), shade(), false, false)
    soft.position.z = z
    root.add(soft)
  }
  return root
}

export const careersPage: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text') return flatType.key(s, ctx)
    if (s.kind === 'well' || s.kind === 'anchor') return null
    if (s.role === 'sheet') return `sheet:${s.id}:${q(s.y)}:${q(s.h)}`
    return ''
  },
  make(s, ctx) {
    if (s.kind === 'text') return flatType.make(s, ctx)
    return sheet(s)
  },
  pose(o, s) {
    if (s.kind === 'text') o.scale.y = Math.max(0.006, s.v?.[0] ?? 1)
  },
  drop(o) {
    flatType.drop!(o)
  }
}

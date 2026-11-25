import { config } from '../config'
import type { LayoutNode } from '../copy'
import type { DrawList, Shape, Tone, TypeSpec } from '../stage/types'
import { block } from './metrics'
import { hasWords, words } from './words'

const heights = config.scale.heights as unknown as Record<string, number>
const kinds = new Set<string>(config.scale.kinds)
const tolerance = config.layout.tolerancePx
const CONTAINERS = new Set(['page', 'column', 'row', 'group'])
const TONES: Record<string, Tone> = {
  rule: 'metal', progressRail: 'pocket', progressButton: 'metal', progressButtonCurrent: 'accent', field: 'pocket', buttonSocket: 'dark', button: 'accent', heroButton: 'accent',
  card: 'glass', paper: 'paper', slab: 'danger', keyboardDeck: 'metal', keycap: 'raised', turret: 'metal', machineTray: 'pocket'
}

export const plannedHeight = (kind: string): number | null => (kinds.has(kind) ? heights[kind]! : null)
export const heightOf = (n: LayoutNode): number => n.height ?? plannedHeight(n.kind) ?? 0
export const isText = (n: LayoutNode): boolean => n.copy !== undefined && n.type !== undefined

export type Extra = Partial<Omit<LayoutNode, 'id' | 'kind' | 'box'>>

export const node = (id: string, kind: string, box: number[], extra: Extra = {}): LayoutNode => ({ id, kind, box, ...extra })

export function text(id: string, key: string, type: TypeSpec, x: number, y: number, extra: Extra & { runtime?: string } = {}): LayoutNode {
  const { runtime, ...rest } = extra
  const b = block(type.font, words(key, runtime ?? ''), type.px, type.wrap, type.lead)
  const w = key.startsWith('runtime:') && type.wrap !== undefined ? type.wrap : b.width
  const left = type.align === 'centre' ? x - w / 2 : type.align === 'right' ? x - w : x
  return { id, kind: 'text', box: [left, y, w, b.height], copy: key, type, ...rest }
}

export const bounds = (children: LayoutNode[]): number[] => {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const c of children) {
    x0 = Math.min(x0, c.box[0]!)
    y0 = Math.min(y0, c.box[1]!)
    x1 = Math.max(x1, c.box[0]! + c.box[2]!)
    y1 = Math.max(y1, c.box[1]! + c.box[3]!)
  }
  return children.length ? [x0, y0, x1 - x0, y1 - y0] : [0, 0, 0, 0]
}

export const group = (id: string, children: LayoutNode[], extra: Extra = {}): LayoutNode => ({ id, kind: 'group', box: bounds(children), children, ...extra })

export type Item = (x: number, y: number) => LayoutNode

export function column(id: string, x: number, y: number, gap: number, items: Item[], extra: Extra = {}): LayoutNode {
  const children: LayoutNode[] = []
  let at = y
  for (const item of items) {
    const child = item(x, at)
    children.push(child)
    at = child.box[1]! + child.box[3]! + gap
  }
  return { id, kind: 'column', box: bounds(children), children, flow: 'column', gap, ...extra }
}

export function row(id: string, x: number, y: number, gap: number, items: Item[], extra: Extra = {}): LayoutNode {
  const children: LayoutNode[] = []
  let at = x
  for (const item of items) {
    const child = item(at, y)
    children.push(child)
    at = child.box[0]! + child.box[2]! + gap
  }
  return { id, kind: 'row', box: bounds(children), children, flow: 'row', gap, ...extra }
}

export function walk(tree: LayoutNode, visit: (n: LayoutNode, parent: LayoutNode | null, part: string) => void, parent: LayoutNode | null = null, part = 'shell'): void {
  const mine = tree.part ?? part
  visit(tree, parent, mine)
  for (const child of tree.children ?? []) walk(child, visit, tree, mine)
}

export function find(tree: LayoutNode, id: string): LayoutNode {
  let hit: LayoutNode | null = null
  walk(tree, (n) => {
    if (n.id === id) hit = n
  })
  if (!hit) throw new Error(`The layout tree of "${tree.id}" has no part called "${id}"`)
  return hit
}

export const boxOf = (tree: LayoutNode, id: string): { x: number; y: number; w: number; h: number; cx: number; cy: number } => {
  const b = find(tree, id).box
  return { x: b[0]!, y: b[1]!, w: b[2]!, h: b[3]!, cx: b[0]! + b[2]! / 2, cy: b[1]! + b[3]! / 2 }
}

const shown = (n: LayoutNode, states: string[]): boolean => n.states === undefined || n.states.some((s) => states.includes(s))

export function shapeOf(n: LayoutNode, part: string): Shape | null {
  const [x, y, w, h] = n.box as [number, number, number, number]
  if (isText(n)) {
    const on = n.on ?? 0
    return { id: n.id, part, kind: 'text', x, y, w, h, z0: on, z1: on, tone: (n.tone as Tone | undefined) ?? 'ink', words: n.copy!, type: n.type! }
  }
  if (n.shape === 'none' || (n.shape === undefined && CONTAINERS.has(n.kind))) return null
  const top = heightOf(n)
  const kind = n.shape ?? 'box'
  const shape: Shape = { id: n.id, part, kind, x, y, w, h, z0: top < 0 ? top : (n.floor ?? 0), z1: top < 0 ? 0 : top, tone: (n.tone as Tone | undefined) ?? TONES[n.kind] ?? 'raised' }
  if (top < 0) shape.pocket = true
  if (n.r !== undefined) shape.r = n.r
  if (n.mechanism) shape.mechanism = true
  return shape
}

export interface DrawOptions {
  states: string[]
  over?: Record<string, Partial<Shape> | null>
  runtime?: Record<string, string>
}

export function drawLayout(out: DrawList, tree: LayoutNode, o: DrawOptions): void {
  const hidden = new Set<LayoutNode>()
  walk(tree, (n, parent, part) => {
    if ((parent && hidden.has(parent)) || !shown(n, o.states) || o.over?.[n.id] === null) {
      hidden.add(n)
      return
    }
    const shape = shapeOf(n, part)
    if (!shape) return
    const over = o.over?.[n.id]
    if (over) Object.assign(shape, over)
    if (shape.kind === 'text' && shape.words!.startsWith('runtime:')) shape.text = o.runtime?.[shape.words!.slice(8)] ?? shape.text ?? ''
    out.push(shape)
  })
}

export interface RegisterEntry { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime'; node: string }

export function typeRegister(tree: LayoutNode): RegisterEntry[] {
  const out: RegisterEntry[] = []
  const visit = (n: LayoutNode, inherited: string[] | undefined): void => {
    const states = n.states ?? inherited
    if (isText(n)) {
      const key = n.copy!
      out.push({ key, text: key.startsWith('runtime:') ? '' : words(key), states: states ?? ['rest'], made: key.startsWith('copy:') ? 'copy' : key.startsWith('runtime:') ? 'runtime' : 'config', node: n.id })
    }
    for (const child of n.children ?? []) visit(child, states)
  }
  visit(tree, undefined)
  return out
}

const overlap = (a: number[], b: number[]): boolean =>
  Math.min(a[0]! + a[2]!, b[0]! + b[2]!) - Math.max(a[0]!, b[0]!) > tolerance && Math.min(a[1]! + a[3]!, b[1]! + b[3]!) - Math.max(a[1]!, b[1]!) > tolerance
const contains = (a: number[], b: number[]): boolean =>
  b[0]! >= a[0]! - tolerance && b[1]! >= a[1]! - tolerance && b[0]! + b[2]! <= a[0]! + a[2]! + tolerance && b[1]! + b[3]! <= a[1]! + a[3]! + tolerance
const same = (values: number[]): boolean => values.every((v) => Math.abs(v - values[0]!) <= tolerance)

export function layoutProblems(tree: LayoutNode, size: { width: number; height: number }): string[] {
  const out: string[] = []
  const all: { n: LayoutNode; states: string[] | undefined; over: LayoutNode | null }[] = []
  const ids = new Set<string>()
  const visit = (n: LayoutNode, inherited: string[] | undefined, lifted: LayoutNode | null): void => {
    const states = n.states ?? inherited
    const over = lifted ?? (n.over ? n : null)
    if (ids.has(n.id)) out.push(`layout: "${tree.id}" has two parts called "${n.id}"`)
    ids.add(n.id)
    all.push({ n, states, over })
    if (n.copy !== undefined && !hasWords(n.copy)) out.push(`layout: "${n.id}" of "${tree.id}" names the words "${n.copy}", which do not exist`)
    const [x, y, w, h] = n.box as [number, number, number, number]
    if (x < -tolerance || y < -tolerance || x + w > size.width + tolerance || y + h > size.height + tolerance) out.push(`layout: "${n.id}" of "${tree.id}" does not lie inside the page`)
    const kids = n.children ?? []
    if (n.flow && kids.length > 1) {
      const col = n.flow === 'column'
      const lo = kids.map((c) => c.box[col ? 0 : 1]!)
      const hi = kids.map((c) => c.box[col ? 0 : 1]! + c.box[col ? 2 : 3]!)
      const mid = kids.map((c) => c.box[col ? 0 : 1]! + c.box[col ? 2 : 3]! / 2)
      if (!same(lo) && !same(hi) && !same(mid)) out.push(`layout: the parts of the ${n.flow} "${n.id}" of "${tree.id}" share no edge`)
      const gaps: number[] = []
      for (let i = 1; i < kids.length; i++) gaps.push(kids[i]!.box[col ? 1 : 0]! - (kids[i - 1]!.box[col ? 1 : 0]! + kids[i - 1]!.box[col ? 3 : 2]!))
      if (!same(gaps)) out.push(`layout: the gaps of the ${n.flow} "${n.id}" of "${tree.id}" are not equal: ${gaps.map((g) => g.toFixed(1)).join(', ')}`)
    }
    for (const child of kids) visit(child, states, over)
  }
  visit(tree, undefined, null)
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]!
      const b = all[j]!
      if (CONTAINERS.has(a.n.kind) && a.n.shape === undefined) continue
      if (CONTAINERS.has(b.n.kind) && b.n.shape === undefined) continue
      if (a.states && b.states && !a.states.some((s) => b.states!.includes(s))) continue
      if (a.over !== b.over) continue
      if (!overlap(a.n.box, b.n.box)) continue
      if (contains(a.n.box, b.n.box) || contains(b.n.box, a.n.box)) continue
      out.push(`layout: "${a.n.id}" and "${b.n.id}" of "${tree.id}" overlap and neither holds the other`)
    }
  }
  return out
}

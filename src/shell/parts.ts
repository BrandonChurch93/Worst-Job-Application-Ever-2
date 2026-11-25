import { config } from '../config'
import type { LayoutNode } from '../copy'
import type { TypeSpec } from '../stage/types'
import { group, node, text, type Extra } from './layout'
import { block } from './metrics'
import numerals from './numerals.json'
import { hasWords, registerData, words } from './words'

registerData('numerals', numerals)

const grid = config.scale.grid
const sizes = config.scale.sizes
const heights = config.scale.heights

export const PAGE_W = 1920
export const SCREEN_H = 1080
export const LEFT = grid.contentLeft
export const RIGHT = grid.contentRight
export const HEADER = { titleY: 66, progressY: 76, ruleY: 148, headingY: 196, sublineY: 266, contentY: 336 }

export const TYPE = {
  title: { font: 'inter-600', px: 28 },
  heading: { font: 'inter-display-600', px: 60 },
  subline: { font: 'inter-400', px: 24 },
  label: { font: 'inter-500', px: 22 },
  helper: { font: 'inter-400', px: 18 },
  body: { font: 'inter-400', px: 22 },
  value: { font: 'inter-500', px: 26 },
  button: { font: 'inter-600', px: 26 },
  hero: { font: 'inter-600', px: 32 },
  numeral: { font: 'inter-600', px: 28 }
} satisfies Record<string, TypeSpec>

export const progressCentre = (step: number): { x: number; y: number } => ({ x: RIGHT - sizes.progressButton / 2 - (5 - step) * grid.progressPitch, y: HEADER.progressY })

export function header(current: number): LayoutNode[] {
  const d = sizes.progressButton
  const channel = Math.round(d / 8) * 2
  const first = progressCentre(1)
  const last = progressCentre(5)
  const title = text('header-title', 'copy:site.title', TYPE.title, LEFT, HEADER.titleY, { part: 'shell' })
  const rail = node('progress-rail', 'progressRail', [first.x, first.y - channel / 2, last.x - first.x, channel], { part: 'shell', shape: 'capsule' })
  const buttons: LayoutNode[] = []
  for (let i = 1; i <= 5; i++) {
    const c = progressCentre(i)
    const kind = i === current ? 'progressButtonCurrent' : 'progressButton'
    const cap = block(TYPE.numeral.font, words(`data:numerals.${i}`), TYPE.numeral.px).cap
    const label = text(`progress-${i}-numeral`, `data:numerals.${i}`, { ...TYPE.numeral, align: 'centre' }, c.x, c.y - cap / 2, { part: 'type', on: heights[kind], tone: i === current ? 'inkLight' : 'ink' })
    buttons.push(node(`progress-${i}`, kind, [c.x - d / 2, c.y - d / 2, d, d], { part: 'shell', shape: 'disc', floor: heights.progressRail, over: true, children: [label] }))
  }
  rail.children = buttons
  const rule = node('header-rule', 'rule', [LEFT, HEADER.ruleY, RIGHT - LEFT, 2], { part: 'shell' })
  return [title, rail, rule]
}

export function stepHead(step: number): LayoutNode[] {
  const out = [...header(step), text('heading', `copy:step${step}.heading`, TYPE.heading, LEFT, HEADER.headingY, { part: 'type' })]
  if (hasWords(`copy:step${step}.subline`)) out.push(text('subline', `copy:step${step}.subline`, TYPE.subline, LEFT, HEADER.sublineY, { part: 'type' }))
  return out
}

export interface FieldOptions { helper?: string; value?: string; part?: string; states?: string[] }

export function field(id: string, x: number, y: number, w: number, label: string, o: FieldOptions = {}): LayoutNode {
  const part = o.part ?? 'shell'
  const pocketY = y + 36
  const children: LayoutNode[] = [
    text(`${id}-label`, label, TYPE.label, x, y, { part: 'type' }),
    node(`${id}-pocket`, 'field', [x, pocketY, w, sizes.field], {
      part, r: 14,
      children: o.value ? [text(`${id}-value`, o.value, { ...TYPE.value, wrap: w - 48 }, x + 24, pocketY + (sizes.field - block(TYPE.value.font, 'X', TYPE.value.px).cap) / 2, { part: 'type', on: heights.field })] : []
    })
  ]
  if (o.helper) children.push(text(`${id}-helper`, o.helper, TYPE.helper, x, pocketY + sizes.field + 14, { part: 'type' }))
  const extra: Extra = o.states ? { states: o.states } : {}
  return group(id, children, extra)
}

export const FIELD_H = 36 + sizes.field

export interface ButtonOptions { hero?: boolean; part?: string; tone?: string; states?: string[] }

export function button(id: string, x: number, y: number, w: number, label: string, o: ButtonOptions = {}): LayoutNode {
  const h = o.hero ? sizes.heroButton : sizes.button
  const type = o.hero ? TYPE.hero : TYPE.button
  const part = o.part ?? 'shell'
  const gap = 5
  const cap = block(type.font, words(label), type.px).cap
  const top = text(`${id}-label`, label, { ...type, align: 'centre' }, x + w / 2, y + (h - cap) / 2, { part: 'type', on: heights.button, tone: 'inkLight' })
  const cap2 = node(`${id}-cap`, o.hero ? 'heroButton' : 'button', [x, y, w, h], { part, shape: 'capsule', height: heights.button, floor: heights.buttonSocket, tone: o.tone ?? 'accent', children: [top] })
  const extra: Extra = o.states ? { states: o.states } : {}
  return node(id, 'buttonSocket', [x - gap, y - gap, w + gap * 2, h + gap * 2], { part, shape: 'capsule', children: [cap2], ...extra })
}

export const buttonWidth = (label: string, hero = false): number => Math.round(block((hero ? TYPE.hero : TYPE.button).font, words(label), (hero ? TYPE.hero : TYPE.button).px).width + (hero ? 112 : 88))

export const page = (id: string, height: number, children: LayoutNode[]): LayoutNode => ({ id, kind: 'page', box: [0, 0, PAGE_W, height], children })

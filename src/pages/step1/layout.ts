import { config } from '../../config'
import type { LayoutNode } from '../../copy'
import { column, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, field, HEADER, LEFT, page, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { CAP_TOP, DECK, DECK_TOP, HATCH, hatchCentre, legendKey, seats } from './keyboard'

const sizes = config.scale.sizes
const heights = config.scale.heights

export const GUTTER = 56
export const COL_W = (RIGHT - LEFT - GUTTER) / 2
export const FIELD_X = RIGHT - COL_W
export const FIELD_GAP = 20
export const FIELD_PITCH = 36 + sizes.field + FIELD_GAP
export const ZONE = { x: LEFT, y: HEADER.contentY + 36, w: COL_W, h: FIELD_PITCH * 2 + sizes.field }
export const FORM_BOTTOM = ZONE.y + ZONE.h
export const FIELDS = ['firstName', 'lastName', 'email'] as const
export type FieldName = (typeof FIELDS)[number]
export const LEGEND = { font: 'inter-500', px: 22, align: 'centre' as const }
export const SLAB = { w: 440, h: 104 }
export const SLAB_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const PAPER = { w: 220, h: 300 }
export const PAPER_REST = { x: 1000, y: 748 }
export const PAPER_TITLE = { font: 'inter-600', px: 28 }
export const PAPER_LINES = [0.3, 0.38, 0.46, 0.54, 0.66, 0.74, 0.82]
export const SLOT = { w: 300, h: 26, cx: ZONE.x + ZONE.w * 0.62, cy: FORM_BOTTOM + 30 }
export const NOTE_Y = FORM_BOTTOM + 18
export const CONTINUE_Y = DECK.y + 10

const cap = (font: string, px: number): number => block(font, 'X', px).cap

export function paperNodes(x: number, y: number): LayoutNode[] {
  const out: LayoutNode[] = [text('resume-paper-title', 'copy:step1.resume.paperTitle', PAPER_TITLE, x + 24, y + 30, { part: 'type', on: heights.paper })]
  PAPER_LINES.forEach((at, i) => {
    out.push(node(`resume-paper-line-${i}`, 'paperLine', [x + 24, y + PAPER.h * at, (PAPER.w - 48) * (i === 3 || i === 6 ? 0.6 : 1), 8], { part: 'paper', height: heights.paper + 0.4, floor: heights.paper, tone: 'pocket' }))
  })
  return out
}

export function buildLayout(): LayoutNode {
  const zoneLabel = text('resume-label', 'copy:step1.resume.label', TYPE.label, LEFT, HEADER.contentY, { part: 'type' })
  const promptCap = cap(TYPE.body.font, TYPE.body.px)
  const browseW = Math.round(block(TYPE.helper.font, words('copy:step1.resume.browse'), TYPE.helper.px).width + 56)
  const browseH = 44
  const stackH = promptCap + 24 + browseH
  const promptY = ZONE.y + (ZONE.h - stackH) / 2
  const browseY = promptY + promptCap + 24
  const cx = ZONE.x + ZONE.w / 2
  const browse = node('resume-browse', 'chip', [cx - browseW / 2, browseY, browseW, browseH], {
    part: 'shell', shape: 'capsule', height: heights.card + 8, floor: heights.card, tone: 'metal', states: ['prompt'],
    children: [text('resume-browse-label', 'copy:step1.resume.browse', { ...TYPE.helper, align: 'centre' }, cx, browseY + (browseH - cap(TYPE.helper.font, TYPE.helper.px)) / 2, { part: 'type', on: heights.card + 8 })]
  })
  const received = block(TYPE.hero.font, words('copy:step1.resume.received'), TYPE.hero.px, ZONE.w - 120)
  const zone = node('resume-zone', 'card', [ZONE.x, ZONE.y, ZONE.w, ZONE.h], {
    part: 'shell', r: 20,
    children: [
      text('resume-prompt', 'copy:step1.resume.prompt', { ...TYPE.body, align: 'centre' }, cx, promptY, { part: 'type', on: heights.card, states: ['prompt'] }),
      browse,
      text('resume-received', 'copy:step1.resume.received', { ...TYPE.hero, align: 'centre', wrap: ZONE.w - 120 }, cx, ZONE.y + (ZONE.h - received.height) / 2, { part: 'type', on: heights.card, states: ['received'] })
    ]
  })
  const fields = column('fields', FIELD_X, HEADER.contentY, FIELD_GAP, FIELDS.map((name) => (x: number, y: number) => field(name, x, y, COL_W, `copy:step1.fields.${name}.label`, { value: `runtime:step1.${name}` })))
  const labelCap = cap(TYPE.label.font, TYPE.label.px)
  const helperCap = cap(TYPE.helper.font, TYPE.helper.px)
  const helper = text('firstName-helper', 'copy:step1.fields.firstName.helper', { ...TYPE.helper, align: 'right' }, RIGHT, HEADER.contentY + labelCap - helperCap, { part: 'type' })
  const accepted = text('email-accepted', 'copy:step1.emailAccepted', { ...TYPE.helper, align: 'right' }, RIGHT, HEADER.contentY + FIELD_PITCH * 2 + labelCap - helperCap, { part: 'type', states: ['accepted'] })
  const note = text('keyboard-note', 'copy:step1.keyboardNote', TYPE.helper, LEFT, NOTE_Y, { part: 'type', states: ['note'] })
  const w = buttonWidth('copy:step1.continue')
  const go = button('continue', RIGHT - 5 - w, CONTINUE_Y + 5, w, 'copy:step1.continue', { part: 'shell', tone: 'metal', states: ['closed'] })
  go.children![0]!.children![0]!.tone = 'ink'

  const keys: LayoutNode[] = seats.map((s) => {
    const key = legendKey(s.name)
    const enter = s.name === 'enter'
    const children = key ? [text(`key-${s.name}-legend`, key, LEGEND, s.cx, s.cy - cap(LEGEND.font, LEGEND.px) / 2, { part: 'type', on: CAP_TOP, tone: enter ? 'inkLight' : 'ink' })] : []
    return node(`key-${s.name}`, 'keycap', [s.x, s.y, s.w, s.h], { part: 'keyboard', r: 9, tone: enter ? 'accent' : 'raised', children })
  })
  const hatches: LayoutNode[] = ([0, 1] as const).map((side) => {
    const c = hatchCentre(side)
    return node(`hatch-${side}`, 'hatch', [c.x - HATCH / 2, c.y - HATCH / 2, HATCH, HATCH], { part: 'turrets', shape: 'disc', height: DECK_TOP + 0.6, floor: DECK_TOP, tone: 'dark' })
  })
  const deck = node('keyboard-deck', 'keyboardDeck', [DECK.x, DECK.y, DECK.w, DECK.h], { part: 'keyboard', r: 18, states: ['keyboard'], children: [...hatches, ...keys] })

  const email = fields.children![2]!.children![1]!.box
  const slabX = email[0]! + email[2]! / 2 - SLAB.w / 2
  const slabY = email[1]! + email[3]! / 2 - SLAB.h / 2
  const slab = node('email-slab', 'slab', [slabX, slabY, SLAB.w, SLAB.h], {
    part: 'slabs', r: 10, over: true, states: ['slab'],
    children: [text('email-slab-label', 'copy:step1.emailError', SLAB_TYPE, slabX + SLAB.w / 2, slabY + (SLAB.h - cap(SLAB_TYPE.font, SLAB_TYPE.px)) / 2, { part: 'type', on: heights.slab, tone: 'inkLight' })]
  })
  const paper = node('resume-paper', 'paper', [PAPER_REST.x, PAPER_REST.y, PAPER.w, PAPER.h], { part: 'paper', over: true, states: ['paper'], children: paperNodes(PAPER_REST.x, PAPER_REST.y) })

  return page('step1', SCREEN_H, [...stepHead(1), zoneLabel, zone, fields, helper, accepted, note, go, deck, slab, paper])
}

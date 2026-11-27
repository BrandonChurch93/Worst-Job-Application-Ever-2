import { config } from '../../config'
import type { LayoutNode } from '../../copy'
import { node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, field, HEADER, LEFT, page, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { CAP_TOP, DECK, DECK_TOP, HATCH, hatchCentre, legendKey, seats, typed } from './keyboard'
import { FORM_BOTTOM, resumeNodes } from './resume/layout'

const heights = config.scale.heights

export { COL_W, FORM_BOTTOM, GLYPH, GUTTER, PAPER, PAPER_LINES, PAPER_REST, PAPER_TITLE, paperNodes, SLOT, uploadGlyph, ZONE } from './resume/layout'

// One field at a time. Step 1 has three stages in this order, and each has the page to itself: the header and its rail stay, everything under the step head belongs to the stage.
export const STAGES = ['name', 'email', 'resume'] as const
export type StageName = (typeof STAGES)[number]
export const stageState = (name: StageName): string => `stage-${name}`
// The typed fields, in order. Each is the one field of its stage.
export const FIELDS = ['name', 'email'] as const
export type FieldName = (typeof FIELDS)[number]
// Where the one field of a stage stands: the full width of the content, under the step head with air above it.
export const FIELD = { x: LEFT, y: HEADER.contentY + 72, w: RIGHT - LEFT }
export const FIELD_X = FIELD.x
export const FIELD_Y = FIELD.y
const LABEL: Record<FieldName, string> = { name: 'copy:drafts.step1.name.label', email: 'copy:step1.fields.email.label' }
export const LEGEND = { font: 'inter-500', px: 26, align: 'centre' as const }
export const LEGEND_WORD = { font: 'inter-500', px: 20, align: 'centre' as const }
export const SLAB = { w: 440, h: 104 }
export const SLAB_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const NOTE_Y = FORM_BOTTOM + 24
export const CONTINUE_Y = DECK.y + 10

const cap = (font: string, px: number): number => block(font, 'X', px).cap

export function buildLayout(): LayoutNode {
  const fields = FIELDS.map((name) => field(name, FIELD.x, FIELD.y, FIELD.w, LABEL[name], { value: `runtime:step1.${name}`, states: [stageState(name)], ...(name === 'name' ? { helper: 'copy:step1.fields.firstName.helper' } : {}) }))
  const labelCap = cap(TYPE.label.font, TYPE.label.px)
  const helperCap = cap(TYPE.helper.font, TYPE.helper.px)
  const accepted = text('email-accepted', 'copy:step1.emailAccepted', { ...TYPE.helper, align: 'right' }, RIGHT, FIELD.y + labelCap - helperCap, { part: 'type', states: ['accepted'] })
  const note = text('keyboard-note', 'copy:step1.keyboardNote', TYPE.helper, LEFT, NOTE_Y, { part: 'type', states: ['note'] })
  const w = buttonWidth('copy:step1.continue')
  const go = button('continue', RIGHT - 5 - w, CONTINUE_Y + 5, w, 'copy:step1.continue', { part: 'shell', tone: 'metal', states: ['closed'] })
  go.children![0]!.children![0]!.tone = 'ink'

  const keys: LayoutNode[] = seats.map((s) => {
    const key = legendKey(s.name)
    const enter = s.name === 'enter'
    const type = typed(s.name) === null ? LEGEND_WORD : LEGEND
    const children = key ? [text(`key-${s.name}-legend`, key, type, s.cx, s.cy - cap(type.font, type.px) / 2, { part: 'type', on: CAP_TOP, tone: enter ? 'inkLight' : 'ink' })] : []
    return node(`key-${s.name}`, 'keycap', [s.x, s.y, s.w, s.h], { part: 'keyboard', r: 9, tone: enter ? 'accent' : 'raised', children })
  })
  const hatches: LayoutNode[] = ([0, 1] as const).map((side) => {
    const c = hatchCentre(side)
    return node(`hatch-${side}`, 'hatch', [c.x - HATCH / 2, c.y - HATCH / 2, HATCH, HATCH], { part: 'turrets', shape: 'disc', height: DECK_TOP + 0.6, floor: DECK_TOP, tone: 'dark' })
  })
  const deck = node('keyboard-deck', 'keyboardDeck', [DECK.x, DECK.y, DECK.w, DECK.h], { part: 'keyboard', r: 18, states: ['keyboard'], children: [...hatches, ...keys] })

  const email = fields[1]!.children![1]!.box
  const slabX = email[0]! + email[2]! / 2 - SLAB.w / 2
  const slabY = email[1]! + email[3]! / 2 - SLAB.h / 2
  const slab = node('email-slab', 'slab', [slabX, slabY, SLAB.w, SLAB.h], {
    part: 'slabs', r: 10, over: true, states: ['slab'],
    children: [text('email-slab-label', 'copy:step1.emailError', SLAB_TYPE, slabX + SLAB.w / 2, slabY + (SLAB.h - cap(SLAB_TYPE.font, SLAB_TYPE.px)) / 2, { part: 'type', on: heights.slab, tone: 'inkLight' })]
  })

  return page('step1', SCREEN_H, [...stepHead(1), ...fields, accepted, note, go, deck, slab, ...resumeNodes()])
}

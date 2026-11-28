import { config } from '../../../config'
import type { LayoutNode } from '../../../copy'
import { node, text } from '../../../shell/layout'
import { block } from '../../../shell/metrics'
import { HEADER, LEFT, RIGHT, TYPE } from '../../../shell/parts'
import { words } from '../../../shell/words'

const sizes = config.scale.sizes
const heights = config.scale.heights

// The stage of the resume: one name of a layout state that shows its nodes and no other stage's.
export const STAGE = 'stage-resume'
export const GUTTER = 56
export const COL_W = (RIGHT - LEFT - GUTTER) / 2
// The right edge the film's tug frame keeps clear of: where the right half of the page begins.
export const HALF_X = RIGHT - COL_W
// The drop zone keeps the place and size it had beside the three fields: as tall as three fields, their two gaps and one helper line.
const ZONE_H = 3 * sizes.field + 2 * 48 + 34
export const ZONE = { x: LEFT, y: HEADER.contentY + 36, w: COL_W, h: ZONE_H }
export const FORM_BOTTOM = ZONE.y + ZONE.h
export const PAPER = { w: 64, h: 88, inset: 5, top: 14, bar: 2 }
export const PAPER_REST = { x: 640, y: 678 }
export const PAPER_TITLE = { font: 'inter-600', px: 14 }
export const PAPER_LINES = [0.36, 0.44, 0.52, 0.6, 0.7, 0.78, 0.86]
export const SLOT = { w: 96, h: 10, cx: ZONE.x + ZONE.w * 0.84, cy: FORM_BOTTOM + 9 }

const cap = (font: string, px: number): number => block(font, 'X', px).cap

const BROWSE_H = 50
export const GLYPH = { w: 64, h: 54, line: 3, gap: 22 }
const promptTop = (): number => ZONE.y + (ZONE.h - (GLYPH.h + GLYPH.gap + cap(TYPE.body.font, TYPE.body.px) + 24 + BROWSE_H)) / 2 + GLYPH.h + GLYPH.gap
export function uploadGlyph(): { x: number; y: number; w: number; h: number; rot: number }[] {
  const top = promptTop() - GLYPH.gap - GLYPH.h
  const stroke = (x0: number, y0: number, x1: number, y1: number): { x: number; y: number; w: number; h: number; rot: number } => {
    const len = Math.hypot(x1 - x0, y1 - y0) + GLYPH.line
    const flat = y0 === y1
    const w = flat ? len : GLYPH.line
    const h = flat ? GLYPH.line : len
    return { x: ZONE.x + ZONE.w / 2 + (x0 + x1) / 2 - w / 2, y: top + (y0 + y1) / 2 - h / 2, w, h, rot: flat ? 0 : Math.atan2(x1 - x0, y0 - y1) }
  }
  return [
    stroke(-GLYPH.w / 2, 36, -GLYPH.w / 2, GLYPH.h), stroke(-GLYPH.w / 2, GLYPH.h, GLYPH.w / 2, GLYPH.h), stroke(GLYPH.w / 2, GLYPH.h, GLYPH.w / 2, 36),
    stroke(0, 40, 0, 2), stroke(0, 2, -14, 16), stroke(0, 2, 14, 16)
  ]
}

export function paperNodes(x: number, y: number): LayoutNode[] {
  const out: LayoutNode[] = [text('resume-paper-title', 'copy:step1.resume.paperTitle', PAPER_TITLE, x + PAPER.inset, y + PAPER.top, { part: 'paper', on: heights.paper })]
  PAPER_LINES.forEach((at, i) => {
    out.push(node(`resume-paper-line-${i}`, 'paperLine', [x + PAPER.inset, y + PAPER.h * at, (PAPER.w - PAPER.inset * 2) * (i === 3 || i === 6 ? 0.6 : 1), PAPER.bar], { part: 'paper', height: heights.paper + 0.4, floor: heights.paper, tone: 'pocket' }))
  })
  return out
}

// The nodes of the stage at rest: its label, the drop zone with its prompt, its chip and its last message, and the sheet. The label and the zone show in the layout state `STAGE`; inside the zone `prompt` and `received` pick what it says; the sheet shows in `paper`.
export function resumeNodes(): LayoutNode[] {
  const zoneLabel = text('resume-label', 'copy:step1.resume.label', TYPE.label, LEFT, HEADER.contentY, { part: 'type', states: [STAGE] })
  const promptCap = cap(TYPE.body.font, TYPE.body.px)
  const browseW = Math.round(block(TYPE.label.font, words('copy:step1.resume.browse'), TYPE.label.px).width + 64)
  const browseH = BROWSE_H
  const promptY = promptTop()
  const browseY = promptY + promptCap + 24
  const cx = ZONE.x + ZONE.w / 2
  const browse = node('resume-browse', 'chip', [cx - browseW / 2, browseY, browseW, browseH], {
    part: 'shell', shape: 'capsule', height: heights.card + 8, floor: heights.card, tone: 'metal', states: ['prompt'],
    children: [text('resume-browse-label', 'copy:step1.resume.browse', { ...TYPE.label, align: 'centre' }, cx, browseY + (browseH - cap(TYPE.label.font, TYPE.label.px)) / 2, { part: 'type', on: heights.card + 8, tone: 'inkLight' })]
  })
  const received = block(TYPE.hero.font, words('copy:step1.resume.received'), TYPE.hero.px, ZONE.w - 120)
  const zone = node('resume-zone', 'card', [ZONE.x, ZONE.y, ZONE.w, ZONE.h], {
    part: 'shell', r: 20, states: [STAGE],
    children: [
      text('resume-prompt', 'copy:step1.resume.prompt', { ...TYPE.body, align: 'centre' }, cx, promptY, { part: 'type', on: heights.card, states: ['prompt'] }),
      browse,
      text('resume-received', 'copy:step1.resume.received', { ...TYPE.hero, align: 'centre', wrap: ZONE.w - 120 }, cx, ZONE.y + (ZONE.h - received.height) / 2, { part: 'type', on: heights.card, states: ['received'] })
    ]
  })
  const paper = node('resume-paper', 'paper', [PAPER_REST.x, PAPER_REST.y, PAPER.w, PAPER.h], { part: 'paper', over: true, states: ['paper'], children: paperNodes(PAPER_REST.x, PAPER_REST.y) })
  return [zoneLabel, zone, paper]
}

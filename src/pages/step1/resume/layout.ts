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
// The folder window: a pane of glass that comes up out of the page on the bare half beside the drop zone, with a bar across its head, a knob on the bar, and one tile that holds the one file. `top` is how high the pane stands once it is up.
export const WIN = { x: HALF_X + 12, y: ZONE.y + 4, w: 500, h: 314, r: 18, top: heights.card + 2 }
export const BAR = { inset: 12, h: 52, up: 5, r: 12, knob: 20 }
export const TILE = { x: WIN.x + 40, y: WIN.y + BAR.inset + BAR.h + 26, w: 196, h: 184, r: 14, up: 3 }
// The rim that lights round the tile under the arrow and when the file is picked: orange, this far outside the tile and this high.
export const RING = { out: 5, up: 1.2 }
// The sheet lies in the tile as the file's own picture, and comes down in the drop zone on its upload mark.
export const PAPER_REST = { x: TILE.x + (TILE.w - PAPER.w) / 2, y: TILE.y + 20 }
export const FILE_TYPE = { font: 'inter-500', px: 24, align: 'centre' as const }
export const WIN_TYPE = { font: 'inter-600', px: 26 }
export const PAPER_TITLE = { font: 'inter-600', px: 14 }
export const PAPER_LINES = [0.36, 0.44, 0.52, 0.6, 0.7, 0.78, 0.86]
export const SLOT = { w: 96, h: 10, cx: ZONE.x + ZONE.w * 0.84, cy: FORM_BOTTOM + 9 }
// The machine's name plate: orange plastic beside the slot, on the side the tug does not use, its type large enough to be read at half size.
export const PLATE_TYPE = { font: 'inter-600', px: 34, align: 'centre' as const }
export const PLATE = { pad: 22, h: 52, gap: 18, thick: 8, r: 10 }
export const plateBox = (): { x: number; y: number; w: number; h: number } => {
  const w = Math.round(block(PLATE_TYPE.font, words('copy:drafts.step1.resume.shredderLabel'), PLATE_TYPE.px).width + PLATE.pad * 2)
  return { x: SLOT.cx - SLOT.w / 2 - PLATE.gap - w, y: FORM_BOTTOM + 8, w, h: PLATE.h }
}

const cap = (font: string, px: number): number => block(font, 'X', px).cap

const BROWSE_H = 50
const browseWide = (): number => Math.round(block(TYPE.label.font, words('copy:step1.resume.browse'), TYPE.label.px).width + 64)
// Where Browse files stands in the drop zone.
export const browseBox = (): { x: number; y: number; w: number; h: number } => ({ x: ZONE.x + ZONE.w / 2 - browseWide() / 2, y: promptTop() + cap(TYPE.body.font, TYPE.body.px) + 24, w: browseWide(), h: BROWSE_H })
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

// The spot where the sheet comes down in the drop zone: on the upload mark.
export const landing = (): { x: number; y: number } => ({ x: ZONE.x + ZONE.w / 2 - PAPER.w / 2, y: promptTop() - GLYPH.gap - GLYPH.h - 20 })

// The folder window, shown in the layout state `folder`: the pane, its bar with a knob and the folder's name, the tile and the file's name under where the sheet lies.
export function folderNode(): LayoutNode {
  const bar = { x: WIN.x + BAR.inset, y: WIN.y + BAR.inset, w: WIN.w - BAR.inset * 2, h: BAR.h }
  const barTop = WIN.top + BAR.up
  const knob = node('resume-folder-knob', 'knob', [bar.x + 16, bar.y + (bar.h - BAR.knob) / 2, BAR.knob, BAR.knob], { part: 'shell', shape: 'disc', floor: barTop, height: barTop + 4, tone: 'accent' })
  const title = text('resume-folder-title', 'copy:drafts.step1.resume.folderTitle', WIN_TYPE, bar.x + 16 + BAR.knob + 16, bar.y + (bar.h - cap(WIN_TYPE.font, WIN_TYPE.px)) / 2, { part: 'type', on: barTop, tone: 'inkLight' })
  const head = node('resume-folder-bar', 'windowBar', [bar.x, bar.y, bar.w, bar.h], { part: 'shell', r: BAR.r, floor: WIN.top, height: barTop, tone: 'metal', children: [knob, title] })
  const tileTop = WIN.top + TILE.up
  const name = text('resume-file-name', 'copy:drafts.step1.resume.fileName', FILE_TYPE, TILE.x + TILE.w / 2, PAPER_REST.y + PAPER.h + 22, { part: 'type', on: tileTop })
  const tile = node('resume-file', 'fileTile', [TILE.x, TILE.y, TILE.w, TILE.h], { part: 'shell', r: TILE.r, floor: WIN.top, height: tileTop, tone: 'raised', children: [name] })
  return node('resume-folder', 'card', [WIN.x, WIN.y, WIN.w, WIN.h], { part: 'shell', r: WIN.r, height: WIN.top, over: true, states: ['folder'], children: [head, tile] })
}

// The name plate of the machine, shown in the layout state `shredder`.
export function plateNode(): LayoutNode {
  const b = plateBox()
  const label = text('resume-shredder-label', 'copy:drafts.step1.resume.shredderLabel', PLATE_TYPE, b.x + b.w / 2, b.y + (b.h - cap(PLATE_TYPE.font, PLATE_TYPE.px)) / 2, { part: 'type', on: PLATE.thick, tone: 'inkLight' })
  return node('resume-shredder-plate', 'namePlate', [b.x, b.y, b.w, b.h], { part: 'shell', r: PLATE.r, height: PLATE.thick, tone: 'accent', over: true, states: ['shredder'], children: [label] })
}

// The nodes of the stage at rest: its label, the drop zone with its prompt, its chip and its last message, and the sheet. The label and the zone show in the layout state `STAGE`; inside the zone `prompt` and `received` pick what it says; the sheet shows in `paper`.
export function resumeNodes(): LayoutNode[] {
  const zoneLabel = text('resume-label', 'copy:step1.resume.label', TYPE.label, LEFT, HEADER.contentY, { part: 'type', states: [STAGE] })
  const promptCap = cap(TYPE.body.font, TYPE.body.px)
  const browseW = browseWide()
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
  return [zoneLabel, zone, folderNode(), plateNode(), paper]
}

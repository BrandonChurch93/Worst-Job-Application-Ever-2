import { config } from '../../config'
import type { LayoutNode } from '../../copy'
import { boxOf, group, node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, LEFT, page, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import type { TypeSpec } from '../../stage/types'

const heights = config.scale.heights
const sizes = config.scale.sizes

export const TOP = 296
export const GUTTER = 48
export const COLUMN = (RIGHT - LEFT - GUTTER) / 2
export const CONTENT_H = 560
export const BOTTOM = TOP + CONTENT_H
export const RIGHT_X = LEFT + COLUMN + GUTTER
export const CENTRE = (LEFT + RIGHT) / 2

export const COUNTER_TOP = heights.card + 6
export const READOUT_TOP = heights.card + 4
export const STAMP = { blockTop: heights.machineMinTop + 58, gripTop: heights.machineMinTop + 134, high: 120 }
const SHOWN = ['decided', 'link', 'shared']
// The wait panel lies lower than the two columns that follow it, nearer the middle of the page under the heading.
export const WAIT = { top: TOP + 52, h: 528 }
export const PANEL_H = 322
// The mark lies just inside the lower right corner of the sheet: the insets of its turned outline from the sheet's right and lower edges.
export const MARK_AT = { right: 46, bottom: 42 }
// Where the stamp lies at rest: the middle of its block from the right column's left edge and from the columns' lower line.
export const REST_AT = { x: 200, up: 122 }
export const MARK_ROT = -0.27
// The sheet lies square on the page, so its top edge is on the panel's line and its paragraphs share one left edge.
export const SHEET_ROT = 0

const T = {
  waitTitle: { font: 'inter-display-600', px: 44 },
  waitValue: { font: 'inter-display-600', px: 112, align: 'centre' },
  letterTitle: { font: 'inter-display-600', px: 40 },
  letterBody: { font: 'inter-400', px: 24, wrap: COLUMN - 152, lead: 38 },
  mark: { font: 'inter-display-600', px: 68, align: 'centre' },
  panelTitle: { font: 'inter-600', px: 28 },
  readout: { font: 'inter-display-600', px: 58 },
  caption: { font: 'inter-400', px: 20 },
  link: { font: 'inter-500', px: 20, align: 'centre' }
} satisfies Record<string, TypeSpec>

// The letter's print: its inset from the sheet's left and top, the room under its title and the room between its two paragraphs.
export const LETTER_PAD = { x: 76, y: 76, title: 52, para: 52 }

const cap = (t: TypeSpec): number => block(t.font, 'X', t.px).cap

export const KEYS = {
  waitValue: 'copy:step5.wait.value',
  waitCount: 'runtime:step5.waitValue',
  yourTime: 'runtime:step5.yourTime',
  averageCount: 'runtime:step5.averageTime',
  targetCount: 'runtime:step5.targetTime',
  averageValue: 'copy:step5.metrics.averageTimeValue',
  targetValue: 'copy:step5.metrics.targetTimeValue',
  shareText: 'copy:step5.shareText',
  shareLine: 'runtime:step5.shareText'
} as const

function waitPanel(): LayoutNode {
  const pad = 64
  const x = LEFT + pad
  const on = heights.card
  const titleY = WAIT.top + pad
  const labelY = titleY + cap(T.waitTitle) + 48
  const counterY = labelY + cap(TYPE.value) + 22
  const counterH = 212
  const bodyY = counterY + counterH + 40
  const valueY = counterY + (counterH - cap(T.waitValue)) / 2
  const value = words(KEYS.waitValue)
  const counter = node('wait-counter', 'counter', [x, counterY, RIGHT - LEFT - pad * 2, counterH], {
    part: 'wait', height: COUNTER_TOP, floor: on, tone: 'dark', r: 18,
    children: [
      text('wait-value', KEYS.waitValue, T.waitValue, CENTRE, valueY, { part: 'wait', on: COUNTER_TOP, tone: 'inkLight', states: ['waiting'] }),
      text('wait-count', KEYS.waitCount, T.waitValue, CENTRE, valueY, { part: 'wait', on: COUNTER_TOP, tone: 'inkLight', states: ['spinning'], runtime: value })
    ]
  })
  return node('wait-panel', 'card', [LEFT, WAIT.top, RIGHT - LEFT, WAIT.h], {
    part: 'wait', r: 24, states: ['wait'],
    children: [
      text('wait-title', 'copy:transitions.step5', T.waitTitle, x, titleY, { part: 'type', on }),
      text('wait-label', 'copy:step5.wait.label', TYPE.value, x, labelY, { part: 'type', on }),
      counter,
      text('wait-body', 'copy:step5.wait.body', TYPE.subline, x, bodyY, { part: 'type', on })
    ]
  })
}

function letter(): LayoutNode {
  const x = LEFT + LETTER_PAD.x
  const on = heights.paper
  const titleY = TOP + LETTER_PAD.y
  const bodyY = titleY + cap(T.letterTitle) + LETTER_PAD.title
  const body = text('letter-body', 'copy:step5.letter.body', T.letterBody, x, bodyY, { part: 'type', on })
  const closingY = bodyY + body.box[3]! + LETTER_PAD.para
  const mark = markOf()
  const stamp = text('letter-stamp', 'copy:step5.letter.stamp', T.mark, mark.cx, mark.cy - cap(T.mark) / 2, { part: 'stamp', on, tone: 'dark' })
  return node('letter', 'paper', [LEFT, TOP, COLUMN, CONTENT_H], {
    part: 'letter', states: SHOWN,
    children: [
      text('letter-title', 'copy:step5.letter.title', T.letterTitle, x, titleY, { part: 'type', on }),
      body,
      text('letter-closing', 'copy:step5.letter.closing', T.letterBody, x, closingY, { part: 'type', on }),
      node('letter-mark', 'mark', [mark.cx - mark.w / 2, mark.cy - mark.h / 2, mark.w, mark.h], { part: 'stamp', shape: 'none', states: ['stamped'], children: [stamp] })
    ]
  })
}

// Where the cursor waits: on the bare glass under the counter, right of the line of print there.
export const waitSpotOf = (): { x: number; y: number } => ({ x: RIGHT - 330, y: WAIT.top + WAIT.h - 92 })

export interface Mark { cx: number; cy: number; w: number; h: number; bar: number; blockW: number; blockH: number }

let made: Mark | null = null

export function markOf(): Mark {
  if (made) return made
  const said = block(T.mark.font, words('copy:step5.letter.stamp'), T.mark.px)
  const w = Math.round(said.width + 48)
  const h = Math.round(said.cap + 52)
  const blockW = w + 4
  const blockH = h + 64
  const c = Math.abs(Math.cos(MARK_ROT))
  const t = Math.abs(Math.sin(MARK_ROT))
  made = { cx: LEFT + COLUMN - MARK_AT.right - (w / 2) * c - (h / 2) * t, cy: BOTTOM - MARK_AT.bottom - (w / 2) * t - (h / 2) * c, w, h, bar: 10, blockW, blockH }
  return made
}

export function turned(m: { cx: number; cy: number }, lx: number, ly: number, rot: number = MARK_ROT): { x: number; y: number } {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return { x: m.cx + lx * c - ly * s, y: m.cy + lx * s + ly * c }
}

// Where the cursor stands when the block strikes: its tip under the block's lower edge, clear of the mark, so that its tail is left in sight under the edge.
export const SPOT = { fromRight: 70, fromEdge: 8 }
export const spotOf = (): { x: number; y: number } => {
  const m = markOf()
  return turned(m, m.blockW / 2 - SPOT.fromRight, m.blockH / 2 - SPOT.fromEdge)
}

function metrics(): LayoutNode {
  const pad = 48
  const x = RIGHT_X + pad
  const on = heights.card
  const gap = 24
  const tileW = (COLUMN - pad * 2 - gap * 2) / 3
  const titleY = TOP + pad - 6
  const tilesY = titleY + cap(T.panelTitle) + 32
  const inner = 26
  const labelY = tilesY + inner
  const valueY = labelY + cap(T.caption) + 22
  const tileH = Math.round(valueY + cap(T.readout) + inner + 2 - tilesY)
  const applicantY = tilesY + tileH + 30
  const height = PANEL_H
  const tile = (i: number, id: string, label: string, values: LayoutNode[]): LayoutNode => {
    const tx = x + i * (tileW + gap)
    for (const v of values) v.box[0] = tx + inner
    return node(`metrics-${id}`, 'readout', [tx, tilesY, tileW, tileH], {
      part: 'metrics', height: READOUT_TOP, floor: on, tone: 'glass', r: 14,
      children: [text(`metrics-${id}-label`, label, T.caption, tx + inner, labelY, { part: 'type', on: READOUT_TOP }), ...values]
    })
  }
  const run = (id: string, key: string, states?: string[]): LayoutNode =>
    text(id, key, { ...T.readout, wrap: tileW - inner * 2 }, 0, valueY, { part: 'type', on: READOUT_TOP, runtime: '00:00', ...(states ? { states } : {}) })
  const fixed = (id: string, key: string): LayoutNode => text(id, key, T.readout, 0, valueY, { part: 'type', on: READOUT_TOP, states: ['counted'] })
  return node('metrics', 'card', [RIGHT_X, TOP, COLUMN, height], {
    part: 'metrics', r: 24, states: SHOWN,
    children: [
      text('metrics-title', 'copy:step5.metrics.title', T.panelTitle, x, titleY, { part: 'type', on }),
      node('metrics-readouts', 'row', [x, tilesY, COLUMN - pad * 2, tileH], {
        flow: 'row', gap,
        children: [
          tile(0, 'your', 'copy:step5.metrics.yourTime', [run('metrics-your-value', KEYS.yourTime)]),
          tile(1, 'average', 'copy:step5.metrics.averageTime', [run('metrics-average-count', KEYS.averageCount, ['counting']), fixed('metrics-average-value', KEYS.averageValue)]),
          tile(2, 'target', 'copy:step5.metrics.targetTime', [run('metrics-target-count', KEYS.targetCount, ['counting']), fixed('metrics-target-value', KEYS.targetValue)])
        ]
      }),
      text('metrics-applicant', 'copy:step5.metrics.applicant', TYPE.body, x, applicantY, { part: 'type', on })
    ]
  })
}

function stampAtRest(): LayoutNode {
  const m = markOf()
  const BLOCK = { w: m.blockW, h: m.blockH }
  const x = RIGHT_X + REST_AT.x - Math.round(BLOCK.w / 2)
  const y = BOTTOM - REST_AT.up - Math.round(BLOCK.h / 2)
  const gripW = Math.round(BLOCK.w * 0.5)
  const gripH = Math.round(BLOCK.h * 0.6)
  return node('stamp', 'stamp', [x, y, BLOCK.w, BLOCK.h], {
    part: 'stamp', shape: 'none', states: SHOWN,
    children: [
      node('stamp-block', 'stampBlock', [x, y, BLOCK.w, BLOCK.h], {
        part: 'stamp', height: STAMP.blockTop, tone: 'danger', r: 16, mechanism: true,
        children: [node('stamp-grip', 'stampGrip', [x + (BLOCK.w - gripW) / 2, y + (BLOCK.h - gripH) / 2, gripW, gripH], { part: 'stamp', shape: 'capsule', height: STAMP.gripTop, floor: STAMP.blockTop, tone: 'raised', mechanism: true })]
      })
    ]
  })
}

function controls(): LayoutNode[] {
  const w = buttonWidth('copy:step5.accept', true)
  const y = BOTTOM + GUTTER
  const accept = button('accept', CENTRE - w / 2, y, w, 'copy:step5.accept', { hero: true, part: 'shell', states: SHOWN })
  const linkY = y + sizes.heroButton + 34
  const link = text('share-link', 'copy:step5.share', T.link, CENTRE, linkY, { part: 'type' })
  const rule = node('share-rule', 'underline', [link.box[0]!, linkY + cap(T.link) + 3, link.box[2]!, 1.5], { part: 'metrics', tone: 'ink', height: 0.05 })
  const share = group('share', [link, rule], { states: ['link'] })
  const sample = words(KEYS.shareText).replace('{time}', '00:00')
  const line = text('share-line', KEYS.shareLine, T.link, CENTRE, linkY, { part: 'type', states: ['shared'], runtime: sample })
  return [accept, share, line]
}

export function makeLayout(): LayoutNode {
  return page('step5', SCREEN_H, [...stepHead(5), waitPanel(), letter(), metrics(), stampAtRest(), ...controls()])
}

export interface Places {
  wait: { cx: number; cy: number }
  letter: { cx: number; cy: number }
  accept: ReturnType<typeof boxOf>
  share: ReturnType<typeof boxOf>
  rest: { cx: number; cy: number }
}

export function placesOf(tree: LayoutNode): Places {
  const counter = boxOf(tree, 'wait-counter')
  const sheet = boxOf(tree, 'letter')
  const stamp = boxOf(tree, 'stamp')
  return { wait: { cx: counter.cx, cy: counter.cy }, letter: { cx: sheet.cx, cy: sheet.cy }, accept: boxOf(tree, 'accept-cap'), share: boxOf(tree, 'share'), rest: { cx: stamp.cx, cy: stamp.cy } }
}

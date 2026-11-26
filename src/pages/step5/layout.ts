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
export const CONTENT_H = 528
export const BOTTOM = TOP + CONTENT_H
export const RIGHT_X = LEFT + COLUMN + GUTTER
export const CENTRE = (LEFT + RIGHT) / 2

export const COUNTER_TOP = heights.card + 6
export const READOUT_TOP = heights.card + 4
export const STAMP = { blockTop: heights.machineMinTop + 16, gripTop: heights.machineMinTop + 54 }
const SHOWN = ['decided', 'link', 'shared']
export const MARK_ROT = -0.14

const T = {
  waitTitle: { font: 'inter-display-600', px: 44 },
  waitValue: { font: 'inter-display-600', px: 112, align: 'centre' },
  letterTitle: { font: 'inter-display-600', px: 40 },
  letterBody: { font: 'inter-400', px: 24, wrap: COLUMN - 128, lead: 38 },
  mark: { font: 'inter-display-600', px: 68, align: 'centre' },
  panelTitle: { font: 'inter-600', px: 28 },
  readout: { font: 'inter-display-600', px: 56 },
  link: { font: 'inter-500', px: 20, align: 'centre' }
} satisfies Record<string, TypeSpec>

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
  const titleY = TOP + pad
  const labelY = titleY + cap(T.waitTitle) + 48
  const counterY = labelY + cap(TYPE.value) + 22
  const counterH = 212
  const bodyY = counterY + counterH + 40
  const valueY = counterY + (counterH - cap(T.waitValue)) / 2
  const value = words(KEYS.waitValue)
  const counter = node('wait-counter', 'counter', [x, counterY, RIGHT - LEFT - pad * 2, counterH], {
    part: 'wait', height: COUNTER_TOP, floor: on, tone: 'dark', r: 18,
    children: [
      text('wait-value', KEYS.waitValue, T.waitValue, CENTRE, valueY, { part: 'type', on: COUNTER_TOP, tone: 'inkLight', states: ['waiting'] }),
      text('wait-count', KEYS.waitCount, T.waitValue, CENTRE, valueY, { part: 'type', on: COUNTER_TOP, tone: 'inkLight', states: ['spinning'], runtime: value })
    ]
  })
  return node('wait-panel', 'card', [LEFT, TOP, RIGHT - LEFT, CONTENT_H], {
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
  const pad = 64
  const x = LEFT + pad
  const on = heights.paper
  const titleY = TOP + pad
  const bodyY = titleY + cap(T.letterTitle) + 44
  const body = text('letter-body', 'copy:step5.letter.body', T.letterBody, x, bodyY, { part: 'type', on })
  const closingY = bodyY + body.box[3]! + T.letterBody.lead
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

export interface Mark { cx: number; cy: number; w: number; h: number; bar: number; blockW: number; blockH: number }

let made: Mark | null = null

export function markOf(): Mark {
  if (made) return made
  const said = block(T.mark.font, words('copy:step5.letter.stamp'), T.mark.px)
  const w = Math.round(said.width + 64)
  const h = Math.round(said.cap + 60)
  const blockW = w + 176
  const blockH = h + 30
  const lift = Math.abs(Math.sin(MARK_ROT)) * (blockW / 2)
  made = { cx: LEFT + COLUMN - 28 - blockW / 2, cy: BOTTOM - 36 - blockH / 2 - lift, w, h, bar: 7, blockW, blockH }
  return made
}

export function turned(m: { cx: number; cy: number }, lx: number, ly: number, rot: number = MARK_ROT): { x: number; y: number } {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return { x: m.cx + lx * c - ly * s, y: m.cy + lx * s + ly * c }
}

export const spotOf = (): { x: number; y: number } => {
  const m = markOf()
  return turned(m, m.w / 2 + 24, -36)
}

function metrics(): LayoutNode {
  const pad = 48
  const x = RIGHT_X + pad
  const on = heights.card
  const gap = 24
  const tileW = (COLUMN - pad * 2 - gap * 2) / 3
  const titleY = TOP + pad
  const tilesY = titleY + cap(T.panelTitle) + 40
  const inner = 26
  const labelY = tilesY + inner
  const valueY = labelY + cap(TYPE.label) + 22
  const tileH = Math.round(valueY + cap(T.readout) + inner + 2 - tilesY)
  const applicantY = tilesY + tileH + 36
  const height = CONTENT_H - GUTTER - markOf().blockH
  const tile = (i: number, id: string, label: string, values: LayoutNode[]): LayoutNode => {
    const tx = x + i * (tileW + gap)
    for (const v of values) v.box[0] = tx + inner
    return node(`metrics-${id}`, 'readout', [tx, tilesY, tileW, tileH], {
      part: 'metrics', height: READOUT_TOP, floor: on, tone: 'light', r: 14,
      children: [text(`metrics-${id}-label`, label, TYPE.label, tx + inner, labelY, { part: 'type', on: READOUT_TOP }), ...values]
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
  const x = RIGHT_X
  const y = BOTTOM - BLOCK.h
  const gripW = Math.round(BLOCK.w * 0.56)
  const gripH = Math.round(BLOCK.h * 0.46)
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
  const rule = node('share-rule', 'rule', [link.box[0]!, linkY + cap(T.link) + 7, link.box[2]!, 2], { part: 'shell', tone: 'ink' })
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

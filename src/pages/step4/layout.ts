import { config } from '../../config'
import { copy, type LayoutNode } from '../../copy'
import { boxOf, column, group, node, row, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, LEFT, page, RIGHT, SCREEN_H, stepHead, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import { ARENA, FALLEN, HOME, SLAB_H, SOCKET } from '../../boss/plan'
import { BANNER_LEFT, POPUP_RIGHT, RACK_GAP } from '../../boss/tune'
import type { BannerPlan, Box, PopupPlan, SlabPlan, WeaponPlan } from '../../boss/weapons'

const heights = config.scale.heights
const sizes = config.scale.sizes

export const SLAB_TYPE = { font: 'inter-600', px: 26 }
export const SLAB_KEYS = copy.step4.errorSlabs.map((_, i) => `copy:step4.errorSlabs.${i}`)
export const POPUPS = copy.step4.popups.map((p, i) => ({ title: `copy:step4.popups.${i}.title`, buttons: p.buttons.map((_, j) => `copy:step4.popups.${i}.buttons.${j}`) }))
export const BANNER_KEY = 'copy:step4.errorSlabs.2'
export const BANNER_TYPE = { font: 'inter-600', px: 30 }
export const OPEN = ['confirmed-film', 'doubt', 'confirmed-live']


export interface Step4Layout {
  tree: LayoutNode
  card: Box
  checkbox: Box
  checkRow: Box
  socket: Box
  cap: Box
  track: Box
  weapons: WeaponPlan
  defeated: Box
  fold: number
  rule: Box
}

const CONTENT_Y = 336
const HEALTH_GAP = 58
const SUBLINE_Y = 266

export function makeLayout(): Step4Layout {
  const cardX = LEFT
  const cardY = CONTENT_Y
  const cardW = 680
  const pad = 32
  const on = { part: 'type', on: heights.card }
  const inner = column('verify-inner', cardX + pad, cardY + pad, 28, [
    (x, y) => text('verify-title', 'copy:step4.verify.title', TYPE.title, x, y, on),
    (x, y) => text('verify-body', 'copy:step4.verify.body', TYPE.body, x, y, on),
    (x, y) =>
      row('verify-row', x, y, 18, [
        (rx, ry) => node('verify-box', 'checkbox', [rx, ry, 44, 44], { part: 'verify-card', r: 9, floor: heights.card, height: heights.card + 4, tone: 'light' }),
        (rx, ry) => text('verify-label', 'copy:step4.verify.checkbox', TYPE.value, rx, ry + (44 - block(TYPE.value.font, 'X', TYPE.value.px).cap) / 2, on)
      ])
  ])
  const shutH = inner.box[3]! + pad * 2
  const foot = column('verify-foot', cardX + pad, cardY + pad + inner.box[3]! + 28, 28, [
    (x, y) => node('verify-rule', 'divider', [x, y, cardW - pad * 2, 2], { part: 'verify-card', floor: heights.card, height: heights.card + heights.rule, tone: 'metal' }),
    (x, y) =>
      group('verify-answer', [
        text('verify-confirmed-film', 'copy:step4.verify.confirmedFilm', TYPE.label, x, y, { ...on, states: ['confirmed-film'] }),
        text('verify-doubt', 'copy:step4.verify.doubtLive', TYPE.label, x, y, { ...on, states: ['doubt'] }),
        text('verify-confirmed-live', 'copy:step4.verify.confirmedLive', TYPE.label, x, y, { ...on, states: ['confirmed-live'] })
      ])
  ])
  const cardH = shutH + 28 + foot.box[3]!
  const fineType = { ...TYPE.helper, wrap: cardW }
  const cardShut = node('verify-card', 'card', [cardX, cardY, cardW, shutH], { part: 'verify-card', r: 22, states: ['rest'] })
  const cardOpen = node('verify-card-open', 'card', [cardX, cardY, cardW, cardH], { part: 'verify-card', r: 22, states: OPEN, children: [foot] })
  const fineShut = text('verify-fine', 'copy:step4.verify.finePrint', fineType, cardX, cardY + shutH + 20, { part: 'type', states: ['rest'] })
  const fineOpen = text('verify-fine-open', 'copy:step4.verify.finePrint', fineType, cardX, cardY + cardH + 20, { part: 'type', states: OPEN })
  const verify = group('verify', [cardShut, cardOpen, inner, fineShut, fineOpen])

  const w = 288
  const submit = button('submit', SOCKET.x - w / 2, SOCKET.y - sizes.button / 2, w, 'copy:step4.submit', { part: 'shell' })

  const healthType = { font: 'inter-600', px: 23 }
  const labelBlock = block(healthType.font, words('copy:step4.bossHealthLabel'), healthType.px)
  const trackH = 30
  const trackY = SUBLINE_Y - 4
  const health = row(
    'health',
    LEFT,
    trackY,
    HEALTH_GAP,
    [
      (x, y) => text('health-label', 'copy:step4.bossHealthLabel', healthType, x, y + (trackH - labelBlock.cap) / 2, { part: 'type' }),
      (x, y) => node('health-track', 'progressRail', [x, y, RIGHT - x, trackH], { part: 'health-bar', shape: 'capsule', tone: 'pocket' })
    ],
    { states: ['fight'], part: 'health-bar' }
  )

  const defeated = text('defeated', 'copy:step4.defeated', { ...TYPE.value, align: 'centre' }, FALLEN.x, FALLEN.y + 84, { part: 'type', states: ['down'] })

  const slabPlans: SlabPlan[] = SLAB_KEYS.map((key) => {
    const b = block(SLAB_TYPE.font, words(key), SLAB_TYPE.px)
    return { key, w: Math.round(b.width + 56), h: SLAB_H, tw: b.width, cap: b.cap }
  })
  const rack = column(
    'slab-rack',
    LEFT + 12,
    ARENA.y0 + 30,
    RACK_GAP,
    slabPlans.map((p, i) => (x: number, y: number) =>
      node(`slab-${i}`, 'slab', [x, y, p.w, p.h], {
        part: 'boss-weapons',
        r: 8,
        children: [text(`slab-${i}-words`, p.key, { ...SLAB_TYPE, align: 'centre' }, x + p.w / 2, y + (p.h - p.cap) / 2, { part: 'boss-weapons', on: heights.slab, tone: 'inkLight' })]
      })
    )
  )

  const titleType = TYPE.label
  const popWs = POPUPS.map((p) => Math.round(block(titleType.font, words(p.title), titleType.px).width + 56))
  const popPad = 24
  const titleCap = block(titleType.font, 'X', titleType.px).cap
  const popH = popPad + titleCap + 22 + sizes.button + 10 + popPad - 6
  const right = POPUP_RIGHT
  const tops = [CONTENT_Y, CONTENT_Y + popH + 16, CONTENT_Y + (popH + 16) * 2]
  const insets = [0, 100, 100]
  const popupPlans: PopupPlan[] = []
  const popupNodes = POPUPS.map((p, i) => {
    const popW = popWs[i]!
    const x = right - popW - insets[i]!
    const y = tops[i]!
    const title = text(`popup-${i}-title`, p.title, titleType, x + popPad, y + popPad, { part: 'boss-weapons', on: heights.card })
    const widths = p.buttons.map((b) => buttonWidth(b))
    const total = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 22
    let bx = x + popW - popPad - total
    const by = y + popPad + titleCap + 22 + 5
    const plan: PopupPlan = { title: p.title, box: { x, y, w: popW, h: popH, cx: x + popW / 2, cy: y + popH / 2 }, titleAt: { x: x + popPad, y: y + popPad, w: title.box[2]!, cap: titleCap }, buttons: [] }
    const buttons = p.buttons.map((b, j) => {
      const made = button(`popup-${i}-button-${j}`, bx, by, widths[j]!, b, { part: 'boss-weapons', tone: j === p.buttons.length - 1 ? 'accent' : 'metal' })
      plan.buttons.push({ key: b, box: { x: bx, y: by, w: widths[j]!, h: sizes.button, cx: bx + widths[j]! / 2, cy: by + sizes.button / 2 }, main: j === p.buttons.length - 1 })
      bx += widths[j]! + 22
      return made
    })
    popupPlans.push(plan)
    return node(`popup-${i}`, 'card', [x, y, popW, popH], { part: 'boss-weapons', r: 18, children: [title, ...buttons] })
  })

  const bannerBlock = block(BANNER_TYPE.font, words(BANNER_KEY), BANNER_TYPE.px)
  const banner: BannerPlan = { key: BANNER_KEY, w: Math.round(bannerBlock.width + 72), h: 84 }
  const bannerNode = node('banner', 'slab', [BANNER_LEFT, ARENA.y0 + 20, banner.w, banner.h], {
    part: 'boss-weapons',
    r: 10,
    children: [text('banner-words', BANNER_KEY, { ...BANNER_TYPE, align: 'centre' }, BANNER_LEFT + banner.w / 2, ARENA.y0 + 20 + (banner.h - bannerBlock.cap) / 2, { part: 'boss-weapons', on: heights.slab, tone: 'inkLight' })]
  })

  const fightType = group('fight-type', [rack, ...popupNodes, bannerNode], { over: true, states: ['fight'] })

  const tree = page('step4', SCREEN_H, [...stepHead(4), health, verify, submit, defeated, fightType])
  const b = (id: string): Box => boxOf(tree, id)
  return {
    tree, card: b('verify-card-open'), checkbox: b('verify-box'), checkRow: b('verify-row'), socket: b('submit'), cap: b('submit-cap'), track: b('health-track'),
    weapons: { slabs: slabPlans, popups: popupPlans, banner, slabType: SLAB_TYPE, bannerType: BANNER_TYPE, titleType }, defeated: b('defeated'),
    fold: cardH - shutH, rule: b('verify-rule')
  }
}

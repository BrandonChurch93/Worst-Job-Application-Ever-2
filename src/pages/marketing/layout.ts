import { config } from '../../config'
import { copy, type LayoutNode } from '../../copy'
import { column, group, node, row, text, type Item } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { button, buttonWidth, field, HEADER, LEFT, page, RIGHT, TYPE } from '../../shell/parts'
import { words } from '../../shell/words'
import type { TypeSpec } from '../../stage/types'

const heights = config.scale.heights
const sizes = config.scale.sizes
const m = copy.marketing

export const PAGE = 'careers-page'
export const WIDTH = RIGHT - LEFT
export const CENTRE = (LEFT + RIGHT) / 2
export const GAP = 40
export const CARD_W = (WIDTH - GAP * 2) / 3
export const CARD_H = 248
export const CARD_R = 22
export const MEDAL = 356
export const MEDAL_H = 10
export const HERO_W = 460
export const TICKER = { x: LEFT, y: 984, w: WIDTH, h: 56, floor: -6, tape: -5, pad: 28, gap: 64 }
export const FIRST_CARDS = 3
const SECTION = 170
const HEAD_TO_CONTENT = 140
const FOOT = 128

export const T = {
  display: { font: 'inter-display-600', px: 68, lead: 84 },
  section: { font: 'inter-display-600', px: 52 },
  kicker: { font: 'inter-600', px: 20 },
  cardTitle: { font: 'inter-600', px: 30 },
  strong: { font: 'inter-600', px: 22 },
  medalTitle: { font: 'inter-600', px: 31, lead: 38 },
  medalFrom: { font: 'inter-400', px: 18, lead: 24 },
  quote: { font: 'inter-400', px: 20, lead: 30 },
  role: { font: 'inter-600', px: 20 },
  answer: { font: 'inter-400', px: 20, lead: 30 },
  tape: { font: 'inter-500', px: 22 }
} satisfies Record<string, TypeSpec>

const cap = (t: TypeSpec): number => block(t.font, 'X', t.px).cap
const tall = (t: TypeSpec, key: string, wrap?: number): number => block(t.font, words(key), t.px, wrap, t.lead).height
const wide = (t: TypeSpec, key: string): number => block(t.font, words(key), t.px).width
const type = { part: 'type' }
const onCard = { part: 'type', on: heights.card }

export interface Section { nodes: LayoutNode[]; bottom: number }

function head(id: string, y: number, o: { kicker?: string; heading: string; subline: string; centre?: boolean }): Section {
  const nodes: LayoutNode[] = []
  const x = o.centre ? CENTRE : LEFT
  const align = o.centre ? ({ align: 'centre' } as const) : {}
  let at = y
  if (o.kicker) {
    nodes.push(text(`${id}-kicker`, o.kicker, { ...T.kicker, ...align }, x, at, type))
    at += cap(T.kicker) + 28
  }
  nodes.push(text(`${id}-heading`, o.heading, { ...T.section, ...align }, x, at, type))
  nodes.push(text(`${id}-subline`, o.subline, { ...TYPE.subline, ...align }, x, at + 70, type))
  return { nodes, bottom: at + HEAD_TO_CONTENT }
}

export const perkStates = (i: number): { shut: string; open: string } => ({ shut: `perk-${i}-shut`, open: `perk-${i}-open` })

function perkCard(i: number, x: number, y: number): LayoutNode {
  const k = `copy:marketing.perks.items.${i}`
  const st = perkStates(i)
  const pad = 32
  const wrap = CARD_W - pad * 2
  const tCap = cap(T.cardTitle)
  const bCap = cap(TYPE.body)
  const promiseY = y + 36 + tCap + 22
  const ruleY = promiseY + bCap + 26
  const faceTop = y + (CARD_H - (tCap + 22 + bCap)) / 2
  return node(`perk-${i}`, 'card', [x, y, CARD_W, CARD_H], {
    part: 'perk-cards', r: CARD_R,
    children: [
      text(`perk-${i}-title`, `${k}.title`, T.cardTitle, x + pad, faceTop, { ...onCard, states: [st.shut] }),
      text(`perk-${i}-promise`, `${k}.promise`, { ...TYPE.body, wrap }, x + pad, faceTop + tCap + 22, { ...onCard, states: [st.shut] }),
      text(`perk-${i}-title-open`, `${k}.title`, T.cardTitle, x + pad, y + 36, { ...onCard, states: [st.open] }),
      text(`perk-${i}-promise-open`, `${k}.promise`, { ...TYPE.body, wrap }, x + pad, promiseY, { ...onCard, states: [st.open] }),
      node(`perk-${i}-rule`, 'cardRule', [x + pad, ruleY, wrap, 2], { part: 'perk-cards', floor: heights.card, height: heights.card + 1, tone: 'metal', states: [st.open] }),
      text(`perk-${i}-fine`, `${k}.finePrint`, { ...TYPE.helper, wrap, lead: 26 }, x + pad, ruleY + 26, { ...onCard, states: [st.open] })
    ]
  })
}

function medallion(i: number, cx: number, y: number): LayoutNode[] {
  const k = `copy:marketing.awards.items.${i}`
  const title = { ...T.medalTitle, align: 'centre' as const, wrap: 190 }
  const from = { ...T.medalFrom, align: 'centre' as const, wrap: 200 }
  const th = tall(title, `${k}.title`, title.wrap)
  const fh = tall(from, `${k}.from`, from.wrap)
  const top = y + (MEDAL - (th + 22 + fh)) / 2
  const on = { part: 'type', on: MEDAL_H }
  const disc = node(`award-${i}`, 'medallion', [cx - MEDAL / 2, y, MEDAL, MEDAL], {
    part: PAGE, shape: 'disc', height: MEDAL_H, tone: 'metal',
    children: [text(`award-${i}-title`, `${k}.title`, title, cx, top, on), text(`award-${i}-from`, `${k}.from`, from, cx, top + th + 22, on)]
  })
  return [disc, text(`award-${i}-fine`, `${k}.finePrint`, { ...TYPE.helper, align: 'centre' }, cx, y + MEDAL + 28, type)]
}

function firstScreen(): LayoutNode[] {
  const out: LayoutNode[] = []
  out.push(text('nav-brand', 'copy:marketing.nav.brand', TYPE.title, LEFT, HEADER.progressY - cap(TYPE.title) / 2, { part: 'shell' }))
  const ctaW = buttonWidth('copy:marketing.nav.cta')
  const ctaX = RIGHT - ctaW
  out.push(button('nav-cta', ctaX, HEADER.progressY - sizes.button / 2, ctaW, 'copy:marketing.nav.cta', { part: 'apply-button' }))
  let right = ctaX - 56
  for (let i = m.nav.links.length - 1; i >= 0; i--) {
    const key = `copy:marketing.nav.links.${i}`
    out.push(text(`nav-link-${i}`, key, { ...TYPE.label, align: 'right' }, right, HEADER.progressY - cap(TYPE.label) / 2, type))
    right -= wide(TYPE.label, key) + 48
  }
  out.push(node('header-rule', 'rule', [LEFT, HEADER.ruleY - 2, WIDTH, 6], { part: 'shell' }))
  const headY = 200
  const headline = { ...T.display, wrap: 1040 }
  out.push(text('hero-headline', 'copy:marketing.hero.headline', headline, LEFT, headY, type))
  const sublineY = headY + tall(headline, 'copy:marketing.hero.headline', headline.wrap) + 36
  out.push(text('hero-subline', 'copy:marketing.hero.subline', TYPE.subline, LEFT, sublineY, type))
  const buttonY = 424
  out.push(button('hero-cta', LEFT, buttonY, HERO_W, 'copy:marketing.hero.cta', { hero: true, part: 'apply-button' }))
  out.push(text('hero-under', 'copy:marketing.hero.underCta', TYPE.helper, LEFT, buttonY + sizes.heroButton + 28, type))
  out.push(...medallion(0, RIGHT - MEDAL / 2 - 52, buttonY + sizes.heroButton - MEDAL))
  const cards: Item[] = [0, 1, 2].map((i) => (x: number, y: number) => perkCard(i, x, y))
  out.push(row('perks-first', LEFT, 640, GAP, cards))
  out.push(tickerNode())
  return out
}

export const tapeStates = (i: number): string => `tape-${i}`

function tickerNode(): LayoutNode {
  const y = TICKER.y + (TICKER.h - cap(T.tape)) / 2
  const at = { part: 'type', on: TICKER.tape }
  const items = m.ticker.map((_, i) => text(`ticker-${i}`, `copy:marketing.ticker.${i}`, T.tape, TICKER.x + TICKER.pad, y, { ...at, states: [tapeStates(i)] }))
  items.push(text('ticker-after', 'copy:marketing.tickerAfterRejection', T.tape, TICKER.x + TICKER.pad, y, { ...at, states: ['tape-after'] }))
  return node('ticker-window', 'tickerWindow', [TICKER.x, TICKER.y, TICKER.w, TICKER.h], { part: 'ticker', shape: 'capsule', height: TICKER.floor, tone: 'pocket', children: items })
}

function perks(y: number): Section {
  const h = head('perks', y, { kicker: 'copy:marketing.perks.kicker', heading: 'copy:marketing.perks.heading', subline: 'copy:marketing.perks.subline' })
  const top = h.bottom
  const rowA: Item[] = [3, 4, 5].map((i) => (x: number, yy: number) => perkCard(i, x, yy))
  const closing = { ...TYPE.body, wrap: CARD_W - 64, lead: 34 }
  const note = (x: number, yy: number): LayoutNode =>
    node('perks-note', 'note', [x, yy, CARD_W, CARD_H], {
      part: PAGE, shape: 'none',
      children: [text('perks-closing', 'copy:marketing.perks.closing', closing, x + 32, yy + (CARD_H - tall(closing, 'copy:marketing.perks.closing', closing.wrap)) / 2, type)]
    })
  const rowB: Item[] = [...[6, 7].map((i) => (x: number, yy: number) => perkCard(i, x, yy)), note]
  const grid = column('perks-grid', LEFT, top, GAP, [(x, yy) => row('perks-row-a', x, yy, GAP, rowA), (x, yy) => row('perks-row-b', x, yy, GAP, rowB)])
  return { nodes: [...h.nodes, grid], bottom: top + CARD_H * 2 + GAP }
}

function awards(y: number): Section {
  const h = head('awards', y, { heading: 'copy:marketing.awards.heading', subline: 'copy:marketing.awards.subline' })
  const col = (WIDTH - GAP * 3) / 4
  const nodes = [...h.nodes]
  for (let i = 1; i < m.awards.items.length; i++) nodes.push(...medallion(i, LEFT + (i - 1) * (col + GAP) + col / 2, h.bottom))
  const footY = h.bottom + MEDAL + 28 + cap(TYPE.helper) + 44
  nodes.push(text('awards-footnote', 'copy:marketing.awards.footnote', TYPE.helper, LEFT, footY, type))
  return { nodes, bottom: footY + cap(TYPE.helper) }
}

export const BADGE = { pad: 28, photo: 96 }

function badge(i: number, x: number, y: number, h: number, quoteH: number): LayoutNode {
  const k = `copy:marketing.testimonials.items.${i}`
  const { pad, photo } = BADGE
  const wrap = CARD_W - pad * 2
  const mark = { part: PAGE, floor: heights.card, height: heights.card + 1, tone: 'dark' }
  const bx = x + pad + photo + 24
  const roleY = y + pad + photo + 28
  const quoteY = roleY + cap(T.role) + 22
  return node(`badge-${i}`, 'card', [x, y, CARD_W, h], {
    part: PAGE, r: CARD_R,
    children: [
      node(`badge-${i}-photo`, 'badgePhoto', [x + pad, y + pad, photo, photo], { ...mark, r: 8 }),
      node(`badge-${i}-name`, 'redaction', [bx, y + pad + 18, 250, 22], mark),
      node(`badge-${i}-name-2`, 'redaction', [bx, y + pad + 56, 170, 22], mark),
      text(`badge-${i}-role`, `${k}.role`, T.role, x + pad, roleY, onCard),
      text(`badge-${i}-quote`, `${k}.quote`, { ...T.quote, wrap }, x + pad, quoteY, onCard),
      text(`badge-${i}-note`, `${k}.note`, TYPE.helper, x + pad, quoteY + quoteH + 28, onCard)
    ]
  })
}

function testimonials(y: number): Section {
  const h = head('testimonials', y, { heading: 'copy:marketing.testimonials.heading', subline: 'copy:marketing.testimonials.subline' })
  const wrap = CARD_W - BADGE.pad * 2
  let quoteH = 0
  m.testimonials.items.forEach((_, i) => (quoteH = Math.max(quoteH, tall(T.quote, `copy:marketing.testimonials.items.${i}.quote`, wrap))))
  const bh = Math.ceil(BADGE.pad + BADGE.photo + 28 + cap(T.role) + 22 + quoteH + 28 + cap(TYPE.helper) + BADGE.pad + 4)
  const rows: Item[] = [0, 1].map((r) => (x: number, yy: number) => row(`badges-row-${r}`, x, yy, GAP, [0, 1, 2].map((c) => (xx: number, yyy: number) => badge(r * 3 + c, xx, yyy, bh, quoteH))))
  const grid = column('badges', LEFT, h.bottom, GAP, rows)
  const footY = h.bottom + bh * 2 + GAP + 40
  return { nodes: [...h.nodes, grid, text('testimonials-footnote', 'copy:marketing.testimonials.footnote', TYPE.helper, LEFT, footY, type)], bottom: footY + cap(TYPE.helper) }
}

function comparison(y: number): Section {
  const h = head('comparison', y, { heading: 'copy:marketing.comparison.heading', subline: 'copy:marketing.comparison.subline' })
  const rowH = 64
  const pad = 40
  const cols = [LEFT + pad, LEFT + 640, LEFT + 1200]
  const count = m.comparison.rows.length + 1
  const top = h.bottom
  const line = (id: string, yy: number, keys: (string | null)[], t: TypeSpec): LayoutNode =>
    node(id, 'tableRow', [LEFT, yy, WIDTH, rowH], {
      part: PAGE, shape: 'none',
      children: keys.flatMap((key, c) => (key ? [text(`${id}-${c}`, key, c === 0 ? { ...t, font: 'inter-600' } : t, cols[c]!, yy + (rowH - cap(t)) / 2, onCard)] : []))
    })
  const rows: Item[] = [(_, yy) => line('compare-head', yy, [null, 'copy:marketing.comparison.columns.0', 'copy:marketing.comparison.columns.1'], T.strong)]
  m.comparison.rows.forEach((_, i) => {
    const k = `copy:marketing.comparison.rows.${i}`
    rows.push((_x, yy) => line(`compare-${i}`, yy, [`${k}.feature`, `${k}.us`, `${k}.them`], TYPE.body))
  })
  const rules: LayoutNode[] = []
  for (let i = 1; i < count; i++) rules.push(node(`compare-rule-${i}`, 'cardRule', [LEFT + pad, top + 12 + i * rowH - 1, WIDTH - pad * 2, 2], { part: PAGE, floor: heights.card, height: heights.card + 1, tone: 'metal' }))
  const card = node('compare-table', 'card', [LEFT, top, WIDTH, count * rowH + 24], { part: PAGE, r: CARD_R, children: [column('compare-rows', LEFT, top + 12, 0, rows), ...rules] })
  return { nodes: [...h.nodes, card], bottom: top + count * rowH + 24 }
}

function process(y: number): Section {
  const h = head('process', y, { heading: 'copy:marketing.process.heading', subline: 'copy:marketing.process.subline' })
  const n = m.process.items.length
  const col = (WIDTH - GAP * (n - 1)) / n
  const d = sizes.progressButton
  const padRail = 14
  const railY = h.bottom
  const title = { ...T.strong, wrap: col }
  const body = { ...T.answer, wrap: col }
  let titleH = 0
  m.process.items.forEach((_, i) => (titleH = Math.max(titleH, tall(title, `copy:marketing.process.items.${i}.title`, col))))
  let bodyH = 0
  m.process.items.forEach((_, i) => (bodyH = Math.max(bodyH, tall(body, `copy:marketing.process.items.${i}.body`, col))))
  const buttons: LayoutNode[] = []
  const texts: LayoutNode[] = []
  const titleY = railY + d + padRail * 2 + 32
  const bodyY = titleY + titleH + 24
  for (let i = 0; i < n; i++) {
    const x = LEFT + i * (col + GAP)
    const num = `data:numerals.${i + 1}`
    const c = block(TYPE.numeral.font, words(num), TYPE.numeral.px).cap
    const label = text(`process-${i}-numeral`, num, { ...TYPE.numeral, align: 'centre' }, x + padRail + d / 2, railY + padRail + d / 2 - c / 2, { part: 'type', on: heights.progressButton })
    buttons.push(node(`process-${i}`, 'progressButton', [x + padRail, railY + padRail, d, d], { part: PAGE, shape: 'disc', floor: heights.progressRail, children: [label] }))
    texts.push(text(`process-${i}-title`, `copy:marketing.process.items.${i}.title`, title, x, titleY, type))
    texts.push(text(`process-${i}-body`, `copy:marketing.process.items.${i}.body`, body, x, bodyY, type))
  }
  const rail = node('process-rail', 'progressRail', [LEFT, railY, (n - 1) * (col + GAP) + d + padRail * 2, d + padRail * 2], { part: PAGE, shape: 'capsule', children: buttons })
  const waitY = bodyY + bodyH + 64
  const wait = field('wait', LEFT, waitY, col * 2 + GAP, 'copy:marketing.process.waitLabel', { value: 'copy:marketing.process.waitValue', helper: 'copy:marketing.process.footnote', part: PAGE })
  return { nodes: [...h.nodes, rail, ...texts, wait], bottom: wait.box[1]! + wait.box[3]! }
}

function faq(y: number): Section {
  const h = head('faq', y, { heading: 'copy:marketing.faq.heading', subline: 'copy:marketing.faq.subline' })
  const w = (WIDTH - GAP) / 2
  const pad = 36
  const answer = { ...T.answer, wrap: w - pad * 2 }
  let answerH = 0
  m.faq.items.forEach((_, i) => (answerH = Math.max(answerH, tall(answer, `copy:marketing.faq.items.${i}.a`, answer.wrap))))
  const qCap = cap(T.strong)
  const ch = Math.ceil(pad + qCap + 26 + answerH + pad + 6)
  const card = (i: number, x: number, yy: number): LayoutNode =>
    node(`faq-${i}`, 'card', [x, yy, w, ch], {
      part: PAGE, r: CARD_R,
      children: [text(`faq-${i}-q`, `copy:marketing.faq.items.${i}.q`, T.strong, x + pad, yy + pad, onCard), text(`faq-${i}-a`, `copy:marketing.faq.items.${i}.a`, answer, x + pad, yy + pad + qCap + 26, onCard)]
    })
  const rows: Item[] = [0, 1, 2].map((r) => (x: number, yy: number) => row(`faq-row-${r}`, x, yy, GAP, [0, 1].map((c) => (xx: number, yyy: number) => card(r * 2 + c, xx, yyy))))
  const grid = column('faq-grid', LEFT, h.bottom, GAP, rows)
  const closeY = h.bottom + ch * 3 + GAP * 2 + 48
  const q = text('faq-closing-q', 'copy:marketing.faq.closingQ', T.strong, LEFT, closeY, type)
  const a = text('faq-closing-a', 'copy:marketing.faq.closingA', TYPE.body, LEFT + q.box[2]! + 16, closeY, type)
  return { nodes: [...h.nodes, grid, q, a], bottom: closeY + qCap }
}

function finalCta(y: number): Section {
  const nodes: LayoutNode[] = [node('final-rule', 'rule', [LEFT, y, WIDTH, 2], { part: PAGE })]
  const headY = y + 96
  nodes.push(text('final-heading', 'copy:marketing.finalCta.heading', { ...T.section, align: 'centre' }, CENTRE, headY, type))
  const body = { ...TYPE.subline, align: 'centre' as const, wrap: 880, lead: 36 }
  const bodyY = headY + cap(T.section) + 36
  nodes.push(text('final-body', 'copy:marketing.finalCta.body', body, CENTRE, bodyY, type))
  const buttonY = bodyY + tall(body, 'copy:marketing.finalCta.body', body.wrap) + 52
  nodes.push(button('final-cta', CENTRE - HERO_W / 2, buttonY, HERO_W, 'copy:marketing.finalCta.cta', { hero: true, part: 'apply-button' }))
  const underY = buttonY + sizes.heroButton + 28
  nodes.push(text('final-under', 'copy:marketing.finalCta.underCta', { ...TYPE.helper, align: 'centre' }, CENTRE, underY, type))
  return { nodes, bottom: underY + cap(TYPE.helper) }
}

function footer(y: number): Section {
  const nodes: LayoutNode[] = [node('footer-rule', 'rule', [LEFT, y, WIDTH, 2], { part: PAGE })]
  const top = y + 64
  const brand = text('footer-brand', 'copy:marketing.footer.brand', TYPE.title, LEFT, top, type)
  const aboutY = top + cap(TYPE.title) + 28
  const about = text('footer-about', 'copy:marketing.hero.sublineLong', { ...TYPE.helper, wrap: 640, lead: 28 }, LEFT, aboutY, type)
  const taglineY = aboutY + about.box[3]! + 28
  const tagline = text('footer-tagline', 'copy:marketing.footer.tagline', { ...TYPE.helper, wrap: 560 }, LEFT, taglineY, type)
  const notRealY = taglineY + cap(TYPE.helper) + 20
  const notReal = text('footer-not-real', 'copy:marketing.footer.notReal', TYPE.helper, LEFT, notRealY, type)
  const creditY = notRealY + cap(TYPE.helper) + 40
  const credit = text('footer-credit', 'copy:marketing.footer.credit', TYPE.label, LEFT, creditY, type)
  const rx = CENTRE
  const wrap = RIGHT - rx
  const small = { ...TYPE.helper, wrap, lead: 28 }
  const bottom = text('footer-bottom', 'copy:marketing.footer.bottom', small, rx, top, type)
  const twistY = top + bottom.box[3]! + 36
  const twist = text('footer-plot-twist', 'copy:marketing.footer.plotTwist', small, rx, twistY, { ...type, states: ['hiring'] })
  const closing = text('footer-closing', 'copy:step5.closing', small, rx, twistY, { ...type, states: ['rejected'] })
  nodes.push(brand, about, tagline, notReal, credit, bottom, twist, closing)
  const end = Math.max(creditY + cap(TYPE.label), twistY + Math.max(twist.box[3]!, closing.box[3]!))
  return { nodes, bottom: end }
}

export interface Careers { layout: LayoutNode; height: number; sections: Record<string, number> }

export function careersLayout(): Careers {
  const nodes = firstScreen()
  const sections: Record<string, number> = { top: 0 }
  let y = TICKER.y + TICKER.h + SECTION + 8
  for (const [name, make] of [['perks', perks], ['awards', awards], ['testimonials', testimonials], ['comparison', comparison], ['process', process], ['faq', faq], ['final', finalCta], ['footer', footer]] as const) {
    sections[name] = y
    const s = make(y)
    nodes.push(group(`section-${name}`, s.nodes))
    y = s.bottom + (name === 'footer' ? 0 : SECTION)
  }
  const height = Math.ceil(y + FOOT)
  return { layout: page('marketing', height, nodes), height, sections }
}

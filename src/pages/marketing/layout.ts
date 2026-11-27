import { copy, type LayoutNode } from '../../copy'
import { node, text } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { page } from '../../shell/parts'
import { words } from '../../shell/words'
import type { TypeSpec } from '../../stage/types'

const m = copy.marketing

export const PAGE = 'careers-page'
export const CARDS = 'perk-cards'
export const APPLY = 'apply-button'
export const TAPE = 'ticker'
export const WIDTH = 1920
export const CENTRE = 960
export const FIRST_SCREEN = 1080

// Heights over the ground, in page pixels: the white sheet, the type on it, a card at rest, the top of an Apply button.
export const Z = { sheet: 0.2, type: 1.2, card: 2, cardType: 3.2, button: 6, pressed: 1.6 }

export const COLOUR = {
  white: 0xffffff, ink: 0x111111, soft: 0x3d3934, grey: 0x6b7280, greyType: 0x5c636f, line: 0xe5e7eb, edge: 0xd9d9de, band: 0xebeef1, peach: 0xffedd9, orange: 0xe97832,
  deep: 0xbe5418, down: 0xa3460f, onWhite: 0xb65821, onPeach: 0xaa521e, tick: 0x33b428, wreath: 0x9c9fae, glow: 0xfee4c9
}

export const T = {
  display: { font: 'inter-display-800', px: 82, lead: 86 },
  section: { font: 'inter-display-800', px: 72, lead: 78 },
  heading: { font: 'inter-display-800', px: 44, lead: 50 },
  brand: { font: 'inter-600', px: 32 },
  lead: { font: 'inter-400', px: 24, lead: 38 },
  strong: { font: 'inter-600', px: 24, lead: 30 },
  label: { font: 'inter-600', px: 20, lead: 26 },
  link: { font: 'inter-500', px: 20 },
  body: { font: 'inter-400', px: 20, lead: 28 },
  small: { font: 'inter-400', px: 16, lead: 24 },
  fine: { font: 'inter-400', px: 14, lead: 20 },
  tape: { font: 'inter-500', px: 20 }
} satisfies Record<string, TypeSpec>

export const TICKER = { x: 0, w: 1920, clip: 0, y: 1009, h: 70, gap: 52, dot: 8, speed: 96, keyAt: 420, keyItem: 1 }
export const CARD = { x: 202, w: 355, h: 327, gap: 32, r: 16, rows: [1359, 1718], tile: { x: 27, y: 28, size: 77, r: 14 }, pad: 30 }
export const QUOTE = { x: 323, w: 408, gap: 25.5, r: 16, pad: 26 }
export const TABLE = { x: 318, w: 1285, r: 16, pad: 24, head: 81, row: 66.4, feature: 357, us: [733, 1187] as const, usAt: 960, themAt: 1385, tick: 26 }
export const FAQ = { x: 597, w: 727, h: 52, pitch: 64.4, pad: 24 }
export const STEPS = { first: 426.5, pitch: 266.5, d: 51, wrap: 236 }
export const GLOW = { x: 960, y: 545, rx: 790, ry: 430, hold: 0.45 }

const cap = (t: TypeSpec): number => block(t.font, 'X', t.px).cap
const tall = (t: TypeSpec, key: string, wrap?: number): number => block(t.font, words(key), t.px, wrap, t.lead).height
const wide = (t: TypeSpec, key: string): number => block(t.font, words(key), t.px).width
const on = { part: PAGE, on: Z.type }
const mid = (t: TypeSpec): TypeSpec => ({ ...t, align: 'centre' })
const soft = (t: TypeSpec): TypeSpec => ({ ...t, ink: 'soft' })

const centred = (id: string, key: string, t: TypeSpec, y: number, extra: Partial<LayoutNode> = {}): LayoutNode => text(id, key, mid(t), CENTRE, y, { ...on, ...extra })
const sheet = (name: string, y: number, h: number, children: LayoutNode[]): LayoutNode => node(`sheet-${name}`, 'sheet', [0, y, WIDTH, h], { part: PAGE, height: Z.sheet, children })

// Two runs of type side by side on one line, set about the middle of the page.
function pair(id: string, a: string, b: string, ta: TypeSpec, tb: TypeSpec, y: number, gap: number, extra: Partial<LayoutNode> = {}): LayoutNode[] {
  const wa = wide(ta, a)
  const x = CENTRE - (wa + gap + wide(tb, b)) / 2
  return [text(`${id}-q`, a, ta, x, y, { ...on, ...extra }), text(`${id}-a`, b, tb, x + wa + gap, y, { ...on, ...extra })]
}

function pill(id: string, key: string, t: TypeSpec, y: number, h: number, pad: number, tone: string, ink: string): LayoutNode {
  const w = wide(t, key) + pad * 2
  return node(id, 'pill', [CENTRE - w / 2, y, w, h], { part: PAGE, shape: 'capsule', floor: Z.sheet, height: Z.sheet + 0.6, tone, children: [centred(`${id}-text`, key, t, y + (h - cap(t)) / 2, { tone: ink })] })
}

export function applyButton(id: string, x: number, y: number, w: number, h: number, key: string, t: TypeSpec): LayoutNode {
  const label = text(`${id}-label`, key, mid(t), x + w / 2, y + (h - cap(t)) / 2, { part: PAGE, on: Z.button, tone: 'inkLight' })
  return node(id, 'applySeat', [x, y, w, h], {
    part: PAGE, shape: 'capsule', floor: Z.sheet, height: Z.sheet + 0.4,
    children: [node(`${id}-cap`, 'applyCap', [x, y, w, h], { part: APPLY, shape: 'capsule', floor: Z.sheet + 0.4, height: Z.button, tone: 'accent', children: [label] })]
  })
}

function award(i: number, cx: number, y: number): LayoutNode {
  const k = `copy:marketing.awards.items.${i}`
  const title = { ...mid(T.label), wrap: 172 }
  const from = { ...mid(T.small), wrap: 176, lead: 22 }
  const th = tall(title, `${k}.title`, title.wrap)
  const fh = tall(from, `${k}.from`, from.wrap)
  const h = 122
  const top = y + (h - (th + 14 + fh)) / 2
  return node(`award-${i}`, 'award', [cx - 126, y, 252, h + 44], {
    part: PAGE, floor: Z.sheet, height: Z.sheet + 0.6,
    children: [
      text(`award-${i}-title`, `${k}.title`, title, cx, top, on),
      text(`award-${i}-from`, `${k}.from`, from, cx, top + th + 14, { ...on, tone: 'metal' }),
      text(`award-${i}-fine`, `${k}.finePrint`, { ...mid(T.fine), wrap: 240 }, cx, y + h + 14, { ...on, tone: 'metal' })
    ]
  })
}

export const tapeStates = (i: number): string => `tape-${i}`

function ticker(): LayoutNode {
  const y = TICKER.y + (TICKER.h - cap(T.tape)) / 2
  const at = { part: PAGE, on: Z.type }
  const items = m.ticker.map((_, i) => text(`ticker-${i}`, `copy:marketing.ticker.${i}`, T.tape, 0, y, { ...at, states: [tapeStates(i)] }))
  items.push(text('ticker-after', 'copy:marketing.tickerAfterRejection', T.tape, 0, y, { ...at, states: ['tape-after'] }))
  return node('ticker-window', 'tickerBand', [0, TICKER.y, WIDTH, TICKER.h], { part: TAPE, floor: Z.sheet, height: Z.sheet + 0.6, tone: 'pocket', children: items })
}

function top(): LayoutNode {
  const out: LayoutNode[] = []
  const navY = 46.5
  out.push(text('nav-brand', 'copy:marketing.nav.brand', T.brand, 68, navY - cap(T.brand) / 2, on))
  ;[1082, 1282, 1439].forEach((x, i) => out.push(text(`nav-link-${i}`, `copy:marketing.nav.links.${i}`, T.link, x, navY - cap(T.link) / 2, on)))
  out.push(applyButton('nav-cta', 1646, 20, 207, 52, 'copy:marketing.nav.cta', T.label))
  out.push(node('nav-rule', 'hairline', [0, 97, WIDTH, 1], { part: PAGE, floor: Z.sheet, height: Z.sheet + 0.6 }))
  out.push(pill('hero-pill', 'copy:marketing.ticker.8', T.label, 181, 44, 28, 'paper', 'danger'))
  const headline = { ...T.display, wrap: 1240 }
  out.push(centred('hero-headline', 'copy:marketing.hero.headline', headline, 260))
  out.push(centred('hero-subline', 'copy:marketing.hero.sublineLong', soft({ ...T.lead, wrap: 980 }), 461))
  out.push(applyButton('hero-cta', 685, 568, 550, 78, 'copy:marketing.hero.cta', T.strong))
  out.push(centred('hero-under', 'copy:marketing.hero.underCta', T.body, 708, { tone: 'metal' }))
  const centres = [390.5, 674.5, 960, 1245, 1529.5]
  m.awards.items.forEach((_, i) => out.push(award(i, centres[i]!, 790)))
  out.push(ticker())
  return sheet('top', 0, FIRST_SCREEN, out)
}

export const perkStates = (i: number): { shut: string; open: string } => ({ shut: `perk-${i}-shut`, open: `perk-${i}-open` })

function perkCard(i: number, x: number, y: number): LayoutNode {
  const k = `copy:marketing.perks.items.${i}`
  const st = perkStates(i)
  const cx = x + CARD.w / 2
  const wrap = CARD.w - CARD.pad * 2
  const at = { part: PAGE, on: Z.cardType }
  const promise = { ...mid(T.body), wrap }
  const fine = { ...mid(T.small), wrap }
  const large = { ...mid(T.lead), wrap, lead: 34 }
  const promiseY = y + 181
  const fineY = promiseY + tall(promise, `${k}.promise`, wrap) + 22
  return node(`perk-${i}`, 'perkCard', [x, y, CARD.w, CARD.h], {
    part: CARDS, r: CARD.r, floor: Z.sheet, height: Z.card,
    children: [
      text(`perk-${i}-title`, `${k}.title`, mid(T.strong), cx, y + 135, { ...at, states: [st.shut] }),
      text(`perk-${i}-promise`, `${k}.promise`, promise, cx, promiseY, { ...at, states: [st.shut] }),
      text(`perk-${i}-fine`, `${k}.finePrint`, fine, cx, fineY, { ...at, tone: 'metal', states: [st.shut] }),
      text(`perk-${i}-fine-large`, `${k}.finePrint`, large, cx, y + (CARD.h - tall(large, `${k}.finePrint`, wrap)) / 2, { ...at, states: [st.open] })
    ]
  })
}

function perks(y0: number): LayoutNode {
  const d = y0 - 1080
  const out: LayoutNode[] = []
  out.push(pill('perks-kicker', 'copy:marketing.perks.kicker', T.label, 1107 + d, 44, 28, 'paper', 'danger'))
  out.push(centred('perks-heading', 'copy:marketing.perks.heading', T.section, 1186 + d))
  out.push(centred('perks-subline', 'copy:marketing.perks.subline', soft(T.lead), 1283 + d))
  m.perks.items.forEach((_, i) => out.push(perkCard(i, CARD.x + (i % 4) * (CARD.w + CARD.gap), CARD.rows[Math.floor(i / 4)]! + d)))
  out.push(centred('perks-closing', 'copy:marketing.perks.closing', soft(T.lead), 2105 + d))
  return sheet('perks', y0, 1090, out)
}

function quotes(y0: number): { node: LayoutNode; bottom: number } {
  const out: LayoutNode[] = []
  out.push(centred('testimonials-heading', 'copy:marketing.testimonials.heading', T.heading, y0 + 61))
  out.push(centred('testimonials-subline', 'copy:marketing.testimonials.subline', soft(T.body), y0 + 120))
  const wrap = QUOTE.w - QUOTE.pad * 2
  const role = { ...T.label, wrap }
  const quote = { ...T.body, wrap }
  let quoteH = 0
  let roleH = 0
  m.testimonials.items.forEach((_, i) => {
    quoteH = Math.max(quoteH, tall(quote, `copy:marketing.testimonials.items.${i}.quote`, wrap))
    roleH = Math.max(roleH, tall(role, `copy:marketing.testimonials.items.${i}.role`, wrap))
  })
  const h = Math.ceil(28 + quoteH + 22 + roleH + 12 + cap(T.fine) + 28)
  const first = y0 + 162
  m.testimonials.items.forEach((_, i) => {
    const k = `copy:marketing.testimonials.items.${i}`
    const x = QUOTE.x + (i % 3) * (QUOTE.w + QUOTE.gap)
    const y = first + Math.floor(i / 3) * (h + 26)
    const roleY = y + 28 + quoteH + 22
    out.push(node(`quote-${i}`, 'quoteCard', [x, y, QUOTE.w, h], {
      part: PAGE, r: QUOTE.r, floor: Z.sheet, height: Z.sheet + 0.6,
      children: [
        text(`quote-${i}-quote`, `${k}.quote`, quote, x + QUOTE.pad, y + 28, on),
        text(`quote-${i}-role`, `${k}.role`, role, x + QUOTE.pad, roleY, on),
        text(`quote-${i}-note`, `${k}.note`, T.fine, x + QUOTE.pad, roleY + tall(role, `${k}.role`, wrap) + 12, { ...on, tone: 'accent' })
      ]
    }))
  })
  const footY = first + h * 2 + 26 + 26
  out.push(centred('testimonials-footnote', 'copy:marketing.testimonials.footnote', T.small, footY, { tone: 'metal' }))
  const bottom = Math.ceil(footY + cap(T.small) + 40)
  return { node: sheet('testimonials', y0, bottom - y0, out), bottom }
}

function faq(y0: number): LayoutNode {
  const out: LayoutNode[] = []
  out.push(centred('faq-heading', 'copy:marketing.faq.heading', T.heading, y0 + 56))
  out.push(centred('faq-subline', 'copy:marketing.faq.subline', soft(T.body), y0 + 119))
  m.faq.items.forEach((_, i) => {
    const y = y0 + 162 + i * FAQ.pitch
    out.push(node(`faq-${i}`, 'faqRow', [FAQ.x, y, FAQ.w, FAQ.h], {
      part: PAGE, shape: 'capsule', floor: Z.sheet, height: Z.sheet + 0.6,
      children: [text(`faq-${i}-q`, `copy:marketing.faq.items.${i}.q`, T.link, FAQ.x + FAQ.pad, y + (FAQ.h - cap(T.link)) / 2, on)]
    }))
  })
  out.push(...pair('faq-closing', 'copy:marketing.faq.closingQ', 'copy:marketing.faq.closingA', T.label, T.body, y0 + 569, 7))
  return sheet('faq', y0, 650, out)
}

function comparison(y0: number): LayoutNode {
  const out: LayoutNode[] = []
  out.push(centred('comparison-heading', 'copy:marketing.comparison.heading', T.heading, y0 + 82))
  out.push(centred('comparison-subline', 'copy:marketing.comparison.subline', soft(T.lead), y0 + 151))
  const cardY = y0 + 209
  const rows = m.comparison.rows.length
  const h = TABLE.pad * 2 + TABLE.head + rows * TABLE.row
  const inner = cardY + TABLE.pad
  const children: LayoutNode[] = []
  const headY = inner + (TABLE.head - cap(T.strong)) / 2
  children.push(text('compare-head-us', 'copy:marketing.comparison.columns.0', mid(T.strong), TABLE.usAt, headY, on))
  children.push(text('compare-head-them', 'copy:marketing.comparison.columns.1', mid(T.strong), TABLE.themAt, headY, on))
  const themW = TABLE.tick + 12 + wide(T.lead, 'copy:marketing.comparison.rows.0.them')
  m.comparison.rows.forEach((_, i) => {
    const k = `copy:marketing.comparison.rows.${i}`
    const y = inner + TABLE.head + i * TABLE.row
    const ty = y + (TABLE.row - cap(T.lead)) / 2
    const tx = TABLE.themAt - themW / 2
    children.push(text(`compare-${i}-feature`, `${k}.feature`, T.lead, TABLE.feature, ty, on))
    children.push(text(`compare-${i}-us`, `${k}.us`, mid(T.lead), TABLE.usAt, ty, { ...on, tone: 'danger' }))
    children.push(node(`compare-${i}-tick`, 'tick', [tx, y + (TABLE.row - TABLE.tick) / 2, TABLE.tick, TABLE.tick], { part: PAGE, r: 5, floor: Z.sheet, height: Z.sheet + 0.9 }))
    children.push(text(`compare-${i}-them`, `${k}.them`, T.lead, tx + TABLE.tick + 12, ty, { ...on, tone: 'metal' }))
  })
  out.push(node('compare-table', 'tableCard', [TABLE.x, cardY, TABLE.w, h], { part: PAGE, r: TABLE.r, floor: Z.sheet, height: Z.sheet + 0.6, children }))
  return sheet('comparison', y0, 1020, out)
}

function process(y0: number): LayoutNode {
  const out: LayoutNode[] = []
  out.push(centred('process-heading', 'copy:marketing.process.heading', T.heading, y0 + 93))
  out.push(centred('process-subline', 'copy:marketing.process.subline', soft(T.lead), y0 + 165))
  const railY = y0 + 233
  const n = m.process.items.length
  out.push(node('process-rail', 'hairline', [STEPS.first, railY + STEPS.d / 2 - 1, STEPS.pitch * (n - 1), 2], { part: PAGE, floor: Z.sheet, height: Z.sheet + 0.6 }))
  const title = { ...mid(T.strong), wrap: STEPS.wrap }
  const body = { ...mid(T.small), wrap: STEPS.wrap }
  for (let i = 0; i < n; i++) {
    const cx = STEPS.first + i * STEPS.pitch
    const num = `data:numerals.${i + 1}`
    const k = `copy:marketing.process.items.${i}`
    out.push(node(`process-${i}`, 'stepDisc', [cx - STEPS.d / 2, railY, STEPS.d, STEPS.d], {
      part: PAGE, shape: 'disc', floor: Z.sheet, height: Z.sheet + 0.9, tone: 'accent',
      children: [text(`process-${i}-numeral`, num, mid(T.label), cx, railY + (STEPS.d - cap(T.label)) / 2, { ...on, tone: 'inkLight' })]
    }))
    const titleY = y0 + 312
    out.push(text(`process-${i}-title`, `${k}.title`, title, cx, titleY, on))
    out.push(text(`process-${i}-body`, `${k}.body`, body, cx, titleY + tall(title, `${k}.title`, STEPS.wrap) + 18, on))
  }
  const waitY = y0 + 516
  const wa = wide(T.lead, 'copy:marketing.process.waitLabel')
  const wb = wide(T.lead, 'copy:marketing.process.waitValue')
  const w = wa + 7 + wb + 56
  const ty = waitY + (51 - cap(T.lead)) / 2
  out.push(node('process-wait', 'pill', [CENTRE - w / 2, waitY, w, 51], {
    part: PAGE, shape: 'capsule', floor: Z.sheet, height: Z.sheet + 0.6, tone: 'pocket',
    children: [text('process-wait-label', 'copy:marketing.process.waitLabel', T.lead, CENTRE - w / 2 + 28, ty, on), text('process-wait-value', 'copy:marketing.process.waitValue', T.lead, CENTRE - w / 2 + 28 + wa + 7, ty, on)]
  }))
  out.push(centred('process-footnote', 'copy:marketing.process.footnote', T.small, y0 + 584))
  return sheet('process', y0, 630, out)
}

function finalCta(y0: number): LayoutNode {
  const out: LayoutNode[] = []
  out.push(centred('final-heading', 'copy:marketing.finalCta.heading', T.heading, y0 + 44))
  out.push(centred('final-body', 'copy:marketing.finalCta.body', soft({ ...T.body, wrap: 720, lead: 32 }), y0 + 114))
  out.push(applyButton('final-cta', 683, y0 + 201, 553, 67, 'copy:marketing.finalCta.cta', T.strong))
  out.push(centred('final-under', 'copy:marketing.finalCta.underCta', T.small, y0 + 290))
  return sheet('final', y0, 322, out)
}

function footer(y0: number): LayoutNode {
  const out: LayoutNode[] = []
  const left = 289
  const right = 1631
  out.push(node('footer-rule', 'hairline', [left, y0 + 5, right - left, 1], { part: PAGE, floor: Z.sheet, height: Z.sheet + 0.6 }))
  out.push(text('footer-brand', 'copy:marketing.footer.brand', T.strong, left, y0 + 31, on))
  out.push(text('footer-tagline', 'copy:marketing.footer.tagline', soft(T.small), left, y0 + 64, { ...on, states: ['hiring'] }))
  out.push(text('footer-closing', 'copy:step5.closing', soft({ ...T.fine, wrap: 760 }), left, y0 + 62, { ...on, states: ['rejected'] }))
  out.push(text('footer-not-real', 'copy:marketing.footer.notReal', { ...T.small, align: 'right' }, right, y0 + 34, on))
  out.push(text('footer-credit', 'copy:marketing.footer.credit', { ...T.small, align: 'right' }, right, y0 + 64, on))
  return sheet('footer', y0, 95, out)
}

export interface Careers { layout: LayoutNode; height: number; sections: Record<string, number> }

let made: Careers | null = null

export function careersLayout(): Careers {
  if (made) return made
  const sections: Record<string, number> = { top: 0, perks: 1080, testimonials: 2170 }
  const nodes: LayoutNode[] = [top(), perks(sections.perks!)]
  const q = quotes(sections.testimonials!)
  nodes.push(q.node)
  let y = q.bottom
  for (const [name, make, h] of [['faq', faq, 650], ['comparison', comparison, 1020], ['process', process, 630], ['final', finalCta, 322], ['footer', footer, 95]] as const) {
    sections[name] = y
    nodes.push(make(y))
    y += h
  }
  made = { layout: page('marketing', y, nodes), height: y, sections }
  return made
}

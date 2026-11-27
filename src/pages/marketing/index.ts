import { beat, config, stepHz } from '../../config'
import { copy, type LayoutNode } from '../../copy'
import { HANDOFF, type Acting } from '../../cursor/body'
import { boxOf, drawLayout, find } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { SCREEN_H } from '../../shell/parts'
import { words } from '../../shell/words'
import type { DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, StepIo } from '../../stage/types'
import { careersLayout, PAGE, perkStates, T, TAPE, TICKER, WIDTH, Z } from './layout'
import { CUES, LANDING, OPENING, planOf, pointerAt, REJECTED_CUES, scrollAt, type Marks, type Plan } from './script'

const dt = 1 / stepHz
const hover = config.scale.heights.cursorHover

export const FLIP_SECONDS = 0.5
// A card of the website turns over evenly and stops flat: it goes past flat by the share `past`, which is none.
export const SETTLE = { past: 0, over: 1 }
// A card that is over goes back when the arrow is this far outside it, so that it does not flutter at its edge.
export const LEAVE = 16
const LOOK = 0.25
// The page has its own navigation, so the stage draws no header over it; the panel of the spoken words ends at y 980, over the ticker.
const CHROME = { header: 0, caption: 980 }
const SHOCK = 0.8
const REJECTED_SETTLE = 1.7
// What the stage's hold on an arrow in the air pulls it back up by in one step, as a share of how far under the hand-off it is.
const HELD = 9 * dt
export const TRAVEL = Z.button - Z.pressed
const WIND = 0.36
const BACK = 56
const JUMP = 0.42
const STAMP = 0.14
const SINK = 0.09
const DOWN = 0.3
const RISE = 0.18
const UP = 0.2
const HOLD = 0.7
const JUMP_HEIGHT = 110
const LINK_LEAD = 96
const BUTTONS = ['nav-cta', 'hero-cta', 'final-cta'] as const
const HERO = 1
const SALARY = 1
// The arrow goes down the page in its left margin, clear of everything that answers it.
const LANE = 150

interface Apply { button: number; t: number; fx: number; fy: number; jx: number; jy: number; jumped: boolean; stamped: boolean; pressed: boolean; held: number }

interface State {
  mode: 'live' | 'film'
  variant: string
  time: number
  clock: number
  scroll: number
  scrollTo: number
  flip: number[]
  over: boolean[]
  took: boolean
  shock: number
  sink: number[]
  apply: Apply | null
  skipAsked: boolean
  done: boolean
  cue: number
  base: Acting
}

interface Box { x: number; y: number; w: number; h: number; cx: number; cy: number }

const inside = (b: Box, p: { x: number; y: number }): boolean => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
const near = (b: Box, p: { x: number; y: number }, by: number): boolean => p.x >= b.x - by && p.x <= b.x + b.w + by && p.y >= b.y - by && p.y <= b.y + b.h + by
const smooth = (u: number): number => {
  const v = Math.min(1, Math.max(0, u))
  return v * v * (3 - 2 * v)
}
const mod = (a: number, n: number): number => ((a % n) + n) % n

// The film's opening on this page: where the arrow goes and how the page scrolls under it.
export function careersOpening(): { marks: Marks; plan: Plan } {
  const { layout, height } = careersLayout()
  const maxScroll = height - SCREEN_H
  const caps = BUTTONS.map((id) => boxOf(layout, `${id}-cap`))
  const hero = caps[HERO]!
  const last = caps[BUTTONS.length - 1]!
  const start = { x: 64, y: 596 }
  const stand = { x: hero.x + hero.w + 92, y: hero.cy - 2 }
  const salary = boxOf(layout, `perk-${SALARY}`)
  const badge = boxOf(layout, 'quote-0-note')
  const lol = boxOf(layout, `compare-${copy.marketing.comparison.rows.length - 1}-us`)
  const ghosting = boxOf(layout, `process-${copy.marketing.process.items.length - 1}-title`)
  const mid = (cy: number): number => Math.min(maxScroll, Math.max(0, Math.round(cy - SCREEN_H / 2)))
  const stops = [
    { x: salary.x + salary.w - 70, y: salary.y + 34, scroll: mid(salary.cy) },
    { x: badge.x + badge.w + 22, y: badge.cy - 2, scroll: mid(badge.cy - 60) },
    { x: lol.cx + 70, y: lol.cy + 2, scroll: mid(lol.cy - 150) },
    { x: ghosting.x + ghosting.w / 2 + 20, y: ghosting.y + ghosting.h + 96, scroll: mid(ghosting.cy - 220) },
    { x: last.x + last.w + 92, y: last.cy - 2, scroll: maxScroll }
  ]
  const straight = (a: { x: number; y: number }, b: { x: number; y: number }) => [{ f: 0, x: a.x, y: a.y }, { f: 1, x: b.x, y: b.y }]
  const above = salary.y - 34
  const marks: Marks = {
    start,
    stand,
    stops,
    routes: [
      [{ f: 0, ...stand }, { f: 0.8, x: stops[0]!.x + 20, y: salary.y - 70 }, { f: 1, x: stops[0]!.x, y: stops[0]!.y }],
      [{ f: 0, x: stops[0]!.x, y: stops[0]!.y }, { f: 0.03, x: stops[0]!.x, y: above }, { f: 0.16, x: LANE, y: above }, { f: 0.85, x: LANE, y: stops[1]!.y - 60 }, { f: 1, x: stops[1]!.x, y: stops[1]!.y }],
      straight(stops[1]!, stops[2]!),
      straight(stops[2]!, stops[3]!),
      straight(stops[3]!, stops[4]!)
    ],
    perch: { x: last.x + last.w + 26, y: last.y - 18 },
    press: { x: last.x + last.w * 0.76, y: last.cy - 4 }
  }
  return { marks, plan: planOf(stops.map((p) => p.scroll)) }
}

export function makePage(): PageLogic {
  const { layout, height, sections } = careersLayout()
  const beats = config.film.beats.filter((b) => b.unit === 'marketing')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: b.event ?? null }))
  const [strollBeat, perksBeat, tickerBeat, applyBeat] = ['marketing.stroll', 'marketing.perks', 'marketing.ticker', 'marketing.apply'].map((id) => beat(id)) as [ReturnType<typeof beat>, ReturnType<typeof beat>, ReturnType<typeof beat>, ReturnType<typeof beat>]
  const maxScroll = height - SCREEN_H

  const perkCount = copy.marketing.perks.items.length
  const cards: Box[] = []
  const cardNodes: LayoutNode[] = []
  for (let i = 0; i < perkCount; i++) {
    cards.push(boxOf(layout, `perk-${i}`))
    cardNodes.push(find(layout, `perk-${i}`))
  }
  const caps = BUTTONS.map((id) => boxOf(layout, `${id}-cap`))

  const tapeItems = copy.marketing.ticker.map((_, i) => {
    const key = `copy:marketing.ticker.${i}`
    return { id: `ticker-${i}`, key, w: block(T.tape.font, words(key), T.tape.px).width, at: 0 }
  })
  let tapeLength = 0
  for (const item of tapeItems) {
    item.at = tapeLength
    tapeLength += item.w + TICKER.gap
  }
  const afterKey = 'copy:marketing.tickerAfterRejection'
  const afterW = block(T.tape.font, words(afterKey), T.tape.px).width
  const afterCount = Math.ceil(TICKER.w / (afterW + TICKER.gap)) + 2
  const afterItems = Array.from({ length: afterCount }, (_, k) => ({ id: `ticker-after-${k}`, key: afterKey, w: afterW, at: k * (afterW + TICKER.gap) }))
  const afterLength = afterCount * (afterW + TICKER.gap)
  const tapeY = boxOf(layout, 'ticker-0').y
  const tapeH = boxOf(layout, 'ticker-0').h

  const links = (['final', 'testimonials', 'perks'] as const).map((name, i) => {
    const b = boxOf(layout, `nav-link-${i}`)
    return { box: { ...b, x: b.x - 12, y: b.y - 16, w: b.w + 24, h: b.h + 32 }, to: Math.min(maxScroll, Math.max(0, sections[name]! - LINK_LEAD)) }
  })

  const hero = caps[HERO]!
  const { marks, plan } = careersOpening()
  const start = marks.start

  const s: State = {
    mode: 'live', variant: '', time: 0, clock: 0, scroll: 0, scrollTo: 0, flip: Array(perkCount).fill(0), over: Array(perkCount).fill(false), took: false, shock: 0,
    sink: BUTTONS.map(() => 0), apply: null, skipAsked: false, done: false, cue: 0, base: 'confident'
  }
  const rejected = (): boolean => s.variant === 'rejected'
  const capTop = (i: number): number => Z.button - TRAVEL * smooth(s.sink[i]!)
  const landing = (i: number): { x: number; y: number } => ({ x: caps[i]!.cx + Math.min(150, caps[i]!.w / 2 - 70), y: caps[i]!.cy - 4 })

  function surface(x: number, y: number): number {
    const p = { x, y }
    for (let i = 0; i < perkCount; i++) if (inside(cards[i]!, p)) return Z.card
    for (let i = 0; i < caps.length; i++) if (inside(caps[i]!, p)) return capTop(i)
    return Z.sheet
  }

  function startApply(button: number, io: StepIo): void {
    if (s.apply || s.done) return
    s.apply = { button, t: 0, fx: io.cursor.x, fy: io.cursor.y, jx: io.cursor.x, jy: io.cursor.y, jumped: false, stamped: false, pressed: false, held: 0 }
    io.cursor.take('apply')
    io.cursor.react('anticipate')
  }

  function stepApply(io: StepIo): void {
    const a = s.apply!
    if (io.cursor.inAir) return
    a.t += dt
    const i = a.button
    const to = landing(i)
    if (a.t < WIND) {
      let dx = a.fx - to.x
      let dy = a.fy - to.y
      const d = Math.hypot(dx, dy)
      if (d < 8) {
        dx = 0.8
        dy = 0.6
      } else {
        dx /= d
        dy /= d
      }
      const u = smooth(a.t / WIND)
      io.cursor.drive(a.fx + dx * BACK * u, a.fy + dy * BACK * u, hover + surface(a.fx, a.fy))
      a.jx = io.cursor.x
      a.jy = io.cursor.y
      return
    }
    if (a.t < WIND + JUMP) {
      if (!a.jumped) {
        a.jumped = true
        io.cursor.react('jump')
      }
      const u = (a.t - WIND) / JUMP
      if (!a.stamped && a.t >= WIND + JUMP - STAMP) {
        a.stamped = true
        io.cursor.react('stamp')
      }
      const from = hover + surface(a.jx, a.jy)
      const z = from + (capTop(i) + 1 - from) * u + 4 * JUMP_HEIGHT * u * (1 - u)
      io.cursor.place(a.jx + (to.x - a.jx) * smooth(u), a.jy + (to.y - a.jy) * smooth(u), z)
      return
    }
    if (!a.pressed) {
      a.pressed = true
      io.emit('button-press', caps[i]!.cx, caps[i]!.cy, false)
    }
    a.held += dt
    s.sink[i] = a.held < DOWN ? Math.min(1, a.held / SINK) : 1 - (1 - UP) * smooth((a.held - DOWN) / RISE)
    io.cursor.place(to.x, to.y, capTop(i) + 1)
    if (rejected()) {
      if (a.held >= HOLD + 0.2) {
        io.cursor.release()
        s.apply = null
      }
    } else if (a.held >= HOLD) s.done = true
  }

  // How much of a card's own height shows: 1 lying face up, 0 on edge, -1 lying on its face.
  const shows = (i: number): number => Math.cos(Math.PI * smooth(s.flip[i]!))
  const turning = (i: number): boolean => s.flip[i]! > 0 && s.flip[i]! < 1

  // A run that crosses an end of the band is set in whole glyphs as far as it lies inside: from its head as it comes in, from its tail as it leaves. `cutOf` is how wide that is, and `CUT_INK` the room kept for the ink that stands outside a letter's own width.
  const CUT_INK = 3
  const TAPE_TYPE = { ...T.tape, ink: 'soft' } as const
  const CUT_HEAD = { ...TAPE_TYPE, cut: true } as const
  const CUT_TAIL = { ...TAPE_TYPE, cut: true, align: 'right' } as const
  const cuts = new Map<string, { head: number[]; tail: number[] }>()
  const cutOf = (key: string, room: number, leaving: boolean): number => {
    let c = cuts.get(key)
    if (!c) {
      const chars = Array.from(words(key))
      const wide = (t: string[]): number => block(T.tape.font, t.join(''), T.tape.px).width
      cuts.set(key, (c = { head: chars.map((_, k) => wide(chars.slice(0, k + 1))), tail: chars.map((_, k) => wide(chars.slice(chars.length - k - 1))) }))
    }
    let w = 0
    for (const v of leaving ? c.tail : c.head) if (v <= room) w = v
    return w
  }

  // The band runs from one edge of the website to the other. At the moment of the key, item `keyItem` begins at `keyAt`. `clock` is the time of the frame that is drawn, one step after the time of the step that made it.
  function ticker(out: DrawList): void {
    const left = TICKER.x
    const right = TICKER.x + TICKER.w
    const items = rejected() ? afterItems : tapeItems
    const length = rejected() ? afterLength : tapeLength
    const tape = rejected() ? (s.clock - REJECTED_SETTLE) * TICKER.speed : (s.clock - OPENING.key) * TICKER.speed + tapeItems[TICKER.keyItem]!.at - TICKER.keyAt
    for (const item of items) {
      const first = left + mod(item.at - tape, length)
      for (const x of [first, first - length]) {
        const dot = x + item.w + TICKER.gap / 2
        if (dot - TICKER.dot / 2 >= left && dot + TICKER.dot / 2 <= right) out.push({ id: `${item.id}-dot${x === first ? '' : '-b'}`, part: TAPE, kind: 'disc', x: dot - TICKER.dot / 2, y: TICKER.y + TICKER.h / 2 - TICKER.dot / 2, w: TICKER.dot, h: TICKER.dot, z0: Z.type, z1: Z.type, tone: 'accent' })
        if (x + item.w <= left + 2 || x >= right - 2) continue
        const run = { id: `${item.id}-run${x === first ? '' : '-b'}`, part: PAGE, kind: 'text', y: tapeY, h: tapeH, z0: Z.type, z1: Z.type, tone: 'ink', words: item.key } as const
        if (x >= left + CUT_INK && x + item.w <= right - CUT_INK) out.push({ ...run, x, w: item.w, type: TAPE_TYPE })
        else {
          const leaving = x < left + CUT_INK
          const w = cutOf(item.key, (leaving ? x + item.w - left : right - x) - CUT_INK, leaving)
          if (w > 0) out.push({ ...run, x: leaving ? x + item.w - w : x, w, type: leaving ? CUT_TAIL : CUT_HEAD })
        }
      }
    }
  }

  const page: PageLogic = {
    id: 'marketing', unit: 'marketing', width: WIDTH, height, layout, gags, start, control: 'pointer',
    reset(ctx: PageContext) {
      const after = ctx.variant === 'rejected'
      Object.assign(s, {
        mode: ctx.mode, variant: ctx.variant, time: 0, clock: 0, scroll: 0, scrollTo: 0, flip: Array(perkCount).fill(0), over: Array(perkCount).fill(false),
        took: false, shock: 0, sink: BUTTONS.map(() => 0), apply: null, skipAsked: false, done: false, cue: 0,
        base: after ? 'exhausted' : 'confident'
      } satisfies State)
    },
    step(io: StepIo) {
      s.time = io.time
      s.clock = io.time + dt
      if (s.mode === 'live') {
        if (io.pointer.scroll !== undefined) s.scrollTo = Math.min(maxScroll, Math.max(0, io.pointer.scroll))
        if (io.pointer.wheel) s.scrollTo = Math.min(maxScroll, Math.max(0, s.scrollTo + io.pointer.wheel))
        if (io.pressed) for (const link of links) if (inside(link.box, io.pointer)) s.scrollTo = link.to
        if (s.skipAsked) s.scrollTo = 0
        const gap = s.scrollTo - s.scroll
        s.scroll = Math.abs(gap) < 0.05 ? s.scrollTo : s.scroll + gap * Math.min(1, dt * 16)
      } else if (!rejected()) s.scroll = scrollAt(plan, io.time)

      if (rejected() && s.mode === 'film' && io.cursor.inAir && io.time >= LANDING.from) {
        const u = Math.min(1, (io.time - LANDING.from) / (LANDING.down - LANDING.from))
        const z = hover + (HANDOFF.z - hover) * (1 - u * u)
        io.cursor.place(HANDOFF.x, s.scroll + HANDOFF.y, (z - HANDOFF.z * HELD) / (1 - HELD))
      } else if (rejected() && s.mode === 'film' && io.step === Math.round(LANDING.lands * stepHz)) io.cursor.place(HANDOFF.x, s.scroll + HANDOFF.y, hover)
      if (s.mode === 'film') {
        const cues = rejected() ? REJECTED_CUES : CUES
        while (s.cue < cues.length && cues[s.cue]!.at <= io.time + 1e-9) {
          const c = cues[s.cue]!
          if (c.act) s.base = c.act
          if (c.react) io.cursor.react(c.react)
          s.cue++
        }
      }
      if (s.shock > 0) s.shock -= dt
      io.cursor.act(s.shock > 0 ? 'shocked' : s.base)

      const tip = { x: io.cursor.x, y: io.cursor.y }
      const walking = !io.cursor.inAir && !io.cursor.taken
      for (let i = 0; i < perkCount; i++) {
        if (!s.over[i] && walking && inside(cards[i]!, tip)) {
          s.over[i] = true
          io.emit('card-flip', cards[i]!.cx, cards[i]!.cy, false)
          if (!s.took) {
            s.took = true
            s.shock = SHOCK
            io.cursor.react('doubleTake')
          }
        } else if (s.over[i] && !near(cards[i]!, tip, LEAVE)) {
          s.over[i] = false
          io.emit('card-flip-back', cards[i]!.cx, cards[i]!.cy, false)
        }
        const to = s.over[i] ? 1 : 0
        const p = s.flip[i]!
        if (p !== to) s.flip[i] = to > p ? Math.min(1, p + dt / FLIP_SECONDS) : Math.max(0, p - dt / FLIP_SECONDS)
      }

      if (!s.apply && !s.done && walking) {
        if (s.skipAsked && s.scroll < 1) {
          s.skipAsked = false
          startApply(HERO, io)
        } else if (io.pressed) {
          for (let i = 0; i < caps.length; i++) {
            if (!inside(caps[i]!, io.pointer)) continue
            startApply(i, io)
            break
          }
        }
      }
      if (s.mode !== 'live' || s.apply || s.done) s.skipAsked = false
      if (s.apply) stepApply(io)
      for (let i = 0; i < caps.length; i++) if ((!s.apply || s.apply.button !== i) && s.sink[i]! > 0) s.sink[i] = Math.max(0, s.sink[i]! - dt / 0.14)

      io.cursor.setGround(surface(io.cursor.x, io.cursor.y))
    },
    save: () => JSON.parse(JSON.stringify(s)),
    load(state) {
      Object.assign(s, JSON.parse(JSON.stringify(state)) as State)
    },
    draw(out: DrawList) {
      const over: Record<string, Partial<Shape> | null> = {}
      for (let i = 0; i < perkCount; i++) {
        if (s.flip[i] === 0) continue
        const c = shows(i)
        const b = cards[i]!
        over[`perk-${i}`] = { v: [c], mechanism: true }
        for (const t of cardNodes[i]!.children ?? []) {
          const [, ty, , th] = t.box as [number, number, number, number]
          over[t.id] = { y: b.cy + (ty + th / 2 - b.cy) * Math.abs(c) - th / 2, v: [Math.abs(c)] }
        }
      }
      BUTTONS.forEach((id, i) => {
        if (s.sink[i]! <= 0) return
        const z = capTop(i)
        over[`${id}-cap`] = { z1: z, mechanism: true }
        over[`${id}-label`] = { z0: z, z1: z }
      })
      drawLayout(out, layout, { states: page.states(), over })
      ticker(out)
    },
    scroll: () => s.scroll,
    chrome: () => CHROME,
    view: () => null,
    camera: () => null,
    script(time: number): Pointer {
      return pointerAt(marks, plan, time, rejected())
    },
    hint(): Hint | null {
      const at = { x: hero.cx, y: hero.cy }
      if (rejected() || s.apply || s.done) return { ...at, down: false }
      if (s.time < tickerBeat.from + LOOK) return { x: cards[0]!.cx, y: cards[0]!.cy, down: false }
      return { ...at, down: Math.floor(s.time * 4) % 2 === 0 }
    },
    skip() {
      s.skipAsked = true
    },
    done: () => s.done && !rejected(),
    gag() {
      if (s.apply || s.done) return applyBeat.id
      if (rejected()) return null
      for (let i = 0; i < perkCount; i++) if (turning(i)) return perksBeat.id
      if (s.time < strollBeat.to) return strollBeat.id
      if (s.time < perksBeat.to) return perksBeat.id
      if (s.time < tickerBeat.to) return tickerBeat.id
      return null
    },
    ignoring: () => false,
    states() {
      const out = ['rest', rejected() ? 'rejected' : 'hiring']
      for (let i = 0; i < perkCount; i++) out.push(shows(i) > 0 ? perkStates(i).shut : perkStates(i).open)
      return out
    }
  }
  return page
}

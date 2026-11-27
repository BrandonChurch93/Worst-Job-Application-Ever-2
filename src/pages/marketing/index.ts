import { beat, config, stepHz } from '../../config'
import { copy, type LayoutNode } from '../../copy'
import { HANDOFF, type Acting } from '../../cursor/body'
import { boxOf, drawLayout, find } from '../../shell/layout'
import { block } from '../../shell/metrics'
import { SCREEN_H } from '../../shell/parts'
import { words } from '../../shell/words'
import type { DrawList, GagInfo, Hint, PageContext, PageLogic, Pointer, Shape, StepIo, Tone } from '../../stage/types'
import { CARD_R, careersLayout, FIRST_CARDS, perkStates, T, TICKER } from './layout'
import { CUES, LANDING, pointerAt, REJECTED_CUES, type Marks } from './script'

const dt = 1 / stepHz
const heights = config.scale.heights
const hover = heights.cursorHover
const skipAfter = config.live.skipLinkAfterSeconds

export const FLIP_SECONDS = 0.63
const PIT_CLEAR = 8
const SHOCK = 0.8
const TURN_SHARP = 5
// Under a visitor a card comes over with weight: it is furthest past flat, by the share `past` of the half turn, at the share `over` of the flip, and settles back to flat from there.
export const SETTLE = { past: 0.045, over: 0.7 }
const tapeSpeed = 120
const DOT_GROWS = 24
const REJECTED_SETTLE = 1.7
// What the stage's hold on an arrow in the air pulls it back up by in one step, as a share of how far under the hand-off it is.
const HELD = 9 * dt
export const TRAVEL = heights.button - 4
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
const TAKE_NEAR = 150
const AUTO_GAP = 0.5
const LINK_LEAD = 96
const BUTTONS = ['nav-cta', 'hero-cta', 'final-cta'] as const
const HERO = 1

interface Apply { button: number; t: number; fx: number; fy: number; jx: number; jy: number; jumped: boolean; stamped: boolean; pressed: boolean; held: number }

interface State {
  mode: 'live' | 'film'
  variant: string
  time: number
  scroll: number
  scrollTo: number
  flip: number[]
  phase: number
  phaseTime: number
  auto: number
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

export function makePage(): PageLogic {
  const { layout, height, sections } = careersLayout()
  const beats = config.film.beats.filter((b) => b.unit === 'marketing')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: b.event ?? null }))
  const [strollBeat, perksBeat, tickerBeat, applyBeat] = ['marketing.stroll', 'marketing.perks', 'marketing.ticker', 'marketing.apply'].map((id) => beat(id)) as [ReturnType<typeof beat>, ReturnType<typeof beat>, ReturnType<typeof beat>, ReturnType<typeof beat>]
  const phaseSeconds = [strollBeat.to - strollBeat.from, perksBeat.to - perksBeat.from, tickerBeat.to - tickerBeat.from]
  const phaseGag = [strollBeat.id, perksBeat.id, tickerBeat.id]
  const maxScroll = height - SCREEN_H

  const perkCount = copy.marketing.perks.items.length
  const cards: Box[] = []
  const cardNodes: LayoutNode[] = []
  for (let i = 0; i < perkCount; i++) {
    cards.push(boxOf(layout, `perk-${i}`))
    cardNodes.push(find(layout, `perk-${i}`))
  }
  const caps = BUTTONS.map((id) => boxOf(layout, `${id}-cap`))
  const raised: { box: Box; z: number; round: boolean }[] = []
  const collect = (n: LayoutNode): void => {
    const b = { x: n.box[0]!, y: n.box[1]!, w: n.box[2]!, h: n.box[3]!, cx: n.box[0]! + n.box[2]! / 2, cy: n.box[1]! + n.box[3]! / 2 }
    if (n.kind === 'card' && !n.id.startsWith('perk-')) raised.push({ box: b, z: heights.card, round: false })
    if (n.kind === 'medallion') raised.push({ box: b, z: n.height ?? 0, round: true })
    if (n.kind === 'progressButton') raised.push({ box: b, z: heights.progressButton, round: true })
    for (const c of n.children ?? []) collect(c)
  }
  collect(layout)

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
  const afterCount = Math.ceil((TICKER.w + afterW) / (afterW + TICKER.gap)) + 1
  const afterItems = Array.from({ length: afterCount }, (_, k) => ({ id: `ticker-after-${k}`, key: afterKey, w: afterW, at: k * (afterW + TICKER.gap) }))
  const afterLength = afterCount * (afterW + TICKER.gap)
  const tapeY = boxOf(layout, 'ticker-0').y
  const tapeH = boxOf(layout, 'ticker-0').h

  const links = (['final', 'awards', 'perks'] as const).map((name, i) => {
    const b = boxOf(layout, `nav-link-${i}`)
    return { box: { ...b, x: b.x - 12, y: b.y - 16, w: b.w + 24, h: b.h + 32 }, to: Math.min(maxScroll, Math.max(0, sections[name]! - LINK_LEAD)) }
  })

  const hero = caps[HERO]!
  const start = { x: 64, y: 596 }
  const marks: Marks = {
    start,
    corner: { x: 66, y: 902 },
    cards: [0, 1, 2].map((i) => ({ x: cards[i]!.x + cards[i]!.w - 118, y: cards[i]!.y + cards[i]!.h + 4 })),
    round: { x: cards[2]!.x + cards[2]!.w + 50, y: cards[2]!.y - 44 },
    lane: { x: cards[2]!.x - 18, y: cards[2]!.y - 44 },
    medal: { x: boxOf(layout, 'award-0').x - 96, y: boxOf(layout, 'award-0').cy + 56 },
    stand: { x: hero.x + hero.w + 92, y: hero.cy - 2 },
    perch: { x: hero.x + hero.w + 26, y: hero.y - 18 },
    press: { x: hero.x + hero.w * 0.76, y: hero.cy - 4 }
  }

  const s: State = {
    mode: 'live', variant: '', time: 0, scroll: 0, scrollTo: 0, flip: Array(perkCount).fill(0), phase: 0, phaseTime: 0, auto: 0, took: false, shock: 0,
    sink: BUTTONS.map(() => 0), apply: null, skipAsked: false, done: false, cue: 0, base: 'confident'
  }
  const rejected = (): boolean => s.variant === 'rejected'
  const capTop = (i: number): number => heights.button - TRAVEL * smooth(s.sink[i]!)
  const landing = (i: number): { x: number; y: number } => ({ x: caps[i]!.cx + Math.min(150, caps[i]!.w / 2 - 70), y: caps[i]!.cy - 32 })
  const firstOpen = (): boolean => {
    for (let i = 0; i < FIRST_CARDS; i++) if (s.flip[i]! < 1) return false
    return true
  }

  function surface(x: number, y: number): number {
    const p = { x, y }
    for (let i = 0; i < perkCount; i++) if (inside(cards[i]!, p)) return s.flip[i]! > 0 && s.flip[i]! < 1 ? turningTop(i) : heights.card
    for (let i = 0; i < caps.length; i++) if (inside(caps[i]!, p)) return capTop(i)
    for (const r of raised) {
      if (!inside(r.box, p)) continue
      if (r.round && Math.hypot(x - r.box.cx, y - r.box.cy) > r.box.w / 2) continue
      return r.z
    }
    return 0
  }

  function openCard(i: number, io: StepIo): void {
    if (s.flip[i]! > 0) return
    s.flip[i] = dt / FLIP_SECONDS
    io.emit('card-flip', cards[i]!.cx, cards[i]!.cy, false)
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

  function stepPhases(io: StepIo): void {
    if (rejected() || s.phase >= phaseSeconds.length) return
    s.phaseTime += dt
    let over = s.phaseTime >= phaseSeconds[s.phase]! - 1e-9
    if (s.phase === 1) {
      if (!firstOpen()) {
        over = false
        if (s.phaseTime >= skipAfter) {
          s.auto -= dt
          if (s.auto <= 0) {
            for (let i = 0; i < FIRST_CARDS; i++) {
              if (s.flip[i]! > 0) continue
              openCard(i, io)
              s.auto = AUTO_GAP
              break
            }
          }
        }
      }
    }
    if (over) {
      s.phase++
      s.phaseTime = 0
    }
  }

  const turnOf = (i: number): number => {
    const u = s.flip[i]!
    if (s.mode !== 'live') return Math.PI * (0.5 + (0.5 * Math.tanh(TURN_SHARP * (u - 0.5))) / Math.tanh(TURN_SHARP / 2))
    return Math.PI * (u <= SETTLE.over ? (1 + SETTLE.past) * smooth(u / SETTLE.over) : 1 + (SETTLE.past * (1 + Math.cos((Math.PI * (u - SETTLE.over)) / (1 - SETTLE.over)))) / 2)
  }

  const turningTop = (i: number): number => heights.card + (cards[i]!.h / 2) * Math.abs(Math.sin(turnOf(i)))

  function turning(out: DrawList, i: number): void {
    const b = cards[i]!
    const n = cardNodes[i]!
    const st = perkStates(i)
    const half = heights.card / 2
    const a = turnOf(i)
    const sin = Math.sin(a)
    const cos = Math.cos(a)
    out.push({ id: `${n.id}-pit`, part: 'perk-cards', kind: 'well', x: b.x, y: b.y, w: b.w, h: b.h, z0: -(b.h / 2 + PIT_CLEAR), z1: 0, tone: 'page', mechanism: true })
    out.push({ id: `${n.id}-slab`, part: 'perk-cards', kind: 'box', x: b.x, y: b.y, w: b.w, h: b.h, z0: half, z1: turningTop(i), tone: 'glass', r: CARD_R, turnX: -a, mechanism: true, v: [heights.card] })
    ;(n.children ?? []).forEach((c, k) => {
      const front = c.states?.includes(st.shut) === true
      const [cx, cy, cw, ch] = c.box as [number, number, number, number]
      const v = cy + ch / 2 - b.cy
      const y = b.cy + (front ? v * cos - half * sin : -v * cos + half * sin) - ch / 2
      const z = half + (front ? v * sin + half * cos : -v * sin - half * cos)
      const turnX = front ? -a : Math.PI - a
      if (c.copy !== undefined && c.type !== undefined) out.push({ id: `${n.id}-slab-${k}`, part: 'type', kind: 'text', x: cx, y, w: cw, h: ch, z0: z, z1: z, tone: 'ink', words: c.copy, type: c.type, turnX })
      else out.push({ id: `${n.id}-slab-${k}`, part: 'perk-cards', kind: 'box', role: 'cardRule', x: cx, y, w: cw, h: ch, z0: z, z1: z + 1, tone: (c.tone as Tone | undefined) ?? 'metal', turnX, mechanism: true })
    })
  }

  const tapeWindow = TICKER.w - TICKER.clip * 2
  const tapeRoom = tapeWindow - (TICKER.solid + TICKER.ramp) * 2

  // How wide the whole items are that fit in the clear of the strip, counted from item `j`.
  const fitFrom = (items: { at: number; w: number }[], length: number, j: number): number => {
    let end = 0
    for (let k = 0; k < items.length; k++) {
      const item = items[(j + k) % items.length]!
      const rel = mod(item.at - items[j]!.at, length)
      if (k > 0 && rel === 0) break
      if (rel + item.w > tapeRoom) break
      end = rel + item.w
    }
    return end
  }
  const leadOf = (items: { at: number; w: number }[], length: number, j = 0): number => {
    const end = fitFrom(items, length, j)
    return end > 0 ? (tapeWindow - end) / 2 : TICKER.pad
  }
  const tapeLead = leadOf(tapeItems, tapeLength)
  const afterLead = leadOf(afterItems, afterLength)

  // The tape's speed is set so that the page at rest, before a second has passed, shows whole items in the middle of the strip too,
  // as it does at the moment of the key: of the speeds that do that, the one nearest `tapeSpeed`. `restLead` is where those items begin.
  const [tapeRate, restLead] = ((): [number, number] => {
    let best: [number, number] = [tapeSpeed, tapeLead]
    let off = tapeSpeed * 0.4
    for (let j = 0; j < tapeItems.length; j++) {
      const lead = leadOf(tapeItems, tapeLength, j)
      const rate = mod(-(tapeItems[j]!.at - (lead - tapeLead)), tapeLength) / applyBeat.from
      if (Math.abs(rate - tapeSpeed) < off) {
        off = Math.abs(rate - tapeSpeed)
        best = [rate, lead]
      }
    }
    return best
  })()
  const ease = (t: number): number => {
    const u = Math.max(0, Math.min(1, t))
    return u * u * (3 - 2 * u)
  }

  // A run that crosses an end of the window is set in whole glyphs as far as it lies inside: from its head as it comes in, from its tail as it leaves. `cutOf` is how wide that is, and `CUT_INK` the room kept for the ink that stands outside a letter's own width.
  const CUT_INK = 3
  const CUT_HEAD = { ...T.tape, cut: true } as const
  const CUT_TAIL = { ...T.tape, cut: true, align: 'right' } as const
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

  function ticker(out: DrawList): void {
    const left = TICKER.x + TICKER.clip
    const right = TICKER.x + TICKER.w - TICKER.clip
    out.push({ id: 'ticker-tape', part: 'ticker', kind: 'box', x: TICKER.x + TICKER.edge, y: TICKER.y + TICKER.edge, w: TICKER.w - TICKER.edge * 2, h: TICKER.h - TICKER.edge * 2, z0: TICKER.floor, z1: TICKER.tape, tone: 'paper' })
    const items = rejected() ? afterItems : tapeItems
    const length = rejected() ? afterLength : tapeLength
    const tape = rejected() ? (s.time - REJECTED_SETTLE) * tapeSpeed : (s.time - applyBeat.from) * tapeRate
    const lead = rejected() ? afterLead : tapeLead
    const whole = rejected() ? afterLead : Math.round(restLead + (tapeLead - restLead) * ease(s.time / applyBeat.from))
    const frostTo = Math.max(TICKER.solid, whole - TICKER.gap)
    const clear = TICKER.clip + frostTo + TICKER.gap - 6
    out.push({ id: 'ticker-glass', part: 'ticker', kind: 'box', x: TICKER.x, y: TICKER.y, w: TICKER.w, h: TICKER.h, r: TICKER.r, z0: 0, z1: TICKER.thick, tone: 'glass', mechanism: true, v: [TICKER.clip + frostTo, TICKER.gap - 6] })
    for (const item of items) {
      let rel = mod(item.at - tape, length)
      if (rel + item.w + TICKER.gap > length) rel -= length
      const x = left + lead + rel
      if (x + item.w > left + 2 && x < right - 2) {
        const run = { id: `${item.id}-run`, part: 'type', kind: 'text', y: tapeY, h: tapeH, z0: TICKER.tape, z1: TICKER.tape, tone: 'ink', words: item.key } as const
        if (x >= left + CUT_INK && x + item.w <= right - CUT_INK) out.push({ ...run, x, w: item.w, type: T.tape })
        else {
          const leaving = x < left + CUT_INK
          const w = cutOf(item.key, (leaving ? x + item.w - left : right - x) - CUT_INK, leaving)
          if (w > 0) out.push({ ...run, x: leaving ? x + item.w - w : x, w, type: leaving ? CUT_TAIL : CUT_HEAD })
        }
      }
      const dot = x + item.w + TICKER.gap / 2
      const d = Math.round(Math.max(0, Math.min(1, (Math.min(dot - TICKER.x, TICKER.x + TICKER.w - dot) - clear) / DOT_GROWS)) * 8) / 2
      if (d > 0) out.push({ id: `${item.id}-dot`, part: 'ticker', kind: 'disc', x: dot - d / 2, y: TICKER.y + TICKER.h / 2 - d / 2, w: d, h: d, z0: TICKER.tape, z1: TICKER.tape + 0.6, tone: 'dark' })
    }
  }

  const page: PageLogic = {
    id: 'marketing', unit: 'marketing', width: 1920, height, layout, gags, start, control: 'pointer',
    reset(ctx: PageContext) {
      const after = ctx.variant === 'rejected'
      Object.assign(s, {
        mode: ctx.mode, variant: ctx.variant, time: 0, scroll: 0, scrollTo: 0, flip: Array(perkCount).fill(0),
        phase: after ? phaseSeconds.length : 0, phaseTime: 0, auto: 0, took: false, shock: 0, sink: BUTTONS.map(() => 0), apply: null, skipAsked: false, done: false, cue: 0,
        base: after ? 'exhausted' : 'confident'
      } satisfies State)
    },
    step(io: StepIo) {
      s.time = io.time
      if (s.mode === 'live') {
        if (io.pointer.scroll !== undefined) s.scrollTo = Math.min(maxScroll, Math.max(0, io.pointer.scroll))
        if (io.pointer.wheel) s.scrollTo = Math.min(maxScroll, Math.max(0, s.scrollTo + io.pointer.wheel))
        if (io.pressed) for (const link of links) if (inside(link.box, io.pointer)) s.scrollTo = link.to
        const gap = s.scrollTo - s.scroll
        s.scroll = Math.abs(gap) < 0.05 ? s.scrollTo : s.scroll + gap * Math.min(1, dt * 16)
      }

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
        const p = s.flip[i]!
        if (p === 0 && walking && inside(cards[i]!, tip)) {
          openCard(i, io)
          io.cursor.react('startle')
        }
        if (p > 0 && p < 1) {
          const next = Math.min(1, p + dt / FLIP_SECONDS)
          s.flip[i] = next
          if (i === 0 && !s.took && p < 0.8 && next >= 0.8 && walking && near(cards[0]!, tip, TAKE_NEAR)) {
            s.took = true
            s.shock = SHOCK
            io.cursor.react('doubleTake')
          }
        }
      }

      if (!s.apply && !s.done && walking) {
        if (s.skipAsked) startApply(HERO, io)
        else if (io.pressed) {
          for (let i = 0; i < caps.length; i++) {
            if (!inside(caps[i]!, io.pointer)) continue
            startApply(i, io)
            break
          }
        }
      }
      s.skipAsked = false
      if (s.apply) stepApply(io)
      for (let i = 0; i < caps.length; i++) if ((!s.apply || s.apply.button !== i) && s.sink[i]! > 0) s.sink[i] = Math.max(0, s.sink[i]! - dt / 0.14)
      stepPhases(io)

      io.cursor.setGround(surface(io.cursor.x, io.cursor.y))
    },
    save: () => JSON.parse(JSON.stringify(s)),
    load(state) {
      Object.assign(s, JSON.parse(JSON.stringify(state)) as State)
    },
    draw(out: DrawList) {
      const over: Record<string, Partial<Shape> | null> = {}
      for (let i = 0; i < perkCount; i++) if (s.flip[i]! > 0 && s.flip[i]! < 1) over[`perk-${i}`] = null
      BUTTONS.forEach((id, i) => {
        if (s.sink[i]! <= 0) return
        const z = capTop(i)
        over[`${id}-cap`] = { z1: z, mechanism: true }
        over[`${id}-label`] = { z0: z, z1: z }
      })
      drawLayout(out, layout, { states: page.states(), over })
      for (let i = 0; i < perkCount; i++) if (s.flip[i]! > 0 && s.flip[i]! < 1) turning(out, i)
      ticker(out)
    },
    scroll: () => s.scroll,
    view: () => null,
    camera: () => null,
    script(time: number): Pointer {
      return pointerAt(marks, time, rejected())
    },
    hint(): Hint | null {
      const at = { x: hero.cx, y: hero.cy }
      if (rejected() || s.apply || s.done) return { ...at, down: false }
      if (s.phase < 2) {
        for (let i = 0; i < FIRST_CARDS; i++) if (s.flip[i] === 0) return { x: cards[i]!.cx, y: cards[i]!.cy, down: false }
        return { x: marks.stand.x, y: marks.stand.y, down: false }
      }
      return { ...at, down: Math.floor(s.time * 4) % 2 === 0 }
    },
    skip() {
      s.skipAsked = true
    },
    done: () => s.done && !rejected(),
    gag() {
      if (s.apply || s.done) return applyBeat.id
      for (let i = 0; i < perkCount; i++) if (s.flip[i]! > 0 && s.flip[i]! < 1) return perksBeat.id
      return s.phase < phaseGag.length ? phaseGag[s.phase]! : null
    },
    ignoring: () => false,
    states() {
      const out = ['rest', rejected() ? 'rejected' : 'hiring']
      for (let i = 0; i < perkCount; i++) {
        const st = perkStates(i)
        if (s.flip[i]! >= 1) out.push(st.open)
        else if (s.flip[i] === 0) out.push(st.shut)
      }
      return out
    }
  }
  return page
}

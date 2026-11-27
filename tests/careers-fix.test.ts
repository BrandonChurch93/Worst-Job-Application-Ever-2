import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { FLIP_SECONDS, LEAVE } from '../src/pages/marketing'
import { careersLayout, perkStates, T, TICKER, WIDTH } from '../src/pages/marketing/layout'
import { OPENING } from '../src/pages/marketing/script'
import { block } from '../src/shell/metrics'
import { words } from '../src/shell/words'
import { fitPicture } from '../src/core/levelFit'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, type Driver, type DriverView } from '../src/stage/stage'
import type { DrawList, Pointer, Shape } from '../src/stage/types'

const seconds = (n: number): number => Math.round(n * stepHz)
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const live = (driver: Driver): Stage => new Stage({ mode: 'live', flow: liveFlow(), pages, driver, seed: config.seed })

function drawn(stage: Stage): Shape[] {
  const list: DrawList = []
  stage.page.draw(list)
  return list as Shape[]
}

function boxOf(id: string): number[] {
  let found: number[] | null = null
  const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
    if (n.id === id) found = n.box
    for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
  }
  walk(careersLayout().layout)
  return found!
}

// The mouse of a visitor who has wheeled down to the cards: outside the first card, into it at `enter`, out of it at `leave`.
function mouse(enter: number, leave: number): Driver {
  const card = boxOf('perk-0')
  const to = card[1]! - 240
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const wheel = v.scroll < to - 1 && v.step % 4 === 0 ? { wheel: Math.min(160, to - v.scroll) } : {}
      const on = v.time >= enter && v.time < leave
      return { x: on ? card[0]! + 180 : card[0]! - 120, y: card[1]! + 160 - v.scroll, down: false, ...wheel }
    }
  }
}

describe('fault A: a card flips back when the pointer leaves', () => {
  it('turns to its back with the fine print large under the arrow, and back to its face when the arrow leaves', () => {
    const s = live(mouse(4, 6))
    const st = perkStates(0)
    s.advance(seconds(3.9))
    expect(s.page.states()).toContain(st.shut)
    expect(s.events.filter((e) => e.name === 'card-flip').length).toBe(0)
    s.advance(seconds(1.9))
    expect(s.page.states()).toContain(st.open)
    expect(s.events.filter((e) => e.name === 'card-flip').length).toBe(1)
    expect(s.events.filter((e) => e.name === 'card-flip-back').length).toBe(0)
    const back = drawn(s).filter((d) => d.kind === 'text' && d.id.startsWith('perk-0-'))
    expect(back.map((d) => d.id)).toEqual(['perk-0-fine-large'])
    expect(back[0]!.words).toBe('copy:marketing.perks.items.0.finePrint')
    expect(back[0]!.type!.px).toBeGreaterThan(T.small.px + 6)
    s.advance(seconds(2.2))
    expect(s.page.states()).toContain(st.shut)
    expect(s.events.filter((e) => e.name === 'card-flip').length).toBe(1)
    expect(s.events.filter((e) => e.name === 'card-flip-back').length).toBe(1)
    const face = drawn(s).filter((d) => d.kind === 'text' && d.id.startsWith('perk-0-'))
    expect(face.map((d) => d.id)).toEqual(['perk-0-title', 'perk-0-promise', 'perk-0-fine'])
    for (const d of face) expect(d.v).toBeUndefined()
    expect(drawn(s).find((d) => d.id === 'perk-0')!.v).toBeUndefined()
  })

  it('takes the time of one flip each way, shows one side at a time, and never leaves its place', () => {
    const s = live(mouse(4, 6))
    const card = boxOf('perk-0')
    const seen: number[] = []
    let from = 0
    let to = 0
    for (let i = 0; i < seconds(8); i++) {
      s.advance(1)
      const slab = drawn(s).find((d) => d.id === 'perk-0')!
      expect([slab.x, slab.y, slab.w, slab.h]).toEqual(card)
      const c = slab.v?.[0] ?? 1
      seen.push(c)
      if (c < 1 && !from) from = i
      if (c <= -1 && !to) to = i
      const texts = drawn(s).filter((d) => d.kind === 'text' && d.id.startsWith('perk-0-'))
      const large = texts.some((d) => d.id === 'perk-0-fine-large')
      expect(large).toBe(c <= 0)
      expect(texts.length).toBe(large ? 1 : 3)
      for (const d of texts) {
        expect(d.y).toBeGreaterThanOrEqual(card[1]! - 0.01)
        expect(d.y + d.h).toBeLessThanOrEqual(card[1]! + card[3]! + 0.01)
      }
    }
    expect((to - from + 1) / stepHz).toBeCloseTo(FLIP_SECONDS, 1)
    expect(Math.min(...seen)).toBe(-1)
    expect(seen[seen.length - 1]).toBe(1)
    for (let i = 1; i < seen.length; i++) expect(Math.abs(seen[i]! - seen[i - 1]!)).toBeLessThan(0.12)
  })

  it('does not flutter at the edge: it goes back only when the arrow is clear of the card', () => {
    const card = boxOf('perk-0')
    const to = card[1]! - 240
    const edge: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        const wheel = v.scroll < to - 1 && v.step % 4 === 0 ? { wheel: Math.min(160, to - v.scroll) } : {}
        const x = v.time < 4 ? card[0]! - 120 : v.time < 5 ? card[0]! + 30 : card[0]! - LEAVE + 6 + (v.step % 2) * 4
        return { x, y: card[1]! + 160 - v.scroll, down: false, ...wheel }
      }
    }
    const s = live(edge)
    s.advance(seconds(9))
    expect(s.events.filter((e) => e.name === 'card-flip').length).toBe(1)
    expect(s.events.filter((e) => e.name === 'card-flip-back').length).toBe(0)
  })

  it('flips one card in the film, the one with the salary, and it goes back when the arrow leaves', () => {
    const s = film()
    s.advance(seconds(9))
    const flips = s.events.filter((e) => e.name === 'card-flip')
    const backs = s.events.filter((e) => e.name === 'card-flip-back').map((e) => e.step / stepHz)
    expect(flips.length).toBe(1)
    expect(backs.length).toBe(1)
    const card = boxOf('perk-1')
    expect(flips[0]!.x).toBeCloseTo(card[0]! + card[2]! / 2, 3)
    expect(backs[0]! - flips[0]!.step / stepHz).toBeGreaterThan(FLIP_SECONDS + 0.4)
    for (let i = 0; i < 8; i++) expect(s.page.states()).toContain(perkStates(i).shut)
  })
})

describe('fault B: the ticker is a band from edge to edge', () => {
  it('has its band from x 0 to 1920 on the first screen, and the picture fills the window at every width from 1280 to 2560', () => {
    const band = boxOf('ticker-window')
    expect([band[0], band[2]]).toEqual([0, WIDTH])
    expect([TICKER.x, TICKER.w, TICKER.clip]).toEqual([0, WIDTH, 0])
    expect(band[1]! + band[3]!).toBeLessThanOrEqual(1080)
    for (const w of [1280, 1440, 1920, 2560]) {
      const fit = fitPicture(w, Math.round((w * 9) / 16), 1, 1, false)
      expect(fit.cssWidth, `${w}`).toBe(w)
    }
  })

  it('carries type the whole way across at every moment, in whole glyphs at both ends', () => {
    for (const t of [0, 1.3, 4.7, 9.1, 11, 12.6]) {
      const s = film()
      s.advance(seconds(t))
      const runs = drawn(s).filter((d) => d.id.includes('-run')).sort((a, b) => a.x - b.x)
      expect(runs.length, `${t}`).toBeGreaterThan(3)
      expect(runs[0]!.x, `${t}`).toBeLessThan(TICKER.gap + 30)
      const last = runs[runs.length - 1]!
      expect(last.x + last.w, `${t}`).toBeGreaterThan(WIDTH - TICKER.gap - 30)
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i]!
        expect(r.x, `${t} ${r.id}`).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w, `${t} ${r.id}`).toBeLessThanOrEqual(WIDTH)
        if (i > 0) expect(r.x - (runs[i - 1]!.x + runs[i - 1]!.w), `${t} ${r.id}`).toBeGreaterThanOrEqual(TICKER.gap - 0.01)
        const whole = block(T.tape.font, words(r.words!), T.tape.px).width
        if (r.type!.cut) expect(r.w).toBeLessThan(whole)
        else expect(r.w).toBeCloseTo(whole, 3)
      }
    }
  })

  it('runs at one speed and stands at the key with a whole item at its mark', () => {
    const s = film()
    s.advance(seconds(OPENING.key))
    const key = drawn(s).find((d) => d.id === `ticker-${TICKER.keyItem}-run`)!
    expect(key.x).toBeCloseTo(TICKER.keyAt, 3)
    s.advance(seconds(0.5))
    const later = drawn(s).find((d) => d.id === `ticker-${TICKER.keyItem}-run`)!
    expect(key.x - later.x).toBeCloseTo(TICKER.speed * 0.5, 3)
  })
})

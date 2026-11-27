import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { makePage } from '../src/pages/marketing'
import { careersLayout, FIRST_SCREEN, WIDTH } from '../src/pages/marketing/layout'
import { OPENING } from '../src/pages/marketing/script'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords, words } from '../src/shell/words'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, type Driver, type DriverView } from '../src/stage/stage'
import type { DrawList, Pointer } from '../src/stage/types'

const tolerance = config.film.beatToleranceSeconds
const beats = config.film.beats.filter((b) => b.unit === 'marketing')
const unit = config.film.units.find((u) => u.id === 'marketing')!
const seconds = (n: number): number => Math.round(n * stepHz)

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const live = (driver: Driver, rejected = false): Stage =>
  new Stage({ mode: 'live', flow: rejected ? [{ page: 'marketing', variant: 'rejected' }, { page: 'step1' }] : liveFlow(), pages, driver, seed: config.seed })

const still = (at: { x: number; y: number }): Driver => ({ name: 'bot', input: (): Pointer => ({ x: at.x, y: at.y, down: false }) })
const wrong: Driver = {
  name: 'bot',
  input(v: DriverView): Pointer {
    const beat = Math.floor(v.time * 3)
    return { x: 1890 - (beat % 3) * 6, y: 1056 - (beat % 2) * 8, down: beat % 2 === 0 }
  }
}

function drawn(stage: Stage): DrawList {
  const list: DrawList = []
  stage.page.draw(list)
  return list
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

function checkWords(list: DrawList, where: string): void {
  for (const s of list) {
    if (s.kind !== 'text') continue
    expect(s.words, `${where} ${s.id}`).toMatch(/^(copy:|data:)/)
    expect(s.text, `${where} ${s.id}`).toBeUndefined()
    expect(hasWords(s.words!), `${where} ${s.words}`).toBe(true)
    expect(words(s.words!).length, `${where} ${s.words}`).toBeGreaterThan(0)
  }
}

describe('the careers page', () => {
  it('is a whole website taller than a screen, with the beats of its unit as gags and its own navigation in place of the header', () => {
    const page = makePage()
    expect(page.id).toBe('marketing')
    expect(page.unit).toBe('marketing')
    expect(page.width).toBe(WIDTH)
    expect(page.height).toBeGreaterThan(5357)
    expect(page.height).toBeLessThan(5357 + 400)
    expect(page.gags.map((g) => g.id)).toEqual(beats.map((b) => b.id))
    expect(page.chrome!()).toEqual({ header: 0 })
  })

  it('has the sections of the approved picture in its order, each on its own white sheet from edge to edge', () => {
    const { layout, height, sections } = careersLayout()
    expect(layoutProblems(layout, { width: WIDTH, height })).toEqual([])
    const order = ['top', 'perks', 'testimonials', 'faq', 'comparison', 'process', 'final', 'footer']
    expect(Object.keys(sections)).toEqual(order)
    let last = -1
    for (const name of order) {
      expect(sections[name]!).toBeGreaterThan(last)
      last = sections[name]!
      const b = boxOf(`sheet-${name}`)
      expect([b[0], b[1], b[2]]).toEqual([0, sections[name], WIDTH])
    }
    expect(sections.perks).toBe(FIRST_SCREEN)
    const list = drawn(film())
    const sheets = list.filter((s) => s.role === 'sheet')
    expect(sheets.length).toBe(order.length)
    expect(sheets.reduce((a, s) => a + s.h, 0)).toBeCloseTo(height, 3)
  })

  it('takes every word from the copy, and holds all six staff quotes, all eight benefits, all five awards with their fine print', () => {
    const { layout } = careersLayout()
    const used = new Set(typeRegister(layout).map((r) => r.key))
    for (const key of used) expect(key).toMatch(/^(copy:|data:)/)
    for (let i = 0; i < 6; i++) for (const part of ['quote', 'role', 'note']) expect(used.has(`copy:marketing.testimonials.items.${i}.${part}`), `quote ${i} ${part}`).toBe(true)
    for (let i = 0; i < 8; i++) for (const part of ['title', 'promise', 'finePrint']) expect(used.has(`copy:marketing.perks.items.${i}.${part}`), `perk ${i} ${part}`).toBe(true)
    for (let i = 0; i < 5; i++) for (const part of ['title', 'from', 'finePrint']) expect(used.has(`copy:marketing.awards.items.${i}.${part}`), `award ${i} ${part}`).toBe(true)
    expect(used.has('copy:step5.closing')).toBe(true)
    for (const t of [0, 3.6, 9, 11, 13.2, 18.3]) {
      const s = film()
      s.advance(seconds(t))
      checkWords(drawn(s), `film ${t}`)
    }
    const rows = [0, 1].map((r) => [0, 1, 2].map((c) => boxOf(`quote-${r * 3 + c}`)))
    for (const row of rows) for (const b of row) expect(b[1]).toBe(row[0]![1])
    expect(rows[1]![0]![1]!).toBeGreaterThan(rows[0]![0]![1]! + rows[0]![0]![3]!)
  })

  it('keeps each beat and its event inside its window in the film: one card turned, one press at 18 s, then the turn', () => {
    const s = film()
    s.advance(seconds(unit.seconds))
    const at = (name: string): number[] => s.events.filter((e) => e.name === name).map((e) => e.step / stepHz)
    for (const b of beats) {
      if (!b.event) continue
      const hits = at(b.event).filter((t) => t >= b.from - tolerance && t <= b.to + tolerance)
      expect(hits.length, `${b.id} ${b.event}`).toBeGreaterThan(0)
    }
    expect(beats[0]!.from).toBe(0)
    expect(beats[beats.length - 1]!.to).toBe(unit.seconds)
    for (let i = 1; i < beats.length; i++) expect(beats[i]!.from).toBe(beats[i - 1]!.to)
    const flips = at('card-flip')
    expect(flips.length).toBe(1)
    const press = at('button-press')
    expect(press.length).toBe(1)
    expect(Math.abs(press[0]! - OPENING.total)).toBeLessThanOrEqual(0.03)
    expect(press[0]!).toBeLessThan(at('page-turn')[0]!)
    expect(at('page-turn')[0]!).toBe(unit.seconds - 0.5)
  })

  it('names the beat it is in at each moment of the film', () => {
    const s = film()
    for (const b of beats) {
      s.seek(b.id === 'marketing.apply' ? OPENING.total + 0.3 : (b.from + b.to) / 2)
      expect(s.page.gag()).toBe(b.id)
    }
  })

  it('holds at the top, then scrolls down the whole page in the film and stands at the bottom for Apply', () => {
    const s = film()
    const at = (t: number): number => {
      s.seek(t)
      return s.page.scroll()
    }
    expect(at(OPENING.key)).toBe(0)
    expect(at(OPENING[OPENING.use].scrollFrom)).toBe(0)
    let before = 0
    for (let t = 3; t <= 16.5; t += 0.5) {
      const now = at(t)
      expect(now, `${t}`).toBeGreaterThanOrEqual(before)
      before = now
    }
    const button = boxOf('final-cta-cap')
    const under = boxOf('final-under')
    for (const t of [16.5, OPENING.total, unit.seconds - 0.6]) {
      expect(at(t)).toBe(careersLayout().height - 1080)
      expect(button[1]! - at(t)).toBeGreaterThan(300)
      expect(under[1]! + under[3]! - at(t)).toBeLessThan(1080 - 100)
    }
  })

  it('stands the arrow by the button of the hero at the moment of the key', () => {
    const s = film()
    s.seek(OPENING.key)
    const cap = boxOf('hero-cta-cap')
    const p = s.cursor.pose()
    expect(s.page.scroll()).toBe(0)
    expect(p.x).toBeGreaterThan(cap[0]! + cap[2]!)
    expect(p.x).toBeLessThan(cap[0]! + cap[2]! + 140)
    expect(p.y).toBeGreaterThan(cap[1]!)
    expect(p.y).toBeLessThan(cap[1]! + cap[3]!)
    expect(s.cursor.taken).toBe(false)
  })

  it('has Apply live from the first frame: a press on any of its three buttons turns the page to step 1, with no card opened', () => {
    for (const id of ['nav-cta', 'hero-cta', 'final-cta']) {
      const cap = boxOf(`${id}-cap`)
      const cx = cap[0]! + cap[2]! / 2
      const cy = cap[1]! + cap[3]! / 2
      const page = makePage()
      const scroll = Math.max(0, Math.min(page.height - 1080, cy - 540))
      const driver: Driver = {
        name: 'bot',
        input(v: DriverView): Pointer {
          const wheel = v.scroll < scroll - 60 ? 120 : 0
          const there = Math.hypot(v.cursor.x - cx, v.cursor.y - cy) < 12
          return { x: cx, y: cy - v.scroll, down: there && Math.floor(v.time * 4) % 2 === 0, ...(wheel && v.step % 24 === 0 ? { wheel } : {}) }
        }
      }
      const s = live(driver)
      let held = 0
      let longest = 0
      let pressedAt = 0
      while (s.page.id === 'marketing' && s.step < seconds(90)) {
        s.advance(1)
        held = s.cursor.taken ? held + 1 : 0
        longest = Math.max(longest, held)
        if (!pressedAt && s.events.some((e) => e.name === 'button-press')) pressedAt = s.step
      }
      expect(s.page.id, id).toBe('step1')
      expect(s.events.filter((e) => e.name === 'button-press').length, id).toBe(1)
      expect(s.events.filter((e) => e.name === 'card-flip' && e.step < pressedAt).length, id).toBeLessThan(3)
      expect(longest / stepHz, id).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    }
    const first = boxOf('hero-cta-cap')
    const quick = live({ name: 'bot', input: (v: DriverView): Pointer => ({ x: first[0]! + 200, y: first[1]! + 40, down: Math.floor(v.time * 4) % 2 === 0 }) })
    while (quick.page.id === 'marketing' && quick.step < seconds(20)) quick.advance(1)
    expect(quick.page.id).toBe('step1')
    expect(quick.events.filter((e) => e.name === 'card-flip').length).toBe(0)
    expect(quick.step / stepHz).toBeLessThan(8)
  })

  it('never ends by itself: a still pointer and a wrong pointer leave the page where it is, with nothing taken', () => {
    for (const [name, driver] of [['still', still(makePage().start)], ['wrong', wrong]] as const) {
      const s = live(driver)
      let held = 0
      for (let i = 0; i < seconds(30); i++) {
        s.advance(1)
        if (s.cursor.taken) held++
      }
      expect(s.page.id, name).toBe('marketing')
      expect(s.page.done(), name).toBe(false)
      expect(s.page.gag(), name).toBeNull()
      expect(held, name).toBe(0)
      expect(s.page.hint()).toMatchObject({ x: expect.any(Number), y: expect.any(Number) })
    }
  })

  it('goes down the whole page under the wheel, and to a section at a press on its link', () => {
    const page = makePage()
    const s = live({ name: 'bot', input: (v: DriverView): Pointer => ({ x: 960, y: 540, down: false, ...(v.step % 6 === 0 ? { wheel: 240 } : {}) }) })
    s.advance(seconds(20))
    expect(s.page.scroll()).toBeCloseTo(page.height - 1080, 1)
    const link = boxOf('nav-link-2')
    const t = live({ name: 'bot', input: (v: DriverView): Pointer => ({ x: link[0]! + 20, y: link[1]! + 6, down: v.time > 1 && v.time < 1.2 }) })
    t.advance(seconds(4))
    expect(t.page.scroll()).toBeGreaterThan(900)
    expect(t.page.scroll()).toBeLessThan(1080)
  })

  it('keeps the rejected variant: the closing line in the footer and the one line on the ticker', () => {
    const after = live(still({ x: 960, y: 540 }), true)
    after.advance(seconds(3))
    expect(after.page.states()).toContain('rejected')
    const list = drawn(after)
    checkWords(list, 'rejected')
    const said = new Set(list.filter((d) => d.kind === 'text').map((d) => d.words!))
    expect(said.has('copy:step5.closing')).toBe(true)
    expect(said.has('copy:marketing.footer.tagline')).toBe(false)
    expect(said.has('copy:marketing.tickerAfterRejection')).toBe(true)
    const runs = list.filter((d) => d.id.includes('-run'))
    expect(runs.length).toBeGreaterThan(2)
    for (const r of runs) expect(r.words).toBe('copy:marketing.tickerAfterRejection')
    const hiring = new Set(drawn(film()).filter((d) => d.kind === 'text').map((d) => d.words!))
    expect(hiring.has('copy:step5.closing')).toBe(false)
    expect(hiring.has('copy:marketing.footer.tagline')).toBe(true)
  })

  it('saves and loads its state, and plays the same twice', () => {
    const run = (): string => {
      const s = film()
      s.advance(seconds(6.2))
      return JSON.stringify(drawn(s))
    }
    expect(run()).toBe(run())
    const s = film()
    s.advance(seconds(5))
    const saved = s.page.save()
    const before = JSON.stringify(drawn(s))
    s.advance(seconds(2))
    s.page.load(saved)
    expect(JSON.stringify(drawn(s))).toBe(before)
  })
})

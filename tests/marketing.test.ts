import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { makePage } from '../src/pages/marketing'
import { careersLayout, FIRST_CARDS } from '../src/pages/marketing/layout'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { hasWords, words } from '../src/shell/words'
import { runBot, filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, type Driver, type DriverView } from '../src/stage/stage'
import type { DrawList, Pointer } from '../src/stage/types'

const tolerance = config.film.beatToleranceSeconds
const beats = config.film.beats.filter((b) => b.unit === 'marketing')
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

function leaves(value: unknown, path: string, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}.${i}`, out))
  else if (value !== null && typeof value === 'object') for (const [k, v] of Object.entries(value)) leaves(v, `${path}.${k}`, out)
  else out.push(path)
  return out
}

function checkWords(list: DrawList, where: string): void {
  for (const s of list) {
    if (s.kind !== 'text') continue
    expect(s.words, `${where} ${s.id}`).toMatch(/^(copy:|data:|applicant\.|runtime:)/)
    expect(s.text, `${where} ${s.id}`).toBeUndefined()
    expect(hasWords(s.words!), `${where} ${s.words}`).toBe(true)
    expect(words(s.words!).length, `${where} ${s.words}`).toBeGreaterThan(0)
  }
}

function checkBoxes(stage: Stage, where: string): void {
  const page = stage.page
  const boxes = new Map<string, number[]>()
  const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
    boxes.set(n.id, n.box)
    for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
  }
  walk(page.layout)
  for (const s of drawn(stage)) {
    const box = boxes.get(s.id)
    if (!box || s.kind === 'text' || s.kind === 'well') continue
    expect([s.x, s.y, s.w, s.h], `${where} ${s.id}`).toEqual(box)
  }
}

describe('the careers page', () => {
  it('is a whole page, not a stub, with the beats of its unit as gags', () => {
    const page = makePage()
    expect(page.id).toBe('marketing')
    expect(page.unit).toBe('marketing')
    expect(page.width).toBe(1920)
    expect(page.height).toBeGreaterThan(1080 * 3)
    expect(page.gags.map((g) => g.id)).toEqual(beats.map((b) => b.id))
    const cues = config.audio.sfx.map((s) => s.id)
    for (const g of page.gags) if (g.event) expect(cues).toContain(g.event)
    expect(cues).toContain('button-press')
  })

  it('has a layout with no problems, and draws every box where the layout plans it, in each state', () => {
    const { layout, height } = careersLayout()
    expect(layoutProblems(layout, { width: 1920, height })).toEqual([])
    const moments = [0, 2.3, 3.2, 6.5, 9, 11, 12.9, 13.2]
    for (const t of moments) {
      const s = film()
      s.advance(seconds(t))
      checkBoxes(s, `film ${t}`)
      checkWords(drawn(s), `film ${t}`)
    }
    const after = live(still({ x: 960, y: 540 }), true)
    after.advance(seconds(3))
    expect(after.page.states()).toContain('rejected')
    checkBoxes(after, 'rejected')
    checkWords(drawn(after), 'rejected')
  })

  it('shows every word of its copy, each from a key', () => {
    const { layout } = careersLayout()
    const used = new Set(typeRegister(layout).map((r) => r.key))
    const left = leaves(copy.marketing, 'copy:marketing').filter((k) => !used.has(k))
    expect(left).toEqual([])
    expect(used.has('copy:step5.closing')).toBe(true)
    for (const key of used) expect(key).toMatch(/^(copy:|data:)/)

    const s = film()
    const shown = new Set<string>()
    for (let i = 0; i < 14 * 4; i++) {
      s.advance(seconds(0.25))
      for (const d of drawn(s)) if (d.kind === 'text') shown.add(d.words!)
    }
    for (let i = 0; i < FIRST_CARDS; i++) expect(shown.has(`copy:marketing.perks.items.${i}.finePrint`)).toBe(true)
    expect(shown.has('copy:marketing.ticker.0')).toBe(true)
    expect(shown.has('copy:marketing.footer.plotTwist')).toBe(true)
    expect(shown.has('copy:step5.closing')).toBe(false)

    const after = live(still({ x: 960, y: 540 }), true)
    after.advance(seconds(1))
    const words = new Set(drawn(after).filter((d) => d.kind === 'text').map((d) => d.words!))
    expect(words.has('copy:marketing.tickerAfterRejection')).toBe(true)
    expect(words.has('copy:step5.closing')).toBe(true)
    expect(words.has('copy:marketing.footer.plotTwist')).toBe(false)
    expect([...words].some((k) => k.startsWith('copy:marketing.ticker.'))).toBe(false)
  })

  it('gives each beat its event inside the beat in the film, and presses the button before the page turns', () => {
    const s = film()
    s.advance(seconds(14))
    const at = (name: string): number[] => s.events.filter((e) => e.name === name).map((e) => e.step / stepHz)
    for (const b of beats) {
      if (!b.event) continue
      const hits = at(b.event).filter((t) => t >= b.from - tolerance && t <= b.to + tolerance)
      expect(hits.length, `${b.id} ${b.event}`).toBeGreaterThan(0)
    }
    const flips = at('card-flip')
    expect(flips.length).toBe(FIRST_CARDS)
    for (const t of flips) expect(t).toBeGreaterThanOrEqual(2 - tolerance)
    for (const t of flips) expect(t).toBeLessThan(8)
    const press = at('button-press')
    expect(press.length).toBe(1)
    expect(press[0]!).toBeGreaterThan(11)
    expect(press[0]!).toBeLessThan(at('page-turn')[0]!)
  })

  it('names the beat it is in at each moment of the film', () => {
    const s = film()
    for (const b of beats) {
      const mid = b.id === 'marketing.apply' ? 13.2 : (b.from + b.to) / 2
      s.seek(mid)
      if (b.id === 'marketing.apply') expect(s.page.gag()).toBe(b.id)
      else expect([b.id, 'marketing.perks']).toContain(s.page.gag())
    }
    s.seek(11)
    const states = s.page.states()
    for (let i = 0; i < FIRST_CARDS; i++) expect(states).toContain(`perk-${i}-open`)
    expect(s.cursor.taken).toBe(false)
  })

  it('ends every gag by itself with a still pointer and with a wrong pointer, and waits for the press', () => {
    for (const [name, driver] of [['still', still(makePage().start)], ['wrong', wrong]] as const) {
      const s = live(driver)
      let held = 0
      let longest = 0
      const seen = new Set<string>()
      for (let i = 0; i < seconds(40); i++) {
        s.advance(1)
        const g = s.page.gag()
        if (g) seen.add(g)
        held = s.cursor.taken ? held + 1 : 0
        longest = Math.max(longest, held)
      }
      expect(s.page.id, name).toBe('marketing')
      expect(s.page.gag(), name).toBeNull()
      expect(s.page.done(), name).toBe(false)
      expect([...seen].sort(), name).toEqual(['marketing.perks', 'marketing.stroll', 'marketing.ticker'])
      for (let i = 0; i < FIRST_CARDS; i++) expect(s.page.states(), name).toContain(`perk-${i}-open`)
      expect(s.events.filter((e) => e.name === 'card-flip').length, name).toBe(FIRST_CARDS)
      expect(longest / stepHz, name).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(s.page.hint()).toMatchObject({ x: expect.any(Number), y: expect.any(Number) })
    }
  })

  it('starts the application from each of its three buttons, and from skip, without holding the cursor long', () => {
    const page = makePage()
    const caps = ['nav-cta-cap', 'hero-cta-cap', 'final-cta-cap'].map((id) => {
      let found: number[] | null = null
      const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
        if (n.id === id) found = n.box
        for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
      }
      walk(page.layout)
      return found! as number[]
    })
    for (const cap of caps) {
      const cx = cap[0]! + cap[2]! / 2
      const cy = cap[1]! + cap[3]! / 2
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
      while (s.page.id === 'marketing' && s.step < seconds(60)) {
        s.advance(1)
        held = s.cursor.taken ? held + 1 : 0
        longest = Math.max(longest, held)
      }
      expect(s.page.id, `cap at ${cy}`).toBe('step1')
      expect(s.events.filter((e) => e.name === 'button-press').length).toBe(1)
      expect(longest / stepHz).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    }
    const s = live(still({ x: 300, y: 900 }))
    s.advance(seconds(1))
    s.page.skip()
    s.advance(seconds(3))
    expect(s.events.some((e) => e.name === 'button-press')).toBe(true)
    expect(s.page.id).toBe('step1')
  })

  it('flips every perk card the cursor touches in live mode, and hurts nothing', () => {
    const page = makePage()
    const count = copy.marketing.perks.items.length
    let target = 0
    const centre = (i: number): { x: number; y: number } => {
      let box: number[] = []
      const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
        if (n.id === `perk-${i}`) box = n.box
        for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
      }
      walk(page.layout)
      return { x: box[0]! + box[2]! / 2, y: box[1]! + box[3]! / 2 }
    }
    const driver: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        while (target < count && v.page.states().includes(`perk-${target}-open`)) target++
        const c = centre(Math.min(target, count - 1))
        const want = Math.max(0, Math.min(page.height - 1080, c.y - 540))
        const gap = want - v.scroll
        return { x: c.x, y: c.y - v.scroll, down: false, ...(Math.abs(gap) > 2 && v.step % 24 === 0 ? { wheel: Math.max(-120, Math.min(120, gap)) } : {}) }
      }
    }
    const s = live(driver)
    s.advance(seconds(45))
    for (let i = 0; i < count; i++) expect(s.page.states(), `perk ${i}`).toContain(`perk-${i}-open`)
    expect(s.events.filter((e) => e.name === 'card-flip').length).toBe(count)
    expect(s.events.some((e) => e.hitsCursor)).toBe(false)
    expect(s.cursor.pose().damage).toEqual([])
    expect(s.page.done()).toBe(false)
  })

  it('turns a perk card over as one piece in its well, and carries the cursor no higher than half the card', () => {
    const s = film()
    const card = config.scale.heights.card
    let turningSteps = 0
    let top = 0
    for (let step = 0; step < seconds(8); step++) {
      s.advance(1)
      if (step % 8 !== 0) continue
      const list = drawn(s)
      const slabs = list.filter((i) => /^perk-\d+-slab$/.test(i.id))
      if (slabs.length === 0) continue
      turningSteps++
      for (const slab of slabs) {
        const id = slab.id.replace(/-slab$/, '')
        const pit = list.filter((i) => i.id === `${id}-pit`)
        expect(pit.length, id).toBe(1)
        expect(pit[0]!.kind).toBe('well')
        expect(list.filter((i) => i.id.startsWith(`${id}-slab`) && i.kind !== 'text' && i.role !== 'cardRule').map((i) => i.id)).toEqual([slab.id])
        expect([slab.w, slab.h]).toEqual([pit[0]!.w, pit[0]!.h])
        expect(slab.z0).toBeCloseTo(card / 2, 6)
        expect(slab.v).toEqual([card])
        expect(-pit[0]!.z0).toBeGreaterThan(pit[0]!.h / 2)
        expect(list.some((i) => i.id === id)).toBe(false)
      }
      top = Math.max(top, (s.cursor.save() as { ground: number }).ground)
    }
    expect(turningSteps).toBeGreaterThan(FIRST_CARDS * 10)
    expect(top).toBeGreaterThan(card + 40)
    expect(top).toBeLessThanOrEqual(card + 248 / 2)
    expect(s.events.some((e) => e.hitsCursor)).toBe(false)
    expect(s.cursor.pose().damage).toEqual([])
  })

  it('shows a new picture in every second of the film from 6 s to 13 s: the tape has moved and the cursor is somewhere else or in the air', () => {
    const s = film()
    const at: { x: number; y: number; z: number; tape: number }[] = []
    for (let step = 0; step <= seconds(13); step++) {
      if (step % (stepHz / 10) === 0) {
        const pose = s.cursor.pose()
        const run = drawn(s).find((i) => i.id.startsWith('ticker-item-') || /-run$/.test(i.id))
        at.push({ x: pose.x, y: pose.y, z: pose.z, tape: run ? run.x : Number.NaN })
      }
      s.advance(1)
    }
    for (let i = 60; i + 10 < at.length; i++) {
      const a = at[i]!
      const b = at[i + 10]!
      const moved = Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.z - b.z)
      expect(moved, `cursor at ${i / 10} s and ${i / 10 + 1} s`).toBeGreaterThan(8)
      expect(a.tape, `tape at ${i / 10} s and ${i / 10 + 1} s`).not.toBe(b.tape)
    }
  })

  it('never ends in the rejected variant: the buttons sink and come back', () => {
    const page = makePage()
    let cap: number[] = []
    const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
      if (n.id === 'hero-cta-cap') cap = n.box
      for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
    }
    walk(page.layout)
    const cx = cap[0]! + cap[2]! / 2
    const cy = cap[1]! + cap[3]! / 2
    const s = live({ name: 'bot', input: (v: DriverView): Pointer => ({ x: cx, y: cy, down: Math.floor(v.time * 2) % 2 === 0 }) }, true)
    let held = 0
    let longest = 0
    for (let i = 0; i < seconds(30); i++) {
      s.advance(1)
      held = s.cursor.taken ? held + 1 : 0
      longest = Math.max(longest, held)
    }
    expect(s.page.id).toBe('marketing')
    expect(s.page.done()).toBe(false)
    expect(s.page.hint()).toMatchObject({ down: false })
    expect(s.events.filter((e) => e.name === 'button-press').length).toBeGreaterThan(1)
    expect(longest / stepHz).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('continues exactly after load(save()), in the film and in live mode', () => {
    const ctx = { mode: 'film' as const, variant: '', applicant: null, seed: 1 }
    for (const at of [1.2, 2.4, 4.3, 9.1, 12.5, 12.9]) {
      const a = film()
      a.advance(seconds(at + 1))
      const b = film()
      b.advance(seconds(at))
      const saved = JSON.parse(JSON.stringify(b.page.save()))
      b.page.reset(ctx)
      b.page.load(saved)
      b.advance(seconds(1))
      expect(JSON.stringify(b.page.save()), `film ${at}`).toBe(JSON.stringify(a.page.save()))
      expect(JSON.stringify(b.cursor.save()), `film ${at}`).toBe(JSON.stringify(a.cursor.save()))
      expect(JSON.stringify(drawn(b)), `film ${at}`).toBe(JSON.stringify(drawn(a)))
    }
    const a = live(wrong)
    a.advance(seconds(26))
    const b = live(wrong)
    b.advance(seconds(23))
    const saved = JSON.parse(JSON.stringify(b.page.save()))
    b.page.reset({ mode: 'live', variant: '', applicant: null, seed: 1 })
    b.page.load(saved)
    b.advance(seconds(3))
    expect(JSON.stringify(b.page.save())).toBe(JSON.stringify(a.page.save()))
    expect(JSON.stringify(drawn(b))).toBe(JSON.stringify(drawn(a)))
  })

  it('scrolls to a section when a link of the top bar is pressed', () => {
    const { layout, sections, height } = careersLayout()
    const box = (id: string): number[] => {
      let found: number[] = []
      const walk = (n: { id: string; box: number[]; children?: unknown[] }): void => {
        if (n.id === id) found = n.box
        for (const c of (n.children ?? []) as { id: string; box: number[] }[]) walk(c)
      }
      walk(layout)
      return found
    }
    const wanted = [sections.final!, sections.awards!, sections.perks!]
    wanted.forEach((top, i) => {
      const b = box(`nav-link-${i}`)
      const at = { x: b[0]! + b[2]! / 2, y: b[1]! + b[3]! / 2 }
      let pressed = false
      const s = live({
        name: 'bot',
        input(v: DriverView): Pointer {
          if (v.time < 0.5 || pressed) return { x: at.x, y: Math.max(10, at.y - v.scroll), down: false }
          pressed = true
          return { x: at.x, y: at.y, down: true }
        }
      })
      s.advance(seconds(3))
      const scroll = s.page.scroll()
      expect(scroll, `link ${i}`).toBeGreaterThan(0)
      expect(scroll, `link ${i}`).toBeLessThanOrEqual(height - 1080)
      expect(top - scroll, `link ${i}`).toBeGreaterThan(0)
      expect(top - scroll, `link ${i}`).toBeLessThan(200)
      expect(s.page.done()).toBe(false)
    })
  })

  it('keeps the tape inside its window: a run that crosses an edge keeps its box centre in the well, so the page hides the rest', () => {
    const s = film()
    let crossing = 0
    for (let i = 0; i < 52; i++) {
      s.advance(seconds(0.25))
      const list = drawn(s)
      const well = list.find((d) => d.id === 'ticker-window')!
      const runs = list.filter((d) => d.kind === 'text' && d.id.startsWith('ticker-'))
      expect(runs.length).toBeGreaterThan(2)
      for (const r of runs) {
        const centre = r.x + r.w / 2
        expect(centre, r.id).toBeGreaterThanOrEqual(well.x)
        expect(centre, r.id).toBeLessThanOrEqual(well.x + well.w)
        expect(r.z1).toBeLessThan(0)
        if (r.type?.cut === true) crossing++
      }
    }
    expect(crossing).toBeGreaterThan(0)
  })

  it('lets every bot finish, and the keen one reach every gag of the page', () => {
    const seed = config.seed
    const keen = runBot(pages, 'keen', seed)
    for (const b of beats) expect(keen.gags, b.id).toContain(b.id)
  })
})

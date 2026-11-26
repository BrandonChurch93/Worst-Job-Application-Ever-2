import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { briefFor, packPlan } from '../tools/lib/pack-plan.mjs'
import { BACK, SITE, STANDS, STROKE, TAKES, VISITOR, makeVisitor, momentsOf, runWindow } from '../tools/lib/pack-site.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage

type File = { name: string; kind: string; heading: string; steps: number[]; run: number[]; moment: string; at?: number; part: number[] | null; apart: number | null }
type Told = { page?: string; gags?: string[]; hits?: { name: string; page: string }[]; hero?: { x: number; y: number }; turning: boolean; scroll: number; hint: { x: number; y: number; down: boolean } | null }

const key = { x: 1400, y: 300, down: false }
const firing = (hits: { name: string; page: string }[] = []): Told => ({ page: STANDS.page, gags: ['step1.keyboard', STANDS.from], hits, turning: false, scroll: 0, hint: key })
const bolt = { name: STANDS.hit, page: STANDS.page }
const far = (v: { pointer(): { x: number; y: number } }, from: { x: number; y: number }) => Math.hypot(v.pointer().x - from.x, v.pointer().y - from.y)

describe('the visitor where the turrets fire', () => {
  it('stands still, hands off, until the site tells of one bolt on the arrow, and then goes on a reaction time late', () => {
    const v = makeVisitor(1)
    for (let i = 0; i < 40; i++) v.act({ turning: false, scroll: 0, hint: { x: 960, y: 540, down: false } })
    for (let i = 0; i < VISITOR.reactSteps; i++) v.act(firing())
    const stood = v.pointer()
    for (let i = 0; i < 300; i++) {
      const acts = v.act(firing())
      if (i > 0) expect(acts).toEqual([])
    }
    expect(far(v, stood)).toBe(0)
    expect(v.waited()).toBe(VISITOR.reactSteps + 300)
    let moved = -1
    for (let i = 0; i < 40 && moved < 0; i++) {
      v.act(firing([bolt]))
      if (far(v, stood) > 0) moved = i
    }
    expect(moved).toBe(VISITOR.reactSteps)
    for (let i = 0; i < 60; i++) v.act(firing([bolt]))
    expect(Math.hypot(v.pointer().x - key.x, v.pointer().y - key.y)).toBeLessThanOrEqual(VISITOR.jitter)
  })

  it('waits no longer than its cap when no bolt lands, and says how long it stood', () => {
    const v = makeVisitor(1)
    const start = v.pointer()
    for (let i = 0; i < STANDS.mostSteps + VISITOR.reactSteps; i++) v.act(firing())
    expect(far(v, start)).toBe(0)
    for (let i = 0; i < 60; i++) v.act(firing())
    expect(v.waited()).toBe(STANDS.mostSteps)
    expect(far(v, start)).toBeGreaterThan(100)
  })

  it('does not wait on another page, before the turrets or after the first name', () => {
    const cases: Told[] = [
      { ...firing(), page: 'step2' },
      { ...firing(), gags: ['step1.keyboard'] },
      { ...firing(), gags: ['step1.keyboard', STANDS.from, STANDS.until] },
      { ...firing(), hits: [{ name: 'tug-lost', page: STANDS.page }, bolt] }
    ]
    for (const told of cases) {
      const v = makeVisitor(1)
      const start = v.pointer()
      for (let i = 0; i < 40; i++) v.act(told)
      expect(v.waited()).toBe(0)
      expect(far(v, start)).toBeGreaterThan(100)
    }
    const other = makeVisitor(1)
    for (let i = 0; i < 40; i++) other.act({ ...firing([{ name: STANDS.hit, page: 'step4' }]) })
    expect(other.waited()).toBe(40)
  })
})

describe('the stroke of the visitor as the arrow is given back', () => {
  const pile = { x: 780, y: 730, down: false }
  const go = { x: 1690, y: 780, down: false }
  const held = (gags: string[], hint: typeof pile, hero = { x: 783.4, y: 733 }): Told => ({ page: 'step1', gags, hits: [bolt], hero, turning: false, scroll: 0, hint })
  const firstMove = (gags: string[], lying: number) => {
    const v = makeVisitor(1)
    for (let i = 0; i < 60; i++) v.act(held(gags, pile, { x: 700 + i, y: 733 }))
    for (let i = 0; i < lying; i++) v.act(held(gags, pile))
    const from = v.pointer()
    let moved = -1
    let last = from
    const strides: number[] = []
    for (let i = 0; i < 40; i++) {
      v.act(held(gags, go))
      const p = v.pointer()
      const stride = Math.hypot(p.x - last.x, p.y - last.y)
      if (moved < 0 && stride > VISITOR.jitter * 2) moved = i
      if (moved >= 0) strides.push(stride)
      last = p
    }
    return { moved, strides, end: v.pointer() }
  }

  it('starts two steps after the page lets go, where another move starts a reaction time late', () => {
    const waiting = firstMove(['step1.firstName', STANDS.until, TAKES], BACK.still + 5)
    expect(waiting.moved).toBe(STROKE.reactSteps)
    expect(firstMove(['step1.firstName', STANDS.until], BACK.still + 5).moved).toBe(VISITOR.reactSteps)
    expect(firstMove(['step1.firstName', STANDS.until, TAKES], BACK.still - 10).moved).toBe(VISITOR.reactSteps)
  })

  it('is one unbroken stroke at the speed of a hand, to where the page wants the pointer', () => {
    const { strides, end } = firstMove(['step1.firstName', STANDS.until, TAKES], BACK.still + 5)
    const full = VISITOR.speed / VISITOR.hz
    const whole = strides.filter((d) => Math.abs(d - full) < 0.001).length
    expect(whole).toBeGreaterThanOrEqual(30)
    expect(strides.slice(0, whole).every((d) => Math.abs(d - full) < 0.001)).toBe(true)
    expect(end.x).toBeGreaterThan(pile.x + 800)
    expect(STROKE.least).toBeLessThan(Math.hypot(go.x - pile.x, go.y - pile.y))
  })
})

// A made-up visit of six pages of 400 steps with a turn of 60 steps across each seam. On step 1 a bolt lands, the page takes the arrow,
// lets go at step 700 and the visitor strokes two steps later. On step 3 the arrow is sealed at 1300, the ball goes `lies` steps later, a flipper is pressed at 1500 and strikes the ball a step later.
const PAGES = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
const LONG = 400
function madeRun(lies = 20) {
  const rows: (number | string)[][] = []
  for (let i = 0; i < PAGES.length * LONG; i++) {
    const p = Math.floor(i / LONG)
    const at = i % LONG
    const turning = (p > 0 && at < 30) || (p < PAGES.length - 1 && at >= LONG - 30) ? 1 : 0
    let x = 500
    let y = 400
    let heroX = 500
    let heroY = 400
    if (p === 0) heroX = x = 500 + 10 * Math.max(0, Math.min(60, at - 39))
    if (p === 1) {
      if (at >= 200 && at < 210) heroX = 500 + (at - 199) * 20
      if (at >= 210) heroX = 700
      x = at < 302 ? 700 : Math.min(1600, 700 + (at - 301) * 25)
      if (at >= 304) heroX = Math.min(x, 700 + (at - 303) * 20)
    }
    const sealed = p === 3 && at >= 100 ? 1 : 0
    const right = p === 3 && at >= 300 && at < 310 ? 1 : 0
    if (p === 3) {
      heroX = 1600
      heroY = 500 + (at >= 100 + lies ? Math.min(600, (at - 99 - lies) * 14) : 0)
      if (at >= 301) heroY = 1100 - Math.min(300, (at - 300) * 30)
      x = 960
      y = 900
    }
    rows.push([i / 60, PAGES[p]!, turning, heroX, heroY, 0, x, y, 1, sealed, 0, 0, right, sealed])
  }
  const hits = [{ name: 'bolt-hit', step: 520, page: 'step1', x: 0, y: 0 }, { name: 'bolt-hit-cursor', step: 520, page: 'step1', x: 0, y: 0 }, { name: 'tug-lost', step: 640, page: 'step1', x: 0, y: 0 }]
  return { format: 'preview', level: 'high', finished: true, steps: rows.length, gags: [{ gag: TAKES, step: 600 }], hits, acts: {}, rows }
}
const planOf = (run: ReturnType<typeof madeRun>, c = cfg) => (packPlan(c, { role: 'R4', round: 21, unit: SITE, facts: momentsOf(c, run) }) as { sets: { set: string; files: File[] }[] })
const filesOf = (run: ReturnType<typeof madeRun>, c = cfg) => planOf(run, c).sets.flatMap((s) => s.files)
const stepsOf = (files: File[], moment: string) => files.filter((f) => f.moment === moment).flatMap((f) => f.steps)

describe('the moments of the visit, as the sheets need them', () => {
  const m = momentsOf(cfg, madeRun()).moments

  it('finds the release from the stroke, the ball leaving the port and the blow of the flipper', () => {
    expect(m.hit).toBe(520)
    expect(m.struck).toBe('bolt-hit-cursor')
    expect(m.taken).toBe(600)
    expect(m.back).toBe(704)
    expect(m.released).toBe(700)
    expect(m.flippers).toBe(1300)
    expect(m.leaves).toBe(1320)
    expect(m.left).toBe(1330)
    expect(m.flip).toBe(1500)
    expect(m.met).toBe(1501)
  })

  it('starts every moment three pictures before it: the hit, the taking, the release, the seal, the blow of the flipper', () => {
    const files = filesOf(madeRun())
    const first = (moment: string) => stepsOf(files, moment)[0]
    expect(first('hit')).toBe(520 - 6)
    expect(stepsOf(files, 'hit')[3]).toBe(520)
    expect(stepsOf(files, 'hit').length).toBe(count)
    expect(first('taken')).toBe(600 - 6)
    expect(first('given-back')).toBe(700 - 6)
    expect(first('flippers')).toBe(1300 - 6)
    expect(first('flip')).toBe(1501 - 6)
    for (const f of files) for (let i = 1; i < f.steps.length; i++) expect(f.steps[i]! - f.steps[i - 1]!).toBe(2)
  })

  it('holds the stroke after the release in the sheet of the give-back', () => {
    const steps = stepsOf(filesOf(madeRun()), 'given-back')
    const rows = madeRun().rows
    const moved = (rows[steps[steps.length - 1]!]![3] as number) - (rows[steps[0]!]![3] as number)
    expect(moved).toBeGreaterThanOrEqual(200)
  })

  it('gives the way into the ball one run on two sheets when the ball is out of the port within it', () => {
    const files = filesOf(madeRun(20)).filter((f) => f.moment === 'flippers')
    expect(files.length).toBe(2)
    expect(files.map((f) => f.part)).toEqual([[1, 2], [2, 2]])
    const steps = files.flatMap((f) => f.steps)
    expect(steps.length).toBe(count * 2)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(1330)
    expect(files[1]!.steps[0]).toBe(files[0]!.steps[count - 1]! + 2)
    expect(files[0]!.heading).toMatch(/sheet 1 of 2 of one run, frames 1 to 12 of 24/)
    expect(files[1]!.heading).toMatch(/sheet 2 of 2 of one run, frames 13 to 24 of 24/)
    expect(files[0]!.run).toEqual(steps)
    expect(files[1]!.run).toEqual(steps)
  })

  it('gives it two runs, the seal and the leaving, when the ball lies longer in the port than two sheets hold, and says how far apart', () => {
    const run = madeRun(90)
    const m2 = momentsOf(cfg, run).moments
    expect(m2.leaves).toBe(1390)
    expect(m2.left).toBe(1400)
    const files = filesOf(run).filter((f) => f.moment === 'flippers')
    expect(files.length).toBe(2)
    expect(files.map((f) => f.part)).toEqual([null, null])
    expect(files[0]!.steps[3]).toBe(1300)
    expect(files[1]!.steps[0]).toBe(1390 - 6)
    expect(files[1]!.steps[count - 1]).toBeGreaterThanOrEqual(1400)
    expect(files[1]!.apart).toBeCloseTo((files[1]!.steps[0]! - files[0]!.steps[count - 1]!) / 60, 2)
    const plan = planOf(run)
    const brief = briefFor(plan as never, plan.sets[0]!.set, kit)
    expect(brief).toMatch(/One event on two sheets/)
    expect(brief).toContain(`${files[0]!.name} and ${files[1]!.name} are two runs of one event`)
  })

  it('holds the ball going off the flipper on the two sheets of the flippers', () => {
    const files = filesOf(madeRun()).filter((f) => f.moment === 'flip')
    expect(files.length).toBe(2)
    const steps = files.flatMap((f) => f.steps)
    expect(steps[3]).toBe(1501)
    expect(steps[steps.length - 1]).toBe(1501 - 6 + (count * 2 - 1) * 2)
  })

  it('tells the critic in plain words which two sheets are one run', () => {
    const plan = planOf(madeRun())
    const files = plan.sets.flatMap((s) => s.files)
    const brief = briefFor(plan as never, plan.sets[0]!.set, kit)
    expect(brief).toMatch(/One run on two sheets/)
    for (const moment of ['turn', 'flippers', 'flip']) {
      const pair = files.filter((f) => f.moment === moment)
      expect(brief).toContain(`${pair[0]!.name} and ${pair[1]!.name} are one run of ${count * 2} consecutive frames`)
    }
    expect(brief).not.toMatch(/One event on two sheets/)
  })

  it('stays inside the limit of files: every moment keeps a sheet and the second sheets go, the least worth first', () => {
    expect(plan10().length).toBe(10)
    expect(most).toBeGreaterThanOrEqual(10)
    const moments = ['walk', 'turn', 'hit', 'taken', 'given-back', 'flippers', 'flip']
    const at = (n: number) => {
      const c = { ...cfg, critics: { ...cfg.critics, maxFilesPerMessage: n } }
      const plan = planOf(madeRun(), c)
      expect(plan.sets.length).toBe(1)
      const files = plan.sets[0]!.files
      expect(files.length).toBeLessThanOrEqual(n)
      for (const moment of moments) expect(files.some((f) => f.moment === moment)).toBe(true)
      return Object.fromEntries(moments.map((moment) => [moment, files.filter((f) => f.moment === moment).length]))
    }
    expect(at(9)).toEqual({ walk: 1, turn: 2, hit: 1, taken: 1, 'given-back': 1, flippers: 2, flip: 1 })
    expect(at(8)).toEqual({ walk: 1, turn: 2, hit: 1, taken: 1, 'given-back': 1, flippers: 1, flip: 1 })
    expect(at(7)).toEqual({ walk: 1, turn: 1, hit: 1, taken: 1, 'given-back': 1, flippers: 1, flip: 1 })
    // Cut to one sheet, the turn keeps its last twelve pictures: the seat and what follows it.
    const c = { ...cfg, critics: { ...cfg.critics, maxFilesPerMessage: 7 } }
    const turn = filesOf(madeRun(), c).filter((f) => f.moment === 'turn')
    expect(turn[0]!.steps[count - 1]).toBe(429 + 16)
    expect(turn[0]!.heading).not.toMatch(/sheet 1 of/)
  })
  function plan10() {
    return filesOf(madeRun())
  }
})

describe('the window of a close sheet', () => {
  const run = momentsOf(cfg, madeRun())
  const preview = cfg.formats.preview

  it('is the tile itself, unscaled, while the way of the arrow fits in it', () => {
    const w = runWindow(cfg, run, [514, 516, 518, 520, 522])
    expect(w.shown).toBe(100)
    expect(w.window[2]).toBe(w.tileW)
    expect(w.window[3]).toBe(w.tileH)
  })

  it('is one window for a whole run, set on the middle of the way, and holds both ends with room round them', () => {
    const steps = Array.from({ length: count }, (_, i) => 694 + i * 2)
    const w = runWindow(cfg, run, steps)
    const k = preview.width / cfg.formats.hd.width
    const xs = steps.map((i) => (run.rows[i]![3] as number) * k)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(w.window[0] + 40)
    expect(Math.max(...xs)).toBeLessThanOrEqual(w.window[0] + w.window[2] - 40)
  })

  it('widens, in the proportions of the tile and inside the picture, when the way is longer than the tile', () => {
    const steps = Array.from({ length: count * 2 }, (_, i) => 1294 + i * 2)
    const w = runWindow(cfg, momentsOf(cfg, madeRun(2)), steps)
    expect(w.shown).toBeLessThan(100)
    expect(w.window[0]).toBeGreaterThanOrEqual(0)
    expect(w.window[1]).toBeGreaterThanOrEqual(0)
    expect(w.window[0] + w.window[2]).toBeLessThanOrEqual(preview.width)
    expect(w.window[1] + w.window[3]).toBeLessThanOrEqual(preview.height)
    expect(w.window[2] / w.window[3]).toBeCloseTo(w.tileW / w.tileH, 1)
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { briefFor, packPlan } from '../tools/lib/pack-plan.mjs'
import { BACK, BLOCK, COL, HOLDS, SITE, STANDS, STROKE, TAKES, VISITOR, fromMuzzle, hitTaken, holdsOf, keyBlock, makeVisitor, momentsOf, runWindow } from '../tools/lib/pack-site.mjs'
import { DECK, KEYS, hatchCentre, seats } from '../src/pages/step1/keyboard'
import { TURRET } from '../src/pages/step1/turrets'

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

  it('takes the first hard blow that comes while a bat rises, not a soft throw after a press that met nothing', () => {
    const run = madeRun()
    const y = (at: number): number => {
      if (at < 2) return 1100
      if (at < 12) return 1100 - (at - 1) * 12
      if (at < 41) return 980
      return 980 - Math.min(400, (at - 40) * 40)
    }
    for (let i = 1500; i < 1600; i++) {
      const at = i - 1500
      run.rows[i]![COL.heroY] = y(at)
      run.rows[i]![COL.right] = at < 6 || (at >= 40 && at < 46) ? 1 : 0
    }
    const made = momentsOf(cfg, run).moments
    expect(made.flip).toBe(1500)
    expect(made.met).toBe(1541)
  })

  // The rule changed by the Builder's word of 2026-11-27: the fallback put the machine's save under the stroke's heading in round 22. With no blow while a bat rises there is no stroke, and no sheet of one.
  it('takes no step for the stroke when no blow comes while a bat rises: a lift long after a press is not the bat', () => {
    const run = madeRun()
    for (let i = 1500; i < 1600; i++) {
      const at = i - 1500
      run.rows[i]![COL.heroY] = at < 10 ? 1100 : 1100 - Math.min(300, (at - 9) * 30)
      run.rows[i]![COL.right] = at < 6 ? 1 : 0
    }
    expect(momentsOf(cfg, run).moments.met).toBe(null)
    expect(filesOf(run).some((f) => f.moment === 'flip')).toBe(false)
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
    // The close sheets are drawn at every step: the seat, the take, the give back, the ball's drop and the blow once more. All other moments at every second.
    for (const f of files) for (let i = 1; i < f.steps.length; i++) expect(f.steps[i]! - f.steps[i - 1]!).toBe(['seat', 'taken', 'given-back', 'drop', 'flip-close'].includes(f.moment) ? 1 : 2)
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
    const brief = briefFor(plan as never, plan.sets.find((x) => x.files.some((f) => f.moment === 'flippers'))!.set, kit)
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

  it('tells the critic in plain words which sheets are one run, in the brief of the set that holds them', () => {
    const plan = planOf(madeRun())
    for (const moment of ['turn', 'flippers', 'flip']) {
      const set = plan.sets.find((x) => x.files.some((f) => f.moment === moment))!
      const run = set.files.filter((f) => f.moment === moment)
      // A run is never cut by the end of a set.
      expect(run.flatMap((f) => f.steps)).toEqual(run[0]!.run)
      const brief = briefFor(plan as never, set.set, kit)
      expect(brief).toMatch(/One run on more than one sheet/)
      const names = run.length > 2 ? `${run.slice(0, -1).map((f) => f.name).join(', ')} and ${run[run.length - 1]!.name}` : run.map((f) => f.name).join(' and ')
      expect(brief).toContain(`${names} are one run of ${count * run.length} consecutive frames`)
      expect(brief).not.toMatch(/One event on two sheets/)
    }
    expect(plan.sets.flatMap((x) => x.files).filter((f) => f.moment === 'turn').length).toBe(3)
  })

  // The rule changed by the Builder's word of 2026-11-27, round 24: the limit of files takes no sheet away. Where one message cannot hold the sheets the plan makes a second set.
  it('stays inside the limit of files in every set and takes no sheet away, whatever the limit', () => {
    expect(plan10().length).toBe(23)
    expect(most).toBeGreaterThanOrEqual(10)
    const moments = ['walk', 'turn', 'seat', 'hit', 'taken', 'given-back', 'flippers', 'drop', 'flip', 'flip-close']
    const at = (n: number) => {
      const c = { ...cfg, critics: { ...cfg.critics, maxFilesPerMessage: n } }
      const plan = planOf(madeRun(), c)
      for (const x of plan.sets) {
        expect(x.files.length).toBeLessThanOrEqual(n)
        // No run is cut by the end of a set, whatever the limit: its sheets lie side by side in one set.
        for (const f of x.files) expect(x.files.filter((g) => g.moment === f.moment && g.run[0] === f.run[0]).flatMap((g) => g.steps)).toEqual(f.run)
      }
      const files = plan.sets.flatMap((x) => x.files)
      return { sets: plan.sets.length, ...Object.fromEntries(moments.map((moment) => [moment, files.filter((f) => f.moment === moment).length])) }
    }
    const held = { walk: 1, turn: 3, seat: 4, hit: 1, taken: 2, 'given-back': 2, flippers: 2, drop: 4, flip: 2, 'flip-close': 2 }
    for (const n of [10, 9]) expect(at(n)).toEqual({ sets: 3, ...held })
    expect(at(8)).toEqual({ sets: 4, ...held })
    expect(at(7)).toEqual({ sets: 5, ...held })
    expect(at(13)).toEqual({ sets: 2, ...held })
    expect(at(23)).toEqual({ sets: 1, ...held })
    // The turn is whole: its three sheets are one run, and each says which it is.
    const turn = filesOf(madeRun()).filter((f) => f.moment === 'turn')
    turn.forEach((f, j) => expect(f.heading).toContain(`sheet ${j + 1} of 3 of one run`))
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

describe('the place the visitor stands at while the turrets fire', () => {
  const block = keyBlock(cfg)
  const at = (x: number, y: number, step = 0) => ({ name: STANDS.hit, page: STANDS.page, step, x, y })

  it('is the key nearest the middle of the key block, as the page lays its keys and turrets out', () => {
    expect([block.x, block.y, block.w]).toEqual([KEYS.x, KEYS.y, KEYS.w])
    expect(BLOCK.deckY).toBe(DECK.y)
    expect(BLOCK.barrel).toBe(TURRET.barrel)
    expect(block.turrets).toEqual([hatchCentre(0), hatchCentre(1)])
    const last = seats[seats.length - 1]!
    expect(block.y + block.h).toBeCloseTo(last.y + last.h, 6)
    const mid = { x: KEYS.x + KEYS.w / 2, y: block.y + block.h / 2 }
    const d = (s: { cx: number; cy: number }) => Math.hypot(s.cx - mid.x, s.cy - mid.y)
    const nearest = seats.reduce((a, b) => (d(b) < d(a) ? b : a))
    expect(block.place.key).toBe(nearest.name)
    expect(block.place.x).toBeCloseTo(nearest.cx, 6)
    expect(block.place.y).toBeCloseTo(nearest.cy, 6)
    expect(fromMuzzle(block, block.place)).toBeGreaterThanOrEqual(block.least)
    expect(block.least).toBeCloseTo(KEYS.w / 3, 6)
  })

  it('walks there at its own speed and then stands still, hands off', () => {
    const v = makeVisitor(1, VISITOR, block)
    for (let i = 0; i < 40; i++) v.act({ turning: false, scroll: 0, hint: { x: 1546, y: 829, down: false } })
    let before = v.pointer()
    let arrived = -1
    for (let i = 0; i < 200; i++) {
      v.act(firing())
      const now = v.pointer()
      expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeLessThanOrEqual(VISITOR.speed / VISITOR.hz + 1e-6)
      if (arrived < 0 && far(v, block.place) === 0) arrived = i
      if (arrived >= 0) expect(far(v, block.place)).toBe(0)
      before = now
    }
    expect(arrived).toBeGreaterThan(VISITOR.reactSteps)
    expect(arrived).toBeLessThan(80)
    expect(v.held().down).toBe(false)
  })

  it('goes on only after a bolt that struck the arrow far from both muzzles, not after one at a muzzle', () => {
    const near = at(1560.6, 855.5)
    const good = at(block.place.x, block.place.y)
    expect(fromMuzzle(block, near)).toBeLessThan(block.least)
    const v = makeVisitor(1, VISITOR, block)
    for (let i = 0; i < 150; i++) v.act(firing([near]))
    expect(far(v, block.place)).toBe(0)
    for (let i = 0; i < 100; i++) v.act(firing([near, good]))
    expect(far(v, block.place)).toBeGreaterThan(100)
    expect(v.waited()).toBe(150)
  })

  it('takes for the sheet the first bolt far from both muzzles, the first bolt when none is, and says which and how far', () => {
    const near = at(1560.6, 855.5, 800)
    const good = at(block.place.x, block.place.y, 950)
    const later = at(block.place.x, block.place.y, 1010)
    expect(hitTaken(block, [near, good, later])).toEqual({ step: 950, nth: 2, x: good.x, y: good.y, fromMuzzle: Math.round(fromMuzzle(block, good)), least: Math.round(block.least), far: true })
    expect(hitTaken(block, [near])).toMatchObject({ step: 800, nth: 1, far: false, fromMuzzle: Math.round(fromMuzzle(block, near)) })
    expect(hitTaken(block, [{ name: 'tug-lost', page: STANDS.page, step: 5, x: 0, y: 0 }])).toBeNull()
  })

  it('makes the sheet of the hit from that bolt: the moment of the hit is its step, and the first bolt when none is far', () => {
    const run = madeRun()
    for (const h of run.hits) Object.assign(h, { x: 1560.6, y: 855.5 })
    expect(momentsOf(cfg, run).moments.hit).toBe(520)
    run.hits.push(at(block.place.x, block.place.y, 560), at(block.place.x, block.place.y, 580))
    const m = momentsOf(cfg, run).moments
    expect(m.hit).toBe(560)
    expect(m.struck).toBe(STANDS.hit)
  })
})

describe('what the window of a close sheet holds besides the arrow', () => {
  const ball: number = cfg.table.ballPx
  const k: number = cfg.formats.preview.width / cfg.formats.hd.width
  const every = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i * 2)
  const inside = (w: number[], b: number[]) => b[0]! * k >= w[0]! - 1 && b[1]! * k >= w[1]! - 1 && b[2]! * k <= w[0]! + w[2]! + 1 && b[3]! * k <= w[1]! + w[3]! + 1

  it('holds, on the sheets of the flippers, the pressed bat and the part the ball touched, with half a ball round them, and says the percent when that is more than a tile', () => {
    const made = madeRun()
    const base = momentsOf(cfg, made)
    const blow = (base.moments.met ?? base.moments.flip) as number
    const steps = every(blow - 6, count * 2)
    const at = base.rows[blow]!
    const touch = { name: 'bumper', step: blow + 8, page: at[COL.page] as string, x: (at[COL.heroX] as number) - 60, y: (at[COL.heroY] as number) - 240 }
    made.hits.push(touch, { ...touch, step: steps[steps.length - 1]! + 40, x: 100, y: 100 })
    const run = momentsOf(cfg, made)
    const holds = holdsOf(cfg, run, steps, 'flip') as number[][]
    expect(holds).toHaveLength(2)
    const pad = HOLDS.margin * ball
    const x = at[COL.heroX] as number
    const y = (at[COL.heroY] as number) - (at[COL.scroll] as number)
    const shut = (b: number[]) => [Math.max(0, b[0]!), Math.max(0, b[1]!), Math.min(cfg.formats.hd.width, b[2]!), Math.min(cfg.formats.hd.height, b[3]!)]
    expect(holds[0]).toEqual(shut([touch.x - HOLDS.touch * ball - pad, touch.y - HOLDS.touch * ball - pad, touch.x + HOLDS.touch * ball + pad, touch.y + HOLDS.touch * ball + pad]))
    expect(holds[1]).toEqual(shut([x - HOLDS.batAcross * ball - pad, y - HOLDS.batAbove * ball - pad, x + HOLDS.batAcross * ball + pad, y + HOLDS.batBelow * ball + pad]))
    expect(HOLDS.batAcross).toBeGreaterThanOrEqual(cfg.table.flipperBalls)
    const w = runWindow(cfg, run, steps, 'flip')
    for (const b of holds) expect(inside(w.window, b)).toBe(true)
    for (const i of steps) {
      const r = run.rows[i]!
      const p = [r[COL.heroX] as number, Math.min(cfg.formats.hd.height, (r[COL.heroY] as number) - (r[COL.scroll] as number))]
      expect(inside(w.window, [p[0]!, p[1]!, p[0]!, p[1]!])).toBe(true)
    }
    expect(w.shown).toBeLessThan(100)
    expect(w.window[2] / w.window[3]).toBeCloseTo(w.tileW / w.tileH, 1)
    const flips = planOf(made).sets.flatMap((x) => x.files).filter((f) => f.moment === 'flip')
    expect(flips).toHaveLength(2)
    // The sheet says its true size: the run's pictures are half the page's size, so a window shown at 94% of them is 47% of the page.
    for (const f of flips) expect(f.heading).toContain(`at ${Math.round(w.shown * (cfg.formats.preview.width / cfg.formats.hd.width))}% of the page's size`)
  })

  it('holds, on the sheet of the hit, the muzzle of the turret that fired, read from the way the arrow is thrown, and both when it is not thrown', () => {
    const block = keyBlock(cfg)
    const made = madeRun()
    for (const h of made.hits) Object.assign(h, { x: block.place.x, y: block.place.y })
    const hit = momentsOf(cfg, made).moments.hit as number
    for (let i = 0; i < made.rows.length; i++) {
      if (made.rows[i]![COL.page] !== STANDS.page) continue
      made.rows[i]![COL.pointerX] = block.place.x
      made.rows[i]![COL.pointerY] = block.place.y
      made.rows[i]![COL.heroX] = block.place.x + (i >= hit && i < hit + 6 ? 60 : 0)
      made.rows[i]![COL.heroY] = block.place.y
    }
    const steps = every(hit - 6, count)
    const pad = HOLDS.margin * ball
    const right = holdsOf(cfg, momentsOf(cfg, made), steps, 'hit') as number[][]
    expect(right).toHaveLength(1)
    expect(right[0]![0]).toBeCloseTo(block.turrets[0]!.x + BLOCK.barrel - pad, 6)
    const w = runWindow(cfg, momentsOf(cfg, made), steps, 'hit')
    expect(inside(w.window, right[0]!)).toBe(true)
    expect(w.shown).toBe(100)
    for (let i = hit; i < hit + 6; i++) made.rows[i]![COL.heroX] = block.place.x - 60
    const left = holdsOf(cfg, momentsOf(cfg, made), steps, 'hit') as number[][]
    expect(left).toHaveLength(1)
    expect(left[0]![2]).toBeCloseTo(block.turrets[1]!.x - BLOCK.barrel + pad, 6)
    for (let i = hit; i < hit + 6; i++) made.rows[i]![COL.heroX] = block.place.x
    const both = holdsOf(cfg, momentsOf(cfg, made), steps, 'hit') as number[][]
    expect(both).toHaveLength(2)
    const wide = runWindow(cfg, momentsOf(cfg, made), steps, 'hit')
    for (const b of both) expect(inside(wide.window, b)).toBe(true)
    expect(wide.shown).toBeLessThan(100)
  })

  it('leaves the window of every other close sheet as it was', () => {
    const run = momentsOf(cfg, madeRun())
    const steps = every((run.moments.taken as number) - 6, count)
    expect(holdsOf(cfg, run, steps, 'taken')).toEqual([])
    expect(runWindow(cfg, run, steps, 'taken')).toEqual(runWindow(cfg, run, steps))
  })
})

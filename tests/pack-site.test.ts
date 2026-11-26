import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED, briefFor, neutral, packPlan, rolesOf } from '../tools/lib/pack-plan.mjs'
import { COL, SITE, SITE_KINDS, VISITOR, aroundStep, makeVisitor, momentsOf, siteLines, spreadSteps } from '../tools/lib/pack-site.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const units: string[] = cfg.film.units.map((u: { id: string }) => u.id)
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage

type File = { name: string; kind: string; heading: string; unit?: string; judged?: boolean; control?: string; image?: string; still?: string; steps?: number[]; moment?: string; at?: number; page?: string }
type Plan = { role: string; unit: string; sets: { set: string; critic: string; files: File[] }[] }

// A made-up visit: six pages of 300 steps with a turn of 20 steps between them, a pointer that walks, a bolt, a tug and a table.
const PAGES = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
const LONG = 300
function madeRun(hits = [{ name: 'tug-lost', step: 480, page: 'step1', x: 0, y: 0 }, { name: 'bolt-hit-cursor', step: 360, page: 'step1', x: 0, y: 0 }]) {
  const rows: (number | string)[][] = []
  for (let i = 0; i < PAGES.length * LONG; i++) {
    const p = Math.floor(i / LONG)
    const at = i % LONG
    const turning = p > 0 && at < 10 ? 1 : p < PAGES.length - 1 && at >= LONG - 10 ? 1 : 0
    // The pointer walks right from step 40 to step 99 of the first page and rests after it; the arrow follows it.
    let x = 500
    if (p === 0) x = 500 + 10 * Math.max(0, Math.min(60, at - 39))
    let heroX = x
    // Step 1: the page pulls the arrow away at 450, it lies dead from 460 and moves again at 540.
    if (p === 1 && at >= 150 && at < 160) heroX = x + (at - 149) * 20
    if (p === 1 && at >= 160 && at < 240) heroX = x + 200
    if (p === 1 && at >= 240 && at < 250) heroX = x + 200 - (at - 239) * 20
    const flippers = p === 3 && at >= 80 ? 1 : 0
    const right = p === 3 && at >= 120 && at < 130 ? 1 : 0
    rows.push([i / 60, PAGES[p]!, turning, heroX, 400, 0, x, 400, 1, flippers, 0, 0, right, flippers])
  }
  return { format: 'preview', level: 'high', finished: true, steps: rows.length, gags: [{ gag: 'step1.tug', step: 450 }], hits, acts: {}, rows }
}
const facts = momentsOf(cfg, madeRun())
const planOf = (role: string): Plan => packPlan(cfg, { role, round: 20, unit: SITE, facts }) as Plan
const filesOf = (plan: Plan): File[] => plan.sets.flatMap((s) => s.files)

describe('the packs of the unit site', () => {
  it('are the four the kit names, and each is inside the limits with neutral names', () => {
    expect(rolesOf(SITE)).toEqual(['R2', 'R4', 'R5', 'R8'])
    for (const role of rolesOf(SITE)) {
      const plan = planOf(role)
      expect(plan.unit).toBe(SITE)
      expect(plan.sets.length).toBeGreaterThan(0)
      for (const s of plan.sets) {
        expect(s.files.length).toBeGreaterThan(0)
        expect(s.files.length).toBeLessThanOrEqual(most)
        s.files.forEach((f, i) => {
          expect(f.name).toBe(`set-${s.set}-${String(i + 1).padStart(2, '0')}.png`)
          expect(neutral(f.name)).toBe(true)
          expect(BANNED.test(f.heading)).toBe(false)
          expect(SITE_KINDS).toContain(f.kind)
          if (f.steps) expect(f.steps.length).toBeLessThanOrEqual(count)
        })
      }
    }
  })

  it('R2: the six pages at rest in order, then the 19 keys as controls, nothing written on any', () => {
    const files = filesOf(planOf('R2'))
    expect(files.length).toBe(6 + 19)
    expect(files.every((f) => f.kind === 'site-jury' && f.heading === '')).toBe(true)
    expect(files.slice(0, 6).map((f) => f.unit)).toEqual(units)
    expect(files.slice(0, 6).every((f) => f.judged === true)).toBe(true)
    const controls = files.slice(6)
    expect(controls.length).toBe(19)
    expect(controls.every((f) => f.judged === false)).toBe(true)
    expect(controls.map((f) => f.control)).toEqual(cfg.keys.map((k: { id: string }) => k.id))
    for (const f of controls) expect(fs.existsSync(path.join(root, f.image!))).toBe(true)
    // No set mixes the judged pictures with the controls: the Builder chooses which controls go with them at the round.
    for (const s of planOf('R2').sets) expect(new Set(s.files.map((f) => f.judged)).size).toBe(1)
  })

  it('R8: the six pages, the two screens and one grid of what is on screen besides the page', () => {
    const files = filesOf(planOf('R8'))
    expect(files.map((f) => f.kind)).toEqual([...units.map(() => 'site-page'), 'site-screen', 'site-screen', 'site-control-crops'])
    expect(files.slice(0, 6).map((f) => f.unit)).toEqual(units)
    expect(files.filter((f) => f.kind === 'site-screen').map((f) => f.still)).toEqual(['screen-live', 'screen-touch'])
    expect(planOf('R8').sets.length).toBe(1)
  })

  it('R5: the pages on one sheet, the two screens, and one sheet across each page of the visit', () => {
    const files = filesOf(planOf('R5'))
    expect(files.map((f) => f.kind)).toEqual(['site-pages-sheet', 'site-screen', 'site-screen', ...units.map(() => 'site-run-sheet')])
    const sheets = files.filter((f) => f.kind === 'site-run-sheet')
    expect(sheets.map((f) => f.page)).toEqual(units)
    sheets.forEach((f, p) => {
      expect(f.steps!.length).toBe(count)
      // The halves of the turns at a page's ends are left out: 10 steps at each end but the very first and last.
      expect(f.steps![0]).toBe(p * LONG + (p > 0 ? 10 : 0))
      expect(f.steps![count - 1]).toBe(p * LONG + LONG - 1 - (p < PAGES.length - 1 ? 10 : 0))
      expect([...f.steps!].sort((a, b) => a - b)).toEqual(f.steps)
    })
    expect(planOf('R5').sets.length).toBe(1)
  })

  it('R4: the moments of the visit, each a run of consecutive frames, in the order they happen', () => {
    const files = filesOf(planOf('R4'))
    expect(files.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'hit', 'taken', 'given-back', 'flippers', 'flip'])
    for (const f of files) {
      expect(f.steps!.length).toBe(count)
      for (let i = 1; i < f.steps!.length; i++) expect(f.steps![i]! - f.steps![i - 1]!).toBe(2)
      if (f.at !== undefined) expect(f.steps).toContain(f.at)
      expect(f.kind).toBe(f.moment === 'walk' || f.moment === 'turn' ? 'site-run-sheet' : 'site-hit-sheet')
    }
    const turn = files.filter((f) => f.moment === 'turn').flatMap((f) => f.steps!)
    expect(turn[0]).toBeLessThanOrEqual(290)
    expect(turn[turn.length - 1]).toBeGreaterThanOrEqual(309)
    const walk = files[0]!.steps!
    expect(walk[0]).toBeGreaterThanOrEqual(40)
    expect(walk[count - 1]).toBeLessThanOrEqual(99)
  })

  it('needs the visit for R4 and R5 and not for R2 and R8', () => {
    expect(() => packPlan(cfg, { role: 'R4', round: 20, unit: SITE })).toThrow()
    expect(() => packPlan(cfg, { role: 'R5', round: 20, unit: SITE })).toThrow()
    expect(filesOf(packPlan(cfg, { role: 'R2', round: 20, unit: SITE }) as Plan).length).toBe(25)
    expect(filesOf(packPlan(cfg, { role: 'R8', round: 20, unit: SITE }) as Plan).length).toBe(9)
  })

  it('tells the critics of R5 and R8 nothing of how the pictures were made', () => {
    const told = /\b(live|bot|render\w*|tier|level|film|frames?|replay\w*|stepped|clock|driver|high)\b/i
    for (const role of ['R5', 'R8']) for (const f of filesOf(planOf(role))) expect(f.heading, f.heading).not.toMatch(told)
    for (const role of ['R4']) for (const f of filesOf(planOf(role))) expect(f.heading, f.heading).not.toMatch(/\b(live|bot|render\w*|tier|level|film|replay\w*|stepped|driver)\b/i)
  })

  it('gives each critic the lines for site and not the lines for other units', () => {
    for (const role of ['R4', 'R5', 'R8']) {
      const plan = planOf(role)
      const brief = briefFor(plan, plan.sets[0]!.set, kit)
      expect(brief).toMatch(/Pack for `site`/)
      expect(brief).not.toMatch(/Pack for a page/)
      expect(brief).not.toMatch(/Pack for `pinball`/)
      expect(brief).not.toMatch(/Pack for `film`/)
      expect(brief).not.toMatch(/^- For the film:/m)
    }
    const jury = planOf('R2')
    for (const s of jury.sets) expect(briefFor(jury, s.set, kit)).not.toMatch(/Pack for/)
    expect(siteLines('a\n- Pack for a page: x\n- Pack for `site`: y\n- For the film: z\nb')).toBe('a\n- Pack for `site`: y\nb')
  })
})

describe('the moments of a visit', () => {
  const m = facts.moments

  it('finds the pages by their order and the turns between them', () => {
    expect(facts.pages.map((p: { unit: string }) => p.unit)).toEqual(units)
    expect(facts.pages.map((p: { first: number }) => p.first)).toEqual(PAGES.map((_, i) => i * LONG))
    expect(facts.turns.length).toBe(PAGES.length - 1)
    expect(m.turn).toEqual({ first: 290, last: 309 })
  })

  it('finds the walk as the stretch in which the arrow moves under the pointer', () => {
    expect(m.walk).toEqual({ first: 40, last: 99 })
  })

  it('takes the hit from what the site tells by name, a bolt before the blow of the tug', () => {
    expect(m.hit).toBe(360)
    expect(m.struck).toBe('bolt-hit-cursor')
    const blow = momentsOf(cfg, madeRun([{ name: 'tug-lost', step: 480, page: 'step1', x: 0, y: 0 }])).moments
    expect(blow.hit).toBe(480)
    expect(blow.struck).toBe('tug-lost')
    expect(momentsOf(cfg, madeRun([])).moments.hit).toBe(null)
  })

  it('finds control taken at the tug, given back when the arrow moves again, and the flippers from the site', () => {
    expect(m.taken).toBe(450)
    expect(m.back).toBe(540)
    expect(m.flippers).toBe(3 * LONG + 80)
    expect(m.flip).toBe(3 * LONG + 120)
  })
})

describe('the visitor', () => {
  const told = (i: number) => ({ turning: false, scroll: 0, hint: i < 30 ? { x: 1200, y: 300, down: i % 2 === 0 } : i < 120 ? { x: 400, y: 800, down: false, key: 'a' } : { x: 900, y: 500, down: false, flipLeft: i % 7 < 3, flipRight: i % 5 < 2 } })

  it('is the same on every run: the same events from the same telling', () => {
    const a = makeVisitor(0.5)
    const b = makeVisitor(0.5)
    const one = Array.from({ length: 200 }, (_, i) => JSON.stringify(a.act(told(i))))
    const two = Array.from({ length: 200 }, (_, i) => JSON.stringify(b.act(told(i))))
    expect(one).toEqual(two)
    expect(one.some((l) => l.includes('move'))).toBe(true)
    expect(one.some((l) => l.includes('press'))).toBe(true)
    expect(one.some((l) => l.includes('ShiftLeft'))).toBe(true)
  })

  it('reacts late and moves no faster than a hand', () => {
    const v = makeVisitor(1)
    let last = v.pointer()
    for (let i = 0; i < 100; i++) {
      const acts = v.act(told(i))
      if (i < VISITOR.reactSteps) expect(acts).toEqual([])
      const p = v.pointer()
      expect(Math.hypot(p.x - last.x, p.y - last.y)).toBeLessThanOrEqual(VISITOR.speed / VISITOR.hz + 0.001)
      last = p
    }
  })

  it('takes hits: told to step aside for the first time, it stands still for two seconds and then obeys', () => {
    const v = makeVisitor(1)
    const at = { x: 960, y: 540, down: false }
    const aside = { ...at, dodge: { x: 1300, y: 540 } }
    for (let i = 0; i < 40; i++) v.act({ turning: false, scroll: 0, hint: at })
    const before = v.pointer()
    let stood = 0
    let moved = -1
    for (let i = 0; i < VISITOR.standSteps + 60 && moved < 0; i++) {
      const acts = v.act({ turning: false, scroll: 0, hint: aside })
      const p = v.pointer()
      if (Math.hypot(p.x - before.x, p.y - before.y) > 20) moved = i
      else if (i >= VISITOR.reactSteps && acts.length === 0) stood += 1
    }
    expect(VISITOR.standSteps / VISITOR.hz).toBe(2)
    expect(stood).toBeGreaterThanOrEqual(VISITOR.standSteps - 1)
    expect(moved).toBeGreaterThanOrEqual(VISITOR.standSteps)
    expect(v.pointer().x).toBeGreaterThan(before.x + 20)
  })
})

describe('the steps of a sheet', () => {
  it('spreads steps evenly with both ends in', () => {
    expect(spreadSteps(0, 11, 12)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(spreadSteps(5, 8, 12)).toEqual([5, 6, 7, 8])
    const s = spreadSteps(100, 1200, 12)
    expect(s.length).toBe(12)
    expect(s[0]).toBe(100)
    expect(s[11]).toBe(1200)
    expect(new Set(s).size).toBe(12)
  })

  it('takes a row of steps round one step and keeps it inside the visit', () => {
    expect(aroundStep(100, 12, 2, 0, 1000)).toEqual([90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112])
    expect(aroundStep(100, 12, 2, 0, 1000, 3)).toEqual([94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116])
    expect(aroundStep(4, 12, 2, 0, 1000)[0]).toBe(0)
    expect(aroundStep(998, 12, 2, 0, 1000)).toContain(998)
    expect(aroundStep(998, 12, 2, 0, 1000).every((i) => i <= 1000)).toBe(true)
  })

  it('keeps the columns of a step where the plan reads them', () => {
    expect(Object.keys(COL).length).toBe(14)
    expect(new Set(Object.values(COL)).size).toBe(14)
  })
})

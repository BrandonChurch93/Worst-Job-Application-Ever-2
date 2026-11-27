import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { packPlan } from '../tools/lib/pack-plan.mjs'
import { COL, FALLS, FLIPS, KEYS, MACHINE, REACH, SAVE, SAVE_BOX, SITE, TIERS, TURNS, VISITOR, ballAt, downAt, fallsOf, makeVisitor, overBat, reachGap, saveHolds, saveWindow, revealOf, tierSheet, tiersOf, windowHolds } from '../tools/lib/pack-site.mjs'
import { FLIP, FLIP_REACH, MID, MOUTH, R, TIER_Y, W } from '../src/table/layout'
import { SHIVER, TURN, shiverSeconds } from '../src/stage/turn'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const count: number = cfg.critics.contactSheetFrames
// Rows of one recorded walk of the pack's visitor through the live site, cut by pipeline/phase5/pack-whole-rows.mjs: the save's run, the key press's run, and the numbers of the turn.
const rec = JSON.parse(fs.readFileSync(path.join(root, 'pipeline/phase5/pack-whole-rows.json'), 'utf8')) as {
  turn: { first: number; last: number; edge: number; pointerMovesAt: number; run: number[] }
  hit: { handsOff: boolean }
  type: { press: number; release: number; rows: Record<string, (number | string)[]> }
  gate: { take: number; kick: number }
  save: { rows: Record<string, (number | string)[]> }
  falls: { first: number; last: number; tier: number }[]
  reveal: { first: number; last: number; from: number; to: number; back: boolean }
  stroke: { fromReach: number; held: number }
}
const sparse = (rows: Record<string, (number | string)[]>) => {
  const out: (number | string)[][] = []
  for (const [i, r] of Object.entries(rows)) out[Number(i)] = r
  return out
}

describe('the numbers the pack holds of the page', () => {
  it('lays the machine out as the page does: the middle, the bats, the mouth', () => {
    expect(MACHINE.mid).toBe(MID)
    expect([MACHINE.pivotU, MACHINE.pivotV, MACHINE.radius, MACHINE.tip, MACHINE.rest, MACHINE.up]).toEqual([FLIP.pivotU, FLIP.pivotV, FLIP.radius, FLIP.tip, FLIP.rest, FLIP.up])
    expect(MACHINE.mouthHalf).toBe(MOUTH.half)
    expect(cfg.table.flipperBalls - MACHINE.tip).toBe(FLIP_REACH)
    expect(REACH.ballR).toBe(R)
    const g = tiersOf(cfg)
    expect([0, 1, 2].map((k) => g.y(k))).toEqual(TIER_Y)
    expect(cfg.table.tierWidthBalls).toBe(W)
    // The gate holds the ball below the bats' tips at rest and above the pin: a ball there is low in the mouth as the save's finder reads it.
    expect(MACHINE.gateV).toBeGreaterThan(SAVE.low)
    expect(MACHINE.gateV + R).toBeLessThanOrEqual(MACHINE.pinV)
    expect(SAVE.low).toBeGreaterThan(FLIP.pivotV + FLIP_REACH * Math.sin((FLIP.rest * Math.PI) / 180))
  })

  it('counts the page turn as the stage plays it: seated, flat and quiet in steps from the page on its edge', () => {
    // The arriving half of a turn is as long as the leaving half: the recorded turn is 60 steps, the new page from the 31st.
    const half = rec.turn.last - rec.turn.edge + 1
    expect(rec.turn.edge - rec.turn.first).toBe(half)
    expect(TURNS.seat).toBe(Math.round(TURN.seat * half))
    expect(TURNS.flat).toBe(Math.round((TURN.seat + TURN.held + TURN.knocks.reduce((n, k) => n + k.lasts, 0)) * half))
    expect(TURNS.quiet).toBe(TURNS.seat + Math.round(shiverSeconds * VISITOR.hz))
    expect(SHIVER.beats).toBe(3)
    // The recorded run of the turn: it starts before the old page moves and ends four frames after the stop, before the visitor's pointer first moves.
    expect(rec.turn.run[0]).toBeLessThan(rec.turn.first)
    expect((rec.turn.run[1]! - rec.turn.edge - TURNS.quiet + 1) / 2).toBeGreaterThanOrEqual(TURNS.still)
    expect(rec.turn.run[1]).toBeLessThan(rec.turn.pointerMovesAt)
    expect((rec.turn.run[1]! - rec.turn.run[0]!) / 2 + 1).toBe(count * 3)
  })

  it('reads the bat and its reach as the machine does', () => {
    const row = (u: number, v: number) => {
      const r: number[] = []
      r[COL.heroX] = u * cfg.table.ballPx
      r[COL.heroY] = (TIER_Y[1]! + v) * cfg.table.ballPx
      return r
    }
    expect(ballAt(cfg, row(4, 6))).toEqual({ u: 4, v: 6, tier: 1 })
    // A ball resting on the left bat at its middle: along the bat by half its length, above its line by the two radii.
    const c = Math.cos((25 * Math.PI) / 180)
    const s = Math.sin((25 * Math.PI) / 180)
    const on = overBat(cfg, row(FLIP.pivotU + 1.5 * c + 0.9 * s, FLIP.pivotV + 1.5 * s - 0.9 * c), 'left')
    expect(on.along).toBeCloseTo(1.5, 6)
    expect(on.above).toBeCloseTo(0.9, 6)
    expect(reachGap(cfg, on)).toBe(0)
    const mirror = overBat(cfg, row(W - (FLIP.pivotU + 1.5 * c + 0.9 * s), FLIP.pivotV + 1.5 * s - 0.9 * c), 'right')
    expect(mirror.along).toBeCloseTo(1.5, 6)
    expect(mirror.above).toBeCloseTo(0.9, 6)
    // Past the tip, or high above the bat, it is out of reach by that much.
    expect(reachGap(cfg, { along: FLIP_REACH + REACH.past + 0.5, above: 0.5 })).toBeCloseTo(0.5, 6)
    expect(reachGap(cfg, { along: 1.5, above: FLIP.radius + R + REACH.high + 0.25 })).toBeCloseTo(0.25, 6)
  })
})

describe('the recorded save', () => {
  const rows = sparse(rec.save.rows)
  const steps = Object.keys(rec.save.rows).map(Number).filter((i, j) => j % 2 === 0)
  const run = { format: 'preview', rows, moments: { gate: rec.gate } }

  it('begins four frames or more before the ball is at the gate and ends four frames or more after the kick, on two sheets at most', () => {
    expect(rec.gate.take - steps[0]!).toBeGreaterThanOrEqual(SAVE.before)
    expect(steps[steps.length - 1]! - rec.gate.kick).toBeGreaterThanOrEqual(SAVE.after)
    expect(steps.length % count).toBe(0)
    expect(steps.length / count).toBeLessThanOrEqual(SAVE.sheets)
    // The ball of the rows is low in the mouth from the take to the step before the kick, and out of it soon after.
    for (let i = rec.gate.take; i < rec.gate.kick; i++) expect(ballAt(cfg, rows[i]!).v).toBeGreaterThanOrEqual(SAVE.low)
    expect(ballAt(cfg, rows[rec.gate.kick + SAVE.clears]!).v).toBeLessThan(SAVE.low)
  })

  it('has one fixed window that holds the gate at the mouth and both bats whole in every row of the run, at the largest scale that fits', () => {
    const win = saveWindow(cfg, run, steps) as { window: number[]; tileW: number; tileH: number; shown: number; tier: number }
    expect(win.shown).toBe(100)
    expect([win.window[2], win.window[3]]).toEqual([win.tileW, win.tileH])
    const f = cfg.formats.preview
    expect(win.window[0]).toBeGreaterThanOrEqual(0)
    expect(win.window[1]).toBeGreaterThanOrEqual(0)
    expect(win.window[0]! + win.window[2]!).toBeLessThanOrEqual(f.width)
    // Its lower edge is the foot of the screen, and it holds the part of the screen the gate and its wire take up (812 to 1112 across, 820 to 1080 down, of 1920 by 1080).
    expect(win.window[1]! + win.window[3]!).toBe(f.height)
    const k = f.width / cfg.formats.hd.width
    expect(SAVE_BOX).toEqual([812, 820, 1112, 1080])
    expect(win.window[0]).toBeLessThanOrEqual(SAVE_BOX[0]! * k)
    expect(win.window[1]).toBeLessThanOrEqual(SAVE_BOX[1]! * k)
    expect(win.window[0]! + win.window[2]!).toBeGreaterThanOrEqual(SAVE_BOX[2]! * k)
    for (let i = steps[0]!; i <= steps[steps.length - 1]!; i++) {
      expect(windowHolds(cfg, run, win, i)).toBe(true)
      // The ball itself is in the window from the take on, as far up as the tile reaches.
      const b = ballAt(cfg, rows[i]!)
      const y = (((rows[i]![COL.heroY] as number) - (rows[i]![COL.scroll] as number)) * f.width) / cfg.formats.hd.width
      if (i >= rec.gate.take && i <= rec.gate.kick + SAVE.after) expect(y).toBeGreaterThanOrEqual(win.window[1]!)
      expect(b.tier).toBe(win.tier)
      // The ball is whole in the window at its lowest too, where it sinks under the tier's floor.
      const r = (cfg.table.ballPx * REACH.ballR * f.width) / cfg.formats.hd.width
      expect(y + r).toBeLessThanOrEqual(win.window[1]! + win.window[3]!)
    }
    const lowest = Math.max(...rows.slice(steps[0]!, steps[steps.length - 1]! + 1).map((x) => ballAt(cfg, x).v))
    expect(lowest + REACH.ballR).toBeGreaterThan(cfg.table.tierHeightBalls)
    // What it holds: the bats from pivot to tip, at rest and raised, and the mouth down to the gate's pin.
    const h = saveHolds(cfg, rows[rec.gate.kick]!, win.tier) as { bats: number[]; gate: number[] }
    expect(h.bats[0]).toBeCloseTo((FLIP.pivotU - FLIP.radius) * cfg.table.ballPx, 6)
    expect(h.bats[2]).toBeCloseTo((W - FLIP.pivotU + FLIP.radius) * cfg.table.ballPx, 6)
    expect(h.gate[3]! - h.gate[1]!).toBeCloseTo((MACHINE.pinV + MACHINE.pin - MACHINE.gateV + R) * cfg.table.ballPx, 6)
  })
})

describe('the recorded key press', () => {
  const rows = sparse(rec.type.rows)
  const steps = Object.keys(rec.type.rows).map(Number).slice(1).filter((i, j) => j % 2 === 0)

  it('marks the frames in which the page has the button down, from three frames before the press to four after the release', () => {
    expect((rec.type.press - steps[0]!) / 2).toBeGreaterThanOrEqual(KEYS.before)
    expect((steps[steps.length - 1]! - rec.type.release) / 2).toBeGreaterThanOrEqual(KEYS.after)
    const marks = steps.map((i) => downAt(rows, i))
    steps.forEach((i, j) => expect(marks[j] === KEYS.mark).toBe(Boolean(rows[i - 1]![COL.down])))
    // The press is sent at the step `press` and the page has it from the next picture; it is let go at `release` and the page shows it up from the picture after.
    const held = steps.filter((i) => i > rec.type.press && i <= rec.type.release)
    expect(held.length).toBeGreaterThan(0)
    for (const i of held) expect(downAt(rows, i)).toBe(KEYS.mark)
    expect(downAt(rows, steps.find((i) => i <= rec.type.press)!)).toBe('')
    expect(downAt(rows, steps.find((i) => i > rec.type.release)!)).toBe('')
    expect(marks.indexOf(KEYS.mark)).toBe(steps.indexOf(held[0]!))
  })

  it('found the hit sheet with no key and no button down in its rows', () => {
    expect(rec.hit.handsOff).toBe(true)
  })
})

describe('the sheet of the tiers', () => {
  // A made-up machine page: the camera rests on the first tier, travels to the second from step 100 to 143, rests, and travels to the third from 300 to 345.
  const g = tiersOf(cfg)
  const top = (k: number) => g.y(k) * g.ball
  const rows: (number | string)[][] = []
  for (let i = 0; i < 500; i++) {
    const scroll = i < 100 ? top(0) : i < 144 ? top(0) + ((top(1) - top(0)) * (i - 99)) / 44 : i < 300 ? top(1) : i < 346 ? top(1) + ((top(2) - top(1)) * (i - 299)) / 46 : top(2)
    rows.push([i / 60, 'step3', 0, 960, scroll + 500, scroll, 0, 0, 1, 1, 0, 0, 0, 1])
  }
  const falls = fallsOf(cfg, rows, { first: 0, last: 499 }) as { first: number; last: number; tier: number }[]

  it('finds the travels of the camera from one tier to the next, and no other move of the page', () => {
    expect(falls.map((f) => [f.first, f.last, f.tier])).toEqual([[100, 143, 0], [300, 345, 1]])
    // A travel that ends anywhere but a tier's top is none: the way down the feed, the way back up.
    const up = rows.map((r) => [...r])
    for (let i = 300; i < 500; i++) up[i]![COL.scroll] = i < 346 ? top(1) - ((top(1) - top(0)) * (i - 299)) / 46 : top(0)
    expect((fallsOf(cfg, up, { first: 0, last: 499 }) as unknown[]).length).toBe(1)
    expect(FALLS.moves).toBe(1)
    // The recorded visit holds both falls, each under a second long.
    expect(rec.falls.map((f) => f.tier)).toEqual([0, 1])
    for (const f of rec.falls) expect(f.last - f.first).toBeLessThan(60)
  })

  it('shows each travel in frames at one even step, from the last frame before it to after its end, and says the step and the frames in its heading', () => {
    const sheet = tierSheet(cfg, { rows, moments: { falls } }) as { kind: string; steps: number[]; every: number; each: number; heading: string; page: string; moment: string }
    expect(sheet.kind).toBe('site-run-sheet')
    expect(sheet.steps.length).toBe(count)
    expect(sheet.each).toBe(TIERS.each)
    expect(sheet.every).toBe(10)
    expect(sheet.steps).toEqual([99, 109, 119, 129, 139, 149, 299, 309, 319, 329, 339, 349])
    falls.forEach((f, k) => {
      const part = sheet.steps.slice(k * sheet.each, (k + 1) * sheet.each)
      for (let j = 1; j < part.length; j++) expect(part[j]! - part[j - 1]!).toBe(sheet.every)
      expect(part[0]).toBe(f.first - 1)
      expect(part[part.length - 1]).toBeGreaterThan(f.last)
    })
    expect(sheet.heading).toBe("The machine's tiers and the passage from one to the next, whole frames 10 steps (0.17 s) apart: frames 1 to 6, the camera's travel from tier 1 to tier 2 (0:01.67 to 0:02.38); frames 7 to 12, the camera's travel from tier 2 to tier 3 (0:05.00 to 0:05.75). Each group of 6 begins before its travel and ends after it")
    expect(tierSheet(cfg, { rows, moments: { falls: [] } })).toBe(null)
  })

  it('begins with the page\'s own travel down the whole machine where the visit holds one, each group of frames at its own stated step', () => {
    // The made-up page opens as the live one does: from its top the camera travels down past every tier (steps 50 to 249), rests, goes back up to the first tier (300 to 359), and the play begins.
    const low = top(2) + 200
    const opens: (number | string)[][] = []
    for (let i = 0; i < 400; i++) {
      const scroll = i < 50 ? 0 : i < 250 ? (low * (i - 49)) / 200 : i < 300 ? low : i < 360 ? low - ((low - top(0)) * (i - 299)) / 60 : top(0)
      opens.push([i / 60, 'step3', 0, 960, scroll + 500, scroll, 0, 0, 1, 1, 0, 0, 0, 1])
    }
    const all = [...opens, ...rows.map((r, i) => [(i + 400) / 60, ...r.slice(1)])]
    const part = { first: 0, last: all.length - 1 }
    const reveal = revealOf(cfg, all, part) as { first: number; last: number; back: boolean }
    expect([reveal.first, reveal.last, reveal.back]).toEqual([50, 249, true])
    expect(revealOf(cfg, rows, { first: 0, last: 499 })).toBe(null)
    const both = fallsOf(cfg, all, part) as { first: number; last: number; tier: number }[]
    expect(both.map((f) => [f.first, f.last, f.tier])).toEqual([[500, 543, 0], [700, 745, 1]])
    const sheet = tierSheet(cfg, { rows: all, moments: { falls: both, reveal } }) as { steps: number[]; every: number; each: number; opens: number; heading: string }
    expect(sheet.steps.length).toBe(count)
    expect(sheet.each).toBe(4)
    expect([sheet.opens, sheet.every]).toEqual([68, 16])
    expect(sheet.steps).toEqual([49, 117, 185, 253, 499, 515, 531, 547, 699, 715, 731, 747])
    expect(sheet.steps[3]).toBeGreaterThan(reveal.last)
    expect(sheet.heading).toBe("The machine's tiers and the passage from one to the next. Frames 1 to 4 are single moments 68 steps (1.13 s) apart, not frames in a row: the camera's first travel, from the page's top down the machine to tier 3 (0:00.83 to 0:04.15), then back up to tier 1. Frames 5 to 8 and 9 to 12, 16 steps (0.27 s) apart: its travel from tier 1 to tier 2 (0:08.33 to 0:09.05) and from tier 2 to tier 3 (0:11.67 to 0:12.42). Each group of 4 begins before its travel and ends after it")
    // The recorded visit opens so: one travel of more than four seconds down the machine, then back up, before the first fall.
    expect(rec.reveal.back).toBe(true)
    expect(rec.reveal.last - rec.reveal.first).toBeGreaterThan(240)
    expect(rec.reveal.last).toBeLessThan(rec.falls[0]!.first)
  })

  it('stands in the story pack after the sheet of the machine page, as its tenth file', () => {
    const pages = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
    const all: (number | string)[][] = []
    for (const [p, name] of pages.entries()) for (let i = 0; i < 500; i++) all.push(p === 3 ? [...rows[i]!] : [0, name, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0])
    const units = cfg.film.units.map((u: { id: string }) => u.id)
    const facts = { rows: all, pages: pages.map((page, p) => ({ page, unit: units[p], first: p * 500, last: p * 500 + 499 })), moments: { falls: fallsOf(cfg, all, { first: 1500, last: 1999 }) } }
    const plan = packPlan(cfg, { role: 'R5', round: 24, unit: SITE, facts: facts as never }) as { sets: { files: { kind: string; moment?: string; page?: string; name: string }[] }[] }
    expect(plan.sets.length).toBe(1)
    const files = plan.sets[0]!.files
    expect(files.length).toBe(10)
    expect(files.length).toBeLessThanOrEqual(cfg.critics.maxFilesPerMessage)
    const at = files.findIndex((f) => f.moment === 'tiers')
    expect(files[at - 1]!.page).toBe(units[3])
    expect(files[at]!.name).toBe('set-A-08.png')
  })
})

describe('the visitor at the flippers', () => {
  it('presses a flipper two steps after the page first wants it and holds it ten steps at least, where every other move comes a reaction time late', () => {
    const v = makeVisitor(1)
    const lines: string[] = []
    const told = (i: number) => ({ turning: false, scroll: 0, hint: { x: 960, y: 540, down: false, flipLeft: i >= 40 && i < 43, flipRight: false } })
    for (let i = 0; i < 80; i++) lines.push(JSON.stringify(v.act(told(i))))
    const down = lines.findIndex((l) => l.includes('"keyDown":"ShiftLeft"'))
    const up = lines.findIndex((l) => l.includes('"keyUp":"ShiftLeft"'))
    expect(down).toBe(40 + FLIPS.reactSteps)
    expect(up - down).toBe(FLIPS.holdSteps)
    expect(FLIPS.reactSteps).toBeLessThan(VISITOR.reactSteps)
    // A bat of the machine needs 8 steps for its stroke: the hold outlasts it.
    expect(FLIPS.holdSteps).toBeGreaterThan(8)
    expect(lines.some((l) => l.includes('ShiftRight'))).toBe(false)
  })
})

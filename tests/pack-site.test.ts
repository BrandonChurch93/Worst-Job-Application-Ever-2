import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED, briefFor, neutral, packPlan, rolesOf } from '../tools/lib/pack-plan.mjs'
import { COL, FLIPS, HAND_WORDS, KEYS, KEY_WORDS, SAVE, SITE, SITE_KINDS, VISITOR, aroundStep, drawOrder, handAt, handsOff, keyBlock, makeVisitor, momentsOf, motionPlan, saveWindow, siteLines, siteNotes, spreadSteps, struckWords, tierSheet, windowHolds } from '../tools/lib/pack-site.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const units: string[] = cfg.film.units.map((u: { id: string }) => u.id)
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage

type File = { name: string; kind: string; heading: string; unit?: string; judged?: boolean; control?: string; image?: string; still?: string; steps?: number[]; moment?: string; at?: number; page?: string; hands?: string[]; part?: number[] | null; run?: number[]; every?: number }
type Plan = { role: string; unit: string; sets: { set: string; critic: string; groups: string[]; files: File[] }[] }

// A made-up visit: six pages of 300 steps with a turn of 20 steps between them, a pointer that walks, a bolt, a key of the page's keyboard, a tug and a table.
// On the table the camera stands on the middle tier and the ball lies right of the middle. `stroke`: the visitor presses the right flipper at 120 and the ball goes off it at 121.
// `save`: the ball is low in the mouth between the bats from 190 and stands thrown up at 200, as the machine's save does, with no hand on a flipper.
// `tap`: the visitor presses the right flipper for three steps just before that save, and meets nothing. `clicks`: the mouse button is down at the bolt.
const PAGES = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
const LONG = 300
const TIER: number = cfg.formats.hd.height + (cfg.table.marqueeHeightBalls + cfg.table.tierHeightBalls) * cfg.table.ballPx
const KEY = keyBlock(cfg).place as { x: number; y: number }
const BOLT = [{ name: 'tug-lost', step: 480, page: 'step1', x: 0, y: 0 }, { name: 'bolt-hit-cursor', step: 360, page: 'step1', x: 0, y: 0 }]
function madeRun(hits = BOLT, o: { stroke?: boolean; save?: boolean; tap?: boolean; clicks?: boolean } = {}) {
  const { stroke = true, save = true, tap = false, clicks = false } = o
  const rows: (number | string)[][] = []
  let ballY = 800
  for (let i = 0; i < PAGES.length * LONG; i++) {
    const p = Math.floor(i / LONG)
    const at = i % LONG
    const turning = p > 0 && at < 10 ? 1 : p < PAGES.length - 1 && at >= LONG - 10 ? 1 : 0
    // The pointer walks right from step 40 to step 99 of the first page and rests after it; the arrow follows it.
    let x = 500
    let y = 400
    if (p === 0) x = 500 + 10 * Math.max(0, Math.min(60, at - 39))
    // Step 1: from 20 to 51 the arrow stands on a key of the page's keyboard, and the visitor holds the button down from 32 to 37.
    if (p === 1 && at >= 20 && at < 52) [x, y] = [KEY.x, KEY.y]
    let down = p === 1 && at >= 32 && at < 38 ? 1 : 0
    if (clicks && p === 1 && at === 62) down = 1
    let heroX = x
    let heroY = y
    // Step 1: the page pulls the arrow away at 450, it lies dead from 460 and moves again at 540.
    if (p === 1 && at >= 150 && at < 160) heroX = x + (at - 149) * 20
    if (p === 1 && at >= 160 && at < 240) heroX = x + 200
    if (p === 1 && at >= 240 && at < 250) heroX = x + 200 - (at - 239) * 20
    const flippers = p === 3 && at >= 80 ? 1 : 0
    let right = stroke && p === 3 && at >= 120 && at < 130 ? 1 : 0
    if (tap && p === 3 && at >= 196 && at < 199) right = 1
    let scroll = 0
    if (p === 3) {
      scroll = TIER
      if (at === 0) ballY = 800
      heroX = at >= 190 && at < 230 ? 960 : 1000
      if (stroke && at >= 121 && at < 141) ballY -= 20
      else if (save && at >= 190 && at < 200) ballY = 1000 + (at - 190) * 7
      else if (save && at === 200) ballY = 1000
      else if (save && at > 200 && at < 216) ballY -= 25
      heroY = TIER + ballY
    }
    rows.push([i / 60, PAGES[p]!, turning, heroX, heroY, scroll, x, y, 1, flippers, down, 0, right, flippers])
  }
  return { format: 'preview', level: 'high', finished: true, steps: rows.length, gags: [{ gag: 'step1.firstName', step: 320 }, { gag: 'step1.tug', step: 450 }], hits, acts: {}, rows }
}
const facts = momentsOf(cfg, madeRun())
const planOf = (role: string): Plan => packPlan(cfg, { role, round: 20, unit: SITE, facts }) as Plan
const filesOf = (plan: Plan): File[] => plan.sets.flatMap((s) => s.files)
const motion = (run: unknown) => motionPlan(cfg, run) as unknown as { items: File[]; groups: { id: string; items: File[] }[]; leftOut: string[]; limitTook: string[] }

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

  it('R4: the moments of the visit, each a run of consecutive frames, in the order they happen, in two sets when one message cannot hold them', () => {
    const plan = planOf('R4')
    const files = filesOf(plan)
    // The pages: the walk, the turn on three sheets, the key, the hit, taken, given back. The machine: the seal, the ball leaving the port, the stroke on two sheets, the save on two.
    expect(plan.sets.map((s) => s.groups)).toEqual([['pages'], ['machine']])
    expect(plan.sets[0]!.files.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'turn', 'type', 'hit', 'taken', 'given-back'])
    expect(plan.sets[1]!.files.map((f) => f.moment)).toEqual(['flippers', 'flippers', 'flip', 'flip', 'save', 'save'])
    for (const s of plan.sets) expect(s.files.length).toBeLessThanOrEqual(most)
    expect(plan.sets[1]!.files[0]!.name).toBe('set-B-01.png')
    for (const f of files) {
      expect(f.steps!.length).toBe(count)
      for (let i = 1; i < f.steps!.length; i++) expect(f.steps![i]! - f.steps![i - 1]!).toBe(2)
      expect(f.every).toBe(2)
      expect(f.heading).toMatch(/^Consecutive frames, 1\/30 s apart, /)
      // The moment itself is the fourth picture of its run: three pictures lead up to it. The save's is the kick, further in.
      if (f.at !== undefined && f.moment !== 'save') expect(f.steps![3]).toBe(f.at)
      expect(f.kind).toBe(f.moment === 'walk' || f.moment === 'turn' ? 'site-run-sheet' : 'site-hit-sheet')
      // A heading and its sentences fit the three lines a sheet of twelve has room for.
      expect(f.heading.length).toBeLessThanOrEqual(430)
    }
    const walk = files[0]!.steps!
    expect(walk[0]).toBeGreaterThanOrEqual(40)
    expect(walk[count - 1]).toBeLessThanOrEqual(99)
    // A plan that one message holds is one set.
    const least = packPlan(cfg, { role: 'R4', round: 20, unit: SITE, facts: momentsOf(cfg, madeRun(BOLT, { stroke: false, save: false })) }) as Plan
    expect(least.sets.map((s) => s.groups)).toEqual([['moments']])
    expect(least.sets[0]!.files.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'turn', 'type', 'hit', 'taken', 'given-back', 'flippers', 'flippers'])
    expect(least.sets[0]!.files.length).toBe(most)
  })

  it('R4: a heading and its frames agree: the step apart, the times, which sheet of how many, which frames of the run', () => {
    for (const run of [madeRun(), madeRun(BOLT, { stroke: false }), madeRun(BOLT, { tap: true, clicks: true })]) {
      const plan = motion(momentsOf(cfg, run))
      const time = (i: number) => `${Math.floor(i / 60 / 60)}:${(i / 60 - Math.floor(i / 60 / 60) * 60).toFixed(2).padStart(5, '0')}`
      for (const f of plan.items) {
        const steps = f.steps!
        expect(f.heading).toContain(`: ${time(steps[0]!)} to ${time(steps[steps.length - 1]!)}`)
        const sheets = plan.items.filter((g) => g.moment === f.moment && g.run![0] === f.run![0])
        expect(sheets.flatMap((g) => g.steps!)).toEqual(f.run)
        const said = /, sheet (\d+) of (\d+) of one run, frames (\d+) to (\d+) of (\d+)/.exec(f.heading)
        expect(said !== null).toBe(sheets.length > 1)
        if (said) {
          const nth = sheets.indexOf(f)
          expect(said.slice(1).map(Number)).toEqual([nth + 1, sheets.length, nth * count + 1, nth * count + steps.length, f.run!.length])
          expect(f.part).toEqual([nth + 1, sheets.length])
        }
      }
    }
  })

  it('R4: the turn whole, from the old page lying flat to four frames after the last thing on the new page has stopped, each sheet saying what it holds', () => {
    const turn = filesOf(planOf('R4')).filter((f) => f.moment === 'turn')
    // The made-up turn: rows 290 to 309, the new page from 300. It stops 31 steps after its edge, at 331.
    expect(facts.moments.turn).toEqual({ first: 290, last: 309 })
    const steps = turn.flatMap((f) => f.steps!)
    expect(steps[0]).toBe(288)
    expect(steps.length).toBe(count * 3)
    expect(steps.filter((i) => i > 331).length).toBeGreaterThanOrEqual(4)
    expect(turn[0]!.heading).toMatch(/of one page turn, sheet 1 of 3 of one run, frames 1 to 12 of 36: 1 frame of the old page lying flat, the old page swings away, the new page stands on its edge from 0:05\.00, and closes: 0:04\.80 to 0:05\.17$/)
    expect(turn[1]!.heading).toMatch(/sheet 2 of 3 of one run, frames 13 to 24 of 36: the new page goes on closing, it seats at 0:05\.30, it has stopped by 0:05\.52, the last 2 frames come after the stop: /)
    expect(turn[2]!.heading).toMatch(/sheet 3 of 3 of one run, frames 25 to 36 of 36: the last 12 frames come after the stop: /)
    // The pointer is said to lie still only where the rows show it still: the made-up visitor's pointer jumps to a key at 320 and away from it at 352.
    for (const f of turn) expect(f.heading).not.toMatch(/pointer does not move/)
    const still = madeRun()
    for (let i = 300; i < 400; i++) [still.rows[i]![COL.pointerX], still.rows[i]![COL.pointerY]] = [500, 400]
    const quiet = motion(momentsOf(cfg, still)).items.filter((f) => f.moment === 'turn')
    expect(quiet[0]!.heading).not.toMatch(/pointer does not move/)
    expect(quiet[2]!.heading).toMatch(/: the last 12 frames come after the stop\. The visitor's pointer does not move in these frames: /)
    for (const f of turn) expect(f.heading).not.toMatch(/seated and still|from the page on its edge to/)
  })

  it('R4: the limit of files takes nothing away: every run keeps every sheet, and every set is within the limit', () => {
    expect(siteNotes(cfg, 'R5', facts)).toEqual({})
    for (const o of [{}, { stroke: false }, { stroke: false, save: false }, { tap: true }]) {
      const run = momentsOf(cfg, madeRun(BOLT, o))
      const notes = siteNotes(cfg, 'R4', run) as { leftOut: string[]; limitTook: string[] }
      expect(notes.limitTook).toEqual([])
      const plan = packPlan(cfg, { role: 'R4', round: 20, unit: SITE, facts: run }) as Plan
      for (const s of plan.sets) {
        expect(s.files.length).toBeLessThanOrEqual(most)
        // A run is never cut by the end of a set: its sheets lie in one set, side by side.
        for (const f of s.files) expect(s.files.filter((g) => g.moment === f.moment && g.run![0] === f.run![0]).flatMap((g) => g.steps!)).toEqual(f.run)
      }
      expect(filesOf(plan).length).toBe(motion(run).items.length)
    }
  })


  it('R4: the hand under the frames of the flippers, the stroke and the save, and one sentence for it in the heading', () => {
    const files = filesOf(planOf('R4'))
    for (const f of files) {
      const hand = ['flippers', 'flip', 'save'].includes(f.moment!)
      expect(f.heading.endsWith(HAND_WORDS)).toBe(hand)
      expect(f.hands !== undefined).toBe(hand || f.moment === 'type')
      if (f.hands) expect(f.hands.length).toBe(f.steps!.length)
    }
    // The stroke: the visitor presses the right flipper at 3 * LONG + 120 and holds it for ten steps, to 3 * LONG + 129.
    const flip = files.filter((f) => f.moment === 'flip')
    expect(flip.length).toBe(2)
    expect(flip[0]!.at).toBe(3 * LONG + 121)
    expect(flip[0]!.steps!.slice(0, 10)).toEqual([1015, 1017, 1019, 1021, 1023, 1025, 1027, 1029, 1031, 1033])
    expect(flip[0]!.hands!.slice(0, 10)).toEqual(['', '', '', 'R', 'R', 'R', 'R', 'R', '', ''])
    expect(flip[1]!.hands!.every((h) => h === '')).toBe(true)
    // The save: no hand on a flipper in any of its frames.
    const save = files.find((f) => f.moment === 'save')!
    expect(save.hands!.every((h) => h === '')).toBe(true)
    // The stroke's sheets say in numbers how the pack's visitor presses.
    for (const f of flip) expect(f.heading).toContain(`The pack's visitor presses ${FLIPS.reactSteps} steps after the page's cue and holds ${FLIPS.holdSteps} steps. `)
    // No other sheet carries the sentence or the letters.
    expect(files.filter((f) => f.hands && f.moment !== 'type').map((f) => f.moment)).toEqual(['flippers', 'flippers', 'flip', 'flip', 'save', 'save'])
  })

  it('R4: a hand that taps between two frames is still under the frame that follows it', () => {
    const rows = Array.from({ length: 12 }, () => [0, 'step3', 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1])
    rows[5]![COL.left] = 1
    rows[8]![COL.right] = 1
    rows[9]![COL.left] = 1
    // Held at the frame's own step, or at the one step between it and the frame before it.
    expect(handAt(rows, 4)).toBe('')
    expect(handAt(rows, 5)).toBe('L')
    expect(handAt(rows, 6)).toBe('L')
    expect(handAt(rows, 7)).toBe('')
    expect(handAt(rows, 8)).toBe('R')
    expect(handAt(rows, 9)).toBe('L R')
    expect(handAt(rows, 10)).toBe('L')
    expect(handAt(rows, 0)).toBe('')
    expect(HAND_WORDS).toBe('Under a frame, L or R: the visitor held the left or the right flipper at that frame or since the one before it.')
  })

  it('R4: the stroke stands only on a step at which the visitor own bat meets the ball, and is left out with a plain word when there is none', () => {
    const none = momentsOf(cfg, madeRun(BOLT, { stroke: false, tap: true }))
    // The visitor pressed just before the machine's save threw the ball back: that is the save, not a stroke.
    expect(none.moments.saves).toEqual([3 * LONG + 200])
    expect(none.moments.met).toBe(null)
    expect(none.moments.strokes).toEqual([])
    const plan = motion(none)
    expect(plan.items.some((f) => f.moment === 'flip')).toBe(false)
    expect(plan.items.some((f) => /flipper meets the ball/.test(f.heading))).toBe(false)
    expect(plan.leftOut.length).toBe(1)
    expect(plan.leftOut[0]).toMatch(/^flip: the run holds no step/)
    expect((siteNotes(cfg, 'R4', none) as { leftOut: string[] }).leftOut).toEqual(plan.leftOut)
    // The save of that run carries the hand's tap under its frames.
    const save = plan.items.filter((f) => f.moment === 'save')
    expect(save.length).toBe(2)
    expect(save[0]!.at).toBe(3 * LONG + 200)
    expect(save[0]!.hands!.filter((h) => h === 'R').length).toBe(2)
  })

  it('R4: the save is the machine own, from four frames before the ball is low in the mouth to four after the kick, under a heading that names the event and nothing that strikes', () => {
    const save = filesOf(planOf('R4')).filter((f) => f.moment === 'save')
    // The made-up save: the ball is low between the bats from 3 * LONG + 190 and goes back up at 3 * LONG + 200.
    expect(facts.moments.gate).toEqual({ take: 3 * LONG + 190, kick: 3 * LONG + 200 })
    const steps = save.flatMap((f) => f.steps!)
    expect(save.length).toBe(2)
    expect(steps[0]).toBe(3 * LONG + 190 - SAVE.before * 2)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(3 * LONG + 200 + SAVE.after * 2)
    expect(save[0]!.at).toBe(3 * LONG + 200)
    for (const f of save) {
      expect(f.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as the machine saves a ball lost between the bats, one fixed window on the mouth, its gate and both bats at 100% of its size, sheet \d of 2 of one run/)
      expect(f.heading).toMatch(/: \d:\d\d\.\d\d to \d:\d\d\.\d\d\. The ball is low in the mouth from 0:18\.17 and goes back up from 0:18\.33\. Under a frame, L or R/)
      expect(f.heading).not.toMatch(/strik|throw|its own bat|round the arrow/)
    }
    // One fixed window for the whole run, centred on the middle of the machine, that holds the gate and both bats in every step of the run.
    const win = saveWindow(cfg, facts, steps) as { window: number[]; shown: number; tier: number }
    expect(win.shown).toBe(100)
    expect(win.tier).toBe(1)
    expect(Math.abs(win.window[0]! + win.window[2]! / 2 - cfg.formats.preview.width / 2)).toBeLessThanOrEqual(1)
    expect(win.window[1]! + win.window[3]!).toBe(cfg.formats.preview.height)
    for (let i = steps[0]!; i <= steps[steps.length - 1]!; i++) expect(windowHolds(cfg, facts, win, i)).toBe(true)
    // A window that stood a tier too high would not hold them: the check is no formality.
    expect(windowHolds(cfg, facts, { ...win, window: [win.window[0]!, 0, win.window[2]!, win.window[3]!] }, steps[0]!)).toBe(false)
    // A save the page tells of by name is a save too, wherever the ball is: the old name, and the new pair of the take and the kick.
    const named = momentsOf(cfg, madeRun([...BOLT, { name: 'flipper-save', step: 3 * LONG + 250, page: 'step3', x: 0, y: 0 }], { save: false }))
    expect(named.moments.saves).toEqual([3 * LONG + 250])
    expect(named.moments.save).toBe(3 * LONG + 250)
    const pair = momentsOf(cfg, madeRun([...BOLT, { name: 'gate-take', step: 3 * LONG + 236, page: 'step3', x: 0, y: 0 }, { name: 'ball-save', step: 3 * LONG + 250, page: 'step3', x: 0, y: 0 }], { save: false }))
    expect(pair.moments.gate).toEqual({ take: 3 * LONG + 236, kick: 3 * LONG + 250 })
    const sheets = motion(pair).items.filter((f) => f.moment === 'save')
    expect(sheets.length).toBe(2)
    expect(sheets[0]!.steps![0]).toBe(3 * LONG + 236 - SAVE.before * 2)
    expect(sheets[1]!.steps![count - 1]).toBeGreaterThanOrEqual(3 * LONG + 250 + SAVE.after * 2)
    // A blow on a ball that is not low in the mouth is no save, however the ball jumps: the made-up stroke lifts the ball over the bat and is none.
    expect(facts.moments.saves).toEqual([3 * LONG + 200])
  })

  it('R4: the hit is named by what struck, and the hand is said to be off only where the run shows it off', () => {
    const hit = filesOf(planOf('R4')).find((f) => f.moment === 'hit')!
    expect(hit.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as a turret's bolt hits the arrow, no key is pressed in these frames, the part of the picture/)
    const clicked = motion(momentsOf(cfg, madeRun(BOLT, { clicks: true })))
    const held = clicked.items.find((f) => f.moment === 'hit')!
    expect(held.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as a turret's bolt hits the arrow, the part of the picture/)
    expect(held.heading).not.toMatch(/no key is pressed/)
    const tug = motion(momentsOf(cfg, madeRun([BOLT[0]!])))
    expect(tug.items.find((f) => f.moment === 'hit')!.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as the lost tug of war hits the arrow/)
    expect(struckWords('slab-drop')).toBe('what the page calls "slab drop"')
    // A key sent as one press, with nothing held, is a key too.
    const run = madeRun()
    expect(handsOff(run, [354, 356, 358])).toBe(true)
    expect(handsOff({ ...run, acts: { 355: [{ press: 'a' }] } }, [354, 356, 358])).toBe(false)
    expect(handsOff({ ...run, acts: { 355: [{ move: [1, 2] }] } }, [354, 356, 358])).toBe(true)
  })

  it('R4: a key of the page keyboard, from three frames before the press to four after the release, with a mark under each frame in which the button is held', () => {
    expect(facts.moments.type).toEqual({ press: LONG + 32, release: LONG + 38 })
    const type = filesOf(planOf('R4')).filter((f) => f.moment === 'type')
    expect(type.length).toBe(1)
    const f = type[0]!
    expect(f.page).toBe('step1')
    expect(f.at).toBe(LONG + 32)
    expect(f.steps![0]).toBe(LONG + 32 - KEYS.before * 2)
    expect(f.steps![count - 1]).toBeGreaterThanOrEqual(LONG + 38 + KEYS.after * 2)
    // Picture i is the page before the visitor's events of step i: it shows the button as row i - 1 holds it. The marks follow that, frame by frame.
    const rows = facts.rows as number[][]
    f.steps!.forEach((i, j) => expect(f.hands![j]).toBe(rows[i - 1]![COL.down] ? KEYS.mark : ''))
    expect(f.hands).toEqual(['', '', '', '', 'down', 'down', 'down', '', '', '', '', ''])
    expect(f.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as the visitor's arrow presses a key of the page's keyboard and lets it go, the part of the picture round the arrow at its real size: /)
    expect(f.heading).toContain('. In this run the button is held from the frame 0:05.57 to the frame 0:05.63. ')
    expect(f.heading.endsWith(KEY_WORDS)).toBe(true)
    expect(KEY_WORDS).toBe('Under a frame, "down": the visitor holds the mouse button in that frame.')
    // A second press inside the run is marked and said too.
    const twice = madeRun()
    twice.rows[LONG + 45]![COL.down] = 1
    const again = motion(momentsOf(cfg, twice)).items.find((x) => x.moment === 'type')!
    expect(again.hands).toEqual(['', '', '', '', 'down', 'down', 'down', '', '', '', 'down', ''])
    expect(again.heading).toContain('. In this run the button is held from the frame 0:05.57 to the frame 0:05.63, and again in the frame 0:05.77. ')
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

  it('finds the stroke of the visitor own bat, the machine save and the key from the run', () => {
    expect(m.met).toBe(3 * LONG + 121)
    // The made-up ball lies 0.75 of its width above the bat's reach when the flipper is pressed.
    expect(m.stroke).toEqual({ step: 3 * LONG + 121, side: 'right', press: 3 * LONG + 120, held: 10, kick: 20, fromReach: 0.75 })
    expect(m.gate).toEqual({ take: 3 * LONG + 190, kick: 3 * LONG + 200 })
    expect(m.saves).toEqual([3 * LONG + 200])
    expect(m.save).toBe(3 * LONG + 200)
    expect(m.type).toEqual({ press: LONG + 32, release: LONG + 38 })
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

  it('draws a picture as the same one of the whole pack, whatever is asked for and whatever is kept', () => {
    const plan = [10, 20, 30, 40, 50]
    const whole = drawOrder(plan, plan)
    expect(whole.draw).toEqual(plan)
    const part = drawOrder(plan, [40, 20])
    expect(part.wanted).toEqual([20, 40])
    expect(part.draw).toEqual([10, 20, 30, 40])
    expect(part.nth.get(40)).toBe(whole.nth.get(40))
    const half = drawOrder(plan, plan, (step: number) => step !== 30)
    expect(half.draw).toEqual([10, 20, 30])
    expect(drawOrder(plan, plan, () => true).draw).toEqual([])
  })
})

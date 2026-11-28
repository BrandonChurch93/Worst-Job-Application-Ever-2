import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED, briefFor, neutral, packPlan, rolesOf } from '../tools/lib/pack-plan.mjs'
import { wrap } from '../tools/lib/pack-build.mjs'
import { FLIP, MID, MOUTH } from '../src/table/layout'
import { BLOW, CLOSE, COL, DROP, FIELD_WORDS, FLIPS, FULL_WORDS, GATE, GIVES, HAND_WORDS, KEYS, KEY_WORDS, MOVES, MOVE_WORDS, PAGE_HAS, SAVE, SEAT, TAKEN, TURNS, gateWindow, holdsBox, seatWindows, SITE, SITE_KINDS, VISITOR, aroundStep, drawOrder, handAt, handsOff, keyAt, keyBlock, keySeats, makeVisitor, momentsOf, motionPlan, saveWindow, siteLines, siteNotes, spreadSteps, struckWords, tierSheet, closeWindow, windowHolds } from '../tools/lib/pack-site.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const units: string[] = cfg.film.units.map((u: { id: string }) => u.id)
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage

type File = { name: string; kind: string; heading: string; unit?: string; judged?: boolean; control?: string; image?: string; still?: string; steps?: number[]; moment?: string; at?: number; page?: string; hands?: string[]; part?: number[] | null; run?: number[]; every?: number; px?: number; windows?: number[][]; percent?: number; columns?: number; tileW?: number; tileH?: number; lines?: number }
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
// `hold`: the ball lies still, deep in the mouth, from 190 for that many steps and then leaves upward at 30 px a step, as the shut gate's take, hold and kick do.
function madeRun(hits = BOLT, o: { stroke?: boolean; save?: boolean; tap?: boolean; clicks?: boolean; hold?: number; throws?: boolean } = {}) {
  const { stroke = true, save = true, tap = false, clicks = false, hold = 0, throws = false } = o
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
    // `throws`: at 240 the page throws the arrow 50 px back in 4 steps (23, 18, 7, 2), it stands 18 steps, and from 262 it comes to the pointer.
    if (throws && p === 1 && at >= 240 && at < 244) heroX = x + 200 - [23, 41, 48, 50][at - 240]!
    if (throws && p === 1 && at >= 244 && at < 262) heroX = x + 150
    if (throws && p === 1 && at >= 262) heroX = x + 150 - Math.min(15, at - 261) * 10
    const flippers = p === 3 && at >= 80 ? 1 : 0
    let right = stroke && p === 3 && at >= 120 && at < 130 ? 1 : 0
    if (tap && p === 3 && at >= 196 && at < 199) right = 1
    let scroll = 0
    if (p === 3) {
      scroll = TIER
      if (at === 0) ballY = 800
      heroX = at >= 190 && at < 230 ? 960 : 1000
      if (stroke && at >= 121 && at < 141) ballY -= 20
      else if (hold && at >= 190 && at < 190 + hold) ballY = 1010
      else if (hold && at >= 190 + hold && at < 190 + hold + 16) ballY -= 30
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
// The moments drawn close: every step a frame, in windows of the page at its own size.
const NEAR = ['seat', 'type', 'taken', 'given-back', 'drop', 'flip-close', 'save']
// The lines a heading takes on its sheet, as the sheet lays it out (tools/lib/pack-build.mjs): 15 px type, 8 px at each side.
const linesOf = (f: File) => wrap(f.heading, f.columns! * f.tileW! + 8 * (f.columns! - 1) - 16, 15).length
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

  it('R4: the moments of the visit, each a run of consecutive frames, in the order they happen, in four sets when one message cannot hold them', () => {
    const plan = planOf('R4')
    const files = filesOf(plan)
    // The pages: the walk, the turn on three sheets, the seat close on four, the hit. The arrow: the key, the take, the give back. The port: the seal, the ball leaving, its drop close.
    // The bats: the stroke on two sheets, the blow close on two, the save on three.
    expect(plan.sets.map((s) => s.groups)).toEqual([['pages'], ['arrow'], ['port'], ['bats']])
    expect(plan.sets[0]!.files.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'turn', 'seat', 'seat', 'seat', 'seat', 'hit'])
    expect(plan.sets[1]!.files.map((f) => f.moment)).toEqual(['type', 'type', 'taken', 'taken', 'given-back', 'given-back'])
    expect(plan.sets[2]!.files.map((f) => f.moment)).toEqual(['flippers', 'flippers', 'drop', 'drop', 'drop', 'drop'])
    expect(plan.sets[3]!.files.map((f) => f.moment)).toEqual(['flip', 'flip', 'flip-close', 'flip-close', 'save', 'save', 'save'])
    for (const s of plan.sets) expect(s.files.length).toBeLessThanOrEqual(most)
    expect(plan.sets[1]!.files[0]!.name).toBe('set-B-01.png')
    for (const f of files) {
      const near = NEAR.includes(f.moment!)
      // A close sheet is drawn at every step (1/60 s) and holds as many frames as its tiles at 100% leave room for; every other sheet holds twelve, two steps apart. Each heading says its own.
      const every = near ? 1 : 2
      if (!near) expect(f.steps!.length).toBe(count)
      for (let i = 1; i < f.steps!.length; i++) expect(f.steps![i]! - f.steps![i - 1]!).toBe(every)
      expect(f.every).toBe(every)
      expect(f.heading.startsWith(`Consecutive frames, 1/${60 / every} s apart, `)).toBe(true)
      expect(f.px !== undefined).toBe(near)
      // The moment itself is the fourth picture of its run: three pictures lead up to it. The runs drawn at every step lead up to theirs with more frames.
      if (f.at !== undefined && every === 2) expect(f.steps![3]).toBe(f.at)
      expect(f.kind).toBe(f.moment === 'walk' || f.moment === 'turn' ? 'site-run-sheet' : 'site-hit-sheet')
      // A heading and its sentences fit the room over its tiles: three lines over a sheet of twelve whole frames (headings of 445 characters were seen to fit them in round 24's sheets),
      // and the lines its layout keeps over a close sheet.
      if (near) expect(linesOf(f)).toBeLessThanOrEqual(f.lines!)
      else expect(f.heading.length).toBeLessThanOrEqual(450)
    }
    const walk = files[0]!.steps!
    expect(walk[0]).toBeGreaterThanOrEqual(40)
    expect(walk[count - 1]).toBeLessThanOrEqual(99)
    // A plan that one message holds is one set. With no stroke the made-up ball never leaves the port, so its drop is not in the plan.
    const small = momentsOf(cfg, madeRun(BOLT, { stroke: false, save: false }))
    const all = motion(small).items
    expect(all.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'turn', 'seat', 'seat', 'seat', 'seat', 'type', 'type', 'hit', 'taken', 'taken', 'given-back', 'given-back', 'flippers', 'flippers'])
    const roomy = { ...cfg, critics: { ...cfg.critics, maxFilesPerMessage: all.length } }
    const least = packPlan(roomy, { role: 'R4', round: 20, unit: SITE, facts: small }) as Plan
    expect(least.sets.map((s) => s.groups)).toEqual([['moments']])
    expect(least.sets[0]!.files.map((f) => f.moment)).toEqual(all.map((f) => f.moment))
  })

  it('R4: the give back whole at every step, from six frames before the arrow first moves to six under the visitor, with a mark while the page has the arrow and one on the frame the hand has it again', () => {
    const t = (i: number) => {
      const c = Math.round((i / 60) * 100)
      return `${Math.floor(c / 6000)}:${String(Math.floor((c % 6000) / 100)).padStart(2, '0')}.${String(c % 100).padStart(2, '0')}`
    }
    const K = LONG + 240
    type Sheet = { steps: number[]; heading: string; every: number; hands: string[]; windows: number[][]; percent: number; lines: number; columns: number; tileW: number }
    // With no throw in the rows the arrow is the visitor's from its first move: two sheets of one run, every step a frame.
    const plain = motionPlan(cfg, facts).items.filter((f: { moment: string }) => f.moment === 'given-back') as unknown as Sheet[]
    expect(facts.moments.thrown).toBe(null)
    expect(plain.length).toBe(GIVES.sheets)
    expect(plain[0]!.steps[0]).toBe(K - GIVES.before)
    plain.forEach((f, j) => expect(f.heading).toContain(`sheet ${j + 1} of 2 of one run`))
    for (const f of plain) expect(f.heading).toContain(`In this run the arrow lies still to ${t(K - 1)} and moves from ${t(K)}`)
    // The marks: P under every frame before the arrow's first move, "follows" under that frame and under no other, and no P after it.
    const marksOf = (sheets: Sheet[]) => sheets.flatMap((f) => f.steps.map((i, j) => [i, f.hands[j]!.split(' ')] as [number, string[]]))
    for (const [i, marks] of marksOf(plain)) {
      expect(marks.includes(PAGE_HAS.mark)).toBe(i < K)
      expect(marks.includes(PAGE_HAS.back)).toBe(i === K)
    }
    // With a throw: the first move, the stand and the second move are read from the rows, and the run holds them all.
    const run = momentsOf(cfg, madeRun(BOLT, { throws: true }))
    expect(run.moments.back).toBe(K)
    expect(run.moments.thrown).toEqual({ first: K, stand: K + 4, handed: K + 22 })
    const whole = motionPlan(cfg, run).items.filter((f: { moment: string }) => f.moment === 'given-back') as unknown as Sheet[]
    const steps = whole.flatMap((f) => f.steps)
    expect(whole.length).toBe(3)
    expect(steps[0]).toBe(K - GIVES.before)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(K + 22 + GIVES.after - 1)
    for (let i = 1; i < steps.length; i++) expect(steps[i]! - steps[i - 1]!).toBe(1)
    whole.forEach((f, j) => {
      expect(f.every).toBe(1)
      expect(f.heading.startsWith(`Consecutive frames, 1/60 s apart, as the page gives the arrow back to the visitor, one fixed window round the arrow's way, ${FULL_WORDS} (x `)).toBe(true)
      expect(f.percent).toBe(100)
      expect(f.heading).toContain(`sheet ${j + 1} of 3 of one run, frames ${j * count + 1} to ${(j + 1) * count} of ${3 * count}`)
      expect(f.heading).toContain(`In this run the arrow lies still to ${t(K - 1)}, it moves from ${t(K)} to ${t(K + 3)}, stands still from ${t(K + 4)} to ${t(K + 21)} and moves again from ${t(K + 22)}, from where it comes to the visitor's pointer`)
      // The page's design in plain words, and the legend of the marks, true to the letter.
      expect(f.heading).toContain('. By the page\'s design the arrow stands in its rest pose until the page lets it go, and from then it leans with the visitor\'s move, as it does on every move. ')
      expect(f.heading).toContain(`Under a frame, ${PAGE_HAS.mark}: the page holds the arrow, from the take to the last frame before the arrow follows the pointer again; "${PAGE_HAS.back}": the first frame in which the arrow follows the pointer again. `)
      expect(f.heading.endsWith(MOVE_WORDS)).toBe(true)
      expect(linesOf(f as unknown as File)).toBeLessThanOrEqual(f.lines)
    })
    // The marks end on the frame the hand has the arrow: P through the throw and the stand, "follows" on the step the arrow comes to the pointer, nothing of the page's after it.
    for (const [i, marks] of marksOf(whole)) {
      expect(marks.includes(PAGE_HAS.mark)).toBe(i < K + 22)
      expect(marks.includes(PAGE_HAS.back)).toBe(i === K + 22)
    }
    // The arrow is inside the one window in every frame of the run.
    const rows = run.rows as number[][]
    for (const i of steps) expect(holdsBox(whole[0]!.windows[0]!, [rows[i]![COL.heroX]!, rows[i]![COL.heroY]! - rows[i]![COL.scroll]!, rows[i]![COL.heroX]!, rows[i]![COL.heroY]! - rows[i]![COL.scroll]!])).toBe(true)
    // The plan with the third sheet: nothing is taken away, every set within the limit, no run cut between two sets.
    const sets = (packPlan(cfg, { role: 'R4', round: 20, unit: SITE, facts: run }) as Plan).sets
    for (const x of sets) expect(x.files.length).toBeLessThanOrEqual(most)
    expect(sets.flatMap((x) => x.files).filter((f) => f.moment === 'given-back').length).toBe(3)
    expect(sets.filter((x) => x.files.some((f) => f.moment === 'given-back')).length).toBe(1)
  })

  it('R4: the blow once more close, every step from five frames before it to six after, at 100% in a window that holds the whole ball in every frame', () => {
    const close = motionPlan(cfg, facts).items.filter((f: { moment: string }) => f.moment === 'flip-close') as unknown as { steps: number[]; heading: string; every: number; hands: string[]; windows: number[][]; percent: number; tileW: number; tileH: number; px: number }[]
    const met = facts.moments.met as number
    const steps = close.flatMap((f) => f.steps)
    expect(steps).toEqual(Array.from({ length: CLOSE.before + CLOSE.after + 1 }, (_, i) => met - CLOSE.before + i))
    expect(close.flatMap((f) => f.hands).length).toBe(steps.length)
    expect(close.flatMap((f) => f.hands).filter((h) => h === 'R').length).toBeGreaterThan(0)
    const rows = facts.rows as number[][]
    const half = cfg.table.ballPx / 2
    for (const f of close) {
      expect(f.percent).toBe(100)
      expect(f.px).toBe(2)
      expect([f.windows[0]![2], f.windows[0]![3]]).toEqual([f.tileW, f.tileH])
      expect(f.windows).toEqual(close[0]!.windows)
      // The ball, with BLOW.room px round it, is whole in the window in every frame of the run, the fastest ones after the blow too.
      for (const i of steps) {
        const [x, y] = [rows[i]![COL.heroX]!, rows[i]![COL.heroY]! - rows[i]![COL.scroll]!]
        expect(holdsBox(f.windows[0]!, [x - half - BLOW.room, y - half - BLOW.room, x + half + BLOW.room, y + half + BLOW.room])).toBe(true)
      }
      expect(f.heading).toMatch(/^Consecutive frames, 1\/60 s apart, the blow of the sheets before once more, close: every frame from 5 frames before the blow \(\d:\d\d\.\d\d\) to 6 frames after, one fixed window that holds the ball in every frame, at 100%: one pixel of the sheet is one pixel of the 1920 by 1080 page \(x \d+ to \d+, y \d+ to \d+ of the page\), sheet \d of 2 of one run/)
      expect(f.heading).toContain('. The ball is whole in the window in every frame. ')
    }
  })

  it('R4: a heading and its frames agree: the step apart, the times, which sheet of how many, which frames of the run', () => {
    for (const run of [madeRun(), madeRun(BOLT, { stroke: false }), madeRun(BOLT, { tap: true, clicks: true })]) {
      const plan = motion(momentsOf(cfg, run))
      const time = (i: number) => `${Math.floor(i / 60 / 60)}:${(i / 60 - Math.floor(i / 60 / 60) * 60).toFixed(2).padStart(5, '0')}`
      for (const f of plan.items) {
        const steps = f.steps!
        expect(f.heading).toContain(`: ${time(steps[0]!)} to ${time(steps[steps.length - 1]!)}`)
        // The stride it says is the stride of its steps, and the scale it says is the scale its tiles are drawn at.
        expect(f.heading.startsWith(`Consecutive frames, 1/${60 / f.every!} s apart, `)).toBe(true)
        for (let i = 1; i < steps.length; i++) expect(steps[i]! - steps[i - 1]!).toBe(f.every)
        if (f.px) {
          expect(f.heading).toContain(f.percent === 100 ? FULL_WORDS : `at ${f.percent}% of the page's size, the largest at which the window holds them`)
          expect(f.heading.includes(FULL_WORDS)).toBe(f.percent === 100)
          for (const w of f.windows!) expect(f.heading).toContain(`x ${w[0]} to ${w[0]! + w[2]!}, y ${w[1]} to ${w[1]! + w[3]!} of the page`)
          // At 100% a window is its tile, pixel for pixel; scaled, it is the tile's shape.
          if (f.windows!.length === 1 && f.percent === 100) expect([f.windows![0]![2], f.windows![0]![3]]).toEqual([f.tileW, f.tileH])
          if (f.windows!.length === 1 && f.percent !== 100) expect(Math.floor((f.tileW! / f.windows![0]![2]!) * 100)).toBe(f.percent)
        } else expect(f.heading).toMatch(/at \d+% of the page's size/)
        const sheets = plan.items.filter((g) => g.moment === f.moment && g.run![0] === f.run![0])
        expect(sheets.flatMap((g) => g.steps!)).toEqual(f.run)
        const said = /, sheet (\d+) of (\d+) of one run, frames (\d+) to (\d+) of (\d+)/.exec(f.heading)
        expect(said !== null).toBe(sheets.length > 1)
        if (said) {
          const nth = sheets.indexOf(f)
          const per = sheets[0]!.steps!.length
          expect(said.slice(1).map(Number)).toEqual([nth + 1, sheets.length, nth * per + 1, nth * per + steps.length, f.run!.length])
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
    expect(turn[0]!.heading).toMatch(/of one page turn, whole frames at 24% of the page's size, sheet 1 of 3 of one run, frames 1 to 12 of 36: 1 frame of the old page lying flat, the old page swings away, the new page stands on its edge from 0:05\.00, and closes: 0:04\.80 to 0:05\.17\. Under a frame, M: .*\.$/)
    expect(turn[1]!.heading).toMatch(/sheet 2 of 3 of one run, frames 13 to 24 of 36: the new page goes on closing, it seats at 0:05\.30, it has stopped by 0:05\.52, the last 2 frames come after the stop: /)
    expect(turn[2]!.heading).toMatch(/sheet 3 of 3 of one run, frames 25 to 36 of 36: the last 12 frames come after the stop: /)
    // The pointer is said to lie still only where the rows show it still: the made-up visitor's pointer jumps to a key at 320 and away from it at 352.
    for (const f of turn) expect(f.heading).not.toMatch(/does not move the mouse/)
    const still = madeRun()
    for (let i = 300; i < 400; i++) [still.rows[i]![COL.pointerX], still.rows[i]![COL.pointerY], still.rows[i]![COL.heroX], still.rows[i]![COL.heroY]] = [500, 400, 960, 540]
    const quiet = motion(momentsOf(cfg, still)).items.filter((f) => f.moment === 'turn')
    expect(quiet[0]!.heading).not.toMatch(/does not move the mouse/)
    expect(quiet[2]!.heading).toMatch(/: the last 12 frames come after the stop\. The visitor does not move the mouse in these frames, and the page's arrow stays where it is: /)
    // The arrow the page draws is another thing than the visitor's pointer: where the page moves it under a still hand, the heading says from which frame.
    const drawn = madeRun()
    for (let i = 300; i < 400; i++) [drawn.rows[i]![COL.pointerX], drawn.rows[i]![COL.pointerY], drawn.rows[i]![COL.heroX], drawn.rows[i]![COL.heroY]] = [500, 400, i < 343 ? 960 : 960 - (i - 342) * 5, 540]
    const led = motion(momentsOf(cfg, drawn)).items.filter((f) => f.moment === 'turn')
    expect(led[2]!.steps).toContain(344)
    expect(led[2]!.heading).toMatch(/\. The visitor does not move the mouse in these frames, the page's arrow moves from 0:05\.73: /)
    for (const f of turn) expect(f.heading).not.toMatch(/seated and still|from the page on its edge to/)
    // The hand's motion is told apart from the page's by one mark, the same on every sheet that needs it: M under a frame when the pointer moved since the frame before it on the sheet.
    const rows = facts.rows as number[][]
    const moved = (i: number, every: number) => Array.from({ length: every }, (_, n) => i - n).some((j) => j >= 2 && (rows[j - 1]![COL.pointerX] !== rows[j - 2]![COL.pointerX] || rows[j - 1]![COL.pointerY] !== rows[j - 2]![COL.pointerY]))
    const marked = filesOf(planOf('R4')).filter((f) => ['turn', 'seat', 'type', 'taken', 'given-back'].includes(f.moment!))
    expect(marked.length).toBe(3 + 4 + 2 + 2 + 2)
    for (const f of marked) {
      expect(f.heading.endsWith(MOVE_WORDS)).toBe(true)
      f.steps!.forEach((i, j) => expect(f.hands![j]!.split(' ').includes(MOVES.mark)).toBe(moved(i, f.every!)))
    }
    expect(MOVE_WORDS).toBe('Under a frame, M: the visitor moved the mouse since the frame before it (no M: the hand rests).')
    // The made-up pointer jumps to the key at 320 and rests on it: one M in the turn's sheets after the new page stands, under the frame that follows the jump.
    expect(turn.flatMap((f) => f.steps!.filter((_, j) => f.hands![j] === MOVES.mark))).toEqual([302, 322, 354])
    // The quiet turn: no M under any frame of the sheet that says the visitor does not move the mouse.
    expect(quiet[2]!.hands!.every((h) => h === '')).toBe(true)
  })

  it('R4: the seat, close: every step from six frames before the stage seats the page to fourteen after, at 100%, the head with the whole step row beside the tray corner in each frame', () => {
    const seat = filesOf(planOf('R4')).filter((f) => f.moment === 'seat')
    // The made-up turn's new page stands from 300: the stage seats it TURNS.seat steps later.
    const at = 300 + TURNS.seat
    const steps = seat.flatMap((f) => f.steps!)
    expect(steps).toEqual(Array.from({ length: SEAT.before + SEAT.after + 1 }, (_, i) => at - SEAT.before + i))
    expect(seat.map((f) => f.steps!.length)).toEqual([6, 6, 6, 3])
    const wins = seatWindows(cfg) as number[][]
    const edge: number = cfg.critics.maxImageLongEdgePx
    // Two windows at 100% side by side fill the sheet's width: the strip along the page's upper edge and the tray's corner the Builder named.
    expect(wins[1]).toEqual([780, 290, 290, 176])
    expect(wins[0]![2]! + 8 + wins[1]![2]!).toBe(edge)
    expect(wins[0]![3]).toBe(176)
    // The strip ends on the page's right edge, starts at the page's top, and holds the whole step row and the rule under it.
    expect(wins[0]![0]! + wins[0]![2]!).toBe(cfg.formats.hd.width)
    expect(wins[0]![1]).toBe(0)
    expect(wins[0]![0]!).toBeLessThanOrEqual(SEAT.row[0]!)
    expect(SEAT.row[1]!).toBeLessThanOrEqual(cfg.formats.hd.width)
    expect(SEAT.row[2]!).toBeLessThan(wins[0]![3]!)
    seat.forEach((f, j) => {
      expect(f.windows).toEqual(wins)
      expect(f.percent).toBe(100)
      expect([f.columns, f.tileW, f.tileH]).toEqual([1, edge, 176])
      expect(f.heading.startsWith(`Consecutive frames, 1/60 s apart, the page's seat, close: every frame from 6 frames before the stage seats the page (0:05.30) to 14 frames after, two fixed windows side by side in each frame, ${FULL_WORDS}: left, the page's upper edge down to under the step row, to the page's right edge (x ${wins[0]![0]} to 1920, y 0 to 176 of the page); right, the tray's corner (x 780 to 1070, y 290 to 466 of the page), sheet ${j + 1} of 4 of one run, `)).toBe(true)
      expect(f.heading).toContain('Under a frame, "contact": the step at which the stage seats the page. ')
      expect(linesOf(f)).toBeLessThanOrEqual(f.lines!)
      // The sheet's own height stays inside the long edge: the heading's lines, six strips and their labels.
      expect(f.lines! * 22 + 8 + 8 + SEAT.per * (176 + 28) + 8 * (SEAT.per - 1)).toBeLessThanOrEqual(edge)
      // "contact" stands under the seat's step and under no other; the heading says nothing of what the frames show.
      f.steps!.forEach((i, n) => expect(f.hands![n]!.split(' ').includes(SEAT.mark)).toBe(i === at))
      expect(f.heading).not.toMatch(/knock|gap|shadow|jump/)
    })
    expect(seat[1]!.at).toBe(at)
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
      const hand = ['flippers', 'drop', 'flip', 'flip-close', 'save'].includes(f.moment!)
      expect(f.heading.endsWith(HAND_WORDS)).toBe(hand)
      expect(f.hands !== undefined).toBe(hand || ['turn', 'seat', 'type', 'taken', 'given-back'].includes(f.moment!))
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
    expect(files.filter((f) => f.hands && f.hands.some((h) => /\b[LR]\b/.test(h))).map((f) => f.moment)).toEqual(['flippers', 'drop', 'drop', 'flip', 'flip-close', 'flip-close'])
    expect(files.filter((f) => f.heading.includes('L or R')).map((f) => f.moment)).toEqual(['flippers', 'flippers', 'drop', 'drop', 'drop', 'drop', 'flip', 'flip', 'flip-close', 'flip-close', 'save', 'save', 'save'])
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
    expect(save.length).toBe(3)
    expect(save[1]!.at).toBe(3 * LONG + 200)
    expect(save.flatMap((f) => f.hands!).filter((h) => h === 'R').length).toBeGreaterThan(0)
  })

  it('R4: the save is the machine own, every step a frame from six before the ball is low in the mouth to eight after the kick, under a heading that names the event and nothing that strikes', () => {
    const save = filesOf(planOf('R4')).filter((f) => f.moment === 'save')
    // The made-up save: the ball is low between the bats from 3 * LONG + 190 and goes back up at 3 * LONG + 200.
    expect(facts.moments.gate).toMatchObject({ take: 3 * LONG + 190, kick: 3 * LONG + 200 })
    const steps = save.flatMap((f) => f.steps!)
    expect(save.length).toBe(3)
    for (let i = 1; i < steps.length; i++) expect(steps[i]! - steps[i - 1]!).toBe(1)
    expect(steps[0]).toBe(3 * LONG + 190 - SAVE.before)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(3 * LONG + 200 + SAVE.after)
    expect(save[1]!.at).toBe(3 * LONG + 200)
    for (const f of save) {
      expect(f.heading).toMatch(/^Consecutive frames, 1\/60 s apart, as the machine saves a ball lost between the bats, one fixed window on the gate's wire, its posts and both bats' tips, at 100%: one pixel of the sheet is one pixel of the 1920 by 1080 page \(x \d+ to \d+, y \d+ to \d+ of the page\), sheet \d of 3 of one run/)
      expect(f.heading).toMatch(/: \d:\d\d\.\d\d to \d:\d\d\.\d\d\. The ball is low in the mouth from 0:18\.17 and goes back up from 0:18\.33, moved 63 px up in that one step\. The page's own picture ends 31 px above the ball's foot at its lowest in these frames, so the wire that leans on the ball there is not in the picture; the window ends with the picture\. Under a frame, L or R/)
      expect(f.heading).not.toMatch(/strik|throw|its own bat|round the arrow/)
    }
    // One fixed window for the whole run, taken from the run's rows: at 100% it holds the gate's posts, both bats' tips and the wire's lowest place in every frame.
    const ball: number = cfg.table.ballPx
    const rows = facts.rows as number[][]
    const tierTop = (cfg.formats.hd.height / ball + cfg.table.marqueeHeightBalls + cfg.table.tierHeightBalls) * ball
    // The wire's lowest place in a frame, in px of the picture: its line at rest, or the foot of a ball that lies in the mouth, and the wire's own thickness under it.
    const wireAt = (run: { rows: unknown[] }, i: number) => {
      const r = run.rows[i] as number[]
      const inMouth = Math.abs(r[COL.heroX]! / ball - MID) <= MOUTH.half
      return tierTop + Math.max(MOUTH.hole * ball, inMouth ? r[COL.heroY]! - tierTop + ball / 2 : 0) + GATE.wire - r[COL.scroll]!
    }
    expect(GATE.hole).toBe(MOUTH.hole)
    const holds = (run: { rows: unknown[] }, files: File[]) => {
      const all = files.flatMap((f) => f.steps!)
      const w = files[0]!.windows![0]!
      for (const f of files) {
        expect(f.windows).toEqual([w])
        expect(f.percent).toBe(100)
        expect([w[2], w[3]]).toEqual([f.tileW, f.tileH])
      }
      // The posts stand at the mouth's two sides, and a bat's tip lies inside them: the window holds them with GATE.room px to spare.
      expect(w[0]!).toBeLessThanOrEqual((MID - MOUTH.half) * ball - GATE.room)
      expect(w[0]! + w[2]!).toBeGreaterThanOrEqual((MID + MOUTH.half) * ball + GATE.room)
      expect(FLIP.pivotU + FLIP.length - FLIP.tip).toBeGreaterThan(MID - MOUTH.half)
      // A bat's tip at rest lies above the wire by less than the window is tall, so the window that ends under the wire holds both tips.
      const tipY = tierTop + (FLIP.pivotV + Math.sin((FLIP.rest * Math.PI) / 180) * (FLIP.length - FLIP.tip)) * ball - (run.rows[all[0]!] as number[])[COL.scroll]!
      expect(tipY).toBeGreaterThan(w[1]!)
      expect(tipY).toBeLessThan(w[1]! + w[3]!)
      return { w, low: Math.max(...all.map((i) => wireAt(run, i))), all }
    }
    const today = holds(facts, save)
    const win = gateWindow(cfg, facts, today.all, { w: save[0]!.tileW, h: save[0]!.tileH }) as { window: number[]; percent: number; tier: number; low: number; under: number }
    expect(win.window).toEqual(today.w)
    expect(win.tier).toBe(1)
    expect(win.low).toBeCloseTo(today.low, 6)
    // The made-up view stands on the tier, as today's live view does: the wire's lowest place is the foot of the picture or under it, the window ends on the picture's foot and the heading says how little it holds.
    expect(today.low).toBeGreaterThanOrEqual(cfg.formats.hd.height)
    expect(today.w[1]! + today.w[3]!).toBe(cfg.formats.hd.height)
    expect(win.under).toBeLessThan(GATE.under)
    // A view that gives room under the gate while a ball lies on it: the same code finds its 20 px from the rows, with no number of the view in it.
    // The made-up ball lies 39 px under the foot of today's picture at its lowest; a view 80 px lower, or 160, has the 20 px.
    for (const more of [80, 160]) {
      const lower = madeRun()
      for (let i = 3 * LONG + 150; i < 3 * LONG + 260; i++) lower.rows[i]![COL.scroll] = TIER + more
      const run = momentsOf(cfg, lower)
      expect(run.moments.gate).toMatchObject({ take: 3 * LONG + 190, kick: 3 * LONG + 200 })
      const files = motion(run).items.filter((f) => f.moment === 'save')
      const seen = holds(run, files)
      expect(seen.w[1]! + seen.w[3]! - seen.low).toBeGreaterThanOrEqual(GATE.under)
      for (const i of seen.all) expect(seen.w[1]! + seen.w[3]! - wireAt(run, i)).toBeGreaterThanOrEqual(GATE.under)
      expect(seen.w[1]! + seen.w[3]!).toBeLessThanOrEqual(cfg.formats.hd.height)
      for (const f of files) expect(f.heading).toContain(`. The window holds ${GATE.under} px or more under the wire's lowest place in every frame. Under a frame, L or R`)
    }
    // The page's word finds no save and hides none: a save it tells of where the ball's path holds none is missing, said in the plan and in pack.json, and the tool then ends with a code other than 0.
    const named = momentsOf(cfg, madeRun([...BOLT, { name: 'flipper-save', step: 3 * LONG + 250, page: 'step3', x: 0, y: 0 }], { save: false }))
    expect(named.moments.saves).toEqual([])
    expect(named.moments.gate).toBe(null)
    expect(named.moments.unsaved).toEqual([{ step: 3 * LONG + 250, word: 'flipper-save' }])
    expect(motionPlan(cfg, named).missing).toEqual(["save: the page says flipper-save at 0:19.17 and no save was read from the ball's path there, so no sheet shows it"])
    expect((siteNotes(cfg, 'R4', named).missing as string[]).length).toBe(1)
    expect(motionPlan(cfg, facts).missing).toEqual([])
    expect(fs.readFileSync(new URL('../tools/pack.mjs', import.meta.url), 'utf8')).toMatch(/manifest\.missing\.length\) \{\n.*\n  process\.exitCode = MISSING_EXIT/)
    // The shut gate's save, read from the ball's path alone: the ball lies still and deep for 64 steps and leaves upward. The page's words for the take and the kick only confirm it.
    const HOLD = 64
    const words = [{ name: 'gate-take', step: 3 * LONG + 190, page: 'step3', x: 0, y: 0 }, { name: 'ball-save', step: 3 * LONG + 190 + HOLD, page: 'step3', x: 0, y: 0 }]
    for (const hits of [BOLT, [...BOLT, ...words]]) {
      const held = momentsOf(cfg, madeRun(hits, { save: false, hold: HOLD }))
      expect(held.moments.gate).toEqual({ take: 3 * LONG + 190, kick: 3 * LONG + 190 + HOLD, lifted: null, said: hits.length > BOLT.length, takeSaid: hits.length > BOLT.length })
      expect(held.moments.unsaved).toEqual([])
      // Held longer than SAVE.sheets sheets show in a row: two runs, every step a frame, the first one sheet from SAVE.before steps before the take, the second from SAVE.before before the kick to SAVE.after after it, no step skipped inside either.
      const runs = motionPlan(cfg, held).items.filter((f: { moment: string }) => f.moment === 'save') as { steps: number[]; heading: string }[]
      expect(runs.length).toBe(3)
      expect(runs[0]!.steps[0]).toBe(3 * LONG + 190 - SAVE.before)
      expect(runs[1]!.steps[0]).toBe(3 * LONG + 190 + HOLD - SAVE.before)
      expect(runs[2]!.steps[0]).toBe(runs[1]!.steps[count - 1]! + 1)
      expect(runs[2]!.steps[runs[2]!.steps.length - 1]).toBeGreaterThanOrEqual(3 * LONG + 190 + HOLD + SAVE.after)
      for (const r of runs) {
        expect(r.steps.length).toBe(count)
        for (let i = 1; i < r.steps.length; i++) expect(r.steps[i]! - r.steps[i - 1]!).toBe(1)
        expect(r.heading).not.toMatch(/strik|throw|its own bat|in that one step/)
      }
      expect(runs[0]!.heading).toContain('the first of two runs: the ball comes down to the mouth')
      expect(runs[0]!.heading).toContain('. The ball is low in the mouth from 0:18.17. The page')
      expect(runs[1]!.heading).toContain('the second of two runs: the ball goes back up')
      expect(runs[1]!.heading).toContain('. The ball goes back up from 0:19.23. The page')
    }
    // A blow on a ball that is not low in the mouth is no save, however the ball jumps: the made-up stroke lifts the ball over the bat and is none.
    expect(facts.moments.saves).toEqual([3 * LONG + 200])
  })

  it('R4: the hit is named by what struck, and the hand is said to be off only where the run shows it off', () => {
    const hit = filesOf(planOf('R4')).find((f) => f.moment === 'hit')!
    expect(hit.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as a turret's bolt hits the arrow, the visitor presses no button and no key in these frames, the part of the picture/)
    const clicked = motion(momentsOf(cfg, madeRun(BOLT, { clicks: true })))
    const held = clicked.items.find((f) => f.moment === 'hit')!
    expect(held.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as a turret's bolt hits the arrow, the part of the picture/)
    expect(held.heading).not.toMatch(/presses no button/)
    const tug = motion(momentsOf(cfg, madeRun([BOLT[0]!])))
    expect(tug.items.find((f) => f.moment === 'hit')!.heading).toMatch(/^Consecutive frames, 1\/30 s apart, as the lost tug of war hits the arrow/)
    expect(struckWords('slab-drop')).toBe('what the page calls "slab drop"')
    // A key sent as one press, with nothing held, is a key too.
    const run = madeRun()
    expect(handsOff(run, [354, 356, 358])).toBe(true)
    expect(handsOff({ ...run, acts: { 355: [{ press: 'a' }] } }, [354, 356, 358])).toBe(false)
    expect(handsOff({ ...run, acts: { 355: [{ move: [1, 2] }] } }, [354, 356, 358])).toBe(true)
  })

  it('R4: a key of the page keyboard at every step, from three frames before the press to eight after the release, at 100%, with a mark under each frame in which the button is held', () => {
    expect(facts.moments.type).toEqual({ press: LONG + 32, release: LONG + 38, nth: 1, of: 1, clear: false, spent: null, why: null, field: 'first', seated: null, key: null })
    const type = filesOf(planOf('R4')).filter((f) => f.moment === 'type')
    expect(type.length).toBe(2)
    const steps = type.flatMap((f) => f.steps!)
    expect(steps).toEqual(Array.from({ length: KEYS.before + 6 + KEYS.after + 1 }, (_, i) => LONG + 32 - KEYS.before + i))
    expect(type[0]!.page).toBe('step1')
    expect(type[0]!.at).toBe(LONG + 32)
    // Picture i is the page before the visitor's events of step i: it shows the button as row i - 1 holds it. The marks follow that, frame by frame.
    const rows = facts.rows as number[][]
    const marks = type.flatMap((f) => f.hands!)
    steps.forEach((i, j) => expect(marks[j]!.split(' ').includes(KEYS.mark)).toBe(Boolean(rows[i - 1]![COL.down])))
    expect(marks.slice(0, 12)).toEqual(['', '', '', '', 'down', 'down', 'down', 'down', 'down', 'down', '', ''])
    for (const f of type) {
      expect(f.percent).toBe(100)
      expect(f.heading.startsWith(`Consecutive frames, 1/60 s apart, as the visitor's arrow presses a key of the page's keyboard and lets it go: every frame from 3 frames before the press (0:05.53) to 8 after the release (0:05.63), one fixed window on the key, its neighbours and the arrow, ${FULL_WORDS} (x `)).toBe(true)
      // With one press only, and the turrets not known to have stopped, the heading says so and claims nothing more.
      expect(f.heading).toContain(`. The first press of the visitor's on the keyboard; the turrets may fire in these frames. ${FIELD_WORDS.first}. The visitor rests 6 frames after it lets a key go. `)
      expect(f.heading.endsWith(`${KEY_WORDS} ${MOVE_WORDS}`)).toBe(true)
      expect(linesOf(f)).toBeLessThanOrEqual(f.lines!)
      // The window holds the key under the pointer, the arrow in every frame, and a key's width of neighbours round them.
      const w = f.windows![0]!
      for (const i of steps) expect(holdsBox(w, [rows[i]![COL.heroX]! - TAKEN.room, rows[i]![COL.heroY]! - TAKEN.room, rows[i]![COL.heroX]! + TAKEN.room, rows[i]![COL.heroY]! + TAKEN.room])).toBe(true)
    }
    expect(KEY_WORDS).toBe('Under a frame, "down": the visitor holds the mouse button in it.')
    // A hit on the arrow inside the run is said with its time, so what it does to the page is not read as a press.
    const struck = madeRun()
    struck.hits.push({ name: 'bolt-hit-cursor', step: LONG + 44, page: 'step1', x: 0, y: 0 })
    const hit = motion(momentsOf(cfg, struck)).items.find((x) => x.moment === 'type')!
    expect(hit.heading).toContain(`. The first press of the visitor's on the keyboard; the turrets may fire in these frames. ${FIELD_WORDS.first}. In these frames a turret's bolt hits the arrow at 0:05.73. The visitor rests `)
    // Among the visitor's presses the sheet takes the first whose frames begin after the turrets have stopped: KEYS.spent steps after the Name is done and the page goes on to the Email field,
    // or after the bolt that overheats them, whichever the run holds first. The heading says which press it is and why no bolt lands in its frames.
    const twice = madeRun()
    for (let i = LONG + 132; i < LONG + 140; i++) {
      twice.rows[i]![COL.down] = 1
      for (const [c, v] of [[COL.pointerX, KEY.x], [COL.pointerY, KEY.y], [COL.heroX, KEY.x], [COL.heroY, KEY.y]] as [number, number][]) twice.rows[i]![c] = v
    }
    twice.gags.push({ gag: KEYS.field, step: LONG + 50 }, { gag: KEYS.until, step: LONG + 148 })
    const later = momentsOf(cfg, twice)
    expect(later.moments.type).toEqual({ press: LONG + 132, release: LONG + 140, nth: 2, of: 2, clear: true, spent: LONG + 50, why: 'on', field: 'email', seated: null, key: null })
    expect(LONG + 132 - KEYS.before).toBeGreaterThanOrEqual(LONG + 50 + KEYS.spent)
    const shown = motion(later).items.filter((x) => x.moment === 'type')
    expect(shown[0]!.steps![0]).toBe(LONG + 132 - KEYS.before)
    expect(shown[0]!.heading).toContain(`. Press 2 of the visitor's 2 on the keyboard, the first whose frames begin after the turrets have stopped: the Name was done and the page went on to the Email field at 0:05.83 and its turrets fire no more from then; these frames begin 1.32 s later, so no bolt lands in them. ${FIELD_WORDS.email}. The visitor rests `)
    // Before that one the sheet takes a press on the Email field, where the keys stay in their seats: the first whose frames begin KEYS.home steps or more after the page goes on to that field
    // and end before the first red slab drops and before the page asks for the resume. The heading names the field and says in one sentence what the page does to its keys there.
    const mail = madeRun()
    for (const at of [LONG + 100, LONG + 132]) for (let i = at; i < at + 8; i++) {
      mail.rows[i]![COL.down] = 1
      for (const [c, v] of [[COL.pointerX, KEY.x], [COL.pointerY, KEY.y], [COL.heroX, KEY.x], [COL.heroY, KEY.y]] as [number, number][]) mail.rows[i]![c] = v
    }
    mail.gags.push({ gag: KEYS.field, step: LONG + 20 })
    const seated = momentsOf(cfg, mail)
    // The press at LONG + 100 lies on the Email field too, but its frames begin one step short of KEYS.spent after the turrets stopped. With one Name field the turrets stop on the step the page goes on to the Email field, and KEYS.home is the shorter wait of the two.
    expect(LONG + 100 - KEYS.before - (LONG + 20)).toBe(KEYS.spent - 1)
    expect(KEYS.home).toBeLessThan(KEYS.spent)
    expect(seated.moments.type).toEqual({ press: LONG + 132, release: LONG + 140, nth: 3, of: 3, clear: true, spent: LONG + 20, why: 'on', field: 'email', seated: LONG + 20, key: 'G' })
    const sat = motion(seated).items.filter((x) => x.moment === 'type')
    expect(sat[0]!.steps![0]).toBe(LONG + 132 - KEYS.before)
    expect(sat[0]!.heading).toContain(`. Press 3 of the visitor's 3 on the keyboard, on the key G (the arrow's tip lies on its letter), the first on the Email field after its keys have come home: the page went on to that field at 0:05.33 and these frames begin 1.82 s later; the turrets went down when the Name was done and no bolt lands in these frames. ${FIELD_WORDS.email}. The visitor rests 6 frames after it lets a key go. `)
    for (const f of sat) expect(linesOf(f)).toBeLessThanOrEqual(f.lines!)
    expect(FIELD_WORDS.email).toBe("By the page's design the keys stay in their seats on the Email field: a pressed key sinks, and comes back up when it is let go")
    // The key is named by the seat the press lies in, as its cap shows it; between two keys no key is named. The arrow's red tip and steam are said to be the page's design, as the kit has them.
    const seats = keySeats(cfg) as { key: string; x: number; y: number; w: number; h: number }[]
    expect(seats.map((k) => ({ key: k.key, x: k.x, y: k.y }))).toContainEqual(keyBlock(cfg).place)
    const a = seats.find((k) => k.key === 'a')!
    expect(keyAt(cfg, a.x - a.w / 2 + 1, a.y + a.h / 2 - 1)).toBe('A')
    expect(keyAt(cfg, a.x - a.w / 2 - 1, a.y)).toBe(null)
    expect(keyAt(cfg, seats.find((k) => k.key.length > 1)!.x, seats.find((k) => k.key.length > 1)!.y)).toBe(seats.find((k) => k.key.length > 1)!.key)
    expect(/enter\('email'\)\s+act\(io, 'plain'\)/.test(fs.readFileSync(path.join(root, 'src/pages/step1/index.ts'), 'utf8'))).toBe(true)
    expect(sat[0]!.heading).not.toMatch(/angry/)
    // A red slab that drops inside those frames, or the page asking for the resume in them, and the press is not taken for a seated one: the rule before stands, and the heading names the field it lies on.
    for (const spoil of [{ hits: [{ name: KEYS.slab, step: LONG + 145, page: 'step1', x: 0, y: 0 }], gags: [] }, { hits: [], gags: [{ gag: KEYS.until, step: LONG + 148 }] }]) {
      const spoilt = madeRun()
      spoilt.rows = mail.rows
      spoilt.gags.push(...mail.gags, ...spoil.gags)
      spoilt.hits.push(...spoil.hits)
      const t = momentsOf(cfg, spoilt).moments.type
      expect(t).toMatchObject({ press: LONG + 132, nth: 3, seated: null, clear: true, field: 'email', key: null })
    }
    expect(KEYS.home).toBe(32)
    // A press that begins sooner than that after the turrets' last shot is not taken for a clear one: the first press stands, with the plain word.
    const soon = madeRun()
    soon.gags.push({ gag: KEYS.field, step: LONG + 10 })
    expect(momentsOf(cfg, soon).moments.type).toMatchObject({ press: LONG + 32, nth: 1, clear: false })
    // A bolt crosses the page in fewer steps than KEYS.spent: the page is 1920 px wide and the bolt flies TURRET.boltSpeed px a second (src/pages/step1/turrets.ts).
    const speed = Number(/boltSpeed: (\d+)/.exec(fs.readFileSync(path.join(root, 'src/pages/step1/turrets.ts'), 'utf8'))![1])
    expect((KEYS.spent / VISITOR.hz) * speed).toBeGreaterThan(cfg.formats.hd.width)
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
    expect(m.gate).toMatchObject({ take: 3 * LONG + 190, kick: 3 * LONG + 200 })
    expect(m.saves).toEqual([3 * LONG + 200])
    expect(m.save).toBe(3 * LONG + 200)
    expect(m.type).toMatchObject({ press: LONG + 32, release: LONG + 38 })
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

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED, briefFor, neutral, packPlan, rolesOf } from '../tools/lib/pack-plan.mjs'
import { COL, HAND_WORDS, SITE, SITE_KINDS, VISITOR, aroundStep, drawOrder, handAt, handsOff, keyBlock, makeVisitor, momentsOf, motionPlan, siteLines, siteNotes, spreadSteps, struckWords } from '../tools/lib/pack-site.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const kit = fs.readFileSync(path.join(root, 'kit/07-QUALITY-BAR.md'), 'utf8')
const units: string[] = cfg.film.units.map((u: { id: string }) => u.id)
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage

type File = { name: string; kind: string; heading: string; unit?: string; judged?: boolean; control?: string; image?: string; still?: string; steps?: number[]; moment?: string; at?: number; page?: string; hands?: string[]; part?: number[] | null }
type Plan = { role: string; unit: string; sets: { set: string; critic: string; files: File[] }[] }

// A made-up visit: six pages of 300 steps with a turn of 20 steps between them, a pointer that walks, a bolt, a key of the page's keyboard, a tug and a table.
// On the table the ball lies right of the middle and falls slowly. `stroke`: the visitor presses the right flipper at 120 and the ball goes off it at 121.
// `save`: the ball falls between the bats from 190 and stands thrown up at 200, as the machine's save does, with no hand on a flipper.
// `tap`: the visitor presses the right flipper for three steps just before that save, and meets nothing. `clicks`: the mouse button is down at the bolt.
const PAGES = ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']
const LONG = 300
const KEY = keyBlock(cfg).place as { x: number; y: number }
const BOLT = [{ name: 'tug-lost', step: 480, page: 'step1', x: 0, y: 0 }, { name: 'bolt-hit-cursor', step: 360, page: 'step1', x: 0, y: 0 }]
function madeRun(hits = BOLT, o: { stroke?: boolean; save?: boolean; tap?: boolean; clicks?: boolean } = {}) {
  const { stroke = true, save = true, tap = false, clicks = false } = o
  const rows: (number | string)[][] = []
  let ballY = 400
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
    if (p === 3) {
      if (at === 0) ballY = 400
      heroX = at >= 190 && at < 230 ? 960 : 1000
      if (stroke && at >= 121 && at < 141) ballY -= 20
      else if (save && at >= 190 && at < 200) ballY += 10
      else if (save && at === 200) ballY -= 60
      else if (save && at > 200 && at < 216) ballY -= 25
      heroY = ballY
    }
    rows.push([i / 60, PAGES[p]!, turning, heroX, heroY, 0, x, y, 1, flippers, down, 0, right, flippers])
  }
  return { format: 'preview', level: 'high', finished: true, steps: rows.length, gags: [{ gag: 'step1.firstName', step: 320 }, { gag: 'step1.tug', step: 450 }], hits, acts: {}, rows }
}
const facts = momentsOf(cfg, madeRun())
const planOf = (role: string): Plan => packPlan(cfg, { role, round: 20, unit: SITE, facts }) as Plan
const filesOf = (plan: Plan): File[] => plan.sets.flatMap((s) => s.files)
const motion = (run: unknown) => motionPlan(cfg, run) as unknown as { items: File[]; leftOut: string[]; limitTook: string[] }

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
    // With a true stroke and a save the limit of files leaves: the walk, the landing of the turn, the key, the hit, taken, given back, the seal, the stroke on two sheets, the save.
    expect(files.map((f) => f.moment)).toEqual(['walk', 'turn', 'type', 'hit', 'taken', 'given-back', 'flippers', 'flip', 'flip', 'save'])
    expect(files.length).toBe(most)
    for (const f of files) {
      expect(f.steps!.length).toBe(count)
      for (let i = 1; i < f.steps!.length; i++) expect(f.steps![i]! - f.steps![i - 1]!).toBe(2)
      // The moment itself is the fourth picture of its run: three pictures lead up to it. A key's press and a save are the third: two lead up to them.
      if (f.at !== undefined) expect(f.steps![f.moment === 'type' || f.moment === 'save' ? 2 : 3]).toBe(f.at)
      expect(f.kind).toBe(f.moment === 'walk' || f.moment === 'turn' ? 'site-run-sheet' : 'site-hit-sheet')
      // A heading and its sentence of the hand fit the three lines a sheet of twelve has room for.
      expect(f.heading.length).toBeLessThanOrEqual(420)
    }
    // The turn's run ends 16 steps after the turning ends, and is two sheets long. Here the limit took its first sheet: the one left holds the seat and what follows it.
    const turn = files.filter((f) => f.moment === 'turn').flatMap((f) => f.steps!)
    expect(turn.length).toBe(count)
    expect(turn[turn.length - 1]).toBe(309 + 16)
    expect(turn[0]).toBe(309 + 16 - (count - 1) * 2)
    const walk = files[0]!.steps!
    expect(walk[0]).toBeGreaterThanOrEqual(40)
    expect(walk[count - 1]).toBeLessThanOrEqual(99)
  })

  it('R4: says in plain fields which sheets the limit took, and takes them in the order of their worth', () => {
    const notes = siteNotes(cfg, 'R4', facts) as { leftOut: string[]; limitTook: string[] }
    expect(notes.leftOut).toEqual([])
    expect(notes.limitTook.map((l) => l.split(':')[0])).toEqual(['turn', 'flippers', 'save'])
    expect(notes.limitTook[0]).toMatch(/^turn: sheet 1 of 2/)
    expect(notes.limitTook[2]).toMatch(/^save: sheet 2 of 2/)
    expect(siteNotes(cfg, 'R5', facts)).toEqual({})
    // With no true stroke the room goes to the second sheet of the save first, then to the second sheet of the flippers; the turn's first sheet is the one the limit takes.
    const bare = motion(momentsOf(cfg, madeRun(BOLT, { stroke: false })))
    expect(bare.items.map((f) => f.moment)).toEqual(['walk', 'turn', 'type', 'hit', 'taken', 'given-back', 'flippers', 'flippers', 'save', 'save'])
    expect(bare.limitTook.map((l) => l.split(':')[0])).toEqual(['turn'])
    // With neither a stroke nor a save nothing is taken, and the turn keeps both sheets.
    const least = motion(momentsOf(cfg, madeRun(BOLT, { stroke: false, save: false })))
    expect(least.items.map((f) => f.moment)).toEqual(['walk', 'turn', 'turn', 'type', 'hit', 'taken', 'given-back', 'flippers', 'flippers'])
    expect(least.limitTook).toEqual([])
  })

  it('R4: the hand under the frames of the flippers, the stroke and the save, and one sentence for it in the heading', () => {
    const files = filesOf(planOf('R4'))
    for (const f of files) {
      const hand = ['flippers', 'flip', 'save'].includes(f.moment!)
      expect(f.heading.endsWith(HAND_WORDS)).toBe(hand)
      expect(f.hands !== undefined).toBe(hand)
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
    // No other sheet carries the sentence or the letters.
    expect(files.filter((f) => f.hands).map((f) => f.moment)).toEqual(['flippers', 'flip', 'flip', 'save'])
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

  it('R4: the save is the machine own, shown from two frames before it, under its own heading', () => {
    const save = filesOf(planOf('R4')).find((f) => f.moment === 'save')!
    expect(save.at).toBe(3 * LONG + 200)
    expect(save.steps![0]).toBe(3 * LONG + 200 - 4)
    expect(save.heading).toMatch(/^Consecutive frames as the machine saves a ball lost between the bats: its own bat strikes as the save throws the ball back, the part of the picture round the arrow/)
    expect(save.heading).toMatch(/: \d:\d\d\.\d\d to \d:\d\d\.\d\d\. Under a frame/)
    // A save the page tells of by name is a save too, wherever the ball is.
    const named = momentsOf(cfg, madeRun([...BOLT, { name: 'flipper-save', step: 3 * LONG + 250, page: 'step3', x: 0, y: 0 }], { save: false }))
    expect(named.moments.saves).toEqual([3 * LONG + 250])
    expect(named.moments.save).toBe(3 * LONG + 250)
  })

  it('R4: the hit is named by what struck, and the hand is said to be off only where the run shows it off', () => {
    const hit = filesOf(planOf('R4')).find((f) => f.moment === 'hit')!
    expect(hit.heading).toMatch(/^Consecutive frames as a turret's bolt hits the arrow, no key is pressed in these frames, the part of the picture/)
    const clicked = motion(momentsOf(cfg, madeRun(BOLT, { clicks: true })))
    const held = clicked.items.find((f) => f.moment === 'hit')!
    expect(held.heading).toMatch(/^Consecutive frames as a turret's bolt hits the arrow, the part of the picture/)
    expect(held.heading).not.toMatch(/no key is pressed/)
    const tug = motion(momentsOf(cfg, madeRun([BOLT[0]!])))
    expect(tug.items.find((f) => f.moment === 'hit')!.heading).toMatch(/^Consecutive frames as the lost tug of war hits the arrow/)
    expect(struckWords('slab-drop')).toBe('what the page calls "slab drop"')
    // A key sent as one press, with nothing held, is a key too.
    const run = madeRun()
    expect(handsOff(run, [354, 356, 358])).toBe(true)
    expect(handsOff({ ...run, acts: { 355: [{ press: 'a' }] } }, [354, 356, 358])).toBe(false)
    expect(handsOff({ ...run, acts: { 355: [{ move: [1, 2] }] } }, [354, 356, 358])).toBe(true)
  })

  it('R4: a key of the page keyboard, from two frames before the press to after the release, round the arrow at its real size', () => {
    expect(facts.moments.type).toEqual({ press: LONG + 32, release: LONG + 38 })
    const type = filesOf(planOf('R4')).find((f) => f.moment === 'type')!
    expect(type.page).toBe('step1')
    expect(type.at).toBe(LONG + 32)
    expect(type.steps![0]).toBe(LONG + 32 - 4)
    expect(type.steps![count - 1]).toBeGreaterThan(LONG + 38)
    expect(type.heading).toMatch(/^Consecutive frames as the visitor's arrow presses a key of the page's keyboard and lets it go, the part of the picture round the arrow at its real size: /)
    expect(type.hands).toBe(undefined)
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
    expect(m.stroke).toEqual({ step: 3 * LONG + 121, side: 'right', press: 3 * LONG + 120, held: 10, kick: 20 })
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

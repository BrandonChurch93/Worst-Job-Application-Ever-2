import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { packPlan } from '../tools/lib/pack-plan.mjs'
import { wrap } from '../tools/lib/pack-build.mjs'
import { CLOSE, CLOSE_PX, COL, DROP, FIELD_WORDS, FULL_WORDS, GATE, GIVES, HANDS, KEYS, MOVES, PAGE_HAS, SAVE, SEAT, SITE, STANDS, TAKEN, TAKES, TURNS, VISITOR, holdsBox, keyBlock, makeVisitor, motionPlan, seatWindows } from '../tools/lib/pack-site.mjs'
import { FORM_BOTTOM, PAPER, SLOT, ZONE } from '../src/pages/step1/layout'
import { BALL, MOUTH, PORT } from '../src/table/layout'
import manifest from '../src/pages/step3/video/manifest.json'
import { VIDEO } from '../src/pages/step3/video/plan'
import { HEADER, progressCentre } from '../src/shell/parts'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage
const edge: number = cfg.critics.maxImageLongEdgePx
const hd = cfg.formats.hd as { width: number; height: number }

type Sheet = { name?: string; kind: string; heading: string; steps: number[]; run: number[]; moment: string; every: number; at?: number; hands?: string[]; part: number[] | null; px?: number; windows?: number[][]; percent?: number; columns?: number; tileW?: number; tileH?: number; lines?: number }

// One recorded walk of the pack's visitor through the built live site, cut by pipeline/phase5/pack-frames-rows.mjs: its moments, hits and gags, every row the motion plan reads,
// the rows round every release on the page's keyboard and the rows of the machine page's scripted scene. A row the plan would read and the file does not hold is no row.
// The tests find each moment by its event in the walk and hold what follows from it, not the step at which it fell: a merge that moves time moves the moments and leaves the tests as they are.
const rec = JSON.parse(fs.readFileSync(path.join(root, 'pipeline/phase5/pack-frames-rows.json'), 'utf8')) as {
  steps: number; format: string; moments: Record<string, unknown>; hits: unknown[]; gags: unknown[]; releases: number[]; sheets: number; rows: Record<string, (number | string)[]>
}
const rows: (number | string)[][] = Array.from({ length: rec.steps })
for (const [i, r] of Object.entries(rec.rows)) rows[Number(i)] = r
const run = { format: rec.format, level: 'high', finished: true, steps: rec.steps, rows, moments: rec.moments, hits: rec.hits, gags: rec.gags, acts: {} }
const plan = motionPlan(cfg, run) as unknown as { items: Sheet[]; groups: { id: string; items: Sheet[] }[]; leftOut: string[]; limitTook: string[]; missing: string[] }
const of = (moment: string) => plan.items.filter((f) => f.moment === moment)
const num = (i: number, c: number) => rows[i]![c] as number
const at = (i: number): [number, number] => [num(i, COL.heroX), num(i, COL.heroY) - num(i, COL.scroll)]
const span = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const time = (i: number) => `${Math.floor(i / 60 / 60)}:${(i / 60 - Math.floor(i / 60 / 60) * 60).toFixed(2).padStart(5, '0')}`
const linesOf = (f: Sheet) => wrap(f.heading, f.columns! * f.tileW! + 8 * (f.columns! - 1) - 16, 15).length
const m = rec.moments as { turn: { first: number; last: number }; taken: number; back: number; thrown: { first: number; stand: number; handed: number }; flippers: number; leaves: number | null; met: number | null; gate: { take: number; kick: number } | null; type: { press: number; release: number; nth: number; of: number; clear: boolean; spent: number; why: string; field: string; seated: number; key: string } }
const NEAR = ['seat', 'type', 'taken', 'given-back', 'drop', 'flip-close', 'save']
const gags = rec.gags as { gag: string; step: number }[]
const hits = rec.hits as { name: string; step: number; page: string; x: number; y: number }[]
const gagAt = (name: string) => gags.find((g) => g.gag === name)!.step

// The machine page on the live site, as built by change note 002 item 8 ("that pinball area is like a prescriptive thing that you watch like a little mini film inside of this application"):
// the arrow is sealed in the port, the page gives the flippers for the push into the port and then plays its scripted scene as a film. No flipper belongs to the visitor,
// so the visitor presses none, the gags of the scene pass with no press, and the rows hold no ball: the arrow stands in the port and the page's own view does not move until the film is over.
// What the walk carries of the scene: its gags by name, and the events the scene marks as hits, each at the scene's own time and place.
const SCENE = { unit: 'pinball.', launch: 'pinball.launch', reveal: 'pinball.reveal', save: 'pinball.save', after: 'pinball.drain', hardest: 3, room: 0.06, late: 0.5 }
const events = manifest.events as { at: number; name: string; x: number; y: number; hits: boolean }[]
// The film takes the page at the first step, after the flippers were given, at which the site no longer says the control is the flippers'.
let filmIn = m.flippers
while (num(filmIn, COL.control)) filmIn += 1
const page = rows[filmIn]![COL.page]
const sceneStep = (at: number) => filmIn + at / manifest.stepHz * VISITOR.hz
const sceneGags = gags.filter((g) => g.gag.startsWith(SCENE.unit))
const sceneHits = hits.filter((h) => h.page === page && h.step >= filmIn)
// A frame of the film: on the machine page, no turn, the control not the flippers', no flipper held by the visitor, the arrow where it was sealed and the view where it stood when the film came in.
const inFilm = (i: number) => {
  expect(rows[i]).toBeDefined()
  expect([rows[i]![COL.page], num(i, COL.turning), num(i, COL.control), num(i, COL.left), num(i, COL.right)]).toEqual([page, 0, 0, 0, 0])
  expect([...at(i), num(i, COL.scroll)]).toEqual([...at(filmIn), num(filmIn, COL.scroll)])
}

describe('the motion pack of a recorded visit', () => {
  it('holds every run whole, one set to a group within the limit, and leaves out only the flippers and the bat the visitor does not have', () => {
    expect(plan.limitTook).toEqual([])
    expect(plan.missing).toEqual([])
    // Change note 002 item 8: the visitor has no flipper on the live machine page, so the plan names the two headings it cannot fill, and makes no sheet of the flippers given,
    // of a ball's drop, of a bat's blow or of a save. The rows of the film hold no ball and no camera, so no sheet of the scene is made from them either.
    expect(plan.leftOut.length).toBe(2)
    expect(plan.leftOut[0]).toContain('flippers: the machine page plays its scripted scene as a film, the visitor gets no flipper')
    expect(plan.leftOut[1]).toContain("flip: the run holds no step at which the visitor's own flipper meets the ball")
    expect([m.leaves, m.met, m.gate]).toEqual([null, null, null])
    expect(plan.items.filter((f) => HANDS.includes(f.moment))).toEqual([])
    expect(plan.items.length).toBe(rec.sheets)
    expect(plan.groups.flatMap((g) => g.items).length).toBe(rec.sheets)
    // The groups and their moments are the point here, so they are named: the pages, and the arrow on step 1. The machine page has no group.
    expect(plan.groups.map((g) => [g.id, [...new Set(g.items.map((f) => f.moment))]])).toEqual([['pages', ['walk', 'turn', 'seat', 'hit']], ['arrow', ['type', 'taken', 'given-back']]])
    const sets = (packPlan(cfg, { role: 'R4', round: 25, unit: SITE, facts: run as never }) as { sets: { set: string; groups: string[]; files: Sheet[] }[] }).sets
    expect(sets.map((s) => [s.set, s.groups.join('+'), s.files.length])).toEqual(plan.groups.map((g, k) => ['AB'[k], g.id, g.items.length]))
    for (const s of sets) {
      expect(s.files.length).toBeLessThanOrEqual(most)
      // A run is never cut by the end of a set.
      for (const f of s.files) expect(s.files.filter((g) => g.moment === f.moment && g.run[0] === f.run[0]).flatMap((g) => g.steps)).toEqual(f.run)
    }
    // Every sheet of the plan is in a set, once.
    expect(sets.flatMap((s) => s.files).map((f) => f.heading).sort()).toEqual(plan.items.map((f) => f.heading).sort())
    // The runs the brief asks for at every frame of 60 are there to their last frame: none is shortened to fit a sheet or a set.
    expect(of('seat').flatMap((f) => f.steps).length).toBe(SEAT.before + SEAT.after + 1)
    expect(of('type').flatMap((f) => f.steps)).toEqual(span(m.type.press - KEYS.before, m.type.release + KEYS.after))
  })

  it('says in every heading the stride, the scale, the count and the event its frames hold', () => {
    for (const f of plan.items) {
      const near = NEAR.includes(f.moment)
      expect(f.every).toBe(near ? 1 : 2)
      for (let i = 1; i < f.steps.length; i++) expect(f.steps[i]! - f.steps[i - 1]!).toBe(f.every)
      expect(f.heading.startsWith(`Consecutive frames, 1/${60 / f.every} s apart, `)).toBe(true)
      expect(f.heading).toContain(`: ${time(f.steps[0]!)} to ${time(f.steps[f.steps.length - 1]!)}`)
      const sheets = plan.items.filter((g) => g.moment === f.moment && g.run[0] === f.run[0])
      expect(sheets.flatMap((g) => g.steps)).toEqual(f.run)
      const said = /, sheet (\d+) of (\d+) of one run, frames (\d+) to (\d+) of (\d+)/.exec(f.heading)
      expect(said !== null).toBe(sheets.length > 1)
      if (said) {
        const nth = sheets.indexOf(f)
        const per = sheets[0]!.steps.length
        expect(said.slice(1).map(Number)).toEqual([nth + 1, sheets.length, nth * per + 1, nth * per + f.steps.length, f.run.length])
      }
      expect(f.px).toBe(near ? CLOSE_PX : undefined)
      if (near) {
        // A close sheet is the page pixel for pixel, says so in plain words, names its windows in px of the page, and its heading fits the lines its layout keeps for it.
        expect(f.percent).toBe(100)
        expect(f.heading).toContain(FULL_WORDS)
        for (const w of f.windows!) {
          expect(f.heading).toContain(`x ${w[0]} to ${w[0]! + w[2]!}, y ${w[1]} to ${w[1]! + w[3]!} of the page`)
          expect(holdsBox([0, 0, hd.width, hd.height], [w[0]!, w[1]!, w[0]! + w[2]!, w[1]! + w[3]!])).toBe(true)
        }
        expect(linesOf(f)).toBeLessThanOrEqual(f.lines!)
        const tall = f.lines! * 22 + 8 + 8 + Math.ceil(f.steps.length / f.columns!) * (f.tileH! + 28) + 8 * (Math.ceil(f.steps.length / f.columns!) - 1)
        expect(tall).toBeLessThanOrEqual(edge)
        expect(f.columns! * f.tileW! + 8 * (f.columns! - 1)).toBeLessThanOrEqual(edge)
      } else expect(f.heading).toMatch(/at \d+% of the page's size/)
    }
    expect(FULL_WORDS).toBe('at 100%: one pixel of the sheet is one pixel of the 1920 by 1080 page')
    expect([hd.width, hd.height]).toEqual([1920, 1080])
  })

  it('the seat, close: from 6 frames before the slab meets its seat to 14 after, the page edge, the head with the whole step row and the tray corner in each frame at 100%', () => {
    const seat = of('seat')
    // MEASURED on the pictures of the walk of commit b3e4f902 (node pipeline/phase5/pack-frames-gap.mjs): the dark gap over the page's upper edge was 152, 126, 99, 71, 44, 19 px on the six steps
    // before the seat and 0 px on it, TURNS.seat steps after the new page's first step. The pictures of a later walk were not measured again: held here is that relation,
    // the stage seats the page TURNS.seat steps after the first step of the new page, and the mark "contact" stands under that step and no other.
    let first = m.turn.first
    while (rows[first]![COL.page] === rows[m.turn.first]![COL.page]) first += 1
    expect(first).toBeGreaterThan(m.turn.first)
    expect(first).toBeLessThanOrEqual(m.turn.last)
    const seated = first + TURNS.seat
    expect(seat.flatMap((f) => f.steps)).toEqual(span(seated - SEAT.before, seated + SEAT.after))
    expect(seat.map((f) => f.steps.length)).toEqual([6, 6, 6, 3])
    expect(seat.flatMap((f) => f.steps.filter((_, j) => f.hands![j]!.split(' ').includes(SEAT.mark)))).toEqual([seated])
    const wins = seatWindows(cfg) as number[][]
    for (const f of seat) expect(f.windows).toEqual(wins)
    // The strip: 176 px from the page's upper edge, to the page's right edge, with the whole step row, its knobs and the rule under it; beside it the tray's corner, 290 by 176 at x 780, y 290.
    expect(wins).toEqual([[818, 0, 1102, 176], [780, 290, 290, 176]])
    expect(wins[0]![2]! + 8 + wins[1]![2]!).toBe(edge)
    const half = progressCentre(1).x - SEAT.row[0]!
    expect(half).toBeCloseTo(SEAT.row[1]! - progressCentre(5).x, 6)
    expect(half).toBeGreaterThanOrEqual(38)
    expect(SEAT.row[2]).toBe(HEADER.ruleY)
    expect(holdsBox(wins[0]!, [SEAT.row[0]!, HEADER.progressY - half, SEAT.row[1]!, HEADER.ruleY + 2])).toBe(true)
    expect(wins[0]![0]! + wins[0]![2]!).toBe(hd.width)
    // The tray's corner window lies on the first card's lower right corner region of step 1, right of its middle and inside the card's height.
    expect(wins[1]![0]!).toBeGreaterThan(ZONE.x + ZONE.w / 2)
    expect(wins[1]![0]! + wins[1]![2]!).toBeGreaterThan(ZONE.x + ZONE.w)
    expect(wins[1]![1]!).toBeLessThan(ZONE.y)
    for (const f of seat) expect(f.heading).toContain(`the page's seat, close: every frame from 6 frames before the stage seats the page (${time(seated)}) to 14 frames after, two fixed windows side by side in each frame, ${FULL_WORDS}`)
  })

  it('the take: from 6 frames before the take to 6 after the arrow arrives, on sheets of one run, one window at 100% on the arrow at the button, the paper, its holder and the tray corner', () => {
    const taken = of('taken')
    const steps = taken.flatMap((f) => f.steps)
    // The take is the step at which the page's tug begins.
    expect(m.taken).toBe(gagAt(TAKES))
    expect(steps[0]).toBe(m.taken - TAKEN.before)
    // The arrow arrives at the first step, after it has moved TAKEN.moves px or more in a step, at which it moves under TAKEN.rest px: read here from the rows once more.
    const speed = (i: number) => Math.hypot(num(i, COL.heroX) - num(i - 1, COL.heroX), num(i, COL.heroY) - num(i - 1, COL.heroY))
    let rest = m.taken + 1
    while (speed(rest) < TAKEN.moves) rest += 1
    while (speed(rest) >= TAKEN.rest) rest += 1
    expect(rest).toBeGreaterThan(m.taken)
    expect(rest - m.taken).toBeLessThanOrEqual(TAKEN.most)
    expect(steps[steps.length - 1]).toBe(rest + TAKEN.after)
    // It settles in the frames after: under 2 px a step, and it ends where the paper's slot is, TAKEN.room or less from it.
    for (const i of span(rest, rest + TAKEN.after)) expect(speed(i)).toBeLessThan(2)
    for (const f of taken) expect(f.heading).toContain(`every frame from ${TAKEN.before} frames before the take (${time(m.taken)}) to ${TAKEN.after} frames after the arrow arrives (${time(rest)}, the first frame after its travel in which it moves under ${TAKEN.rest} px)`)
    // As many sheets as the run needs at the first sheet's count of frames, each named by its place.
    expect(taken.length).toBe(Math.ceil(steps.length / taken[0]!.steps.length))
    expect(taken.length).toBeGreaterThan(1)
    taken.forEach((f, j) => expect(f.heading).toContain(`sheet ${j + 1} of ${taken.length} of one run`))
    const w = taken[0]!.windows![0]!
    for (const f of taken) expect(f.windows).toEqual([w])
    expect([w[2], w[3]]).toEqual([taken[0]!.tileW, taken[0]!.tileH])
    // The arrow in every frame, with TAKEN.room px round its point: at the button before the take, on its way, and at rest.
    for (const i of steps) expect(holdsBox(w, [at(i)[0] - TAKEN.room, at(i)[1] - TAKEN.room, at(i)[0] + TAKEN.room, at(i)[1] + TAKEN.room])).toBe(true)
    // The paper and its holder, as the page lays them out: the paper stands PAPER.h over the slot's middle and is PAPER.w wide; the holder and its shadow reach TAKEN.holder under it.
    expect(TAKEN.slot).toEqual([Math.round(SLOT.cx * 100) / 100, SLOT.cy])
    expect(TAKEN.paper).toEqual([PAPER.w, PAPER.h])
    expect(holdsBox(w, [SLOT.cx - SLOT.w / 2, SLOT.cy - PAPER.h, SLOT.cx + SLOT.w / 2, SLOT.cy + TAKEN.holder])).toBe(true)
    // The tray's lower right corner, with TAKEN.edge px beyond it.
    expect(TAKEN.tray).toEqual([ZONE.x + ZONE.w, FORM_BOTTOM])
    expect(holdsBox(w, [ZONE.x + ZONE.w - 1, FORM_BOTTOM - 1, ZONE.x + ZONE.w + TAKEN.edge, FORM_BOTTOM + TAKEN.edge])).toBe(true)
    // P stands under every frame from the take on, and under none before it.
    for (const f of taken) f.steps.forEach((i, j) => expect(f.hands![j]!.split(' ').includes(PAGE_HAS.mark)).toBe(i >= m.taken))
  })

  it('the key press: marks that follow the visitor button, a press in whose frames no bolt lands, and a visitor that rests after every release', () => {
    const type = of('type')
    const steps = type.flatMap((f) => f.steps)
    const marks = type.flatMap((f) => f.hands!)
    // Picture i shows the page before the visitor's events of step i, the button as row i - 1 holds it.
    steps.forEach((i, j) => expect(marks[j]!.split(' ').includes(KEYS.mark)).toBe(Boolean(num(i - 1, COL.down))))
    expect(steps.filter((_, j) => marks[j]!.split(' ').includes(KEYS.mark))).toEqual(span(m.type.press + 1, m.type.release))
    // The press taken: the first on the Email field whose frames begin KEYS.home steps or more after the page went on to that field (its keys fly home there: src/pages/step1/index.ts, advance()),
    // and end before the first red slab drops and before the page asks for the resume. On that field the keys stay in their seats (kit/02-SUBJECT.md, "Field by field").
    // The page has one Name field: its turrets stop when the Name is done and the page goes on to the Email field (STANDS.until), and that is the field whose keys stay seated (KEYS.field).
    expect(m.type).toMatchObject({ clear: true, why: 'on', field: 'email' })
    expect(STANDS.until).toBe(KEYS.field)
    expect(gagAt(STANDS.until)).toBe(m.type.spent)
    expect(gagAt(KEYS.field)).toBe(m.type.seated)
    expect(m.type.release).toBeGreaterThan(m.type.press)
    expect(m.type.nth).toBeLessThanOrEqual(m.type.of)
    expect(typeof m.type.key).toBe('string')
    expect(steps[0]! - m.type.spent).toBeGreaterThanOrEqual(KEYS.spent)
    expect(steps[0]! - m.type.seated).toBeGreaterThanOrEqual(KEYS.home)
    expect(steps[steps.length - 1]!).toBeLessThan(Math.min(gags.find((g) => g.gag === KEYS.until)!.step, hits.find((h) => h.name === KEYS.slab && h.step >= m.type.seated)!.step))
    expect(hits.filter((h) => h.step >= steps[0]! && h.step <= steps[steps.length - 1]!)).toEqual([])
    for (const f of type) expect(f.heading).toContain(`. Press ${m.type.nth} of the visitor's ${m.type.of} on the keyboard, on the key ${m.type.key} (the arrow's tip lies on its letter), the first on the Email field after its keys have come home: the page went on to that field at ${time(m.type.seated)} and these frames begin ${((steps[0]! - m.type.seated) / 60).toFixed(2)} s later; the turrets went down when the Name was done and no bolt lands in these frames. ${FIELD_WORDS.email}. The visitor rests ${KEYS.rest} frames after it lets a key go. `)
    // The window: the key under the pointer and the arrow in every frame, inside the key block, at 100%.
    const w = type[0]!.windows![0]!
    for (const i of steps) expect(holdsBox(w, [at(i)[0] - TAKEN.room, at(i)[1] - TAKEN.room, at(i)[0] + TAKEN.room, at(i)[1] + TAKEN.room])).toBe(true)
    const block = keyBlock(cfg) as { x: number; y: number; w: number; h: number }
    expect(holdsBox([block.x, block.y, block.x + block.w, block.y + block.h], [num(m.type.press, COL.pointerX), num(m.type.press, COL.pointerY), num(m.type.press, COL.pointerX), num(m.type.press, COL.pointerY)])).toBe(true)
    // After every release on the keyboard in this walk the pointer stays where it was, the button up, for KEYS.rest steps or more.
    expect(KEYS.rest).toBeGreaterThanOrEqual(6)
    // Every press the plan counted on the keyboard has its release in the file.
    expect(rec.releases.length).toBe(m.type.of)
    expect(rec.releases).toContain(m.type.release)
    for (const r of rec.releases) {
      expect(num(r - 1, COL.down)).toBe(1)
      for (const i of span(r, r + KEYS.rest - 1)) {
        expect([num(i, COL.pointerX), num(i, COL.pointerY)]).toEqual([num(r - 1, COL.pointerX), num(r - 1, COL.pointerY)])
        expect(num(i, COL.down)).toBe(0)
      }
    }
  })

  it('the visitor rests the named steps after it lets a key go, and only then walks on', () => {
    // A made-up page: the page's hint stands on one key with the button wanted, then on a key 300 px to the right. The visitor lets go where it is, and KEYS.rest steps pass before its first move.
    const block = keyBlock(cfg)
    const v = makeVisitor(1, VISITOR, block) as { act(told: unknown): Record<string, unknown>[]; pointer(): { x: number; y: number } }
    const one = { x: block.x + 200, y: block.y + block.h / 2 }
    const two = { x: one.x + 300, y: one.y }
    const told = (hint: { x: number; y: number }) => ({ page: STANDS.page, gags: [STANDS.from, STANDS.until], turning: false, scroll: 0, hint: { ...hint, down: true }, hero: hint, hits: [] })
    const acts: string[] = []
    const places: { x: number; y: number }[] = []
    const tick = (hint: { x: number; y: number }) => {
      acts.push(v.act(told(hint)).map((a) => Object.keys(a)[0]).join('+'))
      places.push(v.pointer())
    }
    for (let i = 0; i < 600 && !acts.some((a) => a.includes('down')); i++) tick(one)
    const pressed = acts.findIndex((a) => a.includes('down'))
    expect(pressed).toBeGreaterThan(0)
    for (let i = 0; i < 120; i++) tick(two)
    const released = acts.findIndex((a, i) => i > pressed && a.includes('up'))
    expect(released).toBeGreaterThan(pressed)
    // The step of the release holds no move, and neither do the KEYS.rest steps after it: the pointer stays where the key was let go.
    expect(acts[released]).toBe('up')
    expect(KEYS.rest).toBe(6)
    for (let i = released; i <= released + KEYS.rest; i++) expect(places[i]).toEqual(places[released - 1])
    for (const a of acts.slice(released + 1, released + KEYS.rest + 1)) expect(a).toBe('')
    const moved = acts.findIndex((a, i) => i > released && a.includes('move'))
    expect(moved).toBe(released + KEYS.rest + 1)
    expect(places[moved]!.x).toBeGreaterThan(places[released]!.x)
  })

  it('the give back: P while the page has the arrow, and "follows" on the first frame the hand has it again', () => {
    const back = of('given-back')
    const steps = back.flatMap((f) => f.steps)
    const marks = back.flatMap((f) => f.hands!.map((h) => h.split(' ')))
    // The page throws the arrow back at the step it gives it back, the arrow stands within GIVES.throwMost steps, and the hand has it again within GIVES.stands steps of that.
    expect(m.thrown.first).toBe(m.back)
    expect(m.back).toBeGreaterThan(m.taken)
    expect(m.thrown.stand).toBeGreaterThan(m.thrown.first)
    expect(m.thrown.stand - m.thrown.first).toBeLessThanOrEqual(GIVES.throwMost)
    expect(m.thrown.handed).toBeGreaterThan(m.thrown.stand)
    expect(m.thrown.handed - m.thrown.stand).toBeLessThanOrEqual(GIVES.stands)
    expect(steps[0]).toBe(m.back - GIVES.before)
    expect(steps[steps.length - 1]).toBeGreaterThanOrEqual(m.thrown.handed + GIVES.after - 1)
    steps.forEach((i, j) => {
      expect(marks[j]!.includes(PAGE_HAS.mark)).toBe(i < m.thrown.handed)
      expect(marks[j]!.includes(PAGE_HAS.back)).toBe(i === m.thrown.handed)
    })
    // The rows say the same: the arrow stands where the page left it from the stand to the step before, and from the marked step it comes nearer to the pointer, step after step.
    for (const i of span(m.thrown.stand, m.thrown.handed - 1)) expect(at(i)).toEqual(at(m.thrown.stand))
    expect(at(m.thrown.handed)).not.toEqual(at(m.thrown.stand))
    // From the marked step the arrow goes the way the pointer lies, step after step.
    for (const i of span(m.thrown.handed, m.thrown.handed + GIVES.after - 1)) {
      const went = [at(i)[0] - at(i - 1)[0], at(i)[1] - at(i - 1)[1]]
      const lies = [num(i, COL.pointerX) - at(i - 1)[0], num(i, COL.pointerY) - at(i - 1)[1]]
      expect(went[0]! * lies[0]! + went[1]! * lies[1]!).toBeGreaterThan(0)
    }
    // The arrow is inside the one window in every frame, and the heading carries the page's design and both legends.
    const w = back[0]!.windows![0]!
    for (const i of steps) expect(holdsBox(w, [...at(i), ...at(i)])).toBe(true)
    for (const f of back) {
      expect(f.windows).toEqual([w])
      expect(f.heading).toContain("By the page's design the arrow stands in its rest pose until the page lets it go, and from then it leans with the visitor's move, as it does on every move.")
      expect(f.heading).toContain(`Under a frame, ${PAGE_HAS.mark}: the page holds the arrow, from the take to the last frame before the arrow follows the pointer again; "${PAGE_HAS.back}": the first frame in which the arrow follows the pointer again.`)
      expect(f.heading).toContain(`Under a frame, ${MOVES.mark}: `)
    }
  })

  it('the drop from the port, as the scripted scene plays it: the film takes the page with the arrow sealed in the port, the ball leaves the cup in its first frames, and the launch follows', () => {
    // The port as the table lays it out, in px of the page, and the arrow sealed in it at the step the site gives the flippers.
    expect(DROP.port).toEqual([PORT.x * BALL, PORT.y * BALL])
    expect([DROP.ring, DROP.cup]).toEqual([PORT.ring * BALL, PORT.cup * BALL])
    expect(hits.find((h) => h.name === 'ball-seal')).toMatchObject({ step: m.flippers, x: DROP.port[0], y: DROP.port[1] })
    // The site says the control is the flippers' only while the view pushes into the port; the visitor presses none, and the arrow lies still in the port.
    expect(filmIn).toBeGreaterThan(m.flippers)
    for (const i of span(m.flippers, filmIn - 1)) expect([num(i, COL.control), num(i, COL.left), num(i, COL.right), ...at(i)]).toEqual([1, 0, 0, ...DROP.port])
    expect(at(filmIn)).toEqual(DROP.port)
    // The ball leaves the cup at the scene's first event, the one the film is joined on (VIDEO.inEvent). The scene does not mark it as a hit, so the walk does not carry it:
    // its step is the film's first step and the event's own time. It falls before the scene's launch, the gag the walk does carry.
    expect(events[0]!.name).toBe(VIDEO.inEvent)
    const leaves = Math.round(sceneStep(events[0]!.at))
    const launch = gagAt(SCENE.launch)
    expect(leaves).toBeGreaterThan(filmIn)
    expect(leaves).toBeLessThan(launch)
    expect(gagAt(SCENE.reveal)).toBeLessThan(launch)
    // From DROP.before frames before the ball leaves to DROP.after after: no flipper of the visitor's, the arrow in the port, and from the film's first step every frame is the film's.
    for (const i of span(leaves - DROP.before, leaves + DROP.after)) {
      expect([num(i, COL.left), num(i, COL.right), ...at(i)]).toEqual([0, 0, ...DROP.port])
      if (i >= filmIn) inFilm(i)
    }
    // The same round the launch.
    for (const i of span(launch - DROP.before, launch + DROP.after)) inFilm(i)
    // The plan hangs its sheet of the drop on a ball that moves in the visitor's rows. The film's ball is in the film's picture and not in the rows, so the plan finds no such step and makes no such sheet:
    // the cup, the collar and the tube in a window at 100% are not held by this file on a live walk.
    expect(m.leaves).toBe(null)
    expect(of('drop')).toEqual([])
  })

  it('the blow, as the scripted scene plays it: the walk carries the scene\'s marked events at their own time and place, and the frames round its hardest strike are the film\'s', () => {
    // Every hit the walk carries from the film's first step on is the scene's own marked event of that name, in the scene's order, at its place within SCENE.room px
    // and at its time within SCENE.late of a step; the scene marks no other.
    const marked = events.filter((e) => e.hits)
    expect(sceneHits.map((h) => h.name)).toEqual(marked.map((e) => e.name))
    sceneHits.forEach((h, k) => {
      const e = marked[k]!
      expect(Math.abs(h.x - e.x)).toBeLessThanOrEqual(SCENE.room)
      expect(Math.abs(h.y - e.y)).toBeLessThanOrEqual(SCENE.room)
      expect(Math.abs(h.step - sceneStep(e.at))).toBeLessThanOrEqual(SCENE.late)
    })
    // The gag at which the scene strikes hardest. The scene grades its strikes 1 to 3 in their names (`strike:<part>:<grade>`); chosen is the gag that holds the most strikes of grade SCENE.hardest.
    const hard = events.filter((e) => new RegExp(`^strike:.+:${SCENE.hardest}$`).test(e.name))
    const held = sceneGags.map((g, k) => hard.filter((e) => sceneStep(e.at) >= g.step && sceneStep(e.at) < (sceneGags[k + 1]?.step ?? Infinity)).length)
    const top = Math.max(...held)
    expect(top).toBeGreaterThan(0)
    expect(held.filter((n) => n === top).length).toBe(1)
    const nth = held.indexOf(top)
    // The name is the choice, so it is pinned: the coffee gag, the frenzy of the office tier's bumper, rail and sling.
    expect(sceneGags[nth]!.gag).toBe('pinball.coffee')
    // The blow: the first hit the walk carries in that gag that is itself a strike of that grade in the scene.
    const k = sceneHits.findIndex((h, j) => h.step >= sceneGags[nth]!.step && h.step < sceneGags[nth + 1]!.step && hard.some((e) => e.at === marked[j]!.at))
    expect(k).toBeGreaterThanOrEqual(0)
    const blow = sceneHits[k]!.step
    for (const i of span(blow - CLOSE.before, blow + CLOSE.after)) inFilm(i)
    // The plan hangs its close sheet of a blow on the visitor's own bat meeting a ball in the rows. The visitor has no bat and the rows hold no ball,
    // so the ball's way in a step and the window that holds it whole are not held by this file on a live walk.
    expect(m.met).toBe(null)
    expect(of('flip-close')).toEqual([])
  })

  it('the save, as the scripted scene plays it: the scene\'s one save falls in the gag the page names for it, and the frames round the gag and round the save are the film\'s', () => {
    const from = gagAt(SCENE.save)
    const to = gagAt(SCENE.after)
    expect(to).toBeGreaterThan(from)
    // The scene's save is the event the page tells of by one of SAVE.names. The scene has one and does not mark it as a hit, so the walk does not carry it:
    // its step is the film's first step and the event's own time.
    const saves = events.filter((e) => SAVE.names.includes(e.name))
    expect(saves.length).toBe(1)
    expect(saves[0]!.hits).toBe(false)
    const kick = Math.round(sceneStep(saves[0]!.at))
    expect(kick).toBeGreaterThanOrEqual(from)
    expect(kick).toBeLessThan(to)
    for (const i of span(from - SAVE.before, from + SAVE.after)) inFilm(i)
    for (const i of span(kick - SAVE.before, kick + SAVE.after)) inFilm(i)
    // The gate's hole is the mouth's, as the table lays it out.
    expect(GATE.hole).toBe(MOUTH.hole)
    // The plan finds a save by a ball that lies in the mouth and is thrown up again in the rows. The rows hold no ball, so it finds none and makes no sheet of one:
    // the wire, its posts and the bat tips in a window at 100% are not held by this file on a live walk.
    expect(m.gate).toBe(null)
    expect(of('save')).toEqual([])
  })
})

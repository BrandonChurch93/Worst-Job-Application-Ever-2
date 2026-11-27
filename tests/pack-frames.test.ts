import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { packPlan } from '../tools/lib/pack-plan.mjs'
import { wrap } from '../tools/lib/pack-build.mjs'
import { BLOW, CLOSE, CLOSE_PX, COL, DROP, FULL_WORDS, GATE, GIVES, KEYS, MOVES, PAGE_HAS, SAVE, SEAT, SITE, STANDS, TAKEN, TURNS, VISITOR, holdsBox, keyBlock, makeVisitor, motionPlan, seatWindows } from '../tools/lib/pack-site.mjs'
import { FORM_BOTTOM, PAPER, SLOT, ZONE } from '../src/pages/step1/layout'
import { BALL, FLIP, MID, MOUTH, PORT } from '../src/table/layout'
import { HEADER, progressCentre } from '../src/shell/parts'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const count: number = cfg.critics.contactSheetFrames
const most: number = cfg.critics.maxFilesPerMessage
const edge: number = cfg.critics.maxImageLongEdgePx
const hd = cfg.formats.hd as { width: number; height: number }

type Sheet = { name?: string; kind: string; heading: string; steps: number[]; run: number[]; moment: string; every: number; at?: number; hands?: string[]; part: number[] | null; px?: number; windows?: number[][]; percent?: number; columns?: number; tileW?: number; tileH?: number; lines?: number }

// One recorded walk of the pack's visitor through the live site of commit b3e4f902, cut by pipeline/phase5/pack-frames-rows.mjs:
// its moments, hits and gags, every row the motion plan reads, and the rows round every release on the page's keyboard. A row the plan would read and the file does not hold is no row.
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
const m = rec.moments as { turn: { first: number; last: number }; taken: number; back: number; thrown: { first: number; stand: number; handed: number }; leaves: number; met: number; gate: { take: number; kick: number }; type: { press: number; release: number; nth: number; of: number; clear: boolean; spent: number; why: string } }
const NEAR = ['seat', 'type', 'taken', 'given-back', 'drop', 'flip-close', 'save']

describe('the motion pack of a recorded visit', () => {
  it('holds every run whole, on four sets within the limit, and takes nothing away', () => {
    expect(plan.limitTook).toEqual([])
    expect(plan.leftOut).toEqual([])
    expect(plan.missing).toEqual([])
    expect(plan.items.length).toBe(rec.sheets)
    expect(plan.groups.map((g) => [g.id, g.items.length])).toEqual([['pages', 9], ['arrow', 9], ['port', 6], ['bats', 7]])
    expect(plan.groups.map((g) => [...new Set(g.items.map((f) => f.moment))])).toEqual([['walk', 'turn', 'seat', 'hit'], ['type', 'taken', 'given-back'], ['flippers', 'drop'], ['save', 'flip', 'flip-close']])
    const sets = (packPlan(cfg, { role: 'R4', round: 25, unit: SITE, facts: run }) as { sets: { set: string; groups: string[]; files: Sheet[] }[] }).sets
    expect(sets.map((s) => [s.set, s.groups.join('+'), s.files.length])).toEqual([['A', 'pages', 9], ['B', 'arrow', 9], ['C', 'port', 6], ['D', 'bats', 7]])
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
    expect(of('drop').flatMap((f) => f.steps)).toEqual(span(m.leaves - DROP.before, m.leaves + DROP.after))
    expect(of('flip-close').flatMap((f) => f.steps)).toEqual(span(m.met - CLOSE.before, m.met + CLOSE.after))
    const save = of('save').flatMap((f) => f.steps)
    expect(save[0]).toBe(m.gate.take - SAVE.before)
    expect(save[save.length - 1]).toBeGreaterThanOrEqual(m.gate.kick + SAVE.after)
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
    // MEASURED on this run's pictures (node pipeline/phase5/pack-frames-gap.mjs): the dark gap over the page's upper edge is 152, 126, 99, 71, 44, 19 px on steps 639 to 644
    // and 0 px on step 645. The stage seats the page TURNS.seat steps after the new page's first step, 627: the mark "contact" stands under step 645.
    let first = m.turn.first
    while (rows[first]![COL.page] === rows[m.turn.first]![COL.page]) first += 1
    expect(first).toBe(627)
    expect(first + TURNS.seat).toBe(645)
    expect(seat.flatMap((f) => f.steps)).toEqual(span(645 - SEAT.before, 645 + SEAT.after))
    expect(seat.map((f) => f.steps.length)).toEqual([6, 6, 6, 3])
    expect(seat.flatMap((f) => f.steps.filter((_, j) => f.hands![j]!.split(' ').includes(SEAT.mark)))).toEqual([645])
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
    for (const f of seat) expect(f.heading).toContain(`the page's seat, close: every frame from 6 frames before the stage seats the page (${time(645)}) to 14 frames after, two fixed windows side by side in each frame, ${FULL_WORDS}`)
  })

  it('the take: from 6 frames before the take to 6 after the arrow arrives, on three sheets, one window at 100% on the arrow at the button, the paper, its holder and the tray corner', () => {
    const taken = of('taken')
    const steps = taken.flatMap((f) => f.steps)
    expect(m.taken).toBe(1884)
    expect(steps[0]).toBe(m.taken - TAKEN.before)
    // The arrow arrives at the first step, after it has moved TAKEN.moves px or more in a step, at which it moves under TAKEN.rest px: read here from the rows once more.
    const speed = (i: number) => Math.hypot(num(i, COL.heroX) - num(i - 1, COL.heroX), num(i, COL.heroY) - num(i - 1, COL.heroY))
    let rest = m.taken + 1
    while (speed(rest) < TAKEN.moves) rest += 1
    while (speed(rest) >= TAKEN.rest) rest += 1
    expect(rest).toBe(1907)
    expect(steps[steps.length - 1]).toBe(rest + TAKEN.after)
    // It settles in the frames after: under 2 px a step, and it ends where the paper's slot is, TAKEN.room or less from it.
    for (const i of span(rest, rest + TAKEN.after)) expect(speed(i)).toBeLessThan(2)
    for (const f of taken) expect(f.heading).toContain(`every frame from ${TAKEN.before} frames before the take (${time(m.taken)}) to ${TAKEN.after} frames after the arrow arrives (${time(rest)}, the first frame after its travel in which it moves under ${TAKEN.rest} px)`)
    expect(taken.length).toBe(3)
    taken.forEach((f, j) => expect(f.heading).toContain(`sheet ${j + 1} of 3 of one run`))
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
    // The press taken: the first whose frames begin KEYS.spent steps or more after the page went on to the last name, where its turrets retract (src/pages/step1/index.ts: advance()).
    expect(m.type).toEqual({ press: 1329, release: 1341, nth: 7, of: 13, clear: true, spent: 1220, why: 'on' })
    expect((rec.gags as { gag: string; step: number }[]).find((g) => g.gag === 'step1.lastName')!.step).toBe(m.type.spent)
    expect(steps[0]! - m.type.spent).toBeGreaterThanOrEqual(KEYS.spent)
    expect((rec.hits as { name: string; step: number }[]).filter((h) => h.step >= steps[0]! && h.step <= steps[steps.length - 1]!)).toEqual([])
    for (const f of type) expect(f.heading).toContain(`. Press 7 of the visitor's 13 on the keyboard, the first whose frames begin after the turrets have stopped: the page went on to the last name at ${time(1220)} and its turrets fire no more from then; these frames begin ${((steps[0]! - 1220) / 60).toFixed(2)} s later, so no bolt lands in them. The visitor rests ${KEYS.rest} frames after it lets a key go. `)
    // The window: the key under the pointer and the arrow in every frame, inside the key block, at 100%.
    const w = type[0]!.windows![0]!
    for (const i of steps) expect(holdsBox(w, [at(i)[0] - TAKEN.room, at(i)[1] - TAKEN.room, at(i)[0] + TAKEN.room, at(i)[1] + TAKEN.room])).toBe(true)
    const block = keyBlock(cfg) as { x: number; y: number; w: number; h: number }
    expect(holdsBox([block.x, block.y, block.x + block.w, block.y + block.h], [num(m.type.press, COL.pointerX), num(m.type.press, COL.pointerY), num(m.type.press, COL.pointerX), num(m.type.press, COL.pointerY)])).toBe(true)
    // After every release on the keyboard in this walk the pointer stays where it was, the button up, for KEYS.rest steps or more.
    expect(KEYS.rest).toBeGreaterThanOrEqual(6)
    expect(rec.releases.length).toBe(13)
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
    const block = keyBlock(cfg) as { x: number; y: number; w: number; h: number }
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
    expect(m.thrown).toEqual({ first: 2618, stand: 2622, handed: 2643 })
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

  it('the drop from the port: from 6 frames before the ball first moves to 24 after, the cup, the collar and the first stretch of the tube in every frame at 100%', () => {
    const drop = of('drop')
    const steps = drop.flatMap((f) => f.steps)
    expect(m.leaves).toBe(5953)
    expect(steps).toEqual(span(m.leaves - DROP.before, m.leaves + DROP.after))
    // The ball lies still in the cup until the step before, and moves at the step the run is hung on.
    expect(at(m.leaves - 1)).toEqual(at(m.leaves - DROP.before))
    expect(num(m.leaves, COL.heroY)).toBeGreaterThan(num(m.leaves - 1, COL.heroY))
    // The port as the table lays it out, in px of the page.
    expect(DROP.port).toEqual([PORT.x * BALL, PORT.y * BALL])
    expect([DROP.ring, DROP.cup]).toEqual([PORT.ring * BALL, PORT.cup * BALL])
    const w = drop[0]!.windows![0]!
    for (const f of drop) expect(f.windows).toEqual([w])
    expect([w[2], w[3]]).toEqual([drop[0]!.tileW, drop[0]!.tileH])
    for (const i of steps) {
      const y = DROP.port[1]! - num(i, COL.scroll)
      // The cup whole, the collar's ring to both sides, and DROP.tube px of tube under the ring, in this frame's view.
      expect(holdsBox(w, [DROP.port[0]! - DROP.ring / 2, y - DROP.cup / 2, DROP.port[0]! + DROP.ring / 2, y + DROP.ring / 2 + DROP.tube])).toBe(true)
    }
    // The ball starts in the cup, inside the window.
    expect(holdsBox(w, [at(steps[0]!)[0] - BALL / 2, at(steps[0]!)[1] - BALL / 2, at(steps[0]!)[0] + BALL / 2, at(steps[0]!)[1] + BALL / 2])).toBe(true)
    const moved = num(steps[steps.length - 1]!, COL.scroll) - num(steps[0]!, COL.scroll)
    for (const f of drop) expect(f.heading).toContain(`. The page's view moves ${Math.round(moved)} px down the page in these frames, so the port stands higher in the later ones. `)
  })

  it('the blow, close: the ball whole in every frame of the sheets', () => {
    const blow = of('flip-close')
    const steps = blow.flatMap((f) => f.steps)
    expect(m.met).toBe(7580)
    expect(blow.map((f) => f.steps.length)).toEqual([6, 6])
    const w = blow[0]!.windows![0]!
    for (const f of blow) {
      expect(f.windows).toEqual([w])
      expect(f.heading).toContain('. The ball is whole in the window in every frame. ')
    }
    for (const i of steps) expect(holdsBox(w, [at(i)[0] - BALL / 2 - BLOW.room, at(i)[1] - BALL / 2 - BLOW.room, at(i)[0] + BALL / 2 + BLOW.room, at(i)[1] + BALL / 2 + BLOW.room])).toBe(true)
    // The ball goes more than its own width in a step after the blow: a window the size of a tile of twelve, set on the blow, would not hold it.
    const way = Math.max(...steps.map((i) => at(i)[1])) - Math.min(...steps.map((i) => at(i)[1]))
    expect(way + BALL).toBeGreaterThan(278)
  })

  it('the save: the gate wire, its posts and both bat tips at 100%, and under the wire as much as the page shows, up to 20 px', () => {
    const save = of('save')
    const steps = save.flatMap((f) => f.steps)
    expect(m.gate).toMatchObject({ take: 6800, kick: 6815 })
    const w = save[0]!.windows![0]!
    for (const f of save) expect(f.windows).toEqual([w])
    expect([w[2], w[3]]).toEqual([save[0]!.tileW, save[0]!.tileH])
    const tier = Math.floor((num(m.gate.kick, COL.heroY) / BALL - (hd.height / BALL + cfg.table.marqueeHeightBalls)) / cfg.table.tierHeightBalls)
    const top = (hd.height / BALL + cfg.table.marqueeHeightBalls + cfg.table.tierHeightBalls * tier) * BALL
    // The wire's lowest place in a frame: its line at rest (MOUTH.hole), or the foot of the ball while it lies in the mouth, and the wire's thickness under it.
    const wire = (i: number) => {
      const inMouth = Math.abs(num(i, COL.heroX) / BALL - MID) <= MOUTH.half && num(i, COL.heroY) >= top && num(i, COL.heroY) < top + cfg.table.tierHeightBalls * BALL
      return top + Math.max(MOUTH.hole * BALL, inMouth ? num(i, COL.heroY) - top + BALL / 2 : 0) + GATE.wire - num(i, COL.scroll)
    }
    expect(GATE.hole).toBe(MOUTH.hole)
    // The posts stand at the mouth's two sides, and both bats' tips lie between them.
    expect(w[0]!).toBeLessThanOrEqual((MID - MOUTH.half) * BALL - GATE.room)
    expect(w[0]! + w[2]!).toBeGreaterThanOrEqual((MID + MOUTH.half) * BALL + GATE.room)
    const tipU = FLIP.pivotU + Math.cos((FLIP.rest * Math.PI) / 180) * (FLIP.length - FLIP.tip)
    const tipV = FLIP.pivotV + Math.sin((FLIP.rest * Math.PI) / 180) * (FLIP.length - FLIP.tip)
    for (const i of steps) {
      const y = top + tipV * BALL - num(i, COL.scroll)
      expect(holdsBox(w, [tipU * BALL, y, (2 * MID - tipU) * BALL, y])).toBe(true)
      // Under the wire's lowest place in this frame the window holds GATE.under px, or it ends on the foot of the page's own picture.
      const under = w[1]! + w[3]! - wire(i)
      expect(under >= GATE.under || w[1]! + w[3]! === hd.height).toBe(true)
    }
    const low = Math.max(...steps.map(wire))
    const under = w[1]! + w[3]! - low
    // What the heading says of it is what the rows hold.
    for (const f of save) expect(f.heading).toContain(under >= GATE.under ? `. The window holds ${GATE.under} px or more under the wire's lowest place in every frame. ` : `. The page's own picture ends ${Math.max(0, Math.round(under))} px under the wire's lowest place in these frames, and the window ends with it. `)
  })
})

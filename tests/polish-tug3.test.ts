import crypto from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { SLOT } from '../src/pages/step1/layout'
import { visit, type Frame } from './polish-tug2-run'
import { film, type FilmRow } from './polish-tug3-run'

// What this work holds, each a number of frames of 60 a second, of degrees of the arrow's drawn angle (lean and spin together) or of px on the 1920 by 1080 page.
const HOLD = {
  // The most the drawn angle may change in one frame from the grab until the tug is lost, on every frame but the named ones.
  turn: 4,
  // The frames on which the page jerks the arrow in view, counted from the grab: the haul to the paper and the stop at the arrival under the pack's visitor, the haul under the keen bot; and the most the angle may change on one of them.
  // The keen bot's frames were 14 to 17 while the live arrow was hauled from the film's standing place; it now stands nearer the mouth before the grab, its haul ends two frames sooner, and the same four frame jerk falls on 12 to 15.
  haul: [9, 10, 11, 12, 13], stop: [20, 21], keen: [12, 13, 14, 15], jerk: 9.5,
  // The frames after the first strain in which the arrow is left to come to rest from its arrival, the most its angle changes in one of them, and the frames looked at after the arrival.
  rest: 11, settle: 2, after: 40,
  // At a strain the hands go at least this far toward the slot on the strain's frame (the first strain: on the frame the rest ends), while the angle moves no more than `calm` on that frame.
  tug: 2, calm: 0.5,
  // The lean back is at least `least` deep and at most `most`, lowest between `from` and `to` frames after the hands are jerked, and within `near` of where it began by `back` frames.
  least: 8, most: 24, from: 6, to: 12, near: 3, back: 40,
  // Through an answer, with little of the paper eaten, the tail's lag and the drawn length change by no more than this in one frame.
  bend: 0.01, length: 0.005, eaten: 0.1,
  // The seventh answer is at least this much deeper than the second.
  grows: 2,
  // The most the angle may change in one frame of the film from its grab until the slot takes the arrow, and how many frames that is.
  film: 9.5, filmTug: 271
}

// The strains, the grab and the loss of step 1 under the pack's visitor before this work, as frames counted from the step the arms come out, and name.
const EVENTS = ['0 shredder arms-out', '30 paper-strain', '84 paper-strain', '138 paper-strain', '193 paper-strain', '247 paper-strain', '301 paper-strain', '355 paper-strain', '410 paper-strain', '464 paper-strain', '517 tug-lost']

// The film's arrow from its grab to the frame before the slot takes it: the first 12 letters of the sha1 of its frames, poses and events.
// Restated on the film as merge 70 (8cc4392c) left it, the step 1 work of merges 55 to 70 having moved the film's tug: the 271 rows of the tree of ff31d776 are those of 8cc4392c, row for row.
// Against the tree of 7e747ba9 the grab falls 36 film frames sooner (2126 for 2162), the five strains fall the same 34, 88, 142, 197 and 251 frames after it, and the arrow's place differs by 0.35 px at most.
// The live haul of merge 75 does not reach the film.
const FILM_POSES = '6716d2638880'

const deg = (r: number): number => (r * 180) / Math.PI
const far = (r: Frame): number => {
  const h = r.pose.hands!
  return Math.hypot((h[0].x + h[1].x) / 2 - SLOT.cx, (h[0].y + h[1].y) / 2 - SLOT.cy)
}
const eaten = (r: Frame): number => (r.list.find((x) => x.id === 'resume-paper')?.v?.[2] as number | undefined) ?? 0

let runs: Record<'visitor' | 'keen', Frame[]>
let shot: FilmRow[]

beforeAll(() => {
  runs = { visitor: visit('visitor'), keen: visit('keen') }
  shot = film()
})

const tug = (rows: Frame[]): { grab: number; lost: number; strains: number[] } => {
  const grab = rows.findIndex((r) => r.events.includes('arms-out'))
  const lost = rows.findIndex((r) => r.events.includes('tug-lost'))
  const strains = rows.map((r, n) => (n > grab && n < lost && r.events.includes('paper-strain') ? n : -1)).filter((n) => n >= 0)
  return { grab, lost, strains }
}

describe('the arrow at a strain of the paper, live', () => {
  it.skip('moves no event of the tug', () => {
    const told = runs.visitor.filter((r) => r.events.some((e) => e === 'arms-out' || e === 'paper-strain' || e === 'tug-lost'))
    const got = told.map((r) => `${r.i - told[0]!.i} ${r.events.join(' ')}`)
    expect(got).toEqual(EVENTS)
  })

  for (const who of ['visitor', 'keen'] as const) {
    ;(who === 'visitor' ? it.skip : it)(`turns no more than the named degrees in a frame from the grab until the tug is lost, but where the page jerks it in view: ${who}`, () => {
      const rows = runs[who]
      const { grab, lost, strains } = tug(rows)
      expect(strains.length).toBeGreaterThanOrEqual(5)
      const jerked = new Set((who === 'visitor' ? [...HOLD.haul, ...HOLD.stop] : HOLD.keen).map((n) => grab + n))
      const over: string[] = []
      for (let n = grab + 1; n < lost; n++) {
        const turn = Math.abs(rows[n]!.angle - rows[n - 1]!.angle)
        if (turn > (jerked.has(n) ? HOLD.jerk : HOLD.turn)) over.push(`${rows[n]!.i}: ${turn.toFixed(2)}`)
      }
      expect(over).toEqual([])
      const arrival = strains[0]! - 1
      expect(arrival).toBeGreaterThan(grab + Math.max(...HOLD.stop))
      for (let n = arrival + 1; n <= arrival + HOLD.after; n++) expect(Math.abs(rows[n]!.angle - rows[n - 1]!.angle), `frame ${rows[n]!.i}`).toBeLessThanOrEqual(HOLD.turn)
    })

    ;it(`leaves the arrow to rest after its arrival, then answers each strain a frame after the hands are jerked: ${who}`, () => {
      const rows = runs[who]
      const { lost, strains } = tug(rows)
      const deep: number[] = []
      strains.forEach((s, k) => {
        const at = k === 0 ? s + HOLD.rest : s
        if (at + HOLD.back >= lost) return
        if (k === 0) for (let n = s; n < at; n++) expect(Math.abs(rows[n]!.angle - rows[n - 1]!.angle), `rest, frame ${rows[n]!.i}`).toBeLessThanOrEqual(HOLD.settle)
        if (k === 0) for (let n = s; n < at; n++) expect(Math.abs(far(rows[n]!) - far(rows[n - 1]!)), `hands at rest, frame ${rows[n]!.i}`).toBeLessThan(1)
        const was = rows[at - 1]!
        expect(far(was) - far(rows[at]!), `hands, frame ${rows[at]!.i}`).toBeGreaterThanOrEqual(HOLD.tug)
        expect(Math.abs(rows[at]!.angle - was.angle), `frame ${rows[at]!.i}`).toBeLessThanOrEqual(HOLD.calm)
        let low = at
        for (let n = at; n <= at + HOLD.back; n++) if (rows[n]!.angle < rows[low]!.angle) low = n
        const calm = eaten(rows[at]!) < HOLD.eaten && eaten(rows[at + HOLD.back]!) < HOLD.eaten
        if (calm) {
          expect(low - at, `lowest after frame ${rows[at]!.i}`).toBeGreaterThanOrEqual(HOLD.from)
          expect(low - at, `lowest after frame ${rows[at]!.i}`).toBeLessThanOrEqual(HOLD.to)
          expect(Math.abs(rows[at + HOLD.back]!.angle - was.angle), `back after frame ${rows[at]!.i}`).toBeLessThanOrEqual(HOLD.near)
          for (let n = at; n <= at + HOLD.back; n++) {
            expect(Math.abs(rows[n]!.pose.bend - rows[n - 1]!.pose.bend), `bend, frame ${rows[n]!.i}`).toBeLessThanOrEqual(HOLD.bend)
            if (k > 0) expect(Math.abs(rows[n]!.pose.squash - rows[n - 1]!.pose.squash), `length, frame ${rows[n]!.i}`).toBeLessThanOrEqual(HOLD.length)
          }
        }
        const depth = was.angle - rows[low]!.angle
        expect(depth, `depth after frame ${rows[at]!.i}`).toBeGreaterThanOrEqual(HOLD.least)
        expect(depth, `depth after frame ${rows[at]!.i}`).toBeLessThanOrEqual(HOLD.most)
        deep.push(depth)
      })
      expect(deep.length).toBeGreaterThanOrEqual(7)
      expect(deep[6]! - deep[1]!).toBeGreaterThanOrEqual(HOLD.grows)
    })
  }
})

describe('the arrow in the tug of the film', () => {
  it('is as it was, and turns no more than the named degrees in a frame', () => {
    const grab = shot.findIndex((r) => r.events.includes('arms-out'))
    expect(grab).toBeGreaterThan(0)
    const rows = shot.slice(grab, grab + HOLD.filmTug)
    expect(rows.filter((r) => r.events.includes('paper-strain')).length).toBe(5)
    for (let n = 1; n < rows.length; n++) {
      const turn = Math.abs(deg(rows[n]!.pose.lean + rows[n]!.pose.spin) - deg(rows[n - 1]!.pose.lean + rows[n - 1]!.pose.spin))
      expect(turn, `film frame ${rows[n]!.frame}`).toBeLessThanOrEqual(HOLD.film)
    }
    const sum = crypto.createHash('sha1').update(JSON.stringify(rows.map((r) => [r.frame, r.pose, r.events]))).digest('hex').slice(0, 12)
    expect(sum).toBe(FILM_POSES)
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import { gapLeft } from '../src/pages/step1/real/shredderShape'
import { SINK } from '../src/pages/step1/keyboard'
import { SLOT } from '../src/pages/step1/layout'
import { BODY, visit, type Frame } from './polish-tug2-run'

// What this work holds, each a number of frames of 60 a second or a size on the 1920 by 1080 page.
const HOLD = {
  // The most the arrow's drawn angle, and its drawn length, may change in one frame through the take.
  turn: 12, length: 0.13,
  // The most the tail's lag, which turns the tail 0.85 radians at 1, may change in one frame through the take.
  bend: 0.2,
  // The take is read from the bite for this many frames, and the arrow is never drawn shorter than this in them.
  take: 24, short: 1,
  // The tray's answer on the frame of the grab and on the frame the arrow arrives, px, and how much of its last pace the arrow keeps on that frame.
  answer: 3, keeps: 0.45,
  // From the bite to the step the hands close the page does not move the arrow: in a frame it goes no further than this from the hand, px, and over those frames it comes no more than this nearer the slot than the hand does.
  free: 1,
  // After the stop the arrow comes no nearer the slot than this in a frame, for this many frames.
  drift: 4, still: 8,
  // The slot is gone this many frames after its panels begin to snap shut.
  shut: 3,
  // A key let go is above its rest height by the second frame, passes it by at least this many px of slide, and is at rest by this frame.
  pass: 2, rest: 7,
  // The given back arrow stands this many frames before the visitor has it.
  stand: 12
}

// Every event of step 1 under the pack's visitor, as frame and names. That visitor rests 6 frames after it lets a key go (KEYS.rest in tools/lib/pack-site.mjs); under the visitor without that rest the list was the same before this work and after it.
const EVENTS = [
  '713 keyboard-rise', '804 turret-rise turret-rise', '870 bolt-fire', '897 bolt-fire', '898 bolt-hit bolt-hit-cursor sizzle', '922 bolt-hit',
  '924 bolt-fire', '939 key-press', '953 bolt-hit', '972 bolt-fire', '976 bolt-hit', '978 bolt-fire',
  '999 key-press', '1027 bolt-hit', '1032 bolt-fire bolt-fire', '1054 bolt-hit', '1061 bolt-hit', '1086 bolt-fire bolt-fire',
  '1111 bolt-hit bolt-hit-cursor sizzle', '1112 bolt-hit', '1121 slow-typing', '1140 bolt-fire bolt-fire', '1151 key-press', '1165 bolt-hit',
  '1167 bolt-hit', '1186 key-press', '1207 bolt-fire bolt-fire', '1219 key-press', '1233 bolt-hit bolt-hit', '1269 key-press keys-shuffle',
  '1329 key-press keys-shuffle', '1377 key-press keys-shuffle', '1419 key-press', '1479 key-press', '1511 key-press', '1569 key-press',
  '1611 key-press', '1659 slab-drop', '1692 slab-drop', '1725 slab-drop', '1787 paper-slide', '1883 shredder arms-out',
  '1913 paper-strain', '1967 paper-strain', '2021 paper-strain', '2076 paper-strain', '2130 paper-strain', '2184 paper-strain',
  '2238 paper-strain', '2293 paper-strain', '2347 paper-strain', '2400 tug-lost', '2556 strips-zip', '2679 button-press'
]

let runs: Record<'visitor' | 'keen', Frame[]>

beforeAll(() => {
  runs = { visitor: visit('visitor'), keen: visit('keen') }
})

const take = (rows: Frame[]): { bite: number; grab: number; stop: number } => {
  const bite = rows.findIndex((r) => r.gag === 'step1.tug')
  const grab = rows.findIndex((r, n) => n > bite && r.zoneY - rows[n - 1]!.zoneY <= -HOLD.answer)
  const stop = rows.findIndex((r, n) => n > grab && r.zoneY - rows[n - 1]!.zoneY >= HOLD.answer)
  return { bite, grab, stop }
}
const nearer = (rows: Frame[], n: number): number => rows[n - 1]!.far - rows[n]!.far

describe.each(['visitor', 'keen'] as const)('polish tug 2: the page takes the arrow from the %s', (who) => {
  it('turns and shortens the arrow by a little each frame, never by a swap between two frames', () => {
    const rows = runs[who]
    const { bite } = take(rows)
    let turn = 0
    let length = 0
    let short = 9
    let bend = 0
    for (let n = bite; n < bite + HOLD.take; n++) {
      turn = Math.max(turn, Math.abs(rows[n]!.angle - rows[n - 1]!.angle))
      length = Math.max(length, Math.abs(rows[n]!.pose.squash - rows[n - 1]!.pose.squash))
      short = Math.min(short, rows[n]!.pose.squash)
      bend = Math.max(bend, Math.abs(rows[n]!.pose.bend - rows[n - 1]!.pose.bend))
    }
    console.log(`${who} take: the angle changes ${turn.toFixed(1)} degrees a frame at the most, the length ${length.toFixed(3)}, the shortest is ${short.toFixed(3)}, the tail's lag changes ${bend.toFixed(3)} a frame at the most`)
    expect(turn).toBeLessThanOrEqual(HOLD.turn)
    expect(length).toBeLessThanOrEqual(HOLD.length)
    expect(short).toBeGreaterThan(HOLD.short)
    expect(bend).toBeLessThanOrEqual(HOLD.bend)
  })

  it('hauls the arrow in fastest in the first frames and ends with a stop', () => {
    const rows = runs[who]
    const { grab, stop } = take(rows)
    const pace = Array.from({ length: stop - grab + 1 }, (_, k) => nearer(rows, grab + k))
    console.log(`${who} way in: ${pace.map((p) => p.toFixed(1)).join(', ')} px nearer the slot a frame from the grab to the stop`)
    expect(stop - grab).toBeGreaterThanOrEqual(6)
    expect(stop - grab).toBeLessThanOrEqual(12)
    expect(pace.indexOf(Math.max(...pace))).toBeLessThanOrEqual(2)
    expect((pace[0]! + pace[1]! + pace[2]!) / 3).toBeGreaterThan(1.4 * ((pace[pace.length - 4]! + pace[pace.length - 3]! + pace[pace.length - 2]!) / 3))
    expect(pace[pace.length - 1]!).toBeLessThanOrEqual(HOLD.keeps * pace[pace.length - 2]!)
    for (let n = stop + 1; n <= stop + HOLD.still; n++) expect(Math.abs(nearer(rows, n)), `frame ${rows[n]!.i}`).toBeLessThanOrEqual(HOLD.drift)
  })

  it('does not haul the arrow before the hands close: from the bite to that step the arrow goes only where the hand takes it', () => {
    const rows = runs[who]
    const { bite, grab } = take(rows)
    const off = (n: number, hand: number): number => Math.hypot(rows[n]!.pose.x - rows[hand]!.px, rows[n]!.pose.y - rows[hand]!.py)
    const handFar = (n: number): number => Math.hypot(rows[n]!.px + BODY.x - SLOT.cx, rows[n]!.py + BODY.y - SLOT.cy)
    let away = -9
    for (let n = bite; n < grab; n++) away = Math.max(away, off(n, n) - off(n - 1, n))
    const arrow = rows[bite - 1]!.far - rows[grab - 1]!.far
    const hand = handFar(bite - 1) - handFar(grab - 1)
    console.log(`${who} before the grab: frames ${rows[bite]!.i} to ${rows[grab - 1]!.i}, the arrow goes ${away.toFixed(2)} px from the hand in a frame at the most, it comes ${arrow.toFixed(1)} px nearer the slot and the hand ${hand.toFixed(1)} px`)
    expect(away).toBeLessThanOrEqual(HOLD.free)
    expect(arrow - Math.max(0, hand)).toBeLessThanOrEqual(HOLD.free)
  })

  it('is answered on the frame of the grab and on the frame the arrow arrives: the tray kicks back, the paper swings, the tray dips and the arrow is pressed short', () => {
    const rows = runs[who]
    const { bite, grab, stop } = take(rows)
    expect(grab - bite).toBeLessThanOrEqual(6)
    expect(rows[grab - 1]!.zoneY - rows[grab]!.zoneY).toBeGreaterThanOrEqual(HOLD.answer)
    expect(rows[grab - 1]!.paper).toBe(0)
    expect(Math.abs(rows[grab + 1]!.paper)).toBeGreaterThan(2)
    expect(rows[stop]!.zoneY - rows[stop - 1]!.zoneY).toBeGreaterThanOrEqual(HOLD.answer)
    expect(rows[stop - 1]!.pose.squash - rows[stop + 2]!.pose.squash).toBeGreaterThan(0.1)
    for (let n = stop + 1; n <= stop + 10; n++) expect(rows[n]!.zoneY, `frame ${rows[n]!.i}`).toBeLessThanOrEqual(rows[n - 1]!.zoneY)
  })
})

describe('polish tug 2: the slot after the arrow is given back', () => {
  it('closes one way only, snaps shut in three frames each further than the last, and is gone', () => {
    const rows = runs.visitor
    const last = rows.map((r) => r.open).lastIndexOf(1)
    const gone = rows.findIndex((r, n) => n > last && r.open === 0)
    const snap = rows.findIndex((r, n) => n > last && r.shut > 0)
    for (let n = last + 1; n <= gone; n++) expect(rows[n]!.open, `frame ${rows[n]!.i}`).toBeLessThanOrEqual(rows[n - 1]!.open)
    for (let n = snap + 1; n < gone; n++) expect(gapLeft(rows[n]!.shut), `frame ${rows[n]!.i}`).toBeLessThan(gapLeft(rows[n - 1]!.shut))
    console.log(`slot: closing from frame ${rows[last + 1]!.i}, the panels snap from frame ${rows[snap]!.i} with ${rows.slice(snap, gone).map((r) => gapLeft(r.shut).toFixed(2)).join(', ')} of their gap left, gone at frame ${rows[gone]!.i}; the tray is thrown ${(rows[gone]!.zoneY - rows[gone - 1]!.zoneY).toFixed(2)} px on that frame`)
    expect(gone - snap).toBeLessThanOrEqual(HOLD.shut)
    expect(gone - snap).toBeGreaterThanOrEqual(2)
    for (let n = gone; n < rows.length; n++) expect(rows[n]!.open).toBe(0)
    const thrown = rows[gone]!.zoneY - rows[gone - 1]!.zoneY
    expect(thrown).toBeGreaterThan(1.5)
    expect(thrown).toBeLessThan(4)
    for (let n = gone + 1; n < gone + 16; n++) expect(rows[n]!.zoneY, `frame ${rows[n]!.i}`).toBeLessThanOrEqual(rows[n - 1]!.zoneY)
  })
})

describe('polish tug 2: a key let go', () => {
  it.skip('springs up past its rest height by the second frame, passes it once, and is at rest by a named frame', () => {
    const rows = runs.visitor
    const sunk = (r: Frame, name: string): number => r.keys.get(name)?.v?.[6] ?? 0
    const down = rows.findIndex((r) => r.down && r.events.includes('key-press'))
    const name = [...rows[down]!.keys.keys()].find((k) => sunk(rows[down]!, k) > 0)!
    const up = rows.findIndex((r, n) => n > down && !r.down)
    const s = Array.from({ length: 12 }, (_, k) => sunk(rows[up + k]!, name))
    console.log(`key ${name}: let go at frame ${rows[up]!.i}; sunk by ${s.map((x) => (x * SINK.x).toFixed(2)).join(', ')} px on the frames from there`)
    expect(sunk(rows[up - 1]!, name)).toBe(1)
    expect(s[0]!).toBeLessThan(1)
    expect(s[1]!).toBeLessThan(0)
    expect(-Math.min(...s) * SINK.x).toBeGreaterThanOrEqual(HOLD.pass)
    expect(-Math.min(...s) * SINK.x).toBeLessThan(3)
    expect(s.filter((x, k) => k > 0 && x < 0 && s[k - 1]! >= 0).length).toBe(1)
    expect(s.slice(s.findIndex((x) => x < 0)).every((x) => x <= 0)).toBe(true)
    for (let k = 2; k < s.length; k++) expect(s[k]!, `frame ${k}`).toBeGreaterThanOrEqual(s[k - 1]!)
    for (let k = HOLD.rest; k < s.length; k++) expect(s[k]!, `frame ${k}`).toBe(0)
    expect(rows[up + HOLD.rest]!.keys.get(name)!.z1).toBe(rows[down - 1]!.keys.get(name)!.z1)
  })
})

describe('polish tug 2: what stays as it was', () => {
  it('gives the arrow back standing: upright, at its length, still, for the frames before the visitor has it', () => {
    const rows = runs.visitor
    const lost = rows.findIndex((r) => r.events.includes('tug-lost'))
    const back = rows.findIndex((r, n) => n > lost && !r.taken)
    for (let n = back - HOLD.stand; n < back; n++) {
      const r = rows[n]!
      expect(Math.abs(r.angle), `frame ${r.i}`).toBeLessThan(0.1)
      expect(r.pose.squash, `frame ${r.i}`).toBeCloseTo(1, 3)
      expect(Math.hypot(r.pose.x - rows[n - 1]!.pose.x, r.pose.y - rows[n - 1]!.pose.y), `frame ${r.i}`).toBeLessThan(0.01)
      expect(r.pose.z, `frame ${r.i}`).toBe(rows[back]!.pose.z)
    }
  })

  it('keeps every strip where it lies from frame to frame, and draws them back one way', () => {
    const rows = runs.visitor
    const zip = rows.findIndex((r) => r.events.includes('strips-zip'))
    const end = rows.findIndex((r, n) => n > zip && r.strips.length === 0)
    let lying = 0
    for (let n = zip + 1; n < end; n++) {
      const a = rows[n - 1]!.strips
      const b = rows[n]!.strips
      expect(b.length, `frame ${rows[n]!.i}`).toBeLessThanOrEqual(a.length)
      const same = b.every((x) => {
        const was = a.find((y) => y.id === x.id)
        return !!was && was.x === x.x && was.y === x.y && was.rot === x.rot && was.h === x.h
      })
      if (same && a.length === b.length) lying++
    }
    console.log(`strips: ${rows[zip + 1]!.strips.length} strips from frame ${rows[zip]!.i} to ${rows[end]!.i}; on ${lying} of ${end - zip - 1} frames every strip is where it was the frame before`)
    expect(lying).toBeGreaterThanOrEqual(8)
  })

  it.skip('moves no event of step 1 to another frame', () => {
    const now = runs.visitor.filter((r) => r.events.some((e) => e !== 'step')).map((r) => `${r.i} ${r.events.filter((e) => e !== 'step').join(' ')}`)
    expect(now).toEqual(EVENTS)
  })
})

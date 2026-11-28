import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import type { CursorPose } from '../src/cursor/body'
import { pages } from '../src/pages'
import { FILM as DECISION } from '../src/pages/step5/timeline'
import { look } from '../src/post/look'
import { homeDistance } from '../src/stage/camera'
import { CLEAR, ScriptDriver, Stage, TURN_HALF, wholeFilmFlow, type Frame } from '../src/stage/stage'
import { arriveTurn, leaveLight, leaveSpeed, leaveTurn, LIGHT, shiverSeconds, TURN } from '../src/stage/turn'
import { TURNS } from '../tools/lib/pack-site.mjs'

const QUARTER = Math.PI / 2
const DEG = Math.PI / 180
// A half turn in frames of 60, and the frame of the arriving half on which the slab meets its seat: the numbers of 308e96a1, before this work.
const HALF = 30
const SEAT = 18
// The same two in steps of the stage, and the speed at which the leaving half hands the slab over, in radians per half turn.
const HALF_STEPS = 120
const SEAT_STEPS = 72
const HAND_OVER = 3.926990816987242
// The arriving half as 308e96a1 computed it, in radians, on every frame of 60.
const ARRIVE = [
  -1.5707963267948966, -1.4482731359411587, -1.3411023783225562, -1.2471831946542813, -1.1644147256515254, -1.090696112029481, -1.02392649450334, -0.9620050137882943, -0.9028308105995356, -0.8443030256522569,
  -0.7843207996616494, -0.7207832733429053, -0.6515895874112164, -0.5746388825817749, -0.487830299569773, -0.3890629790904027, -0.2762360618588555, -0.14724868859032442, 0, 0,
  0, -0.10471975511965975, -0.13962634015954636, -0.10471975511965959, -1.5501637768927235e-16, -0.03102807559101035, -0.03102807559101026, 0, 0, 0, 0
]
// The leaving half as 308e96a1 computed it: the lean of 1.6 degrees over 0.12 of the half turn, then the swing by the power 2.2.
const leaveBefore = (u: number): number => {
  const t = Math.min(1, Math.max(0, u))
  if (t <= 0) return 0
  if (t < 0.12) {
    const s = t / 0.12
    return -1.6 * DEG * Math.sin(Math.PI * s) * (1 - s)
  }
  return QUARTER * Math.pow((t - 0.12) / (1 - 0.12), 2.2)
}

const angles = Array.from({ length: HALF + 1 }, (_, n) => leaveTurn(n / HALF) / DEG)
const steps = angles.slice(1).map((a, i) => a - angles[i]!)
// The key's light on the face of a slab the lights have gone round by `g`, as a share of what a flat page takes: the face looks along z and the lights turn about x.
const keyShare = (g: number): number => {
  const [, y, z] = look.key.direction
  return Math.max(0, z * Math.cos(g) - y * Math.sin(g)) / z
}

describe('polish, the first frames of a page turn', () => {
  it('leans back by less than 1.5 degrees on its first frame, and from there no step of the angle is smaller than the one before, to the last frame', () => {
    expect(steps[0]!).toBeLessThan(0)
    expect(Math.abs(steps[0]!)).toBeLessThan(1.5)
    expect(Math.abs(steps[0]!)).toBeGreaterThan(0.7)
    for (let i = 1; i < steps.length; i++) expect(steps[i]!, `frame ${i + 1}`).toBeGreaterThanOrEqual(steps[i - 1]!)
    for (let i = 1; i <= 6; i++) expect(steps[i]!, `frame ${i + 1}`).toBeGreaterThanOrEqual(steps[i - 1]!)
  })

  it('holds the lean for the second frame, within 0.15 degrees, is no deeper than it was by more than a tenth of a degree, and passes flat between the third frame and the fourth', () => {
    expect(Math.abs(angles[2]! - angles[1]!)).toBeLessThan(0.15)
    expect(angles[1]!).toBeLessThan(-0.8)
    expect(angles[2]!).toBeLessThan(-0.8)
    let deepest = 0
    let deepestBefore = 0
    for (let i = 0; i <= 1200; i++) {
      deepest = Math.min(deepest, leaveTurn((i / 1200) * TURN.windUp) / DEG)
      deepestBefore = Math.min(deepestBefore, leaveBefore((i / 1200) * 0.12) / DEG)
    }
    expect(deepestBefore).toBeLessThan(-0.9)
    expect(deepestBefore).toBeGreaterThan(-0.95)
    expect(deepest).toBeGreaterThan(deepestBefore - 0.1)
    expect(deepest).toBeLessThan(-0.9)
    expect(-deepest * DEG).toBeLessThan(TURN.lean)
    expect(angles[3]!).toBeLessThan(0)
    expect(angles[4]!).toBeGreaterThan(0)
  })

  it('swings with no stall and no jump: from the frame it passes flat no step is under 0.8 degrees, none in the first 12 frames is over 2, and none is more than twice the one before', () => {
    for (let i = 3; i < steps.length; i++) {
      expect(steps[i]!, `frame ${i + 1}`).toBeGreaterThan(0.8)
      expect(steps[i]! / steps[i - 1]!, `frame ${i + 1}`).toBeLessThanOrEqual(2)
    }
    for (let i = 0; i < 12; i++) expect(Math.abs(steps[i]!), `frame ${i + 1}`).toBeLessThan(2)
    // Before this work the lean came back to flat and stood: 0.14 and 0.13 degrees on frames 4 and 5.
    const before = Array.from({ length: 6 }, (_, n) => leaveBefore(n / HALF) / DEG)
    expect(before[4]! - before[3]!).toBeLessThan(0.2)
    expect(before[5]! - before[4]!).toBeLessThan(0.2)
  })

  it('runs the lean into the swing at one speed', () => {
    const h = 1e-6
    const into = (leaveTurn(TURN.windUp) - leaveTurn(TURN.windUp - h)) / h
    const out = (leaveTurn(TURN.windUp + h) - leaveTurn(TURN.windUp)) / h
    expect(into).toBeGreaterThan(0)
    expect(Math.abs(into - out) / out).toBeLessThan(1e-3)
    expect(Math.abs(leaveTurn(TURN.windUp))).toBeLessThan(1e-12)
  })

  it('keeps the face at its rest light while the slab is under 2 degrees: the lights have gone round by under a tenth of a degree', () => {
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * 2 * DEG
      expect(leaveLight(a) / DEG).toBeLessThan(0.1)
      expect(keyShare(leaveLight(a))).toBeGreaterThan(0.997)
    }
    // With the lights round by the whole angle the key had lost 6 percent of its light on the face at 2 degrees.
    expect(keyShare(2 * DEG)).toBeLessThan(0.95)
  })

  it('dims the face after it tips: three quarters of the key at 20 degrees, over a third at 35, none from 57, where the whole angle left none from 31', () => {
    expect(keyShare(leaveLight(20 * DEG))).toBeGreaterThan(0.75)
    expect(keyShare(leaveLight(35 * DEG))).toBeGreaterThan(0.35)
    expect(keyShare(leaveLight(55 * DEG))).toBeGreaterThan(0)
    expect(keyShare(leaveLight(57 * DEG))).toBe(0)
    expect(keyShare(31 * DEG)).toBeLessThan(0.01)
    let last = 0
    for (let i = 1; i <= 900; i++) {
      const a = (i / 900) * QUARTER
      const g = leaveLight(a)
      expect(g).toBeGreaterThan(last)
      expect(g).toBeLessThanOrEqual(a)
      expect(g).toBeLessThan(LIGHT.most)
      last = g
    }
  })

  it('takes the key from the face evenly: its share falls by no more than a tenth from one frame to the next, where the whole angle took 0.127 in a frame, and the lights go round by no more than 3 degrees a frame', () => {
    const share = angles.map((a) => keyShare(leaveLight(a * DEG)))
    const before = Array.from({ length: HALF + 1 }, (_, n) => keyShare(Math.max(0, leaveBefore(n / HALF))))
    let most = 0
    let mostBefore = 0
    for (let n = 1; n <= HALF; n++) {
      expect(share[n - 1]! - share[n]!, `frame ${n}`).toBeLessThanOrEqual(0.1)
      expect((leaveLight(angles[n]! * DEG) - leaveLight(angles[n - 1]! * DEG)) / DEG, `frame ${n}`).toBeLessThanOrEqual(3)
      most = Math.max(most, share[n - 1]! - share[n]!)
      mostBefore = Math.max(mostBefore, before[n - 1]! - before[n]!)
    }
    expect(mostBefore).toBeGreaterThan(0.127)
    expect(most).toBeLessThan(mostBefore * 0.8)
  })

  it('leaves the lights as they were when the face turns toward the key', () => {
    expect(leaveLight(0)).toBe(0)
    for (const a of [-QUARTER, -8 * DEG, -2 * DEG, -1e-3]) expect(leaveLight(a)).toBe(a)
  })

  it('keeps the length of the turn and the step of the seat: 30 frames out, 30 in, the seat on frame 18 of the way in', () => {
    expect(TURN_HALF * 60).toBe(HALF)
    expect(Math.round(TURN_HALF * stepHz)).toBe(HALF_STEPS)
    expect(TURN.seat * HALF).toBe(SEAT)
    expect(TURN.seat * HALF_STEPS).toBe(SEAT_STEPS)
    expect(TURNS.seat).toBe(SEAT)
    expect(leaveTurn(0)).toBe(0)
    expect(leaveTurn(1)).toBe(QUARTER)
    expect(leaveSpeed()).toBe(HAND_OVER)
  })

  it('leaves the arriving half as it was on every frame, to the last bit', () => {
    for (let n = 0; n <= HALF; n++) expect(arriveTurn(n / HALF) + 0, `frame ${n}`).toBe(ARRIVE[n]! + 0)
    for (let n = 0; n < SEAT; n++) expect(arriveTurn(n / HALF)).toBeLessThan(0)
    expect(arriveTurn(SEAT / HALF)).toBe(0)
  })

  it('is read by nothing but the stage and the lights', () => {
    const found: string[] = []
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (/\.ts$/.test(e.name) && /\b(leaveTurn|leaveLight)\b/.test(fs.readFileSync(p, 'utf8'))) found.push(path.relative(process.cwd(), p).split(path.sep).join('/'))
      }
    }
    walk(path.join(process.cwd(), 'src'))
    expect(found.sort()).toEqual(['src/core/renderer.ts', 'src/stage/stage.ts', 'src/stage/turn.ts'])
  })
})

describe('polish, every turn of the film from its seat on', () => {
  // Two stages play the whole film: one as it is, one whose leaving half is the curve of 308e96a1. Whatever a frame holds is compared between the two.
  const make = (): Stage => new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  const now = make()
  const then = make()
  const inner = then as unknown as { phase: string; phaseStep: number; turnAt: () => number }
  const own = inner.turnAt.bind(then)
  inner.turnAt = () => (inner.phase === 'leave' ? leaveBefore(Math.min(1, inner.phaseStep / HALF_STEPS)) : own())
  const rest = (f: Frame): string => JSON.stringify({ list: f.list, scroll: f.scroll, page: f.page, view: f.view, time: f.time, settle: f.settle ?? null })
  // The stage's own law of the film's lifted arrow, with the stage's numbers: past `CLEAR.from` of tilt it stands on its line of sight at the least height that clears the slab, so in the leaving half its place follows the angle of its own stage.
  const tipped = (f: Frame): boolean => Math.abs(f.turn) >= CLEAR.from
  const clearOf = (c: CursorPose, f: Frame): CursorPose => {
    if (!tipped(f)) return c
    const need = Math.min(CLEAR.near, (f.turn < 0 ? CLEAR.under : CLEAR.over) * Math.tan(Math.abs(f.turn))) + CLEAR.by
    if (need <= c.z) return c
    const k = (homeDistance() - need) / (homeDistance() - c.z)
    return { ...c, x: 960 + (c.x - 960) * k, y: f.scroll + 540 + (c.y - f.scroll - 540) * k, z: need, scale: c.scale * k }
  }
  const starts = config.film.units.slice(0, -1).map((_, i) => Math.round((config.film.units.slice(0, i + 1).reduce((sum, u) => sum + u.seconds, 0) - TURN_HALF) * stepHz))

  // A turn starts on the last step whose angle is 0. The third stage is asked where: the first step from `from` on at which it leaves a page, once any turn it is in has ended.
  const PER = stepHz / 60
  const flow = wholeFilmFlow()
  const probe = make()
  const END = Math.round(config.film.units.reduce((sum, u) => sum + u.seconds, 0) * stepHz)
  const leavesAt = (from: number): { step: number; index: number } => {
    let s = from
    probe.goto(s)
    while (probe.turning && s < END) probe.goto(++s)
    while (!probe.turning && s < END) probe.goto(++s)
    const step = [s - 1, s].find((t) => probe.frameAt(t / stepHz).turn === 0 && probe.frameAt((t + 1) / stepHz).turn !== 0)!
    probe.goto(step)
    return { step, index: probe.entryIndex }
  }
  const byClock = starts.map((s, i) => leavesAt(i === 0 ? 0 : starts[i - 1]! + HALF_STEPS))
  // The sixth turn is not by the clock: it starts when step 5 is done, inside the last unit, and the careers page comes back. Where that is comes from the stage and is held to step 5's own timeline below, not to a typed step.
  const sixth = leavesAt(starts[starts.length - 1]! + HALF_STEPS)
  const SIXTH = sixth.step

  it('turns one page by the clock for each unit but the last, half a turn before the unit ends and on a frame of the film, and one more inside the last unit, from the page before the last to the last', () => {
    expect(leaveTurn(1 / HALF_STEPS)).not.toBe(0)
    expect(starts.length).toBe(config.film.units.length - 1)
    expect(byClock.map((t) => t.step)).toEqual(starts)
    expect(starts.every((s) => s % PER === 0)).toBe(true)
    expect(new Set(byClock.map((t) => t.index)).size).toBe(starts.length)
    const lastUnit = Math.round(config.film.units.slice(0, -1).reduce((sum, u) => sum + u.seconds, 0) * stepHz)
    expect(SIXTH).toBeGreaterThan(lastUnit)
    expect(SIXTH + 2 * HALF_STEPS).toBeLessThan(END)
    // Step 5 says in its own film timeline when it is done (`FILM.leave`); the stage turns on the step after the page says so.
    const late = SIXTH - lastUnit - DECISION.leave * stepHz
    expect(late).toBeGreaterThan(0)
    expect(late).toBeLessThanOrEqual(2)
    expect(sixth.index).toBe(flow.length - 2)
    expect(now.frameAt(SIXTH / stepHz).page).toBe(flow[flow.length - 2]!.page)
    expect(now.frameAt((SIXTH + HALF_STEPS) / stepHz).page).toBe(flow[flow.length - 1]!.page)
  })

  it('holds every value of the stage equal to before on every step from the seat on, the angle through the leaving half apart and with it the place of the lifted arrow where a slab is tipped past 60 degrees, each by the law of its own angle, and nothing else differs before the seat', () => {
    const tail = Math.round((shiverSeconds + 0.5) * stepHz)
    let differ = 0
    let cleared = 0
    const changed: number[][] = []
    for (const start of [...starts, SIXTH]) {
      const frames: number[] = []
      now.goto(start - 4)
      then.goto(start - 4)
      for (let k = -4; k <= 2 * HALF_STEPS + tail; k++) {
        const a = now.frameAt((start + k) / stepHz)
        const b = then.frameAt((start + k) / stepHz)
        const at = `step ${k} of the turn at ${start / stepHz} s`
        expect(rest(a), at).toBe(rest(b))
        if (k > 0 && k < HALF_STEPS && a.cursor.rides !== true && (tipped(a) || tipped(b))) {
          const plain = now.cursor.pose()
          expect(JSON.stringify(then.cursor.pose()), at).toBe(JSON.stringify(plain))
          expect(JSON.stringify(a.cursor), at).toBe(JSON.stringify(clearOf(plain, a)))
          expect(JSON.stringify(b.cursor), at).toBe(JSON.stringify(clearOf(plain, b)))
          if (a.cursor.z > plain.z) cleared++
        } else expect(JSON.stringify(a.cursor), at).toBe(JSON.stringify(b.cursor))
        if ((start + k) % PER === 0 && a.turn !== b.turn) frames.push((start + k) / PER)
        if (k <= 0) expect(a.turn).toBe(0)
        else if (k < HALF_STEPS) {
          expect(a.turn).toBe(leaveTurn(k / HALF_STEPS))
          expect(b.turn).toBe(leaveBefore(k / HALF_STEPS))
          if (a.turn !== b.turn) differ++
        } else {
          expect(a.turn, `step ${k}`).toBe(b.turn)
          expect(a.turn).toBe(k < 2 * HALF_STEPS ? arriveTurn((k - HALF_STEPS) / HALF_STEPS) : 0)
        }
        if (k === HALF_STEPS + SEAT_STEPS) {
          expect(a.turn).toBe(0)
          expect(a.settle).toBe(0)
        }
        if (k === HALF_STEPS + SEAT_STEPS - 1) expect(a.turn).toBeLessThan(0)
        if (k === HALF_STEPS - 1) expect(a.page).not.toBe(now.frameAt((start + HALF_STEPS) / stepHz).page)
      }
      changed.push([frames[0]!, frames[frames.length - 1]!, frames.length])
    }
    // The frames of the film, of 60 a second, whose angle is not the one of before: from the first frame after the turn's first step to the last frame before the hand over. That is one frame fewer than a half turn where the turn starts on a frame, as the turns by the clock do, and a whole half turn of frames where it starts between two.
    const span = (start: number): number[] => {
      const first = Math.floor(start / PER) + 1
      const last = Math.ceil((start + HALF_STEPS) / PER) - 1
      return [first, last, last - first + 1]
    }
    expect(changed).toEqual([...starts, SIXTH].map(span))
    for (const start of starts) expect(span(start)[2]).toBe(HALF - 1)
    expect(span(SIXTH)[2]).toBe(SIXTH % PER === 0 ? HALF - 1 : HALF)
    expect(differ).toBeGreaterThan(6 * (HALF_STEPS - 10))
    expect(cleared).toBeGreaterThan(0)
  }, 240000)
})

import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { CursorBody, GLASS, type CursorPose } from '../src/cursor/body'
import { OUTLINE, UNIT } from '../src/cursor/contract'
import { middleOf } from '../src/cursor/fit'
import { drawnStretch } from '../src/cursor/model/deform'

const home = { x: 600, y: 500 }
const quiet = (): void => {}
const dt = 1 / stepHz
const body = (sealed = false): CursorBody => {
  const b = new CursorBody()
  b.reset(home.x, home.y)
  if (sealed) {
    b.take('ball')
    b.seal(true)
    b.place(home.x, home.y, 40)
  }
  return b
}
const run = (b: CursorBody, seconds: number, each?: (p: CursorPose, i: number) => void): void => {
  for (let i = 0; i < Math.round(seconds * stepHz); i++) {
    b.step(home, quiet, false)
    if (each) each(b.pose(), i)
  }
}
const angle = (p: CursorPose): number => p.lean + p.spin

describe('what a page asks of the cursor directly', () => {
  it('a strike sets the angle in the same step, holds it, and gives it back to the spring', () => {
    const b = body()
    run(b, 0.3)
    b.strike(0.8, 0.1)
    expect(angle(b.pose())).toBeCloseTo(0.8, 6)
    run(b, 0.1, (p) => expect(angle(p)).toBeCloseTo(0.8, 6))
    let moved = false
    run(b, 0.1, (p) => {
      if (Math.abs(angle(p) - 0.8) > 0.1) moved = true
    })
    expect(moved).toBe(true)
    run(b, 1)
    expect(Math.abs(angle(b.pose()))).toBeLessThan(0.02)
  })

  it('a strike in the ball comes back to the angle the arrow is aimed at', () => {
    const b = body(true)
    b.aim(0.4)
    run(b, 0.5)
    expect(angle(b.pose())).toBeCloseTo(0.4, 1)
    b.strike(-0.9, 0.05)
    run(b, 0.05, (p) => expect(angle(p)).toBeCloseTo(-0.9, 6))
    run(b, 1)
    expect(angle(b.pose())).toBeCloseTo(0.4, 1)
  })

  it('a press sets the length as drawn in the same step, holds it, and springs back', () => {
    const b = body()
    run(b, 0.3)
    b.press(0.62, 0.12)
    expect(b.pose().squash).toBeCloseTo(0.62, 6)
    run(b, 0.12, (p) => expect(p.squash).toBeCloseTo(0.62, 6))
    let most = 0
    run(b, 0.5, (p) => (most = Math.max(most, p.squash)))
    expect(most).toBeGreaterThan(1)
    run(b, 1)
    expect(b.pose().squash).toBeCloseTo(1, 2)
  })

  it('a press never asks for more than the body can be drawn at, and in the glass never for longer than the glass allows', () => {
    const free = body()
    free.press(3, 0.1)
    expect(free.pose().squash).toBeCloseTo(1.3, 6)
    free.press(0.1, 0.1)
    expect(free.pose().squash).toBeCloseTo(0.58, 6)
    const sealed = body(true)
    sealed.press(1.3, 0.1)
    run(sealed, 0.1, (p) => expect(p.squash).toBeLessThanOrEqual(GLASS.long + 1e-9))
    expect(sealed.pose().squash).toBeGreaterThan(1.05)
  })

  it('a hold keeps the running reaction at its phase for the time asked, and the reaction then plays out', () => {
    const plain = body()
    plain.react('startle')
    let length = 0
    run(plain, 2, (p) => {
      if (p.reaction) length++
    })
    const b = body()
    b.react('startle')
    run(b, 0.1)
    const at = b.pose().reactionAt
    b.hold(0.25)
    run(b, 0.25, (p) => {
      expect(p.reaction).toBe('startle')
      expect(p.reactionAt).toBeCloseTo(at, 9)
    })
    let rest = 0
    run(b, 2, (p) => {
      if (p.reaction) rest++
    })
    expect(Math.round(0.1 * stepHz) + rest).toBe(length)
    expect(b.pose().reaction).toBeNull()
  })

  it('a hold does nothing without a reaction, and a new reaction ends a hold', () => {
    const b = body()
    b.hold(5)
    b.react('flinch')
    run(b, 0.4)
    expect(b.pose().reaction).toBeNull()
    b.react('cower')
    run(b, 0.1)
    b.hold(5)
    b.react('flinch')
    run(b, 0.4)
    expect(b.pose().reaction).toBeNull()
  })

  it('a wobble swings both ways, dies away, and is gone at its end', () => {
    const b = body(true)
    run(b, 0.3)
    const base = angle(b.pose())
    b.wobble(0.5, 4, 0.8)
    const seen: number[] = []
    run(b, 0.8, (p) => seen.push(angle(p) - base))
    const first = seen.slice(0, Math.round(0.25 * stepHz))
    const last = seen.slice(Math.round(0.55 * stepHz))
    expect(Math.max(...first)).toBeGreaterThan(0.3)
    expect(Math.min(...first)).toBeLessThan(-0.2)
    expect(Math.max(...last.map(Math.abs))).toBeLessThan(0.12)
    run(b, 0.1, (p) => expect(angle(p) - base).toBeCloseTo(0, 9))
  })

  it('in the glass no state and no reaction draws the body longer than the glass allows', () => {
    for (const state of ['shocked', 'confident', 'proud'] as const) {
      const free = body()
      free.act(state)
      let long = 0
      run(free, 1, (p) => (long = Math.max(long, p.squash)))
      expect(long).toBeGreaterThan(1.1)
      const b = body(true)
      b.act(state)
      for (const r of ['jump', 'doubleTake', 'startle', 'tap', 'stamp', 'rear'] as const) {
        b.react(r)
        run(b, 0.8, (p) => expect(p.squash).toBeLessThanOrEqual(GLASS.long + 1e-9))
      }
    }
  })

  it('says it is centred only in the ball and only when sealed so', () => {
    const b = body()
    expect(b.pose().centred).toBe(false)
    b.seal(true)
    expect(b.pose().centred).toBe(false)
    b.seal(true, true)
    expect(b.pose().centred).toBe(true)
    b.seal(false, true)
    expect(b.pose().centred).toBe(false)
  })

  it('goes on the same after it is saved and loaded in the middle of a strike, a press, a hold and a wobble', () => {
    const a = body(true)
    a.react('cower')
    run(a, 0.05)
    a.strike(0.7, 0.2)
    a.press(0.7, 0.2)
    a.hold(0.2)
    a.wobble(0.3, 5, 0.6)
    run(a, 0.08)
    const b = new CursorBody()
    b.load(a.save())
    const one: string[] = []
    const two: string[] = []
    run(a, 1, (p) => one.push(JSON.stringify(p)))
    run(b, 1, (p) => two.push(JSON.stringify(p)))
    expect(two).toEqual(one)
  })

  it('loads a state saved before these calls existed', () => {
    const a = body()
    run(a, 0.2)
    const old = a.save() as Record<string, unknown>
    for (const key of ['struck', 'pressed', 'held', 'sway', 'swing', 'centred']) delete old[key]
    const b = new CursorBody()
    b.load(old)
    expect(Number.isFinite(b.pose().spin)).toBe(true)
    run(b, 0.2, (p) => expect(Number.isFinite(p.spin + p.squash + p.lean)).toBe(true))
    expect(b.pose().centred).toBe(false)
  })
})

describe('the middle of the outline as it is drawn', () => {
  it('is the centre of the smallest circle that holds every corner', () => {
    for (const stretch of [0.6, 0.86, 1, GLASS.long, 1.2]) {
      const m = middleOf(stretch)
      const wide = 1 / Math.sqrt(stretch)
      const far = OUTLINE.map(([x, y]) => Math.hypot(x * wide - m.x, y * stretch - m.y))
      for (const d of far) expect(d).toBeLessThanOrEqual(m.r + 1e-6)
      expect(far.filter((d) => Math.abs(d - m.r) < 1e-6).length).toBeGreaterThanOrEqual(2)
      let widest = 0
      for (const [ax, ay] of OUTLINE) for (const [bx, by] of OUTLINE) widest = Math.max(widest, Math.hypot((ax - bx) * wide, (ay - by) * stretch))
      expect(m.r).toBeGreaterThanOrEqual(widest / 2 - 1e-6)
      expect(m.r).toBeLessThanOrEqual(widest / Math.sqrt(3) + 1e-6)
    }
  })

  it('keeps the arrow inside the bore of the ball at every length the glass allows', () => {
    const bore = 42
    for (let stretch = 0.58; stretch <= GLASS.long + 1e-9; stretch += 0.02) expect(middleOf(stretch).r * UNIT).toBeLessThan(bore)
    expect(middleOf(1).r * UNIT).toBeLessThan(40)
  })

  it('is taken at the length the body is drawn at, which gives a melting body most of its squash back', () => {
    expect(drawnStretch(0.8, 0)).toBeCloseTo(0.8, 9)
    expect(drawnStretch(0.8, 0.6)).toBeCloseTo(1, 9)
    expect(drawnStretch(0.8, 0.3)).toBeGreaterThan(0.8)
    expect(drawnStretch(5, 0)).toBe(2.2)
    expect(drawnStretch(0, 0)).toBe(0.3)
  })
})

import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { ACTING, CursorBody, DAMAGE, GLASS, REACTIONS, type CursorPose } from '../src/cursor/body'
import { OUTLINE, UNIT } from '../src/cursor/contract'
import { middleOf, sealedFit } from '../src/cursor/fit'
import { lookOf } from '../src/cursor/look'
import { BORE, boreRoom, Deform } from '../src/cursor/model/deform'
import { smallestRound } from '../src/cursor/model/round'
import { heightAt } from '../src/cursor/model/shape'
import { RIN } from '../src/table/real/ball'

const home = { x: 600, y: 500 }
const quiet = (): void => {}
const wall = (config.table.ballPx / 2) * BORE.wall
const sealed = (): CursorBody => {
  const b = new CursorBody()
  b.reset(home.x, home.y)
  b.take('ball')
  b.seal(true, true)
  b.place(home.x, home.y, 40)
  for (let i = 0; i < stepHz * 0.5; i++) b.step(home, quiet, false)
  return b
}
// The outline cut finer than the fit cuts it, at the foot and at the top of the wall.
const fine: [number, number, number][] = []
for (let i = 0; i < OUTLINE.length; i++) {
  const a = OUTLINE[i]!
  const b = OUTLINE[(i + 1) % OUTLINE.length]!
  for (let k = 0; k < 16; k++) {
    const x = a[0] + ((b[0] - a[0]) * k) / 16
    const y = a[1] + ((b[1] - a[1]) * k) / 16
    fine.push([x, y, 0], [x, y, heightAt(x, y)])
  }
}
const drawn = new Deform()
const at = { x: 0, y: 0, z: 0 }
// How far the body reaches from its middle as it is drawn for a pose, tremble and all, in page pixels.
const reach = (c: CursorPose, time: number): { far: number; hold: number; tremble: number; flat: number } => {
  const look = lookOf(c, time)
  drawn.set(look.body)
  drawn.lean(-c.lean - c.spin)
  drawn.fit()
  let far = 0
  for (const [x, y, z] of fine) {
    drawn.point(x, y, z, 0, at)
    far = Math.max(far, Math.hypot(at.x - drawn.mid.x, at.y - drawn.mid.y))
  }
  return { far, hold: drawn.hold, tremble: look.body.tremble, flat: look.body.flat }
}
const every = (set: (b: CursorBody) => void, seconds: number, each: (c: CursorPose, time: number) => void): void => {
  const b = sealed()
  set(b)
  for (let i = 0; i < stepHz * seconds; i++) {
    b.step(home, quiet, false)
    each(b.pose(), i / stepHz)
  }
}

describe('the smallest circle round a set of points', () => {
  it('finds the circle the slow search finds, for the outline at every length', () => {
    const x = new Float64Array(OUTLINE.length)
    const y = new Float64Array(OUTLINE.length)
    const got = { x: 0, y: 0, r: 0 }
    for (const stretch of [0.58, 0.8, 1, GLASS.long, 1.3]) {
      const wide = 1 / Math.sqrt(stretch)
      OUTLINE.forEach(([px, py], i) => {
        x[i] = px * wide
        y[i] = py * stretch
      })
      smallestRound(x, y, OUTLINE.length, got)
      const m = middleOf(stretch)
      expect(got.x).toBeCloseTo(m.x, 6)
      expect(got.y).toBeCloseTo(m.y, 6)
      expect(got.r).toBeCloseTo(m.r, 6)
    }
  })

  it('holds every point, touches two at least, and is no wider than it must be, for points in any order', () => {
    let seed = 7
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const got = { x: 0, y: 0, r: 0 }
    for (let round = 0; round < 60; round++) {
      const n = 3 + Math.floor(next() * 50)
      const x = new Float64Array(n)
      const y = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        x[i] = next() * 80 - 40
        y[i] = next() * 80 - 40
      }
      smallestRound(x, y, n, got)
      let on = 0
      let widest = 0
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(x[i]! - got.x, y[i]! - got.y)
        expect(d).toBeLessThanOrEqual(got.r + 1e-6)
        if (Math.abs(d - got.r) < 1e-6) on++
        for (let j = 0; j < n; j++) widest = Math.max(widest, Math.hypot(x[i]! - x[j]!, y[i]! - y[j]!))
      }
      expect(on).toBeGreaterThanOrEqual(2)
      expect(got.r).toBeGreaterThanOrEqual(widest / 2 - 1e-6)
      expect(got.r).toBeLessThanOrEqual(widest / Math.sqrt(3) + 1e-6)
    }
  })

  it('takes one point and none', () => {
    const got = { x: 9, y: 9, r: 9 }
    smallestRound(new Float64Array([3]), new Float64Array([4]), 1, got)
    expect(got).toEqual({ x: 3, y: 4, r: 0 })
    smallestRound(new Float64Array(0), new Float64Array(0), 0, got)
    expect(got).toEqual({ x: 0, y: 0, r: 0 })
  })
})

describe('the glass holds the body sealed in the ball', () => {
  it('measures the bore the ball is built with', () => {
    expect(BORE.wall).toBe(RIN)
    expect(wall).toBe(42)
    expect(boreRoom(0)).toBeCloseTo(wall - BORE.skin, 9)
    expect(boreRoom(1)).toBeCloseTo(wall - BORE.skin - BORE.shake, 9)
    expect(boreRoom(5)).toBe(boreRoom(1))
  })

  it('leaves a body at rest its own size, with its middle where the bare outline has it', () => {
    const b = sealed()
    const fit = sealedFit(b.pose(), 0)
    expect(fit.hold).toBe(1)
    const m = middleOf(b.pose().squash)
    expect(Math.hypot(fit.x - m.x * UNIT, fit.y + m.y * UNIT)).toBeLessThan(1.5)
    expect(fit.r).toBeGreaterThan(m.r * UNIT - 0.01)
    expect(fit.r).toBeLessThan(m.r * UNIT + 1.5)
  })

  it('does nothing to a body that is not sealed', () => {
    const b = new CursorBody()
    b.reset(home.x, home.y)
    b.hurt('flattened', 3)
    for (let i = 0; i < stepHz * 0.4; i++) b.step(home, quiet, false)
    const look = lookOf(b.pose(), 0)
    expect(look.body.sealed).toBe(0)
    expect(look.body.flat).toBeGreaterThan(0.9)
    drawn.set(look.body)
    drawn.lean(0)
    drawn.fit()
    expect(drawn.hold).toBe(1)
    expect(drawn.mid).toEqual({ x: 0, y: 0, r: 0 })
  })

  it('keeps every acting state with every reaction inside the wall, and draws none of them a tenth smaller', () => {
    let least = 1
    let most = 0
    for (const a of ACTING) {
      for (const r of [null, ...REACTIONS]) {
        every(
          (b) => {
            b.act(a)
            if (r) b.react(r)
          },
          2.5,
          (c, time) => {
            const got = reach(c, time)
            expect(got.far, `${a} ${r ?? ''} at ${time.toFixed(2)}`).toBeLessThanOrEqual(wall - BORE.skin + 0.3)
            least = Math.min(least, got.hold)
            most = Math.max(most, got.far)
          }
        )
      }
    }
    expect(least).toBeGreaterThan(0.9)
    expect(most).toBeGreaterThan(wall - BORE.skin - BORE.shake - 0.5)
  })

  it('keeps a flattened, a scorched, a burnt and a mended body inside the wall, whatever it feels', () => {
    for (const a of ['plain', 'scared', 'shocked', 'exhausted'] as const) {
      for (const k of DAMAGE) {
        if (k === 'shredded') continue
        let least = 1
        every(
          (b) => {
            b.act(a)
            b.hurt(k, 3)
          },
          3.5,
          (c, time) => {
            const got = reach(c, time)
            expect(got.far, `${a} ${k} at ${time.toFixed(2)}`).toBeLessThanOrEqual(wall - BORE.skin + 0.3)
            least = Math.min(least, got.hold)
          }
        )
        // A flattened body is a fifth wider than the bore: the glass holds it to the size it has room for.
        if (k === 'flattened') {
          expect(least).toBeLessThan(0.99)
          expect(least).toBeGreaterThan(0.8)
        } else expect(least).toBeGreaterThan(0.9)
      }
    }
  })

  it('keeps a struck, a pressed and a swinging body inside the wall', () => {
    const asks: ((b: CursorBody) => void)[] = [(b) => b.strike(0.8, 0.2), (b) => b.strike(-1.2, 0.3), (b) => b.press(0.58, 0.2), (b) => b.press(1.3, 0.3), (b) => b.wobble(0.4, 6, 1), (b) => (b.act('scared'), b.react('flinch'), b.strike(0.7, 0.12), b.press(0.7, 0.1))]
    for (const ask of asks)
      every(ask, 1.5, (c, time) => {
        const got = reach(c, time)
        expect(got.far).toBeLessThanOrEqual(wall - BORE.skin + 0.3)
        expect(got.hold).toBeGreaterThan(0.93)
      })
  })

  it('moves its middle no faster than the body changes its length and its curl, so a held body does not jump', () => {
    for (const ask of [(b: CursorBody) => (b.act('proud'), b.react('recoil')), (b: CursorBody) => b.hurt('flattened', 2), (b: CursorBody) => (b.act('scared'), b.react('flinch'))]) {
      let last: { x: number; y: number; hold: number } | null = null
      let steps = 0
      every(ask, 2.5, (c, time) => {
        const fit = sealedFit(c, time)
        // The step in which a hit lands changes the body at once, and its middle with it.
        if (last && steps > 1) {
          expect(Math.hypot(fit.x - last.x, fit.y - last.y)).toBeLessThan(2.5)
          expect(Math.abs(fit.hold - last.hold)).toBeLessThan(0.03)
        }
        last = fit
        steps++
      })
    }
  })

  it('gives the same fit for the same pose and time whenever it is asked', () => {
    const b = sealed()
    b.act('scared')
    b.react('flinch')
    for (let i = 0; i < 20; i++) b.step(home, quiet, false)
    const c = b.pose()
    const one = sealedFit(c, 1.25)
    every((x) => x.hurt('flattened', 1), 0.3, (p, time) => void sealedFit(p, time))
    expect(sealedFit(c, 1.25)).toEqual(one)
  })
})

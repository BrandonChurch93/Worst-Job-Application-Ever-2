import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { CursorBody } from '../src/cursor/body'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const quiet = (): void => {}
const sealed = (): CursorBody => {
  const b = new CursorBody()
  b.reset(600, 500)
  b.seal(true)
  b.turn({ x: 0.3, y: -0.4, z: 0.86, back: 10 })
  return b
}
const ride = (b: CursorBody, seconds: number, each?: () => void): void => {
  for (let i = 0; i < Math.round(seconds * stepHz); i++) {
    b.step({ x: 600 + 3 * i, y: 500 - 2 * i }, quiet, false)
    if (each) each()
  }
}

describe('the cursor in the ball', () => {
  it('does not roll while no roll is asked for', () => {
    const b = sealed()
    let far = 0
    ride(b, 2, () => (far = Math.max(far, Math.abs(b.pose().spin))))
    expect(far).toBe(0)
  })

  it('rolls to the asked turn and comes back to zero when it is let go', () => {
    const b = sealed()
    b.aim(2.2)
    ride(b, 1)
    const p = b.pose()
    expect(p.spin + p.lean).toBeGreaterThan(1.9)
    expect(p.spin + p.lean).toBeLessThan(2.5)
    b.aim(null)
    ride(b, 2)
    expect(b.pose().spin).toBe(0)
  })

  it('takes a roll at once, and lets it go at once', () => {
    const b = sealed()
    ride(b, 0.5)
    b.aim(1.2)
    expect(Math.abs(b.pose().spin - 1.2)).toBeLessThan(0.4)
    ride(b, 0.5)
    b.aim(null)
    expect(b.pose().spin).toBe(0)
  })
})

describe('the cursor out of the ball', () => {
  it('is not moved by the asking itself', () => {
    const b = new CursorBody()
    b.reset(600, 500)
    ride(b, 0.5)
    const before = b.pose().spin
    b.aim(1.2)
    expect(b.pose().spin).toBe(before)
    ride(b, 1)
    b.aim(null)
    expect(Math.abs(b.pose().spin)).toBeGreaterThan(0.3)
  })
})

describe('the rail shot of the film', () => {
  it('has the roll set on its first frame and gone on the first frame after it', () => {
    const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    const rolls: [number, number][] = []
    while (stage.time < 32.5 && !stage.finished) {
      stage.advance(1)
      if (stage.time > 30.9) rolls.push([stage.time, stage.cursor.pose().spin])
    }
    const first = rolls.findIndex(([, r]) => r !== 0)
    expect(first).toBeGreaterThan(0)
    expect(Math.abs(rolls[first]![0] - 31.15)).toBeLessThan(0.03)
    expect(Math.abs(rolls[first]![1])).toBeGreaterThan(0.5)
    const last = rolls.findIndex(([t]) => t >= 32.3 + 0.02)
    expect(rolls[last]![1]).toBe(0)
    const inShot = rolls.filter(([t]) => t > 31.2 && t < 32.25)
    expect(inShot.every(([, r]) => r !== 0)).toBe(true)
    expect(rolls.filter(([t]) => t > 32.32).every(([, r]) => r === 0)).toBe(true)
  })
})

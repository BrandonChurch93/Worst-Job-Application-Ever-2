import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { CursorBody } from '../src/cursor/body'

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
})

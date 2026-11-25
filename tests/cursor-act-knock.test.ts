import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { CursorBody, type CursorPose } from '../src/cursor/body'

const home = { x: 600, y: 500 }
const quiet = (): void => {}
const body = (): CursorBody => {
  const b = new CursorBody()
  b.reset(home.x, home.y)
  return b
}
const run = (b: CursorBody, seconds: number, each?: (p: CursorPose) => void): void => {
  for (let i = 0; i < Math.round(seconds * stepHz); i++) {
    b.step(home, quiet, false)
    if (each) each(b.pose())
  }
}
const struck = (vx: number): CursorBody => {
  const b = body()
  run(b, 0.2)
  b.hurt('burn')
  b.knock(vx, 0, 380)
  b.react('recoil')
  return b
}

describe('a hit knocks the cursor over', () => {
  it('past upright onto its other shoulder within 0.12 s, the way the bolt was going', () => {
    const right = struck(900)
    run(right, 0.11)
    expect(right.pose().spin).toBeGreaterThan(0.9)
    expect(right.pose().spin).toBeLessThan(1.4)
    const left = struck(-900)
    run(left, 0.11)
    expect(left.pose().spin).toBeLessThan(-0.9)
  })

  it('swings back and stands exactly as before', () => {
    const b = struck(900)
    let far = 0
    run(b, 3, (p) => {
      far = Math.max(far, Math.abs(p.spin))
    })
    expect(far).toBeLessThan(1.4)
    expect(b.pose().spin).toBe(0)
  })

  it('no other reaction turns the body over', () => {
    for (const name of ['anticipate', 'flinch', 'doubleTake', 'dustOff', 'jump'] as const) {
      const b = body()
      run(b, 0.2)
      b.react(name)
      run(b, 1.2, (p) => expect(p.spin).toBe(0))
    }
  })

  it('is the same after a save and a load in the middle of the fall', () => {
    const a = struck(900)
    run(a, 0.08)
    const b = body()
    b.load(a.save())
    run(a, 0.5)
    run(b, 0.5)
    expect(b.pose()).toEqual(a.pose())
  })
})

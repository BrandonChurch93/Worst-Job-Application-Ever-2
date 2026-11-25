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
  it('the way the bolt was going within 0.06 s, and holds laid back that way', () => {
    const right = struck(900)
    run(right, 0.05)
    expect(right.pose().spin).toBeGreaterThan(0.2)
    expect(right.pose().spin).toBeLessThan(1.1)
    run(right, 0.25)
    expect(right.pose().lean + right.pose().spin).toBeGreaterThan(0.3)
    const left = struck(-900)
    run(left, 0.05)
    expect(left.pose().spin).toBeLessThan(-0.2)
    run(left, 0.25)
    expect(left.pose().lean + left.pose().spin).toBeLessThan(-0.4)
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
    for (const name of ['dustOff', 'jump'] as const) {
      const b = body()
      run(b, 0.2)
      b.react(name)
      run(b, 1.2, (p) => expect(p.spin).toBe(0))
    }
  })

  it('thrown up and to the right it turns its tip the way it flies, and lands straight', () => {
    const b = body()
    run(b, 0.2)
    b.knock(0, 0, 380)
    let far = 0
    for (let i = 0; i < Math.round(0.25 * stepHz); i++) {
      b.step({ x: home.x + 160, y: home.y - 110 }, quiet, false)
      far = Math.max(far, b.pose().spin)
    }
    expect(far).toBeGreaterThan(0.4)
    expect(far).toBeLessThan(1.3)
    run(b, 3)
    expect(b.pose().spin).toBe(0)
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

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'
import { TH, TIER_Y, railOf, tierAt } from '../src/table/layout'
import { Machine, prepare } from '../src/table/physics'

// The view's follow while the ball rides an outlane rail to the way out of a tier: the rail dips under the next tier's line and comes up over it again at its end, and the view's goal must not go back up a tier there. Stepped, no browser.
// The visitor is the hand that follows the page's hint a little late (pipeline/phase5/polish-save2-jerks.mjs, pack seed 1; since the long fight at the port it reads the hint one step earlier, seed 2): it loses the ball down the office's left outlane 24.4 s into the page, with the office's gate spent.
const HAND = 1500 / stepHz
const hand = (): Driver => {
  const d = { x: 960, y: 540, queue: [] as ({ x: number; y: number; left: boolean; right: boolean } | null)[], left: false, right: false, goal: null as { x: number; y: number } | null }
  return {
    name: 'mouse' as const,
    input: (v: DriverView): Pointer => {
      if ((v.step + 1) % 4 === 0) {
        const h = v.turning ? null : v.page.hint()
        d.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
        const seen = d.queue.length > 11 ? d.queue.shift() : null
        if (seen) {
          d.goal = seen
          d.left = seen.left
          d.right = seen.right
        }
      }
      if (d.goal) {
        const dx = d.goal.x - d.x
        const dy = d.goal.y - d.y
        const far = Math.hypot(dx, dy)
        if (far <= HAND) {
          d.x = d.goal.x
          d.y = d.goal.y
        } else {
          d.x += (dx / far) * HAND
          d.y += (dy / far) * HAND
        }
      }
      return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right } as Pointer
    }
  }
}

describe('the view while the ball rides an outlane rail', () => {
  let mc: Machine | null = null
  const step = Machine.prototype.step
  interface Step { scroll: number; rail: string; y: number; t: number }
  const out: Step[] = []
  beforeAll(async () => {
    await prepare()
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      return step.call(this, l, r)
    }
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: hand(), seed: 2 })
    while (stage.entryIndex === 0 && stage.pageTime < 25.4) {
      stage.advance(1)
      const m = mc as Machine | null
      if (!m) continue
      const b = m.balls[0]!
      out.push({ scroll: stage.page.scroll(), rail: b.mode === 'rail' ? b.rail : '', y: b.y, t: stage.pageTime })
    }
  })
  afterAll(() => {
    Machine.prototype.step = step
  })

  it('has the rail dip under the next tier\'s line and end above it, on both sides of the two upper tiers', () => {
    for (const k of [0, 1]) for (const side of ['left', 'right']) {
      const p = railOf(`outlane.${['corporate', 'office'][k]}.${side}`).points
      expect(tierAt(p[1]![1])).toBe(k + 1)
      expect(tierAt(p[p.length - 1]![1])).toBe(k)
      expect(p[1]![1] - TIER_Y[k]! - TH).toBeGreaterThan(0)
    }
  })

  it('never steps the view back up while the ball rides the office\'s outlane down to the chute, nor in the 0.4 s after: the goal stays the tier below once the ball has dipped under its line', () => {
    const first = out.findIndex((s) => s.rail === 'outlane.office.left' && s.t > 24)
    expect(first).toBeGreaterThan(0)
    let last = first
    while (out[last + 1]!.rail === 'outlane.office.left') last++
    expect(last - first).toBeGreaterThan(100)
    expect(out[last]!.y).toBeLessThan(TIER_Y[2]!)
    expect(out[last + 1]!.rail).toBe('chute.office')
    const under = out.slice(first, last + 1).findIndex((s) => s.y >= TIER_Y[2]!)
    expect(under).toBeGreaterThan(0)
    let back = 0
    for (let i = first + under + 1; i <= last + 0.4 * stepHz; i++) back = Math.min(back, out[i]!.scroll - out[i - 1]!.scroll)
    expect(back).toBe(0)
    expect(out[Math.round(last + 0.4 * stepHz)]!.scroll - out[first + under]!.scroll).toBeGreaterThan(200)
  })
})

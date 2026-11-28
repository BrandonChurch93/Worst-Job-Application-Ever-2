import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'
import { Machine, prepare } from '../src/table/physics'
import { bridge } from '../src/pages/step3/video/bridge'

bridge.off = true

// The view's follow while the ball rides an upper outlane rail to a gate that is still shut: the ball will be taken on its own tier, so the view's goal stays on that tier for the whole ride and the view does not run down a tier and back. When the scene's clock opens the gate under the ride, the goal goes down from that step. Stepped, no browser.
// The first visitor is the hand that follows the page's hint a little late (pipeline/phase5/polish-save2-shut.mjs, seed 4; since the long fight at the port seed 1): it loses the ball down the office's left outlane 22.53 s into the page, with the office's gate shut. The second never moves, and the ride is forced on the lobby's left outlane 60 steps before the lobby's gate opens.
const HAND = 1500 / stepHz
const hand = (seed: number): Driver => {
  const d = { x: 960, y: 540, queue: [] as ({ x: number; y: number; left: boolean; right: boolean } | null)[], left: false, right: false, goal: null as { x: number; y: number } | null }
  return {
    name: 'mouse' as const,
    input: (v: DriverView): Pointer => {
      if ((v.step + seed - 1) % 4 === 0) {
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
const still: Driver = { name: 'bot' as const, input: (): Pointer => ({ x: 300, y: 900, down: false }) as Pointer }

describe('the view while the ball rides an upper outlane rail to a shut gate', () => {
  let mc: Machine | null = null
  const machine = (): Machine => mc as Machine
  const step = Machine.prototype.step
  interface Step { scroll: number; rail: string; shut: boolean; taken: boolean }
  const read = (stage: Stage, k: number): Step => {
    const b = machine().balls[0]!
    return { scroll: stage.page.scroll(), rail: b.mode === 'rail' ? b.rail : '', shut: !machine().gate[k], taken: machine().taken >= 0 }
  }
  beforeAll(async () => {
    await prepare()
    Machine.prototype.step = function (this: Machine, l: boolean, r: boolean) {
      mc = this
      return step.call(this, l, r)
    }
  })
  afterAll(() => {
    Machine.prototype.step = step
  })

  it('stands on the office while the ball rides the office\'s outlane to the shut gate, and then only goes into the room under the gate', () => {
    mc = null
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: hand(1), seed: 1 })
    const out: Step[] = []
    while (stage.entryIndex === 0 && stage.pageTime < 23.9) {
      stage.advance(1)
      if (mc) out.push(read(stage, 1))
    }
    const first = out.findIndex((s, i) => s.rail === 'outlane.office.left' && i > 22 * stepHz - 1500)
    expect(first).toBeGreaterThan(0)
    let last = first
    while (out[last + 1]!.rail === 'outlane.office.left') last++
    expect(last - first).toBeGreaterThan(100)
    expect(out.slice(first, last + 1).every((s) => s.shut)).toBe(true)
    expect(out[last + 1]!.taken).toBe(true)
    const from = out[first - 1]!.scroll
    for (let i = first; i <= last; i++) expect(Math.abs(out[i]!.scroll - from)).toBeLessThan(1)
    let low = 0
    let back = 0
    for (let i = last + 1; i <= last + 0.6 * stepHz; i++) {
      low = Math.max(low, out[i]!.scroll - from)
      back = Math.min(back, out[i]!.scroll - out[i - 1]!.scroll)
    }
    expect(low).toBeGreaterThan(80)
    expect(low).toBeLessThan(91)
    expect(back).toBeGreaterThan(-1e-6)
  })

  it('stands on the lobby while the lobby\'s gate is shut under a ride and goes down from the step the gate opens, never back up', () => {
    const visit = (): Stage => {
      mc = null
      return new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: still, seed: 1 })
    }
    let stage = visit()
    let opens = 0
    while (stage.entryIndex === 0 && stage.time < 60 && !(mc && machine().gate[0])) {
      stage.advance(1)
      opens++
    }
    expect(machine().gate[0]).toBe(true)
    stage = visit()
    stage.advance(opens - 60)
    expect(machine().gate[0]).toBe(false)
    machine().ride(0, 'outlane.corporate.left')
    const from = stage.page.scroll()
    const out: Step[] = []
    for (let i = 0; i < 60 + 0.6 * stepHz; i++) {
      stage.advance(1)
      out.push(read(stage, 0))
    }
    const open = out.findIndex((s) => !s.shut)
    expect(open).toBeGreaterThan(50)
    expect(out[open]!.rail).toBe('outlane.corporate.left')
    for (let i = 0; i < open; i++) expect(Math.abs(out[i]!.scroll - from)).toBeLessThan(1)
    expect(out[open]!.scroll - out[open - 1]!.scroll).toBeGreaterThan(10)
    let back = 0
    for (let i = open; i < out.length; i++) back = Math.min(back, out[i]!.scroll - out[i - 1]!.scroll)
    expect(back).toBe(0)
    expect(out.some((s) => s.rail === 'chute.corporate')).toBe(true)
    expect(out[out.length - 1]!.scroll - from).toBeGreaterThan(900)
  })
})

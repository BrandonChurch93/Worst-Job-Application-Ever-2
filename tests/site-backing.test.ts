import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage, type Frame } from '../src/stage/stage'
import { backingOf, MACHINE, ROW, SHADE } from '../src/ui/backing'

const keen = (flow: { page: string }[]): Stage => new Stage({ mode: 'live', flow: flow as never, pages, driver: new BotDriver('keen', config.seed), seed: config.seed })
const bare = (over: Partial<Frame>): Frame => ({ list: [], cursor: {} as never, turn: 0, scroll: 0, page: 'x', view: null, ...over })

describe('what stands under the row of controls', () => {
  it('on the pinball page the row has the dark capsule in every picture that shows the machine under it, and never on the first and last screens', () => {
    const stage = keen([{ page: 'step3' }, { page: 'step4' }])
    let over = 0
    let flat = 0
    let pale = 0
    for (let i = 0; i < stepHz * 200; i++) {
      stage.advance(1)
      if (i % 4) continue
      const f = stage.frameAt(stage.time)
      if (f.page !== 'step3') break
      const said = backingOf(f, 'pinball')
      const machine = f.scroll + ROW.y1 > MACHINE.top - SHADE && f.scroll < MACHINE.bottom
      if (machine || f.view) {
        over++
        if (!f.view) flat++
        expect(said, `step ${i}, scroll ${f.scroll}`).toBe('dark')
      } else {
        pale++
        expect(said, `step ${i}, scroll ${f.scroll}`).not.toBe('dark')
      }
    }
    // The view goes down the page beside the feed tube with no camera of its own: those pictures are the ones that had the pale capsule.
    expect(flat).toBeGreaterThan(100)
    expect(over).toBeGreaterThan(1000)
    expect(pale).toBeGreaterThan(200)
  })

  it('while a page turns the row stands on a capsule, and bare on the page once it lies flat', () => {
    const stage = keen(liveFlow())
    let turning = 0
    let seenFlat = false
    for (let i = 0; i < stepHz * 120 && stage.page.unit !== 'step2'; i++) {
      stage.advance(1)
      const f = stage.frameAt(stage.time)
      if (f.turn !== 0) {
        turning++
        expect(backingOf(f, stage.page.unit), `step ${i}`).not.toBe('page')
      } else if (stage.page.unit === 'step1' && backingOf(f, stage.page.unit) === 'page') seenFlat = true
    }
    expect(turning).toBeGreaterThan(20)
    expect(seenFlat).toBe(true)
  })

  it('reads the picture as before on the other pages: a camera gives the pale capsule, a dark part under the row the dark one, a sunk floor none', () => {
    const part = { part: 'p', z0: 0, z1: 4 }
    expect(backingOf(null, 'step1')).toBe('page')
    expect(backingOf(bare({}), 'step1')).toBe('page')
    expect(backingOf(bare({ view: { eye: [0, 0, 1], target: [0, 0, 0], fov: 30 } as never }), 'boss')).toBe('light')
    expect(backingOf(bare({ view: { eye: [0, 0, 1], target: [0, 0, 0], fov: 30 } as never }), 'pinball')).toBe('dark')
    expect(backingOf(bare({ list: [{ id: 'a', kind: 'box', x: 200, y: 10, w: 50, h: 20, ...part }] as never }), 'step1')).toBe('light')
    expect(backingOf(bare({ list: [{ id: 'a', kind: 'box', x: 200, y: 10, w: 50, h: 20, tone: 'dark', ...part }] as never }), 'step1')).toBe('dark')
    expect(backingOf(bare({ list: [{ id: 'a', kind: 'well', x: 200, y: 10, w: 50, h: 20, tone: 'dark', ...part }] as never }), 'step1')).toBe('page')
    expect(backingOf(bare({ list: [{ id: 'a', kind: 'box', x: 0, y: 0, w: 1920, h: 1080, part: 'p', z0: -4, z1: 0 }] as never }), 'step1')).toBe('page')
    expect(backingOf(bare({ list: [{ id: 'a', kind: 'box', x: 800, y: 10, w: 50, h: 20, ...part }] as never }), 'step1')).toBe('page')
    expect(backingOf(bare({ scroll: 400, list: [{ id: 'a', kind: 'box', x: 200, y: 410, w: 50, h: 20, ...part }] as never }), 'step1')).toBe('light')
    expect(backingOf(bare({ scroll: MACHINE.top - SHADE - ROW.y1 }), 'pinball')).toBe('page')
    expect(backingOf(bare({ scroll: MACHINE.top - SHADE - ROW.y1 + 1 }), 'pinball')).toBe('dark')
    expect(backingOf(bare({ scroll: MACHINE.top - ROW.y1 }), 'pinball')).toBe('dark')
    expect(backingOf(bare({ scroll: 0 }), 'pinball')).toBe('page')
    expect(MACHINE.top - SHADE - ROW.y1).toBeGreaterThan(540)
    expect(backingOf(bare({ scroll: MACHINE.bottom }), 'pinball')).toBe('page')
    expect(backingOf(bare({ scroll: MACHINE.bottom - 1 }), 'step1')).toBe('page')
  })
})

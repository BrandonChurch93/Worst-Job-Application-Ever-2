import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { gated, waitsFor } from '../src/core/load'
import { cursorUnmade } from '../src/cursor/view'
import { pages } from '../src/pages'
import { real } from '../src/real'
import { PageView, standInsOf, waitingOf } from '../src/shell/view'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage, type Frame } from '../src/stage/stage'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import '../src/table/real'

const root = path.resolve(__dirname, '..')
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8')
const ctxOf = (f: Frame): RealContext => ({ page: f.page, list: f.list, byId: new Map(f.list.map((s) => [s.id, s])), time: f.time ?? 0, scroll: f.scroll, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })

const answered = (s: Shape, ctx: RealContext): boolean => {
  const own = real.parts[s.part]
  if (own && own.key(s, ctx) !== null) return true
  return s.kind === 'text' && real.type !== null && real.type.key(s, ctx) !== null
}

function frames(bot: 'keen' | 'skipper', every: number): Frame[] {
  const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver(bot, 1), seed: 1 })
  const out: Frame[] = []
  while (!stage.finished && stage.time < 400) {
    stage.advance(Math.round(every * 240))
    out.push(stage.frameAt(stage.time))
  }
  expect(stage.finished).toBe(true)
  return out
}

describe('the stand-in paths are gone', () => {
  it('has no stub page, no flag of a stand-in in the view and no null branch in the cursor', () => {
    expect(fs.existsSync(path.join(root, 'src/pages/stub.ts'))).toBe(false)
    const view = read('src/shell/view.ts')
    expect(view).not.toMatch(/userData\.standIn|standIn:/)
    expect(view).not.toMatch(/MeshStandardMaterial|BoxGeometry|ExtrudeGeometry/)
    expect(read('src/cursor/view.ts')).not.toMatch(/cursorReal|\? make\w+\(\) : null/)
  })

  it('has a maker for each of the five parts of the cursor', () => {
    expect(cursorUnmade()).toEqual([])
  })

  it('has a maker for the slab and for the type', () => {
    expect(real.ground).not.toBeNull()
    expect(real.type).not.toBeNull()
  })

  it('finds a maker that answers every shape of every frame of two whole visits, but for the parts that wait for their pictures', { timeout: 240000 }, () => {
    const seen = new Set<string>()
    const unanswered = new Set<string>()
    const held = new Set<string>()
    for (const bot of ['skipper', 'keen'] as const) {
      for (const f of frames(bot, 0.5)) {
        seen.add(f.page)
        const ctx = ctxOf(f)
        for (const s of f.list) {
          if (s.kind === 'well') continue
          expect(s.part in real.parts || (s.kind === 'text' && real.type !== null), `${f.page}: ${s.part}`).toBe(true)
          if (answered(s, ctx)) continue
          if (gated(s.part)) held.add(s.part)
          else unanswered.add(`${f.page}: ${s.part} (${s.kind})`)
        }
      }
    }
    expect([...seen].sort()).toEqual(['marketing', 'step1', 'step2', 'step3', 'step4', 'step5'])
    expect([...unanswered]).toEqual([])
    for (const part of held) expect(real.parts[part], part).toBeTruthy()
  })

  it('draws nothing for a shape nobody makes, and says its part', () => {
    const ghost: Shape = { id: 'ghost.1', part: 'no-such-part', kind: 'box', x: 100, y: 100, w: 200, h: 100, z0: 0, z1: 20, tone: 'raised' } as Shape
    const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver('keen', 1), seed: 1 })
    const f = stage.frameAt(0)
    const with1: Frame = { ...f, list: [...f.list, ghost] }
    expect(standInsOf(f, { width: 1920, height: 1080 })).toEqual([])
    expect(standInsOf(with1, { width: 1920, height: 1080 })).toEqual(['no-such-part'])
    expect(waitingOf(with1, { width: 1920, height: 1080 })).toEqual([])
    const view = new PageView()
    view.apply(with1, { width: 1920, height: 1080 })
    expect(view.standIns()).toEqual(['no-such-part'])
    let flagged = 0
    let named = 0
    view.scene.traverse((o) => {
      if (o.userData.standIn !== undefined) flagged++
      if (o.userData.part === 'no-such-part' || o.userData.shape === 'ghost.1') named++
    })
    expect(flagged).toBe(0)
    expect(named).toBe(0)
  })

  it('does not call a part waiting whose pictures were never asked for', () => {
    expect(gated('tier-art')).toBe(true)
    expect(waitsFor('tier-art')).toBe(false)
  })
})

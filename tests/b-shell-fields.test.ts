import { describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import type { RealContext } from '../src/real/types'
import { controls, railFill, railNotches } from '../src/shell/real/controls'
import { blendFrames, liveFlow, railFields, Stage, type Driver, type DrawList, type FieldProgress, type Frame, type PageMaker, type Shape } from '../src/stage/stage'

const still: Driver = { name: 'bot', input: () => ({ x: 960, y: 900, down: false }) }
const pitch = config.scale.grid.progressPitch
const button = config.scale.sizes.progressButton

const reporting = (id: string, fields: () => FieldProgress | null): PageMaker => () => {
  const page = pages[id]!()
  return new Proxy(page, { get: (t, k) => (k === 'fields' ? fields : Reflect.get(t, k, t)) })
}

const stageOf = (id: string, maker?: PageMaker): Stage => new Stage({ mode: 'live', flow: [{ page: id }], pages: maker ? { ...pages, [id]: maker } : pages, driver: still, seed: config.seed })

const frameOf = (id: string, fields?: FieldProgress | null): Frame => {
  const s = stageOf(id, fields === undefined ? undefined : reporting(id, () => fields))
  s.advance(120)
  return s.frameAt(s.step / stepHz)
}

const ctxOf = (f: Frame): RealContext => {
  const byId = new Map<string, Shape>()
  for (const s of f.list) byId.set(s.id, s)
  return { page: f.page, list: f.list, byId, time: 0, scroll: f.scroll, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined }
}

const railOf = (f: Frame): Shape => f.list.find((s) => s.id === 'progress-rail')!

describe('the field progress contract', () => {
  it('leaves every page of the build as it was: none reports fields, and the frame holds what the page drew', () => {
    for (const { page } of liveFlow().slice(0, 6)) {
      const s = stageOf(page)
      s.advance(30)
      expect(s.page.fields, page).toBeUndefined()
      const list: DrawList = []
      s.page.draw(list)
      expect(s.frameAt(s.step / stepHz).list, page).toEqual(list)
    }
  })

  it('draws a page with a rail that reports nothing, null, or no fields at all as 0 of 1: bare on step 1, filled up to the collar of the step in hand after it', () => {
    const plain = frameOf('step1')
    const key = controls.key(railOf(plain), ctxOf(plain))
    for (const fields of [null, { done: 0, total: 0 }, { done: 0, total: 1 }]) {
      const f = frameOf('step1', fields)
      expect(controls.key(railOf(f), ctxOf(f)), JSON.stringify(fields)).toBe(key)
      expect(railFill(railOf(f), ctxOf(f))).toEqual([])
      expect(railNotches(railOf(f), ctxOf(f))).toEqual([])
    }
    expect(controls.make(railOf(plain), ctxOf(plain)).getObjectByName('rail-fill')).toBeUndefined()
    for (const { page } of liveFlow().slice(2, 6)) {
      const f = frameOf(page)
      const rail = f.list.find((s) => s.id === 'progress-rail')!
      const cur = f.list.find((s) => s.role === 'progressButtonCurrent')!
      const fill = railFill(rail, ctxOf(f))
      expect(fill.length, page).toBe(1)
      expect(fill[0]![0], page).toBe(0)
      expect(fill[0]![1], page).toBeGreaterThan(cur.x - rail.x - 8)
      expect(fill[0]![1], page).toBeLessThan(cur.x - rail.x)
      expect(railNotches(rail, ctxOf(f)), page).toEqual([])
    }
  })

  it('fills in the orange of the button in hand, with a notch at each boundary between two fields', () => {
    const f = frameOf('step2', { done: 2, total: 3 })
    const rail = railOf(f)
    const made = controls.make(rail, ctxOf(f))
    const cap = controls.make(f.list.find((s) => s.role === 'progressButtonCurrent')!, ctxOf(f))
    const mats = new Set<unknown>()
    cap.traverse((o) => { const m = (o as THREE.Mesh).material; if (m) mats.add(m) })
    const fills: THREE.Mesh[] = []
    const cuts: THREE.Object3D[] = []
    made.traverse((o) => { if (o.name === 'rail-fill') fills.push(o as THREE.Mesh); if (o.name === 'rail-notch') cuts.push(o) })
    expect(fills.length).toBe(2)
    for (const m of fills) expect(mats.has(m.material)).toBe(true)
    const at = railNotches(rail, ctxOf(f))
    expect(at.length).toBe(2)
    expect(cuts.map((o) => o.position.x)).toEqual(at.map((x) => x - rail.w / 2))
    const lead = railFill(rail, ctxOf(f))[1]!
    expect(at[1]!).toBeCloseTo(lead[1], 1)
    expect(at[0]! - lead[0]).toBeCloseTo(at[1]! - at[0]!, 1)
    expect(controls.key(rail, ctxOf(f))).toContain(`:n${at[0]}:n${at[1]}`)
  })

  it('leaves every other rail of the build alone: the health bar of the boss and the process rail of the careers page', () => {
    for (const page of ['step4', 'marketing']) {
      const s = stageOf(page, reporting(page, () => ({ done: 1, total: 2 })))
      s.advance(240)
      const f = s.frameAt(s.step / stepHz)
      const plain = stageOf(page)
      plain.advance(240)
      const g = plain.frameAt(plain.step / stepHz)
      for (const o of f.list) if (o.role === 'progressRail' && o.id !== 'progress-rail') {
        expect(o.v, o.id).toEqual(g.list.find((x) => x.id === o.id)!.v)
        expect(railFill(o, ctxOf(f)), o.id).toEqual([])
        expect(railNotches(o, ctxOf(f)), o.id).toEqual([])
      }
    }
  })

  it('hands what the page reports to the rail as its own numbers, and nothing else in the frame changes', () => {
    const plain = frameOf('step1')
    const f = frameOf('step1', { done: 1, total: 3 })
    expect(railOf(f).v).toEqual([1, 3])
    expect(f.list.map((s) => (s.role === 'progressRail' ? { ...s, v: undefined } : s))).toEqual(plain.list.map((s) => (s.role === 'progressRail' ? { ...s, v: undefined } : s)))
  })

  it('fills the rail from the collar of the step in hand toward the next button, by fields', () => {
    const leads: number[] = []
    for (const done of [1, 2, 3]) {
      const f = frameOf('step1', { done, total: 3 })
      const rail = railOf(f)
      const fill = railFill(rail, ctxOf(f))
      expect(fill.length, `${done} of 3`).toBe(1)
      leads.push(fill[0]![1] - fill[0]![0])
      expect(controls.key(rail, ctxOf(f))).toContain(`:${fill[0]![0]}-${fill[0]![1]}`)
      const made = controls.make(rail, ctxOf(f))
      const lit: THREE.Object3D[] = []
      made.traverse((o) => { if (o.name === 'rail-fill') lit.push(o) })
      expect(lit.length).toBe(1)
      expect(lit[0]!.position.x).toBeCloseTo((fill[0]![0] + fill[0]![1]) / 2 - rail.w / 2, 6)
    }
    expect(leads[1]! / leads[0]!).toBeCloseTo(2, 1)
    expect(leads[2]! / leads[0]!).toBeGreaterThan(3)
    expect(leads[2]! / leads[0]!).toBeLessThan(3.3)
    const full = frameOf('step1', { done: 3, total: 3 })
    const end = railFill(railOf(full), ctxOf(full))[0]![1]
    expect(end).toBeGreaterThan(pitch - button / 2)
    expect(end).toBeLessThan(pitch)
  })

  it('never fills past the next button, whatever a page reports', () => {
    const over = frameOf('step1', { done: 7, total: 3 })
    const full = frameOf('step1', { done: 3, total: 3 })
    expect(railFill(railOf(over), ctxOf(over))).toEqual(railFill(railOf(full), ctxOf(full)))
    const under = frameOf('step1', { done: -2, total: 3 })
    expect(railFill(railOf(under), ctxOf(under))).toEqual([])
    expect(railNotches(railOf(under), ctxOf(under)).length).toBe(2)
  })

  it('fills the steps behind the step in hand as well', () => {
    const f = frameOf('step2', { done: 0, total: 3 })
    const fill = railFill(railOf(f), ctxOf(f))
    expect(fill.length).toBe(1)
    expect(fill[0]![0]).toBe(0)
    expect(fill[0]![1]).toBeGreaterThan(pitch - button / 2 - 6)
    expect(fill[0]![1]).toBeLessThan(pitch - button / 2)
    const g = frameOf('step2', { done: 2, total: 3 })
    expect(railFill(railOf(g), ctxOf(g)).length).toBe(2)
  })

  it('blends the fill between two steps of the stage', () => {
    const a = frameOf('step1', { done: 1, total: 3 })
    const b = frameOf('step1', { done: 2, total: 3 })
    expect(railOf(blendFrames(a, b, 0.5)).v).toEqual([1.5, 3])
  })

  it('stamps only the rail', () => {
    const list: DrawList = [{ id: 'a', part: 'shell', kind: 'box', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 1, tone: 'page', role: 'field' }, { id: 'progress-rail', part: 'shell', kind: 'capsule', x: 0, y: 0, w: 1, h: 1, z0: -3, z1: 0, tone: 'pocket', role: 'progressRail' }, { id: 'health-track', part: 'health-bar', kind: 'capsule', x: 0, y: 0, w: 1, h: 1, z0: -3, z1: 0, tone: 'pocket', role: 'progressRail', v: [4] }]
    railFields(list, { done: 1, total: 2 })
    expect(list[0]!.v).toBeUndefined()
    expect(list[1]!.v).toEqual([1, 2])
    expect(list[2]!.v).toEqual([4])
  })
})

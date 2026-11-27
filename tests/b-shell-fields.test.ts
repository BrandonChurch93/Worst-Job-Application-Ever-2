import { describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import type { RealContext } from '../src/real/types'
import { controls, railFill } from '../src/shell/real/controls'
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

const railOf = (f: Frame): Shape => f.list.find((s) => s.role === 'progressRail')!

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

  it('draws a page that reports nothing, null, or no fields at all with the key and the object of today', () => {
    const plain = frameOf('step1')
    const key = controls.key(railOf(plain), ctxOf(plain))
    for (const fields of [null, { done: 0, total: 0 }, { done: 0, total: 3 }]) {
      const f = frameOf('step1', fields)
      expect(controls.key(railOf(f), ctxOf(f)), JSON.stringify(fields)).toBe(key)
      expect(railFill(railOf(f), ctxOf(f))).toEqual([])
    }
    const made = controls.make(railOf(plain), ctxOf(plain))
    expect(made.getObjectByName('rail-fill')).toBeUndefined()
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
    expect(leads[2]! / leads[0]!).toBeCloseTo(3, 1)
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
    const list: DrawList = [{ id: 'a', part: 'shell', kind: 'box', x: 0, y: 0, w: 1, h: 1, z0: 0, z1: 1, tone: 'page', role: 'field' }, { id: 'r', part: 'shell', kind: 'capsule', x: 0, y: 0, w: 1, h: 1, z0: -3, z1: 0, tone: 'pocket', role: 'progressRail' }]
    railFields(list, { done: 1, total: 2 })
    expect(list[0]!.v).toBeUndefined()
    expect(list[1]!.v).toEqual([1, 2])
  })
})

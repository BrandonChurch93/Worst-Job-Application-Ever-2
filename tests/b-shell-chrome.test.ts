import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { HEADER_OUT, isHeader, liveFlow, slideHeader, Stage, type Chrome, type Driver, type DrawList, type Frame, type PageMaker } from '../src/stage/stage'

const still: Driver = { name: 'bot', input: () => ({ x: 960, y: 900, down: false }) }

const saying = (id: string, chrome: () => Chrome | null): PageMaker => () => {
  const page = pages[id]!()
  return new Proxy(page, { get: (t, k) => (k === 'chrome' ? chrome : Reflect.get(t, k, t)) })
}

const frameOf = (id: string, chrome?: Chrome | null): Frame => {
  const s = new Stage({ mode: 'live', flow: [{ page: id }], pages: chrome === undefined ? pages : { ...pages, [id]: saying(id, () => chrome) }, driver: still, seed: config.seed })
  s.advance(120)
  return s.frameAt(s.step / stepHz)
}

describe('the header hook', () => {
  it('leaves every page of the build as it was: none says anything of the header, and the frame holds what the page drew', () => {
    for (const { page } of liveFlow().slice(0, 6)) {
      const s = new Stage({ mode: 'live', flow: [{ page }], pages, driver: still, seed: config.seed })
      s.advance(30)
      expect(s.page.chrome, page).toBeUndefined()
      const list: DrawList = []
      s.page.draw(list)
      expect(s.frameAt(s.step / stepHz).list, page).toEqual(list)
    }
  })

  it('draws a page that says null, or header 1, exactly as one that says nothing', () => {
    const plain = frameOf('step1')
    expect(frameOf('step1', null).list).toEqual(plain.list)
    expect(frameOf('step1', { header: 1 }).list).toEqual(plain.list)
    expect(frameOf('step1', { header: 7 }).list).toEqual(plain.list)
  })

  it('names the title, the rail, its five buttons, their numerals and the rule as the header, and nothing else', () => {
    const ids = frameOf('step1').list.map((s) => s.id).filter(isHeader).sort()
    expect(ids).toEqual(['header-rule', 'header-title', 'progress-1', 'progress-1-numeral', 'progress-2', 'progress-2-numeral', 'progress-3', 'progress-3-numeral', 'progress-4', 'progress-4-numeral', 'progress-5', 'progress-5-numeral', 'progress-rail'])
  })

  it('moves the whole header up by the part that is out, marks it moved, and touches nothing else', () => {
    const plain = frameOf('step4')
    for (const header of [0.75, 0.5, 0, -3]) {
      const f = frameOf('step4', { header })
      const out = (1 - Math.max(0, header)) * HEADER_OUT
      expect(f.list.length).toBe(plain.list.length)
      f.list.forEach((s, i) => {
        const p = plain.list[i]!
        if (isHeader(s.id)) expect(s, s.id).toEqual({ ...p, y: p.y - out, moved: true })
        else expect(s, s.id).toEqual(p)
      })
    }
  })

  it('takes every header shape off the top of the screen at 0', () => {
    const f = frameOf('step2', { header: 0 })
    for (const s of f.list) if (isHeader(s.id)) expect(s.y + s.h, s.id).toBeLessThan(0)
  })

  it('does not move the shapes the page keeps: a second frame of the same step is the same', () => {
    const list: DrawList = [{ id: 'header-rule', part: 'shell', kind: 'box', x: 0, y: 160, w: 10, h: 6, z0: 0, z1: 1, tone: 'metal' }]
    const kept = list[0]!
    slideHeader(list, { header: 0.5 })
    expect(kept.y).toBe(160)
    expect(list[0]!.y).toBe(160 - HEADER_OUT / 2)
  })
})

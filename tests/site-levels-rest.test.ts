import { describe, expect, it } from 'vitest'
import { GLASS_DOOR, glassBends, setGlass } from '../src/core/levelGlass'
import { levelPlan, REST_FRAMES } from '../src/core/levelPlan'
import { qualityIds } from '../src/core/quality'
import { REST_UNBLENDED, restBlends, restShare } from '../src/core/levelRest'
import { liveFlow } from '../src/stage/stage'
import { readFileSync } from 'node:fs'

describe('how a page at rest moves from its one-sample picture to its gathered mean', () => {
  const of = REST_FRAMES.accumulated

  it('shows the one-sample picture alone at the first frame and the mean alone at the last', () => {
    expect(restShare(1, of)).toBe(0)
    expect(restShare(of, of)).toBe(1)
    expect(restShare(of + 5, of)).toBe(1)
  })

  it('never steps by more than one part in the frames it gathers', () => {
    for (let n = 2; n <= of; n++) {
      const step = restShare(n, of) - restShare(n - 1, of)
      expect(step).toBeGreaterThan(0)
      expect(step).toBeLessThanOrEqual(1 / (of - 1) + 1e-12)
    }
  })

  it('lets the mean of two frames, the one farthest from where it ends, weigh under 2 in 100', () => {
    expect(restShare(2, of)).toBeLessThan(0.02)
  })

  it('shows the mean at once when there is nothing to gather', () => {
    expect(restShare(1, 1)).toBe(1)
  })
})

describe('what a level tells the glass of the ball', () => {
  it('bends at every level whose word is refracting and in a computed picture, and not where the word is frosted', () => {
    expect(glassBends(null)).toBe(true)
    for (const id of qualityIds) expect(glassBends(levelPlan(id).glass)).toBe(levelPlan(id).glass === 'refracting')
    expect(glassBends(levelPlan('low').glass)).toBe(false)
    expect(glassBends(levelPlan('high').glass)).toBe(true)
  })

  it('says so through the door the ball listens on', () => {
    const heard: { type: string; bend: unknown }[] = []
    const target = { dispatchEvent: (e: Event) => { heard.push({ type: e.type, bend: (e as CustomEvent).detail.bend }); return true } }
    setGlass('frosted', target)
    setGlass(null, target)
    expect(heard).toEqual([{ type: GLASS_DOOR, bend: false }, { type: GLASS_DOOR, bend: true }])
  })
})

describe('where a page at rest is shown without the blend', () => {
  it('leaves the blend out on the page of the table and nowhere else on the way through the site', () => {
    expect(restBlends('step3')).toBe(false)
    const pages = [...new Set(liveFlow().map((e) => e.page))]
    expect(pages).toContain('step3')
    for (const page of pages) expect(restBlends(page)).toBe(!REST_UNBLENDED.includes(page))
    expect(pages.filter((page) => !restBlends(page))).toEqual(['step3'])
  })

  it('is asked by the frame of the live site before the one-sample picture is held', () => {
    const renderer = readFileSync(new URL('../src/core/renderer.ts', import.meta.url), 'utf8')
    const app = readFileSync(new URL('../src/app.ts', import.meta.url), 'utf8')
    expect(renderer).toMatch(/gathers && this\.blendsRest && this\.acc\.samples === 1\) this\.rest\.hold\(/)
    expect(app).toMatch(/this\.engine\.blendsRest = restBlends\(frame\.page\)/)
  })
})

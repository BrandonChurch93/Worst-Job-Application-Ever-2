import { describe, expect, it } from 'vitest'
import config from '../config/showcase.json'
import { quality, qualityIds } from '../src/core/quality'
import { levelIsFixedOf, startLevelOf } from '../src/core/levelStart'
import { BUFFER_PX, FILM_BAR_PX, fitPicture } from '../src/core/levelFit'
import { makeQualityPicker, PICKER } from '../src/ui/picker'

const levels = qualityIds.map((id) => ({ id, minFps: quality(id).minFps }))
const best = levels[0]!
const worst = levels[levels.length - 1]!
const at = (fps: number) => 1 / fps
// The longest time the frame loop reports for one frame (`frameSeconds` in src/main.ts).
const LOOP_CAP = 0.5

describe('the level picker and what is no reason to step down', () => {
  it('counts the cap of the frame loop as a stall', () => {
    expect(PICKER.stallSeconds).toBeLessThan(LOOP_CAP)
  })

  it('holds its level through long frames while files load, at the start and later', () => {
    const p = makeQualityPicker(levels)
    for (let i = 0; i < 4; i++) p.frame(LOOP_CAP)
    for (let i = 0; i < 4000; i++) {
      p.frame(at(best.minFps + 10))
      if (i % 30 === 0) for (let k = 0; k < 3; k++) p.frame(LOOP_CAP)
      if (i % 7 === 0) p.frame(0.2)
    }
    expect(p.level()).toBe(best.id)
    expect(p.settled()).toBe(true)
  })

  it('leaves out the frames a file gives right after a stall', () => {
    const p = makeQualityPicker(levels)
    for (let i = 0; i < 400; i++) {
      for (let k = 0; k < 40; k++) p.frame(at(best.minFps + 10))
      p.frame(LOOP_CAP)
      for (let k = 0; k < PICKER.afterStallFrames; k++) p.frame(at(best.minFps / 3))
    }
    expect(p.level()).toBe(best.id)
  })

  it('holds its level when a tab comes back from the background, however often', () => {
    const p = makeQualityPicker(levels)
    for (let visit = 0; visit < 200; visit++) {
      for (let i = 0; i < 90; i++) p.frame(at(best.minFps + 5))
      p.frame(LOOP_CAP)
      p.frame(3600)
    }
    expect(p.level()).toBe(best.id)
  })

  it('still steps down on a machine so slow that every frame is as long as a stall', () => {
    const p = makeQualityPicker(levels)
    let t = 0
    while (p.level() !== worst.id && t < 120) {
      p.frame(LOOP_CAP)
      t += LOOP_CAP
    }
    expect(p.level()).toBe(worst.id)
    expect(t).toBeLessThan(10 * (levels.length - 1))
  })

  it('never moves a level the config or the address pins', () => {
    for (const l of levels) {
      const p = makeQualityPicker(levels, { fixed: l.id })
      for (let i = 0; i < 5000; i++) expect(p.frame(i % 3 ? at(4) : LOOP_CAP)).toBe(l.id)
      for (let i = 0; i < 5000; i++) expect(p.frame(at(240))).toBe(l.id)
      expect(p.pinned()).toBe(true)
    }
  })

  it('never moves a level the menu pins after the start', () => {
    const p = makeQualityPicker(levels)
    p.pin(best.id)
    for (let i = 0; i < 5000; i++) expect(p.frame(at(5))).toBe(best.id)
  })
})

describe('the level the site starts at', () => {
  it('is auto today: the best level, free to step down', () => {
    expect(config.live.defaultQuality).toBe('auto')
    expect(startLevelOf(null, config.live.defaultQuality)).toBe(best.id)
    expect(levelIsFixedOf(null, config.live.defaultQuality)).toBe(false)
  })

  it('is pinned by a level named in live.defaultQuality', () => {
    for (const l of levels) {
      expect(startLevelOf(null, l.id)).toBe(l.id)
      expect(levelIsFixedOf(null, l.id)).toBe(true)
    }
  })

  it('is pinned by the address, over the config', () => {
    for (const l of levels) {
      expect(startLevelOf(l.id, 'auto')).toBe(l.id)
      expect(startLevelOf(l.id, best.id)).toBe(l.id)
      expect(levelIsFixedOf(l.id, 'auto')).toBe(true)
    }
  })

  it('refuses a level that does not exist', () => {
    expect(() => startLevelOf('ultra', 'auto')).toThrow()
    expect(() => startLevelOf(null, 'ultra')).toThrow()
  })
})

describe('the size the live picture is drawn at', () => {
  it('fills a 16 to 9 window at pixel ratio 1', () => {
    expect(fitPicture(1920, 1080, 1, 2, false)).toEqual({ cssWidth: 1920, cssHeight: 1080, width: 1920, height: 1080 })
  })

  it('takes the height of the bar off the window while the mode is film', () => {
    const live = fitPicture(1920, 1080, 1, 1, false)
    const film = fitPicture(1920, 1080, 1, 1, true)
    expect(film.cssHeight).toBe(1080 - FILM_BAR_PX)
    expect(film.cssWidth).toBeCloseTo(((1080 - FILM_BAR_PX) * 16) / 9, 9)
    expect(film.width).toBe(Math.round(film.cssWidth))
    expect(film.width).toBeLessThan(live.width)
  })

  it('draws no more pixels than are shown times the cap of the level, in a window of any shape', () => {
    for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [800, 1200], [2560, 1080]] as const) {
      for (const id of qualityIds) {
        for (const film of [false, true]) {
          for (const dpr of [1, 1.25, 2, 3]) {
            const f = fitPicture(w, h, dpr, quality(id).pixelRatioCap, film)
            expect(f.cssHeight).toBeLessThanOrEqual(h - (film ? FILM_BAR_PX : 0) + 1e-9)
            expect(f.cssWidth).toBeLessThanOrEqual(w)
            const want = Math.round(f.cssWidth * Math.min(dpr, quality(id).pixelRatioCap))
            expect(f.width).toBe(Math.max(BUFFER_PX.min, Math.min(BUFFER_PX.max, want)))
          }
        }
      }
    }
  })
})

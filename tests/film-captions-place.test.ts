import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { config } from '../src/config'
import { narration, timedLines, type Narration } from '../src/copy'
import { filmLineId, filmLinePage, pageAfter, spoken, unitPage } from '../src/audio/cues'
import { filmCaptions } from '../src/audio/standin'
import { riseAfterFire } from '../src/audio/rise'
import { CAPTION, captionLow, makeCaption } from '../src/ui/said'

// The film's captions are pictures of the panel laid over the film (pipeline/change002/shell-film-captions.mjs keeps the list of them).
// On the live site the panel lies at CAPTION.lowOn on the boss page and the decision page and at CAPTION.low elsewhere. The film must show it in the same place.
interface Kept { key: string; phrase: number; words: string; page: string; lowerEdgeY: number; first: number; last: number; step?: { k: number; n: number }; panel: { box: number[] } }
interface KeptList { fps: number; size: { width: number; height: number }; captions: Kept[]; hides: { riseAfterFire: number; names: string[]; marks: { name: string; frame: number }[] } }
const kept = JSON.parse(readFileSync(path.resolve(__dirname, '../pipeline/change002/shell-film-captions.json'), 'utf8')) as KeptList
const keptSmall = JSON.parse(readFileSync(path.resolve(__dirname, '../pipeline/change002/shell-film-captions-960x540.json'), 'utf8')) as KeptList
// The film's marks by frame: the cut list's. A line whose row has steps.hidesOnRise leaves riseAfterFire() after its last mark.
const cut = JSON.parse(readFileSync(path.resolve(__dirname, '../cut/CUTLIST.json'), 'utf8')) as { fps: number; events: { name: string; frame: number }[] }
const hideNames = [...new Set(Object.values(spoken).filter((row) => row.steps?.hidesOnRise).map((row) => row.steps!.last))]
const marks = cut.events.filter((e) => hideNames.includes(e.name)).map((e) => ({ name: e.name, frame: e.frame }))
const drafts = (JSON.parse(readFileSync(path.resolve(__dirname, '../content/narration-drafts.json'), 'utf8')) as { film?: Record<string, unknown[]> }).film ?? {}
const settled = narration.film as Record<string, unknown[]>
const script = { ...narration, film: { ...settled, ...Object.fromEntries(Object.entries(drafts).filter(([beat, ls]) => ls.length && !settled[beat]?.length)) } } as Narration
const fps = config.film.fps
const now = filmCaptions(timedLines(config, script).map((l) => ({ id: filmLineId(l.beat, l.index), frame: Math.round(l.start * fps) })), fps, undefined, marks)
const unitOf = (key: string): string => config.film.beats.find((b) => b.id === key.slice(0, key.lastIndexOf('.')))!.unit
const of = (key: string, phrase: number): Kept | undefined => kept.captions.find((x) => x.key === key && x.phrase === phrase)

afterEach(() => vi.unstubAllGlobals())

describe('where the film lays the captions', () => {
  it('names the page a line is said over: the page of its unit, and for the line set off by the turn of the page the page turned to', () => {
    expect(filmLinePage('decision.letter.0', 'decision')).toBe('step5')
    expect(filmLinePage('boss.verify.0', 'boss')).toBe('step4')
    expect(filmLinePage('decision.reset.0', 'decision')).toBe(pageAfter[unitPage['decision']!])
    expect(filmLinePage('decision.reset.0', 'decision')).toBe('marketing')
    expect(captionLow('step5')).toBe(CAPTION.lowOn.step5)
    expect(captionLow('step4')).toBe(CAPTION.lowOn.step4)
    expect(captionLow('marketing')).toBe(CAPTION.low)
    expect(captionLow()).toBe(CAPTION.low)
  })

  it('gives every phrase of the film the box the live panel has on that page', () => {
    expect(kept.size).toEqual({ width: 1920, height: 1080 })
    expect(now.length).toBeGreaterThan(40)
    for (const cap of now) {
      const k = of(cap.key, cap.phrase)
      const name = `${cap.key} phrase ${cap.phrase}`
      expect(k, `${name} is not in the kept list: run node pipeline/change002/shell-film-captions.mjs`).toBeDefined()
      const page = filmLinePage(cap.key, unitOf(cap.key))
      expect(k!.page, name).toBe(page)
      const [x, y, w, h] = k!.panel.box as [number, number, number, number]
      if (cap.step) {
        // The line that builds on marks is drawn large in the top band on any page; its last step shakes by no more than shakePx.
        expect(Math.abs(y - CAPTION.shout.top), name).toBeLessThanOrEqual(CAPTION.shout.shakePx)
        expect(y + h, name).toBeLessThanOrEqual(CAPTION.shout.low)
        expect(Math.abs(x + w / 2 - 960), name).toBeLessThanOrEqual(CAPTION.shout.shakePx + 0.5)
        continue
      }
      // What the live site tells the panel on that page (src/audio/index.ts: place(at ?? CAPTION.lowOn[id])), and where the panel then puts its lower edge.
      const live = CAPTION.lowOn[page] ?? CAPTION.low
      expect(k!.lowerEdgeY, name).toBe(live)
      expect(Math.abs(y + h - live), name).toBeLessThanOrEqual(0.5)
      expect(Math.abs(x + w / 2 - 960), name).toBeLessThanOrEqual(0.5)
      expect(h, name).toBeLessThanOrEqual(CAPTION.high)
      expect(w, name).toBeLessThanOrEqual(CAPTION.wide)
    }
    const line8 = kept.captions.filter((x) => x.key === 'decision.letter.0')
    expect(line8).toHaveLength(5)
    for (const x of line8) expect([x.panel.box[1], x.panel.box[1]! + x.panel.box[3]!]).toEqual([202, 264])
  })

  it('keeps each picture on the frames the film gives its phrase, ended where the rise begins after the cut list\'s fire mark, in both kept lists', () => {
    expect(cut.fps).toBe(fps)
    expect(hideNames).toEqual(['finish-fire'])
    expect(marks.length).toBeGreaterThan(0)
    for (const list of [kept, keptSmall]) {
      const again = 'run node pipeline/change002/shell-film-captions.mjs and the same with --size 960x540 after npm run cut'
      expect(list.fps).toBe(fps)
      expect(list.hides.names, again).toEqual(hideNames)
      expect(list.hides.riseAfterFire, again).toBe(riseAfterFire())
      expect(list.hides.marks, again).toEqual(marks)
      expect(list.captions.map((x) => [x.key, x.phrase, x.first, x.last]), again).toEqual(now.map((x) => [x.key, x.phrase, x.first, x.last]))
    }
    const up = now.filter((x) => spoken[x.key]?.steps?.hidesOnRise)
    expect(up.length).toBeGreaterThan(0)
    expect(Math.max(...up.map((x) => x.last))).toBe(marks[0]!.frame + Math.round(riseAfterFire() * fps) - 1)
  })

  it('is the place the live panel takes when it is told the page', () => {
    for (const page of ['marketing', 'step1', 'step2', 'step3', 'step4', 'step5']) {
      const frames: (() => void)[] = []
      const el: any = { style: {}, dataset: {}, textContent: '' }
      vi.stubGlobal('document', { body: { append: () => undefined }, createElement: () => el, querySelector: () => null })
      vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080, requestAnimationFrame: (fn: () => void) => { frames.push(fn); return frames.length } })
      const src = { now: 0, lines: [{ id: 'line.x', words: 'Two pages.', start: 1, end: 3 }] }
      const c = makeCaption(() => src)!
      c.place(CAPTION.lowOn[page])
      c.wake()
      frames.shift()!()
      src.now = 1.5
      frames.shift()!()
      expect(el.style.display, page).toBe('block')
      expect(el.style.bottom, page).toBe(`${1080 - captionLow(page)}px`)
      vi.unstubAllGlobals()
    }
  })
})

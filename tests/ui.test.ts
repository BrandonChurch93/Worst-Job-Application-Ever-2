import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { copy, lookup } from '../src/copy'
import { quality, qualityIds } from '../src/core/quality'
import { clockText, isTouchOnly } from '../src/ui/device'
import { names } from '../src/ui/names'
import { makeQualityPicker, medianFps, PICKER, type QualityLevel } from '../src/ui/picker'
import { resolve, stepNames, word, WORDS, type WordId } from '../src/ui/words'

const levels: QualityLevel[] = qualityIds.map((id) => ({ id, minFps: quality(id).minFps }))
const [best, middle, worst] = levels as [QualityLevel, QualityLevel, QualityLevel]
const at = (fps: number) => 1 / fps

function feed(p: ReturnType<typeof makeQualityPicker>, fps: number, seconds: number, seen: string[] = []): string[] {
  for (let t = 0; t < seconds; t += at(fps)) {
    const level = p.frame(at(fps))
    if (seen[seen.length - 1] !== level) seen.push(level)
  }
  return seen
}

const index = (id: string) => levels.findIndex((l) => l.id === id)

describe('the level picker', () => {
  it('reads its levels from live.quality, best first', () => {
    expect(levels.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < levels.length; i++) expect(levels[i]!.minFps).toBeLessThanOrEqual(levels[i - 1]!.minFps)
  })

  it('starts at the best level and holds it on a machine that can hold it', () => {
    const p = makeQualityPicker(levels)
    expect(p.level()).toBe(best.id)
    expect(feed(p, best.minFps + 10, 120)).toEqual([best.id])
    expect(p.settled()).toBe(true)
  })

  it('finds the level the first frames can hold within a few seconds', () => {
    const p = makeQualityPicker(levels)
    let t = 0
    while (!p.settled() && t < 30) {
      p.frame(at(middle.minFps + 2))
      t += at(middle.minFps + 2)
    }
    expect(p.level()).toBe(middle.id)
    expect(t).toBeLessThan(4)
  })

  it('goes to the last level on a machine that holds nothing, and stays there', () => {
    const p = makeQualityPicker(levels)
    const seen = feed(p, worst.minFps / 3, 300)
    expect(seen).toEqual(levels.map((l) => l.id))
    expect(p.level()).toBe(worst.id)
  })

  it('steps down when the frame rate stays under minFps after it has settled', () => {
    const p = makeQualityPicker(levels)
    feed(p, best.minFps + 10, 20)
    expect(p.level()).toBe(best.id)
    feed(p, best.minFps - 6, PICKER.steadyWindowSeconds * PICKER.steadyWindowsUnder + 2)
    expect(p.level()).toBe(middle.id)
  })

  it('holds through a dip shorter than the windows it asks for', () => {
    const p = makeQualityPicker(levels)
    feed(p, best.minFps + 10, 20)
    for (let i = 0; i < 20; i++) {
      feed(p, best.minFps - 20, PICKER.steadyWindowSeconds * (PICKER.steadyWindowsUnder - 1) - 0.5)
      feed(p, best.minFps + 10, PICKER.steadyWindowSeconds * 2 + 0.5)
    }
    expect(p.level()).toBe(best.id)
  })

  it('holds through single long frames and through stalls', () => {
    const p = makeQualityPicker(levels)
    for (let i = 0; i < 6000; i++) {
      p.frame(at(best.minFps + 10))
      if (i % 40 === 0) p.frame(0.4)
      if (i % 500 === 0) p.frame(PICKER.stallSeconds + 3)
    }
    expect(p.level()).toBe(best.id)
  })

  it('never steps up, so it cannot loop', () => {
    let seed = 20261125
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let run = 0; run < 40; run++) {
      const p = makeQualityPicker(levels)
      let last = index(p.level())
      let changes = 0
      let rose = false
      let fps = 10 + next() * 80
      for (let i = 0; i < 20000; i++) {
        if (i % 97 === 0) fps = 5 + next() * 90
        const now = index(p.frame(at(fps)))
        if (now < last) rose = true
        if (now !== last) changes++
        last = now
      }
      expect(rose).toBe(false)
      expect(changes).toBeLessThanOrEqual(levels.length - 1)
    }
  })

  it('never goes back up when the machine gets fast again', () => {
    const p = makeQualityPicker(levels)
    feed(p, worst.minFps - 10, 60)
    expect(p.level()).toBe(worst.id)
    feed(p, 240, 600)
    expect(p.level()).toBe(worst.id)
  })

  it('leaves a level alone that the config, the address or the menu names', () => {
    const fixed = makeQualityPicker(levels, { fixed: best.id })
    expect(feed(fixed, 3, 120)).toEqual([best.id])
    expect(fixed.pinned()).toBe(true)
    const p = makeQualityPicker(levels)
    feed(p, worst.minFps - 10, 60)
    p.pin(best.id)
    expect(feed(p, 3, 120)).toEqual([best.id])
  })

  it('starts where it is told to and refuses a level that does not exist', () => {
    expect(makeQualityPicker(levels, { start: middle.id }).level()).toBe(middle.id)
    expect(() => makeQualityPicker(levels, { start: 'no-such-level' })).toThrow()
    expect(() => makeQualityPicker([])).toThrow()
  })

  it('takes the median, so one slow frame does not count as a slow machine', () => {
    expect(medianFps([0.01, 0.01, 0.01, 0.5])).toBeCloseTo(100)
    expect(medianFps([])).toBe(0)
  })
})

const uiFiles = (dir: string) => fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => path.join(dir, f))
const WORDLESS = ['src/ui/names.ts', 'src/ui/dev.ts', 'src/probe/labels.ts']

describe('the words of the interface', () => {
  it('resolves every word it shows to a key of the copy or the config', () => {
    for (const [id, key] of Object.entries(WORDS)) {
      const found = resolve(key)
      expect(found, key).toBeTypeOf('string')
      expect(found!.length, key).toBeGreaterThan(0)
      expect(word(id as WordId)).toBe(found)
    }
  })

  it('shows the copy exactly', () => {
    expect(word('skip')).toBe(copy.live.skip)
    expect(word('watchFilm')).toBe(copy.live.watchFilm)
    expect(word('touchTitle')).toBe(copy.live.touchOnly.title)
    expect(word('touchBody')).toBe(copy.live.touchOnly.body)
    expect(word('touchLink')).toBe(copy.live.touchOnly.link)
    expect(word('title')).toBe(copy.site.title)
    expect(word('careers')).toBe(config.employer.name)
  })

  it('uses every word of copy:live', () => {
    const used = new Set(Object.values(WORDS).map((k) => lookup(copy, k)))
    const all: string[] = []
    const walk = (v: unknown) => {
      if (typeof v === 'string') all.push(v)
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    walk(copy.live)
    for (const s of all) expect(used.has(s), s).toBe(true)
  })

  it('names the steps of the menu from copy:site.steps', () => {
    expect(stepNames()).toEqual([config.employer.name, ...copy.site.steps])
    expect(stepNames()).toHaveLength(6)
  })

  it('writes no word of its own on a control', () => {
    const files = [...uiFiles('src/ui'), ...uiFiles('src/probe')].filter((f) => !WORDLESS.includes(f.split(path.sep).join('/')))
    expect(files.length).toBeGreaterThan(4)
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/\.(textContent|innerText|innerHTML|placeholder|title|alt)\s*=\s*['"`](?!\$\{)[^'"`]/)
      expect(source, file).not.toMatch(/setAttribute\(\s*'(aria-label|title|alt|placeholder)'\s*,\s*['"`]/)
      expect(source, file).not.toMatch(/\.(append|prepend|after|before)\(\s*['"`]/)
      expect(source, file).not.toMatch(/createTextNode\(\s*['"`]/)
    }
  })

  it('keeps to the conventions: no em dash, no clock and no chance in the interface', () => {
    for (const file of [...uiFiles('src/ui'), ...uiFiles('src/probe')]) {
      const source = fs.readFileSync(file, 'utf8')
      expect(source, file).not.toContain('\u2014')
      expect(source, file).not.toMatch(/Math\.random|Date\.now|localStorage|sessionStorage|document\.cookie|\bfetch\(|XMLHttpRequest|sendBeacon/)
      if (!file.endsWith('clock.ts')) expect(source, file).not.toContain('performance.now')
    }
  })
})

describe('the names of the controls that show no word', () => {
  const source = fs.readFileSync('src/ui/interface.ts', 'utf8')

  it('is a short list of plain names', () => {
    expect(Object.keys(names).length).toBeLessThanOrEqual(4)
    for (const name of Object.values(names)) {
      expect(name.trim()).toBe(name)
      expect(name.length).toBeGreaterThan(0)
      expect(name).not.toMatch(/[!\u2014]/)
    }
  })

  it('holds a name only for a control that shows an icon and no word', () => {
    for (const id of Object.keys(names)) {
      const labelled = [...source.matchAll(new RegExp(`(\\w+)\\.setAttribute\\('aria-label', names\\.${id}\\)`, 'g'))]
      expect(labelled.length, id).toBe(1)
      const control = labelled[0]![1]!
      expect(source, id).not.toMatch(new RegExp(`\\b${control}\\.textContent\\s*=`))
    }
  })

  it('gives every wordless control a name, and no control with a word a second one', () => {
    const labels = [...source.matchAll(/setAttribute\('aria-label', ([\w.]+)\)/g)].map((m) => m[1])
    expect(labels.sort()).toEqual(Object.keys(names).map((id) => `names.${id}`).sort())
    const copyWords = new Set(Object.values(WORDS).map((k) => resolve(k)))
    for (const name of Object.values(names)) expect(copyWords.has(name)).toBe(false)
  })
})

describe('what the device says about itself', () => {
  it('calls a device touch-only by its pointers and its hover, never by its size', () => {
    expect(isTouchOnly({ anyHover: false, anyFine: false })).toBe(true)
    expect(isTouchOnly({ anyHover: true, anyFine: true })).toBe(false)
    expect(isTouchOnly({ anyHover: false, anyFine: true })).toBe(false)
    expect(isTouchOnly({ anyHover: true, anyFine: false })).toBe(false)
  })

  it('writes the time of the film as minutes and seconds', () => {
    expect(clockText(0)).toBe('0:00')
    expect(clockText(59.9)).toBe('0:59')
    expect(clockText(153)).toBe('2:33')
    expect(clockText(-4)).toBe('0:00')
  })
})

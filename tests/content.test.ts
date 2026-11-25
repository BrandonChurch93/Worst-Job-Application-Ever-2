import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import type { Config } from '../src/config'
import { contentProblems, copy, copyKeysOf, lookup, narration, spokenWords, text, timedLines } from '../src/copy'
import type { LayoutNode } from '../src/copy'

const cloneConfig = (): any => structuredClone(config)
const cloneCopy = (): any => structuredClone(copy)
const cloneNarration = (): any => structuredClone(narration)
const problems = (c: any = config, cp: any = copy, n: any = narration, layouts: Record<string, LayoutNode> = {}) => contentProblems(c as Config, cp, n, layouts)
const naming = (list: string[], ...words: string[]) => list.filter((p) => words.every((w) => p.includes(w)))
const MISSING = 'no-such-thing'
const EPS = 1e-6

const tree = (key: string): LayoutNode => ({
  id: 'page',
  kind: 'page',
  box: [0, 0, 1920, 1080],
  children: [
    { id: 'heading', kind: 'text', box: [100, 100, 800, 80], copy: 'copy:step1.heading' },
    { id: 'body', kind: 'group', box: [100, 200, 800, 600], children: [{ id: 'deep', kind: 'text', box: [100, 220, 800, 40], copy: key }] }
  ]
})

function roomiestPair() {
  const lines = timedLines(config, narration)
  const wps = config.audio.narratorMaxWordsPerSecond
  let best = { index: -1, room: 0, slack: 0 }
  for (let i = 0; i + 1 < lines.length; i++) {
    const slack = lines[i + 1]!.start - lines[i]!.end - config.audio.lineGapSeconds
    const exact = slack * wps
    const room = Math.floor(exact + EPS)
    const clear = Math.abs(exact - Math.round(exact)) > 0.01
    if (clear && room >= 1 && room > best.room) best = { index: i, room, slack }
  }
  return { ...best, line: lines[best.index]! }
}

function withWords(n: any, beat: string, index: number, more: number, word = 'more') {
  const sorted = n.film[beat].slice().sort((a: any, b: any) => a.at - b.at)
  sorted[index].text += Array.from({ length: more }, () => ` ${word}`).join('')
  return n
}

describe('the real content', () => {
  it('has no problems', () => {
    expect(problems()).toEqual([])
  })

  it('has no problems as unbroken clones', () => {
    expect(problems(cloneConfig(), cloneCopy(), cloneNarration(), { step1: tree('copy:step1.subline') })).toEqual([])
  })
})

describe('the beats of the narration', () => {
  it('has a beat the config does not have', () => {
    const n = cloneNarration()
    n.film[MISSING] = []
    const found = problems(config, copy, n)
    expect(naming(found, `"${MISSING}"`, 'does not have').length).toBe(1)
    expect(found.length).toBe(1)
  })

  it('lacks a beat the config has', () => {
    const n = cloneNarration()
    const beat = config.film.beats.find((b) => (n.film[b.id] ?? []).length === 0)!.id
    delete n.film[beat]
    const found = problems(config, copy, n)
    expect(naming(found, `"${beat}"`, 'lacks').length).toBe(1)
    expect(found.length).toBe(1)
  })

  it('lacks a beat that was added to the config', () => {
    const c = cloneConfig()
    const last = c.film.beats[c.film.beats.length - 1]
    const mid = last.from + (last.to - last.from) / 2
    c.film.beats.push({ id: `${last.unit}.${MISSING}`, unit: last.unit, from: mid, to: last.to, event: null })
    last.to = mid
    const found = problems(c)
    expect(naming(found, `"${last.unit}.${MISSING}"`, 'lacks').length).toBe(1)
  })

  it('has a beat that was taken out of the config', () => {
    const c = cloneConfig()
    const gone = c.film.beats.find((b: any) => (narration.film as any)[b.id].length === 0)
    c.film.beats = c.film.beats.filter((b: any) => b.id !== gone.id)
    const found = problems(c)
    expect(naming(found, `"${gone.id}"`, 'does not have').length).toBe(1)
  })
})

describe('a line that runs into the next', () => {
  it('fits with exactly the words there is room for, and not with one more', () => {
    const pair = roomiestPair()
    expect(pair.index).toBeGreaterThanOrEqual(0)
    const fits = withWords(cloneNarration(), pair.line.beat, pair.line.index, pair.room)
    expect(problems(config, copy, fits)).toEqual([])
    const tooLong = withWords(cloneNarration(), pair.line.beat, pair.line.index, pair.room + 1)
    const found = problems(config, copy, tooLong)
    expect(found.length).toBe(1)
    expect(naming(found, `of "${pair.line.beat}"`, pair.line.text, `${config.audio.lineGapSeconds} s between them`).length).toBe(1)
  })

  it('never counts the pause mark as a word', () => {
    const pair = roomiestPair()
    const n = withWords(cloneNarration(), pair.line.beat, pair.line.index, pair.room + 20, narration.pauseMark)
    expect(problems(config, copy, n)).toEqual([])
  })

  it('is found when the narrator is slowed down in the config', () => {
    const c = cloneConfig()
    c.audio.narratorMaxWordsPerSecond = config.audio.narratorMaxWordsPerSecond / 20
    const found = problems(c)
    expect(found.length).toBeGreaterThan(0)
    expect(naming(found, 'runs to', 'words a second').length).toBe(found.length)
  })

  it('is found when the gap asked for in the config is longer than the film', () => {
    const c = cloneConfig()
    c.audio.lineGapSeconds = c.film.maxSeconds
    const found = problems(c)
    expect(naming(found, `less than ${c.film.maxSeconds} s between them`).length).toBe(timedLines(config, narration).length - 1)
  })

  it('is found between two lines of one beat', () => {
    const n = cloneNarration()
    const beat = Object.keys(n.film).find((id) => n.film[id].length >= 2)!
    const sorted = n.film[beat].slice().sort((a: any, b: any) => a.at - b.at)
    sorted[1].at = sorted[0].at
    const found = problems(config, copy, n)
    expect(naming(found, `"${sorted[0].text}" of "${beat}"`).length + naming(found, `"${sorted[1].text}" of "${beat}"`).length).toBeGreaterThan(0)
  })

  it('is found when a line starts outside its beat', () => {
    const n = cloneNarration()
    const beat = Object.keys(n.film).find((id) => n.film[id].length >= 1)!
    n.film[beat][0].at = 1
    expect(naming(problems(config, copy, n), `"${beat}"`, 'not inside its beat').length).toBe(1)
  })
})

describe('the times of the lines', () => {
  const lines = timedLines(config, narration)
  const total = config.film.units.reduce((s, u) => s + u.seconds, 0)

  it('holds every line of the film once', () => {
    const count = Object.values(narration.film as Record<string, unknown[]>).reduce((s, l) => s + l.length, 0)
    expect(lines.length).toBe(count)
  })

  it('runs in film order and stays inside the film', () => {
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.start).toBeGreaterThan(lines[i - 1]!.start)
    expect(lines[0]!.start).toBeGreaterThanOrEqual(0)
    expect(lines[lines.length - 1]!.start).toBeLessThan(total)
  })

  it('starts each line inside its own beat, counted from the start of its page', () => {
    let pageStart = 0
    for (const u of config.film.units) {
      for (const b of config.film.beats.filter((x) => x.unit === u.id)) {
        for (const l of lines.filter((x) => x.beat === b.id)) {
          expect(l.start).toBeGreaterThanOrEqual(pageStart + b.from)
          expect(l.start).toBeLessThan(pageStart + b.to)
        }
      }
      pageStart += u.seconds
    }
  })

  it('gives each line its words at audio.narratorMaxWordsPerSecond', () => {
    for (const l of lines) {
      const words = l.text.split(/\s+/).filter((w) => w && w !== narration.pauseMark).length
      expect(l.end - l.start).toBeCloseTo(words / config.audio.narratorMaxWordsPerSecond, 9)
    }
  })
})

describe('spoken words', () => {
  it('counts words and leaves the pause mark out', () => {
    expect(spokenWords('Behold. / The applicant.', '/')).toBe(3)
    expect(spokenWords('  one   two  ', '/')).toBe(2)
    expect(spokenWords('/ / /', '/')).toBe(0)
    expect(spokenWords('', '/')).toBe(0)
  })
})

describe('the layout tree of a page', () => {
  it('names a copy key that does not exist', () => {
    const key = `copy:step1.${MISSING}`
    const found = problems(config, copy, narration, { step1: tree(key) })
    expect(naming(found, '"step1"', `"${key}"`, 'does not exist').length).toBe(1)
    expect(found.length).toBe(1)
  })

  it('names only keys that exist', () => {
    expect(problems(config, copy, narration, { step1: tree('copy:step1.subline'), step2: tree('step1.heading') })).toEqual([])
  })

  it('names a key whose words were taken out of the copy', () => {
    const cp = cloneCopy()
    delete cp.step1.heading
    const found = problems(config, cp, narration, { step1: tree('copy:step1.subline') })
    expect(naming(found, '"copy:step1.heading"', 'does not exist').length).toBe(1)
  })

  it('names a key that holds a group of words and not a string', () => {
    const found = problems(config, copy, narration, { step1: tree('copy:step1') })
    expect(naming(found, '"copy:step1"', 'does not exist').length).toBe(1)
  })

  it('is checked on every page given', () => {
    const found = problems(config, copy, narration, { step1: tree(`copy:${MISSING}.a`), step2: tree(`copy:${MISSING}.b`) })
    expect(naming(found, '"step1"', `"copy:${MISSING}.a"`).length).toBe(1)
    expect(naming(found, '"step2"', `"copy:${MISSING}.b"`).length).toBe(1)
  })

  it('gives up its copy keys in tree order', () => {
    expect(copyKeysOf(tree('copy:step1.subline'))).toEqual(['copy:step1.heading', 'copy:step1.subline'])
    expect(copyKeysOf({ id: 'bare', kind: 'box', box: [0, 0, 1, 1] })).toEqual([])
  })
})

describe('looking words up', () => {
  it('reads a key with and without the copy: mark', () => {
    expect(lookup(copy, 'step1.heading')).toBe(copy.step1.heading)
    expect(lookup(copy, 'copy:step1.heading')).toBe(copy.step1.heading)
    expect(text('step1.heading')).toBe(copy.step1.heading)
  })

  it('gives nothing for a key that is not there or is not a string', () => {
    expect(lookup(copy, `step1.${MISSING}`)).toBeUndefined()
    expect(lookup(copy, `step1.heading.${MISSING}`)).toBeUndefined()
    expect(lookup(copy, 'step1')).toBeUndefined()
    expect(lookup(null, 'step1.heading')).toBeUndefined()
  })

  it('throws by name when the site asks for words that are not there', () => {
    expect(() => text(`step1.${MISSING}`)).toThrow(`step1.${MISSING}`)
  })
})

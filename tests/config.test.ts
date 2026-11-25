import { describe, expect, it } from 'vitest'
import { config, configProblems, fail } from '../src/config'
import type { Checks, Config } from '../src/config'
import { eventCues } from '../src/audio/cues'
import { approvedFiles } from '../tools/lib/hashes.mjs'

const checks: Checks & { approved: string[] } = { approved: approvedFiles(process.cwd()) ?? [], eventCues }
const clone = (): any => structuredClone(config)
const problems = (c: any, k: Checks = checks) => configProblems(c as Config, k)
const naming = (list: string[], ...words: string[]) => list.filter((p) => words.every((w) => p.includes(w)))
const MISSING = 'no-such-thing'
const unitOf = (c: any, id: string) => c.film.units.find((u: any) => u.id === id)
const beatsOf = (c: any, unit: string) => c.film.beats.filter((b: any) => b.unit === unit).sort((a: any, b: any) => a.from - b.from)
const pageWithBeats = (c: any, least: number) => c.film.units.find((u: any) => beatsOf(c, u.id).length >= least)

describe('the real config', () => {
  it('has no problems', () => {
    expect(problems(config)).toEqual([])
  })

  it('has no problems as an unbroken clone', () => {
    expect(problems(clone())).toEqual([])
  })

  it('finds every approved image the config names', () => {
    expect(checks.approved.length).toBeGreaterThan(0)
    for (const k of config.keys) expect(checks.approved).toContain(k.image)
  })
})

describe('a key is missing', () => {
  for (const key of Object.keys(config)) {
    it(`top level: ${key}`, () => {
      const c = clone()
      delete c[key]
      expect(naming(problems(c), `"${key}"`, 'missing').length).toBeGreaterThan(0)
    })
  }

  const deep = [
    'film.fps', 'film.previewFps', 'film.maxSeconds', 'film.units', 'film.beats', 'cursor.armsOnlyInBeat', 'audio.sfx', 'audio.narratorMaxWordsPerSecond', 'audio.lineGapSeconds',
    'budget.runHours', 'budget.phaseHours', 'deliver.cardLoop.fps', 'deliver.cardLoop.candidates', 'references.approved', 'formats.hd.width', 'tiers.review.samplesPerFrame', 'sim.stepHz'
  ]
  for (const key of deep) {
    it(`inside: ${key}`, () => {
      const c = clone()
      const parts = key.split('.')
      const last = parts.pop()!
      const holder = parts.reduce((o, k) => o[k], c)
      expect(holder[last]).not.toBeUndefined()
      delete holder[last]
      expect(naming(problems(c), `"${key}"`, 'missing').length).toBeGreaterThan(0)
    })
  }
})

describe('a name that does not exist', () => {
  it('a beat names a missing unit', () => {
    const c = clone()
    const beat = c.film.beats[0]
    beat.unit = MISSING
    expect(naming(problems(c), `beat "${beat.id}"`, `unit "${MISSING}"`).length).toBeGreaterThan(0)
  })

  it('a key names a missing unit', () => {
    const c = clone()
    c.keys[0].unit = MISSING
    expect(naming(problems(c), `key "${c.keys[0].id}"`, `unit "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a key names a missing beat', () => {
    const c = clone()
    c.keys[0].beat = MISSING
    expect(naming(problems(c), `key "${c.keys[0].id}"`, `beat "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a key names a missing camera', () => {
    const c = clone()
    c.keys[0].camera = MISSING
    expect(naming(problems(c), `key "${c.keys[0].id}"`, `camera "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a sheet names a missing unit', () => {
    const c = clone()
    c.sheets[0].unit = MISSING
    expect(naming(problems(c), `sheet "${c.sheets[0].id}"`, `unit "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a sheet names a missing camera', () => {
    const c = clone()
    c.sheets[0].camera = MISSING
    expect(naming(problems(c), `sheet "${c.sheets[0].id}"`, `camera "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a still names a missing unit', () => {
    const c = clone()
    c.stills[0].unit = MISSING
    expect(naming(problems(c), `still "${c.stills[0].id}"`, `unit "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a still names a missing beat', () => {
    const c = clone()
    c.stills[0].beat = MISSING
    expect(naming(problems(c), `still "${c.stills[0].id}"`, `beat "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('a still names a missing camera', () => {
    const c = clone()
    c.stills[0].camera = MISSING
    expect(naming(problems(c), `still "${c.stills[0].id}"`, `camera "${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('the camera name film always exists, for a key, a sheet and a still', () => {
    const c = clone()
    expect(Object.keys(c.cameras)).not.toContain('film')
    c.keys[0].camera = 'film'
    c.sheets[0].camera = 'film'
    c.stills[0].camera = 'film'
    expect(problems(c)).toEqual([])
  })

  it('a camera taken out of the config is missed by whatever names it', () => {
    const c = clone()
    const key = c.keys.find((k: any) => k.camera !== 'film' && k.camera !== 'home')
    delete c.cameras[key.camera]
    expect(naming(problems(c), `key "${key.id}"`, `camera "${key.camera}"`).length).toBe(1)
  })
})

describe('the beats of a page', () => {
  it('do not start at zero', () => {
    const c = clone()
    const page = pageWithBeats(c, 2)
    const first = beatsOf(c, page.id)[0]
    first.from = first.to / 2
    const found = naming(problems(c), `"${page.id}"`, 'zero')
    expect(found.length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('leave a gap', () => {
    const c = clone()
    const page = pageWithBeats(c, 3)
    const [, second, third] = beatsOf(c, page.id)
    second.to = second.from + (second.to - second.from) / 2
    const found = naming(problems(c), 'gap', `"${second.id}"`, `"${third.id}"`)
    expect(found.length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('overlap', () => {
    const c = clone()
    const page = pageWithBeats(c, 3)
    const [, second, third] = beatsOf(c, page.id)
    second.to = third.from + (third.to - third.from) / 2
    const found = naming(problems(c), 'overlap', `"${second.id}"`, `"${third.id}"`)
    expect(found.length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('end before the page does', () => {
    const c = clone()
    const page = pageWithBeats(c, 2)
    const mine = beatsOf(c, page.id)
    const last = mine[mine.length - 1]
    last.to = last.from + (last.to - last.from) / 2
    const found = naming(problems(c), `"${page.id}"`, 'end at', `${page.seconds} s`)
    expect(found.length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('end after the page does', () => {
    const c = clone()
    const page = pageWithBeats(c, 2)
    const mine = beatsOf(c, page.id)
    mine[mine.length - 1].to += 1
    expect(naming(problems(c), `"${page.id}"`, 'end at', `${page.seconds} s`).length).toBe(1)
  })

  it('do not fit a page whose seconds were changed in film.units', () => {
    const c = clone()
    const page = pageWithBeats(c, 2)
    unitOf(c, page.id).seconds -= 1
    expect(naming(problems(c), `"${page.id}"`, 'end at').length).toBe(1)
  })

  it('are all gone', () => {
    const c = clone()
    const page = c.film.units[0]
    c.film.beats = c.film.beats.filter((b: any) => b.unit !== page.id)
    expect(naming(problems(c), `"${page.id}"`, 'no beats').length).toBe(1)
  })
})

describe('sums and rates', () => {
  it('film.units adds up to more than film.maxSeconds', () => {
    const c = clone()
    const total = c.film.units.reduce((s: number, u: any) => s + u.seconds, 0)
    c.film.maxSeconds = total
    expect(problems(c)).toEqual([])
    c.film.maxSeconds = total - 1
    expect(naming(problems(c), 'film.units', 'film.maxSeconds').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('budget.phaseHours adds up to more than budget.runHours', () => {
    const c = clone()
    c.budget.runHours -= 1
    expect(naming(problems(c), 'budget.phaseHours', 'budget.runHours').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('budget.phaseHours adds up to less than budget.runHours', () => {
    const c = clone()
    const first = Object.keys(c.budget.phaseHours)[0]!
    c.budget.phaseHours[first] -= 0.25
    expect(naming(problems(c), 'budget.phaseHours', 'budget.runHours').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('film.fps is not a whole multiple of film.previewFps', () => {
    const c = clone()
    c.film.previewFps = c.film.fps - 1
    expect(naming(problems(c), 'film.fps', 'film.previewFps').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('film.fps is not a whole multiple of deliver.cardLoop.fps', () => {
    const c = clone()
    c.deliver.cardLoop.fps = c.film.fps - 1
    expect(naming(problems(c), 'film.fps', 'deliver.cardLoop.fps').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('film.fps equal to both rates is accepted', () => {
    const c = clone()
    c.film.previewFps = c.film.fps
    c.deliver.cardLoop.fps = c.film.fps
    expect(problems(c)).toEqual([])
  })
})

describe('names that must be a beat, a key or a cue', () => {
  it('cursor.armsOnlyInBeat is not a beat', () => {
    const c = clone()
    c.cursor.armsOnlyInBeat = MISSING
    expect(naming(problems(c), 'cursor.armsOnlyInBeat', `"${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('an entry of deliver.cardLoop.candidates is not a key', () => {
    const c = clone()
    c.deliver.cardLoop.candidates.push(MISSING)
    expect(naming(problems(c), 'deliver.cardLoop.candidates', `"${MISSING}"`).length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('the table of events to cues names a cue that audio.sfx does not have', () => {
    const broken: Checks = { approved: checks.approved, eventCues: { ...eventCues, 'made-up-event': MISSING } }
    const found = naming(problems(clone(), broken), `"made-up-event"`, `cue "${MISSING}"`, 'audio.sfx')
    expect(found.length).toBe(1)
    expect(problems(clone(), broken).length).toBe(1)
  })

  it('a cue the table names is taken out of audio.sfx', () => {
    const c = clone()
    const [event, cue] = Object.entries(eventCues)[0]!
    c.audio.sfx = c.audio.sfx.filter((s: any) => s.id !== cue)
    expect(naming(problems(c), `"${event}"`, `cue "${cue}"`).length).toBe(1)
  })

  it('every cue the real table names is in audio.sfx', () => {
    const ids = config.audio.sfx.map((s) => s.id)
    for (const cue of Object.values(eventCues)) expect(ids).toContain(cue)
  })
})

describe('an approved image is missing', () => {
  it('the image of a key', () => {
    const image = config.keys[0]!.image
    const found = problems(clone(), { approved: checks.approved.filter((f) => f !== image), eventCues })
    expect(naming(found, `"${image}"`, 'missing').length).toBe(1)
    expect(found.length).toBe(1)
  })

  it('the image of a sheet', () => {
    const image = config.sheets[0]!.image
    const found = problems(clone(), { approved: checks.approved.filter((f) => f !== image), eventCues })
    expect(naming(found, `"${image}"`, 'missing').length).toBe(1)
  })

  it('an image named in references.approved', () => {
    const image = Object.values(config.references.approved)[0]!
    const found = problems(clone(), { approved: checks.approved.filter((f) => f !== image), eventCues })
    expect(naming(found, `"${image}"`, 'missing').length).toBe(1)
  })

  it('a key names an image that is not there', () => {
    const c = clone()
    c.keys[0].image = `references/approved/${MISSING}.png`
    expect(naming(problems(c), MISSING, 'missing').length).toBe(1)
    expect(problems(c).length).toBe(1)
  })

  it('no approved image at all', () => {
    const images = new Set([...config.keys.map((k) => k.image), ...config.sheets.map((s) => s.image), ...Object.values(config.references.approved)])
    const found = problems(clone(), { approved: [], eventCues })
    expect(naming(found, 'approved image', 'missing').length).toBe(images.size)
  })
})

describe('failing loudly', () => {
  it('throws with every problem in the message', () => {
    const c = clone()
    c.cursor.armsOnlyInBeat = MISSING
    c.budget.runHours += 1
    const list = problems(c)
    expect(list.length).toBe(2)
    let message = ''
    try {
      fail(list)
    } catch (e) {
      message = (e as Error).message
    }
    for (const p of list) expect(message).toContain(p)
    expect(message).toContain('2 problems')
  })
})

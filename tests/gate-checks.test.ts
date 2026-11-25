import { describe, expect, it } from 'vitest'
import { hashOf } from '../tools/lib/film-parts.mjs'
import { anchoredRecord, codeOf, coveredUnits as covered, filmMoments, flaggedPixels, hashFacts, hashOfBytes, hosting, memoryAndCounts, recordedAgain, standInTests, unitStates as statesIn, unknownUnits } from '../tools/lib/gate-checks.mjs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
type States = Record<string, { state: string; rounds: number }>
const unitStates = statesIn as (text: string) => States
const coveredUnits = covered as (o: { states: States; named?: string[]; phase: number; units: string[] }) => { unit: string; why: string }[]
const A = 'a'.repeat(40)
const B = 'b'.repeat(40)
const then: Record<string, Record<string, string>> = {
  [A]: { 'src/x.ts': 'export const part = "x stand-in"', 'src/y.ts': 'export const y = 1' },
  [B]: { 'src/x.ts': 'export const part = "x stand-in"', 'src/y.ts': 'export const y = 1', 'src/real/x.ts': 'export const maker = null' },
}
const show = (commit: string, file: string) => (then[commit]?.[file] === undefined ? null : Buffer.from(then[commit]![file]!))
const reader = (now: Record<string, string>) => (file: string) => (now[file] === undefined ? null : Buffer.from(now[file]!))
const untouched = { ...then[B]! }
const made = { ...then[B]!, 'src/real/x.ts': 'export const maker = { key: () => "x" }' }
const recorded = (files: string[]) => {
  const r = anchoredRecord(files, [A, B], show)
  return { name: 'x', unit: 'step1', state: 'stand-in', files: r.files, standInHash: r.hash, hashAt: r.hashAt, commit: B }
}
const clean = { frames: undefined, pixels: [], reported: false }
const verdict = (part: ReturnType<typeof recorded>, now: Record<string, string>, extra = {}) => standInTests(part, { ...hashFacts(part, reader(now), show, [A, B]), ...clean, ...extra })

describe('the hash of files', () => {
  it('is the hash the register makes', () => {
    const files = ['tools/lib/paths.mjs', 'package.json']
    expect(hashOfBytes(files, reader({}))).toBeNull()
    const fs = require('node:fs')
    expect(hashOfBytes(files, (f: string) => fs.readFileSync(path.join(root, f)))).toBe(hashOf(root, files))
  })
  it('is empty for no files, and a record keeps its files in one order', () => {
    expect(hashOfBytes([], reader(untouched))).toBe('')
    expect(anchoredRecord(['src/y.ts', 'src/x.ts', 'src/y.ts'], [A, B], show)).toEqual(anchoredRecord(['src/x.ts', 'src/y.ts'], [A, B], show))
  })
})

describe('a record against the commits in which every part was a stand-in', () => {
  it('takes each file from the first commit that holds it', () => {
    const r = anchoredRecord(['src/real/x.ts', 'src/x.ts'], [A, B], show)
    expect(r.hashAt).toEqual({ 'src/real/x.ts': B, 'src/x.ts': A })
    expect(r.hash).toBe(hashOfBytes(['src/real/x.ts', 'src/x.ts'], reader(untouched)))
  })
  it('makes no hash of a file that no such commit holds, nor of no files', () => {
    const r = anchoredRecord(['src/x.ts', 'src/new.ts'], [A, B], show)
    expect(r.absent).toEqual(['src/new.ts'])
    expect(r.hash).toBeNull()
    expect(anchoredRecord([], [A, B], show).hash).toBeNull()
  })
  it('can be made again from what it names', () => {
    const p = recorded(['src/x.ts', 'src/real/x.ts'])
    expect(recordedAgain(p, show)).toBe(p.standInHash)
    expect(recordedAgain({ ...p, hashAt: { ...p.hashAt, 'src/real/x.ts': A } }, show)).toBeNull()
    expect(recordedAgain({ ...p, hashAt: undefined }, show)).toBeNull()
  })
})

describe('the three tests of G13', () => {
  const finished = { ...recorded(['src/x.ts', 'src/real/x.ts']), state: 'finished' }
  it('passes a part whose state is not stand-in, whose files changed and that nothing flags', () => {
    expect(verdict(finished, made)).toEqual([])
  })
  it('fails a part whose state is stand-in, whatever else holds', () => {
    const why = verdict({ ...finished, state: 'stand-in' }, made)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^test 1/)
  })
  it('fails a state that is not a state', () => {
    expect(verdict({ ...finished, state: 'done' }, made)[0]).toMatch(/^test 1/)
  })
  it('fails a part whose files are what they were, for every state', () => {
    for (const state of ['fallback', 'general fallback', 'last resort', 'finished']) {
      const why = verdict({ ...finished, state }, untouched)
      expect(why).toHaveLength(1)
      expect(why[0]).toMatch(/^test 2: its files .* are byte for byte/)
    }
  })
  it('fails a part with no recorded hash', () => {
    for (const p of [{ ...finished, files: [], standInHash: '', hashAt: undefined }, { ...finished, standInHash: null as unknown as string }, { ...finished, files: [] }]) {
      const why = verdict(p as ReturnType<typeof recorded>, made)
      expect(why).toHaveLength(1)
      expect(why[0]).toMatch(/^test 2: no stand-in hash is recorded/)
    }
  })
  it('fails a part whose recorded hash is not the hash of its files at the commits it names', () => {
    const why = verdict({ ...finished, standInHash: 'f'.repeat(64) }, made)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^test 2: its recorded hash is not the hash/)
  })
  it('fails a part whose record names a commit that is not there', () => {
    const why = verdict({ ...finished, hashAt: { 'src/x.ts': 'c'.repeat(40), 'src/real/x.ts': B } }, made)
    expect(why[0]).toMatch(/^test 2: its recorded hash cannot be made again/)
  })
  it('fails a part one of whose recorded files is gone', () => {
    const now: Record<string, string> = { ...made }
    delete now['src/x.ts']
    const why = verdict(finished, now)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^test 2: src\/x\.ts is recorded for it and gone/)
  })
  it('fails an old record whose files are what they were when every part was a stand-in', () => {
    const old = { name: 'x', unit: 'step1', state: 'finished', files: ['src/x.ts'], standInHash: 'e'.repeat(64), commit: A } as unknown as ReturnType<typeof recorded>
    expect(verdict(old, untouched)[0]).toMatch(/^test 2: its files .* at aaaaaaa, when every part was a stand-in/)
  })
  it('fails an old record that names no commit, though its files changed: a file can change for a reason that is not the part', () => {
    const old = { name: 'x', unit: 'step1', state: 'finished', files: ['src/x.ts'], standInHash: 'e'.repeat(64), commit: A } as unknown as ReturnType<typeof recorded>
    const why = verdict(old, { ...untouched, 'src/x.ts': 'export const part = "x"' })
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^test 2: its record names no commit.*npm run parts -- --record x --files a,b --replace/)
  })
  it('fails a part the page reports in a frame of the film', () => {
    const why = verdict(finished, made, { frames: { count: 1, of: 960, first: 906, beats: ['step1.keyboard'] } })
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^test 3: the page reports it as a stand-in in 1 of 960 film frames, first in frame 906/)
  })
  it('fails a part the standins view shows, and one the page lists after the pictures', () => {
    expect(verdict(finished, made, { pixels: [{ still: 'key:step1-fire', pixels: 1 }] })[0]).toMatch(/^test 3: the standins view shows it flagged in key:step1-fire \(1 pixels\)/)
    expect(verdict(finished, made, { pixels: [{ still: 'key:step1-fire', pixels: 0 }] })).toEqual([])
    expect(verdict(finished, made, { reported: true })[0]).toMatch(/^test 3: info\(\)\.standIns lists it/)
  })
  it('gives every reason at once', () => {
    const why = verdict({ ...finished, state: 'stand-in' }, untouched, { frames: { count: 4, of: 10, first: 0, beats: ['a'] }, pixels: [{ still: 's', pixels: 9 }] })
    expect(why.map((w) => w.slice(0, 6))).toEqual(['test 1', 'test 2', 'test 3', 'test 3'])
  })
})

describe('what G13 covers', () => {
  const units = ['marketing', 'step1', 'step2', 'site', 'film']
  const text = '# Progress\n\n## Units\n\n| Unit | State | Rounds | Scores | Fallbacks | Notes |\n|---|---|---|---|---|---|\n| `marketing` | not started | 0 | | | |\n| `step1` | finished | 3 | | | |\n| `step2` | in progress | 1 | | | |\n| `site` | not started | 0 | | | |\n| `film` | not started | 0 | | | |\n\n## Log\n\n| `boss` | finished | 9 | | | |\n'
  it('reads the units table and nothing after it', () => {
    expect(unitStates(text)).toEqual({ marketing: { state: 'not started', rounds: 0 }, step1: { state: 'finished', rounds: 3 }, step2: { state: 'in progress', rounds: 1 }, site: { state: 'not started', rounds: 0 }, film: { state: 'not started', rounds: 0 } })
    expect(unitStates('nothing here')).toEqual({})
  })
  it('covers the units marked finished and the ones named', () => {
    const states = unitStates(text)
    expect(coveredUnits({ states, phase: 3, units }).map((u) => u.unit)).toEqual(['step1'])
    expect(coveredUnits({ states, named: ['step2'], phase: 3, units }).map((u) => u.unit)).toEqual(['step2', 'step1'])
    expect(coveredUnits({ states: {}, phase: 3, units })).toEqual([])
  })
  it('covers every unit but film once a round has run on site in Phase 5, and every unit once one has run on film in Phase 6', () => {
    const states = { ...unitStates(text), site: { state: 'in progress', rounds: 1 } }
    expect(coveredUnits({ states, phase: 4, units }).map((u) => u.unit)).toEqual(['step1'])
    expect(coveredUnits({ states, phase: 5, units }).map((u) => u.unit).sort()).toEqual(['marketing', 'site', 'step1', 'step2'])
    expect(coveredUnits({ states: { ...states, film: { state: 'not started', rounds: 1 } }, phase: 6, units }).map((u) => u.unit).sort()).toEqual([...units].sort())
  })
  it('knows a unit that does not exist', () => {
    expect(unknownUnits(['step1', 'step9'], units)).toEqual(['step9'])
  })
  it('reads the table of this repository', () => {
    const fs = require('node:fs')
    const states = unitStates(fs.readFileSync(path.join(root, 'kit', 'PROGRESS.md'), 'utf8'))
    for (const u of ['marketing', 'step1', 'step2', 'pinball', 'boss', 'decision', 'site', 'film']) expect(['not started', 'in progress', 'finished']).toContain(states[u]?.state)
  })
})

describe('the reading of the standins view', () => {
  const colours = { keyboard: [0.9, 0.2, 0.8], type: [0.5, 0.35, 0.4] } as Record<string, number[]>
  const grounds = [[0.02, 0.02, 0.02]]
  const px = (...c: number[][]) => Uint8Array.from(c.flatMap((x) => x.map(codeOf)))
  it('writes a linear value as its sRGB code', () => {
    expect([codeOf(0), codeOf(1), codeOf(0.02), codeOf(0.2140411)]).toEqual([0, 255, 39, 127])
  })
  it('counts the pixels of each flag colour and takes plain ground for nothing', () => {
    const data = px(colours.keyboard!, colours.keyboard!, colours.type!, grounds[0]!)
    expect(flaggedPixels(data, 4, 1, 3, colours, grounds)).toEqual({ counts: { keyboard: 2, type: 1 }, other: 0 })
  })
  it('counts a pixel that is no flag colour and no ground as unread', () => {
    const data = px([0.6, 0.6, 0.1], grounds[0]!)
    expect(flaggedPixels(data, 2, 1, 3, colours, grounds)).toEqual({ counts: {}, other: 1 })
  })
  it('counts a pixel for both of two parts whose colours cannot be told apart', () => {
    const data = px([0.9, 0.2, 0.8])
    expect(flaggedPixels(data, 1, 1, 3, { a: [0.9, 0.2, 0.8], b: [0.9, 0.2, 0.801] }, grounds).counts).toEqual({ a: 1, b: 1 })
  })
})

describe('the rule of G15', () => {
  const limits = { assetSets: { web: { maxTextureMb: 700 }, full: { maxTextureMb: 2400 } }, perf: { maxTriangles: { high: 3000000, medium: 1500000, low: 700000 }, maxDrawCalls: { high: 600, medium: 450, low: 300 } }, levels: ['high', 'medium', 'low'] }
  const n = (triangles: number, drawCalls: number) => ({ triangles, drawCalls, at: 'rest' })
  const page = (over = {}) => ({ page: 'step1', textureMb: { web: 120, full: 300 }, counts: { high: n(900000, 280), medium: n(600000, 250), low: n(300000, 200) }, ...over })
  it('passes a page inside every limit and names the most it saw', () => {
    const v = memoryAndCounts([page()], limits)
    expect(v.pass).toBe(true)
    expect(v.most).toEqual({ textureMb: 300, triangles: 900000, drawCalls: 280 })
  })
  it('passes a number that is exactly the limit', () => {
    expect(memoryAndCounts([page({ textureMb: { web: 700, full: 2400 }, counts: { high: n(3000000, 600), medium: n(1500000, 450), low: n(700000, 300) } })], limits).pass).toBe(true)
  })
  it('fails textures over the limit of one asset set, by name', () => {
    const v = memoryAndCounts([page({ textureMb: { web: 700.1, full: 300 } })], limits)
    expect(v.pass).toBe(false)
    expect(v.detail).toEqual(['step1: 700.1 MB of textures in the asset set web, over assetSets.web.maxTextureMb (700)'])
  })
  it('holds each level to its own limit', () => {
    const v = memoryAndCounts([page({ counts: { high: n(900000, 280), medium: n(900000, 280), low: n(900000, 310) } })], limits)
    expect(v.detail).toEqual(['step1: 900000 triangles in rest at the level low, over perf.maxTriangles.low (700000)', 'step1: 310 draw calls in rest at the level low, over perf.maxDrawCalls.low (300)'])
  })
  it('fails a reading of nothing: the zero of a placeholder, a level not drawn, an asset set not opened, no page', () => {
    expect(memoryAndCounts([page({ textureMb: { web: 0, full: 0 } })], limits).detail).toHaveLength(2)
    expect(memoryAndCounts([page({ textureMb: { web: 120 } })], limits).detail[0]).toMatch(/full is missing/)
    expect(memoryAndCounts([page({ counts: { high: n(900000, 280), medium: n(0, 0) } })], limits).detail).toHaveLength(2)
    expect(memoryAndCounts([], limits).pass).toBe(false)
  })
})

describe('the rule of G16', () => {
  const head = 'c'.repeat(40)
  const row = (name: string, got: number | null, limit: number) => ({ name, got, limit, unit: 'MB', inside: got !== null && got <= limit })
  const report = (over = {}) => ({ commit: head, verdict: { rows: [row('host.maxShippedMb', 12, 95), row('host.maxFileMb', 3, 20)], inside: true }, firstLoad: { state: { ready: true, mode: null }, problems: [], failed: [], missing: [] }, ...over })
  const live = { ready: true, page: 'marketing', problems: [] }
  it('passes a report of this commit that is inside every limit, with the careers page open in live mode', () => {
    expect(hosting(report(), { head, careers: 'marketing', live })).toEqual({ pass: true, detail: [] })
  })
  it('fails with no report, a report of another commit, or a report with no verdict', () => {
    expect(hosting(null, { head, careers: 'marketing', live }).pass).toBe(false)
    expect(hosting(report({ commit: 'd'.repeat(40) }), { head, careers: 'marketing', live }).detail[0]).toMatch(/is of the commit ddddddd/)
    expect(hosting(report({ verdict: undefined }), { head, careers: 'marketing', live }).pass).toBe(false)
  })
  it('fails a limit that is passed or was not measured', () => {
    const v = hosting(report({ verdict: { rows: [row('host.maxShippedMb', 96, 95), row('host.firstLoadMaxMb', null, 16)] } }), { head, careers: 'marketing', live })
    expect(v.detail).toEqual(['host.maxShippedMb: 96 MB against 95 MB', 'host.firstLoadMaxMb: not measured against 16 MB'])
  })
  it('fails when live mode does not start, opens another page or reports an error', () => {
    expect(hosting(report(), { head, careers: 'marketing', live: { ready: false, why: 'no run' } }).detail[0]).toMatch(/did not start in live mode: no run/)
    expect(hosting(report(), { head, careers: 'marketing', live: { ...live, page: 'step1' } }).detail[0]).toMatch(/opens the page "step1" in live mode/)
    expect(hosting(report(), { head, careers: 'marketing', live: { ...live, problems: ['boom'] } }).pass).toBe(false)
    expect(hosting(report({ firstLoad: { state: { ready: false, why: 'x' } } }), { head, careers: 'marketing', live }).pass).toBe(false)
  })
})

describe('filmMoments', () => {
  const beats = [
    { id: 'a.one', unit: 'a', from: 0, to: 2 },
    { id: 'a.two', unit: 'a', from: 2, to: 3.5 },
    { id: 'b.one', unit: 'b', from: 0, to: 1 }
  ]
  const units = [{ id: 'a', first: 100, last: 309 }]

  it('gives one moment a second and the last frame, each with its beat and its place in the beat', () => {
    const m = filmMoments(units, beats, 60)
    expect(m.map((x) => x.frame)).toEqual([100, 160, 220, 280, 309])
    expect(m.map((x) => x.beat)).toEqual(['a.one', 'a.one', 'a.two', 'a.two', 'a.two'])
    expect(m[1]!.at).toBeCloseTo(0.5, 6)
    expect(m[2]!.at).toBe(0)
    expect(m[3]!.at).toBeCloseTo(2 / 3, 5)
  })

  it('adds the frames it is told of, once, and leaves out a frame of another unit', () => {
    const m = filmMoments(units, beats, 60, [130, 160, 5000])
    expect(m.map((x) => x.frame)).toEqual([100, 130, 160, 220, 280, 309])
    expect(m[1]).toMatchObject({ unit: 'a', beat: 'a.one', at: 0.25 })
  })

  it('gives nothing for a unit without a beat', () => {
    expect(filmMoments([{ id: 'c', first: 0, last: 10 }], beats, 60)).toEqual([])
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isWholePreview, keptNames, keptRecord, megabytes, previewFrames, reasonsAgainst, reasonsFromProbe, tooLarge } from '../tools/lib/film-keep.mjs'
import { filmName } from '../tools/lib/film-plan.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const pages: Record<string, string> = {}
for (const u of cfg.film.units) pages[u.id] = `hash-of-${u.id}`
const info = { engineHash: 'engine', sharedHash: 'shared', pageHashes: pages }
const frames = previewFrames(cfg)
const record = (over: Record<string, unknown> = {}) => ({
  what: { film: { which: 'b', rate: cfg.film.previewFps, step: cfg.film.fps / cfg.film.previewFps } }, engineHash: 'engine', sharedHash: 'shared', pageHashes: { ...pages },
  format: 'preview', tier: 'draft', assets: 'full', diagnostic: 'beauty', complete: true, opening: false, frames, sound: null, ...over
})

describe('the preview film that is kept', () => {
  it('is named as export.files names it', () => {
    expect(keptNames(cfg)).toEqual({ a: cfg.export.files.previewA, b: cfg.export.files.previewB })
  })

  it('is a whole film in formats.preview, never a range or a diagnostic view', () => {
    expect(isWholePreview(`${filmName('b', 'preview', 'draft', 'beauty', null)}.mp4`, 'b', cfg)).toBe(true)
    expect(isWholePreview(`${filmName('b', 'preview', 'review', 'beauty', null)}.mp4`, 'b', cfg)).toBe(true)
    expect(isWholePreview(`${filmName('b', 'preview', 'draft', 'beauty', { first: 1196, last: 1262 })}.mp4`, 'b', cfg)).toBe(false)
    expect(isWholePreview(`${filmName('b', 'preview', 'draft', 'parts', null)}.mp4`, 'b', cfg)).toBe(false)
    expect(isWholePreview(`${filmName('b', 'hd', 'draft', 'beauty', null)}.mp4`, 'b', cfg)).toBe(false)
    expect(isWholePreview(`${filmName('a', 'preview', 'draft', 'beauty', null)}.mp4`, 'b', cfg)).toBe(false)
    expect(isWholePreview(`${filmName('b', 'preview', 'draft', 'beauty', null)}.json`, 'b', cfg)).toBe(false)
  })

  it('has the frames of the film at film.previewFps', () => {
    // Compared rounded: the unit lengths are decimal seconds and their sum is a float (214.79999999999998 for 214.8), so the product falls a hair short of the whole number of frames.
    expect(frames).toBe(Math.round((cfg.film.units.reduce((n: number, u: { seconds: number }) => n + u.seconds, 0) * cfg.film.fps) / (cfg.film.fps / cfg.film.previewFps)))
  })

  it('is kept when its record is of this build and whole', () => {
    expect(reasonsAgainst(record(), info, cfg, 'b')).toEqual([])
  })

  it('is refused, with the reason, when a page or the engine changed since', () => {
    const first = cfg.film.units[0].id
    expect(reasonsAgainst(record({ engineHash: 'older' }), info, cfg, 'b')[0]).toContain('the engine')
    expect(reasonsAgainst(record({ pageHashes: { ...pages, [first]: 'older' } }), info, cfg, 'b')[0]).toContain(first)
    const less = { ...pages }
    delete less[first]
    expect(reasonsAgainst(record({ pageHashes: less }), info, cfg, 'b')[0]).toContain(first)
    expect(reasonsAgainst(record({ sharedHash: 'older' }), info, cfg, 'b')[0]).toContain('shared')
  })

  it('is refused when it is not the whole film at the preview rate', () => {
    expect(reasonsAgainst(record({ complete: false, missingUnits: ['boss'], frames: frames - 10 }), info, cfg, 'b').join(' ')).toContain('lacks boss')
    expect(reasonsAgainst(record({ frames: frames - 1 }), info, cfg, 'b').length).toBe(1)
    expect(reasonsAgainst(record({ what: { film: { which: 'b', rate: cfg.film.fps } } }), info, cfg, 'b').join(' ')).toContain('previewFps')
    expect(reasonsAgainst(record({ what: { film: { which: 'b', rate: cfg.film.previewFps, first: 0, last: 100 } } }), info, cfg, 'b').join(' ')).toContain('range')
    expect(reasonsAgainst(record({ what: { still: {} } }), info, cfg, 'b')).toEqual(['its record does not say it is a film'])
    expect(reasonsAgainst(record({ diagnostic: 'parts' }), info, cfg, 'b').length).toBe(1)
    expect(reasonsAgainst(record({ format: 'hd' }), info, cfg, 'b').length).toBe(1)
  })

  it('as film A holds the opening in front of film B', () => {
    const a = record({ what: { film: { which: 'a', rate: cfg.film.previewFps } }, opening: true, frames: frames + 358 })
    expect(reasonsAgainst(a, info, cfg, 'a')).toEqual([])
    expect(reasonsAgainst(a, info, cfg, 'b').length).toBeGreaterThan(0)
    expect(reasonsAgainst(record({ what: { film: { which: 'a', rate: cfg.film.previewFps } } }), info, cfg, 'a').length).toBe(1)
    const kept = keptRecord(a, cfg, 'a', { commit: 'abc', commitClean: true, from: 'out/work/film-a-preview-draft.mp4', sha256: 'f', bytes: 1048576, probe: { codec: 'h264', width: 960, height: 540, seconds: 1, mbps: 4, audio: null } })
    expect(kept.openingFrames).toBe(358)
    expect(kept.file).toBe(cfg.export.files.previewA)
  })

  it('must be the file its record describes', () => {
    const f = cfg.formats.preview
    const good = { frames, width: f.width, height: f.height, rate: cfg.film.previewFps }
    expect(reasonsFromProbe(good, record(), cfg)).toEqual([])
    expect(reasonsFromProbe({ ...good, frames: frames - 1 }, record(), cfg).length).toBe(1)
    expect(reasonsFromProbe({ ...good, width: 1920, height: 1080 }, record(), cfg).length).toBe(1)
    expect(reasonsFromProbe({ ...good, rate: cfg.film.fps }, record(), cfg).length).toBe(1)
  })

  it('carries the hashes, the commit, the format, the tier, the rate, the frames and the hash of the file', () => {
    const kept = keptRecord(record(), cfg, 'b', { commit: 'abc', commitClean: false, from: 'out/work/film-b-preview-draft.mp4', sha256: 'f00', bytes: 3 * 1048576, probe: { codec: 'h264', width: 960, height: 540, seconds: 153, mbps: 4, audio: null } })
    expect(kept).toMatchObject({ film: 'b', file: cfg.export.files.previewB, engineHash: 'engine', pageHashes: pages, commit: 'abc', commitClean: false, format: 'preview', tier: 'draft', rate: cfg.film.previewFps, frames, sha256: 'f00', megabytes: 3, openingFrames: 0 })
  })

  it('is not kept at or over repo.maxFileMb', () => {
    expect(tooLarge(cfg.repo.maxFileMb * 1048576, cfg)).toBe(true)
    expect(tooLarge(cfg.repo.maxFileMb * 1048576 - 1, cfg)).toBe(false)
    expect(megabytes(1572864)).toBe(1.5)
  })
})

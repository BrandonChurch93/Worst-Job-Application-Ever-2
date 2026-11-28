import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { around, bitrateOf, chunkName, clip, encodeArgs, filmName, filmPlan, frameCountOf, framesIn, gridOf, loopPieceName, parsePiece, pieceName, piecesOf, sameBuild, seqName, sheetGrid, sheetsOf, spread, stepOf, tile, timeLabel, unitsShown } from '../tools/lib/film-plan.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const plan = filmPlan(cfg)
const step = stepOf(cfg.film.fps, cfg.film.previewFps)
const seconds = cfg.film.units.reduce((n: number, u: { seconds: number }) => n + u.seconds, 0)

describe('the film from the config', () => {
  it('has every frame of every page once and in order', () => {
    expect(plan.frameCount).toBe(Math.round(seconds * cfg.film.fps))
    expect(plan.units[0].first).toBe(0)
    for (let i = 1; i < plan.units.length; i++) expect(plan.units[i].first).toBe(plan.units[i - 1].last + 1)
    expect(plan.units[plan.units.length - 1].last).toBe(plan.frameCount - 1)
  })

  it('puts every beat inside its page', () => {
    for (const b of plan.beats) {
      const u = plan.units.find((x: { id: string }) => x.id === b.unit)!
      expect(b.first).toBeGreaterThanOrEqual(u.first)
      expect(b.last).toBeLessThanOrEqual(u.last)
    }
  })
})

describe('the frames at the preview rate', () => {
  it('are the indices that are multiples of film.fps divided by film.previewFps', () => {
    expect(step).toBe(cfg.film.fps / cfg.film.previewFps)
    const frames = framesIn(0, plan.frameCount - 1, step)
    expect(frames.length).toBe(Math.round(seconds * cfg.film.previewFps))
    expect(frames.every((f: number) => f % step === 0)).toBe(true)
    expect(framesIn(1195, 1262, 2)).toEqual(framesIn(1196, 1262, 2))
    expect(framesIn(1195, 1262, 2)[0]).toBe(1196)
    expect(framesIn(3, 3, 2)).toEqual([])
    expect(framesIn(0, 9, 1).length).toBe(10)
  })

  it('refuses a rate that does not divide the film rate', () => {
    expect(() => stepOf(60, 25)).toThrow()
    expect(stepOf(60, 60)).toBe(1)
    expect(stepOf(60, 30)).toBe(2)
  })

  it('draws a range in to rendered frames', () => {
    expect(clip(1195, 1263, 2)).toEqual({ first: 1196, last: 1262 })
    expect(clip(5, 5, 2)).toBeNull()
  })
})

describe('the pieces of a page', () => {
  const max = 300

  it('cover the page exactly, in order, none over the limit', () => {
    for (const u of plan.units) {
      const grid = gridOf(u, step, max)
      const all = grid.flatMap((p: { first: number; last: number }) => framesIn(p.first, p.last, step))
      expect(all).toEqual(framesIn(u.first, u.last, step))
      for (const p of grid) expect(frameCountOf(p, step)).toBeLessThanOrEqual(max)
      expect(grid.length).toBe(Math.ceil(framesIn(u.first, u.last, step).length / max))
    }
  })

  it('never ask for more frames on disk than the sandbox allows', () => {
    for (const u of plan.units) for (const p of gridOf(u, step, cfg.sandbox.maxFramesOnDisk)) expect(frameCountOf(p, step)).toBeLessThanOrEqual(cfg.sandbox.maxFramesOnDisk)
  })

  it('are cut down to a range and still sit on the grid', () => {
    const u = plan.units[1]
    const grid = gridOf(u, step, max)
    const range = { first: u.first + 101, last: grid[1].first + 51 }
    const cut = piecesOf(u, step, max, range)
    expect(cut.length).toBe(2)
    expect(cut[0].first).toBe(u.first + 102)
    expect(cut[0].last).toBe(grid[0].last)
    expect(cut[1].first).toBe(grid[1].first)
    expect(cut[1].last).toBe(grid[1].first + 50)
    expect(piecesOf(u, step, max, { first: u.last + 1, last: u.last + 50 })).toEqual([])
  })
})

describe('joining what exists', () => {
  const u = plan.units[2]
  const grid = gridOf(u, step, 200)

  it('finds a whole page in its pieces', () => {
    const t = tile([...grid].reverse(), u.first, u.last, step)
    expect(t.whole).toBe(true)
    expect(t.pieces).toEqual(grid)
  })

  it('names what is missing, so a stopped run carries on from there', () => {
    const have = [grid[0], grid[2]]
    const t = tile(have, u.first, u.last, step)
    expect(t.whole).toBe(false)
    expect(t.missing[0]).toEqual({ first: grid[1].first, last: grid[1].last })
    const rest = t.missing.flatMap((m: { first: number; last: number }) => piecesOf(u, step, 200, m))
    expect(tile([...have, ...rest], u.first, u.last, step).whole).toBe(true)
  })

  it('never uses a frame twice and prefers the longer piece', () => {
    const half = { unit: u.id, first: u.first, last: grid[0].first + 20 }
    const t = tile([half, ...grid], u.first, u.last, step)
    expect(t.whole).toBe(true)
    expect(t.pieces).toEqual(grid)
  })

  it('takes pieces cut at other places, as another machine may send them', () => {
    const mid = u.first + 400
    const t = tile([{ unit: u.id, first: u.first, last: mid }, { unit: u.id, first: mid + step, last: u.last - 1 }], u.first, u.last, step)
    expect(t.whole).toBe(true)
    expect(t.pieces.length).toBe(2)
  })

  it('reports an empty page as missing whole', () => {
    const t = tile([], u.first, u.last, step)
    expect(t.missing).toEqual([{ first: u.first, last: u.last - 1 }])
  })
})

describe('the names of the files', () => {
  it('carry the page, the range, the format and the tier', () => {
    expect(pieceName('step1', 840, 1438, 'preview', 'draft')).toBe('step1-000840-001438-preview-draft')
    expect(chunkName('step1', 'preview', 'draft')).toBe('step1-preview-draft')
    expect(chunkName('step1', 'hd', 'review', 'normals')).toBe('step1-hd-review-normals')
    expect(filmName('b', 'preview', 'draft')).toBe('film-b-preview-draft')
    expect(filmName('a', 'hd', 'review', 'beauty', { first: 1196, last: 1262 })).toBe('film-a-hd-review-001196-001262')
    expect(seqName(42, 'preview', 'draft')).toBe('frame-000042-preview-draft')
    expect(loopPieceName(0, 478, 'hd', 'draft')).toBe('loop-000000-000478-hd-draft')
  })

  it('read back to the same range', () => {
    const name = `${pieceName('step1', 840, 1438, 'preview', 'draft')}.mp4`
    expect(parsePiece(name, 'step1', 'preview', 'draft')).toEqual({ unit: 'step1', first: 840, last: 1438, file: name })
    expect(parsePiece(name, 'step2', 'preview', 'draft')).toBeNull()
    expect(parsePiece(name, 'step1', 'hd', 'draft')).toBeNull()
    expect(parsePiece('step1-preview-draft.mp4', 'step1', 'preview', 'draft')).toBeNull()
    expect(parsePiece(name.replace('.mp4', '.mov'), 'step1', 'preview', 'draft', 'beauty', 'mov')).not.toBeNull()
  })
})

describe('the encoder settings', () => {
  it('use the bitrate of the format', () => {
    expect(bitrateOf(cfg, 'preview')).toBe(cfg.previewFilm.bitrateMbps)
    expect(bitrateOf(cfg, 'hd')).toBe(cfg.export.bitrateMbps)
  })

  it('close every group of pictures so pieces join without encoding again', () => {
    const words = encodeArgs({ rate: cfg.film.previewFps, mbps: 4, codec: cfg.export.videoCodec })
    expect(words).toContain('libx264')
    expect(words[words.indexOf('-flags') + 1]).toBe('+cgop')
    expect(words[words.indexOf('-b:v') + 1]).toBe('4M')
    expect(words[words.indexOf('-g') + 1]).toBe(String(cfg.film.previewFps))
    expect(words).toContain('-an')
    expect(encodeArgs({ rate: 60, mbps: 0, codec: cfg.export.local.videoCodec })).toContain('prores_ks')
    expect(() => encodeArgs({ rate: 30, mbps: 4, codec: 'nothing' })).toThrow()
  })
})

describe('records', () => {
  const record = { what: { film: { unit: 'step1' } }, engineHash: 'a', pageHashes: { step1: 'b' }, format: 'preview', tier: 'draft', machine: { host: 'one' } }

  it('match across machines and not across builds', () => {
    expect(sameBuild({ ...record, machine: { host: 'two' }, frames: 3 }, record)).toBe(true)
    expect(sameBuild({ ...record, engineHash: 'c' }, record)).toBe(false)
    expect(sameBuild({ ...record, pageHashes: { step1: 'x' } }, record)).toBe(false)
    expect(sameBuild({ ...record, tier: 'review' }, record)).toBe(false)
    expect(sameBuild(null, record)).toBe(false)
  })

  it('name the careers page with the last page of the film, which ends on it', () => {
    expect(unitsShown(cfg, 'step1')).toEqual(['step1'])
    expect(unitsShown(cfg, cfg.film.units[cfg.film.units.length - 1].id)).toEqual([cfg.film.units[cfg.film.units.length - 1].id, cfg.film.units[0].id])
  })
})

describe('the frames of a sheet', () => {
  const n = cfg.critics.contactSheetFrames

  it('are spread across a beat from its first frame to its last', () => {
    for (const b of plan.beats) {
      const frames = spread(b.first, b.last, n, step)
      expect(frames.length).toBe(Math.min(n, framesIn(b.first, b.last, step).length))
      expect(frames[0]).toBe(clip(b.first, b.last, step)!.first)
      expect(frames[frames.length - 1]).toBe(clip(b.first, b.last, step)!.last)
      expect(frames.every((f: number) => f % step === 0)).toBe(true)
      expect([...frames].sort((x: number, y: number) => x - y)).toEqual(frames)
    }
  })

  it('are consecutive round a moment and stay inside the film', () => {
    const frames = around(1201, n, step, 0, plan.frameCount - 1)
    expect(frames.length).toBe(n)
    expect(frames).toContain(1202)
    for (let i = 1; i < frames.length; i++) expect(frames[i] - frames[i - 1]).toBe(step)
    expect(around(0, n, step, 0, plan.frameCount - 1)[0]).toBe(0)
    expect(around(plan.frameCount - 1, n, step, 0, plan.frameCount - 1).at(-1)).toBe(plan.frameCount - 2)
  })

  it('put a third of the frames before the moment, or half when a hit asks for its approach', () => {
    expect(around(1200, 12, 2, 0, plan.frameCount - 1)[0]).toBe(1194)
    expect(around(1200, 12, 2, 0, plan.frameCount - 1, 2)[0]).toBe(1190)
    expect(around(1200, 12, 2, 0, plan.frameCount - 1, 2).at(-1)).toBe(1212)
  })

  it('are labelled with their time in the film', () => {
    expect(timeLabel(0, 60)).toBe('0:00.00')
    expect(timeLabel(90, 60)).toBe('0:01.50')
    expect(timeLabel(60 * 75 + 3, 60)).toBe('1:15.05')
  })
})

describe('the grid of a sheet', () => {
  const edge = cfg.critics.maxImageLongEdgePx
  const w = cfg.formats.preview.width
  const h = cfg.formats.preview.height

  it('never has a long edge over the limit', () => {
    for (const count of [1, 2, 3, 4, 6, 9, 12, 16, 24]) {
      for (const [pw, ph] of [[w, h], [1920, 1080], [540, 960], [1080, 2400]]) {
        const g = sheetGrid(count, pw, ph, { edge })
        expect(Math.max(g.width, g.height)).toBeLessThanOrEqual(edge)
        expect(g.columns * g.rows).toBeGreaterThanOrEqual(count)
        expect(g.tileWidth).toBeLessThanOrEqual(pw)
        expect(Math.abs(g.tileWidth / g.tileHeight - pw / ph)).toBeLessThan(0.05)
      }
    }
  })

  it('keeps room for a label under every picture and for a heading', () => {
    const g = sheetGrid(cfg.critics.contactSheetFrames, w, h, { edge, labelHeight: 24, head: 30 })
    expect(g.height).toBe(30 + g.gap + g.rows * (g.tileHeight + 24) + g.gap * (g.rows - 1))
    expect(g.width).toBe(g.columns * g.tileWidth + g.gap * (g.columns - 1))
  })

  it('gives twelve film frames the largest tiles that fit', () => {
    const g = sheetGrid(12, w, h, { edge })
    expect(g.columns).toBe(3)
    expect(g.rows).toBe(4)
    expect(g.tileWidth).toBeGreaterThan(450)
  })

  it('takes a fixed number of columns when asked', () => {
    expect(sheetGrid(6, w, h, { edge, columns: 3 }).rows).toBe(2)
  })

  it('splits a long list over sheets', () => {
    expect(sheetsOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { filmPlan, loopPlan, seamFrames, seqName, seqRunName, webSize } from '../tools/lib/film-plan.mjs'
import { chromePlaces, isSoftware, mixFor, opener, proofRange } from '../tools/lib/film-local.mjs'
import { cropBox, stressKeys, stressMoments, stressName } from '../tools/lib/film-stress.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const plan = filmPlan(cfg)

describe('the local render', () => {
  it('looks for the installed Chrome where each system keeps it, the named one first', () => {
    expect(chromePlaces('darwin', {}, '/Users/b')[0]).toBe('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    expect(chromePlaces('darwin', { WJA_CHROME: '/x/chrome' }, '/Users/b')[0]).toBe('/x/chrome')
    expect(chromePlaces('linux', {}, '/home/b')).toContain('/usr/bin/google-chrome')
    expect(chromePlaces('win32', { PROGRAMFILES: 'C:\\Program Files' }, 'C:\\Users\\b').length).toBe(1)
  })

  it('knows software graphics by its name', () => {
    expect(isSoftware('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)')).toBe(true)
    expect(isSoftware('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true)
    expect(isSoftware('ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Max, Unspecified Version)')).toBe(false)
  })

  it('picks the final mix of a film and nothing else', () => {
    const names = ['film-a.wav', 'film-b.wav', 'notes.txt']
    expect(mixFor(names, 'b', cfg.export.files.filmB)).toBe('film-b.wav')
    expect(mixFor(names, 'a', cfg.export.files.filmA)).toBe('film-a.wav')
    expect(mixFor([`${cfg.export.files.filmB}.wav`, `${cfg.export.files.filmA}.wav`], 'b', cfg.export.files.filmB)).toBe(`${cfg.export.files.filmB}.wav`)
    expect(mixFor(['final-mix-b.wav'], 'b', cfg.export.files.filmB)).toBe('final-mix-b.wav')
    expect(mixFor(['final-mix-b.wav'], 'a', cfg.export.files.filmA)).toBe(null)
    expect(mixFor(['RECIPE.md'], 'b', cfg.export.files.filmB)).toBe(null)
  })

  it('takes export.proofSeconds of frames in a row across a frame, inside its page', () => {
    const unit = plan.units.find((u: { id: string }) => u.id === 'step1')!
    const want = cfg.export.proofSeconds * cfg.film.fps
    const r = proofRange(unit.first + 312, cfg.film.fps, cfg.export.proofSeconds, unit.first, unit.last)
    expect(r.frames).toBe(want)
    expect(r.last - r.first + 1).toBe(want)
    expect(r.first).toBeLessThan(unit.first + 312)
    expect(r.last).toBeGreaterThan(unit.first + 312)
    const edge = proofRange(unit.last, cfg.film.fps, cfg.export.proofSeconds, unit.first, unit.last)
    expect(edge.last).toBe(unit.last)
    expect(edge.frames).toBe(want)
    expect(proofRange(unit.first, cfg.film.fps, cfg.export.proofSeconds, unit.first, unit.last).first).toBe(unit.first)
  })

  it('opens a file with the system own command', () => {
    expect(opener('darwin')[0]).toBe('open')
    expect(opener('linux')[0]).toBe('xdg-open')
  })
})

describe('the card loop', () => {
  it('is indexed at film.fps and rendered at deliver.cardLoop.fps', () => {
    const l = loopPlan(cfg)
    expect(l.frameCount).toBe(cfg.deliver.cardLoop.seconds * cfg.film.fps)
    expect(l.step).toBe(cfg.film.fps / cfg.deliver.cardLoop.fps)
    expect(l.frames).toBe(cfg.deliver.cardLoop.seconds * cfg.deliver.cardLoop.fps)
    expect(l.frameCount % l.step).toBe(0)
  })

  it('has a web copy of the asked width with an even height', () => {
    const hd = cfg.formats.hd
    const w = webSize(hd.width, hd.height, cfg.deliver.cardLoop.webWidth)
    expect(w.width).toBe(cfg.deliver.cardLoop.webWidth)
    expect(w.height % 2).toBe(0)
    expect(Math.abs(w.width / w.height - hd.width / hd.height)).toBeLessThan(0.01)
    expect(webSize(960, 540, 1280)).toEqual({ width: 960, height: 540 })
  })

  it('is looked at over its seam: the last three pictures, then the first three', () => {
    expect(seamFrames(240)).toEqual([237, 238, 239, 0, 1, 2])
    expect(seamFrames(4)).toEqual([2, 3, 0, 1])
    const f = seamFrames(loopPlan(cfg).frames)
    expect(f.filter((n: number, k: number) => k > 0 && n < f[k - 1])).toEqual([0])
  })
})

describe('the pictures of a sequence', () => {
  it('are named by frame, format and tier', () => {
    expect(seqName(1152, 'preview', 'draft', 'beauty')).toBe('frame-001152-preview-draft')
    expect(seqName(7, 'hd', 'final', 'normals')).toBe('frame-000007-hd-final-normals')
    expect(seqRunName(1150, 1158, 'preview', 'draft', 'beauty')).toBe('seq-001150-001158-preview-draft')
  })
})

describe('the compression stress', () => {
  it('has its four moments, each inside the beat of its key', () => {
    const moments = stressMoments(cfg, plan)
    expect(moments.map((m: { id: string }) => m.id)).toEqual(['rest', 'fire', 'office', 'boss'])
    expect(stressKeys.length).toBe(4)
    for (const m of moments) {
      const beat = plan.beats.find((b: { id: string }) => b.id === m.beat)!
      expect(m.frame).toBeGreaterThanOrEqual(beat.first)
      expect(m.frame).toBeLessThanOrEqual(beat.last)
      expect(m.unit.id).toBe(beat.unit)
    }
    expect(moments[1].unit.id).toBe('step1')
    expect(moments[2].unit.id).toBe('pinball')
    expect(moments[3].unit.id).toBe('boss')
  })

  it('names its files by moment, format, tier and bitrate', () => {
    expect(stressName('fire', 'hd', 'draft')).toBe('stress-fire-hd-draft')
    expect(stressName('fire', 'hd', 'draft', 20)).toBe('stress-fire-hd-draft-20mbps')
    expect(stressName('fire', 'hd', 'draft', 2.5)).toBe('stress-fire-hd-draft-2p5mbps')
  })

  it('keeps the crop inside the picture', () => {
    expect(cropBox(0, 0, 1920, 1080, 461, 259)).toEqual({ left: 0, top: 0, width: 461, height: 259 })
    const b = cropBox(1919, 1079, 1920, 1080, 461, 259)
    expect(b.left + b.width).toBe(1920)
    expect(b.top + b.height).toBe(1080)
    expect(cropBox(960, 540, 1920, 1080, 461, 259).left).toBe(730)
  })
})

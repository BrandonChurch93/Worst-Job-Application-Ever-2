import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { brightnessAt, clampView, faults, segmentAt, timeline, viewAt } from '../tools/lib/roughcut.mjs'

const root = path.resolve(__dirname, '..')
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const cfg = read('config/showcase.json')
const plan = read('tools/assets/roughcut-plan.json')
const tl = timeline(cfg, plan)

describe('the rough cut plan', () => {
  it('fills the film frame for frame', () => {
    const frames = Math.round(cfg.film.units.reduce((n: number, u: { seconds: number }) => n + u.seconds, 0) * cfg.film.previewFps)
    expect(tl.total).toBe(frames)
    expect(tl.width).toBe(cfg.formats.preview.width)
    expect(tl.height).toBe(cfg.formats.preview.height)
    expect(faults(cfg, tl)).toEqual([])
  })

  it('has an entry for every beat and for nothing else', () => {
    expect(Object.keys(plan.beats).sort()).toEqual(cfg.film.beats.map((b: { id: string }) => b.id).sort())
  })

  it('shows only approved images that exist', () => {
    for (const s of tl.segments) {
      expect(s.file.startsWith('references/approved/')).toBe(true)
      expect(fs.existsSync(path.join(root, s.file))).toBe(true)
    }
  })

  it('shows every key on the beat its key names', () => {
    for (const k of cfg.keys) expect(tl.segments.some((s: { beat: string; image: string }) => s.beat === k.beat && s.image === k.id)).toBe(true)
  })

  it('carries a held image on from where the beat before it ended', () => {
    const held = tl.segments.filter((s: { held: boolean }) => s.held)
    expect(held.length).toBeGreaterThan(0)
    for (const s of held) {
      const before = tl.segments[tl.segments.indexOf(s) - 1]
      expect(before.image).toBe(s.image)
      expect(viewAt(s, s.first)).toEqual(before.to)
    }
  })

  it('dips at every page turn and nowhere else', () => {
    expect(tl.dips.length).toBe(cfg.film.units.length)
    for (const d of tl.dips) {
      expect(brightnessAt(tl.dips, d.at)).toBeLessThan(0.1)
      expect(brightnessAt(tl.dips, d.at - 1)).toBeLessThan(0.1)
      expect(brightnessAt(tl.dips, d.at + d.frames)).toBe(1)
      expect(brightnessAt(tl.dips, d.at - d.frames - 1)).toBe(1)
      expect(segmentAt(tl, d.at - 1).image).not.toBe(segmentAt(tl, d.at).image)
    }
    expect(brightnessAt(tl.dips, 0)).toBe(1)
    expect(brightnessAt(tl.dips, tl.total - 1)).toBe(1)
  })

  it('never looks outside an image', () => {
    for (const s of tl.segments) {
      for (let f = s.first; f < s.last; f++) {
        const [cx, cy, z] = viewAt(s, f)
        const half = 0.5 / z
        expect(cx - half).toBeGreaterThanOrEqual(-1e-9)
        expect(cx + half).toBeLessThanOrEqual(1 + 1e-9)
        expect(cy - half).toBeGreaterThanOrEqual(-1e-9)
        expect(cy + half).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })

  it('moves slowly: no view jumps inside a part', () => {
    for (const s of tl.segments) {
      for (let f = s.first + 1; f < s.last; f++) {
        const a = viewAt(s, f - 1)
        const b = viewAt(s, f)
        expect(Math.abs(b[0] - a[0])).toBeLessThan(0.02)
        expect(Math.abs(b[1] - a[1])).toBeLessThan(0.02)
        expect(Math.abs(Math.log(b[2] / a[2]))).toBeLessThan(0.02)
      }
    }
  })
})

describe('the rough cut timeline, when the plan is wrong', () => {
  it('refuses a beat with no entry', () => {
    const broken = { ...plan, beats: { ...plan.beats } }
    delete broken.beats['step1.tug']
    expect(() => timeline(cfg, broken)).toThrow(/step1\.tug/)
  })

  it('refuses an image that is no key and no sheet', () => {
    const broken = { ...plan, beats: { ...plan.beats, 'step1.tug': [{ image: 'nothing', to: [0.5, 0.5, 1] }] } }
    expect(() => timeline(cfg, broken)).toThrow(/nothing/)
  })

  it('reports a key that is off screen at its own moment', () => {
    const broken = { ...plan, beats: { ...plan.beats, 'step1.tug': [{ image: 'page-look', to: [0.5, 0.5, 1] }] } }
    expect(faults(cfg, timeline(cfg, broken)).join('\n')).toMatch(/step1-tug is not on screen/)
  })

  it('reports an image borrowed from another page', () => {
    const broken = { ...plan, beats: { ...plan.beats, 'step2.slot': [{ image: 'page-look', to: [0.5, 0.5, 1] }] } }
    expect(faults(cfg, timeline(cfg, broken)).join('\n')).toMatch(/step2\.slot shows page-look/)
  })

  it('keeps a view inside the image whatever it is asked', () => {
    expect(clampView([0, 0, 2])).toEqual([0.25, 0.25, 2])
    expect(clampView([1, 1, 4])).toEqual([0.875, 0.875, 4])
    expect(clampView([0.3, 0.7, 0.5])).toEqual([0.5, 0.5, 1])
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { filmPlan, sheetGrid } from '../tools/lib/film-plan.mjs'
import { momentOf, moments, safe, searchRanges, sheetName } from '../tools/lib/film-sheet.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const plan = filmPlan(cfg)

describe('the names of the sheets', () => {
  it('say what was sheeted, the format and the tier', () => {
    expect(sheetName('beat', 'step1.firstName', 'preview', 'draft')).toBe('sheet-beat-step1_firstName-preview-draft')
    expect(sheetName('pages', '', 'preview', 'draft')).toBe('sheet-pages-preview-draft')
    expect(sheetName('unit', 'step2', 'hd', 'review', 2, 3)).toBe('sheet-unit-step2-2of3-hd-review')
    expect(sheetName('unit', 'step2', 'hd', 'review', 1, 1)).toBe('sheet-unit-step2-hd-review')
  })

  it('hold nothing a file name cannot', () => {
    for (const b of plan.beats) expect(safe(b.id)).toMatch(/^[A-Za-z0-9_]+$/)
    expect(safe('page-turn')).toBe('page_turn')
  })
})

describe('the moments of --motion', () => {
  it('know a hit by its flag or by its name', () => {
    expect(moments.hit.test({ name: 'anything', hitsCursor: true })).toBe(true)
    expect(moments.hit.test({ name: 'bolt-hit-cursor', hitsCursor: false })).toBe(true)
    expect(moments.hit.test({ name: 'bumper', hitsCursor: false })).toBe(false)
  })

  it('take the reassembly from the strips and any other name as an event', () => {
    expect(moments.reassembly.test({ name: 'strips-zip' })).toBe(true)
    expect(momentOf('coins').test({ name: 'coins' })).toBe(true)
    expect(momentOf('coins').test({ name: 'bumper' })).toBe(false)
    expect(momentOf('coins').words).toContain('coins')
  })

  it('look in the beats that own the event first and in the whole film last', () => {
    const whole = { first: 0, last: plan.frameCount - 1 }
    for (const name of ['bumper', 'reassembly', 'hit', 'page-turn', 'nothing']) {
      const ranges = searchRanges(plan, name, cfg.film.beatToleranceSeconds)
      expect(ranges[ranges.length - 1]).toEqual(whole)
      for (const r of ranges) {
        expect(r.first).toBeGreaterThanOrEqual(0)
        expect(r.last).toBeLessThan(plan.frameCount)
        expect(r.first).toBeLessThanOrEqual(r.last)
      }
    }
    expect(searchRanges(plan, 'hit', 0)).toEqual([whole])
    expect(searchRanges(plan, 'nothing', 0)).toEqual([whole])
  })
})

describe('a sheet of the contact sheet size', () => {
  it('stays inside the critics long edge with its heading and its labels', () => {
    const edge = cfg.critics.maxImageLongEdgePx
    for (const f of Object.values(cfg.formats) as { width: number; height: number }[]) {
      for (const count of [1, 5, 6, cfg.critics.contactSheetFrames]) {
        const g = sheetGrid(count, f.width, f.height, { edge, head: 28 })
        expect(Math.max(g.width, g.height)).toBeLessThanOrEqual(edge)
        expect(g.columns * g.rows).toBeGreaterThanOrEqual(count)
        expect(g.labelHeight).toBeGreaterThan(0)
      }
    }
  })
})

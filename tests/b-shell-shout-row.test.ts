import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fitPicture } from '../src/core/levelFit'
import { CAPTION, sayable, shoutMost, shoutPx } from '../src/ui/said'

// The applicant's shout builds on one row. pipeline/change002/shell-shout-row.mjs draws it with the page's own panel in a real browser, in four windows, and keeps what it measured.
interface Step { key: string; step: { k: number; n: number }; whole: string; panel: { words: string; fontPx: number; rows: number; box: number[] } }
interface Seen { window: { width: number; height: number }; picture: number[]; steps: Step[] }
interface Film { size: { width: number; height: number }; captions: { key: string; phrase: number; step?: { k: number; n: number }; panel: { words: string; box: number[] } }[] }
const root = path.resolve(__dirname, '..')
const read = <T>(file: string): T => JSON.parse(readFileSync(path.join(root, file), 'utf8')) as T
const kept = read<{ source: { file: string; sha1: string }; windows: Seen[] }>('pipeline/change002/shell-shout-row.json')
const row = read<{ film: Record<string, { text: string; join?: string }[]> }>('content/narration-drafts.json').film['boss.finish']![0]!
const mark = read<{ pauseMark: string }>('content/narration.json').pauseMark
// The four windows the row must stand in, width by height: the film at full and half size, two small windows of a visitor.
const WINDOWS = [[1920, 1080], [960, 540], [1280, 720], [1024, 640]]
// The least clear room on each side of the panel, as a share of the picture's width, the shake of the last step taken off.
const MARGIN = 0.04
const S = CAPTION.shout

describe('the shout on one row', () => {
  it('is measured on the panel as it is now: the kept list was made from this src/ui/said.ts', () => {
    const now = createHash('sha1').update(readFileSync(path.join(root, kept.source.file))).digest('hex')
    expect(kept.source.sha1, 'src/ui/said.ts has changed: run node pipeline/change002/shell-shout-row.mjs again').toBe(now)
  })

  it('stands in one row at the first, the middle and the last step, in each of the four windows, with the words of the script whole', () => {
    expect(kept.windows.map((w) => [w.window.width, w.window.height])).toEqual(WINDOWS)
    const pieces = row.text.split(mark).map((p) => p.trim()).filter((p) => p.length > 0)
    expect(pieces.length).toBeGreaterThanOrEqual(3)
    for (const w of kept.windows) {
      const at = `${w.window.width} by ${w.window.height}`
      expect(w.steps.map((s) => s.step.k), at).toEqual(pieces.map((_, k) => k))
      for (const s of w.steps) {
        expect(s.panel.rows, `${at}, step ${s.step.k}`).toBe(1)
        expect(s.panel.words, `${at}, step ${s.step.k}`).toBe(pieces.slice(0, s.step.k + 1).join(row.join ?? ' ').toUpperCase())
        expect(s.panel.box[3]!, `${at}, step ${s.step.k}`).toBeLessThan(2 * s.panel.fontPx)
      }
      expect(w.steps[w.steps.length - 1]!.panel.words, at).toBe(sayable(row.text, mark).toUpperCase())
    }
  })

  it('grows a step by the panel\'s rate and never shrinks, and at its largest lies inside the picture with a margin on each side, in the top band', () => {
    for (const w of kept.windows) {
      const at = `${w.window.width} by ${w.window.height}`
      const fit = fitPicture(w.window.width, w.window.height, 1, 1, false)
      const [left, top, wide] = w.picture as [number, number, number]
      expect(wide, at).toBeCloseTo(fit.cssWidth, 0)
      const u = wide / 1920
      w.steps.slice(1).forEach((s, i) => {
        expect(s.panel.fontPx / w.steps[i]!.panel.fontPx, `${at}, step ${s.step.k}`).toBeCloseTo(S.grow, 1)
        expect(s.panel.box[2]!, `${at}, step ${s.step.k}`).toBeGreaterThan(w.steps[i]!.panel.box[2]!)
      })
      for (const s of w.steps) {
        const [x, y, bw, bh] = s.panel.box as [number, number, number, number]
        const shake = S.shakePx * u
        expect(x - shake - left, `${at}, step ${s.step.k}, left`).toBeGreaterThanOrEqual(MARGIN * wide)
        expect(left + wide - (x + bw + shake), `${at}, step ${s.step.k}, right`).toBeGreaterThanOrEqual(MARGIN * wide)
        expect(Math.abs(x + bw / 2 - (left + wide / 2)), `${at}, step ${s.step.k}, middle`).toBeLessThanOrEqual(shake + 0.5)
        expect(y, `${at}, step ${s.step.k}, top`).toBeGreaterThanOrEqual(top + (S.top - S.shakePx) * u - 0.5)
        expect(y + bh, `${at}, step ${s.step.k}, low`).toBeLessThanOrEqual(top + S.low * u + 0.5)
      }
    }
  })

  it('is as large as its band lets the whole line be: the size the panel works out from the width of the row', () => {
    for (const w of kept.windows) {
      const at = `${w.window.width} by ${w.window.height}`
      const u = w.picture[2]! / 1920
      const last = w.steps[w.steps.length - 1]!
      const n = last.step.n
      const wideEm = (last.panel.box[2]! - 2 * CAPTION.padX * u) / last.panel.fontPx
      const highEm = (last.panel.box[3]! - 2 * CAPTION.padY * u) / last.panel.fontPx
      const most = shoutMost(wideEm, highEm, u, w.window.width)
      expect(most, at).toBeLessThan(S.lastPx)
      w.steps.forEach((s) => expect(s.panel.fontPx, `${at}, step ${s.step.k}`).toBeCloseTo(shoutPx(s.step.k, n, most) * u, 0))
      expect(last.panel.box[2]!, at).toBeCloseTo(Math.min(w.window.width - CAPTION.windowEdge, S.wide * u) - 2 * S.shakePx * u, 0)
    }
    expect(shoutMost(10, 1, 1, 1920)).toBeCloseTo((S.wide - 2 * (CAPTION.padX + S.shakePx)) / 10, 6)
    expect(shoutMost(10, 1, 0.5, 960)).toBeCloseTo(shoutMost(10, 1, 1, 1920), 6)
    expect(shoutMost(1, 2, 1, 1920)).toBeCloseTo((S.low - S.top - S.shakePx - 2 * CAPTION.padY) / 2, 6)
  })

  it('is the same in the film: the pictures of the film\'s captions hold the same boxes at 1920 by 1080 and at 960 by 540', () => {
    for (const [file, width, height] of [['pipeline/change002/shell-film-captions.json', 1920, 1080], ['pipeline/change002/shell-film-captions-960x540.json', 960, 540]] as [string, number, number][]) {
      const film = read<Film>(file)
      expect(film.size).toEqual({ width, height })
      const w = kept.windows.find((x) => x.window.width === width && x.window.height === height)!
      const caps = film.captions.filter((x) => x.step)
      expect(caps.length, file).toBe(w.steps.length)
      caps.forEach((cap, i) => {
        const s = w.steps[i]!
        expect(cap.key, file).toBe(s.key)
        expect(cap.panel.words, `${file}, step ${i}`).toBe(s.panel.words)
        cap.panel.box.forEach((v, k) => expect(Math.abs(v - s.panel.box[k]!), `${file}, step ${i}, box ${k}`).toBeLessThanOrEqual(0.5))
      })
    }
  })
})

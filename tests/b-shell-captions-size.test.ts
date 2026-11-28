import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { narration } from '../src/copy'
import { CAPTION, captionLow, makeCaption } from '../src/ui/said'

interface Kept { key: string; phrase: number; words: string; first: number; last: number; loud: boolean; step?: { k: number; n: number }; panel: { words: string; box: number[] } }
interface List { size: { width: number; height: number }; outside: string[]; captions: Kept[] }
interface Row { text: string; join?: string }
const here = (name: string) => path.resolve(__dirname, '../pipeline/change002', name)
const read = (name: string) => JSON.parse(readFileSync(here(name), 'utf8')) as List
const full = read('shell-film-captions.json')
const half = read('shell-film-captions-960x540.json')
const drafts = (JSON.parse(readFileSync(path.resolve(__dirname, '../content/narration-drafts.json'), 'utf8')) as { film?: Record<string, Row[]> }).film ?? {}
const settled = narration.film as unknown as Record<string, Row[]>
const mark = (narration as unknown as { pauseMark: string }).pauseMark
const rowOf = (key: string): Row => {
  const beat = key.slice(0, key.lastIndexOf('.'))
  return (settled[beat]?.length ? settled[beat]! : drafts[beat]!)[Number(key.slice(key.lastIndexOf('.') + 1))]!
}

afterEach(() => vi.unstubAllGlobals())

describe('the size of the film\'s caption pictures', () => {
  it('keeps a list drawn at 960 by 540 in which every panel is the page\'s panel at half its size, in the same place, and inside the picture', () => {
    expect(full.size).toEqual({ width: 1920, height: 1080 })
    expect(half.size).toEqual({ width: 960, height: 540 })
    expect(half.outside).toEqual([])
    expect(full.outside).toEqual([])
    expect(half.captions.map((x) => [x.key, x.phrase, x.words, x.first, x.last])).toEqual(full.captions.map((x) => [x.key, x.phrase, x.words, x.first, x.last]))
    half.captions.forEach((h, i) => {
      const f = full.captions[i]!.panel.box
      h.panel.box.forEach((v, k) => expect(Math.abs(v - f[k]! / 2), `${h.key} phrase ${h.phrase}, box ${k}`).toBeLessThanOrEqual(1))
      const [x, y, w, high] = h.panel.box as [number, number, number, number]
      expect(x >= 0 && y >= 0 && x + w <= 960 && y + high <= 540, `${h.key} phrase ${h.phrase}`).toBe(true)
    })
  })

  it('shows one phrase of the script a picture, the piece between two pause marks, with no two pictures on one frame', () => {
    expect(full.captions.length).toBeGreaterThan(40)
    for (const list of [full, half]) {
      const keys = [...new Set(list.captions.map((x) => x.key))]
      for (const key of keys) {
        const row = rowOf(key)
        const pieces = row.text.split(mark).map((p) => p.trim()).filter((p) => p.length > 0)
        const caps = list.captions.filter((x) => x.key === key)
        expect(caps.map((x) => x.phrase), key).toEqual(pieces.map((_, k) => k))
        for (const x of caps) {
          const words = x.step ? pieces.slice(0, x.phrase + 1).join(row.join ?? ' ') : pieces[x.phrase]!
          expect(x.words, `${key} phrase ${x.phrase}`).toBe(words)
          expect(x.panel.words, `${key} phrase ${x.phrase}`).toBe(x.loud ? words.toUpperCase() : words)
        }
      }
      list.captions.slice(1).forEach((x, i) => expect(x.first, `${x.key} phrase ${x.phrase}`).toBeGreaterThan(list.captions[i]!.last))
    }
  })

  it('is what the page\'s panel does on a page of half the size: half the type, half the padding, the lower edge at half the height', () => {
    for (const page of ['marketing', 'step4', 'step5']) {
      const frames: (() => void)[] = []
      const el: any = { style: {}, dataset: {}, textContent: '' }
      vi.stubGlobal('document', { body: { append: () => undefined }, createElement: () => el, querySelector: () => null })
      vi.stubGlobal('window', { innerWidth: 960, innerHeight: 540, requestAnimationFrame: (fn: () => void) => { frames.push(fn); return frames.length } })
      const src = { now: 0, lines: [{ id: 'line.x', words: 'Two pages.', start: 1, end: 3 }] }
      const c = makeCaption(() => src)!
      c.place(CAPTION.lowOn[page])
      c.wake()
      frames.shift()!()
      src.now = 1.5
      frames.shift()!()
      expect(el.style.bottom, page).toBe(`${540 - captionLow(page) / 2}px`)
      expect(el.style.fontSize, page).toBe(`${CAPTION.fontPx / 2}px`)
      expect(el.style.padding, page).toBe(`${CAPTION.padY / 2}px ${CAPTION.padX / 2}px`)
      vi.unstubAllGlobals()
    }
  })

  it('lays the pictures over a film without scaling them: the tool reads the size from the film and scales nothing but the still of its proof', () => {
    const tool = readFileSync(here('shell-film-captions.mjs'), 'utf8')
    expect(tool.match(/scale=/g)).toHaveLength(1)
    expect(tool).toContain('lay([\'-i\', onto], out)\n')
    expect(tool).toContain('const SIZE = film ? { width: Number(film[0]), height: Number(film[1]) }')
    expect(tool).toContain('viewport: SIZE, deviceScaleFactor: 1')
  })
})

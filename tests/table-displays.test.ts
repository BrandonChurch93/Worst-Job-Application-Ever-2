import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import copy from '../content/copy.json'
import { SCORE_H, SCORE_W, TEXT_DOWN, TEXT_UP, dot, glyph, hasGlyph, score, text } from '../src/table/real/displays/font'
import { COLS, PACE, ROWS, ascii, compose, keyOf, lineWidth, modeSeconds, nameLines, scoreLeft, scrolled, setLine, twice, widthOf, type Show } from '../src/table/real/displays/screen'

const modes = (copy as unknown as { step3: { table: { modes: { insert: string; display: string }[] } } }).step3.table.modes
const grid = (show: Show): Uint8Array => {
  const d = new Uint8Array(COLS * ROWS)
  compose(show, d)
  return d
}
const lit = (d: Uint8Array): number => d.reduce((n, v) => n + (v > 128 ? 1 : 0), 0)
const columns = (d: Uint8Array): number[] => {
  const out: number[] = []
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (d[y * COLS + x]! > 128) { out.push(x); break }
  return out
}

describe('the dot font', () => {
  test('has a letter for every character of every mode in the copy', () => {
    expect(modes.length).toBe(9)
    for (const m of modes) for (const c of m.insert + m.display) expect(hasGlyph(c), `no glyph for "${c}"`).toBe(true)
  })
  test('text is five dots wide at most and seven tall with two under the line', () => {
    for (const [c, g] of text) {
      expect(g.w, c).toBeGreaterThan(0)
      expect(g.w, c).toBeLessThanOrEqual(5)
      expect(g.rows.length, c).toBe(TEXT_UP + TEXT_DOWN)
    }
  })
  test('the ten numerals of the score are nine by fifteen, all different, each with a stroke two dots thick', () => {
    expect(score.length).toBe(10)
    const seen = new Set<string>()
    for (const g of score) {
      expect(g.w).toBe(SCORE_W)
      expect(g.rows.length).toBe(SCORE_H)
      seen.add(g.rows.join(','))
      let pair = false
      for (let y = 0; y < SCORE_H; y++) for (let x = 0; x + 1 < SCORE_W; x++) if (dot(g, x, y) && dot(g, x + 1, y)) pair = true
      expect(pair).toBe(true)
    }
    expect(seen.size).toBe(10)
  })
  test('a character outside the font shows as a box, not as nothing', () => {
    expect(glyph('\u00a7').w).toBeGreaterThan(0)
  })
})

describe('the score', () => {
  test('stands right aligned in large numerals', () => {
    const d = grid({ kind: 'score', digits: '042500', since: 9, before: null })
    const cols = columns(d)
    expect(cols[0]).toBe(scoreLeft(6))
    expect(cols[cols.length - 1]).toBe(COLS - PACE.scoreRight - 1)
    expect(scoreLeft(6)).toBeGreaterThan(COLS / 2 - 8)
  })
  test('a change moves only the numerals that changed', () => {
    const before = grid({ kind: 'score', digits: '042500', since: 9, before: null })
    const mid = grid({ kind: 'score', digits: '042600', since: PACE.roll / 2, before: '042500' })
    const after = grid({ kind: 'score', digits: '042600', since: 9, before: '042500' })
    const x0 = scoreLeft(6) + 3 * (SCORE_W + PACE.scoreGap)
    let outside = 0
    let inside = 0
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const moved = mid[y * COLS + x] !== before[y * COLS + x]
      if (x >= x0 && x < x0 + SCORE_W) inside += moved ? 1 : 0
      else outside += moved ? 1 : 0
    }
    expect(outside).toBe(0)
    expect(inside).toBeGreaterThan(0)
    expect(ascii(mid)).not.toBe(ascii(after))
    expect(keyOf({ kind: 'score', digits: '042600', since: PACE.roll, before: '042500' })).toBe(keyOf({ kind: 'score', digits: '042600', since: 9, before: null }))
  })
  test('the roll is over in two frames of the film', () => {
    expect(PACE.roll).toBeLessThanOrEqual(2 / 30 + 1e-9)
  })
})

describe('a mode', () => {
  test('holds the name of the insert, whole, before the line runs', () => {
    for (const m of modes) {
      const set = nameLines(m.insert)
      for (const l of set.lines) expect(widthOf(l) * (set.big ? 2 : 1)).toBeLessThanOrEqual(COLS - 4)
      expect(set.lines.join(' ')).toBe(m.insert)
      const d = grid({ kind: 'mode', name: m.insert, line: m.display, t: 0 })
      const want = set.lines.reduce((n, l) => n + lit(Uint8Array.from((set.big ? twice(setLine(l)) : setLine(l)).at)), 0)
      expect(lit(d)).toBe(want)
      expect(keyOf({ kind: 'mode', name: m.insert, line: m.display, t: 0 })).toBe(keyOf({ kind: 'mode', name: m.insert, line: m.display, t: PACE.hold - 0.01 }))
    }
  })
  test('a line too long for the grid scrolls at an even pace and is never made smaller', () => {
    for (const m of modes) {
      expect(lineWidth(m.display)).toBe(widthOf(m.display) * 2)
      expect(lineWidth(m.display)).toBeGreaterThan(COLS)
      const end = modeSeconds(m.display)
      expect(scrolled(end + 1e-6)).toBeGreaterThanOrEqual(COLS + lineWidth(m.display))
      expect(lit(grid({ kind: 'mode', name: m.insert, line: m.display, t: end + 1e-6 }))).toBe(0)
      expect(lit(grid({ kind: 'mode', name: m.insert, line: m.display, t: end - 0.5 }))).toBeGreaterThan(0)
    }
    const step = 1 / 30
    const moves: number[] = []
    for (let i = 0; i < 90; i++) moves.push(scrolled(PACE.hold + (i + 1) * step) - scrolled(PACE.hold + i * step))
    expect(Math.max(...moves) - Math.min(...moves)).toBeLessThanOrEqual(1)
    const a = grid({ kind: 'mode', name: '', line: modes[0]!.display, t: PACE.hold + 2 })
    const b = grid({ kind: 'mode', name: '', line: modes[0]!.display, t: PACE.hold + 2 + 10 / PACE.dotsPerSecond })
    for (let y = 0; y < ROWS; y++) for (let x = 20; x < COLS - 1; x++) expect(b[y * COLS + x - 10]).toBe(a[y * COLS + x])
  })
  test('text at twice the size has capitals of fourteen dots, never fewer', () => {
    const s = twice(setLine('E'))
    let rows = 0
    for (let y = 0; y < s.h; y++) if (s.at.subarray(y * s.w, (y + 1) * s.w).some((v) => v > 0)) rows++
    expect(rows).toBe(TEXT_UP * 2)
  })
})

describe('the hint', () => {
  const half = (d: Uint8Array, left: boolean): number => {
    let n = 0
    for (let y = 0; y < ROWS; y++) for (let x = left ? 0 : COLS / 2; x < (left ? COLS / 2 : COLS); x++) if (d[y * COLS + x]! > 128) n++
    return n
  }
  test('lights the left button, then the right, once a second', () => {
    const rest = grid({ kind: 'hint', t: PACE.hintPeriod * 0.45 })
    const left = grid({ kind: 'hint', t: 0.05 })
    const right = grid({ kind: 'hint', t: PACE.hintPeriod * 0.5 + 0.05 })
    expect(half(rest, true)).toBe(half(rest, false))
    expect(half(left, true)).toBeGreaterThan(half(rest, true) + 20)
    expect(half(left, false)).toBe(half(rest, false))
    expect(half(right, false)).toBeGreaterThan(half(rest, false) + 20)
    expect(half(right, true)).toBe(half(rest, true))
    expect(half(left, true)).toBe(half(right, false))
    expect(keyOf({ kind: 'hint', t: 0.05 })).toBe(keyOf({ kind: 'hint', t: PACE.hintPeriod + 0.05 }))
  })
  test('nothing on a display flashes more than three times a second', () => {
    let flashes = 0
    let last = ''
    const seconds = 10
    for (let i = 0; i < seconds * 120; i++) {
      const k = keyOf({ kind: 'hint', t: i / 120 })
      if (k !== last && k !== 'hint|-') flashes++
      last = k
    }
    expect(flashes / seconds).toBeLessThanOrEqual(3)
    expect(1 / PACE.hintPeriod).toBeGreaterThanOrEqual(0.8)
    expect(1 / PACE.hintPeriod).toBeLessThanOrEqual(1.25)
  })
})

describe('the folder', () => {
  const dir = new URL('../src/table/real/displays/', import.meta.url)
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
  test('reads no clock but the frame and rolls no dice', () => {
    for (const f of files) {
      const src = readFileSync(new URL(f, dir), 'utf8')
      expect(src, f).not.toMatch(/Math\.random|Date\.now|performance\.now/)
      expect(src.includes(String.fromCharCode(0x2014)), f).toBe(false)
    }
  })
  test('types no word of its own: every mode line shown is in the copy', () => {
    for (const f of files) {
      const src = readFileSync(new URL(f, dir), 'utf8')
      for (const m of modes) {
        expect(src.includes(m.insert), f).toBe(false)
        expect(src.includes(m.display), f).toBe(false)
      }
    }
  })
  test('the faint burn sits in the first and last columns and nowhere else', () => {
    const d = grid({ kind: 'score', digits: '000000', since: 9, before: null })
    for (let y = 0; y < ROWS; y++) {
      expect(d[y * COLS]).toBe(PACE.burn)
      expect(d[y * COLS + COLS - 1]).toBe(PACE.burn)
      expect(d[y * COLS + 1]).toBe(0)
    }
    expect(lit(grid({ kind: 'blank' }))).toBe(0)
  })
})

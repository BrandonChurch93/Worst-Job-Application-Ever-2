import { config } from '../../../config'
import { SCORE_H, SCORE_W, TEXT_DOWN, TEXT_UP, dot, glyph, score, type Glyph } from './font'

// The grid of every display, and what one grid shows at one moment. No three.js here: the tests run it in Node.
export const COLS = 128
export const ROWS = 30

// A frame of the film: the line moves by whole dots in each one, and a changed numeral is in place two of them later.
const FPS = config.film.fps

export const PACE = {
  // A mode: the insert's name is held, then the line runs from right to left at an even pace, then the score is back.
  hold: 1.0,
  dotsPerSecond: 2 * FPS,
  // A numeral that changes rolls up into place in this time: two frames of the film.
  roll: 2 / FPS,
  // The hint: the left button, then the right, once a second between them.
  hintPeriod: 1,
  hintLit: 0.38,
  // The faint burn of the first and last columns, out of 255.
  burn: 16,
  scoreGap: 8,
  scoreRight: 17
}

export type Show =
  | { kind: 'blank' }
  | { kind: 'score'; digits: string; since: number; before: string | null }
  | { kind: 'mode'; name: string; line: string; t: number }
  | { kind: 'hint'; t: number }

// A strip of dots, as wide as its words need and never narrower: what does not fit a display is scrolled, not shrunk.
export interface Strip { w: number; h: number; at: Uint8Array }

const strip = (w: number, h: number): Strip => ({ w, h, at: new Uint8Array(Math.max(1, w) * h) })

export const advance = (g: Glyph): number => g.w + 1

export function widthOf(words: string): number {
  let w = 0
  for (const c of words) w += advance(glyph(c))
  return Math.max(0, w - 1)
}

export function setLine(words: string): Strip {
  const s = strip(widthOf(words), TEXT_UP + TEXT_DOWN)
  let x = 0
  for (const c of words) {
    const g = glyph(c)
    for (let y = 0; y < s.h; y++) for (let k = 0; k < g.w; k++) if (dot(g, k, y)) s.at[y * s.w + x + k] = 255
    x += advance(g)
  }
  return s
}

// Twice the size, with the corners of a stair filled the way a slanted stroke runs, so a large sign is not a small one made of blocks.
export function twice(a: Strip): Strip {
  const b = strip(a.w * 2, a.h * 2)
  const on = (x: number, y: number): boolean => x >= 0 && x < a.w && y >= 0 && y < a.h && a.at[y * a.w + x]! > 0
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const p = on(x, y)
      const up = on(x, y - 1)
      const down = on(x, y + 1)
      const left = on(x - 1, y)
      const right = on(x + 1, y)
      const q = [left === up && left !== down && up !== right ? up : p, up === right && up !== left && right !== down ? right : p, left === down && left !== up && down !== right ? left : p, down === right && left !== right && up !== down ? right : p]
      for (let k = 0; k < 4; k++) if (q[k]) b.at[(y * 2 + (k >> 1)) * b.w + x * 2 + (k & 1)] = 255
    }
  }
  return b
}

function wrap(words: string, max: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of words.split(' ')) {
    const next = line === '' ? word : `${line} ${word}`
    if (line !== '' && widthOf(next) > max) {
      out.push(line)
      line = word
    } else line = next
  }
  if (line !== '') out.push(line)
  return out
}

// The name of an insert as it is held: at twice the size on one line when that fits, otherwise at its own size on as few lines as hold it, the lines as even as they can be.
export function nameLines(name: string): { big: boolean; lines: string[] } {
  if (widthOf(name) * 2 <= COLS - 4) return { big: true, lines: [name] }
  const most = Math.floor(ROWS / (TEXT_UP + TEXT_DOWN + 1))
  for (let n = 2; n <= most; n++) {
    let best: string[] | null = null
    for (let max = Math.ceil(widthOf(name) / n); max <= COLS - 4; max++) {
      const lines = wrap(name, max)
      if (lines.length <= n && lines.every((l) => widthOf(l) <= COLS - 4)) {
        best = lines
        break
      }
    }
    if (best) return { big: false, lines: best }
  }
  return { big: false, lines: wrap(name, COLS - 4).slice(0, most) }
}

const memo = new Map<string, Strip>()
const big = (words: string): Strip => {
  let s = memo.get(words)
  if (!s) {
    s = twice(setLine(words))
    if (memo.size > 64) memo.clear()
    memo.set(words, s)
  }
  return s
}

export const lineWidth = (line: string): number => widthOf(line) * 2
export const scrollSeconds = (line: string): number => (COLS + lineWidth(line)) / PACE.dotsPerSecond
export const modeSeconds = (line: string): number => PACE.hold + scrollSeconds(line)
// How far the line has run, in whole dots, at a time since the mode was lit.
export const scrolled = (t: number): number => Math.max(0, Math.floor((t - PACE.hold) * PACE.dotsPerSecond + 1e-6))

function blit(out: Uint8Array, s: Strip, x0: number, y0: number, level = 255): void {
  const xa = Math.max(0, x0)
  const xb = Math.min(COLS, x0 + s.w)
  for (let y = Math.max(0, y0); y < Math.min(ROWS, y0 + s.h); y++) {
    const row = (y - y0) * s.w - x0
    for (let x = xa; x < xb; x++) if (s.at[row + x]! > 0) out[y * COLS + x] = level
  }
}

function numeral(out: Uint8Array, g: Glyph, x0: number, y0: number, shift: number, top: number, foot: number): void {
  for (let y = 0; y < SCORE_H; y++) {
    const ry = y0 + y - shift
    if (ry < top || ry >= foot) continue
    for (let x = 0; x < SCORE_W; x++) if (dot(g, x, y)) out[ry * COLS + x0 + x] = 255
  }
}

export const scoreLeft = (count: number): number => COLS - PACE.scoreRight - count * SCORE_W - (count - 1) * PACE.scoreGap

function drawScore(out: Uint8Array, digits: string, since: number, before: string | null): void {
  const top = Math.floor((ROWS - SCORE_H) / 2)
  const n = digits.length
  const rolling = before !== null && before.length === n && since >= 0 && since < PACE.roll
  const travel = SCORE_H + 3
  for (let i = 0; i < n; i++) {
    const x = scoreLeft(n) + i * (SCORE_W + PACE.scoreGap)
    const now = score[Number(digits[i])]
    if (!now) continue
    const was = rolling ? score[Number(before![i])] : undefined
    if (was && before![i] !== digits[i]) {
      const shift = Math.min(travel - 1, Math.max(1, Math.round(((since / PACE.roll) * 0.5 + 0.5) * travel)))
      numeral(out, was, x, top, shift, top - 2, top + SCORE_H + 2)
      numeral(out, now, x, top, shift - travel, top - 2, top + SCORE_H + 2)
    } else numeral(out, now, x, top, 0, 0, ROWS)
  }
}

function drawMode(out: Uint8Array, name: string, line: string, t: number): void {
  if (t < PACE.hold) {
    const set = nameLines(name)
    const strips = set.lines.map((l) => (set.big ? big(l) : setLine(l)))
    const lead = set.big ? 0 : TEXT_UP + TEXT_DOWN + 1
    const inked = set.big ? TEXT_UP * 2 : (strips.length - 1) * lead + TEXT_UP
    const y0 = Math.max(0, Math.floor((ROWS - inked) / 2))
    strips.forEach((s, i) => blit(out, s, Math.floor((COLS - s.w) / 2), y0 + i * lead))
    return
  }
  const s = big(line)
  blit(out, s, COLS - scrolled(t), Math.floor((ROWS - TEXT_UP * 2) / 2) - 1)
}

// The hint: a computer mouse seen from above, between the two flippers it works, each button and its flipper lit in turn.
const MOUSE = { cx: 63.5, top: 1, foot: 28, half: 10.2, split: 12, wheel: [4, 8] as [number, number] }

const inMouse = (x: number, y: number): boolean => {
  const cy = (MOUSE.top + MOUSE.foot) / 2
  const ry = (MOUSE.foot - MOUSE.top) / 2 + 0.5
  const dx = Math.abs(x - MOUSE.cx) / (MOUSE.half + 0.5)
  const dy = Math.abs(y - cy) / ry
  return dx ** 2.6 + dy ** 2.6 <= 1
}

const bat = (x: number, y: number, side: number): number => {
  const ax = MOUSE.cx + side * 52
  const ay = 9
  const bx = MOUSE.cx + side * 22
  const by = 21
  const ux = bx - ax
  const uy = by - ay
  const k = Math.max(0, Math.min(1, ((x - ax) * ux + (y - ay) * uy) / (ux * ux + uy * uy)))
  const d = Math.hypot(x - (ax + ux * k), y - (ay + uy * k))
  return d - (4.6 - 2.2 * k)
}

function drawHint(out: Uint8Array, t: number): void {
  const u = (((t % PACE.hintPeriod) + PACE.hintPeriod) % PACE.hintPeriod) / PACE.hintPeriod
  const half = PACE.hintLit / PACE.hintPeriod
  const leftOn = u < half
  const rightOn = u >= 0.5 && u < 0.5 + half
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let v = 0
      if (inMouse(x, y)) {
        const edge = !inMouse(x - 1, y) || !inMouse(x + 1, y) || !inMouse(x, y - 1) || !inMouse(x, y + 1)
        const mid = x === 63 || x === 64
        const wheel = mid && y >= MOUSE.wheel[0] && y <= MOUSE.wheel[1]
        const seam = y === MOUSE.split || (y < MOUSE.split && mid && (y < MOUSE.wheel[0] - 1 || y > MOUSE.wheel[1] + 1))
        const button = y < MOUSE.split - 1 && !inMouseEdge(x, y)
        if (edge || seam || wheel) v = 255
        else if (button && x < 62 && leftOn) v = 255
        else if (button && x > 65 && rightOn) v = 255
      } else {
        for (const side of [-1, 1]) {
          const d = bat(x, y, side)
          if (d <= 0) v = d > -1 || (side < 0 ? leftOn : rightOn) ? 255 : v
        }
      }
      if (v) out[y * COLS + x] = v
    }
  }
}

const inMouseEdge = (x: number, y: number): boolean => !inMouse(x - 2, y) || !inMouse(x + 2, y) || !inMouse(x, y - 2)

export function compose(show: Show, out: Uint8Array): void {
  out.fill(0)
  if (show.kind === 'score') drawScore(out, show.digits, show.since, show.before)
  else if (show.kind === 'mode') drawMode(out, show.name, show.line, show.t)
  else if (show.kind === 'hint') drawHint(out, show.t)
  if (show.kind !== 'blank') for (let y = 0; y < ROWS; y++) for (const x of [0, COLS - 1]) if (out[y * COLS + x]! < PACE.burn) out[y * COLS + x] = PACE.burn
}

// Names everything `compose` draws from, so a grid is drawn again only when it would differ.
export function keyOf(show: Show): string {
  if (show.kind === 'blank') return 'blank'
  if (show.kind === 'score') {
    const rolling = show.before !== null && show.since >= 0 && show.since < PACE.roll
    return `score|${show.digits}|${rolling ? `${show.before}|${Math.round((show.since / PACE.roll) * 8)}` : ''}`
  }
  if (show.kind === 'mode') return show.t < PACE.hold ? `name|${show.name}` : `line|${show.line}|${scrolled(show.t)}`
  const u = (((show.t % PACE.hintPeriod) + PACE.hintPeriod) % PACE.hintPeriod) / PACE.hintPeriod
  const half = PACE.hintLit / PACE.hintPeriod
  return `hint|${u < half ? 'L' : u >= 0.5 && u < 0.5 + half ? 'R' : '-'}`
}

export const ascii = (data: Uint8Array): string => {
  let s = ''
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) s += data[y * COLS + x]! > 128 ? '#' : data[y * COLS + x]! > 0 ? ':' : '.'
    s += '\n'
  }
  return s
}

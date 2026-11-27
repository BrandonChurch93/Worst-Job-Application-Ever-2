import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { T, TICKER } from '../src/pages/marketing/layout'
import { block } from '../src/shell/metrics'
import { dataOf, styles, type RunData } from '../src/shell/real/type'
import { words } from '../src/shell/words'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, type Driver } from '../src/stage/stage'
import type { DrawList, Pointer, Shape } from '../src/stage/types'

const LEFT = TICKER.x + TICKER.clip
const RIGHT = TICKER.x + TICKER.w - TICKER.clip
const still: Driver = { name: 'bot', input: (): Pointer => ({ x: 1890, y: 40, down: false }) }
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const live = (rejected = false): Stage =>
  new Stage({ mode: 'live', flow: rejected ? [{ page: 'marketing', variant: 'rejected' }, { page: 'step1' }] : liveFlow(), pages, driver: still, seed: config.seed })

function runs(stage: Stage): Shape[] {
  const list: DrawList = []
  stage.page.draw(list)
  return list.filter((d) => d.kind === 'text' && /^ticker-.*-run$/.test(d.id))
}

const wide = (key: string): number => block(T.tape.font, words(key), T.tape.px).width

// The ink of a run as the maker of type sets it: the least and the largest x of its outlines, in page pixels.
const inks = new Map<string, [number, number, number]>()
function ink(r: Shape): [number, number, number] {
  const key = `${r.words}|${r.w}|${r.type!.align ?? ''}|${r.type!.cut ?? ''}`
  let hit = inks.get(key)
  if (!hit) {
    const data: RunData = dataOf(r, words(r.words!), styles()['page:ink']!)
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < data.position.length; i += 3) {
      lo = Math.min(lo, data.position[i]!)
      hi = Math.max(hi, data.position[i]!)
    }
    inks.set(key, (hit = [lo, hi, data.triangles]))
  }
  return [r.x + r.w / 2 + hit[0], r.x + r.w / 2 + hit[1], hit[2]]
}

interface Seen { steps: number; whole: number; head: number; tail: number; overRight: number; overLeft: number; least: number }
function walk(stage: Stage, steps: number, seen: Seen, label: string): void {
  let last = new Map<string, number>()
  for (let step = 0; step < steps; step++) {
    if (stage.page.id !== 'marketing') break
    const now = new Map<string, number>()
    for (const r of runs(stage)) {
      const W = wide(r.words!)
      const cut = r.type!.cut === true
      const tail = cut && r.type!.align === 'right'
      expect(r.x, `${label} step ${step} ${r.id}: the box begins in the window`).toBeGreaterThanOrEqual(LEFT)
      expect(r.x + r.w, `${label} step ${step} ${r.id}: the box ends in the window`).toBeLessThanOrEqual(RIGHT)
      if (!cut) expect(Math.abs(r.w - W), `${label} step ${step} ${r.id}: a run that is not cut is whole`).toBeLessThan(0.001)
      else expect(r.w, `${label} step ${step} ${r.id}: a cut run is narrower than the whole`).toBeLessThan(W)
      const [lo, hi, triangles] = ink(r)
      expect(triangles, `${label} step ${step} ${r.id}: something is set`).toBeGreaterThan(0)
      expect(lo, `${label} step ${step} ${r.id}: ink left of the window`).toBeGreaterThanOrEqual(LEFT)
      expect(hi, `${label} step ${step} ${r.id}: ink right of the window`).toBeLessThanOrEqual(RIGHT)
      seen.overRight = Math.max(seen.overRight, hi - RIGHT)
      seen.overLeft = Math.max(seen.overLeft, LEFT - lo)
      seen.least = Math.min(seen.least, r.w)
      if (!cut) seen.whole++
      else if (tail) seen.tail++
      else seen.head++
      now.set(r.id, tail ? r.x + r.w - W : r.x)
    }
    for (const [id, x] of now) {
      const was = last.get(id)
      if (was !== undefined && Math.abs(x - was) < 400) expect(Math.abs(x - was), `${label} step ${step} ${id}: the tape runs on at its speed`).toBeLessThan(1)
    }
    last = now
    seen.steps++
    stage.advance(1)
  }
}

const fresh = (): Seen => ({ steps: 0, whole: 0, head: 0, tail: 0, overRight: -Infinity, overLeft: -Infinity, least: Infinity })

describe('the tape of the careers page stays in its window', () => {
  it('sets no part of a run past an end of the window on any step of the first 60 s of the live page', () => {
    const seen = fresh()
    walk(live(), 60 * stepHz, seen, 'live')
    expect(seen.steps).toBe(60 * stepHz)
    expect(seen.overRight).toBeLessThanOrEqual(0)
    expect(seen.overLeft).toBeLessThanOrEqual(0)
    expect(seen.least).toBeGreaterThan(2)
    expect(seen.head).toBeGreaterThan(1000)
    expect(seen.tail).toBeGreaterThan(1000)
    expect(seen.whole).toBeGreaterThan(1000)
  })

  it('does so on every step of the film frames 0 to 839', () => {
    const seen = fresh()
    walk(film(), 840 * (stepHz / config.film.fps), seen, 'film')
    expect(seen.steps).toBe(840 * (stepHz / config.film.fps))
    expect(seen.head).toBeGreaterThan(1000)
    expect(seen.tail).toBeGreaterThan(1000)
  })

  it('does so after the rejection, for 30 s', () => {
    const seen = fresh()
    walk(live(true), 30 * stepHz, seen, 'rejected')
    expect(seen.steps).toBe(30 * stepHz)
    expect(seen.head + seen.tail).toBeGreaterThan(1000)
  })

  it('cuts a run in whole letters of its own line: the head of the line as it comes in, the tail as it leaves, never other words', () => {
    const key = 'copy:marketing.ticker.4'
    const line = words(key)
    expect(copy.marketing.ticker[4]).toBe(line)
    const W = wide(key)
    const style = styles()['page:ink']!
    const ends = (d: RunData): [number, number] => {
      let lo = Infinity
      let hi = -Infinity
      for (let i = 0; i < d.position.length; i += 3) {
        lo = Math.min(lo, d.position[i]!)
        hi = Math.max(hi, d.position[i]!)
      }
      return [lo, hi]
    }
    const shape = (w: number, type: Shape['type']): Shape => ({ id: 'a-run', part: 'type', kind: 'text', x: 0, y: 0, w, h: 14, z0: -2, z1: -2, tone: 'ink', words: key, type })
    const chars = Array.from(line)
    const whole = dataOf(shape(W, T.tape), line, style)
    const [first, lastInk] = ends(whole)
    let before = 0
    for (let n = 1; n < chars.length; n++) {
      const w = block(T.tape.font, chars.slice(0, n).join(''), T.tape.px).width
      const head = dataOf(shape(w, { ...T.tape, cut: true }), line, style)
      const alone = dataOf(shape(w, T.tape), chars.slice(0, n).join(''), style)
      expect(Array.from(head.position), `the first ${n} letters are the line's first ${n}`).toEqual(Array.from(alone.position))
      expect(head.triangles).toBeGreaterThanOrEqual(before)
      before = head.triangles
      expect(Math.abs(ends(head)[0] + w / 2 - (first + W / 2)), `the head begins where the whole line begins, ${n}`).toBeLessThan(0.001)
      const v = block(T.tape.font, chars.slice(chars.length - n).join(''), T.tape.px).width
      const tail = dataOf(shape(v, { ...T.tape, cut: true, align: 'right' }), line, style)
      const end = dataOf(shape(v, { ...T.tape, align: 'right' }), chars.slice(chars.length - n).join(''), style)
      expect(Array.from(tail.position), `the last ${n} letters are the line's last ${n}`).toEqual(Array.from(end.position))
      expect(Math.abs(ends(tail)[1] - v / 2 - (lastInk - W / 2)), `the tail ends where the whole line ends, ${n}`).toBeLessThan(0.001)
    }
    expect(before).toBeGreaterThan(0)
    expect(before).toBeLessThan(whole.triangles)
    expect(dataOf(shape(1, { ...T.tape, cut: true }), line, style).triangles, 'no room, no letter').toBe(0)
  })
})

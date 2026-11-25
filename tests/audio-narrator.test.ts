import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { Narrator, duckAt, duckSpans } from '../src/audio/narrator'
import { DUCK, LIVE, db } from '../src/audio/levels'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const lineGap: number = cfg.audio.lineGapSeconds
const make = () => new Narrator({ minGap: gap, lineGap, beatLate: LIVE.beatLateSeconds, liveLate: LIVE.liveLateSeconds })

describe('the live narrator', () => {
  it('speaks a live line at once when nothing is said', () => {
    const b = make().live(10, 'line.live.idle.0', 'idle', 2)
    expect(b).toMatchObject({ start: 10, end: 12, kind: 'live' })
  })

  it('never interrupts a line that is being spoken', () => {
    const n = make()
    n.live(10, 'a', 'idle', 3)
    expect(n.live(11, 'b', 'hit', 1)).toBeNull()
    expect(n.speaking(11)!.id).toBe('a')
    expect(n.bookings(11).map((b) => b.id)).toEqual(['a'])
  })

  it('keeps two lines at least the gap apart', () => {
    const n = make()
    n.live(10, 'a', 'idle', 2)
    expect(n.live(12 + gap - LIVE.liveLateSeconds - 0.5, 'b', 'hit', 1)).toBeNull()
    const ok = n.live(12 + gap, 'c', 'hit', 1)
    expect(ok).not.toBeNull()
    expect(ok!.start - 12).toBeGreaterThanOrEqual(gap)
  })

  it('drops a line that would be late and does not queue it', () => {
    const n = make()
    n.live(0, 'a', 'idle', 2)
    for (let t = 2; t < 2 + gap - LIVE.liveLateSeconds - 0.01; t += 0.25) expect(n.live(t, `late-${t}`, 'hit', 1)).toBeNull()
    expect(n.bookings(2 + gap).length).toBeLessThanOrEqual(1)
    expect(n.live(2 + gap + 0.01, 'b', 'hit', 1)).not.toBeNull()
  })

  it('lets a line start a moment late, never more', () => {
    const n = make()
    n.live(0, 'a', 'idle', 2)
    const b = n.live(2 + gap - LIVE.liveLateSeconds / 2, 'b', 'hit', 1)
    expect(b).not.toBeNull()
    expect(b!.start).toBeCloseTo(2 + gap, 9)
  })

  it('does not speak a live line into a line of the beat that is about to start', () => {
    const n = make()
    n.beat(0, 'boss.verify', [{ id: 'line.boss.verify.0', offset: 3, seconds: 2 }])
    expect(n.live(0.5, 'x', 'hit', 1)).toBeNull()
    expect(n.live(5 + gap, 'y', 'hit', 1)).not.toBeNull()
  })
})

describe('the lines of a beat', () => {
  it('speaks each line at its place', () => {
    const r = make().beat(100, 'step1.tug', [{ id: 'l0', offset: 0.5, seconds: 2 }, { id: 'l1', offset: 4, seconds: 1.5 }])
    expect(r.spoken.map((b) => [b.id, b.start, b.end])).toEqual([['l0', 100.5, 102.5], ['l1', 104, 105.5]])
    expect(r.dropped).toEqual([])
  })

  it('moves a line behind the one before it, with the gap between lines', () => {
    const r = make().beat(0, 'b', [{ id: 'l0', offset: 0, seconds: 2 }, { id: 'l1', offset: 1.5, seconds: 1 }])
    expect(r.spoken[1]!.start).toBeCloseTo(2 + lineGap, 9)
    expect(r.spoken[1]!.start - r.spoken[0]!.end).toBeGreaterThanOrEqual(lineGap - 1e-9)
  })

  it('drops a line of a beat that would be too late', () => {
    const r = make().beat(0, 'b', [{ id: 'l0', offset: 0, seconds: 6 }, { id: 'l1', offset: 1, seconds: 1 }])
    expect(r.spoken.map((b) => b.id)).toEqual(['l0'])
    expect(r.dropped).toEqual(['l1'])
  })

  it('gives up the unstarted lines of the beat before, and leaves the one being spoken', () => {
    const n = make()
    n.beat(0, 'one', [{ id: 'a', offset: 0, seconds: 3 }, { id: 'b', offset: 5, seconds: 1 }])
    const r = n.beat(2, 'two', [{ id: 'c', offset: 0, seconds: 1 }])
    expect(r.cancelled.map((b) => b.id)).toEqual(['b'])
    expect(n.speaking(2)!.id).toBe('a')
    expect(r.spoken[0]!.start).toBeCloseTo(3 + lineGap, 9)
  })

  it('never lets two lines overlap, whatever is asked', () => {
    const n = make()
    let t = 0
    for (let i = 0; i < 60; i++) {
      t += 0.37 + (i % 5) * 0.41
      if (i % 3 === 0) n.beat(t, `beat-${i}`, [{ id: `f${i}a`, offset: 0.2, seconds: 1.1 }, { id: `f${i}b`, offset: 1.6, seconds: 0.9 }])
      else n.live(t, `l${i}`, 'hit', 0.8 + (i % 4) * 0.3)
      const all = n.bookings(t).slice().sort((a, b) => a.start - b.start)
      for (let k = 1; k < all.length; k++) {
        const between = all[k]!.start - all[k - 1]!.end
        expect(between).toBeGreaterThanOrEqual(lineGap - 1e-9)
        if (all[k]!.kind === 'live' || all[k - 1]!.kind === 'live') expect(between).toBeGreaterThanOrEqual(gap - 1e-9)
      }
    }
  })
})

describe('the effects under a line', () => {
  const low = db(-cfg.audio.duckDb)

  it('are lowered by audio.duckDb while the line is spoken', () => {
    const spans = duckSpans([{ start: 2, end: 4 }], DUCK.attackSeconds, DUCK.releaseSeconds)
    expect(duckAt(1, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds)).toBe(1)
    expect(duckAt(2, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds)).toBeCloseTo(low, 9)
    expect(20 * Math.log10(duckAt(3, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds))).toBeCloseTo(-cfg.audio.duckDb, 6)
    expect(duckAt(4 + DUCK.releaseSeconds + 0.01, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds)).toBe(1)
  })

  it('move down and up without a step', () => {
    const spans = duckSpans([{ start: 2, end: 4 }, { start: 4.2, end: 5 }, { start: 9, end: 10 }], DUCK.attackSeconds, DUCK.releaseSeconds)
    expect(spans).toEqual([{ from: 2, to: 5 }, { from: 9, to: 10 }])
    let last = duckAt(0, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds)
    for (let t = 0; t < 12; t += 0.001) {
      const g = duckAt(t, spans, low, DUCK.attackSeconds, DUCK.releaseSeconds)
      expect(Math.abs(g - last)).toBeLessThan(0.02)
      expect(g).toBeGreaterThanOrEqual(low - 1e-9)
      expect(g).toBeLessThanOrEqual(1 + 1e-9)
      last = g
    }
  })
})

import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { words } from '../src/shell/words'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, Stage } from '../src/stage/stage'
import { makeSaid, messagesOf, SAY, sayTime } from '../src/ui/said'

const strings = (v: unknown, out = new Set<string>()): Set<string> => {
  if (typeof v === 'string') out.add(v)
  else if (v !== null && typeof v === 'object') for (const x of Object.values(v)) strings(x, out)
  return out
}

describe('the live region: what the page says', () => {
  it('three messages in one frame are three writes, in their order, each with its own time', () => {
    const said = makeSaid()
    const out: { t: number; text: string }[] = []
    for (let i = 0; i <= 600; i++) {
      const t = i / 60
      const w = said.frame(1, ['one', 'two', 'three'], t)
      if (w !== null) out.push({ t, text: w })
    }
    expect(out.map((o) => o.text)).toEqual(['one', 'two', 'three'])
    expect(out[1]!.t - out[0]!.t).toBeGreaterThanOrEqual(sayTime('one'))
    expect(out[2]!.t - out[1]!.t).toBeGreaterThanOrEqual(sayTime('two'))
    expect(out[2]!.t).toBeLessThan(sayTime('one') + sayTime('two') + 0.05)
  })

  it('a message still on the page, or shown again in the same step, is not said again', () => {
    const said = makeSaid()
    const out: string[] = []
    const run = (messages: string[], from: number, to: number) => {
      for (let t = from; t < to; t += 1 / 60) {
        const w = said.frame(2, messages, t)
        if (w !== null) out.push(w)
      }
    }
    run(['a'], 0, 5)
    run([], 5, 6)
    run(['a', 'b'], 6, 12)
    expect(out).toEqual(['a', 'b'])
  })

  it('the first frame writes nothing where nothing is to say, and a new step clears the words of the last', () => {
    const said = makeSaid()
    expect(said.frame(0, [], 0)).toBeNull()
    expect(said.frame(0, ['a'], 0.1)).toBe('a')
    expect(said.frame(0, ['a'], 9)).toBeNull()
    expect(said.frame(1, [], 9.1)).toBe('')
    expect(said.frame(1, ['a'], 9.2)).toBe('a')
  })

  it('a display that changes faster than a voice: every one of its messages is said, none twice, the last ones together when the step ends', () => {
    const said = makeSaid()
    const fast = Array.from({ length: 12 }, (_, i) => `message ${i}`)
    const out: { t: number; text: string }[] = []
    let t = 0
    for (let i = 0; i < 12 * 6; i++) {
      t = i / 60
      const w = said.frame(3, [fast[Math.floor(i / 6)]!], t)
      if (w !== null) out.push({ t, text: w })
    }
    expect(out.length).toBeLessThan(4)
    for (let i = 1; i < out.length; i++) expect(out[i]!.t - out[i - 1]!.t).toBeGreaterThanOrEqual(SAY.baseSeconds)
    expect(said.waiting()).toBe(12 - out.length)
    const rest = said.frame(4, [], t + 1 / 60)
    expect([...out.map((o) => o.text), rest].join(' ')).toBe(fast.join(' '))
    expect(said.waiting()).toBe(0)
    expect(said.frame(4, ['next'], t + 2 / 60)).toBeNull()
    expect(said.frame(4, ['next'], t + 1 / 60 + sayTime(rest!))).toBe('next')
  })

  it('a time to say grows with the letters and stops at the cap', () => {
    expect(sayTime('')).toBe(SAY.baseSeconds)
    expect(sayTime('x'.repeat(20))).toBeCloseTo(SAY.baseSeconds + 20 * SAY.secondsPerLetter, 9)
    expect(sayTime('x'.repeat(2000))).toBe(SAY.capSeconds)
  })
})

describe('the live region through the whole site', () => {
  const all = strings(copy)
  for (const name of ['keen', 'clumsy', 'skipper'] as const) {
    it(`${name}: every message the pages show is written once, in the order it came, as the text of the copy, and no two writes closer than the time of the first`, () => {
      const stage = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver(name, config.seed) })
      const said = makeSaid()
      let entry = -1
      let atRest = new Set<string>()
      const came: string[][] = []
      const wrote: { t: number; text: string; step: number }[] = []
      let late = 0
      const first = new Map<string, number>()
      while (!stage.finished && stage.time < config.live.botMaxSeconds) {
        stage.advance(2)
        const f = stage.frameAt(stage.time)
        if (stage.entryIndex !== entry) {
          entry = stage.entryIndex
          atRest = new Set(f.list.filter((s) => s.kind === 'text' && s.words).map((s) => s.words!))
          came.push([])
          first.clear()
        }
        const messages = messagesOf(f.list, atRest, words)
        for (const m of messages) {
          if (first.has(m)) continue
          first.set(m, stage.time)
          came.at(-1)!.push(m)
        }
        const w = said.frame(entry, messages, stage.time)
        if (w) {
          wrote.push({ t: stage.time, text: w, step: entry })
          if (first.has(w)) late = Math.max(late, stage.time - first.get(w)!)
        }
      }
      const rest = said.frame(entry + 1, [], stage.time)
      if (rest) wrote.push({ t: stage.time, text: rest, step: entry + 1 })
      expect(stage.finished).toBe(true)
      const shown = came.flat()
      expect(shown.length).toBeGreaterThan(20)
      for (const m of shown) expect(all.has(m), m).toBe(true)
      expect(wrote.map((w) => w.text).join(' ')).toBe(shown.join(' '))
      for (let i = 1; i < wrote.length; i++) {
        if (wrote[i]!.step !== wrote[i - 1]!.step) continue
        expect(wrote[i]!.t - wrote[i - 1]!.t, wrote[i]!.text).toBeGreaterThanOrEqual(sayTime(wrote[i - 1]!.text) - 1e-9)
      }
      console.log(`${name}: ${shown.length} messages on ${came.length} pages, ${wrote.length} writes, the latest ${late.toFixed(2)} s after it came`)
    }, 120000)
  }
})

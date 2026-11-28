import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { config } from '../src/config'
import { earlyEnd, endsSentence } from '../src/audio/cues'
import { standIns, type StandIn } from '../src/audio/standin'
import { LINE6, LINE7 } from '../src/boss/tune'

// The boss page keeps its own clock for lines 6 and 7 (src/boss/tune.ts): the film is stepped without the sound engine, and the live page must know where a phrase ends.
// These tests hold that clock to the takes that are kept and packed (public/audio/index.json, read through standIns()), so a new take or an edited one fails here instead of drifting.
describe('the boss page keeps time by the kept takes of lines 6 and 7', () => {
  const lines = standIns()
  const line = (key: string): StandIn => {
    const l = lines.get(key)
    if (!l) throw new Error(`the script has no line ${key}`)
    return l
  }
  const ends = (l: StandIn): number[] => l.phrases.map((p, i) => (i + 1 < l.phrases.length ? l.phrases[i + 1]!.from : l.seconds))

  it('each of the four lines is a kept take, not a stand-in', () => {
    for (const key of ['boss.verify.0', 'boss.unfold.0', 'boss.unfold.1', 'boss.unfold.2']) expect(line(key).kept, key).toBe(true)
  })

  it('line 7 may start no sooner than line 6 has ended and the gap between two lines has passed', () => {
    expect(LINE6.after).toBeCloseTo(line('boss.verify.0').seconds + config.audio.lineGapSeconds, 6)
  })

  it('the gap the boss page leaves between the parts of line 7 is the gap between two lines', () => {
    expect(LINE7.gap).toBe(config.audio.lineGapSeconds)
  })

  it('part 0 of line 7 has the length and the phrase ends of its kept take', () => {
    const l = line('boss.unfold.0')
    expect(LINE7.part0).toBeCloseTo(l.seconds, 6)
    expect(LINE7.ends.length).toBe(l.phrases.length)
    ends(l).forEach((t, i) => expect(LINE7.ends[i], `phrase ${i}: "${l.phrases[i]!.words}"`).toBeCloseTo(t, 6))
  })

  it('the sentence ends of part 0 of line 7 are the ends of the phrases that end a sentence in the script, and the page ends the line after a click where the voice does', () => {
    const l = line('boss.unfold.0')
    const want = ends(l).filter((_, i) => endsSentence(l.phrases[i]!.words))
    expect(LINE7.sentences.length).toBe(want.length)
    want.forEach((t, i) => expect(LINE7.sentences[i], `sentence ${i}`).toBeCloseTo(t, 6))
    for (const t of LINE7.sentences) expect(LINE7.ends as readonly number[]).toContain(t)
    const voice = (at: number) => earlyEnd(l.phrases.map((p) => p.to), l.phrases.filter((p) => endsSentence(p.words)).map((p) => p.to), at)
    for (let at = 0; at <= LINE7.part0 + 0.05; at += 0.01) expect(earlyEnd(LINE7.ends, LINE7.sentences, at), `${at}`).toBeCloseTo(voice(at), 6)
    expect(readFileSync(new URL('../src/pages/step4/index.ts', import.meta.url), 'utf8')).toContain('s.turned = earlyEnd(LINE7.ends, LINE7.sentences, s.t)')
  })

  it('part 1 of line 7 has the length of its kept take, and the music comes in where its last phrase starts', () => {
    const l = line('boss.unfold.1')
    expect(LINE7.part1).toBeCloseTo(l.seconds, 6)
    expect(LINE7.music).toBeCloseTo(l.phrases[l.phrases.length - 1]!.from, 6)
  })

  // Since b6ffb6e6 the gold builds over the last phrase of part 2 and is full on its last word: it starts where that phrase starts and ends where the take ends.
  it('part 2 of line 7 has the length of its kept take, and the gold builds from the start of its last phrase to its end', () => {
    const l = line('boss.unfold.2')
    expect(LINE7.part2).toBeCloseTo(l.seconds, 6)
    expect(LINE7.power).toBeGreaterThan(0)
    expect(LINE7.power).toBeCloseTo(l.phrases[l.phrases.length - 1]!.from, 6)
    expect(LINE7.power + LINE7.glow).toBeCloseTo(l.seconds, 6)
  })
})

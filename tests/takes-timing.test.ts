import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
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

  it('part 1 of line 7 has the length of its kept take, and the music comes in where its last phrase starts', () => {
    const l = line('boss.unfold.1')
    expect(LINE7.part1).toBeCloseTo(l.seconds, 6)
    expect(LINE7.music).toBeCloseTo(l.phrases[l.phrases.length - 1]!.from, 6)
  })

  it('part 2 of line 7 has the length of its kept take, and the gold starts inside it', () => {
    const l = line('boss.unfold.2')
    expect(LINE7.part2).toBeCloseTo(l.seconds, 6)
    expect(LINE7.power).toBeGreaterThan(0)
    expect(LINE7.power + LINE7.glow).toBeLessThan(l.seconds)
  })
})

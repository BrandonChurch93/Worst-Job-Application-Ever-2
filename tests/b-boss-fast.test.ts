import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { config } from '../src/config'
import { earlyEnd, endsSentence } from '../src/audio/cues'
import { LINE6, LINE7 } from '../src/boss/tune'

// The boss page is timed ahead for the narrator's lines without pause marks (pipeline/change002/fast-takes.json).
// Until such takes are kept these tests hold its clock to that file; tests/takes-timing.test.ts holds it to the kept takes and is red on this branch.
interface Fast { words: string; seconds: number; starts: number[]; keptSeconds: number }
const fast = JSON.parse(readFileSync(new URL('../pipeline/change002/fast-takes.json', import.meta.url), 'utf8')) as { lines: Record<string, Fast> }

describe('the boss page keeps time by the lines without pauses', () => {
  const line = (key: string): Fast => {
    const l = fast.lines[`line.${key}`]
    if (!l) throw new Error(`fast-takes.json has no line ${key}`)
    return l
  }
  const ends = (l: Fast): number[] => l.starts.map((_, i) => (i + 1 < l.starts.length ? l.starts[i + 1]! : l.seconds))
  const words = (l: Fast): string[] => l.words.split(' / ')

  it('line 7 may start no sooner than line 6 has ended and the gap between two lines has passed', () => {
    expect(LINE6.after).toBeCloseTo(line('boss.verify.0').seconds + config.audio.lineGapSeconds, 6)
    expect(LINE7.gap).toBe(config.audio.lineGapSeconds)
  })

  it('part 0 of line 7 has the length and the phrase ends of the line without pauses', () => {
    const l = line('boss.unfold.0')
    expect(words(l).length).toBe(l.starts.length)
    expect(LINE7.part0).toBeCloseTo(l.seconds, 6)
    expect(LINE7.ends.length).toBe(l.starts.length)
    ends(l).forEach((t, i) => expect(LINE7.ends[i], `phrase ${i}: "${words(l)[i]}"`).toBeCloseTo(t, 6))
  })

  it('the sentence ends of part 0 are the ends of the phrases that end a sentence, and a click ends the line at one of them', () => {
    const l = line('boss.unfold.0')
    const want = ends(l).filter((_, i) => endsSentence(words(l)[i]!))
    expect(LINE7.sentences.length).toBe(want.length)
    want.forEach((t, i) => expect(LINE7.sentences[i], `sentence ${i}`).toBeCloseTo(t, 6))
    for (const t of LINE7.sentences) expect(LINE7.ends as readonly number[]).toContain(t)
    for (let at = 0; at <= LINE7.part0 + 0.05; at += 0.01) expect(LINE7.ends as readonly number[], `${at}`).toContain(earlyEnd(LINE7.ends, LINE7.sentences, at))
  })

  it('part 1 has the length of the line without pauses, and the music comes in where its last phrase starts', () => {
    const l = line('boss.unfold.1')
    expect(LINE7.part1).toBeCloseTo(l.seconds, 6)
    expect(LINE7.music).toBeCloseTo(l.starts[l.starts.length - 1]!, 6)
  })

  it('part 2 has the length of the line without pauses; the gold starts inside its first phrase, and the rise keeps the length the kept take gave it', () => {
    const l = line('boss.unfold.2')
    expect(LINE7.part2).toBeCloseTo(l.seconds, 6)
    expect(LINE7.power).toBeGreaterThan(l.starts[0]!)
    expect(LINE7.power).toBeLessThan(l.starts[1]!)
    expect(LINE7.rise).toBeCloseTo(l.keptSeconds, 6)
    expect(LINE7.rise).toBeGreaterThanOrEqual(LINE7.part2)
    expect(LINE7.power + LINE7.glow).toBeLessThan(LINE7.rise)
  })
})

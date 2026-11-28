import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SENTENCE_WAIT_SECONDS, endsSentence } from '../src/audio/cues'
import { LIVE } from '../src/audio/levels'
import type { KeptLine } from '../src/audio/standin'
import { TURN_HALF } from '../src/stage/stage'

// The times the sound code holds that belong to something else: a take, the page turn. Each is read from where it lives, or held against it here.

const root = process.cwd()
const read = (...p: string[]) => readFileSync(path.join(root, ...p), 'utf8')
const mark = (JSON.parse(read('content', 'narration.json')) as { pauseMark: string }).pauseMark
const shipped = JSON.parse(read('public', 'audio', 'index.json')) as { lines: KeptLine[] }

describe('the wait for a sentence', () => {
  it('is no shorter than the first sentence of line 7 in the pack and no more than 0.05 s longer, and stays a number of the table of cues because that table imports nothing', () => {
    const line = shipped.lines.find((l) => l.id === 'line.boss.unfold.0')
    expect(line?.starts?.length).toBeGreaterThan(1)
    const words = line!.words!.split(mark).map((w) => w.trim())
    const first = words.findIndex((w) => endsSentence(w))
    const ends = line!.starts![first + 1] ?? line!.seconds
    console.info(`MEASURED the first sentence of ${line!.id} ends at ${ends} s in the pack; the wait is ${SENTENCE_WAIT_SECONDS} s`)
    expect(SENTENCE_WAIT_SECONDS).toBeGreaterThanOrEqual(ends)
    expect(SENTENCE_WAIT_SECONDS - ends).toBeLessThan(0.05)
    expect(/^import\s/m.test(read('src', 'audio', 'cues.ts'))).toBe(false)
  })
})

describe('the numbers the sound code named', () => {
  it('reads half a page turn from the stage, the mix fades by the loop fade of the levels, and the engine names its shortest wait', () => {
    expect(LIVE.quietTurnSeconds).toBe(TURN_HALF)
    expect(read('src', 'audio', 'levels.ts')).toMatch(/quietTurnSeconds: TURN_HALF\b/)
    expect(read('src', 'audio', 'mix.ts')).toMatch(/Math\.round\(LIVE\.loopFadeSeconds \* sr\)/)
    expect(read('src', 'audio', 'index.ts')).toMatch(/wallSeconds\(\) \+ LIVE\.elementSoonSeconds/)
    expect(LIVE.loopFadeSeconds).toBe(0.03)
    expect(LIVE.elementSoonSeconds).toBe(0.005)
    for (const f of ['mix.ts', 'index.ts']) expect(read('src', 'audio', f), f).not.toMatch(/[^\w.](0\.03|0\.005)\b/)
  })
})

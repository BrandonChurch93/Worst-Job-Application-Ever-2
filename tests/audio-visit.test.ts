import { describe, expect, it } from 'vitest'
import * as engine from '../src/audio/index'
import * as stageModule from '../src/stage/stage'
import * as botsModule from '../src/stage/bots'
import * as pagesModule from '../src/pages'
import * as configModule from '../src/config'
import { endsSentence, spoken } from '../src/audio/cues'
import { LIVE } from '../src/audio/levels'
import { keyPage, standIns } from '../src/audio/standin'
import { config } from '../src/config'
import { visit } from '../tools/lib/sound-visit.mjs'

interface Entry { at: number; line: string; trigger: string; what: string; start?: number; seconds?: number; why?: string; page: string }
interface Visit { bot: string; heldSeconds: number; voices: { id: string; start: number; stop: number | null }[]; lines: number; finished: boolean; seconds: number; skips: number; turns: { at: number; page: string }[]; log: Entry[]; loops: { id: string; page: string; start: number; stop: number | null }[]; volumes: { at: number; page: string; volume: number }[]; volumeSteps: { at: number; page: string; volume: number; output: number }[]; events: Record<string, number> }

const modules: Record<string, unknown> = { '/src/audio/index.ts': engine, '/src/stage/stage.ts': stageModule, '/src/stage/bots.ts': botsModule, '/src/pages/index.ts': pagesModule, '/src/config.ts': configModule }
const load = async (f: string) => modules[f]
const run = (bot: string): Promise<Visit> => visit(load, config, bot)
interface Call { at: number; event?: { name: string; page?: string } }
const runWith = async (bot: string, held: boolean): Promise<{ v: Visit; turn: number }> => {
  const calls: Call[] = []
  const v: Visit = await visit(load, config, bot, config.seed, calls as never, held)
  return { v, turn: calls.find((x) => x.event?.name === 'page-turn' && x.event.page === 'step5')!.at }
}
const gap = config.audio.liveNarratorMinGapSeconds
const lineGap = config.audio.lineGapSeconds
const pageOfLine: Record<string, string> = Object.fromEntries(Object.keys(spoken).map((key) => [`line.${key}`, keyPage(key)]))
const script = standIns()
const partOf = (line: string) => spoken[line.slice(5)]?.after !== undefined
const keeps = (line: string) => spoken[line.slice(5)]?.keeps === true
const heard = (v: Visit): Entry[] => {
  const back = new Set(v.log.filter((e) => e.what === 'taken back').map((e) => `${e.line}@${e.start}`))
  return v.log.filter((e) => e.what === 'spoken' && !back.has(`${e.line}@${e.start}`))
}
const leftAt = (v: Visit, at: number): number => v.turns.find((t) => t.at > Math.max(at, v.turns[0]?.at ?? 0))?.at ?? v.seconds

describe('a whole visit of the live site through the stage and the sound engine', () => {
  it('lets the keen visitor hear only lines of the script, each once in a run, set off on its own page, line 1 first, never two at once and never two closer than the gap', async () => {
    const v = await run('keen')
    expect(v.finished).toBe(true)
    const lines = heard(v)
    expect(lines.length).toBeGreaterThanOrEqual(3)
    const voiced = v.log.filter((e) => e.what === 'spoken' && script.get(e.line.slice(5))?.kept === true)
    // A voice is made once for each kept line that is spoken, and once more for each later part of a line that a jump moves.
    const root = (key: string): string => (spoken[key]?.after === undefined ? key : root(spoken[key]!.after!))
    const jumped = new Set(v.log.filter((e) => e.what === 'cut' && spoken[e.line.slice(5)]?.jump !== undefined).map((e) => e.line.slice(5)))
    const again = voiced.filter((e) => partOf(e.line) && jumped.has(root(e.line.slice(5))))
    expect(v.lines).toBe(voiced.length + again.length)
    expect(lines[0]).toMatchObject({ line: 'line.marketing.stroll.0', page: 'marketing' })
    expect(lines[0]!.start!).toBeLessThan(0.1 + LIVE.openingWaitSeconds)
    for (const e of lines) {
      expect(pageOfLine[e.line], e.line).toBeDefined()
      expect(e.start!, e.line).toBeGreaterThanOrEqual(e.at - 1e-9)
      if (!partOf(e.line)) expect(e.page, e.line).toBe(pageOfLine[e.line])
      if (!keeps(e.line) && !partOf(e.line)) expect(e.start!, `${e.line} starts before its page is left`).toBeLessThan(leftAt(v, e.at))
    }
    const order = lines.slice().sort((a, b) => a.start! - b.start!)
    // A line that was cut, as line 1 is when the careers page is closed, lasts what its cut says.
    const cut = new Map(v.log.filter((e) => e.what === 'cut').map((e) => [`${e.line}@${e.start}`, e.seconds!]))
    const lasts = (e: Entry): number => cut.get(`${e.line}@${e.start}`) ?? e.seconds!
    for (let i = 1; i < order.length; i++) expect(order[i]!.start! - (order[i - 1]!.start! + lasts(order[i - 1]!)), `${order[i - 1]!.line} then ${order[i]!.line}`).toBeGreaterThanOrEqual((partOf(order[i]!.line) ? lineGap : gap) - 2e-3)
    const restart = v.turns.filter((t) => t.page === 'marketing').pop()!.at
    const first = lines.filter((e) => e.at < restart).map((e) => e.line)
    expect(new Set(first).size).toBe(first.length)
  })

  it('gets each of the events the sound waited for from its page, once where it is once', async () => {
    const v = await run('keen')
    for (const name of ['carpet-roll', 'metrics-card', 'count-run', 'unfold', 'power-down']) expect(v.events[name], name).toBe(1)
    expect(v.events['checkbox']).toBe(1)
    for (const name of ['inbox-take', 'firehouse-take']) expect(v.events[name] ?? 0, name).toBeGreaterThanOrEqual(1)
    expect(v.events['boss-loop']).toBeUndefined()
  })

  it('runs the fight music from the phrase of line 7 that names it, or the event of the stage that stands for it, to the power down of the boss, the shredder inside step 1, and the room tone from the turn away from the careers page to the turn back to it', async () => {
    const v = await run('keen')
    // The fight music set at a phrase of a line is set again when a jump moves that line: the first is stopped before its start and is never heard.
    const boss = v.loops.filter((l) => l.id === 'boss-loop' && (l.stop === null || l.stop > l.start))
    expect(boss.length).toBe((v.events['boss-formed'] ?? 0) + (v.events['boss-music'] ?? 0) > 0 ? 1 : 0)
    for (const b of boss) {
      expect(b.page).toBe('step4')
      expect(b.stop).not.toBeNull()
      expect(b.stop!).toBeLessThan(leftAt(v, b.start))
    }
    for (const l of v.loops.filter((x) => x.id === 'shredder')) {
      expect(l.page).toBe('step1')
      expect(l.stop!).toBeLessThanOrEqual(leftAt(v, l.start) + 0.1)
    }
    const tone = v.loops.filter((l) => l.id === 'room-tone')
    expect(tone.length).toBe(1)
    const out = v.turns.find((t) => t.page === 'step1')!
    const back = v.turns.filter((t) => t.page === 'marketing').pop()!
    expect(back.at).toBeGreaterThan(out.at)
    expect(Math.abs(tone[0]!.start - out.at)).toBeLessThanOrEqual(0.1)
    expect(tone[0]!.stop).not.toBeNull()
    expect(tone[0]!.stop!).toBeLessThanOrEqual(back.at + 0.1)
    expect(tone[0]!.stop!).toBeGreaterThan(v.turns.find((t) => t.page === 'step5')!.at)
  })

  it('never lets the visitor who skips every step hear a line about a gag he did not see', async () => {
    const v = await run('skipper')
    expect(v.finished).toBe(true)
    expect(v.skips).toBeGreaterThanOrEqual(4)
    for (const e of heard(v)) {
      const page = pageOfLine[e.line]
      expect(page, e.line).toBeDefined()
      if (partOf(e.line) || keeps(e.line)) continue
      expect(e.page, `${e.line} is set off on its own page`).toBe(page)
      expect(e.start!, `${e.line} starts while its page is still shown`).toBeLessThan(leftAt(v, e.at))
    }
    for (const l of v.loops.filter((x) => x.id !== 'room-tone')) expect(l.stop === null ? Infinity : l.stop, l.id).toBeLessThanOrEqual(leftAt(v, l.start) + 0.1)
  })

  it('keeps the volume at 1 on every page but step 2, where the crank takes it from a tenth to the whole', async () => {
    const v = await run('keen')
    expect(v.volumes.length).toBeGreaterThanOrEqual(3)
    expect(v.volumes[0]).toMatchObject({ page: 'marketing', volume: 1 })
    const step2 = v.volumes.slice(1)
    for (const row of step2) expect(row.page).toBe('step2')
    expect(step2[0]!.volume).toBeCloseTo(0.1, 6)
    expect(step2[step2.length - 1]!.volume).toBe(1)
    for (let i = 1; i < step2.length; i++) expect(step2[i]!.volume).toBeGreaterThanOrEqual(step2[i - 1]!.volume)
  })

  it('turns the crank from nothing to 100 percent and reads the output of the engine at each tenth: it is the level the crank shows', async () => {
    const v = await run('keen')
    expect(v.events['crank-runaway']).toBe(1)
    const before = v.volumeSteps.filter((x) => x.page !== 'step2')
    expect(before).toEqual([{ at: before[0]!.at, page: 'marketing', volume: 1, output: 1 }])
    const crank = v.volumeSteps.filter((x) => x.page === 'step2')
    expect(crank.map((x) => x.output)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    for (const x of crank) expect(x.output).toBe(x.volume)
    for (const tenth of [0.1, 0.3, 0.5, 0.7, 1]) expect(crank.filter((x) => x.output === tenth).length).toBe(1)
    const step3 = v.turns.find((t) => t.page === 'step3')!.at
    expect(crank[crank.length - 1]!.at).toBeLessThan(step3)
    expect(v.volumeSteps[v.volumeSteps.length - 1]).toMatchObject({ page: 'step2', output: 1 })
    const skipper = await run('skipper')
    expect(skipper.volumeSteps.map((x) => x.output)).toEqual([1])
  })

  for (const bot of ['keen', 'clumsy']) {
    it(`on the ${bot} visit says the two parts after the first part of line 7 whole, has nothing of line 7 taken back by the turrets, and has the music, the gold and the lock of the page on their words`, async () => {
      const calls: Call[] = []
      const v: Visit = await visit(load, config, bot, config.seed, calls as never, true)
      const at = (name: string) => calls.filter((x) => x.event?.name === name && x.event.page === 'step4').map((x) => x.at)
      const seven = v.log.filter((e) => e.line.startsWith('line.boss.unfold.'))
      expect(seven.filter((e) => e.what === 'taken back')).toEqual([])
      expect(seven.filter((e) => e.what === 'cut').map((e) => e.line)).toEqual(['line.boss.unfold.0'])
      const heard = (key: string) => v.voices.filter((x) => x.id === `line.${key}` && (x.stop === null || x.stop > x.start))
      for (const key of ['boss.unfold.1', 'boss.unfold.2']) {
        expect(heard(key).length, key).toBe(1)
        expect(heard(key)[0]!.stop, key).toBeNull()
      }
      const one = heard('boss.unfold.1')[0]!.start
      const two = heard('boss.unfold.2')[0]!.start
      const frame = 1 / config.film.fps
      expect(at('boss-music').length).toBe(1)
      expect(Math.abs(at('boss-music')[0]! - (one + script.get('boss.unfold.1')!.phrases.at(-1)!.from))).toBeLessThanOrEqual(frame + 0.006)
      expect(at('power-up')[0]! - two).toBeGreaterThanOrEqual(-0.006)
      expect(at('turret-rise').at(-1)!).toBeGreaterThan(two)
      expect(Math.abs(at('turret-lock').at(-1)! - (two + script.get('boss.unfold.2')!.seconds))).toBeLessThanOrEqual(frame + 0.006)
    })
  }

  for (const bot of ['keen', 'clumsy']) {
    for (const held of [true, false]) {
      it(`on the ${bot} visit${held ? ', with the visit holding the turn of Decision as well as the page does,' : ''} lets nothing of line 8 sound after the page turn, starts line 9 on the turn, finds nothing left to hold, and ends line 7 at the end of a sentence`, async () => {
        const { v, turn } = await runWith(bot, held)
        const sentenceEnds = script.get('boss.unfold.0')!.phrases.filter((p) => endsSentence(p.words)).map((p) => p.to)
        const seven = v.log.filter((e) => e.line === 'line.boss.unfold.0' && e.what === 'cut')
        expect(seven.length).toBe(1)
        expect(sentenceEnds.some((t) => Math.abs(t - seven[0]!.seconds!) < 2e-3), `${seven[0]!.seconds}`).toBe(true)
        expect(v.finished).toBe(true)
        expect(v.heldSeconds).toBeLessThanOrEqual(1 / config.film.fps + 0.006)
        const eight = v.voices.filter((x) => x.id === 'line.decision.letter.0')
        expect(eight.length).toBe(1)
        expect(eight[0]!.stop).not.toBeNull()
        expect(eight[0]!.stop!).toBeLessThanOrEqual(turn - gap + 0.02)
        const others = v.voices.filter((x) => x.id !== 'line.decision.reset.0' && x.start < turn && (x.stop ?? x.start + script.get(x.id.slice(5))!.seconds) > turn + 1e-6 && (x.stop === null || x.stop > x.start))
        expect(others).toEqual([])
        const nine = v.log.filter((e) => e.line === 'line.decision.reset.0' && e.what === 'spoken')
        expect(nine.length).toBe(1)
        expect(nine[0]!.start! - turn).toBeGreaterThanOrEqual(-1e-3)
        expect(nine[0]!.start! - turn).toBeLessThanOrEqual(0.02)
        expect(v.log.filter((e) => e.what === 'cut' && e.why === 'the careers page came while it was said')).toEqual([])
      })
    }

    it(`on the ${bot} visit with the press of Decision made in a later phrase of line 8, ends line 8 at the pause of that phrase and turns the page one gap after it, with line 9 on the turn`, async () => {
      const calls: Call[] = []
      const v: Visit = await visit(load, config, bot, config.seed, calls as never, false, { page: 'step5', line: 'line.decision.letter.0', seconds: 9 } as never)
      const turn = calls.find((x) => x.event?.name === 'page-turn' && x.event.page === 'step5')!.at
      const eight = v.voices.filter((x) => x.id === 'line.decision.letter.0')
      const pauses = script.get('decision.letter.0')!.phrases.map((p) => p.to)
      const pause = pauses.find((t) => t >= 9)!
      expect(pause).toBeLessThan(pauses.at(-1)!)
      expect(eight.length).toBe(1)
      expect(Math.abs(eight[0]!.stop! - (eight[0]!.start + pause))).toBeLessThanOrEqual(0.006)
      expect(turn - eight[0]!.stop!).toBeGreaterThanOrEqual(gap - 0.02)
      expect(turn - eight[0]!.stop!).toBeLessThanOrEqual(gap + 1 / config.film.fps + 0.006)
      const nine = v.log.filter((e) => e.line === 'line.decision.reset.0' && e.what === 'spoken')
      expect(nine.length).toBe(1)
      expect(Math.abs(nine[0]!.start! - turn)).toBeLessThanOrEqual(0.02)
      expect(v.heldSeconds).toBe(0)
    })
  }
})

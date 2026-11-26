import { describe, expect, it } from 'vitest'
import * as engine from '../src/audio/index'
import * as stageModule from '../src/stage/stage'
import * as botsModule from '../src/stage/bots'
import * as pagesModule from '../src/pages'
import * as configModule from '../src/config'
import { filmLive, filmLineId, pagelessLive, unitPage } from '../src/audio/cues'
import { config } from '../src/config'
import { visit } from '../tools/lib/sound-visit.mjs'

interface Entry { at: number; line: string; trigger: string; what: string; start?: number; seconds?: number; why?: string; page: string }
interface Visit { bot: string; finished: boolean; seconds: number; skips: number; turns: { at: number; page: string }[]; log: Entry[]; loops: { id: string; page: string; start: number; stop: number | null }[]; volumes: { at: number; page: string; volume: number }[]; volumeSteps: { at: number; page: string; volume: number; output: number }[]; events: Record<string, number> }

const modules: Record<string, unknown> = { '/src/audio/index.ts': engine, '/src/stage/stage.ts': stageModule, '/src/stage/bots.ts': botsModule, '/src/pages/index.ts': pagesModule, '/src/config.ts': configModule }
const load = async (f: string) => modules[f]
const run = (bot: string): Promise<Visit> => visit(load, config, bot)
const gap = config.audio.liveNarratorMinGapSeconds
const beatOf = (key: string) => key.slice(0, key.lastIndexOf('.'))
const pageOfLine: Record<string, string> = Object.fromEntries(Object.keys(filmLive).map((key) => [filmLineId(beatOf(key), Number(key.slice(key.lastIndexOf('.') + 1))), unitPage[config.film.beats.find((b) => b.id === beatOf(key))!.unit]!]))
const heard = (v: Visit): Entry[] => {
  const back = new Set(v.log.filter((e) => e.what === 'taken back').map((e) => `${e.line}@${e.start}`))
  return v.log.filter((e) => e.what === 'spoken' && !back.has(`${e.line}@${e.start}`))
}
const leftAt = (v: Visit, at: number): number => v.turns.find((t) => t.at > at)?.at ?? v.seconds

describe('a whole visit of the live site through the stage and the sound engine', () => {
  it('lets the keen visitor hear every line on the page of its own gag, after its trigger, never two at once and never two closer than the gap', async () => {
    const v = await run('keen')
    expect(v.finished).toBe(true)
    const lines = heard(v)
    expect(lines.length).toBeGreaterThanOrEqual(8)
    for (const e of lines) {
      expect(e.start!, e.line).toBeGreaterThanOrEqual(e.at - 1e-9)
      if (pageOfLine[e.line]) {
        expect(e.page, e.line).toBe(pageOfLine[e.line])
        expect(e.start!, `${e.line} starts before its page is left`).toBeLessThan(leftAt(v, e.at))
      }
    }
    const order = lines.slice().sort((a, b) => a.start! - b.start!)
    for (let i = 1; i < order.length; i++) expect(order[i]!.start! - (order[i - 1]!.start! + order[i - 1]!.seconds!), `${order[i - 1]!.line} then ${order[i]!.line}`).toBeGreaterThanOrEqual(gap - 1e-6)
    const film = lines.filter((e) => pageOfLine[e.line]).map((e) => e.line)
    expect(new Set(film).size).toBe(film.length)
    for (const e of v.log.filter((x) => x.what === 'dropped')) expect((e.why ?? '').length, e.line).toBeGreaterThan(0)
  })

  it('gets each of the events the sound waited for from its page, once where it is once', async () => {
    const v = await run('keen')
    for (const name of ['carpet-roll', 'metrics-card', 'count-run', 'unfold', 'power-down']) expect(v.events[name], name).toBe(1)
    for (const name of ['inbox-take', 'firehouse-take']) expect(v.events[name] ?? 0, name).toBeGreaterThanOrEqual(1)
    expect(v.events['boss-loop']).toBeUndefined()
  })

  it('runs the fight music from the unfolding of the boss to its power down, the shredder inside step 1, and the room tone all through', async () => {
    const v = await run('keen')
    const boss = v.loops.filter((l) => l.id === 'boss-loop')
    expect(boss.length).toBe(1)
    expect(boss[0]!.page).toBe('step4')
    expect(boss[0]!.stop).not.toBeNull()
    expect(boss[0]!.stop!).toBeLessThan(leftAt(v, boss[0]!.start))
    for (const l of v.loops.filter((x) => x.id === 'shredder')) {
      expect(l.page).toBe('step1')
      expect(l.stop!).toBeLessThanOrEqual(leftAt(v, l.start) + 0.1)
    }
    expect(v.loops.filter((l) => l.id === 'room-tone')).toEqual([{ id: 'room-tone', page: 'marketing', start: 0, stop: null }])
  })

  it('never lets the visitor who skips every step hear a line about a gag he did not see', async () => {
    const v = await run('skipper')
    expect(v.finished).toBe(true)
    expect(v.skips).toBeGreaterThanOrEqual(4)
    for (const e of heard(v)) {
      const page = pageOfLine[e.line]
      if (!page) {
        expect(e.line.startsWith('line.live.'), e.line).toBe(true)
        if (!pagelessLive.some((k) => e.line.startsWith(`line.live.${k}.`))) expect(e.start!, e.line).toBeLessThan(leftAt(v, e.at))
        continue
      }
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
})

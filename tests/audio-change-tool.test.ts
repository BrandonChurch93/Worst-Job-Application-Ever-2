import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import * as dsp from '../src/audio/dsp'
import * as cues from '../src/audio/cues'
import * as levels from '../src/audio/levels'
import * as copy from '../src/copy'
import * as mix from '../src/audio/mix'
import { changeCue, changeCues as rows, cueFor } from '../src/audio/change'
import * as tool from '../tools/sound.mjs'
import { batchCues as batchOf } from '../tools/lib/sound-batch.mjs'

// The sound tool on a cue of audio/CHANGE-CUES.json, from a filed take to the pack, in a scratch folder.
// The takes here are noise made in the test and filed under a temp root: nothing is filed, kept or packed in the build.

const T = tool as unknown as Record<string, (...a: any[]) => any> & { FAMILY_LINE: string }
const batchCues = batchOf as (...a: unknown[]) => { id: string }[]
const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const prompts: Record<string, { prompt: string }> = JSON.parse(readFileSync(path.join(process.cwd(), 'audio', 'PROMPTS.json'), 'utf8')).cues
const SR: number = cfg.audio.sampleRate
const M: any = { dsp, cues, levels, copy, mix }
const ROUND = 'change-002'
const answers = JSON.stringify({ by: 'a stand-in answer in a test, nobody listened', voice: false, word: false, music: false, melody: false, fits: true })

function burst(seconds: number, seed: number, steady = false): Uint8Array {
  const n = Math.round(seconds * SR)
  const x = new Float32Array(n)
  let s = seed >>> 0
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const t = i / SR
    x[i] = steady ? 0.2 * (s / 2147483648 - 1) : 0.6 * Math.exp(-t * 6) * (0.7 * Math.sin(2 * Math.PI * (90 + seed) * t) + 0.3 * (s / 2147483648 - 1))
  }
  return dsp.encodeWav({ sampleRate: SR, channels: [x] }, 24)
}

describe('the sound tool on a cue of the change list', () => {
  let root = ''
  let P: any
  let log: ReturnType<typeof vi.spyOn>
  const said = () => log.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
  const take = (id: string, seed: number, seconds = 1.2, steady = false): string => {
    const file = path.join(root, `${id}-${seed}.wav`)
    writeFileSync(file, burst(seconds, seed, steady))
    return file
  }
  const ledger = () => JSON.parse(readFileSync(path.join(P.audio, 'TAKES.json'), 'utf8')).takes as any[]
  const kept = (id: string) => JSON.parse(readFileSync(path.join(P.kept, `${id}.json`), 'utf8'))
  const index = () => JSON.parse(readFileSync(path.join(P.pub, 'index.json'), 'utf8'))
  const shipped = (): Set<string> => {
    if (!existsSync(path.join(P.pub, 'index.json'))) return new Set()
    const i = index()
    return new Set([...i.sfx, ...i.loops].map((x: { id: string }) => x.id))
  }

  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'change-cue-'))
    P = T.places!(root)
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })
  afterAll(() => {
    log.mockRestore()
    rmSync(root, { recursive: true, force: true })
  })

  it('names a cue of the list with the length, the class and the loop of its row, and the limit of takes every cue has', () => {
    for (const r of rows) {
      const t = T.target!({ cue: r.id }, cfg, cues)
      expect(t, r.id).toMatchObject({ kind: 'cue', id: r.id, key: r.id, seconds: r.seconds, cls: r.class, loop: Boolean(r.loop), variants: r.variants ?? 1, max: cfg.audio.maxTakesPerCue })
    }
    for (const s of cues.allCues(cfg.audio.sfx as { id: string; seconds: number }[])) expect(changeCue(s.id), `${s.id} is in one list only`).toBeUndefined()
    expect(() => T.target!({ cue: 'no-such-cue' }, cfg, cues)).toThrow(/CHANGE-CUES/)
  })

  it('asks the listener against the line of the row', () => {
    const r = changeCue('turret-cannon')!
    expect(T.cueLines!()['turret-cannon']).toBe(r.describes)
    expect(T.listenerSheet!(T.target!({ cue: r.id }, cfg, cues), r.describes).questions.join(' ')).toContain(r.describes)
  })

  it('files a take of it under its round, with its cost, its measurements and the prompt the list holds', async () => {
    expect(cueFor('bolt-fire', 'step1', (id) => shipped().has(id))).toBe('bolt-fire')
    const rec = await T.fileTake!({ cue: 'turret-cannon', file: take('turret-cannon', 1), round: ROUND, cost: '9', 'listed-prompt': true }, P, cfg, M, true)
    expect(rec).toMatchObject({ key: 'turret-cannon', kind: 'cue', cue: 'turret-cannon', take: 1, round: ROUND, cost: '9', kept: false })
    expect(rec.prompt).toBe(`${prompts['turret-cannon']!.prompt.replace(/[.\s]+$/, '')}, ${T.FAMILY_LINE}`)
    expect(rec.measured.seconds).toBeGreaterThan(0)
    expect(existsSync(path.join(P.takes, 'turret-cannon', 'take-1.wav'))).toBe(true)
    expect(ledger().length).toBe(1)
    const recipe = readFileSync(path.join(P.audio, 'RECIPE.md'), 'utf8')
    expect(recipe).toContain('### turret-cannon')
    expect(recipe).toContain(`1 of ${cfg.audio.maxTakesPerCue} in round ${ROUND}`)
    expect(() => T.listedPrompt!('finish-arms')).toThrow(/no prompt/)
  })

  it('does not keep it before a listener has answered, and its event still plays the stand-in', async () => {
    expect(await T.keepTake!({ cue: 'turret-cannon' }, P, cfg, M, true)).toBeNull()
    expect(said()).toContain('not kept: turret-cannon take 1')
    expect(existsSync(path.join(P.kept, 'turret-cannon.json'))).toBe(false)
    T.pack!(P, cfg, M, true)
    expect(index().sfx).toEqual([])
    expect(cueFor('bolt-fire', 'step1', (id) => shipped().has(id))).toBe('bolt-fire')
    expect(T.keptChangeCues!(rows, new Set(T.keptRecords!(P).map((r: { id: string }) => r.id)), cues)).toEqual([])
  })

  it('attaches the listener\'s answers, keeps it by the one chain at its row\'s length and class, and packs it', async () => {
    const r = changeCue('turret-cannon')!
    T.attachListener!({ cue: 'turret-cannon', listener: answers }, P, cfg, M)
    expect(ledger()[0].listener.fits).toBe(true)
    expect(await T.keepTake!({ cue: 'turret-cannon' }, P, cfg, M, true)).toEqual(['turret-cannon'])
    const k = kept('turret-cannon')
    expect(k).toMatchObject({ id: 'turret-cannon', kind: 'cue', cue: 'turret-cannon', class: r.class, loop: false, describes: r.describes, forced: false, file: 'turret-cannon.wav' })
    expect(k.take).toMatchObject({ number: 1, round: ROUND })
    expect(k.seconds).toBeLessThanOrEqual(r.seconds + 1e-6)
    expect(k.seconds).toBeGreaterThan(0)
    expect(k.chain.levelMeasure).toBe(levels.CLASS_LEVEL[r.class].measure)
    expect(k.chain.levelDb).toBeCloseTo(levels.CLASS_LEVEL[r.class].db, 1)
    expect(ledger()[0]).toMatchObject({ kept: true, keptAs: ['turret-cannon'] })
    expect(readFileSync(path.join(P.audio, 'ASSETS-ROWS.md'), 'utf8')).toContain('audio/kept/turret-cannon.wav')
    T.pack!(P, cfg, M, true)
    expect(index().sfx.map((x: { id: string }) => x.id)).toEqual(['turret-cannon'])
    expect(index().sfx[0].seconds).toBe(k.seconds)
    expect(T.keptChangeCues!(rows, new Set(T.keptRecords!(P).map((x: { id: string }) => x.id)), cues).map((x: { id: string }) => x.id)).toEqual(['turret-cannon'])
  })

  it('then plays it on its event, in the mix made from the kept files and by what the site ships', () => {
    const has = (id: string) => shipped().has(id)
    expect(cueFor('bolt-fire', 'step1', has)).toBe('turret-cannon')
    expect(cueFor('bolt-fire', 'step4', has)).toBe('bolt-fire')
    const { sounds, absent, stale } = T.keptSounds!(P, M)
    expect([absent, stale]).toEqual([[], []])
    const out = mix.mixFilm({ sampleRate: SR, fps: cfg.film.fps, seconds: 3, events: [{ name: 'bolt-fire', frame: 30, x: 960, page: 'step1' }], lines: [], sounds, sfx: cfg.audio.sfx, duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb, standIns: new Map() })
    expect(out.placed.filter((p) => p.kind === 'cue')).toMatchObject([{ event: 'bolt-fire', cue: 'bolt-fire', id: 'turret-cannon', frame: 30 }])
    expect(out.placed[0]!.seconds).toBeCloseTo(kept('turret-cannon').seconds, 3)
    expect(out.missingCues).toEqual(['room-tone'])
  })

  it('keeps a loop of the list as a loop and ships it as a file of its own', async () => {
    const r = rows.find((x) => x.loop)!
    await T.fileTake!({ cue: r.id, file: take(r.id, 7, r.seconds + 1.5, true), round: ROUND, cost: '30', 'listed-prompt': true }, P, cfg, M, true)
    expect(await T.keepTake!({ cue: r.id, listener: answers, force: true, why: 'noise made in a test' }, P, cfg, M, true)).toEqual([r.id])
    const k = kept(r.id)
    expect(k).toMatchObject({ class: r.class, loop: true })
    expect(k.chain.loop).toBeTruthy()
    expect(k.seconds).toBeLessThanOrEqual(r.seconds + 1e-6)
    T.pack!(P, cfg, M, true)
    expect(index().loops.map((x: { id: string; file: string }) => [x.id, x.file])).toEqual([[r.id, `${r.id}.flac`]])
    expect(index().sfx.map((x: { id: string }) => x.id)).toEqual(['turret-cannon'])
  })

  it('counts every take of it against audio.maxTakesPerCue in its round, as for any cue', async () => {
    const max: number = cfg.audio.maxTakesPerCue
    for (let n = 2; n <= max + 1; n++) await T.fileTake!({ cue: 'turret-cannon', file: take('turret-cannon', n), round: ROUND, cost: '9', 'listed-prompt': true }, P, cfg, M, n <= max)
    const mine = ledger().filter((t) => t.key === 'turret-cannon')
    expect(mine.map((t) => [t.kind, t.round])).toEqual(Array.from({ length: max + 1 }, () => ['cue', ROUND]))
    expect(said()).toContain(`WARNING: this is take ${max + 1} of round ${ROUND} and the limit is ${max}. Check A8 will report it`)
    expect(readFileSync(path.join(P.audio, 'RECIPE.md'), 'utf8')).toContain(`${max + 1} of ${max} in round ${ROUND}`)
    await expect(T.fileTake!({ cue: 'turret-cannon', file: take('turret-cannon', 2), round: ROUND, cost: '9' }, P, cfg, M, true)).rejects.toThrow(/already filed/)
  })

  it('takes a row that is still to be made the same way once its sound exists', async () => {
    const r = rows.find((x) => !x.made)!
    const rec = await T.fileTake!({ cue: r.id, file: take(r.id, 21), round: ROUND, cost: '5', prompt: `A prompt written in a test, ${T.FAMILY_LINE}` }, P, cfg, M, true)
    expect(rec).toMatchObject({ key: r.id, kind: 'cue', round: ROUND })
    expect(await T.keepTake!({ cue: r.id, listener: answers }, P, cfg, M, true)).toEqual([r.id])
    expect(kept(r.id)).toMatchObject({ class: r.class, describes: r.describes })
    expect(kept(r.id).seconds).toBeLessThanOrEqual(r.seconds + 1e-6)
  })
})

describe('the batch that asks for sounds', () => {
  const all = cues.allCues(cfg.audio.sfx as { id: string; seconds: number }[])
  it('goes over no cue of the change list unless --only names it', () => {
    expect(batchCues(all, rows, null)).toEqual(all)
    expect(batchCues(all, rows, ['bolt-fire'])).toEqual(all)
    expect(batchCues(all, rows, ['turret-cannon', 'bolt-fire']).map((s) => s.id)).toEqual([...all.map((s) => s.id), 'turret-cannon'])
  })
})

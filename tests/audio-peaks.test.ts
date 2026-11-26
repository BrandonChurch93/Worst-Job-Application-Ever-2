import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { decodeFile, places } from '../tools/sound.mjs'
import { ffmpegTruePeakDb, holdPeak, lineAgain, rekeepPeaks } from '../tools/lib/sound-peaks.mjs'
import * as dsp from '../src/audio/dsp'
import * as levels from '../src/audio/levels'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const bound: number = cfg.audio.truePeakDb
const sr: number = cfg.audio.sampleRate
const M = { dsp, levels }
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0

function take(burst: number): Uint8Array {
  const x = new Float32Array(sr * 2)
  for (let i = 0; i < x.length; i++) {
    const t = i / sr
    const loud = t > 0.9 && t < 0.93 ? burst : 0.04
    x[i] = loud * (Math.sin(2 * Math.PI * 180 * t) + 0.4 * Math.sin(2 * Math.PI * 1260 * t))
  }
  return dsp.encodeWav({ sampleRate: sr, channels: [x] }, 24)
}

describe.skipIf(!hasFfmpeg)('the peak of a kept line, held in the chain', () => {
  let root = ''
  let P: any
  const said = vi.spyOn(console, 'log').mockImplementation(() => {})
  const again = (o: Record<string, unknown> = {}) => rekeepPeaks({ when: '2026-11-26T17:30:00.000Z', ...o }, P, cfg, M, decodeFile)
  const keptFiles = () => Object.fromEntries(readdirSync(P.kept).sort().map((f) => [f, sha(readFileSync(path.join(P.kept, f)))]))
  const record = (id: string) => JSON.parse(readFileSync(path.join(P.kept, `${id}.json`), 'utf8'))
  const wav = (id: string) => dsp.decodeWav(readFileSync(path.join(P.kept, `${id}.wav`)))

  function file(id: string, burst: number) {
    const bytes = take(burst)
    mkdirSync(path.join(P.takes, id), { recursive: true })
    writeFileSync(path.join(P.takes, id, 'take-1.wav'), bytes)
    const out = dsp.chain(decodeFile(path.join(P.takes, id, 'take-1.wav'), sr), { seconds: 600, cls: 'voice', loop: false })
    const kept = dsp.encodeWav(out.sound, 24)
    mkdirSync(P.kept, { recursive: true })
    writeFileSync(path.join(P.kept, `${id}.wav`), kept)
    writeFileSync(path.join(P.kept, `${id}.json`), JSON.stringify({ id, kind: 'line', words: 'A made line.', take: { number: 1, file: 'take-1.wav', sha256: sha(bytes) }, chain: out.record, measured: dsp.measure(out.sound), listener: { transcript: 'A made line.' }, file: `${id}.wav`, sha256: sha(kept) }, null, 2) + '\n')
    return out
  }

  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'peaks-'))
    P = places(root)
    file('line.made.burst.0', 0.9)
    file('line.made.calm.0', 0.04)
  })
  afterAll(() => {
    said.mockRestore()
    rmSync(root, { recursive: true, force: true })
  })

  it('starts from a take whose burst passes the bound once the line is levelled, and one that stays under it', () => {
    expect(record('line.made.burst.0').measured.truePeakDb).toBeGreaterThan(bound)
    expect(record('line.made.calm.0').measured.truePeakDb).toBeLessThan(bound)
  })

  it('writes nothing without --write and says which line it would keep again', () => {
    const before = keptFiles()
    expect(again()).toEqual({ lines: 2, again: 1, odd: 0 })
    expect(keptFiles()).toEqual(before)
    const lines = said.mock.calls.map((c) => String(c[0]))
    expect(lines.find((l) => l.includes('line.made.burst.0'))).toMatch(/kept again$/)
    expect(lines.find((l) => l.includes('line.made.calm.0'))).toMatch(/unchanged$/)
  })

  it('holds the bound by the true peak ffmpeg measures, leaves the take under the bound byte equal, and keeps words, take and answers', () => {
    const before = keptFiles()
    const was = record('line.made.burst.0')
    expect(again({ write: true })).toEqual({ lines: 2, again: 1, odd: 0 })
    const now = keptFiles()
    expect(now['line.made.calm.0.wav']).toBe(before['line.made.calm.0.wav'])
    expect(now['line.made.calm.0.json']).toBe(before['line.made.calm.0.json'])
    expect(now['line.made.burst.0.wav']).not.toBe(before['line.made.burst.0.wav'])
    const sound = wav('line.made.burst.0')
    expect(ffmpegTruePeakDb(sound.channels[0]!, sound.sampleRate)).toBeLessThanOrEqual(bound)
    expect(dsp.truePeakDb(sound)).toBeLessThanOrEqual(bound)
    const r = record('line.made.burst.0')
    expect(r.sha256).toBe(now['line.made.burst.0.wav'])
    expect(r.chain.peak.boundDb).toBe(bound)
    expect(r.chain.peak.reductionDb).toBeGreaterThan(0)
    expect(r.chain.peak.truePeakAfterDb).toBeLessThanOrEqual(bound)
    expect(r.chain.peak.lufsAfter).toBeCloseTo(dsp.loudness(sound), 1)
    expect(r.measured.truePeakDb).toBeLessThanOrEqual(bound)
    expect(r.rekept).toMatchObject({ when: '2026-11-26T17:30:00.000Z', was: { sha256: was.sha256, truePeakDb: was.measured.truePeakDb } })
    expect(r.rekept.why).toContain('true peak')
    expect({ words: r.words, take: r.take, listener: r.listener }).toEqual({ words: was.words, take: was.take, listener: was.listener })
    expect(sound.channels[0]!.length).toBe(Math.round(was.measured.seconds * sr))
  })

  it('is byte equal on a second run', () => {
    const before = keptFiles()
    expect(again({ write: true, when: '2027-01-01T00:00:00.000Z' })).toEqual({ lines: 2, again: 0, odd: 0 })
    expect(keptFiles()).toEqual(before)
  })

  it('does not move the sound in time and lowers it only around the burst', () => {
    const out = dsp.chain(decodeFile(path.join(P.takes, 'line.made.burst.0', 'take-1.wav'), sr), { seconds: 600, cls: 'voice', loop: false })
    const held = holdPeak(out.sound, bound, dsp)
    const a = out.sound.channels[0]!
    const b = held.sound.channels[0]!
    expect(b.length).toBe(a.length)
    let far = 0
    for (let i = 0; i < Math.round(0.5 * sr); i++) far = Math.max(far, Math.abs(a[i]! - b[i]!))
    expect(far).toBeLessThan(1e-4)
    const calm = dsp.chain(decodeFile(path.join(P.takes, 'line.made.calm.0', 'take-1.wav'), sr), { seconds: 600, cls: 'voice', loop: false })
    const same = holdPeak(calm.sound, bound, dsp)
    expect(same.record).toBeNull()
    expect(same.sound).toBe(calm.sound)
  })

  it('leaves a line under the bound as it is when the chain no longer makes its bytes, and says so', () => {
    const id = 'line.made.calm.0'
    const file = path.join(P.kept, `${id}.json`)
    const text = readFileSync(file, 'utf8')
    writeFileSync(file, text.replace(record(id).sha256, 'e'.repeat(64)))
    const before = keptFiles()
    const code = process.exitCode
    expect(again({ write: true })).toEqual({ lines: 2, again: 0, odd: 1 })
    expect(process.exitCode).toBe(1)
    process.exitCode = code
    expect(keptFiles()).toEqual(before)
    writeFileSync(file, text)
  })

  it('fails loud, naming the line, when a take is missing or is not the take of the record', () => {
    const id = 'line.made.calm.0'
    const r = record(id)
    expect(() => lineAgain({ ...r, take: { ...r.take, file: 'take-9.wav' } }, P, cfg, M, decodeFile)).toThrow(/line\.made\.calm\.0.*missing/)
    expect(() => lineAgain({ ...r, take: { ...r.take, sha256: 'f'.repeat(64) } }, P, cfg, M, decodeFile)).toThrow(/line\.made\.calm\.0.*sha256/)
    const before = keptFiles()
    writeFileSync(path.join(P.takes, id, 'take-1.wav'), take(0.05))
    expect(() => again({ write: true })).toThrow(/line\.made\.calm\.0/)
    expect(keptFiles()).toEqual(before)
  })
})

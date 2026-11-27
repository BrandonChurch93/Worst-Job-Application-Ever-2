import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as dsp from '../src/audio/dsp'
import { keptSounds, pack, places, refuseStale, staleKept } from '../tools/sound.mjs'
import { makeMix as mixOf } from '../tools/mix.mjs'

const makeMix = mixOf as (...a: unknown[]) => Promise<unknown>

// The wav files of audio/kept are not in the repo, only their records are. A work tree can so hold the files of an
// older keeping (it happened: a preview's narrator came from replaced files). No mix and no pack is made from such a file.

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const SR: number = cfg.audio.sampleRate
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')

function tone(hz: number, seconds = 0.2): Uint8Array {
  const x = new Float32Array(Math.round(seconds * SR))
  for (let i = 0; i < x.length; i++) x[i] = 0.25 * Math.sin((2 * Math.PI * hz * i) / SR)
  return dsp.encodeWav({ sampleRate: SR, channels: [x] }, 24)
}

describe('a kept file that is not the one its record names', () => {
  let root = ''
  let P: any
  const M: any = { dsp }
  const keep = (id: string, hz: number) => {
    const bytes = tone(hz)
    writeFileSync(path.join(P.kept, `${id}.wav`), bytes)
    writeFileSync(path.join(P.kept, `${id}.json`), JSON.stringify({ id, kind: 'cue', cue: id, loop: false, file: `${id}.wav`, seconds: 0.2, sha256: sha(bytes) }))
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'kept-'))
    P = places(root)
    mkdirSync(P.kept, { recursive: true })
    keep('step.1', 440)
    keep('step.2', 660)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('loads every file that is the recorded one and names none', () => {
    const { sounds, absent, stale } = keptSounds(P, M)
    expect([...sounds.keys()]).toEqual(['step.1', 'step.2'])
    expect(absent).toEqual([])
    expect(stale).toEqual([])
    expect(staleKept(P)).toEqual([])
    expect(() => refuseStale(stale, 'the mix')).not.toThrow()
  })

  it('names a file with other bytes, does not load it, and still names a file that is missing', () => {
    writeFileSync(path.join(P.kept, 'step.2.wav'), tone(661))
    writeFileSync(path.join(P.kept, 'step.3.json'), JSON.stringify({ id: 'step.3', kind: 'cue', cue: 'step.3', loop: false, file: 'step.3.wav', seconds: 0.2, sha256: sha(tone(880)) }))
    const { sounds, absent, stale } = keptSounds(P, M)
    expect([...sounds.keys()]).toEqual(['step.1'])
    expect(stale).toEqual(['step.2'])
    expect(absent).toEqual(['step.3'])
    expect(staleKept(P)).toEqual(['step.2'])
  })

  it('refuses the mix and writes no file', async () => {
    writeFileSync(path.join(P.kept, 'step.2.wav'), tone(661))
    const out = path.join(P.mix, 'review.wav')
    const plan = { source: 'a test', fps: cfg.film.fps, seconds: 1, events: [], lines: [] }
    await expect(makeMix(P, cfg, M, out, 'review', plan)).rejects.toThrow(/the mix is refused: 1 of the files in audio\/kept is not the file its record names \(sha256 differs\): step\.2\./)
    expect(existsSync(out)).toBe(false)
    expect(existsSync(out.replace(/\.wav$/, '.json'))).toBe(false)
  })

  it('refuses the pack before it touches what the site ships', () => {
    mkdirSync(P.pub, { recursive: true })
    writeFileSync(path.join(P.pub, 'index.json'), '{"version":1}')
    writeFileSync(path.join(P.kept, 'step.1.wav'), tone(441))
    writeFileSync(path.join(P.kept, 'step.2.wav'), tone(661))
    expect(() => pack(P, cfg, M, true)).toThrow(/the pack is refused: 2 of the files in audio\/kept are not the files their records name \(sha256 differs\): step\.1, step\.2\./)
    expect(readFileSync(path.join(P.pub, 'index.json'), 'utf8')).toBe('{"version":1}')
  })
})

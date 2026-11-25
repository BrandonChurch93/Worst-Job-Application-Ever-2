import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import * as S from '../src/stage/stage'
import { checkpointsOf, fileOf, frameOf, nearest, readCheckpoint, readIndex, replay, sameBuild, sha256, text } from '../tools/lib/film-simcache.mjs'

type Made = { unit: string; step: number; frame: number; page: string; why: string; text: string; sha256: string; bytes: number }
const cfg = config as unknown as { sim: { stepHz: number; checkpointSeconds: number }; film: { fps: number; units: { id: string; seconds: number }[] } }
const firstOf = (id: string) => {
  let first = 0
  for (const u of cfg.film.units) {
    if (u.id === id) return first
    first += Math.round(u.seconds * cfg.film.fps)
  }
  throw new Error(id)
}
const made = (id: string): Made[] => checkpointsOf(S, pages, cfg.film.units.find((u) => u.id === id)!, cfg, firstOf(id))

describe('names and frames', () => {
  it('names a checkpoint by page, frame and step', () => {
    expect(fileOf('pinball', 6000, 7920)).toBe('pinball-006000-step-07920.json')
  })
  it('gives the frame a step falls in', () => {
    expect(frameOf(4020, 0, 240, 60)).toBe(4020)
    expect(frameOf(4020, 3, 240, 60)).toBe(4020)
    expect(frameOf(4020, 4, 240, 60)).toBe(4021)
    expect(frameOf(8460, 2461, 240, 60)).toBe(9075)
  })
  it('hashes the text of a save', () => {
    expect(text({ a: 1, b: [2] })).toBe('{"a":1,"b":[2]}')
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('the checkpoint a chunk starts from', () => {
  const index = {
    stepHz: 240, fps: 60, units: { pinball: 4020, decision: 8460 },
    checkpoints: [
      { unit: 'pinball', step: 0, frame: 4020 }, { unit: 'pinball', step: 240, frame: 4080 }, { unit: 'pinball', step: 7920, frame: 6000 }, { unit: 'pinball', step: 8160, frame: 6060 },
      { unit: 'decision', step: 2400, frame: 9060 }, { unit: 'decision', step: 2461, frame: 9075 },
    ],
  }
  it('is the last one at or before the first step of the frame', () => {
    expect(nearest(index, 'pinball', 6036)!.frame).toBe(6000)
    expect(nearest(index, 'pinball', 6060)!.frame).toBe(6060)
    expect(nearest(index, 'pinball', 4020)!.step).toBe(0)
    expect(nearest(index, 'pinball', 4079)!.step).toBe(0)
  })
  it('does not take one that lies inside the frame, after its first step', () => {
    expect(nearest(index, 'decision', 9075)!.step).toBe(2400)
    expect(nearest(index, 'decision', 9076)!.step).toBe(2461)
  })
  it('gives nothing for a page it does not know or a frame before the first', () => {
    expect(nearest(index, 'boss', 7000)).toBe(null)
    expect(nearest(index, 'decision', 8460)).toBe(null)
  })
})

describe('the index and the files', () => {
  const info = { engineHash: 'e', sharedHash: 's', pageHashes: { step1: 'a', boss: 'b' } }
  it('knows its build', () => {
    expect(sameBuild({ ...info }, info)).toBe(true)
    expect(sameBuild({ ...info, engineHash: 'x' }, info)).toBe(false)
    expect(sameBuild({ ...info, pageHashes: { step1: 'a', boss: 'c' } }, info)).toBe(false)
    expect(sameBuild(null, info)).toBe(false)
  })
  it('reads a checkpoint only when it is the file the index names', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'simcache-'))
    expect(readIndex(dir)).toBe(null)
    fs.writeFileSync(path.join(dir, 'a.json'), '{"step":1}')
    expect(readCheckpoint(dir, { file: 'a.json', sha256: sha256('{"step":1}') })).toBe('{"step":1}')
    expect(readCheckpoint(dir, { file: 'a.json', sha256: sha256('{"step":2}') })).toBe(null)
    expect(readCheckpoint(dir, { file: 'gone.json', sha256: 'x' })).toBe(null)
    fs.rmSync(dir, { recursive: true })
  })
})

describe('checkpoints of the film as it is', () => {
  it('has one at the start, one every checkpointSeconds, and one where the last page turns to the careers page', () => {
    const list = made('decision')
    const every = Math.round(cfg.sim.checkpointSeconds * cfg.sim.stepHz)
    expect(list[0]).toMatchObject({ step: 0, why: 'page', frame: firstOf('decision') })
    const timed = list.filter((c) => c.why === 'time')
    for (const c of timed) expect(c.step % every).toBe(0)
    const turns = list.filter((c) => c.why === 'page')
    expect(turns).toHaveLength(2)
    expect(turns[1]!.page).toBe('marketing')
    for (let i = 1; i < list.length; i++) expect(list[i]!.step).toBeGreaterThan(list[i - 1]!.step)
    for (const c of list) expect(c.sha256).toBe(sha256(c.text))
  })
  it('replays from each checkpoint to the next, byte for byte', () => {
    for (const id of ['marketing', 'decision']) {
      const list = made(id)
      expect(list.length).toBeGreaterThan(5)
      for (let i = 0; i + 1 < list.length; i++) expect(replay(S, pages, id, list[i], list[i + 1]), `${id} ${list[i]!.step}`).toMatchObject({ startEqual: true, equal: true })
    }
  })
  it('sees a checkpoint that is not the state the film reaches', () => {
    const list = made('marketing')
    const wrong = { ...list[2]!, text: list[3]!.text }
    expect(replay(S, pages, 'marketing', list[1], wrong).equal).toBe(false)
  })
})

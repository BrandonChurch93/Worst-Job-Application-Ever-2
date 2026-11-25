import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PITCH_CENTS, cueClass, eventCues, filmLineId, liveKeysFor, liveLineId, liveTriggers, loopCues, pickVariant, silentEvents, stopEvents, variantAt, variantId } from '../src/audio/cues'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const sfx: { id: string; seconds: number; variants?: number }[] = cfg.audio.sfx
const ids = sfx.map((s) => s.id)
const liveKeys = Object.keys(narration.liveOnly).filter((k) => Array.isArray(narration.liveOnly[k]))

describe('the table of events to cues', () => {
  it('names only cues of audio.sfx', () => {
    for (const [event, cue] of Object.entries(eventCues)) expect(ids, `${event} plays ${cue}`).toContain(cue)
  })

  it('reaches every cue of audio.sfx from an event', () => {
    const named = new Set(Object.values(eventCues))
    for (const id of ids) expect(named.has(id), id).toBe(true)
  })

  it('plays a cue on the event named exactly as the cue', () => {
    for (const id of ids) expect(eventCues[id], id).toBe(id)
  })

  it('lists what is silent on purpose, and gives none of it a cue', () => {
    expect(silentEvents).toContain('popup-close')
    for (const name of silentEvents) expect(eventCues[name], name).toBeUndefined()
    expect(eventCues.share).toBe('button-press')
  })

  it('maps every event a beat of the film names', () => {
    const events: string[] = cfg.film.beats.map((b: any) => b.event).filter((e: unknown) => typeof e === 'string')
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) expect(ids, e).toContain(eventCues[e])
    expect(eventCues['bolt-hit-cursor']).toBe('bolt-hit')
  })

  it('stops and loops only cues that exist', () => {
    for (const cues of Object.values(stopEvents)) for (const c of cues) expect(ids).toContain(c)
    for (const c of loopCues) expect(ids).toContain(c)
  })

  it('gives every cue a level class', () => {
    for (const id of ids) expect(['tone', 'tick', 'mechanism', 'hit', 'music'], id).toContain(cueClass[id])
    expect(cueClass['room-tone']).toBe('tone')
    expect(cueClass['hold-music']).toBe('music')
    expect(Object.keys(cueClass).sort()).toEqual(ids.slice().sort())
  })

  it('imports nothing, so loading it in capture mode loads no audio code', () => {
    const text = readFileSync(path.join(process.cwd(), 'src', 'audio', 'cues.ts'), 'utf8')
    expect(/^\s*import\s/m.test(text)).toBe(false)
  })
})

describe('the triggers of the live lines', () => {
  it('has a trigger for every key of liveOnly and no other', () => {
    expect(liveKeys.length).toBeGreaterThan(0)
    expect(Object.keys(liveTriggers).sort()).toEqual(liveKeys.slice().sort())
  })

  it('sets each line off as the brief says', () => {
    expect(liveTriggers['hit']).toEqual({ on: 'hit' })
    expect(liveTriggers['slowTyping']).toEqual({ on: 'event', event: 'slow-typing' })
    expect(liveTriggers['realKeyboard']).toEqual({ on: 'event', event: 'real-keyboard' })
    expect(liveTriggers['tugLost']).toEqual({ on: 'event', event: 'tug-lost' })
    expect(liveTriggers['pinball.flipper']).toEqual({ on: 'event', event: 'flipper', once: true })
    expect(liveTriggers['boss.verify']).toEqual({ on: 'event', event: 'checkbox' })
    expect(liveTriggers['boss.slow']).toEqual({ on: 'event', event: 'boss-slow' })
    expect(liveTriggers['skip']).toEqual({ on: 'event', event: 'skip' })
    expect(liveTriggers['idle']).toEqual({ on: 'call' })
    expect(liveTriggers['watchFilm']).toEqual({ on: 'call' })
  })

  it('speaks of a hit on any event that hits the cursor', () => {
    expect(liveKeysFor({ name: 'bolt-hit-cursor', hitsCursor: true }, new Set())).toEqual(['hit'])
    expect(liveKeysFor({ name: 'slab-drop', hitsCursor: true }, new Set())).toEqual(['hit'])
    expect(liveKeysFor({ name: 'bolt-hit', hitsCursor: false }, new Set())).toEqual([])
  })

  it('speaks of the flipper on the first flipper of a visit only', () => {
    const seen = new Set<string>()
    expect(liveKeysFor({ name: 'flipper', hitsCursor: false }, seen)).toEqual(['pinball.flipper'])
    expect(liveKeysFor({ name: 'flipper', hitsCursor: false }, seen)).toEqual([])
    expect(liveKeysFor({ name: 'flipper', hitsCursor: false }, new Set())).toEqual(['pinball.flipper'])
  })

  it('names the lines by beat and place', () => {
    expect(filmLineId('step1.tug', 1)).toBe('line.step1.tug.1')
    expect(liveLineId('boss.slow', 0)).toBe('line.live.boss.slow.0')
  })
})

describe('the order of the variants', () => {
  it('steps the variants in turn and starts again', () => {
    expect(Array.from({ length: 9 }, (_, i) => variantAt(i, 4).variant)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0])
    expect(Array.from({ length: 7 }, (_, i) => variantAt(i, 3).variant)).toEqual([0, 1, 2, 0, 1, 2, 0])
  })

  it('lays the fixed list of pitch offsets over them in order', () => {
    expect(PITCH_CENTS.length).toBeLessThanOrEqual(8)
    expect(PITCH_CENTS[0]).toBe(0)
    for (const c of PITCH_CENTS) expect(Math.abs(c)).toBeLessThanOrEqual(50)
    expect(Array.from({ length: 9 }, (_, i) => variantAt(i, 4).cents)).toEqual([...PITCH_CENTS, PITCH_CENTS[0], PITCH_CENTS[1]])
  })

  it('leaves a cue with one variant at its own pitch', () => {
    for (let i = 0; i < 10; i++) expect(variantAt(i, 1)).toEqual({ variant: 0, cents: 0 })
  })

  it('gives the same order every time it is asked', () => {
    const run = () => Array.from({ length: 40 }, (_, i) => pickVariant('step', i, 4, () => true))
    expect(run()).toEqual(run())
    expect(run().slice(0, 5).map((p) => p!.id)).toEqual(['step.1', 'step.2', 'step.3', 'step.4', 'step.1'])
  })

  it('steps through the kept variants only, and gives none when none is kept', () => {
    const kept = new Set(['step.1', 'step.3'])
    expect(Array.from({ length: 4 }, (_, i) => pickVariant('step', i, 4, (id) => kept.has(id))!.id)).toEqual(['step.1', 'step.3', 'step.1', 'step.3'])
    expect(pickVariant('step', 0, 4, () => false)).toBeNull()
    expect(pickVariant('popup', 3, 1, (id) => id === 'popup')).toEqual({ id: 'popup', cents: 0 })
  })

  it('names the variants of every cue of audio.sfx', () => {
    for (const s of sfx) {
      const n = s.variants ?? 1
      expect(variantId(s.id, 0, n)).toBe(n > 1 ? `${s.id}.1` : s.id)
      if (n > 1) expect(PITCH_CENTS.length % n === 0, `${s.id} repeats its pairs early`).toBe(false)
    }
  })
})

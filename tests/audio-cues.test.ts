import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PITCH_CENTS, allCues, cueClass, cueOfEvent, cuesToCome, eventCues, extraCues, filmLineId, liveLineId, liveTriggers, loopCues, spoken, spokenKeysFor, unitPage, pickVariant, silentEvents, stopEvents, variantAt, variantId } from '../src/audio/cues'

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
    const named = new Set([...Object.values(eventCues), ...extraCues.map((x) => x.id)])
    for (const id of ids) expect(named.has(id), id).toBe(true)
  })

  it('plays a cue on the event named exactly as the cue', () => {
    for (const id of allCues(sfx).map((c) => c.id)) expect(cueOfEvent(id), id).toBe(id)
  })

  it('gives nothing that is silent on purpose a cue', () => {
    for (const name of silentEvents) expect(cueOfEvent(name), name).toBeUndefined()
    expect(eventCues.share).toBe('button-press')
  })

  it('maps every event a beat of the film names to a cue of the table or to a cue named as to come, and plays nothing for a cue that is to come', () => {
    const events: string[] = cfg.film.beats.map((b: any) => b.event).filter((e: unknown) => typeof e === 'string')
    expect(events.length).toBeGreaterThan(0)
    const list: { id: string; seconds: number; events: string[]; standIn: string | null }[] = read('audio', 'CHANGE-CUES.json').cues
    const every = [...allCues(sfx).map((c) => c.id), ...Object.values(cuesToCome)]
    for (const e of events) expect(every, e).toContain(cueOfEvent(e))
    expect(cueOfEvent('finish-fire')).toBe('finish-fire')
    for (const [event, id] of Object.entries(cuesToCome)) {
      const row = list.find((x) => x.id === id)
      expect(row, id).toBeDefined()
      expect(row!.seconds, id).toBeGreaterThan(0)
      expect(row!.events, id).toContain(event)
      expect(row!.standIn, id).toBeNull()
      expect(cueOfEvent(event), id).toBe(id)
      expect(allCues(sfx).some((x) => x.id === id), id).toBe(false)
    }
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
    for (const x of extraCues) expect(['tick', 'mechanism', 'hit'], x.id).toContain(cueClass[x.id])
    expect(Object.keys(cueClass).sort()).toEqual(allCues(sfx).map((c) => c.id).sort())
  })

  it('imports nothing, so loading it in capture mode loads no audio code', () => {
    const text = readFileSync(path.join(process.cwd(), 'src', 'audio', 'cues.ts'), 'utf8')
    expect(/^\s*import\s/m.test(text)).toBe(false)
  })
})

describe('the cues the build added', () => {
  const file: any[] = read('audio', 'EXTRA-CUES.json').cues.filter((x: any) => typeof x.event === 'string')
  const wired = ['tug-lost', 'arms-out', 'dial-fling', 'flipper-save', 'session-expired', 'popup-close', 'skip']
  const waiting = ['carpet-roll', 'inbox-take', 'firehouse-take', 'metrics-card']

  it('says the same as audio/EXTRA-CUES.json', () => {
    expect(extraCues.map((x) => ({ id: x.id, seconds: x.seconds, event: x.event }))).toEqual(file.map((x) => ({ id: x.id, seconds: x.seconds, event: x.event })))
    expect(extraCues.map((x) => x.id)).toEqual([...wired.slice(0, 6), ...waiting, 'skip'])
  })

  it('stays inside the number of added cues the config allows', () => {
    expect(file.length).toBeLessThanOrEqual(cfg.audio.extraCuesMax)
  })

  it('plays each on the event of its own name and on no borrowed sound', () => {
    for (const id of [...wired, ...waiting]) expect(cueOfEvent(id), id).toBe(id)
    for (const id of [...wired, ...waiting]) if (!ids.includes(id)) expect(eventCues[id], id).toBeUndefined()
  })

  it('gives an event nobody named no cue', () => {
    expect(cueOfEvent('count-run')).toBeUndefined()
    expect(cueOfEvent('no-such-event')).toBeUndefined()
  })

  it('lists each cue once, before and after audio.sfx holds the added rows', () => {
    const before = allCues(sfx).map((c) => c.id)
    expect(new Set(before).size).toBe(before.length)
    for (const x of extraCues) expect(before).toContain(x.id)
    const held = [...sfx, ...extraCues.filter((x) => !ids.includes(x.id)).map((x) => ({ id: x.id, seconds: x.seconds }))]
    const after = allCues(held).map((c) => c.id)
    expect(after.length).toBe(new Set(after).size)
    expect(after.slice().sort()).toEqual(before.slice().sort())
  })
})

describe('the lines of the narrator', () => {
  it('has no line that only the live site has, and every list of liveOnly is empty', () => {
    expect(liveTriggers).toEqual({})
    for (const key of liveKeys) expect(narration.liveOnly[key], key).toEqual([])
  })

  it('finds the words of every line of the script in the film lines or in the drafts, and hangs no line on an event with no page', () => {
    const drafts = JSON.parse(readFileSync(path.join(process.cwd(), 'content', 'narration-drafts.json'), 'utf8'))
    for (const key of Object.keys(spoken)) {
      const beat = key.slice(0, key.lastIndexOf('.'))
      const index = Number(key.slice(key.lastIndexOf('.') + 1))
      expect((narration.film[beat]?.[index] ?? drafts.film[beat]?.[index])?.text, key).toBeTruthy()
      expect(unitPage[key.slice(0, key.indexOf('.'))], key).toBeDefined()
    }
    const lines = Object.entries(narration.film as Record<string, unknown[]>).flatMap(([beat, list]) => list.map((_, i) => `${beat}.${i}`))
    for (const key of lines) expect(spoken[key], key).toBeDefined()
    expect(spokenKeysFor('vacuum-on', 'step3')).toEqual(['pinball.seal.0'])
  })

  it('names the lines by beat and place', () => {
    expect(filmLineId('step1.tug', 0)).toBe('line.step1.tug.0')
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

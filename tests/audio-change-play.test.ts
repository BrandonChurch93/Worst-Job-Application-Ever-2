import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { changeCue, changeCues, changeLoops, cueFor, eventMatches, keptChange, type ChangeCue } from '../src/audio/change'
import { allCues, cueOfEvent, quietPage, quietPageCues, variantId } from '../src/audio/cues'
import { LIVE } from '../src/audio/levels'
import { mixFilm, type FilmEvent, type MixInput } from '../src/audio/mix'
import type { Sound } from '../src/audio/dsp'
import { ScriptDriver, Stage, wholeFilmFlow } from '../src/stage/stage'
import { pages } from '../src/pages'
import { config } from '../src/config'

// The two states of a cue of audio/CHANGE-CUES.json: with no kept sound its events play what they play without the list,
// and with one they play it, in the film's mix and on the site. Every sound here is a tone made in the test: none is a take.

const root = process.cwd()
const cfg: any = JSON.parse(readFileSync(path.join(root, 'config', 'showcase.json'), 'utf8'))
const SR = 8000
const FPS: number = cfg.film.fps

const tone = (seconds: number, channels = 1): Sound => ({ sampleRate: SR, channels: Array.from({ length: channels }, () => Float32Array.from({ length: Math.round(seconds * SR) }, (_, i) => 0.2 * Math.sin(i / 3))) })
const kitIds = (): string[] => allCues(cfg.audio.sfx as { id: string; seconds: number; variants?: number }[]).flatMap((s) => Array.from({ length: s.variants ?? 1 }, (_, i) => variantId(s.id, i, s.variants ?? 1)))
const kit = (): Map<string, Sound> => new Map(kitIds().map((id) => [id, tone(id === 'room-tone' ? 1 : 0.1, id === 'room-tone' ? 2 : 1)]))
const withKept = (...ids: string[]): Map<string, Sound> => {
  const m = kit()
  for (const id of ids) m.set(id, tone(changeLoops.includes(id) ? 0.4 : 0.1, changeLoops.includes(id) ? 2 : 1))
  return m
}
const film = (events: FilmEvent[], sounds: Map<string, Sound>, over: Partial<MixInput> = {}) =>
  mixFilm({ sampleRate: SR, fps: FPS, seconds: 6, events, lines: [], sounds, sfx: cfg.audio.sfx, duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb, standIns: new Map(), ...over })
const cuesOf = (r: ReturnType<typeof mixFilm>) => r.placed.filter((p) => p.kind === 'cue')
// A name a row's event stands for: the name itself, or its pattern with a part of the table in place of each *.
const nameOf = (pattern: string): string => pattern.replace('*', 'office').replace('*', '2').replace('*', '3')
const pageOf = (r: ChangeCue): string => r.page ?? 'step3'
const made = changeCues.filter((r) => r.made)

describe('a cue of the change list in the film\'s mix', () => {
  it('stands for names the rows\' patterns match', () => {
    for (const r of changeCues) for (const e of r.events) expect(eventMatches(e, nameOf(e)), `${r.id} on ${nameOf(e)}`).toBe(true)
  })

  it('with no kept sound lays what the table of cues gives the event, or nothing', () => {
    for (const r of changeCues) for (const e of r.events) {
      const name = nameOf(e)
      const out = film([{ name, frame: 30, x: 960, page: pageOf(r) }], kit())
      const today = cueOfEvent(name)
      // A cue the table names ahead of its sound (cuesToCome) lays nothing and is named as missing, as it is without the list.
      if (today === r.id) {
        expect(r.standIn, r.id).toBeNull()
        expect(cuesOf(out), name).toEqual([])
        expect(out.missingCues, name).toEqual([r.id])
        continue
      }
      expect(today ?? null, `${r.id} on ${name}`).toBe(r.standIn)
      if (today === undefined) expect(cuesOf(out), name).toEqual([])
      else {
        expect(cuesOf(out).length, name).toBe(1)
        expect(cuesOf(out)[0]).toMatchObject({ event: name, cue: today, frame: 30 })
        expect(cuesOf(out)[0]!.id.split('.')[0], name).toBe(today)
      }
      expect(out.missingCues, name).toEqual([])
      expect(out.hushed, name).toEqual([])
    }
  })

  // A row that lands on an event is not laid at its own event: tests/b-finish-swell-film.test.ts holds where it is laid.
  it('with its sound kept lays that sound on the frame of each of its events, under the name the table gives the event', () => {
    for (const r of changeCues.filter((x) => !x.lands)) for (const e of r.events) {
      const name = nameOf(e)
      const out = film([{ name, frame: 30, x: 960, page: pageOf(r) }], withKept(r.id))
      expect(cuesOf(out).length, `${r.id} on ${name}`).toBe(1)
      expect(cuesOf(out)[0]).toMatchObject({ event: name, id: r.id, cue: cueOfEvent(name) ?? r.id, frame: 30, sample: Math.round((30 / FPS) * SR) })
      expect(out.missingCues, name).toEqual([])
    }
  })

  it('keeps a row with a page to that page', () => {
    for (const r of changeCues.filter((x) => x.page !== undefined)) {
      const name = r.events[0]!
      const other = r.page === 'step2' ? 'step5' : 'step2'
      const out = film([{ name, frame: 30, x: 960, page: other }], withKept(r.id))
      expect(cuesOf(out).map((p) => p.id.split('.')[0]), r.id).toEqual(cueOfEvent(name) ? [cueOfEvent(name)] : [])
    }
  })

  it('lays nothing for an event a kept cue covers in the same frame, names it as hushed, and lays it everywhere else', () => {
    const covering = changeCues.filter((r) => r.covers?.length)
    expect(covering.map((r) => r.id).sort()).toEqual(['pin-bumper', 'pin-kick', 'pin-sling', 'pin-target', 'slab-slam'])
    for (const r of covering) for (const covered of r.covers!) {
      const own = cueOfEvent(covered)
      expect(own, `${covered} has a sound of its own today`).toBeDefined()
      const name = nameOf(r.events[0]!)
      const events: FilmEvent[] = [{ name, frame: 30, x: 960, page: pageOf(r) }, { name: covered, frame: 30, x: 960, page: pageOf(r) }, { name: covered, frame: 90, x: 960, page: pageOf(r) }]
      const kept = film(events, withKept(r.id))
      expect(cuesOf(kept).map((p) => `${p.id.split('.')[0]}@${p.frame}`), r.id).toEqual([`${r.id}@30`, `${own}@90`])
      expect(kept.hushed, r.id).toEqual([`${covered}@30`])
      const turned = film([events[1]!, events[0]!, events[2]!], withKept(r.id))
      expect(cuesOf(turned).map((p) => `${p.id.split('.')[0]}@${p.frame}`), `${r.id}, the covered event first`).toEqual([`${r.id}@30`, `${own}@90`])
      const both = film(events, withKept(r.id), { ignoreCovers: true })
      expect(cuesOf(both).map((p) => p.frame), `${r.id} with covers ignored`).toEqual([30, 30, 90])
      expect(both.hushed).toEqual([])
      const none = film(events, kit())
      expect(cuesOf(none).filter((p) => p.event === covered).map((p) => p.frame), `${r.id} not kept`).toEqual([30, 90])
      expect(none.hushed).toEqual([])
    }
  })

  it('loops a loop of the list from its event to its stop, to a turn of the page, or for LIVE.loopMaxSeconds', () => {
    for (const id of changeLoops) {
      const r = changeCue(id)!
      const start = r.events[0]!
      const stop = r.stops![0]!
      const length = withKept(id).get(id)!.channels[0]!.length / SR
      const stopped = film([{ name: start, frame: 30, x: 960, page: pageOf(r) }, { name: stop, frame: 150, x: 960, page: pageOf(r) }], withKept(id))
      const laid = cuesOf(stopped).find((p) => p.id === id)!
      expect(laid.seconds).toBeCloseTo(120 / FPS, 3)
      expect(laid.seconds).toBeGreaterThan(length * 2)
      const turned = film([{ name: start, frame: 30, x: 960, page: pageOf(r) }, { name: 'page-turn', frame: 90, x: 960, page: pageOf(r) }, { name: stop, frame: 150, x: 960, page: pageOf(r) }], withKept(id))
      expect(cuesOf(turned).find((p) => p.id === id)!.seconds).toBeCloseTo(60 / FPS, 3)
      const open = film([{ name: start, frame: 30, x: 960, page: pageOf(r) }], withKept(id), { seconds: LIVE.loopMaxSeconds + 4 })
      expect(cuesOf(open).find((p) => p.id === id)!.seconds).toBeCloseTo(LIVE.loopMaxSeconds, 3)
      const none = film([{ name: start, frame: 30, x: 960, page: pageOf(r) }, { name: stop, frame: 150, x: 960, page: pageOf(r) }], kit())
      expect(cuesOf(none).filter((p) => p.frame === 30).map((p) => p.id.split('.')[0])).toEqual(r.standIn ? [r.standIn] : [])
    }
  })

  it('leaves the careers page with the press of its button alone, whatever is kept', () => {
    expect(quietPage).toBe('marketing')
    expect(quietPageCues).toEqual(['button-press'])
    for (const r of changeCues) {
      expect(quietPageCues, r.id).not.toContain(r.id)
      expect(r.page, r.id).not.toBe(quietPage)
      for (const e of r.events) expect(cueOfEvent(nameOf(e)) === 'button-press', `${r.id} takes the press of a button`).toBe(false)
    }
    const names = changeCues.flatMap((r) => r.events.map(nameOf))
    const events: FilmEvent[] = [...names.map((name, i) => ({ name, frame: 10 + i, x: 960, page: quietPage })), { name: 'button-press', frame: 200, x: 960, page: quietPage }]
    const out = film(events, withKept(...changeCues.map((r) => r.id)))
    expect(cuesOf(out).map((p) => `${p.id}@${p.frame}`)).toEqual(['button-press@200'])
    expect(out.placed.filter((p) => p.kind === 'tone')).toEqual([])
  })
})

describe('the whole film with the change list', () => {
  const seconds: number = cfg.film.units.reduce((s: number, u: { seconds: number }) => s + u.seconds, 0)
  const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  stage.advance(Math.round(seconds * config.sim.stepHz))
  const events: FilmEvent[] = stage.events.map((e) => ({ name: e.name, frame: Math.floor((e.step * FPS) / config.sim.stepHz), x: e.x, page: e.page }))
  const whole = (sounds: Map<string, Sound>) => film(events, sounds, { seconds })
  // Check A9's rule, as tools/mix.mjs has it: every event with a cue in the table has a laid sound under that cue within audio.contactSyncFrames, unless it is named as hushed.
  const late = (r: ReturnType<typeof mixFilm>): string[] => {
    const out: string[] = []
    for (const e of events) {
      const cue = cueOfEvent(e.name)
      if (!cue || cue === 'room-tone' || r.missingCues.includes(cue) || r.hushed.includes(`${e.name}@${e.frame}`)) continue
      if (!r.placed.some((x) => x.kind === 'cue' && x.cue === cue && Math.abs(x.frame - e.frame) <= cfg.audio.contactSyncFrames)) out.push(`${e.name}@${e.frame}`)
    }
    return out
  }

  it('with none of its sounds kept lays only what the table of cues names, and check A9\'s rule holds', () => {
    const r = whole(kit())
    for (const p of cuesOf(r)) {
      expect(changeCue(p.id), `${p.event} lays ${p.id}`).toBeUndefined()
      if (p.cue !== 'room-tone') expect(p.id.split('.')[0], p.event).toBe(p.cue)
    }
    expect(late(r)).toEqual([])
    expect(r.hushed.every((h) => events.some((e) => `${e.name}@${e.frame}` === h && e.page === quietPage) || h.startsWith('page-turn@'))).toBe(true)
  })

  it('with every made sound kept lays each on its events, lays no stand-in for them, and check A9\'s rule still holds', () => {
    const has = (id: string) => made.some((m) => m.id === id) || kitIds().includes(id)
    const r = whole(withKept(...made.map((m) => m.id)))
    expect(late(r)).toEqual([])
    const laid = new Set(cuesOf(r).map((p) => p.id))
    for (const m of made) {
      const mine = events.filter((e) => e.page !== quietPage && cueFor(e.name, e.page, has) === m.id)
      if (mine.length) expect(laid.has(m.id), `${m.id} has ${mine.length} events in the film and is laid`).toBe(true)
      for (const e of mine) expect(cuesOf(r).some((p) => p.frame === e.frame && p.id === m.id), `${m.id} at ${e.frame}`).toBe(true)
    }
    for (const p of cuesOf(r)) {
      const row = changeCue(p.id)
      if (row) expect(keptChange(row, has) && row.made, p.id).toBe(true)
      else expect(cueFor(p.event, events.find((e) => e.name === p.event && e.frame === p.frame)?.page, has) ?? p.cue, `${p.event} lays ${p.id}`).toBe(p.id.split('.')[0])
    }
    const covered = r.hushed.filter((h) => !events.some((e) => `${e.name}@${e.frame}` === h && e.page === quietPage) && !h.startsWith('page-turn@'))
    expect(covered.length).toBeGreaterThan(0)
    for (const h of covered) expect(made.some((m) => m.covers?.includes(h.split('@')[0]!)), h).toBe(true)
  })
})

class Param {
  value = 1
  setValueAtTime(v: number) { this.value = v }
  linearRampToValueAtTime(v: number) { this.value = v }
  cancelScheduledValues() { /* nothing to cancel */ }
}
class Node {
  to: Node | null = null
  connect(n: Node) { this.to = n }
}
class Gain extends Node { gain = new Param() }
class Panner extends Node { pan = new Param() }
class Source extends Node {
  buffer: { id: string } | null = null
  loop = false
  playbackRate = new Param()
  started: number | null = null
  stopped: number | null = null
  onended: (() => void) | null = null
  start(t: number) { this.started = t }
  stop(t: number) { this.stopped = t }
}
let contexts: FakeContext[] = []
class FakeContext {
  currentTime = 0
  state = 'suspended'
  destination = new Node()
  sources: Source[] = []
  constructor() { contexts.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { return Promise.resolve() }
  createGain() { return new Gain() }
  createStereoPanner() { return new Panner() }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    const id = new TextDecoder().decode(new Uint8Array(bytes))
    ok({ id, numberOfChannels: 1 })
    return Promise.resolve()
  }
}

describe('a cue of the change list on the site', () => {
  beforeEach(() => {
    contexts = []
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  })
  afterEach(() => vi.unstubAllGlobals())

  // A site whose pack holds every sound of the kit and the build, and the cues of the list that are named.
  const site = async (...kept: string[]) => {
    const enc = new TextEncoder()
    const loops = ['room-tone', 'shredder', 'boss-loop', ...kept.filter((id) => changeLoops.includes(id))]
    const short = [...kitIds().filter((id) => !loops.includes(id)), ...kept.filter((id) => !loops.includes(id))]
    const parts = short.map((id) => enc.encode(id))
    const pack = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
    const sfx: SoundIndex['sfx'] = []
    let at = 0
    parts.forEach((p, i) => {
      pack.set(p, at)
      sfx.push({ id: short[i]!, at, bytes: p.length, seconds: 0.2, mime: 'audio/flac' })
      at += p.length
    })
    const index: SoundIndex = { version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx, loops: loops.map((id) => ({ id, file: `${id}.flac`, seconds: 2, mime: 'audio/flac' })), lines: [] }
    const files = new Map<string, Uint8Array>([['sfx.bin', pack], ...loops.map((id): [string, Uint8Array] => [`${id}.flac`, enc.encode(id)])])
    vi.stubGlobal('fetch', async (url: string) => {
      const bytes = files.get(url.replace('./audio/', ''))
      if (!bytes) return { ok: false, status: 404 }
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
    })
    const s = makeSound({ base: './audio/', index })
    await s.unlock()
    const ctx = contexts[0]!
    const played = (from = 0) => ctx.sources.slice(from).map((x) => x.buffer!.id.split('.')[0]!).filter((id) => id !== 'room-tone')
    const send = (name: string, page: string) => s.event({ name, x: 960, y: 540, hitsCursor: false, page }, 'live')
    return { s, ctx, played, send }
  }

  it('with no kept sound plays what the table of cues gives the event, or nothing', async () => {
    const { ctx, played, send } = await site()
    for (const r of changeCues) for (const e of r.events) {
      const from = ctx.sources.length
      ctx.currentTime += 1
      send(nameOf(e), pageOf(r))
      expect(played(from), `${r.id} on ${nameOf(e)}`).toEqual(r.standIn ? [r.standIn] : [])
    }
  })

  it('with its sound kept plays that sound and not the stand-in, and keeps a row with a page to that page', async () => {
    const { ctx, played, send } = await site(...changeCues.map((r) => r.id))
    for (const r of changeCues.filter((x) => !x.lands)) for (const e of r.events) {
      const from = ctx.sources.length
      ctx.currentTime += 40
      send(nameOf(e), pageOf(r))
      expect(played(from), `${r.id} on ${nameOf(e)}`).toEqual([r.id])
      expect(ctx.sources.slice(from).find((x) => x.buffer!.id === r.id)!.loop, r.id).toBe(Boolean(r.loop))
      if (r.page === undefined) continue
      const next = ctx.sources.length
      ctx.currentTime += 40
      send(nameOf(e), r.page === 'step2' ? 'step5' : 'step2')
      expect(played(next), `${r.id} off its page`).toEqual(cueOfEvent(nameOf(e)) ? [cueOfEvent(nameOf(e))] : [])
    }
  })

  it('plays nothing for an event a kept cue covers at the same moment, and plays it at any other', async () => {
    for (const r of changeCues.filter((x) => x.covers?.length)) for (const covered of r.covers!) {
      const kept = await site(r.id)
      kept.ctx.currentTime = 5
      kept.send(nameOf(r.events[0]!), pageOf(r))
      kept.send(covered, pageOf(r))
      expect(kept.played(), r.id).toEqual([r.id])
      kept.ctx.currentTime = 6
      kept.send(covered, pageOf(r))
      expect(kept.played(), `${covered} alone`).toEqual([r.id, cueOfEvent(covered)])
      vi.unstubAllGlobals()
      contexts = []
      vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
      const none = await site()
      none.ctx.currentTime = 5
      none.send(nameOf(r.events[0]!), pageOf(r))
      none.send(covered, pageOf(r))
      expect(none.played(), `${r.id} not kept`).toEqual([...(r.standIn ? [r.standIn] : []), cueOfEvent(covered)])
      vi.unstubAllGlobals()
      contexts = []
      vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
    }
  })

  it('loops a loop of the list and ends it at its stop event and at the turn of the page', async () => {
    for (const id of changeLoops) {
      const r = changeCue(id)!
      const { ctx, send } = await site(id)
      const mine = () => ctx.sources.filter((x) => x.buffer!.id === id)
      ctx.currentTime = 10
      send(r.events[0]!, pageOf(r))
      expect(mine().length).toBe(1)
      expect(mine()[0]!.loop).toBe(true)
      expect(mine()[0]!.stopped).toBeCloseTo(10 + LIVE.loopMaxSeconds, 6)
      ctx.currentTime = 14
      send(r.stops![0]!, pageOf(r))
      expect(mine()[0]!.stopped).toBeCloseTo(14 + LIVE.loopFadeSeconds, 6)
      ctx.currentTime = 20
      send(r.events[0]!, pageOf(r))
      ctx.currentTime = 22
      send('page-turn', pageOf(r))
      expect(mine()[1]!.stopped).toBeCloseTo(22 + LIVE.loopFadeSeconds, 6)
    }
  })

  it('leaves the careers page with the press of its button alone, whatever is kept', async () => {
    const { s, played, send } = await site(...changeCues.map((r) => r.id))
    s.page(quietPage)
    for (const r of changeCues) for (const e of r.events) send(nameOf(e), quietPage)
    for (const name of ['step', 'card-flip', 'key-press', 'checkbox']) send(name, quietPage)
    expect(played()).toEqual([])
    send('button-press', quietPage)
    expect(played()).toEqual(['button-press'])
  })
})

describe('what decides how a sound is played', () => {
  it('is never the class of a cue: the level of a class is set once, when the sound is kept', () => {
    for (const f of ['index.ts', 'mix.ts', 'change.ts']) {
      const body = readFileSync(path.join(root, 'src', 'audio', f), 'utf8')
      expect(body.includes('cueClass'), f).toBe(false)
      expect(body.includes('CLASS_LEVEL'), f).toBe(false)
      expect(/\.class\b/.test(body), f).toBe(false)
    }
  })
})

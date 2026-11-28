import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const TAKE = vi.hoisted(() => ({ id: 'line.boss.finish.0', file: 'line.boss.finish.0.mp3', seconds: 4.01, mime: 'audio/mpeg', words: 'I have / five years / of experience', starts: [0.1, 0.66, 1.3], peak: 1.85 }))
const SWELL = vi.hoisted(() => ({ id: 'finish-charge', bytes: 13, seconds: 3, mime: 'audio/flac' }))
vi.mock('../public/audio/index.json', async (actual) => {
  const real = (await actual()) as { default: { pack: { bytes: number }; sfx: { id: string }[]; lines: { id: string }[] } }
  const d = real.default
  return { ...real, default: { ...d, sfx: [...d.sfx.filter((s) => s.id !== SWELL.id), { ...SWELL, at: d.pack.bytes }], lines: [...d.lines.filter((l) => l.id !== TAKE.id), TAKE] } }
})

import type { Driver, DriverView, FlowEntry, Pointer } from '../src/stage/stage'

// tests/setup.ts has loaded the pages, and with them the sound index as the tree holds it, before this file is read: load them again so that the index above is the one they see.
vi.resetModules()
const { FONTS, registerFont } = await import('../src/shell/metrics')
for (const name of FONTS) registerFont(name, JSON.parse(fs.readFileSync(path.join('public', 'fonts', `${name}.json`), 'utf8')))
const { pages, preparePages } = await import('../src/pages')
await preparePages()
const { default: shipped } = await import('../public/audio/index.json')
const { config, stepHz } = await import('../src/config')
const { makeSound } = await import('../src/audio/index')
const { changeCue, cueFor, landers, landing } = await import('../src/audio/change')
const { cueOfEvent } = await import('../src/audio/cues')
const { LIVE } = await import('../src/audio/levels')
const { FINISH, SHOUT } = await import('../src/boss/tune')
const { BotDriver } = await import('../src/stage/bots')
const { Stage } = await import('../src/stage/stage')

// The one swell of the finish (the Builder's order of 28 November): in the film's mix, on the live site and in the film on the site.
// No sound is made or heard here: the swell is a row of numbers on the live site and a ramp of numbers in the mix, so every claim is a time or a place in a file.

const ROW = changeCue(SWELL.id)!
const TAIL = ROW.lands!.tail
const BODY = SWELL.seconds - TAIL
const RUN = TAKE.peak - TAKE.starts[0]!
const PACK = (shipped as { pack: { bytes: number } }).pack.bytes
const AT = (shipped as { sfx: { id: string; at: number }[] }).sfx.find((s) => s.id === SWELL.id)!.at
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const sw = FINISH as { onVoice: boolean }

class Param {
  value = 1
  set: { v: number; t: number; ramp: boolean }[] = []
  setValueAtTime(v: number, t: number) { this.value = v; this.set.push({ v, t, ramp: false }) }
  linearRampToValueAtTime(v: number, t: number) { this.value = v; this.set.push({ v, t, ramp: true }) }
  cancelScheduledValues() { return undefined }
  setTargetAtTime(v: number) { this.value = v }
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
  offset = 0
  stopped: number | null = null
  onended: (() => void) | null = null
  start(t: number, offset = 0) { this.started = t; this.offset = offset }
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
    ok({ id: new TextDecoder().decode(new Uint8Array(bytes)), numberOfChannels: 1 })
    return Promise.resolve()
  }
}

async function ready() {
  const enc = new TextEncoder()
  vi.stubGlobal('fetch', async (url: string) => {
    const name = url.replace('./audio/', '')
    if (name === 'sfx.bin') {
      const pack = new Uint8Array(AT + SWELL.bytes)
      pack.set(enc.encode(SWELL.id), AT)
      return { ok: true, arrayBuffer: async () => pack.buffer }
    }
    const bytes = enc.encode(name.replace(/\.(mp3|flac)$/, ''))
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  const sound = makeSound({ base: './audio/' })
  await sound.unlock()
  return { sound, ctx: contexts[contexts.length - 1]! }
}

interface Swell { start: number; offset: number; stopped: number | null; fadeIn: number; out: { from: number; to: number } | null }
interface Told { press: number | null; gather: number[]; charges: number; blast: number; heard: number; swells: Swell[] }

const swellsOf = (ctx: FakeContext, after: (t: number) => number): Swell[] => ctx.sources.filter((x) => x.buffer?.id === SWELL.id).map((x) => {
  const g = (x.to as Gain).gain.set
  const up = g.findIndex((p) => p.ramp && p.v === 1)
  const down = g.findIndex((p) => p.ramp && p.v === 0)
  return {
    start: after(x.started!),
    offset: x.offset,
    stopped: x.stopped === null ? null : after(x.stopped),
    fadeIn: up > 0 ? g[up]!.t - g[up - 1]!.t : 0,
    out: down > 0 ? { from: after(g[down - 1]!.t), to: after(g[down]!.t) } : null
  }
})

// One visit of the live site: the pack's keen visitor fights the boss, then `down` is the button, by the seconds after the arms. `frame`: the steps of the stage in one picture of the site,
// after which its events reach the sound code, as src/main.ts sends them. Every time told is in seconds after the arms, on the sound's clock where it is a sound's.
async function visit(down: (u: number) => boolean, frame = 1): Promise<Told> {
  const { sound, ctx } = await ready()
  const bot = new BotDriver('keen', config.seed)
  let arms = -1
  let press: number | null = null
  const driver: Driver = {
    name: 'bot',
    input(v: DriverView): Pointer {
      if (v.page.gag() !== 'boss.collapse' && v.page.gag() !== 'boss.finish') return bot.input(v)
      const on = arms >= 0 && down((stage.step - arms) / stepHz)
      if (on && press === null) press = (stage.step - arms) / stepHz
      return { x: v.cursor.x, y: v.cursor.y, down: on }
    }
  }
  const stage = new Stage({ mode: 'live', flow, pages, driver, seed: config.seed })
  let sent = 0
  let gags = 0
  let heard = -1
  let fire = -1
  while (stage.page.id === 'step4' && stage.time < 140 && (fire < 0 || stage.step < fire + stepHz)) {
    stage.advance(1)
    for (const e of stage.events) if (e.name === 'finish-arms' && arms < 0) arms = e.step
    for (const e of stage.events) if (e.name === 'finish-fire' && fire < 0) fire = e.step
    if (stage.step % frame !== 0) continue
    ctx.currentTime = stage.step / stepHz
    sound.page(stage.page.id)
    for (; sent < stage.events.length; sent++) {
      if (stage.events[sent]!.name === 'finish-fire') heard = ctx.currentTime
      sound.event(stage.events[sent]!, 'live')
    }
    const reached = stage.gagsReached
    for (; gags < reached.length; gags++) sound.beat(reached[gags]!, 'live')
  }
  const after = (t: number): number => Math.round((t - arms / stepHz) * 10000) / 10000
  return {
    press,
    gather: stage.events.filter((e) => e.name === 'finish-gather').map((e) => after(e.step / stepHz)),
    charges: stage.events.filter((e) => e.name === 'finish-charge').length,
    blast: after(fire / stepHz),
    heard: after(heard),
    swells: swellsOf(ctx, after)
  }
}

// Where the swell's body ends on the sound's clock: its start and what is left of its body from where it starts in its file.
const top = (s: Swell): number => s.start + BODY - s.offset
const say = (name: string, t: Told): void => {
  const s = t.swells[0]
  console.info(`MEASURED ${name}: press ${t.press ?? 'none'}, blast ${t.blast}, heard ${t.heard}, mark for the swell at ${JSON.stringify(t.gather)}, ${t.charges} charge marks; ${t.swells.length} swell(s)${s ? `: starts ${s.start}, ${Math.round(s.offset * 1000) / 1000} s into its file, comes in over ${Math.round(s.fadeIn * 1000) / 1000} s, body ends ${Math.round(top(s) * 10000) / 10000} (${Math.round((top(s) - t.heard) * 10000) / 10000} s from the fire as heard), goes out ${s.out ? `${s.out.from} to ${s.out.to}` : 'never'}, stopped ${s.stopped}` : ''}`)
}

describe('the row of the swell', () => {
  it('lands on the fire, from the arms, with a tail, and is played by no charge mark', () => {
    expect(landers.map((r) => r.id)).toEqual([SWELL.id])
    expect(ROW.lands).toEqual({ on: 'finish-fire', from: 'finish-arms', tail: 0.2 })
    expect(ROW.events).toEqual(['finish-gather'])
    expect(ROW.seconds).toBe(3)
    expect(cueOfEvent('finish-charge')).toBeUndefined()
    expect(cueFor('finish-charge', 'step4', () => true)).toBeUndefined()
    expect(cueFor('finish-gather', 'step4', () => true)).toBe(SWELL.id)
    expect(cueFor('finish-gather', 'step4', () => false)).toBeUndefined()
  })

  it('waits when there is room to spare and starts into itself when there is not, so that the body ends on the event either way', () => {
    expect(landing(3, 0.2, 4)).toEqual({ wait: expect.closeTo(1.2, 9), skip: 0 })
    expect(landing(3, 0.2, 2.8)).toEqual({ wait: 0, skip: 0 })
    expect(landing(3, 0.2, 1.75)).toEqual({ wait: 0, skip: expect.closeTo(1.05, 9) })
    expect(landing(3, 0.2, 0)).toEqual({ wait: 0, skip: expect.closeTo(2.8, 9) })
    for (const room of [0.3, 1.55, 2.79, 2.8, 2.81, 6]) {
      const f = landing(3, 0.2, room)
      expect(f.wait + (2.8 - f.skip)).toBeCloseTo(room, 9)
    }
  })
})

describe('the swell on the live site', () => {
  beforeEach(() => {
    contexts = []
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    sw.onVoice = true
  })
  const PIC = 1 / 60

  it('is in the sound index of this file with its kept length, and the switch is on', () => {
    expect((shipped as { sfx: { id: string; seconds: number }[] }).sfx.filter((s) => s.id === SWELL.id).map((s) => s.seconds)).toEqual([SWELL.seconds])
    expect(FINISH.onVoice).toBe(true)
    expect(PACK).toBeGreaterThan(0)
  })

  it.each([
    ['a hold of 3 s from 2.0 s', (u: number) => u >= 2 && u < 5],
    ['a hold of 0.6 s from 2.0 s', (u: number) => u >= 2 && u < 2.6],
    ['a hold from 0.2 s that is never let go', (u: number) => u >= 0.2]
  ])('hold, %s: starts once with the hold, that far into itself that its body ends on the fire, and goes out in no more than 0.05 s as the fire sounds', async (name, down) => {
    const t = await visit(down)
    say(name, t)
    expect(t.gather.length).toBe(1)
    expect(t.gather[0]!).toBeGreaterThan(t.press!)
    expect(t.gather[0]! - t.press!).toBeLessThan(0.35)
    expect(t.swells.length).toBe(1)
    const s = t.swells[0]!
    expect(s.start).toBeCloseTo(t.gather[0]! + 1 / stepHz, 3)
    expect(s.offset).toBeGreaterThan(0)
    expect(s.offset).toBeCloseTo(BODY - (t.blast - t.gather[0]!), 2)
    expect(Math.abs(top(s) - t.heard)).toBeLessThanOrEqual(PIC)
    expect(s.fadeIn).toBeCloseTo(LIVE.loopFadeSeconds, 6)
    expect(s.out!.from).toBeCloseTo(t.heard, 6)
    expect(s.out!.to - s.out!.from).toBeLessThanOrEqual(0.05 + 1e-9)
    expect(s.out!.to - s.out!.from).toBeGreaterThan(0)
    expect(s.stopped).toBeCloseTo(s.out!.to, 6)
    expect(s.start + SWELL.seconds - s.offset).toBeGreaterThanOrEqual(t.heard)
  }, 60000)

  it.each([
    ['a plain click at 2.0 s', (u: number) => u >= 2 && u < 2 + 2 / stepHz],
    ['a plain click at 0.2 s', (u: number) => u >= 0.2 && u < 0.2 + 2 / stepHz],
    ['a press of 0.1 s at 2.0 s', (u: number) => u >= 2 && u < 2.1]
  ])('click, %s: no swell at all, and the charge mark of the press makes no sound', async (name, down) => {
    const t = await visit(down)
    say(name, t)
    expect(t.press).not.toBeNull()
    expect(t.charges).toBeGreaterThanOrEqual(1)
    expect(t.gather).toEqual([])
    expect(t.swells).toEqual([])
  }, 60000)

  it('nobody presses: starts once with the page\'s own press, its body ends on the fire 6 s after the arms, and it sounds without a break until the fire does', async () => {
    const t = await visit(() => false)
    say('no press', t)
    expect(t.press).toBeNull()
    expect(t.blast).toBeCloseTo(FINISH.alone, 2)
    expect(t.gather.length).toBe(1)
    expect(t.gather[0]!).toBeCloseTo(SHOUT.arms + FINISH.alone - RUN, 2)
    expect(t.swells.length).toBe(1)
    const s = t.swells[0]!
    expect(s.start).toBeCloseTo(t.gather[0]! + 1 / stepHz, 3)
    expect(s.offset).toBeCloseTo(BODY - RUN, 2)
    expect(Math.abs(top(s) - t.heard)).toBeLessThanOrEqual(PIC)
    expect(s.start + SWELL.seconds - s.offset).toBeGreaterThanOrEqual(t.heard)
    expect(s.out!.from).toBeCloseTo(t.heard, 6)
    expect(s.stopped! - t.heard).toBeLessThanOrEqual(0.05 + 1e-9)
    expect(s.stopped!).toBeGreaterThanOrEqual(t.heard)
  }, 60000)

  it('holds with the pictures of the site, 60 and 30 a second: the body ends within one picture of the fire as the sound code hears it', async () => {
    for (const frame of [stepHz / 60, stepHz / 30]) {
      const t = await visit((u) => u >= 2.003 && u < 4, frame)
      say(`a hold from 2.003 s, ${stepHz / frame} pictures a second`, t)
      expect(t.swells.length).toBe(1)
      expect(Math.abs(top(t.swells[0]!) - t.heard)).toBeLessThanOrEqual(frame / stepHz)
      expect(t.swells[0]!.stopped! - t.heard).toBeLessThanOrEqual(0.05 + 1e-9)
      const alone = await visit(() => false, frame)
      say(`no press, ${stepHz / frame} pictures a second`, alone)
      expect(alone.swells.length).toBe(1)
      expect(Math.abs(top(alone.swells[0]!) - alone.heard)).toBeLessThanOrEqual(frame / stepHz)
    }
  }, 120000)

  it('with the switch off, where letting go fires: a hold starts it whole, letting go cuts it in no more than 0.05 s as the fire sounds, and a click starts none', async () => {
    sw.onVoice = false
    const t = await visit((u) => u >= 2 && u < 4.5)
    say('switch off, a hold of 2.5 s from 2.0 s', t)
    expect(t.gather.length).toBe(1)
    expect(t.swells.length).toBe(1)
    const s = t.swells[0]!
    expect(s.offset).toBe(0)
    expect(s.start).toBeCloseTo(t.gather[0]! + 1 / stepHz, 3)
    expect(s.out!.from).toBeCloseTo(t.heard, 6)
    expect(s.out!.to - s.out!.from).toBeLessThanOrEqual(0.05 + 1e-9)
    sw.onVoice = false
    const click = await visit((u) => u >= 2 && u < 2 + 2 / stepHz)
    say('switch off, a plain click at 2.0 s', click)
    expect(click.swells).toEqual([])
  }, 120000)
})

describe('the swell in the film on the site', () => {
  beforeEach(() => {
    contexts = []
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  })
  afterEach(() => vi.unstubAllGlobals())

  // The film's page lets the blast go `SHOUT.fire` after the arms (tests/b-finish-swell-film.test.ts holds the cut list to that with the tree's own index).
  // Here the marks are sent as the film sends them, a picture at a time, with the marks of the sound index of this file.
  it('starts at the arms so that its body ends on the fire within one picture, once, the charge marks play nothing, and its tail runs on under the fire', async () => {
    const { sound, ctx } = await ready()
    const fps = config.film.fps
    const t0 = 10
    const marks = [{ name: 'finish-arms', at: SHOUT.arms }, ...SHOUT.beats.map((b) => ({ name: 'finish-charge', at: b })), { name: 'finish-fire', at: SHOUT.fire }]
    let fire = -1
    sound.page('step4')
    for (const m of marks) {
      ctx.currentTime = t0 + Math.ceil((m.at - SHOUT.arms) * fps - 1e-9) / fps
      if (m.name === 'finish-fire') fire = ctx.currentTime - t0
      sound.event({ name: m.name, x: 550, y: 650, hitsCursor: false, page: 'step4', step: Math.round(m.at * stepHz) }, 'film')
    }
    ctx.currentTime += 1
    const swells = swellsOf(ctx, (t) => Math.round((t - t0) * 10000) / 10000)
    console.info(`MEASURED film on the site: the fire ${Math.round((SHOUT.fire - SHOUT.arms) * 1000) / 1000} s after the arms by SHOUT, heard ${Math.round(fire * 10000) / 10000} s after; ${swells.length} swell(s): ${JSON.stringify(swells)}`)
    expect(swells.length).toBe(1)
    const s = swells[0]!
    expect(Math.abs(top(s) - fire)).toBeLessThanOrEqual(1 / fps)
    expect(s.start).toBeCloseTo(Math.max(0, SHOUT.fire - SHOUT.arms - BODY), 4)
    expect(s.offset).toBeCloseTo(Math.max(0, BODY - (SHOUT.fire - SHOUT.arms)), 4)
    expect(s.stopped).toBeNull()
    expect(s.out).toBeNull()
    expect(ctx.sources.filter((x) => x.buffer?.id === SWELL.id).length).toBe(1)
  })
})

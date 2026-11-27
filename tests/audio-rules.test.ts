import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { filmLineId, unitPage } from '../src/audio/cues'
import { standIns } from '../src/audio/standin'
import { LIVE, db } from '../src/audio/levels'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const unitOf = (beat: string): string => cfg.film.beats.find((b: any) => b.id === beat).unit
const beatOf = (key: string) => key.slice(0, key.lastIndexOf('.'))
const idOf = (key: string) => filmLineId(beatOf(key), Number(key.slice(key.lastIndexOf('.') + 1)))
const pageOf = (key: string) => unitPage[unitOf(beatOf(key))]!

class Param {
  value = 1
  calls: [string, number, number][] = []
  setValueAtTime(v: number, t: number) { this.calls.push(['set', v, t]); this.value = v }
  linearRampToValueAtTime(v: number, t: number) { this.calls.push(['ramp', v, t]); this.value = v }
  cancelScheduledValues(t: number) { this.calls.push(['cancel', 0, t]) }
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
let made: FakeContext[] = []
class FakeContext {
  currentTime = 0
  state = 'suspended'
  destination = new Node()
  gains: Gain[] = []
  sources: Source[] = []
  constructor() { made.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { return Promise.resolve() }
  createGain() { const g = new Gain(); this.gains.push(g); return g }
  createStereoPanner() { return new Panner() }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    const id = new TextDecoder().decode(new Uint8Array(bytes))
    ok({ id, numberOfChannels: id === 'room-tone' ? 2 : 1 })
    return Promise.resolve()
  }
}

const LINE = 2
const SHORT = ['step.1', 'button-press', 'bumper.1', 'boss-hit', 'unfold', 'power-down']
function site(): { index: SoundIndex; files: Map<string, Uint8Array> } {
  const enc = new TextEncoder()
  const ids = [...standIns().values()].map((l) => l.id)
  const parts = SHORT.map((id) => enc.encode(id))
  const pack = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  const sfx: SoundIndex['sfx'] = []
  let at = 0
  parts.forEach((p, i) => {
    pack.set(p, at)
    sfx.push({ id: SHORT[i]!, at, bytes: p.length, seconds: 0.2, mime: 'audio/flac' })
    at += p.length
  })
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx,
    loops: ['room-tone', 'shredder', 'boss-loop'].map((id) => ({ id, file: `${id}.flac`, seconds: 8, mime: 'audio/flac' })),
    lines: ids.map((id) => ({ id, file: `${id}.mp3`, seconds: LINE, mime: 'audio/mpeg' }))
  }
  const files = new Map<string, Uint8Array>([['sfx.bin', pack]])
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, enc.encode(f.id))
  return { index, files }
}

let errors: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  made = []
  vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  errors.mockRestore()
})
const serve = () => {
  const s0 = site()
  vi.stubGlobal('fetch', async (url: string) => {
    const bytes = s0.files.get(url.replace('./audio/', ''))
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  return s0
}
const ready = async () => {
  const s0 = serve()
  const s = makeSound({ base: './audio/', index: s0.index })
  await s.unlock()
  return { s, ctx: made[0]! }
}
const ev = (name: string, page: string, hitsCursor = false) => ({ name, step: 0, page, x: 960, y: 540, hitsCursor })
const lines = (ctx: FakeContext) => ctx.sources.filter((x) => x.buffer?.id.startsWith('line.'))
const starts = (ctx: FakeContext, id: string) => ctx.sources.filter((x) => x.buffer?.id === id && x.stopped === null).map((x) => x.started)
const far = LINE + gap + 0.5
// What still sounds at a time: every source that has started, is not stopped by then, and either loops or has not run out.
const sounding = (ctx: FakeContext, t: number, seconds: (id: string) => number) => ctx.sources.filter((x) => x.started !== null && x.started <= t && (x.stopped === null || x.stopped > t) && (x.loop || x.started + seconds(x.buffer!.id) > t)).map((x) => x.buffer!.id)
const lengthOf = (id: string) => (id.startsWith('line.') ? LINE : id === 'room-tone' || id === 'shredder' || id === 'boss-loop' ? 8 : 0.2)

describe('the volume and the sound control', () => {
  it('follows the volume it is given at five points from 0 to 100 percent, at the output of the whole engine, with one fixed headroom after it', async () => {
    const { s, ctx } = await ready()
    const out = ctx.gains[0]!
    const head = ctx.gains[4]!
    expect(out.to).toBe(head)
    expect(head.to).toBe(ctx.destination)
    expect(head.gain.value).toBeCloseTo(db(-LIVE.headroomDb), 12)
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      ctx.currentTime += 1
      s.setVolume(v)
      expect(out.gain.value).toBe(v)
      expect(out.gain.calls[out.gain.calls.length - 1]).toEqual(['ramp', v, ctx.currentTime + LIVE.volumeRampSeconds])
      expect(s.volume()).toBe(v)
    }
    expect(head.gain.calls).toEqual([])
    expect(ctx.gains.slice(1, 4).every((bus) => bus.to === out)).toBe(true)
  })

  it('mutes everything at once, a loop included, and gives all of it back', async () => {
    const { s, ctx } = await ready()
    const out = ctx.gains[0]!
    ctx.currentTime = 10
    s.event(ev('boss-music', 'step4'), 'live')
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 10.5
    const before = sounding(ctx, 10.5, lengthOf)
    expect(before).toEqual(expect.arrayContaining(['room-tone', 'boss-loop']))
    for (const x of ctx.sources) {
      let n: Node | null = x
      while (n && n !== out) n = n.to
      expect(n, x.buffer!.id).toBe(out)
    }
    s.setMuted(true)
    expect(out.gain.value).toBe(0)
    expect(s.muted()).toBe(true)
    s.setVolume(0.7)
    expect(out.gain.value).toBe(0)
    expect(sounding(ctx, 10.5, lengthOf)).toEqual(before)
    s.setMuted(false)
    expect(out.gain.value).toBe(0.7)
  })
})

describe('the fallback: plain audio elements, one for each sound', () => {
  class El {
    static all: El[] = []
    src = ''
    loop = false
    volume = 1
    currentTime = 0
    paused = true
    preload = ''
    playbackRate = 1
    onerror: (() => void) | null = null
    private ready: (() => void) | null = null
    constructor() { El.all.push(this) }
    set oncanplaythrough(f: () => void) { this.ready = f; queueMicrotask(() => this.ready?.()) }
    play() { this.paused = false; return Promise.resolve() }
    pause() { this.paused = true }
  }
  const forced = async (Maker: unknown) => {
    El.all = []
    const s0 = serve()
    vi.stubGlobal('window', { AudioContext: Maker, setTimeout, clearTimeout })
    vi.stubGlobal('Audio', El)
    vi.stubGlobal('URL', { createObjectURL: () => `blob:${El.all.length}`, revokeObjectURL: () => undefined })
    const s = makeSound({ base: './audio/', index: s0.index })
    await s.unlock()
    return { s, index: s0.index }
  }

  it('is what the engine runs on when the audio graph cannot be made: the maker throws', async () => {
    const { s, index } = await forced(class { constructor() { throw new Error('no audio graph here') } })
    expect(made.length).toBe(0)
    expect(s.backend()).toBe('elements')
    expect(s.state()).toBe('ready')
    expect(s.available()).toBe(true)
    expect(El.all.length).toBe(index.sfx.length + index.loops.length)
    expect(errors).not.toHaveBeenCalled()
  })

  it('is what the engine runs on when the browser has no audio graph at all, and it plays, mutes and stops there', async () => {
    const { s } = await forced(undefined)
    expect(s.backend()).toBe('elements')
    const playing = () => El.all.filter((e) => !e.paused).length
    s.event(ev('button-press', 'step1'), 'live')
    expect(playing()).toBe(2)
    s.setMuted(true)
    for (const e of El.all.filter((x) => !x.paused)) expect(e.volume).toBe(0)
    s.setMuted(false)
    expect(El.all.filter((x) => !x.paused).some((e) => e.volume > 0)).toBe(true)
    s.stop()
    expect(playing()).toBe(0)
  })
})

describe('the edges: nothing is left hanging and nothing is doubled', () => {
  it('leaves for the film with everything stopped, and comes back with one room tone and no line of the page that was left', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('boss-music', 'step4'), 'live')
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 11
    s.stop()
    const cut = ctx.currentTime + LIVE.volumeRampSeconds
    for (const x of ctx.sources) expect(x.stopped, x.buffer!.id).not.toBeNull()
    for (const x of ctx.sources) expect(x.stopped!).toBeLessThanOrEqual(cut + 1e-9)
    expect(sounding(ctx, cut + 0.001, lengthOf)).toEqual([])
    expect(s.log().filter((e) => e.what === 'cut').map((e) => e.line)).toEqual([idOf('boss.verify.0')])
    ctx.currentTime = 12
    s.start()
    expect(sounding(ctx, 12.5, lengthOf)).toEqual(['room-tone'])
    ctx.currentTime = 40
    s.stop()
    s.start()
    s.start()
    s.event(ev('step', 'step4'), 'live')
    expect(sounding(ctx, 40.5, lengthOf).filter((id) => id === 'room-tone')).toEqual(['room-tone'])
    expect(sounding(ctx, 40.5, lengthOf).filter((id) => id.startsWith('line.') || id === 'boss-loop')).toEqual([])
  })

  it('holds everything while the tab is in the background and carries on with the same sounds, none started twice', async () => {
    const doc = { visibilityState: 'visible', listeners: [] as (() => void)[], addEventListener(_: string, fn: () => void) { this.listeners.push(fn) } }
    vi.stubGlobal('document', doc)
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('boss-music', 'step4'), 'live')
    s.event(ev('checkbox', 'step4'), 'live')
    const count = ctx.sources.length
    doc.visibilityState = 'hidden'
    for (const fn of doc.listeners) fn()
    expect(ctx.state).toBe('suspended')
    doc.visibilityState = 'visible'
    for (const fn of doc.listeners) fn()
    expect(ctx.state).toBe('running')
    expect(ctx.sources.length).toBe(count)
    for (const x of ctx.sources) expect(x.stopped === null || x.stopped > ctx.currentTime, x.buffer!.id).toBe(true)
    expect(sounding(ctx, 10.5, lengthOf).sort()).toEqual(['boss-loop', 'room-tone'].sort())
  })
})

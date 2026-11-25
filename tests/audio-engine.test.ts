import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { PITCH_CENTS, openingEvents } from '../src/audio/cues'
import { openingFrames, openingTimes } from '../src/film/opening'
import { LIVE, db } from '../src/audio/levels'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')

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
let fetched: string[] = []
class FakeContext {
  currentTime = 0
  state = 'suspended'
  destination = new Node()
  gains: Gain[] = []
  sources: Source[] = []
  closed = false
  constructor() { made.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { this.closed = true; return Promise.resolve() }
  createGain() { const g = new Gain(); this.gains.push(g); return g }
  createStereoPanner() { return new Panner() }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    const id = new TextDecoder().decode(new Uint8Array(bytes))
    ok({ id, numberOfChannels: id === 'room-tone' ? 2 : 1 })
    return Promise.resolve()
  }
}

const beatId: string = Object.keys(narration.film).find((b) => narration.film[b].length >= 1 && cfg.film.beats.some((x: any) => x.id === b))!
const beat = cfg.film.beats.find((x: any) => x.id === beatId)

function fixtureSite(): { index: SoundIndex; files: Map<string, Uint8Array | null> } {
  const enc = new TextEncoder()
  const short = ['step.1', 'step.2', 'step.3', 'step.4', 'button-press', 'hold-music', 'bolt-hit.1', 'bolt-hit.2', 'bolt-hit.3', 'flipper.1', 'flipper.2', 'flipper.3', 'checkbox', 'paper-strain', 'key-tap', 'ui-tick', 'ui-send']
  const parts = short.map((id) => enc.encode(id))
  const pack = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  const sfx: SoundIndex['sfx'] = []
  let at = 0
  parts.forEach((p, i) => {
    pack.set(p, at)
    sfx.push({ id: short[i]!, at, bytes: p.length, seconds: short[i] === 'hold-music' ? 5 : 0.2, mime: 'audio/flac' })
    at += p.length
  })
  const lines = [
    ...narration.film[beatId].map((_: unknown, i: number) => `line.${beatId}.${i}`),
    'line.live.hit.0', 'line.live.hit.1', 'line.live.idle.0', 'line.live.pinball.flipper.0', 'line.live.boss.verify.0', 'line.live.tugLost.0'
  ]
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx,
    loops: [{ id: 'room-tone', file: 'room-tone.flac', seconds: 8, mime: 'audio/flac' }, { id: 'shredder', file: 'shredder.flac', seconds: 2, mime: 'audio/flac' }],
    lines: lines.map((id) => ({ id, file: `${id}.mp3`, seconds: 1.5, mime: 'audio/mpeg' }))
  }
  const files = new Map<string, Uint8Array | null>([['sfx.bin', pack]])
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, enc.encode(f.id))
  return { index, files }
}

function serve(files: Map<string, Uint8Array | null> = new Map()) {
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(url)
    const name = url.replace('./audio/', '')
    const bytes = files.get(name)
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
}

const playsOf = (ctx: FakeContext, id: string) => ctx.sources.filter((s) => s.buffer?.id === id)
const hit = (name: string, hitsCursor = false, x = 960) => ({ name, x, y: 540, hitsCursor })

let errors: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  made = []
  fetched = []
  vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  errors.mockRestore()
})

describe('before the first click', () => {
  it('makes nothing, fetches nothing and plays nothing', () => {
    serve(fixtureSite().files)
    const s = makeSound({ base: './audio/', index: fixtureSite().index })
    s.event(hit('step'), 'live')
    s.beat(beatId, 'film')
    s.trigger('idle')
    s.setVolume(0.5)
    s.setMuted(true)
    s.stop()
    s.start()
    expect(made.length).toBe(0)
    expect(fetched).toEqual([])
    expect(s.state()).toBe('locked')
    expect(s.backend()).toBe('none')
    expect(s.available()).toBe(true)
    expect(s.muted()).toBe(true)
    expect(s.volume()).toBe(0.5)
  })
})

describe('with no sound to play', () => {
  const quiet = (s: ReturnType<typeof makeSound>) => {
    expect(s.available()).toBe(false)
    expect(s.state()).toBe('silent')
    expect(s.backend()).toBe('none')
    s.event(hit('step', true), 'live')
    s.beat(beatId, 'live')
    s.trigger('idle')
    s.setMuted(false)
    s.setVolume(1)
    s.stop()
    for (const c of made) {
      expect(c.sources.length).toBe(0)
      expect(c.closed).toBe(true)
    }
    expect(errors).not.toHaveBeenCalled()
  }

  it('is silent from the start on the index the repository ships, which lists nothing', async () => {
    const shipped = read('public', 'audio', 'index.json')
    expect(shipped.sfx.length + shipped.loops.length + shipped.lines.length).toBe(0)
    serve()
    const s = makeSound({ base: './audio' })
    let changes = 0
    s.onChange(() => changes++)
    expect(s.available()).toBe(false)
    await expect(s.unlock()).resolves.toBeUndefined()
    quiet(s)
    expect(made.length).toBe(0)
    expect(fetched).toEqual([])
    expect(changes).toBe(0)
  })

  it('runs silent when the index names files that are not there', async () => {
    serve()
    const s = makeSound({ base: './audio', index: fixtureSite().index })
    let changes = 0
    s.onChange(() => changes++)
    expect(s.available()).toBe(true)
    await s.unlock()
    quiet(s)
    expect(changes).toBe(2)
    expect(fetched).toEqual(['./audio/sfx.bin'])
  })

  it('runs silent when the request itself fails', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('offline') })
    const s = makeSound({ base: './audio/', index: fixtureSite().index })
    await expect(s.unlock()).resolves.toBeUndefined()
    quiet(s)
  })

  it('runs silent in a browser with no way to play sound', async () => {
    vi.stubGlobal('window', { setTimeout, clearTimeout })
    serve(fixtureSite().files)
    const s = makeSound({ base: './audio/', index: fixtureSite().index })
    await s.unlock()
    quiet(s)
    expect(fetched).toEqual([])
  })
})

describe('with sound', () => {
  const ready = async () => {
    const site = fixtureSite()
    serve(site.files)
    const s = makeSound({ base: './audio/', index: site.index })
    await s.unlock()
    return { s, ctx: made[0]! }
  }

  it('loads once, on the unlock, and loops the room tone under everything', async () => {
    const { s, ctx } = await ready()
    await s.unlock()
    expect(made.length).toBe(1)
    expect(fetched.filter((u) => u.endsWith('index.json')).length).toBe(0)
    expect(fetched.filter((u) => u.endsWith('sfx.bin')).length).toBe(1)
    expect(s.available()).toBe(true)
    expect(s.state()).toBe('ready')
    expect(s.backend()).toBe('graph')
    expect(ctx.state).toBe('running')
    const tone = playsOf(ctx, 'room-tone')
    expect(tone.length).toBe(1)
    expect(tone[0]!.loop).toBe(true)
    expect(tone[0]!.stopped).toBeNull()
    s.event(hit('step'), 'film')
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
  })

  it('plays the variants of a cue in turn with the fixed pitch offsets, never at random', async () => {
    const { s, ctx } = await ready()
    for (let i = 0; i < 9; i++) {
      ctx.currentTime = 1 + i * 0.3
      s.event(hit('step'), 'film')
    }
    const steps = ctx.sources.filter((x) => x.buffer?.id.startsWith('step.'))
    expect(steps.map((x) => x.buffer!.id)).toEqual(['step.1', 'step.2', 'step.3', 'step.4', 'step.1', 'step.2', 'step.3', 'step.4', 'step.1'])
    steps.forEach((x, i) => expect(x.playbackRate.value).toBeCloseTo(Math.pow(2, PITCH_CENTS[i % PITCH_CENTS.length]! / 1200), 9))
    steps.forEach((x, i) => expect(x.started).toBeCloseTo(1 + i * 0.3, 9))
  })

  it('plays the cue of a beat event, and once when the event comes under both names', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 2
    s.event(hit('bolt-hit'), 'film')
    s.event(hit('bolt-hit-cursor', true), 'film')
    expect(ctx.sources.filter((x) => x.buffer?.id.startsWith('bolt-hit')).map((x) => x.buffer!.id)).toEqual(['bolt-hit.1'])
    ctx.currentTime = 2.5
    s.event(hit('bolt-hit-cursor', true), 'film')
    expect(ctx.sources.filter((x) => x.buffer?.id.startsWith('bolt-hit')).map((x) => x.buffer!.id)).toEqual(['bolt-hit.1', 'bolt-hit.2'])
    s.event(hit('no-such-event'), 'film')
    s.event(hit('card-flip'), 'film')
    expect(ctx.sources.filter((x) => x.buffer?.id === 'card-flip').length).toBe(0)
  })

  it('cuts the hold music dead at audio.holdMusicSeconds', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(hit('hold-music'), 'film')
    const music = playsOf(ctx, 'hold-music')[0]!
    expect(music.started).toBe(10)
    expect(music.stopped).toBeCloseTo(10 + cfg.audio.holdMusicSeconds, 9)
    expect((music.to as Gain).gain.calls).toEqual([])
  })

  it('speaks the lines of a beat each at its place and lowers the effects under them', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 20
    s.beat(beatId, 'film')
    const lines: { at: number }[] = narration.film[beatId]
    lines.forEach((l, i) => {
      const src = playsOf(ctx, `line.${beatId}.${i}`)
      expect(src.length).toBe(1)
      if (i === 0) expect(src[0]!.started).toBeCloseTo(20 + l.at * (beat.to - beat.from), 6)
      else expect(src[0]!.started!).toBeGreaterThanOrEqual(20 + l.at * (beat.to - beat.from) - 1e-9)
    })
    const fx = ctx.gains[1]!
    expect(fx.gain.calls.some((c) => c[0] === 'ramp' && Math.abs(c[1] - db(-cfg.audio.duckDb)) < 1e-9)).toBe(true)
    expect(ctx.gains[3]!.gain.calls).toEqual([])
    s.beat('no.such.beat', 'film')
  })

  it('never lets a live line interrupt, keeps the gap, and drops the late line', async () => {
    const { s, ctx } = await ready()
    const live = () => ctx.sources.filter((x) => x.buffer?.id.startsWith('line.live.')).map((x) => x.buffer!.id)
    ctx.currentTime = 30
    s.trigger('idle')
    expect(live()).toEqual(['line.live.idle.0'])
    ctx.currentTime = 30.5
    s.trigger('hit')
    ctx.currentTime = 31.6
    s.trigger('hit')
    ctx.currentTime = 31.5 + cfg.audio.liveNarratorMinGapSeconds - 1
    s.trigger('hit')
    expect(live()).toEqual(['line.live.idle.0'])
    ctx.currentTime = 31.5 + cfg.audio.liveNarratorMinGapSeconds + 0.01
    s.trigger('hit')
    expect(live()).toEqual(['line.live.idle.0', 'line.live.hit.0'])
    ctx.currentTime += 1.5 + cfg.audio.liveNarratorMinGapSeconds + 0.01
    s.trigger('hit')
    expect(live()).toEqual(['line.live.idle.0', 'line.live.hit.0', 'line.live.hit.1'])
    s.trigger('no-such-line')
    s.trigger('about')
  })

  it('sets the live lines off from the events of the stage in live mode only', async () => {
    const { s, ctx } = await ready()
    const live = () => ctx.sources.filter((x) => x.buffer?.id.startsWith('line.live.')).map((x) => x.buffer!.id)
    const far = 2 + cfg.audio.liveNarratorMinGapSeconds
    ctx.currentTime = 40
    s.event(hit('bolt-hit-cursor', true), 'film')
    s.event(hit('checkbox'), 'film')
    expect(live()).toEqual([])
    ctx.currentTime += far
    s.event(hit('bolt-hit-cursor', true), 'live')
    expect(live()).toEqual(['line.live.hit.0'])
    ctx.currentTime += far
    s.event(hit('flipper'), 'live')
    ctx.currentTime += far
    s.event(hit('flipper'), 'live')
    expect(live()).toEqual(['line.live.hit.0', 'line.live.pinball.flipper.0'])
    ctx.currentTime += far
    s.event(hit('checkbox'), 'live')
    ctx.currentTime += far
    s.event(hit('tug-lost'), 'live')
    expect(live()).toEqual(['line.live.hit.0', 'line.live.pinball.flipper.0', 'line.live.boss.verify.0', 'line.live.tugLost.0'])
    expect(ctx.sources.filter((x) => x.buffer?.id.startsWith('flipper.')).map((x) => x.buffer!.id)).toEqual(['flipper.1', 'flipper.2'])
  })

  it('stops a loop at its stop event and at the turn of the page', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 50
    s.event(hit('shredder'), 'film')
    const first = playsOf(ctx, 'shredder')[0]!
    expect(first.loop).toBe(true)
    expect(first.stopped).toBeCloseTo(50 + LIVE.loopMaxSeconds, 9)
    ctx.currentTime = 52
    s.event(hit('shredder-stop'), 'film')
    expect(first.stopped).toBeCloseTo(52.03, 6)
    ctx.currentTime = 53
    s.event(hit('shredder'), 'film')
    ctx.currentTime = 54
    s.event(hit('page-turn'), 'film')
    expect(playsOf(ctx, 'shredder')[1]!.stopped).toBeCloseTo(54.03, 6)
    expect(playsOf(ctx, 'room-tone')[0]!.stopped).toBeNull()
  })

  it('mutes, sets the volume between 0 and 1, and stops', async () => {
    const { s, ctx } = await ready()
    const out = ctx.gains[0]!
    s.setVolume(0.4)
    expect(out.gain.value).toBeCloseTo(0.4, 9)
    s.setMuted(true)
    expect(out.gain.value).toBe(0)
    expect(s.muted()).toBe(true)
    s.setMuted(false)
    expect(out.gain.value).toBeCloseTo(0.4, 9)
    s.setVolume(7)
    expect(s.volume()).toBe(1)
    s.setVolume(-3)
    expect(s.volume()).toBe(0)
    s.setVolume(Number.NaN)
    expect(s.volume()).toBe(0)
    s.setVolume(1)
    ctx.currentTime = 60
    s.event(hit('button-press'), 'film')
    s.trigger('idle')
    s.stop()
    for (const x of ctx.sources) expect(x.stopped).not.toBeNull()
    ctx.currentTime = 61
    s.event(hit('button-press'), 'film')
    expect(playsOf(ctx, 'room-tone').length).toBe(2)
  })

  it('is fully silent after stop() and has the room tone back at once at start()', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.stop()
    expect(playsOf(ctx, 'room-tone')[0]!.stopped).not.toBeNull()
    ctx.currentTime = 20
    s.trigger('idle')
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
    s.start()
    const tone = playsOf(ctx, 'room-tone')
    expect(tone.length).toBe(2)
    expect(tone[1]!.started).toBe(20)
    expect(tone[1]!.loop).toBe(true)
    expect(tone[1]!.stopped).toBeNull()
    s.start()
    s.event(hit('step'), 'film')
    expect(playsOf(ctx, 'room-tone').length).toBe(2)
  })

  it('stopped before the first click, stays silent after it until start()', async () => {
    const site = fixtureSite()
    serve(site.files)
    const s = makeSound({ base: './audio/', index: site.index })
    s.start()
    expect(made.length).toBe(0)
    s.stop()
    await s.unlock()
    const ctx = made[0]!
    expect(s.state()).toBe('ready')
    expect(ctx.sources.length).toBe(0)
    s.start()
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
  })

  it('holds its breath while the page is hidden and carries on when it is back', async () => {
    const page = { visibilityState: 'visible', heard: [] as (() => void)[], addEventListener(name: string, f: () => void) { if (name === 'visibilitychange') this.heard.push(f) } }
    vi.stubGlobal('document', page)
    const quietSite = makeSound({ base: './audio/', index: { version: 1, pack: null, sfx: [], loops: [], lines: [] } })
    await quietSite.unlock()
    expect(page.heard.length).toBe(0)
    const { s, ctx } = await ready()
    expect(page.heard.length).toBe(1)
    page.visibilityState = 'hidden'
    page.heard[0]!()
    expect(ctx.state).toBe('suspended')
    s.event(hit('button-press'), 'live')
    expect(ctx.state).toBe('suspended')
    expect(playsOf(ctx, 'room-tone')[0]!.stopped).toBeNull()
    page.visibilityState = 'visible'
    page.heard[0]!()
    expect(ctx.state).toBe('running')
  })

  it('asks the sound graph to run again at the end of a touch or a click, never while the page is hidden', async () => {
    const heard = new Map<string, () => void>()
    const page = { visibilityState: 'visible', back: null as (() => void) | null, addEventListener(_: string, f: () => void) { this.back = f } }
    vi.stubGlobal('document', page)
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout, addEventListener: (name: string, f: () => void) => heard.set(name, f) })
    const site = fixtureSite()
    serve(site.files)
    const s = makeSound({ base: './audio/', index: site.index })
    expect(heard.size).toBe(0)
    await s.unlock()
    const ctx = made[0]!
    expect([...heard.keys()].sort()).toEqual([...LIVE.wakeEvents].sort())
    for (const name of LIVE.wakeEvents) {
      ctx.state = 'suspended'
      heard.get(name)!()
      expect(ctx.state, name).toBe('running')
    }
    page.visibilityState = 'hidden'
    page.back!()
    heard.get('click')!()
    expect(ctx.state).toBe('suspended')
  })

  it('with plain audio elements stops what plays when the page is hidden', async () => {
    const page = { visibilityState: 'visible', heard: [] as (() => void)[], addEventListener(name: string, f: () => void) { if (name === 'visibilitychange') this.heard.push(f) } }
    vi.stubGlobal('document', page)
    const playing = new Set<string>()
    class El {
      src = ''
      loop = false
      volume = 1
      playbackRate = 1
      currentTime = 0
      preload = ''
      onerror: (() => void) | null = null
      private ready: (() => void) | null = null
      set oncanplaythrough(f: () => void) { this.ready = f; queueMicrotask(() => this.ready?.()) }
      play() { playing.add(this.src); return Promise.resolve() }
      pause() { playing.delete(this.src) }
    }
    let n = 0
    vi.stubGlobal('window', { setTimeout, clearTimeout })
    vi.stubGlobal('Audio', El)
    vi.stubGlobal('URL', { createObjectURL: () => `blob:${n++}`, revokeObjectURL: () => undefined })
    const site = fixtureSite()
    serve(site.files)
    const s = makeSound({ base: './audio/', index: site.index })
    await s.unlock()
    expect(s.backend()).toBe('elements')
    s.event(hit('button-press'), 'live')
    expect(playing.size).toBe(2)
    page.visibilityState = 'hidden'
    page.heard[0]!()
    expect(playing.size).toBe(0)
    page.visibilityState = 'visible'
    page.heard[0]!()
    s.event(hit('checkbox'), 'film')
    expect(playing.size).toBe(2)
  })
})

describe('the opening of film A on the site', () => {
  const FPS: number = cfg.film.fps
  const end = openingFrames() / FPS
  const t = openingTimes()
  const laid = openingEvents({ prompt: cfg.intro.prompt, charsPerSecond: cfg.intro.charsPerSecond, levelOpens: t.levelOpens, levelPicks: t.levelPicks, sendPressed: t.held, linesDone: t.lines.map((l) => l.done) }, FPS)
  const ready = async () => {
    const site = fixtureSite()
    serve(site.files)
    const s = makeSound({ base: './audio/', index: site.index })
    return { s, unlock: async () => { await s.unlock(); return made[0]! } }
  }
  const run = (s: ReturnType<typeof makeSound>, ctx: FakeContext, from: number, to: number) => {
    for (let f = Math.round(from * FPS); f < Math.round(to * FPS); f++) {
      ctx.currentTime = (f + 1) / FPS
      s.opening(f / FPS, (f + 1) / FPS)
    }
  }

  it('plays the sounds the film A mix lays over the opening, each in the frame the mix lays it in', async () => {
    const { s, unlock } = await ready()
    const ctx = await unlock()
    s.stop()
    s.opening(0, 0)
    s.start()
    const first = ctx.sources.filter((x) => x.buffer?.id !== 'room-tone')
    expect(first.length).toBeGreaterThan(1)
    expect(first.every((x) => x.started! < LIVE.aheadSeconds)).toBe(true)
    run(s, ctx, 0, end)
    const heard = ctx.sources.filter((x) => x.buffer?.id !== 'room-tone').map((x) => ({ name: x.buffer!.id, frame: Math.round(x.started! * FPS) }))
    expect(heard).toEqual(laid.map((e) => ({ name: e.name, frame: e.frame })).sort((a, b) => a.frame - b.frame))
    expect(heard.length).toBe(cfg.intro.prompt.length + 3 + cfg.intro.steps.length)
  })

  it('plays every sound once and on its time when the page draws only two frames a second', async () => {
    const { s, unlock } = await ready()
    const ctx = await unlock()
    s.stop()
    s.opening(0, 0)
    s.start()
    for (let at = 0; at < end; at += 0.2) {
      ctx.currentTime = at + 0.2
      s.opening(at, at + 0.2)
    }
    const heard = ctx.sources.filter((x) => x.buffer?.id !== 'room-tone').map((x) => ({ name: x.buffer!.id, frame: Math.round(x.started! * FPS) }))
    expect(heard).toEqual(laid.map((e) => ({ name: e.name, frame: e.frame })).sort((a, b) => a.frame - b.frame))
  })

  it('takes back the sounds set ahead when the film is paused', async () => {
    const { s, unlock } = await ready()
    const ctx = await unlock()
    s.stop()
    s.opening(0, 0)
    s.start()
    const set = ctx.sources.filter((x) => x.buffer?.id !== 'room-tone')
    expect(set.length).toBeGreaterThan(1)
    s.stop()
    expect(set.every((x) => x.stopped !== null)).toBe(true)
    s.opening(0, 0)
    s.start()
    expect(ctx.sources.filter((x) => x.buffer?.id !== 'room-tone').length).toBe(set.length * 2)
  })

  it('keeps the room tone out until the opening is over, as the mix does', async () => {
    const { s, unlock } = await ready()
    s.opening(0, 1 / FPS)
    const ctx = await unlock()
    expect(playsOf(ctx, 'room-tone').length).toBe(0)
    s.start()
    run(s, ctx, 1 / FPS, end - 1 / FPS)
    expect(playsOf(ctx, 'room-tone').length).toBe(0)
    s.opening(end - 1 / FPS, end)
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
    expect(playsOf(ctx, 'room-tone')[0]!.stopped).toBeNull()
  })

  it('cuts a running tone when the film is sent back into the opening, and stays out of it through a pause', async () => {
    const { s, unlock } = await ready()
    const ctx = await unlock()
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
    s.stop()
    s.opening(2, 2)
    s.start()
    expect(playsOf(ctx, 'room-tone').length).toBe(1)
    s.stop()
    s.opening(end + 1, end + 1)
    s.start()
    expect(playsOf(ctx, 'room-tone').length).toBe(2)
    s.opening(1, 1 + 1 / FPS)
    expect(playsOf(ctx, 'room-tone')[1]!.stopped).not.toBeNull()
    s.stop()
    s.start()
    expect(playsOf(ctx, 'room-tone').length).toBe(3)
  })

  it('does nothing before the first click', async () => {
    const { s } = await ready()
    s.opening(0, 1)
    expect(made.length).toBe(0)
    expect(fetched.length).toBe(0)
  })
})

describe('the audio code', () => {
  it('is imported by no module outside src/audio, so capture mode never loads it', () => {
    const bad: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name)
        if (f.isDirectory()) {
          if (path.relative(process.cwd(), p) !== path.join('src', 'audio')) walk(p)
        } else if (/\.(ts|js)$/.test(f.name)) {
          const text = readFileSync(p, 'utf8')
          for (const m of text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]*\/audio(?:\/[\w-]+)?)['"]/g)) {
            const target = m[1]!
            const dynamic = /import\s*\(\s*['"]/.test(m[0])
            if (target.endsWith('/audio/cues')) continue
            if (dynamic && path.relative(process.cwd(), p) === path.join('src', 'main.ts')) continue
            bad.push(`${path.relative(process.cwd(), p)} imports ${target}`)
          }
        }
      }
    }
    walk(path.join(process.cwd(), 'src'))
    expect(bad).toEqual([])
  })

  it('uses no random number and no clock of its own', () => {
    for (const f of readdirSync(path.join(process.cwd(), 'src', 'audio')).filter((x) => x.endsWith('.ts'))) {
      const text = readFileSync(path.join(process.cwd(), 'src', 'audio', f), 'utf8')
      expect(/Math\.random|Date\.now|performance\.now/.test(text), f).toBe(false)
    }
  })
})

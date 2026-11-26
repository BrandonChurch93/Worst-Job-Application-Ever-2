import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { filmKeysForGag, filmLive, filmLineId, liveLineId, liveTriggers, unitPage } from '../src/audio/cues'
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
  const ids = Object.keys(filmLive).map(idOf)
  for (const [name, list] of Object.entries(narration.liveOnly as Record<string, unknown>)) if (Array.isArray(list)) list.forEach((_, i) => ids.push(liveLineId(name, i)))
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

describe('the rules of the narrator on the live site, each at the level of the engine', () => {
  it('speaks the film lines of a beat when the gag of that beat starts, and not before', async () => {
    const { s, ctx } = await ready()
    const gags = [...new Set(Object.keys(filmLive).filter((k) => filmLive[k]!.on === 'gag').map(beatOf))]
    expect(gags.length).toBeGreaterThan(0)
    let now = 10
    for (const gag of gags) {
      const ids = filmKeysForGag(gag).map(idOf)
      ctx.currentTime = now
      s.event(ev('step', pageOf(`${gag}.0`)), 'live')
      for (const id of ids) expect(starts(ctx, id)).toEqual([])
      now += far
      ctx.currentTime = now
      s.beat(gag, 'live')
      expect(starts(ctx, ids[0]!)).toEqual([now])
      expect(s.log().filter((e) => e.line === ids[0])).toEqual([{ at: now, line: ids[0], trigger: `gag ${gag}`, what: 'spoken', start: now, seconds: LINE }])
      now += far
    }
  })

  it('speaks a line only the live site has when its trigger happens: each key of liveOnly by its own event, hit or call', async () => {
    const names = Object.keys(narration.liveOnly).filter((k) => Array.isArray(narration.liveOnly[k]))
    expect(names.sort()).toEqual(Object.keys(liveTriggers).sort())
    for (const name of names) {
      if (name === 'watchFilm') continue
      const { s, ctx } = await ready()
      made = []
      ctx.currentTime = 50
      const t = liveTriggers[name]!
      const id = liveLineId(name, 0)
      expect(starts(ctx, id)).toEqual([])
      if (t.on === 'call') s.trigger(name)
      else if (t.on === 'hit') s.event(ev('no-cue-of-its-own', 'step1', true), 'live')
      else s.event(ev(t.event, 'no-page-of-the-film'), 'live')
      expect(starts(ctx, id), name).toEqual([50])
      expect(lines(ctx).length, name).toBe(1)
    }
  })

  it('says the idle line once the visitor has neither moved nor clicked for live.idleSeconds, once, and again only after the next movement', async () => {
    const { s, ctx } = await ready()
    const idle = (i: number) => starts(ctx, liveLineId('idle', i))
    ctx.currentTime = 20
    s.quiet(cfg.live.idleSeconds - 0.01)
    expect(lines(ctx)).toEqual([])
    ctx.currentTime = 20.02
    s.quiet(cfg.live.idleSeconds + 0.01)
    expect(idle(0)).toEqual([20.02])
    ctx.currentTime = 20.02 + far
    s.quiet(cfg.live.idleSeconds + 0.01 + far)
    ctx.currentTime += far
    s.quiet(cfg.live.idleSeconds + 0.01 + 2 * far)
    expect(lines(ctx).length).toBe(1)
    s.quiet(0)
    ctx.currentTime += cfg.live.idleSeconds
    s.quiet(cfg.live.idleSeconds)
    expect(idle(1)).toEqual([ctx.currentTime])
    expect(lines(ctx).length).toBe(2)
  })

  it('says the slow typing line at the event the page sends after live.slowTypingSeconds between two letters, and the page sends it by that number', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 30
    s.event(ev('slow-typing', 'step1'), 'live')
    expect(starts(ctx, liveLineId('slowTyping', 0))).toEqual([30])
    const page = readFileSync(path.join(process.cwd(), 'src', 'pages', 'step1', 'index.ts'), 'utf8')
    expect(page).toContain("s.slow >= live.slowTypingSeconds")
    expect(page.split("io.emit('slow-typing'").length - 1).toBe(1)
  })

  it('says the line of the slow fight at the event the page sends, in live mode only, and keeps no clock of the fight itself', async () => {
    const { s, ctx } = await ready()
    const id = liveLineId('boss.slow', 0)
    ctx.currentTime = 40
    s.event(ev('unfold', 'step4'), 'live')
    ctx.currentTime = 40 + cfg.live.bossSlowSeconds * 3
    s.event(ev('step', 'step4'), 'live')
    expect(starts(ctx, id)).toEqual([])
    s.event(ev('boss-slow', 'step4'), 'film')
    expect(starts(ctx, id)).toEqual([])
    s.event(ev('boss-slow', 'step4'), 'live')
    expect(starts(ctx, id)).toEqual([ctx.currentTime])
    const fight = readFileSync(path.join(process.cwd(), 'src', 'boss', 'fight.ts'), 'utf8')
    expect(fight.split("io.emit('boss-slow'").length - 1).toBe(1)
    expect(fight).toContain("f.clock >= SLOW_SECONDS")
    expect(fight).toContain("io.mode === 'live' && f.health > HEALTH / 2")
  })

  it('never lets a line interrupt another: the one being spoken runs to its end and the next starts after it', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 10.5
    s.event(ev('slab-drop', 'step1'), 'live')
    s.trigger('idle')
    s.event(ev('bolt-hit-cursor', 'step1', true), 'live')
    const first = lines(ctx).find((x) => x.buffer!.id === idOf('step1.firstName.0'))!
    expect(first.started).toBe(10)
    expect(first.stopped).toBeNull()
    for (const x of lines(ctx)) if (x !== first) expect(x.started!).toBeGreaterThanOrEqual(10 + LINE)
  })

  it('keeps two lines at least audio.liveNarratorMinGapSeconds apart, from the end of one to the start of the next', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 11
    s.event(ev('slab-drop', 'step1'), 'live')
    expect(starts(ctx, idOf('step1.email.0'))[0]!).toBeCloseTo(10 + LINE + gap, 9)
    ctx.currentTime = 10 + LINE + gap - 0.5
    s.trigger('idle')
    const booked = lines(ctx).filter((x) => x.stopped === null).map((x) => x.started!).sort((a, b) => a - b)
    for (let i = 1; i < booked.length; i++) expect(booked[i]! - (booked[i - 1]! + LINE)).toBeGreaterThanOrEqual(gap - 1e-9)
  })

  it('drops a line that would be late, and writes in its log why', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('keyboard-rise', 'step1'), 'live')
    ctx.currentTime = 10.1
    s.event(ev('bolt-hit', 'step1', true), 'live')
    const hit = liveLineId('hit', 0)
    expect(starts(ctx, hit)).toEqual([])
    const row = s.log().find((e) => e.line === hit)!
    expect(row.what).toBe('dropped')
    expect(row.trigger).toBe('hit by bolt-hit')
    expect(row.why).toContain(`may wait ${LIVE.waitSeconds['hit']!.toFixed(2)} s`)
    ctx.currentTime = 10 + LINE + gap - LIVE.waitSeconds['hit']! + 0.01
    s.event(ev('bolt-hit', 'step1', true), 'live')
    expect(starts(ctx, hit).length).toBe(1)
  })
})

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

  it('mutes everything at once, a line being spoken and a loop included, and gives all of it back', async () => {
    const { s, ctx } = await ready()
    const out = ctx.gains[0]!
    ctx.currentTime = 10
    s.event(ev('unfold', 'step4'), 'live')
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 10.5
    const before = sounding(ctx, 10.5, lengthOf)
    expect(before).toEqual(expect.arrayContaining(['room-tone', 'boss-loop', idOf('boss.verify.0')]))
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
    expect(El.all.length).toBe(index.sfx.length + index.loops.length + index.lines.length)
    expect(errors).not.toHaveBeenCalled()
  })

  it('is what the engine runs on when the browser has no audio graph at all, and it plays, mutes and stops there', async () => {
    const { s } = await forced(undefined)
    expect(s.backend()).toBe('elements')
    const playing = () => El.all.filter((e) => !e.paused).length
    s.event(ev('button-press', 'marketing'), 'live')
    s.trigger('idle')
    expect(playing()).toBe(3)
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
    s.event(ev('unfold', 'step4'), 'live')
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

  it('at a skip in the middle of a line lets that line end by itself, stops the loops, takes back the lines that wait and doubles nothing', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('unfold', 'step4'), 'live')
    s.event(ev('checkbox', 'step4'), 'live')
    ctx.currentTime = 10.4
    s.event(ev('slab-fire', 'step4'), 'live')
    expect(starts(ctx, idOf('boss.slabs.0'))).toEqual([10 + LINE + gap])
    ctx.currentTime = 11
    s.event(ev('skip', 'step4'), 'live')
    const spoken = lines(ctx).filter((x) => x.buffer!.id === idOf('boss.verify.0'))
    expect(spoken.length).toBe(1)
    expect(spoken[0]!.stopped).toBeNull()
    expect(starts(ctx, idOf('boss.slabs.0'))).toEqual([])
    expect(sounding(ctx, 11.5, lengthOf).sort()).toEqual([idOf('boss.verify.0'), 'room-tone'].sort())
    expect(sounding(ctx, 10 + LINE + 0.01, lengthOf).filter((id) => id !== liveLineId('skip', 0))).toEqual(['room-tone'])
    ctx.currentTime = 30
    s.event(ev('checkbox', 'step4'), 'live')
    s.event(ev('slab-fire', 'step4'), 'live')
    expect(lines(ctx).filter((x) => x.buffer!.id === idOf('boss.verify.0')).length).toBe(1)
    expect(starts(ctx, idOf('boss.slabs.0'))).toEqual([])
  })

  it('holds everything while the tab is in the background and carries on with the same sounds, none started twice', async () => {
    const doc = { visibilityState: 'visible', listeners: [] as (() => void)[], addEventListener(_: string, fn: () => void) { this.listeners.push(fn) } }
    vi.stubGlobal('document', doc)
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.event(ev('unfold', 'step4'), 'live')
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
    expect(sounding(ctx, 10.5, lengthOf).sort()).toEqual(['boss-loop', idOf('boss.verify.0'), 'room-tone'].sort())
  })
})

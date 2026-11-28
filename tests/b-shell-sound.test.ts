import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { cueOfEvent, eventCues, filmLineId, newEventCues, newSilent, pageAfter, prefixCues, quietPage, quietPageCues, unitPage } from '../src/audio/cues'
import { standIns } from '../src/audio/standin'
import { dehum } from '../src/audio/dsp'
import { LIVE, TONE } from '../src/audio/levels'
import { mixFilm, quietSpans, type FilmEvent } from '../src/audio/mix'
import { liveFlow } from '../src/stage/stage'
import { CAPTION, captionAt, easeCaption, makeCaption, sayable } from '../src/ui/said'

const root = process.cwd()
const read = (...p: string[]) => JSON.parse(readFileSync(path.join(root, ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const unitOf = (beat: string): string | undefined => cfg.film.beats.find((b: any) => b.id === beat)?.unit
const beatOf = (key: string) => key.slice(0, key.lastIndexOf('.'))
const idOf = (key: string) => filmLineId(beatOf(key), Number(key.slice(key.lastIndexOf('.') + 1)))
const pageOf = (key: string) => unitPage[unitOf(beatOf(key))!]!

class Param {
  value = 1
  calls: [string, number, number][] = []
  setValueAtTime(v: number, t: number) { this.calls.push(['set', v, t]); this.value = v }
  linearRampToValueAtTime(v: number, t: number) { this.calls.push(['ramp', v, t]); this.value = v }
  cancelScheduledValues() { return undefined }
  setTargetAtTime(v: number, t: number) { this.calls.push(['target', v, t]); this.value = v }
}
class Node {
  to: Node | null = null
  connect(n: Node) { this.to = n }
  disconnect() { this.to = null }
}
class Gain extends Node { gain = new Param() }
class Panner extends Node { pan = new Param() }
class Source extends Node {
  buffer: { id: string } | null = null
  loop = false
  playbackRate = new Param()
  detune = new Param()
  started: number | null = null
  stopped: number | null = null
  onended: (() => void) | null = null
  start(t: number) { this.started = t }
  stop(t: number) { this.stopped = t }
}
let made: FakeContext[] = []
const TONE_SAMPLES = 48000
class FakeContext {
  currentTime = 0
  state = 'suspended'
  sampleRate = 48000
  destination = new Node()
  sources: Source[] = []
  decoded = new Map<string, Float32Array[]>()
  constructor() { made.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { return Promise.resolve() }
  createGain() { return new Gain() }
  createStereoPanner() { return new Panner() }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    const id = new TextDecoder().decode(new Uint8Array(bytes))
    const channels = [0, 1].slice(0, id === 'room-tone' ? 2 : 1).map(() => Float32Array.from({ length: TONE_SAMPLES }, (_, i) => 0.1 * Math.sin((2 * Math.PI * 100 * i) / 48000)))
    this.decoded.set(id, channels)
    ok({ id, numberOfChannels: channels.length, sampleRate: 48000, getChannelData: (c: number) => channels[c]! })
    return Promise.resolve()
  }
}

const LINE = 2
const CUES = ['step.1', 'card-flip', 'button-press', 'page-turn', 'key-press.1', 'checkbox']
function site(): { index: SoundIndex; files: Map<string, Uint8Array> } {
  const enc = new TextEncoder()
  const ids = [...standIns().values()].map((l) => l.id)
  const parts = CUES.map((c) => enc.encode(c))
  const pack = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  const sfx: SoundIndex['sfx'] = []
  let at = 0
  parts.forEach((p, i) => {
    pack.set(p, at)
    sfx.push({ id: CUES[i]!, at, bytes: p.length, seconds: 0.2, mime: 'audio/flac' })
    at += p.length
  })
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: pack.length }, sfx,
    loops: [{ id: 'room-tone', file: 'room-tone.flac', seconds: 8, mime: 'audio/flac' }, { id: 'shredder', file: 'shredder.flac', seconds: 8, mime: 'audio/flac' }],
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
const ready = async () => {
  const s0 = site()
  vi.stubGlobal('fetch', async (url: string) => {
    const bytes = s0.files.get(url.replace('./audio/', ''))
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  made = []
  const s = makeSound({ base: './audio/', index: s0.index })
  await s.unlock()
  return { s, ctx: made[0]! }
}
const ev = (name: string, page: string, hitsCursor = false) => ({ name, step: 0, page, x: 960, y: 540, hitsCursor })
const plays = (ctx: FakeContext, id: string) => ctx.sources.filter((x) => x.buffer?.id === id)
const cues = (ctx: FakeContext) => ctx.sources.filter((x) => x.buffer && !x.buffer.id.startsWith('line.') && x.buffer.id !== 'room-tone').map((x) => x.buffer!.id)
const toneOn = (ctx: FakeContext, t: number) => plays(ctx, 'room-tone').filter((x) => x.started !== null && x.started <= t && (x.stopped === null || x.stopped > t)).length

describe('item 10: no sound on the careers page except the press of the Apply button', () => {
  it('names the careers page and the one cue it keeps, and knows the page after each page from the flow of the site', () => {
    expect(quietPage).toBe('marketing')
    expect(quietPageCues).toEqual(['button-press'])
    const flow = liveFlow().map((f) => f.page)
    expect(flow[0]).toBe(quietPage)
    for (let i = 0; i + 1 < flow.length; i++) expect(pageAfter[flow[i]!], flow[i]).toBe(flow[i + 1])
  })

  it('plays nothing for a step, a card or a page turn on the careers page, plays the press, and runs no room tone there', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 5
    s.page('marketing')
    for (const name of ['step', 'card-flip', 'step', 'page-turn']) {
      ctx.currentTime += 0.3
      s.event(ev(name, 'marketing'), name === 'page-turn' ? 'film' : 'live')
    }
    expect(cues(ctx)).toEqual([])
    expect(plays(ctx, 'room-tone').length).toBe(0)
    s.event(ev('button-press', 'marketing'), 'live')
    expect(cues(ctx)).toEqual(['button-press'])
  })

  it('still plays every one of those cues on another page', async () => {
    const { s, ctx } = await ready()
    for (const name of ['step', 'card-flip', 'button-press', 'page-turn']) {
      ctx.currentTime += 0.3
      s.event(ev(name, 'step2'), 'live')
    }
    expect(cues(ctx)).toEqual(['step.1', 'card-flip', 'button-press', 'page-turn'])
  })

  it('brings the room tone in half a turn after the turn away from the careers page begins, with no sound of the turn', async () => {
    const { s, ctx } = await ready()
    s.page('marketing')
    ctx.currentTime = 9
    s.event(ev('button-press', 'marketing'), 'live')
    ctx.currentTime = 9.7
    s.event(ev('page-turn', 'marketing'), 'live')
    expect(cues(ctx)).toEqual(['button-press'])
    const tone = plays(ctx, 'room-tone')
    expect(tone.length).toBe(1)
    expect(tone[0]!.started).toBeCloseTo(9.7 + LIVE.quietTurnSeconds, 9)
    s.page('marketing')
    s.event(ev('step', 'marketing'), 'live')
    expect(toneOn(ctx, 11)).toBe(1)
    expect(cues(ctx)).toEqual(['button-press'])
    ctx.currentTime = 10.3
    s.page('step1')
    s.event(ev('key-press', 'step1'), 'live')
    expect(cues(ctx)).toEqual(['button-press', 'key-press.1'])
    expect(plays(ctx, 'room-tone').length).toBe(1)
  })

  it('takes the room tone out over the turn back to the careers page, plays no sound of that turn, and stops what still rings when the page is on screen', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 100
    s.page('step5')
    s.event(ev('shredder', 'step5'), 'live')
    expect(toneOn(ctx, 100.5)).toBe(1)
    ctx.currentTime = 131.58
    s.event(ev('page-turn', 'step5'), 'live')
    expect(cues(ctx).filter((id) => id.startsWith('page-turn'))).toEqual([])
    const tone = plays(ctx, 'room-tone')[0]!
    expect(tone.stopped).not.toBeNull()
    expect(tone.stopped!).toBeLessThanOrEqual(131.58 + LIVE.quietTurnSeconds + 1e-9)
    ctx.currentTime = 132.08
    s.page('marketing')
    for (const x of ctx.sources.filter((q) => q.loop)) expect(x.stopped, x.buffer!.id).not.toBeNull()
    expect(toneOn(ctx, 132.2)).toBe(0)
  })

  it('stays so after a first, a second and a third restart: nothing but the press sounds on the careers page', async () => {
    const { s, ctx } = await ready()
    let now = 0
    for (const round of [1, 2, 3]) {
      s.page('marketing')
      now += 3
      ctx.currentTime = now
      s.event(ev('step', 'marketing'), 'live')
      s.event(ev('card-flip', 'marketing'), 'live')
      expect(toneOn(ctx, now), `round ${round}, on the careers page`).toBe(0)
      const before = cues(ctx).length
      s.event(ev('button-press', 'marketing'), 'live')
      expect(cues(ctx).length).toBe(before + 1)
      now += 0.7
      ctx.currentTime = now
      s.event(ev('page-turn', 'marketing'), 'live')
      for (const page of ['step1', 'step2', 'step3', 'step4', 'step5']) {
        now += 5
        ctx.currentTime = now
        s.page(page)
        s.event(ev('key-press', page), 'live')
        expect(toneOn(ctx, now), `round ${round}, ${page}`).toBe(1)
        if (page !== 'step5') s.event(ev('page-turn', page), 'live')
      }
      now += 5
      ctx.currentTime = now
      s.event(ev('page-turn', 'step5'), 'live')
      now += LIVE.quietTurnSeconds
      ctx.currentTime = now
      s.page('marketing')
      const from = ctx.sources.length
      for (let i = 0; i < 40; i++) {
        now += 0.5
        ctx.currentTime = now
        s.page('marketing')
        s.event(ev('step', 'marketing'), 'live')
        s.quiet(i * 0.5)
        expect(toneOn(ctx, now), `round ${round}, ${i * 0.5} s after the restart`).toBe(0)
      }
      expect(ctx.sources.slice(from).filter((x) => !x.buffer!.id.startsWith('line.')).map((x) => x.buffer!.id), `round ${round}`).toEqual([])
    }
  })

  it('keeps the tone off through a jump back to the careers page by the step control: stop, the page, start', async () => {
    const { s, ctx } = await ready()
    ctx.currentTime = 10
    s.page('step3')
    expect(toneOn(ctx, 10.5)).toBe(1)
    ctx.currentTime = 20
    s.stop()
    s.page('marketing')
    s.start()
    expect(toneOn(ctx, 20.5)).toBe(0)
    ctx.currentTime = 30
    s.stop()
    s.page('step2')
    s.start()
    expect(toneOn(ctx, 30.5)).toBe(1)
  })

  it('lays no cue in the film while the careers page is on screen but the press, and no room tone there', () => {
    const sr = 8000
    const sound = (seconds: number, channels = 1) => ({ sampleRate: sr, channels: Array.from({ length: channels }, () => Float32Array.from({ length: Math.round(seconds * sr) }, (_, i) => 0.2 * Math.sin(i / 3))) })
    const sounds = new Map([['step.1', sound(0.1)], ['card-flip', sound(0.1)], ['button-press', sound(0.1)], ['page-turn', sound(0.3)], ['key-press.1', sound(0.1)], ['room-tone', sound(1, 2)]])
    const events: FilmEvent[] = [
      { name: 'step', frame: 10, x: 900, page: 'marketing' }, { name: 'card-flip', frame: 20, x: 900, page: 'marketing' }, { name: 'button-press', frame: 40, x: 900, page: 'marketing' },
      { name: 'page-turn', frame: 60, x: 960, page: 'marketing' }, { name: 'key-press', frame: 100, x: 900, page: 'step1' }, { name: 'page-turn', frame: 120, x: 960, page: 'step1' },
      { name: 'page-turn', frame: 130, x: 960, page: 'step2' }, { name: 'page-turn', frame: 140, x: 960, page: 'step3' }, { name: 'page-turn', frame: 150, x: 960, page: 'step4' },
      { name: 'button-press', frame: 170, x: 900, page: 'step5' }, { name: 'page-turn', frame: 180, x: 960, page: 'step5' }, { name: 'step', frame: 230, x: 900, page: 'marketing' }
    ]
    const half = Math.round(LIVE.quietTurnSeconds * 60)
    expect(quietSpans(events, 0, 300, 60)).toEqual([{ from: 0, to: 60 }, { from: 180 + half, to: 300 }])
    expect(quietSpans(events.map(({ page: _page, ...e }) => e), 0, 300, 60)).toEqual([])
    const r = mixFilm({ sampleRate: sr, fps: 60, seconds: 5, events, lines: [], sounds, sfx: cfg.audio.sfx, duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb })
    expect(r.hushed).toEqual(['step@10', 'card-flip@20', 'page-turn@60', 'page-turn@180', 'step@230'])
    expect(r.placed.filter((p) => p.kind === 'cue').map((p) => `${p.event}@${p.frame}`)).toEqual(['button-press@40', 'key-press@100', 'page-turn@120', 'page-turn@130', 'page-turn@140', 'page-turn@150', 'button-press@170'])
    const tone = r.placed.filter((p) => p.kind === 'tone')
    expect(tone.length).toBe(1)
    expect(tone[0]!.frame).toBe(60 + half)
    expect(tone[0]!.seconds).toBeCloseTo((180 + half - (60 + half)) / 60, 6)
    const loud = (from: number, to: number) => {
      let peak = 0
      for (const c of r.sound.channels) for (let i = Math.round((from / 60) * sr); i < Math.round((to / 60) * sr); i++) peak = Math.max(peak, Math.abs(c[i]!))
      return peak
    }
    expect(loud(0, 40)).toBe(0)
    expect(loud(40, 46)).toBeGreaterThan(0)
    expect(loud(47, 60 + half)).toBe(0)
    expect(loud(180 + half, 300)).toBe(0)
    expect(loud(100, 110)).toBeGreaterThan(0)
  })
})

describe('item 9: the hum after a restart', () => {
  const sr = 48000
  const seconds = 2
  const n = sr * seconds
  // A room with a buzz in it: noise from a fixed seed, and a tone at every 50 Hz up to 1 kHz. The length is a whole number of 20 ms cycles, as the file's is.
  const fixture = () => {
    let seed = 20261127
    const noise = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648 - 0.5
    }
    return Float32Array.from({ length: n }, (_, i) => {
      let v = 0.02 * noise()
      for (let h = 1; h <= 20; h++) v += 0.004 * Math.sin((2 * Math.PI * 50 * h * i) / sr + h)
      return v
    })
  }
  const level = (x: Float32Array, hz: number) => {
    let re = 0
    let im = 0
    for (let i = 0; i < x.length; i++) {
      re += x[i]! * Math.cos((2 * Math.PI * hz * i) / sr)
      im += x[i]! * Math.sin((2 * Math.PI * hz * i) / sr)
    }
    return 20 * Math.log10((2 * Math.hypot(re, im)) / x.length + 1e-12)
  }
  const rms = (x: Float32Array) => 10 * Math.log10(x.reduce((a, v) => a + v * v, 0) / x.length + 1e-20)

  it('has one switch, on, and names what it takes out', () => {
    expect(TONE.dehum).toBe(true)
    expect(TONE.humHz).toBe(50)
    expect(TONE.notches.map((x) => x.hz)).toEqual([100, 200])
  })

  it('takes the tone at every multiple of 50 Hz down by 20 dB or more and leaves the room between them within 2 dB', () => {
    const x = fixture()
    const y = dehum(x, sr, TONE)
    expect(y.length).toBe(x.length)
    for (const hz of [50, 100, 150, 200, 400, 1000]) expect(level(y, hz) - level(x, hz), `${hz} Hz`).toBeLessThanOrEqual(-20)
    const quiet = Float32Array.from(x, (_, i) => x[i]! - [...Array(20)].reduce((a: number, _b, h) => a + 0.004 * Math.sin((2 * Math.PI * 50 * (h + 1) * i) / sr + h + 1), 0))
    expect(Math.abs(rms(dehum(quiet, sr, TONE)) - rms(quiet))).toBeLessThanOrEqual(2)
    for (const v of y) expect(Number.isFinite(v)).toBe(true)
  })

  it('leaves no step where the loop joins: the last sample runs into the first as any two neighbours do', () => {
    const y = dehum(fixture(), sr, TONE)
    let most = 0
    for (let i = 1; i < y.length; i++) most = Math.max(most, Math.abs(y[i]! - y[i - 1]!))
    expect(Math.abs(y[0]! - y[y.length - 1]!)).toBeLessThanOrEqual(most)
  })

  it('is what the engine does to the room tone as it loads it, and to no other sound', async () => {
    const { ctx } = await ready()
    const raw = Float32Array.from({ length: TONE_SAMPLES }, (_, i) => 0.1 * Math.sin((2 * Math.PI * 100 * i) / 48000))
    const energy = (x: Float32Array) => x.reduce((a, v) => a + v * v, 0)
    for (const c of ctx.decoded.get('room-tone')!) expect(energy(c)).toBeLessThan(energy(raw) / 10)
    expect([...ctx.decoded.keys()].filter((id) => id.startsWith('line.'))).toEqual([])
    expect(energy(ctx.decoded.get('step.1')![0]!)).toBeCloseTo(energy(raw), 6)
  })
})

describe('item 1: the voiceover on events', () => {

  it('has a cue or a silence for every event the units of change 002 named, and matches the strikes of the table by their prefix', () => {
    const boss = ['shield-glance', 'shot-round', 'boss-move', 'cannon-tell', 'cannon-fire', 'flatten', 'peel-up', 'boss-heal', 'bullet-fire', 'turret-rise', 'turret-lock', 'big-tell', 'big-fire', 'arena-break', 'turret-off']
    const step1 = ['turret-load', 'slab-shadow', 'keys-break', 'page-crack', 'field-done']
    const step2 = ['date-key', 'reel-stop', 'date-hit', 'date-miss', 'volume-sign', 'crank-full', 'field-done', 'field-next']
    const pinball = ['vacuum-on', 'vacuum-slip', 'vacuum-lose', 'frenzy-on', 'frenzy-off', 'loot']
    for (const name of [...boss, ...step1, ...step2, ...pinball]) expect(cueOfEvent(name) !== undefined || newSilent.includes(name), name).toBe(true)
    for (const name of newSilent) expect(cueOfEvent(name), name).toBeUndefined()
    for (const [name, cue] of Object.entries(newEventCues)) {
      expect(eventCues[name], `${name} is not an old name`).toBeUndefined()
      expect(cfg.audio.sfx.some((x: any) => x.id === cue), `${name}: ${cue}`).toBe(true)
    }
    expect(prefixCues.map((p) => p.prefix)).toEqual(['strike:'])
    for (const n of [1, 2, 3]) expect(cueOfEvent(`strike:office.bumper.3:${n}`)).toBeUndefined()
    expect(cueOfEvent('bumper')).toBe('bumper')
    expect(cueOfEvent('dart-hit')).toBe('dart-hit')
  })
})

describe('the words of the narrator on screen while they are spoken', () => {
  it('shows a line as it is read: the pause mark is not shown', () => {
    expect(sayable('A valid email. / Rejected. / The system / is working as designed.', '/')).toBe('A valid email. Rejected. The system is working as designed.')
    for (const list of Object.values(narration.film as Record<string, { text: string }[]>)) for (const l of list) expect(sayable(l.text, narration.pauseMark).includes(narration.pauseMark)).toBe(false)
  })

  it('is shown from the start of the voice to its end and at no other time', () => {
    const line = { id: 'a', words: 'w', start: 5, end: 8 }
    expect(captionAt({ now: 4.999, lines: [line] })).toBeNull()
    expect(captionAt({ now: 5, lines: [line] })).toBe(line)
    expect(captionAt({ now: 7.999, lines: [line] })).toBe(line)
    expect(captionAt({ now: 8, lines: [line] })).toBeNull()
  })

  it('moves to where a page wants it without a jump while words are shown, and is there at once when none are', () => {
    expect(easeCaption(1044, 700, 0.016, false)).toBe(700)
    let y = 1044
    let most = 0
    for (let i = 0; i < 120; i++) {
      const to = easeCaption(y, 700, 1 / 60, true)
      most = Math.max(most, Math.abs(to - y))
      y = to
    }
    expect(most).toBeLessThanOrEqual((1044 - 700) * (1 / 60 / CAPTION.easeSeconds) + 1e-9)
    expect(Math.abs(y - 700)).toBeLessThan(1)
    expect(easeCaption(900, 900, 5, true)).toBe(900)
  })

  it('puts the words on one panel on the page at the frame the voice starts and takes them off at the frame it ends, and writes down when', () => {
    const frames: (() => void)[] = []
    const el: any = { style: {}, dataset: {}, textContent: '' }
    vi.stubGlobal('document', { body: { append: () => undefined }, createElement: () => el, querySelector: () => null })
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080, requestAnimationFrame: (fn: () => void) => { frames.push(fn); return frames.length } })
    const src = { now: 0, lines: [{ id: 'line.x', words: 'Two pages.', start: 1, end: 3 }] }
    const c = makeCaption(() => src)!
    const frame = (now: number) => {
      src.now = now
      frames.shift()!()
    }
    c.wake()
    c.wake()
    expect(frames.length).toBe(1)
    frame(0.5)
    expect(el.style.display).toBe('none')
    frame(1.004)
    expect(el.style.display).toBe('block')
    expect(el.textContent).toBe('Two pages.')
    expect(el.style.pointerEvents).toBe('none')
    expect(el.style.bottom).toBe(`${1080 - CAPTION.low}px`)
    expect(el.style.maxWidth).toBe(`${CAPTION.wide}px`)
    c.place(700)
    frame(2)
    expect(parseFloat(el.style.bottom)).toBeGreaterThan(1080 - CAPTION.low)
    expect(parseFloat(el.style.bottom)).toBeLessThan(1080 - 700 + 1)
    frame(3.002)
    expect(el.style.display).toBe('none')
    expect(c.log()).toEqual([{ id: 'line.x', start: 1, end: 3, shown: 1.004, hidden: 3.002 }])
    src.lines = []
    frame(3.1)
    expect(frames.length).toBe(0)
  })

  it('keeps to the box the pages are told to keep clear: two rows of its words fit in its height', () => {
    expect(CAPTION.wide).toBe(900)
    expect(CAPTION.high).toBe(96)
    expect(2 * CAPTION.fontPx * CAPTION.lineHigh + 2 * CAPTION.padY).toBeLessThanOrEqual(CAPTION.high)
  })
})

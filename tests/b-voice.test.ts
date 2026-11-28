// @vitest-environment node
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { spoken, waitsFor } from '../src/audio/cues'
import * as dsp from '../src/audio/dsp'
import * as levels from '../src/audio/levels'
import { DUCK, LIVE, db } from '../src/audio/levels'
import { phrasesOf, standIns, type KeptLine } from '../src/audio/standin'
import { mixFilm, scriptStandIns } from '../src/audio/mix'
import { pack, phraseStarts, places } from '../tools/sound.mjs'
import { keptTakes } from '../tools/mix.mjs'

const read = (...p: string[]) => JSON.parse(readFileSync(path.join(process.cwd(), ...p), 'utf8'))
const cfg: any = read('config', 'showcase.json')
const narration: any = read('content', 'narration.json')
const gap: number = cfg.audio.liveNarratorMinGapSeconds
const wps: number = cfg.audio.narratorMaxWordsPerSecond
const mark: string = narration.pauseMark
const low = db(-cfg.audio.duckDb)

let ramps: { v: number; t: number }[] = []
class Param {
  value = 1
  setValueAtTime(v: number) { this.value = v }
  linearRampToValueAtTime(v: number, t: number) { this.value = v; ramps.push({ v, t }) }
  cancelScheduledValues() { return }
}
class Node { connect() { return } }
class Gain extends Node { gain = new Param() }
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
  sources: Source[] = []
  constructor() { made.push(this) }
  resume() { this.state = 'running'; return Promise.resolve() }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  close() { return Promise.resolve() }
  createGain() { return new Gain() }
  createStereoPanner() { return Object.assign(new Node(), { pan: new Param() }) }
  createBufferSource() { const s = new Source(); this.sources.push(s); return s }
  decodeAudioData(bytes: ArrayBuffer, ok: (b: unknown) => void) {
    ok({ id: new TextDecoder().decode(new Uint8Array(bytes)), numberOfChannels: 1 })
    return Promise.resolve()
  }
}

// The words stand for the script; the engine is given them in place of the files. Each line has eight words in three phrases.
const eight = (a: string) => `${a} one two ${mark} three four five ${mark} six seven`
const film = Object.fromEntries(['marketing.stroll', 'step1.firstName', 'step1.shredded', 'pinball.seal', 'boss.verify', 'decision.letter'].map((b) => [b, [{ at: 0, text: eight(b) }]]))
film['step2.crank'] = [{ at: 0, text: eight('crank') }, { at: 0.5, text: eight('top') }]
film['boss.unfold'] = [{ at: 0, text: eight('beaten') }, { at: 0.5, text: eight('loans') }, { at: 0.8, text: eight('ready') }]
const drafts = { 'decision.reset': [{ at: 0, text: eight('next') }], 'boss.finish': [{ at: 0, text: `ka ${mark} me ${mark} ha`, loud: true, standIn: { seconds: 6, starts: [0.5, 1.5, 3] } }] }
const L = 8 / wps
const id = (key: string) => `line.${key}`
const textOf = (key: string): string => {
  const beat = key.slice(0, key.lastIndexOf('.'))
  const k = Number(key.slice(key.lastIndexOf('.') + 1))
  return ((film as any)[beat] ?? (drafts as any)[beat])[k].text
}

// The takes of the index, by key: seconds and the starts of the three phrases. Line 1 is given in two lengths, as recorded (A) and with its pauses shortened (B).
const A = { seconds: 19.76, starts: [0.1, 6.2, 13.4] }
const B = { seconds: 14.21, starts: [0.1, 4.6, 9.9] }
type Take = { seconds: number; starts?: number[]; words?: string }
const TAKES: Record<string, Take> = {
  'marketing.stroll.0': A, 'step1.firstName.0': { seconds: 9.54, starts: [0.1, 3, 6] }, 'step1.shredded.0': { seconds: 13.7 },
  'step2.crank.0': { seconds: 6.58, starts: [0.1, 2, 4] }, 'step2.crank.1': { seconds: 1.89, starts: [0.1, 0.7, 1.3] },
  'pinball.seal.0': { seconds: 9.2, starts: [0.1, 3, 6], words: 'the words of an older round' },
  'boss.unfold.0': { seconds: 23.6, starts: [0.1, 8, 16] }, 'boss.unfold.1': { seconds: 5.9, starts: [0.1, 2, 4] }, 'boss.unfold.2': { seconds: 4.25, starts: [0.1, 1.5, 3] },
  'boss.finish.0': { seconds: 5, starts: [0.1, 1, 2] }
}
const CUES = ['button-press', 'checkbox', 'step.1']
function site(takes: Record<string, Take>): { index: SoundIndex; files: Map<string, Uint8Array> } {
  const enc = new TextEncoder()
  const parts = CUES.map((c) => enc.encode(c))
  const bin = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  const sfx: SoundIndex['sfx'] = []
  let at = 0
  parts.forEach((p, i) => {
    bin.set(p, at)
    sfx.push({ id: CUES[i]!, at, bytes: p.length, seconds: 0.2, mime: 'audio/flac' })
    at += p.length
  })
  const index: SoundIndex = {
    version: 1, pack: { file: 'sfx.bin', bytes: bin.length }, sfx,
    loops: ['room-tone', 'boss-loop'].map((x) => ({ id: x, file: `${x}.flac`, seconds: 8, mime: 'audio/flac' })),
    lines: [
      ...Object.entries(takes).map(([key, t]) => ({ id: id(key), file: `${id(key)}.mp3`, seconds: t.seconds, mime: 'audio/mpeg', words: t.words ?? textOf(key), ...(t.starts ? { starts: t.starts } : {}) })),
      { id: id('boss.verify.0'), file: `${id('boss.verify.0')}.mp3`, seconds: 5.22, mime: 'audio/mpeg' }
    ]
  }
  const files = new Map<string, Uint8Array>([['sfx.bin', bin]])
  for (const f of [...index.loops, ...index.lines]) files.set(f.file, enc.encode(f.id))
  return { index, files }
}

let fetched: string[] = []
beforeEach(() => {
  made = []
  fetched = []
  ramps = []
  vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
})
afterEach(() => vi.unstubAllGlobals())

const make = (takes: Record<string, Take> = TAKES, missing: string[] = []) => {
  const s0 = site(takes)
  vi.stubGlobal('fetch', async (url: string) => {
    const name = url.replace('./audio/', '')
    fetched.push(name)
    const bytes = missing.includes(name) ? undefined : s0.files.get(name)
    if (!bytes) return { ok: false, status: 404 }
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  return makeSound({ base: './audio/', index: s0.index, script: { film, drafts } })
}
const ready = async (page: string | null = null, takes: Record<string, Take> = TAKES, missing: string[] = []) => {
  const s = make(takes, missing)
  if (page !== null) s.page(page)
  await s.unlock()
  return { s, ctx: made[made.length - 1]! }
}
const ev = (name: string, page: string) => ({ name, step: 0, page, x: 960, y: 540, hitsCursor: false })
type Api = ReturnType<typeof make>
const near = (v: number | null) => (v === null ? null : Number(v.toFixed(3)))
const W = LIVE.openingWaitSeconds
const booked = (s: Api) => s.log().filter((e) => e.what === 'spoken').map((e) => [e.line, near(e.start ?? null)])
const of = (ctx: FakeContext, key: string) => ctx.sources.filter((x) => x.buffer?.id === id(key))
const times = (ctx: FakeContext, key: string) => of(ctx, key).map((x) => [near(x.started), near(x.stopped)])
const lineSources = (ctx: FakeContext) => [...new Set(ctx.sources.map((x) => x.buffer?.id ?? '').filter((x) => x.startsWith('line.')))]
const index = (takes: Record<string, Take>): KeptLine[] => site(takes).index.lines

describe('the narrator\'s voice: the script read with the sound index', () => {
  it('gives a line with a take of its own words the seconds of the file and its phrases at the starts of the index, in either length of line 1', () => {
    for (const take of [A, B]) {
      const line = standIns(film, drafts, wps, mark, index({ 'marketing.stroll.0': take })).get('marketing.stroll.0')!
      expect(line.kept).toBe(true)
      expect(line.seconds).toBe(take.seconds)
      expect(line.phrases.map((p) => [p.words, p.from, p.to])).toEqual([['marketing.stroll one two', take.starts[0], take.starts[1]], ['three four five', take.starts[1], take.starts[2]], ['six seven', take.starts[2], take.seconds]])
    }
  })

  it('leaves a line with no take, or with a take of other words, the silent stand-in it was: the stale guard', () => {
    const all = standIns(film, drafts, wps, mark, index(TAKES))
    for (const key of ['pinball.seal.0', 'boss.verify.0', 'decision.letter.0', 'decision.reset.0']) {
      const line = all.get(key)!
      expect(line.kept, key).toBe(false)
      expect(line.seconds, key).toBeCloseTo(L, 9)
      expect(line.phrases, key).toEqual(phrasesOf(textOf(key), mark, wps))
    }
    expect([...standIns(film, drafts, wps, mark, []).values()].some((l) => l.kept)).toBe(false)
  })

  it('spreads the caption of a take that has no starts over its file by its words, and keeps the line that builds on marks a stand-in', () => {
    const all = standIns(film, drafts, wps, mark, index(TAKES))
    const line = all.get('step1.shredded.0')!
    expect(line.kept).toBe(true)
    expect(line.seconds).toBe(13.7)
    expect(line.phrases.map((p) => [near(p.from), near(p.to)])).toEqual([[0, near((13.7 * 3) / 8)], [near((13.7 * 3) / 8), near((13.7 * 6) / 8)], [near((13.7 * 6) / 8), 13.7]])
    const shout = all.get('boss.finish.0')!
    expect(spoken['boss.finish.0']!.steps).toBeDefined()
    expect(shout.kept).toBe(false)
    expect(shout.seconds).toBe(6)
  })
})

describe('the narrator\'s voice: the engine', () => {
  it('fetches, when sound is allowed, the file of each line that has a take of its words and of no other line', async () => {
    await ready('marketing')
    const want = Object.keys(TAKES).filter((k) => k !== 'pinball.seal.0' && k !== 'boss.finish.0').map((k) => `${id(k)}.mp3`).sort()
    expect(fetched.filter((f) => f.endsWith('.mp3')).sort()).toEqual(want)
    expect(fetched).not.toContain(`${id('pinball.seal.0')}.mp3`)
    expect(fetched).not.toContain(`${id('boss.verify.0')}.mp3`)
  })

  it('plays line 1 from its file when sound is allowed on the careers page, shows its phrases at the starts of the index, and holds the effects down under it', async () => {
    for (const take of [A, B]) {
      ramps = []
      const { s, ctx } = await ready('marketing', { ...TAKES, 'marketing.stroll.0': take })
      expect(booked(s)).toEqual([[id('marketing.stroll.0'), W]])
      expect(times(ctx, 'marketing.stroll.0')).toEqual([[W, null]])
      expect(s.log()[0]!.seconds).toBe(take.seconds)
      ctx.currentTime = W + take.starts[1]! + 0.01
      expect(s.said().lines.filter((l) => l.start <= ctx.currentTime && l.end > ctx.currentTime).map((l) => l.words)).toEqual(['three four five'])
      expect(ramps.some((r) => r.v === low && near(r.t) === near(W))).toBe(true)
      expect(ramps.some((r) => r.v === 1 && near(r.t) === near(W + take.seconds + DUCK.releaseSeconds))).toBe(true)
    }
  })

  it('never plays the take whose words are not the script\'s: the line is said as a silent stand-in of its words, and the effects are not held down', async () => {
    const { s, ctx } = await ready('step3')
    ramps = []
    ctx.currentTime = 2
    s.event(ev('vacuum-on', 'step3'), 'live')
    expect(booked(s)).toEqual([[id('pinball.seal.0'), 2]])
    expect(s.log()[0]!.seconds).toBeCloseTo(L, 3)
    expect(of(ctx, 'pinball.seal.0')).toEqual([])
    expect(ramps.some((r) => r.v === low)).toBe(false)
    ctx.currentTime = 2.5
    expect(s.said().lines.length).toBeGreaterThan(0)
  })

  it('says a line whose file did not come as a stand-in of the file\'s length, with its caption and no voice', async () => {
    const { s, ctx } = await ready('marketing', TAKES, [`${id('marketing.stroll.0')}.mp3`])
    expect(booked(s)).toEqual([[id('marketing.stroll.0'), W]])
    expect(s.log()[0]!.seconds).toBe(A.seconds)
    expect(of(ctx, 'marketing.stroll.0')).toEqual([])
    expect(ramps.some((r) => r.v === low)).toBe(false)
  })

  it('fades line 1 out over the opening fade when Apply is pressed while it is said, and line 2 is heard on its event', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 5
    s.event(ev('button-press', 'marketing'), 'live')
    const out = 5 + LIVE.openingFadeSeconds
    expect(times(ctx, 'marketing.stroll.0')).toEqual([[W, near(out)]])
    expect(s.log().filter((e) => e.what === 'cut').map((e) => [e.line, near(e.seconds ?? null)])).toEqual([[id('marketing.stroll.0'), near(out - W)]])
    ctx.currentTime = 5.1
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step1')
    ctx.currentTime = 5.2
    s.event(ev('candidate-sensed', 'step1'), 'live')
    expect(booked(s)[1]).toEqual([id('step1.firstName.0'), near(out + gap)])
    expect(times(ctx, 'step1.firstName.0')).toEqual([[near(out + gap), null]])
    ctx.currentTime = out + 0.01
    expect(s.said().lines.filter((l) => l.line === id('marketing.stroll.0') && l.end > ctx.currentTime)).toEqual([])
    ctx.currentTime = 9
    s.event(ev('field-done', 'step1'), 'live')
    expect(times(ctx, 'step1.firstName.0')).toEqual([[near(out + gap), null]])
    expect(s.log().filter((e) => e.what === 'taken back' || e.what === 'dropped')).toEqual([])
  })

  it('fades line 1 the same way when the careers page is turned with no press, and leaves it alone in the film', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 4
    s.event(ev('page-turn', 'marketing'), 'live')
    expect(times(ctx, 'marketing.stroll.0')).toEqual([[W, near(4 + LIVE.openingFadeSeconds)]])
    const f = await ready()
    f.s.beat('marketing.stroll', 'film', 0)
    f.ctx.currentTime = 4
    f.s.event(ev('button-press', 'marketing'), 'film')
    f.s.event(ev('page-turn', 'marketing'), 'film')
    expect(times(f.ctx, 'marketing.stroll.0')).toEqual([[0, null]])
    expect(f.s.log().filter((e) => e.what === 'cut')).toEqual([])
  })

  it('stops, before it starts, the voice of a line that is taken back, so it is never heard', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 5
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step1')
    s.event(ev('candidate-sensed', 'step1'), 'live')
    const at = 5 + LIVE.openingFadeSeconds + gap
    expect(times(ctx, 'step1.firstName.0')).toEqual([[near(at), null]])
    ctx.currentTime = 5.2
    s.event(ev('field-done', 'step1'), 'live')
    expect(s.log().filter((e) => e.what === 'taken back').map((e) => e.line)).toEqual([id('step1.firstName.0')])
    expect(times(ctx, 'step1.firstName.0')).toEqual([[near(at), 5.2]])
    expect(of(ctx, 'step1.firstName.0')[0]!.stopped!).toBeLessThan(of(ctx, 'step1.firstName.0')[0]!.started!)
  })

  it('at a jump lets the voice of line 6a out by the start of its next phrase and sets the voices of 6b and 6c again at their new starts', async () => {
    const { s, ctx } = await ready('step4')
    ctx.currentTime = 10
    s.event(ev('boss-formed', 'step4'), 'live')
    const a = TAKES['boss.unfold.0']!
    const b = TAKES['boss.unfold.1']!
    const b0 = 10 + a.seconds + gap
    const c0 = b0 + b.seconds + gap
    expect(booked(s)).toEqual([[id('boss.unfold.0'), 10], [id('boss.unfold.1'), near(b0)], [id('boss.unfold.2'), near(c0)]])
    ctx.currentTime = 12
    s.event(ev('boss-turn', 'step4'), 'live')
    const end = 10 + a.starts![1]!
    expect(times(ctx, 'boss.unfold.0')).toEqual([[10, near(end)]])
    expect(times(ctx, 'boss.unfold.1')).toEqual([[near(b0), 12], [near(end + gap), null]])
    expect(times(ctx, 'boss.unfold.2')).toEqual([[near(c0), 12], [near(end + gap + b.seconds + gap), null]])
    ctx.currentTime = end + gap + 0.2
    expect(s.said().lines.filter((l) => l.start <= ctx.currentTime && l.end > ctx.currentTime).map((l) => l.line)).toEqual([id('boss.unfold.1')])
  })

  it('keeps Continue on step 2 waiting until the file of line 4b has ended, whatever its length', async () => {
    expect(waitsFor.step2).toBe('step2.crank.1')
    for (const seconds of [1.89, 3.4]) {
      const { s, ctx } = await ready('step2', { ...TAKES, 'step2.crank.1': { seconds, starts: [0.1, 0.7, 1.3] } })
      ctx.currentTime = 20
      s.event(ev('volume-sign', 'step2'), 'live')
      ctx.currentTime = 30
      s.event(ev('crank-full', 'step2'), 'live')
      expect(times(ctx, 'step2.crank.1')).toEqual([[30, null]])
      ctx.currentTime = 30 + seconds - 0.01
      expect(s.owed('step2')).toBe(true)
      ctx.currentTime = 30 + seconds + 0.01
      expect(s.owed('step2')).toBe(false)
    }
  })

  it('plays no line file at all through a visit when the index holds no take of the script\'s words, as before', async () => {
    const stale = Object.fromEntries(Object.entries(TAKES).map(([k, t]) => [k, { ...t, words: 'other words' }]))
    const { s, ctx } = await ready('marketing', stale)
    expect(fetched.filter((f) => f.endsWith('.mp3'))).toEqual([])
    ctx.currentTime = 30
    s.event(ev('page-turn', 'marketing'), 'live')
    s.page('step1')
    s.event(ev('candidate-sensed', 'step1'), 'live')
    expect(booked(s).map((b) => b[0])).toEqual([id('marketing.stroll.0'), id('step1.firstName.0')])
    expect(lineSources(ctx)).toEqual([])
    expect(ramps.some((r) => r.v === low)).toBe(false)
  })

  it('stops every voice when the sound is stopped', async () => {
    const { s, ctx } = await ready('marketing')
    ctx.currentTime = 3
    s.stop()
    expect(near(of(ctx, 'marketing.stroll.0')[0]!.stopped)).toBe(near(3 + LIVE.volumeRampSeconds))
  })
})

describe('the narrator\'s voice: the film\'s mix', () => {
  const sr = 8000
  const real = (key: string): string => standIns(undefined, undefined, undefined, undefined, []).get(key)!.text
  const one = { sampleRate: sr, channels: [new Float32Array(sr * 2).fill(0.25)] }
  const base = { sampleRate: sr, fps: 60, seconds: 40, events: [], sfx: [], duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb }
  const lines = [{ id: id('marketing.stroll.0'), beat: 'marketing.stroll', frame: 60 }, { id: id('step1.firstName.0'), beat: 'step1.firstName', frame: 1200 }, { id: id('step1.shredded.0'), beat: 'step1.shredded', frame: 1800 }]
  const sounds = new Map([[id('marketing.stroll.0'), one], [id('step1.firstName.0'), one]]) as never

  it('lays the take of a line recorded from the script\'s words at the line\'s frame, and a stand-in for a line with a stale take or none', () => {
    const records = [
      { id: id('marketing.stroll.0'), kind: 'line', seconds: 2, words: real('marketing.stroll.0') },
      { id: id('step1.firstName.0'), kind: 'line', seconds: 2, words: 'words of an older round' },
      { id: 'step.1', kind: 'cue', seconds: 0.2 }
    ]
    const takes = keptTakes(records) as KeptLine[]
    expect(takes.map((t) => t.id)).toEqual([id('marketing.stroll.0'), id('step1.firstName.0')])
    const silent = scriptStandIns(takes)
    expect(silent.has(id('marketing.stroll.0'))).toBe(false)
    expect(silent.has(id('step1.firstName.0'))).toBe(true)
    const r = mixFilm({ ...base, lines, sounds, standIns: silent })
    expect(r.placed.filter((p) => p.kind === 'line').map((p) => [p.id, p.frame, p.sample, p.seconds])).toEqual([[id('marketing.stroll.0'), 60, sr, 2]])
    expect(r.placed.filter((p) => p.kind === 'stand-in').map((p) => p.id)).toEqual([id('step1.firstName.0'), id('step1.shredded.0')])
    expect(r.missingLines).toEqual([])
    const ch = r.sound.channels[0]!
    expect(ch[sr - 1]).toBe(0)
    expect(Math.abs(ch[sr + 10]!)).toBeGreaterThan(0)
    expect(Math.abs(ch[sr * 2]!)).toBeGreaterThan(0)
    expect(ch.subarray(sr * 3 + 1).every((v) => v === 0)).toBe(true)
  })

  it('holds every line of the script as a stand-in when no take is given, and names a line as missing when its take is said to be kept and no file is there', () => {
    expect(scriptStandIns([]).size).toBe(Object.keys(spoken).length)
    const r = mixFilm({ ...base, lines, sounds: new Map() as never, standIns: scriptStandIns([{ id: id('marketing.stroll.0'), seconds: 2, words: real('marketing.stroll.0') }]) })
    expect(r.missingLines).toEqual([id('marketing.stroll.0')])
    expect(r.placed.filter((p) => p.kind === 'line')).toEqual([])
  })
})

describe('the narrator\'s voice: the pack', () => {
  const SR: number = cfg.audio.sampleRate
  const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
  // A line of tone bursts: sound from each start for the seconds given, silence between.
  const bursts = (seconds: number, spans: [number, number][]): Float32Array => {
    const x = new Float32Array(Math.round(seconds * SR))
    for (const [from, to] of spans) for (let i = Math.round(from * SR); i < Math.round(to * SR); i++) x[i] = 0.25 * Math.sin((2 * Math.PI * 220 * i) / SR)
    return x
  }
  const M: any = { dsp, levels }
  let root = ''
  let P: any
  const keep = (key: string, words: string, x: Float32Array) => {
    const bytes = dsp.encodeWav({ sampleRate: SR, channels: [x] }, 24)
    writeFileSync(path.join(P.kept, `${id(key)}.wav`), bytes)
    writeFileSync(path.join(P.kept, `${id(key)}.json`), JSON.stringify({ id: id(key), kind: 'line', cue: null, loop: false, beat: key.slice(0, key.lastIndexOf('.')), index: 0, words, text: words, file: `${id(key)}.wav`, seconds: x.length / SR, sha256: sha(bytes), take: { number: 1, round: 'a test', file: 'take-1.mp3' }, settings: {} }))
  }
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'voice-'))
    P = places(root)
    mkdirSync(P.kept, { recursive: true })
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('finds the start of each phrase of a take: the first sound, then the end of each pause, when the pauses are as many as the marks', () => {
    const x = bursts(6, [[0.1, 1.2], [2.4, 3.5], [4.8, 5.8]])
    const got = phraseStarts(x, SR, `a b ${mark} c d ${mark} e`, M)
    expect(got.marks).toBe(2)
    expect(got.found).toBe(2)
    expect(got.starts.length).toBe(3)
    ;[0.1, 2.4, 4.8].forEach((t, k) => expect(Math.abs(got.starts[k] - t)).toBeLessThan(0.005))
    expect(phraseStarts(x, SR, `a b ${mark} c d e`, M)).toEqual({ marks: 1, found: 2, starts: null })
    expect(phraseStarts(new Float32Array(SR), SR, 'a b', M).starts).toBeNull()
  })

  it('writes into the index of each line its words and its starts, in two lengths of the same words, and no starts where the pauses are not the marks', () => {
    const words = `a b ${mark} c d ${mark} e`
    keep('marketing.stroll.0', words, bursts(6, [[0.1, 1.2], [2.4, 3.5], [4.8, 5.8]]))
    keep('step1.firstName.0', words, bursts(4, [[0.1, 1.2], [1.6, 2.7], [3, 3.8]]))
    keep('step1.shredded.0', `a b ${mark} c d e`, bursts(6, [[0.1, 1.2], [2.4, 3.5], [4.8, 5.8]]))
    const index = pack(P, cfg, M, true)
    const written = JSON.parse(readFileSync(path.join(P.pub, 'index.json'), 'utf8'))
    const by = Object.fromEntries(written.lines.map((l: any) => [l.id, l]))
    expect(by[id('marketing.stroll.0')].words).toBe(words)
    expect(by[id('marketing.stroll.0')].seconds).toBe(6)
    by[id('marketing.stroll.0')].starts.forEach((t: number, k: number) => expect(Math.abs(t - [0.1, 2.4, 4.8][k]!)).toBeLessThan(0.005))
    expect(by[id('step1.firstName.0')].seconds).toBe(4)
    by[id('step1.firstName.0')].starts.forEach((t: number, k: number) => expect(Math.abs(t - [0.1, 1.6, 3][k]!)).toBeLessThan(0.005))
    expect(by[id('step1.shredded.0')].words).toBe(`a b ${mark} c d e`)
    expect('starts' in by[id('step1.shredded.0')]).toBe(false)
    expect(index.noStarts).toEqual([`${id('step1.shredded.0')} (2 pauses for 1 marks)`])
    expect('noStarts' in written).toBe(false)
    const read = standIns({ 'marketing.stroll': [{ at: 0, text: words }] }, {}, wps, mark, written.lines).get('marketing.stroll.0')!
    expect(read.kept).toBe(true)
    expect(read.phrases.map((p) => p.words)).toEqual(['a b', 'c d', 'e'])
    expect(read.phrases[2]!.to).toBe(6)
  })
})

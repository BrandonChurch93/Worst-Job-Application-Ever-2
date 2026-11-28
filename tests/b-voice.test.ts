// @vitest-environment node
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { SENTENCE_WAIT_SECONDS, earlyEnd, endsSentence, jumpsLiveOnly, spoken, turnWaitsFor, waitsFor } from '../src/audio/cues'
import * as dsp from '../src/audio/dsp'
import * as levels from '../src/audio/levels'
import { DUCK, LIVE, db } from '../src/audio/levels'
import { filmCaptions, phrasesOf, phrasesOver, standIns, wordCount, type KeptLine } from '../src/audio/standin'
import { mixFilm, scriptStandIns } from '../src/audio/mix'
import { pack, phraseStarts, places } from '../tools/sound.mjs'
import { altTakes, keptTakes, makeMix as mixOf } from '../tools/mix.mjs'
import * as mixModule from '../src/audio/mix'
import * as cuesModule from '../src/audio/cues'

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
// The first part of line 7 has two sentences: its second phrase ends the first.
const sentences = (a: string) => `${a} one two ${mark} three four five. ${mark} six seven.`
film['boss.unfold'] = [{ at: 0, text: sentences('beaten') }, { at: 0.5, text: eight('loans') }, { at: 0.8, text: eight('ready') }]
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

  it('spreads the caption of a take that has no starts over its file by its words, and takes the line that builds on marks as kept when a take of its words is in the index', () => {
    const all = standIns(film, drafts, wps, mark, index(TAKES))
    const line = all.get('step1.shredded.0')!
    expect(line.kept).toBe(true)
    expect(line.seconds).toBe(13.7)
    expect(line.phrases.map((p) => [near(p.from), near(p.to)])).toEqual([[0, near((13.7 * 3) / 8)], [near((13.7 * 3) / 8), near((13.7 * 6) / 8)], [near((13.7 * 6) / 8), 13.7]])
    const shout = all.get('boss.finish.0')!
    expect(spoken['boss.finish.0']!.steps).toBeDefined()
    expect(shout.kept).toBe(true)
    expect(shout.seconds).toBe(5)
    expect(shout.phrases.map((p) => p.from)).toEqual([0.1, 1, 2])
    const none = standIns(film, drafts, wps, mark, index({ ...TAKES, 'boss.finish.0': { seconds: 5, words: 'other words' } })).get('boss.finish.0')!
    expect(none.kept).toBe(false)
    expect(none.seconds).toBe(6)
  })
})

describe('the narrator\'s voice: the engine', () => {
  it('fetches, when sound is allowed, the file of each line that has a take of its words and of no other line', async () => {
    await ready('marketing')
    const want = Object.keys(TAKES).filter((k) => k !== 'pinball.seal.0').map((k) => `${id(k)}.mp3`).sort()
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

  it('at a jump lets the voice of the first part of line 7 out at the end of its sentence when that is within the wait, at its next pause when it is not, and sets the voices of the two parts after it again at their new starts', async () => {
    const a = TAKES['boss.unfold.0']!
    const b = TAKES['boss.unfold.1']!
    for (const [click, phrase] of [[2, 1], [7.9, 1], [8.1, 2], [16 - SENTENCE_WAIT_SECONDS + 0.01, 2]] as const) {
      const { s, ctx } = await ready('step4')
      ctx.currentTime = 10
      s.event(ev('boss-formed', 'step4'), 'live')
      const b0 = 10 + a.seconds + gap
      const c0 = b0 + b.seconds + gap
      expect(booked(s)).toEqual([[id('boss.unfold.0'), 10], [id('boss.unfold.1'), near(b0)], [id('boss.unfold.2'), near(c0)]])
      ctx.currentTime = 10 + click
      s.event(ev('boss-turn', 'step4'), 'live')
      const end = 10 + a.starts![phrase]!
      expect(times(ctx, 'boss.unfold.0'), `${click}`).toEqual([[10, near(Math.max(end, 10 + click + LIVE.voiceFadeSeconds))]])
      expect(times(ctx, 'boss.unfold.1')).toEqual([[near(b0), near(10 + click)], [near(end + gap), null]])
      expect(times(ctx, 'boss.unfold.2')).toEqual([[near(c0), near(10 + click)], [near(end + gap + b.seconds + gap), null]])
      ctx.currentTime = end + gap + 0.2
      expect(s.said().lines.filter((l) => l.start <= ctx.currentTime && l.end > ctx.currentTime).map((l) => l.line)).toEqual([id('boss.unfold.1')])
    }
  })

  it('takes a turn that comes before the first part of line 7 has begun as one at its first moment: the part is said to the end of its first sentence, not dropped, and the parts after it follow', async () => {
    // A take whose first sentence ends just inside the wait, so a turn at its first moment is answered with the whole sentence: its times follow SENTENCE_WAIT_SECONDS, they are not typed.
    const sentence = SENTENCE_WAIT_SECONDS - 0.02
    const starts = [0.1, sentence / 2, sentence]
    const takes = { ...TAKES, 'boss.unfold.0': { seconds: sentence * 2, starts } }
    // The turn comes a part of a frame before the part begins, at that moment, and half way between the event that booked it and its start, while line 6 is still said.
    for (const early of [0.007, 0, 'half'] as const) {
      const { s, ctx } = await ready('step4', takes)
      ctx.currentTime = 10
      s.event(ev('checkbox', 'step4'), 'live')
      const formed = 10 + L / 10
      ctx.currentTime = formed
      s.event(ev('boss-formed', 'step4'), 'live')
      const begins = booked(s).find((x) => x[0] === id('boss.unfold.0'))![1] as number
      expect(begins).toBeCloseTo(10 + L + gap, 3)
      const turn = early === 'half' ? (formed + begins) / 2 : begins - early
      expect(turn).toBeGreaterThan(formed)
      if (early === 'half') expect(turn).toBeLessThan(10 + L)
      ctx.currentTime = turn
      s.event(ev('boss-turn', 'step4'), 'live')
      const end = begins + starts[2]!
      expect(times(ctx, 'boss.unfold.0'), `${early}`).toEqual([[near(begins), near(end)]])
      expect(times(ctx, 'boss.unfold.1').at(-1), `${early}`).toEqual([near(end + gap), null])
      expect(s.log().filter((e) => e.what === 'cut').map((e) => [e.line, e.seconds])).toEqual([[id('boss.unfold.0'), near(starts[2]!)]])
      ctx.currentTime = begins + sentence / 2
      expect(s.said().lines.filter((l) => l.start <= ctx.currentTime && l.end > ctx.currentTime).map((l) => l.line)).toEqual([id('boss.unfold.0')])
    }
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
    const starts: number[] = got.starts ?? []
    expect(starts.length).toBe(3)
    ;[0.1, 2.4, 4.8].forEach((t, k) => expect(Math.abs(starts[k]! - t)).toBeLessThan(0.005))
    expect(phraseStarts(x, SR, `a b ${mark} c d e`, M)).toEqual({ marks: 1, found: 2, starts: null })
    expect(phraseStarts(new Float32Array(SR), SR, 'a b', M).starts).toBeNull()
  })

  it('takes the longest pauses for the marks when a short breath inside a phrase was counted too, and gives no starts when the breath is not clearly shorter', () => {
    const x = bursts(8, [[0.1, 1.0], [2.2, 2.9], [3.1, 3.6], [4.8, 5.8]])
    const got = phraseStarts(x, SR, `a b ${mark} c d ${mark} e`, M)
    expect(got.marks).toBe(2)
    expect(got.found).toBe(3)
    const starts: number[] = got.starts ?? []
    expect(starts.length).toBe(3)
    ;[0.1, 2.2, 4.8].forEach((t, k) => expect(Math.abs(starts[k]! - t)).toBeLessThan(0.005))
    const y = bursts(8, [[0.1, 1.0], [2.2, 2.9], [3.6, 4.0], [4.8, 5.8]])
    expect(phraseStarts(y, SR, `a b ${mark} c d ${mark} e`, M)).toEqual({ marks: 2, found: 3, starts: null })
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

describe('the narrator\'s voice: lines 8 and 9 at the turn back to the careers page', () => {
  const LETTER = { seconds: 12.7, starts: [0.1, 4, 8] }
  const takes = { ...TAKES, 'decision.letter.0': LETTER }
  const fade = LIVE.voiceFadeSeconds

  it('ends line 8 at its next pause when Decision\'s button is pressed while it is said, owes the page its turn until that pause and the gap, and says line 9 on the turn', async () => {
    const { s, ctx } = await ready('step5', takes)
    ctx.currentTime = 50
    s.event(ev('stamp', 'step5'), 'live')
    expect(booked(s)).toEqual([[id('decision.letter.0'), 50]])
    ctx.currentTime = 51.5
    expect(s.owed('step5')).toBe(false)
    s.event(ev('button-press', 'step5'), 'live')
    expect(s.log().filter((e) => e.what === 'cut').map((e) => [e.line, e.start, e.seconds])).toEqual([[id('decision.letter.0'), 50, 4]])
    expect(times(ctx, 'decision.letter.0')).toEqual([[50, 54]])
    expect(s.owed('step5')).toBe(true)
    ctx.currentTime = 54 + gap - 0.01
    expect(s.owed('step5')).toBe(true)
    ctx.currentTime = 54 + gap
    expect(s.owed('step5')).toBe(false)
    s.event(ev('page-turn', 'step5'), 'live')
    expect(booked(s)[1]).toEqual([id('decision.reset.0'), near(54 + gap)])
    expect(s.log().filter((e) => e.what === 'cut').length).toBe(1)
    expect(s.said().lines.filter((l) => l.line === id('decision.letter.0') && l.end > 54 + 1e-9)).toEqual([])
  })

  it('lets line 8 out over the voice fade when the careers page comes while it is still said, and says line 9 after the fade and the gap', async () => {
    const { s, ctx } = await ready('step5', takes)
    ctx.currentTime = 50
    s.event(ev('stamp', 'step5'), 'live')
    ctx.currentTime = 52
    s.event(ev('page-turn', 'step5'), 'live')
    expect(times(ctx, 'decision.letter.0')).toEqual([[50, near(52 + fade)]])
    expect(s.log().filter((e) => e.what === 'cut').map((e) => [e.line, e.seconds, e.why])).toEqual([[id('decision.letter.0'), near(2 + fade), 'the careers page came while it was said']])
    expect(booked(s)[1]).toEqual([id('decision.reset.0'), near(52 + fade + gap)])
    expect(s.owed('step5')).toBe(false)
  })

  it('says line 8 whole in the film, whatever is pressed, and owes the page nothing', async () => {
    const { s, ctx } = await ready(null, takes)
    ctx.currentTime = 50
    s.event(ev('stamp', 'step5'), 'film')
    ctx.currentTime = 51.5
    s.event(ev('button-press', 'step5'), 'film')
    s.event(ev('page-turn', 'step5'), 'film')
    expect(times(ctx, 'decision.letter.0')).toEqual([[50, null]])
    expect(s.log().filter((e) => e.what === 'cut')).toEqual([])
    expect(s.owed('step5')).toBe(false)
  })
})

describe('the narrator\'s voice: the index of this tree', () => {
  const real: SoundIndex = read('public', 'audio', 'index.json')
  const script = standIns()
  const bare = [...script.values()].filter((l) => l.kept && real.lines.find((x) => x.id === l.id)?.starts === undefined)
  const realSite = () => {
    const enc = new TextEncoder()
    const files = new Map<string, Uint8Array>([[real.pack!.file, new Uint8Array(real.pack!.bytes)]])
    for (const f of [...real.loops, ...real.lines]) files.set(f.file, enc.encode(f.id))
    vi.stubGlobal('fetch', async (url: string) => {
      const bytes = files.get(url.replace('./audio/', ''))
      if (!bytes) return { ok: false, status: 404 }
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
    })
    return makeSound({ base: './audio/', index: real })
  }

  it('spreads the caption of each kept line that has no starts over its file by its words: no word before the file begins, none after it ends, no hole', () => {
    console.info(`MEASURED kept lines of the index with no starts: ${bare.map((l) => `${l.id} ${l.seconds} s`).join(', ') || 'none'}`)
    for (const line of bare) {
      const n = wordCount(line.words)
      expect(line.phrases, line.id).toEqual(phrasesOver(line.text, mark, line.seconds))
      expect(line.phrases.map((p) => p.words).join(' '), line.id).toBe(line.words)
      expect(line.phrases[0]!.from, line.id).toBe(0)
      expect(line.phrases[line.phrases.length - 1]!.to, line.id).toBeCloseTo(line.seconds, 9)
      line.phrases.forEach((p, k) => {
        if (k > 0) expect(p.from, `${line.id} ${k}`).toBe(line.phrases[k - 1]!.to)
        expect(p.to - p.from, `${line.id} ${k}`).toBeCloseTo((line.seconds * wordCount(p.words)) / n, 9)
      })
      const fps: number = cfg.film.fps
      const caps = filmCaptions([{ id: line.id, frame: 600 }], fps)
      expect(caps.map((c) => c.words), line.id).toEqual(line.phrases.map((p) => p.words))
      expect(caps[0]!.first, line.id).toBe(600)
      expect(caps[caps.length - 1]!.last, line.id).toBe(600 + Math.round(line.seconds * fps) - 1)
      for (let k = 1; k < caps.length; k++) expect(caps[k]!.first, `${line.id} ${k}`).toBe(caps[k - 1]!.last + 1)
    }
  })

  it('says such a line from its file on the live site and shows none of its words before the file starts or after it ends', async () => {
    for (const line of bare) {
      const row = spoken[line.key]!
      const s = realSite()
      s.page(line.page)
      await s.unlock()
      const ctx = made[made.length - 1]!
      ctx.currentTime = 40
      s.event(ev(row.event!, line.page), 'live')
      const entry = s.log().find((e) => e.what === 'spoken' && e.line === line.id)!
      expect(entry.seconds, line.id).toBe(line.seconds)
      const start = entry.start!
      expect(start).toBeGreaterThanOrEqual(40)
      expect(ctx.sources.filter((x) => x.buffer?.id === line.id).map((x) => [x.started, x.stopped]), line.id).toEqual([[start, null]])
      const mine = s.said().lines.filter((l) => l.line === line.id || l.id === line.id)
      expect(mine.map((l) => l.words), line.id).toEqual(line.phrases.map((p) => p.words))
      expect(mine[0]!.start, line.id).toBeCloseTo(start, 9)
      expect(mine[mine.length - 1]!.end, line.id).toBeCloseTo(start + line.seconds, 9)
      for (let k = 1; k < mine.length; k++) expect(mine[k]!.start, `${line.id} ${k}`).toBeCloseTo(mine[k - 1]!.end, 9)
      s.stop()
    }
  })
})

describe('the narrator\'s voice: another form of a kept line in a preview mix', () => {
  const makeMix = mixOf as (...a: unknown[]) => Promise<any>
  const SR: number = cfg.audio.sampleRate
  const M: any = { dsp, mix: mixModule, cues: cuesModule, levels }
  const one = id('marketing.stroll.0')
  const words: string = narration.film['marketing.stroll'][0].text
  const sum = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
  const tone = (seconds: number, rate = SR): Uint8Array => {
    const x = new Float32Array(Math.round(seconds * rate))
    for (let i = 0; i < x.length; i++) x[i] = 0.25 * Math.sin((2 * Math.PI * 220 * i) / rate)
    return dsp.encodeWav({ sampleRate: rate, channels: [x] }, 24)
  }
  let root = ''
  let P: any
  let altDir = ''
  const plan = () => ({ source: 'a test', fps: cfg.film.fps, seconds: 3, events: [], lines: [{ id: one, beat: 'marketing.stroll', frame: 30 }] })
  const lineOf = (r: any) => r.placed.filter((p: any) => p.kind === 'line').map((p: any) => [p.id, p.frame, p.seconds])
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'alt-'))
    P = places(root)
    altDir = path.join(root, 'alt')
    mkdirSync(P.kept, { recursive: true })
    mkdirSync(altDir, { recursive: true })
    const bytes = tone(1)
    writeFileSync(path.join(P.kept, `${one}.wav`), bytes)
    writeFileSync(path.join(P.kept, `${one}.json`), JSON.stringify({ id: one, kind: 'line', beat: 'marketing.stroll', index: 0, file: `${one}.wav`, seconds: 1, words, sha256: sum(bytes) }))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('lays the kept take when no flag is given, though another form lies in the folder, and says nothing of it', async () => {
    writeFileSync(path.join(altDir, `${one}.wav`), tone(0.6))
    const r = await makeMix(P, cfg, M, path.join(P.mix, 'review.wav'), 'review', plan())
    expect(lineOf(r)).toEqual([[one, 30, 1]])
    expect('alt' in r).toBe(false)
  })

  it('lays the other form in place of the kept take when the folder is given, names it in the record with its sum, its length and the kept length, and writes nothing kept', async () => {
    const other = tone(0.6)
    writeFileSync(path.join(altDir, `${one}.wav`), other)
    const before = [`${one}.wav`, `${one}.json`].map((f) => sum(readFileSync(path.join(P.kept, f))))
    const r = await makeMix(P, cfg, M, path.join(P.mix, 'review-alt.wav'), 'review-alt', plan(), altDir)
    expect(lineOf(r)).toEqual([[one, 30, 0.6]])
    expect(r.alt).toEqual([{ id: one, file: `${one}.wav`, sha256: sum(other), seconds: 0.6, keptSeconds: 1, starts: null }])
    expect(r.missingLines).toEqual([])
    expect([`${one}.wav`, `${one}.json`].map((f) => sum(readFileSync(path.join(P.kept, f))))).toEqual(before)
    const kept = await makeMix(P, cfg, M, path.join(P.mix, 'review.wav'), 'review', plan())
    expect(kept.sha256).not.toBe(r.sha256)
    expect(kept.keptSha256).toBe(r.keptSha256)
  })

  it('gives an empty list when the folder holds no form, and refuses a form of a line with no kept take or at another sample rate', async () => {
    const r = await makeMix(P, cfg, M, path.join(P.mix, 'review-alt.wav'), 'review-alt', plan(), altDir)
    expect(r.alt).toEqual([])
    expect(lineOf(r)).toEqual([[one, 30, 1]])
    writeFileSync(path.join(altDir, `${id('decision.reset.0')}.wav`), tone(0.5))
    await expect(makeMix(P, cfg, M, path.join(P.mix, 'no.wav'), 'review-alt', plan(), altDir)).rejects.toThrow(/^the mix is refused: line\.decision\.reset\.0\.wav is another form of line\.decision\.reset\.0, and no take of that line is kept with its file$/)
    rmSync(path.join(altDir, `${id('decision.reset.0')}.wav`))
    writeFileSync(path.join(altDir, `${one}.wav`), tone(0.5, SR / 2))
    await expect(makeMix(P, cfg, M, path.join(P.mix, 'no.wav'), 'review-alt', plan(), altDir)).rejects.toThrow(/^the mix is refused: .* Hz and the kept take of line\.marketing\.stroll\.0 is at .* Hz$/)
    expect(altTakes(path.join(root, 'none'), [], new Map(), M)).toEqual([])
  })
})

describe('where a line that the visitor ends early stops', () => {
  const all = standIns()
  const ends = (key: string) => all.get(key)!.phrases.filter((p) => endsSentence(p.words)).map((p) => p.to)

  it('knows a sentence end by the last mark of a phrase of the script', () => {
    expect(['is ready to give up.', 'Is it?', 'No!', 'The applicant', 'with other candidates. '].map(endsSentence)).toEqual([true, true, true, false, true])
  })

  it('finds in the script of this tree a sentence end for every line with a jump, the last of them the end of the line', () => {
    for (const [key, row] of Object.entries(spoken)) {
      if (!row.jump) continue
      const line = all.get(key)!
      expect(ends(key).length, key).toBeGreaterThan(0)
      expect(ends(key).at(-1), key).toBeCloseTo(line.seconds, 9)
    }
  })

  it('ends the first part of line 7 with its sentence when that is no more than the wait after the click and at its next pause otherwise, so no click waits longer', () => {
    const line = all.get('boss.unfold.0')!
    const pauses = line.phrases.map((p) => p.to)
    const stop = (at: number) => earlyEnd(pauses, ends('boss.unfold.0'), at)
    expect(SENTENCE_WAIT_SECONDS).toBeGreaterThanOrEqual(pauses[1]!)
    expect(SENTENCE_WAIT_SECONDS - pauses[1]!).toBeLessThan(0.05)
    const want: [number, number][] = [[0, 1], [pauses[0]! - 0.01, 1], [pauses[0]! + 0.01, 1], [pauses[1]! + 0.01, 2], [pauses[2]! + 0.01, 3], [pauses[3]! - 0.01, 3],
      [pauses[5]! - SENTENCE_WAIT_SECONDS - 0.01, 4], [pauses[5]! - SENTENCE_WAIT_SECONDS + 0.01, 5], [pauses[4]! + 0.01, 5],
      [pauses[7]! - SENTENCE_WAIT_SECONDS - 0.01, 6], [pauses[7]! - SENTENCE_WAIT_SECONDS + 0.01, 7], [pauses[6]! + 0.01, 7], [line.seconds + 0.01, 7]]
    for (const [at, phrase] of want) expect(stop(at), `${at}`).toBeCloseTo(pauses[phrase]!, 9)
    for (let at = 0; at <= line.seconds; at += 0.01) {
      expect(stop(at) - at, `${at}`).toBeLessThanOrEqual(SENTENCE_WAIT_SECONDS + 1e-9)
      expect(stop(at), `${at}`).toBeGreaterThanOrEqual(at - 1e-6)
      expect(pauses).toContain(stop(at))
    }
  })

  it('ends line 8, whose only sentence end is its end, at its next pause: it is the line its page holds its turn for, and it jumps on the live site only', () => {
    expect(turnWaitsFor.step5).toBe('decision.letter.0')
    expect(ends('decision.letter.0').length).toBe(1)
    expect(jumpsLiveOnly('decision.letter.0')).toBe(true)
    expect(jumpsLiveOnly('boss.unfold.0')).toBe(false)
  })
})

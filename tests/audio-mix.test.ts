import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { chain, encodeWav, decodeWav, loudness, peak, truePeakDb, type Sound } from '../src/audio/dsp'
import { behindOpening, frameSample, mixFilm, openingEvents, panGains, type MixInput } from '../src/audio/mix'
import { openingFrames, openingTimes, typedAt } from '../src/film/opening'
import { DUCK, LIVE, MIX, db, toDb } from '../src/audio/levels'
import { cueClass, filmLineId } from '../src/audio/cues'
import { ScriptDriver, Stage, wholeFilmFlow } from '../src/stage/stage'
import { pages } from '../src/pages'
import { narration, timedLines } from '../src/copy'
import { config } from '../src/config'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const SR: number = cfg.audio.sampleRate
const FPS: number = cfg.film.fps
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')

function noise(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2147483648 - 1
  }
}

function effect(id: string, seconds: number, seed: number): Sound {
  const n = Math.round(seconds * SR)
  const x = new Float32Array(n)
  const r = noise(seed)
  const hz = 120 + (seed % 9) * 70
  for (let i = 0; i < n; i++) {
    const t = i / SR
    x[i] = 0.6 * Math.exp(-t * (4 / seconds)) * (0.7 * Math.sin(2 * Math.PI * hz * t) + 0.3 * r())
  }
  const loop = id === 'room-tone' || id === 'shredder'
  if (loop) for (let i = 0; i < n; i++) x[i] = 0.2 * r() + 0.2 * Math.sin((2 * Math.PI * 90 * i) / SR)
  return chain({ sampleRate: SR, channels: [x] }, { seconds, cls: cueClass[id] ?? 'mechanism', loop }).sound
}

function line(seconds: number, seed: number): Sound {
  const n = Math.round(seconds * SR)
  const x = new Float32Array(n)
  const r = noise(seed)
  for (let i = 0; i < n; i++) x[i] = 0.3 * Math.sin((2 * Math.PI * (150 + seed * 10) * i) / SR) * (0.55 + 0.45 * Math.sin((2 * Math.PI * 4 * i) / SR)) + 0.02 * r()
  return chain({ sampleRate: SR, channels: [x] }, { seconds: seconds + 1, cls: 'voice' }).sound
}

function sounds(): Map<string, Sound> {
  const m = new Map<string, Sound>()
  let seed = 1
  for (const s of cfg.audio.sfx as { id: string; seconds: number; variants?: number }[]) {
    const n = s.variants ?? 1
    const seconds = s.id === 'room-tone' ? 4 : s.id === 'hold-music' ? 5 : s.id === 'shredder' ? 1.5 : s.seconds
    for (let v = 0; v < n; v++) m.set(n > 1 ? `${s.id}.${v + 1}` : s.id, effect(s.id, seconds, seed++))
  }
  m.set('line.test.0', line(1.6, 3))
  m.set('line.test.1', line(1.2, 5))
  return m
}

const shortFilm = (over: Partial<MixInput> = {}): MixInput => ({
  sampleRate: SR, fps: FPS, seconds: 12,
  events: [
    ...Array.from({ length: 10 }, (_, i) => ({ name: 'step', frame: 30 + i * 18, x: 300 + i * 120 })),
    { name: 'button-press', frame: 240, x: 960 },
    { name: 'bolt-fire', frame: 300, x: 1500 },
    { name: 'bolt-hit-cursor', frame: 318, x: 700 },
    { name: 'hold-music', frame: 360, x: 960 },
    { name: 'shredder', frame: 420, x: 960 },
    { name: 'shredder-stop', frame: 480, x: 960 },
    { name: 'slab-drop', frame: 600, x: 200 },
    { name: 'page-turn', frame: 660, x: 960 }
  ],
  lines: [{ id: 'line.test.0', beat: 'test', frame: 120 }, { id: 'line.test.1', beat: 'test', frame: 540 }],
  sounds: sounds(), sfx: cfg.audio.sfx, duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb,
  ...over
})

describe('the mix of fixture buffers', () => {
  const one = mixFilm(shortFilm())
  const bytes = encodeWav(one.sound, MIX.bitsPerSample)

  it('gives the same bytes twice', () => {
    const two = encodeWav(mixFilm(shortFilm()).sound, MIX.bitsPerSample)
    expect(two.length).toBe(bytes.length)
    expect(sha(two)).toBe(sha(bytes))
  })

  it('is one stereo file at audio.sampleRate of the exact length', () => {
    const back = decodeWav(bytes)
    expect(back.sampleRate).toBe(SR)
    expect(back.channels.length).toBe(2)
    expect(back.channels[0]!.length).toBe(12 * SR)
    expect(bytes.length).toBe(44 + 12 * SR * 2 * 3)
  })

  it('is at audio.filmLoudnessLufs within one unit', () => {
    const back = decodeWav(bytes)
    expect(Math.abs(loudness(back) - cfg.audio.filmLoudnessLufs)).toBeLessThanOrEqual(1)
    expect(Math.abs(one.mastered.lufs - cfg.audio.filmLoudnessLufs)).toBeLessThanOrEqual(1)
    expect(one.mastered.silent).toBe(false)
  })

  it('peaks under audio.truePeakDb', () => {
    const back = decodeWav(bytes)
    expect(truePeakDb(back)).toBeLessThanOrEqual(cfg.audio.truePeakDb)
    expect(one.mastered.truePeakDb).toBeLessThanOrEqual(cfg.audio.truePeakDb)
  })

  it('holds a mix of loud hits under the ceiling too', () => {
    const loud = shortFilm({ events: Array.from({ length: 60 }, (_, i) => ({ name: i % 2 ? 'slab-drop' : 'bolt-hit', frame: 6 + i * 11, x: 960 })), lines: [] })
    const r = mixFilm(loud)
    expect(r.mastered.truePeakDb).toBeLessThanOrEqual(cfg.audio.truePeakDb)
    expect(Math.abs(r.mastered.lufs - cfg.audio.filmLoudnessLufs)).toBeLessThanOrEqual(1)
  })

  it('starts every cue on the frame of its event', () => {
    const cues = one.placed.filter((p) => p.kind === 'cue')
    expect(cues.length).toBe(17)
    for (const p of cues) {
      expect(p.sample).toBe(frameSample(p.frame, FPS, SR))
      expect(Math.abs(p.sample / SR - p.frame / FPS) * FPS).toBeLessThanOrEqual(cfg.audio.contactSyncFrames)
    }
    expect(one.missingCues).toEqual([])
    expect(one.missingLines).toEqual([])
  })

  it('steps the variants in turn, never at random', () => {
    const steps = one.placed.filter((p) => p.cue === 'step').map((p) => p.id)
    expect(steps).toEqual(['step.1', 'step.2', 'step.3', 'step.4', 'step.1', 'step.2', 'step.3', 'step.4', 'step.1', 'step.2'])
    expect(one.placed.find((p) => p.event === 'bolt-hit-cursor')!.cue).toBe('bolt-hit')
  })

  it('cuts the hold music dead at audio.holdMusicSeconds and stops a loop at its stop event', () => {
    const music = one.placed.find((p) => p.cue === 'hold-music')!
    expect(music.seconds).toBeCloseTo(cfg.audio.holdMusicSeconds, 6)
    const shredder = one.placed.find((p) => p.cue === 'shredder')!
    expect(shredder.seconds).toBeCloseTo(1, 6)
  })

  it('places a sound left or right by where it happens', () => {
    expect(panGains(960).pan).toBe(0)
    expect(panGains(0).pan).toBeCloseTo(-LIVE.panWidth, 9)
    expect(panGains(1920).left).toBeLessThan(panGains(1920).right)
    const g = panGains(600)
    expect(g.left * g.left + g.right * g.right).toBeCloseTo(1, 9)
  })

  it('lowers the effects by audio.duckDb under a line and leaves the room tone alone', () => {
    const only = (events: MixInput['events'], lines: MixInput['lines'], keepTone: boolean) => {
      const s = sounds()
      if (!keepTone) s.delete('room-tone')
      return mixFilm(shortFilm({ events, lines, sounds: s, targetLufs: -30 }))
    }
    const hum = [{ name: 'shredder', frame: 0, x: 960 }]
    const under = only(hum, [{ id: 'line.test.0', beat: 'test', frame: 240 }], false)
    const voice = only([], [{ id: 'line.test.0', beat: 'test', frame: 240 }], false)
    const g1 = db(under.mastered.gainDb)
    const g2 = db(voice.mastered.gainDb)
    const level = (from: number, to: number) => {
      let sum = 0
      for (let i = Math.round(from * SR); i < Math.round(to * SR); i++) sum += (under.sound.channels[0]![i]! / g1 - voice.sound.channels[0]![i]! / g2) ** 2
      return Math.sqrt(sum / Math.round((to - from) * SR))
    }
    const open = level(1, 3)
    const ducked = level(4 + DUCK.attackSeconds + 0.1, 5.4)
    expect(toDb(ducked / open)).toBeCloseTo(-cfg.audio.duckDb, 0)
  })
})

describe('the mix with no kept sound', () => {
  it('is silent, of the exact length, and the same bytes twice', () => {
    const empty = shortFilm({ sounds: new Map() })
    const r = mixFilm(empty)
    expect(r.mastered.silent).toBe(true)
    expect(r.sound.channels[0]!.length).toBe(12 * SR)
    expect(peak(r.sound.channels[0]!)).toBe(0)
    expect(peak(r.sound.channels[1]!)).toBe(0)
    expect(r.placed).toEqual([])
    expect(r.missingLines).toEqual(['line.test.0', 'line.test.1'])
    expect(r.missingCues).toContain('step')
    expect(r.missingCues).toContain('room-tone')
    const a = encodeWav(r.sound, MIX.bitsPerSample)
    const b = encodeWav(mixFilm(shortFilm({ sounds: new Map() })).sound, MIX.bitsPerSample)
    expect(sha(a)).toBe(sha(b))
  })

  it('lays what is kept and names what is not', () => {
    const some = sounds()
    for (const id of [...some.keys()]) if (id.startsWith('step.') && id !== 'step.2') some.delete(id)
    some.delete('button-press')
    const r = mixFilm(shortFilm({ sounds: some }))
    expect(r.placed.filter((p) => p.cue === 'step').map((p) => p.id)).toEqual(Array(10).fill('step.2'))
    expect(r.missingCues).toEqual(['button-press'])
    expect(r.mastered.silent).toBe(false)
  })
})

describe('the film itself', () => {
  const seconds = config.film.units.reduce((s, u) => s + u.seconds, 0)

  it('gives the mix its events from the stage and every line a place inside the film', () => {
    const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
    stage.advance(Math.round(seconds * config.sim.stepHz))
    expect(stage.events.length).toBeGreaterThan(0)
    const events = stage.events.map((e) => ({ name: e.name, frame: Math.floor((e.step * FPS) / config.sim.stepHz), x: e.x }))
    for (const e of events) {
      expect(e.frame).toBeGreaterThanOrEqual(0)
      expect(e.frame).toBeLessThanOrEqual(seconds * FPS)
    }
    const lines = timedLines(config, narration).map((l) => ({ id: filmLineId(l.beat, l.index), beat: l.beat, frame: Math.round(l.start * FPS) }))
    expect(lines.length).toBeGreaterThan(0)
    expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length)
    const r = mixFilm({ sampleRate: 8000, fps: FPS, seconds, events, lines, sounds: new Map(), sfx: cfg.audio.sfx, duckDb: cfg.audio.duckDb, holdMusicSeconds: cfg.audio.holdMusicSeconds, targetLufs: cfg.audio.filmLoudnessLufs, truePeakDb: cfg.audio.truePeakDb })
    expect(r.sound.channels[0]!.length).toBe(seconds * 8000)
    expect(r.mastered.silent).toBe(true)
    expect(r.missingLines).toEqual([])
    expect(r.placed.filter((p) => p.kind === 'line')).toEqual([])
    expect(r.placed.filter((p) => p.kind === 'stand-in').map((p) => p.id)).toEqual(lines.slice().sort((a, b) => a.frame - b.frame).map((l) => l.id))
  })
})

describe('film A, the opening and then film B', () => {
  const t = openingTimes()
  const plan = { prompt: cfg.intro.prompt as string, charsPerSecond: cfg.intro.charsPerSecond as number, levelOpens: t.levelOpens, levelPicks: t.levelPicks, sendPressed: t.held, linesDone: t.lines.map((l) => l.done) }
  const events = openingEvents(plan, FPS)
  const lead = openingFrames()

  it('taps a key on the frame each letter of the prompt first shows', () => {
    const taps = events.filter((e) => e.name === 'key-tap')
    expect(taps.length).toBe(plan.prompt.length)
    taps.forEach((e, i) => {
      expect(typedAt(e.frame / FPS).length).toBe(i + 1)
      if (e.frame > 0) expect(typedAt((e.frame - 1) / FPS).length).toBeLessThanOrEqual(i)
    })
  })

  it('ticks at the level control and at each line of the build screen, and sends once, all inside the opening', () => {
    expect(events.filter((e) => e.name === 'ui-tick').length).toBe(2 + cfg.intro.steps.length)
    const send = events.filter((e) => e.name === 'ui-send')
    expect(send.length).toBe(1)
    expect(send[0]!.frame).toBe(Math.ceil(t.held * FPS - 1e-6))
    expect(send[0]!.frame).toBeGreaterThan(Math.max(...events.filter((e) => e.name === 'key-tap').map((e) => e.frame)))
    for (const e of events) expect(e.frame).toBeLessThan(lead)
  })

  it('lays film B behind the opening unchanged, with the room tone starting where the opening ends', () => {
    const b = shortFilm()
    const filmB = mixFilm(b)
    const a = mixFilm({ ...b, seconds: lead / FPS + b.seconds, events: [...events, ...behindOpening(b.events, lead)], lines: behindOpening(b.lines, lead), toneFromFrame: lead })
    expect(a.sound.channels[0]!.length).toBe(Math.round((lead / FPS + b.seconds) * SR))
    const own = a.placed.filter((p) => p.frame < lead)
    expect(own.length).toBe(events.length)
    expect(own.every((p) => ['key-tap', 'ui-tick', 'ui-send'].includes(p.cue))).toBe(true)
    const rest = a.placed.filter((p) => p.kind !== 'tone' && p.frame >= lead)
    const wanted = filmB.placed.filter((p) => p.kind !== 'tone')
    expect(rest.map((p) => [p.id, p.frame - lead, p.cents])).toEqual(wanted.map((p) => [p.id, p.frame, p.cents]))
    const tone = a.placed.find((p) => p.kind === 'tone')!
    expect(tone.frame).toBe(lead)
    expect(tone.sample).toBe(frameSample(lead, FPS, SR))
    const quiet = mixFilm({ ...b, seconds: lead / FPS + 1, events: [], lines: [], toneFromFrame: lead })
    const first = frameSample(lead, FPS, SR)
    expect(peak(quiet.sound.channels[0]!, 0, first)).toBe(0)
    expect(peak(quiet.sound.channels[0]!, first + SR / 10)).toBeGreaterThan(0)
  })
})

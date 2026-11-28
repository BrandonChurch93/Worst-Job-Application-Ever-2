import fs from 'node:fs'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const TAKE = vi.hoisted(() => ({ id: 'line.boss.finish.0', file: 'line.boss.finish.0.mp3', seconds: 4.01, mime: 'audio/mpeg', words: 'I have / five years / of experience', starts: [0.1, 0.66, 1.3], peak: 1.85 }))
vi.mock('../public/audio/index.json', async (actual) => {
  const real = (await actual()) as { default: { lines: { id: string }[] } }
  return { ...real, default: { ...real.default, lines: [...real.default.lines.filter((l) => l.id !== TAKE.id), TAKE] } }
})

import path from 'node:path'
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
const { lineTimes } = await import('../src/audio/standin')
const { finishShot } = await import('../src/boss/finish/camera')
const { CAMERA, FINISH, LOOK1_ON, SHOUT, SHOUT_LINE, voiceLevel, voiceShout, voiceSteps } = await import('../src/boss/tune')
const { finishNow } = await import('../src/boss/viewof')
const { BotDriver } = await import('../src/stage/bots')
const { Stage } = await import('../src/stage/stage')
const { riseAfterFire } = await import('../src/ui/rise')

// The shout on the live site while FINISH.onVoice (the Builder's rule of 28 November): the real boss page and the real sound code on one clock.
// The sound index of this file is the tree's with the working take's row put in, so the numbers are that take's whatever the tree holds. No sound is made: the take is a row of numbers.

const ID = TAKE.id
const PACK = (shipped as { pack: { bytes: number } | null }).pack?.bytes ?? 0
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const sw = FINISH as { onVoice: boolean }
const RUN = TAKE.peak - TAKE.starts[0]!
const WHOLE = RUN - CAMERA.roundLive
const FLOOR = SHOUT.arms + CAMERA.down[1] + CAMERA.stay + CAMERA.roundLive

class Param {
  value = 1
  setValueAtTime(v: number) { this.value = v }
  linearRampToValueAtTime(v: number) { this.value = v }
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

interface Told {
  press: number | null
  charges: number[]
  file: { start: number; offset: number }[]
  stopped: (number | null)[]
  shown: { k: number; at: number; words: string }[]
  gone: number | null
  turn: number | null
  blast: number
  heard: number
  size: number
  log: string[]
  said: { words: string; start: number; end: number; loud: boolean; step?: { k: number; n: number }; whole?: string }[]
}

// One visit: the pack's keen visitor fights the boss, then `down` is the button, by the seconds after the arms. `frame`: the steps of the stage in one picture of the site,
// after which its events reach the sound code, as src/main.ts sends them. Every time told is in seconds after the arms, on the sound's clock where it is a sound's.
async function visit(down: (u: number) => boolean, frame = 1): Promise<Told> {
  const enc = new TextEncoder()
  vi.stubGlobal('fetch', async (url: string) => {
    const name = url.replace('./audio/', '')
    if (name === 'sfx.bin') return { ok: true, arrayBuffer: async () => new ArrayBuffer(PACK) }
    const bytes = enc.encode(name.replace(/\.(mp3|flac)$/, ''))
    return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
  })
  const sound = makeSound({ base: './audio/' })
  await sound.unlock()
  const ctx = contexts[contexts.length - 1]!
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
  const shown: Told['shown'] = []
  let said: Told['said'] | null = null
  let last = -1
  const eyes: { time: number; arms: number; eye: number[] }[] = []
  let size = 0
  let fire = -1
  let fireView = -1
  while (stage.page.id === 'step4' && stage.time < 140 && (fire < 0 || stage.step < fire + 5 * stepHz)) {
    stage.advance(1)
    for (const e of stage.events) if (e.name === 'finish-arms' && arms < 0) arms = e.step
    for (const e of stage.events) if (e.name === 'finish-fire' && fire < 0) fire = e.step
    if (arms >= 0) {
      stage.frameAt(stage.time)
      const f = finishNow() as (ReturnType<typeof finishNow> & { eye?: number[] }) | null
      if (f?.marks?.arms !== undefined && f.eye && fire < 0) eyes.push({ time: f.time, arms: f.marks.arms, eye: [...f.eye] })
      if (f?.marks?.fire !== undefined) {
        size = Math.max(size, f.shot ?? 0)
        if (fireView < 0) fireView = f.marks.fire - (f.marks.arms ?? 0)
      }
    }
    if (stage.step % frame !== 0) continue
    ctx.currentTime = stage.step / stepHz
    sound.page(stage.page.id)
    for (; sent < stage.events.length; sent++) {
      if (stage.events[sent]!.name === 'finish-fire') heard = ctx.currentTime
      sound.event(stage.events[sent]!, 'live')
    }
    const reached = stage.gagsReached
    for (; gags < reached.length; gags++) sound.beat(reached[gags]!, 'live')
    if (arms < 0) continue
    const lines = sound.said().lines.filter((l) => l.line === ID)
    if (heard >= 0 && !said && lines.length) said = lines.map((l) => ({ words: l.words, start: l.start, end: l.end, loud: l.loud, ...(l.step ? { step: l.step } : {}), ...(l.whole !== undefined ? { whole: l.whole } : {}) }))
    for (const l of lines) {
      if (l.start > ctx.currentTime || ctx.currentTime >= l.end) continue
      last = ctx.currentTime
      if (l.step && !shown.some((x) => x.k === l.step!.k)) shown.push({ k: l.step.k, at: ctx.currentTime, words: l.words })
    }
  }
  const after = (t: number): number => Math.round((t - arms / stepHz) * 1000) / 1000
  const voices = ctx.sources.filter((x) => x.buffer?.id === ID)
  // The turn's start: the s after the arms for which the camera's own curve, turned from there, is the eye the page drew at every step up to the blast.
  // `due` is the moment the blast is due, the turn's start and `CAMERA.roundLive`: from the crossing behind the arrow to it the live view closes in by `CAMERA.creep`, as the film's does, so the page's eye is nearer than a curve with no `due` would have it.
  let turn: number | null = null
  if (LOOK1_ON && CAMERA.on && eyes.length) {
    let best = Infinity
    for (let j = -6; j <= 6; j++) {
      const t = fireView - CAMERA.roundLive + j / stepHz
      const off = Math.max(...eyes.map((e) => {
        const want = finishShot(e.time, { arms: e.arms, turn: e.arms + t, fire: -1, round: CAMERA.roundLive, due: e.arms + t + CAMERA.roundLive })?.pose.eye
        return want ? Math.hypot(want[0] - e.eye[0]!, want[1] - e.eye[1]!, want[2] - e.eye[2]!) : Infinity
      }))
      if (off < best) {
        best = off
        turn = Math.round(t * 1000) / 1000
      }
    }
    expect(best).toBeLessThan(1e-6)
  }
  return {
    press,
    charges: stage.events.filter((e) => e.name === 'finish-charge').map((e) => after(e.step / stepHz)),
    file: voices.map((v) => ({ start: after(v.started!), offset: v.offset })),
    stopped: voices.map((v) => v.stopped),
    shown: shown.map((x) => ({ ...x, at: after(x.at) })),
    gone: last < 0 ? null : after(last),
    turn,
    blast: after(fire / stepHz),
    heard: after(heard),
    size: Math.round(size * 1000) / 1000,
    log: sound.log().filter((x) => x.line === ID).map((x) => `${x.what} ${x.trigger}${x.why ? `: ${x.why}` : ''}`),
    said: (said ?? []).map((l) => ({ ...l, start: after(l.start), end: after(l.end) }))
  }
}

const CASES: [string, string, (u: number) => boolean][] = [
  ['a', 'a plain click at 2.0 s', (u) => u >= 2 && u < 2 + 2 / stepHz],
  ['b', 'a hold of 0.6 s from 2.0 s', (u) => u >= 2 && u < 2.6],
  ['c', 'a hold of 1.2 s from 2.0 s', (u) => u >= 2 && u < 3.2],
  ['d', 'a hold of 3 s from 2.0 s', (u) => u >= 2 && u < 5],
  ['e', 'no press', () => false],
  ['f', 'a plain click at 0.2 s', (u) => u >= 0.2 && u < 0.2 + 2 / stepHz]
]
const told: Record<string, Told> = {}

describe('the shout on the live site starts with the press and the blast comes on its peak', () => {
  beforeEach(() => {
    contexts = []
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    sw.onVoice = true
  })
  // For pipeline/change002/live-shout.mjs, which lays the words over the pictures of the built site: what each case was measured to do.
  afterAll(() => {
    if (process.env.LIVE_SHOUT_DUMP) fs.writeFileSync(process.env.LIVE_SHOUT_DUMP, `${JSON.stringify({ take: TAKE, cases: told }, null, 1)}\n`)
  })

  it('reads the working take from the sound index of this file', () => {
    expect(lineTimes(SHOUT_LINE)).toEqual({ starts: TAKE.starts, seconds: TAKE.seconds, kept: true, peak: TAKE.peak })
    expect(FINISH.onVoice).toBe(true)
  })

  it.each(CASES)('case %s, %s: one file, started once, its peak on the blast, the words on its phrases, the turn ended on the blast', async (name, _says, down) => {
    const t = (told[name] = await visit(down))
    const start = t.file[0]!
    const peak = start.start + TAKE.peak - start.offset
    console.info(`MEASURED case ${name}: press ${t.press ?? 'none'}; file started ${t.file.length} time(s), at ${start.start} from ${Math.round(start.offset * 1000) / 1000} s of the file, stopped ${JSON.stringify(t.stopped)}; phrases shown at ${t.shown.map((x) => `${x.at} "${x.words}"`).join(', ')}; caption last seen ${t.gone}; charge sounds at ${t.charges.join(', ')}; turn starts ${t.turn}; blast ${t.blast}; peak ${Math.round(peak * 1000) / 1000}; peak minus blast ${Math.round((peak - t.blast) * 1000) / 1000} on the page's clock, ${Math.round((peak - t.heard) * 1000) / 1000} as the sound code hears the blast; size ${t.size}`)
    expect(t.file.length).toBe(1)
    expect(t.stopped).toEqual([null])
    expect(start.offset).toBeGreaterThanOrEqual(0)
    expect(start.offset).toBeLessThanOrEqual(TAKE.starts[0]! + 1e-9)
    expect(Math.abs(peak - t.blast)).toBeLessThanOrEqual(0.05)
    expect(t.heard).toBeCloseTo(t.blast + 1 / stepHz, 2)
    expect(Math.abs(peak - t.heard)).toBeLessThanOrEqual(0.05)
    expect(t.shown.map((x) => x.k)).toEqual([0, 1, 2])
    for (const x of t.shown) expect(Math.abs(x.at - (start.start + Math.max(0, TAKE.starts[x.k]! - start.offset)))).toBeLessThanOrEqual(0.05)
    expect(t.shown.map((x) => x.words)).toEqual(['I HAVE', 'I HAVE FIVE YEARS', 'I HAVE FIVE YEARS OF EXPERIENCE'].map((w) => expect.stringMatching(new RegExp(`^${w}$`, 'i'))))
    expect(t.gone!).toBeGreaterThan(t.heard + riseAfterFire() - 0.05)
    expect(t.gone!).toBeLessThanOrEqual(t.heard + riseAfterFire() + 1e-9)
    if (t.turn !== null) expect(t.turn + CAMERA.roundLive).toBeCloseTo(t.blast, 2)
    if (t.press !== null) {
      expect(t.blast).toBeCloseTo(Math.max(t.press + RUN, FLOOR), 6)
      expect(start.start).toBeCloseTo(Math.max(t.press, t.blast - TAKE.peak) + 1 / stepHz, 2)
      expect(t.charges[0]).toBe(t.press)
    }
  }, 60000)

  it('fires the sizes of the rule: a plain click the small blast, the whole charge or longer and nobody the full one, a shorter hold between', () => {
    expect(told.a!.size).toBe(FINISH.small)
    expect(told.f!.size).toBe(FINISH.small)
    expect(told.c!.size).toBe(1)
    expect(told.d!.size).toBe(1)
    expect(told.e!.size).toBe(1)
    expect(told.b!.size).toBeGreaterThan(FINISH.small)
    expect(told.b!.size).toBeLessThan(1)
    expect(told.b!.size).toBeCloseTo(FINISH.steady * (0.6 / WHOLE) + (1 - FINISH.steady) * (2 / 3), 2)
  })

  it('puts the blast 1.75 s after the press with this take, 6 s after the arms when nobody presses, and at 1.95 s for a click at 0.2 s', () => {
    for (const k of ['a', 'b', 'c', 'd']) expect(told[k]!.blast - told[k]!.press!).toBeCloseTo(1.75, 6)
    expect(told.e!.blast).toBeCloseTo(FINISH.alone, 2)
    expect(told.e!.press).toBeNull()
    expect(told.f!.blast).toBeCloseTo(1.95, 2)
    expect(told.f!.file[0]!.offset).toBeCloseTo(0.1, 6)
  })

  it('lets go and holding on move nothing: the blast of a click, of a short hold, of the whole charge and of a long hold come at the same moment after the press', () => {
    const at = ['a', 'b', 'c', 'd'].map((k) => told[k]!.blast)
    expect(new Set(at).size).toBe(1)
    expect(told.d!.blast).toBeLessThan(5)
  })

  it('sounds the charge on the start of each phrase that is still held, and once for a plain click', () => {
    expect(told.a!.charges.length).toBe(1)
    expect(told.f!.charges.length).toBe(1)
    for (const k of ['c', 'd', 'e']) {
      const t = told[k]!
      expect(t.charges.length).toBe(3)
      t.charges.forEach((c, i) => expect(Math.abs(c - (t.file[0]!.start + TAKE.starts[i]! - t.file[0]!.offset))).toBeLessThanOrEqual(0.05))
    }
    expect(told.b!.charges.length).toBe(2)
  })

  it('a press after the voice has started by itself changes nothing', async () => {
    const t = await visit((u) => u >= 5 && u < 5.5)
    expect(t.blast).toBe(told.e!.blast)
    expect(t.file).toEqual(told.e!.file)
    expect(t.size).toBe(1)
  }, 60000)

  it('holds with the pictures of the site, 60 and 30 a second: the peak is within 0.05 s of the blast as the sound code hears it', async () => {
    for (const frame of [stepHz / 60, stepHz / 30]) {
      const t = await visit((u) => u >= 2.003 && u < 2.6, frame)
      const peak = t.file[0]!.start + TAKE.peak - t.file[0]!.offset
      console.info(`MEASURED ${stepHz / frame} pictures a second: press ${Math.round(t.press! * 1000) / 1000}, file at ${t.file[0]!.start} from ${Math.round(t.file[0]!.offset * 1000) / 1000} s, blast on the page ${t.blast}, heard ${t.heard}, peak ${Math.round(peak * 1000) / 1000}`)
      expect(t.file.length).toBe(1)
      expect(Math.abs(peak - t.heard)).toBeLessThanOrEqual(0.05)
      expect(Math.abs(peak - t.blast)).toBeLessThanOrEqual(0.05)
    }
  }, 60000)

  it('with the switch off the old path is back: the file starts on the arms, letting go fires, and the page sends what it sent', async () => {
    sw.onVoice = false
    const t = await visit((u) => u >= 2 && u < 2.6)
    console.info(`MEASURED switch off, a hold of 0.6 s from 2.0 s: file ${JSON.stringify(t.file)}, blast ${t.blast}, charge sounds ${t.charges.join(', ')}, size ${t.size}`)
    expect(t.file).toEqual([{ start: Math.round(1000 / stepHz) / 1000, offset: 0 }])
    expect(t.charges).toEqual([2])
    expect(t.blast).toBeCloseTo(2.6 + CAMERA.roundLive, 2)
    expect(t.log.some((l) => l.includes('starts with the press'))).toBe(false)
  }, 60000)
})

describe('the shout on the live site: the rule in numbers', () => {
  const take = { starts: TAKE.starts, seconds: TAKE.seconds, peak: TAKE.peak }
  const recorded = { starts: [0.1, 0.82, 1.46], seconds: 4.2, peak: 2.08 }

  it('rule 3: the blast is due on the peak, the press and the run to the peak or the camera\'s floor, and only the silent lead-in is left out', () => {
    expect(FLOOR).toBeCloseTo(1.8, 6)
    const a = voiceShout(2, take, true)
    expect(a.due).toBeCloseTo(3.75, 6)
    expect(a.from).toBe(2)
    expect(a.skip).toBeCloseTo(0.1, 6)
    expect(a.says.map((x) => Math.round(x * 1000) / 1000)).toEqual([2, 2.56, 3.2])
    const f = voiceShout(0.2, take, true)
    expect(f.due).toBeCloseTo(1.95, 6)
    expect(f.skip).toBeCloseTo(0.1, 6)
    const first = voiceShout(0, take, true)
    expect(first.due).toBeCloseTo(1.8, 6)
    expect(first.from).toBe(0)
    expect(first.skip).toBeCloseTo(0.05, 6)
    expect(first.says[0]).toBeCloseTo(0.05, 6)
    for (const press of [0, 0.02, 0.05, 0.2, 1, 2, 5]) for (const t of [take, recorded]) for (const camera of [true, false]) {
      const v = voiceShout(press, t, camera)
      expect(v.from).toBeGreaterThanOrEqual(press)
      expect(v.skip).toBeGreaterThanOrEqual(0)
      expect(v.skip).toBeLessThanOrEqual(t.starts[0]! + 1e-9)
      expect(v.from + t.peak - v.skip).toBeCloseTo(v.due, 9)
      t.starts.forEach((x, k) => expect(v.says[k]).toBeCloseTo(v.from + Math.max(0, x - v.skip), 9))
      if (camera) expect(v.due).toBeGreaterThanOrEqual(FLOOR - 1e-9)
    }
  })

  it('rule 7: with the finish camera off the blast is the press and the run to the peak, with no floor', () => {
    expect(voiceShout(0, take, false).due).toBeCloseTo(1.75, 6)
    expect(voiceShout(0, take, false).skip).toBeCloseTo(0.1, 6)
    expect(voiceShout(2, take, false).due).toBeCloseTo(3.75, 6)
  })

  it('rule 4: the whole charge is the run to the peak less the camera\'s turn, the glow steps on the phrases, a click is under the small blast and the whole charge is the full one', () => {
    const v = voiceShout(2, take, true)
    expect(v.whole).toBeCloseTo(1.2, 6)
    expect(v.marks.map((m) => Math.round(m * 1000) / 1000)).toEqual([0, 0.56, 1.2])
    expect(voiceLevel(0, v)).toBeLessThan(FINISH.small)
    expect(voiceLevel(1 / 60, v)).toBeLessThan(FINISH.small)
    expect(voiceLevel(0.6, v)).toBeCloseTo(FINISH.steady * 0.5 + (1 - FINISH.steady) * (2 / 3), 6)
    expect(voiceLevel(1.2, v)).toBe(1)
    expect(voiceLevel(30, v)).toBe(1)
    expect([0, 0.55, 0.56, 1.19, 1.2].map((h) => Math.round(voiceSteps(h, v) * 3))).toEqual([1, 1, 2, 2, 3])
    let before = 0
    for (let h = 0; h <= 1.3; h += 1 / 120) {
      expect(voiceLevel(h, v)).toBeGreaterThanOrEqual(before)
      before = voiceLevel(h, v)
    }
  })

  it('rule 5: by itself the page presses so that the blast comes FINISH.alone after the arms', () => {
    for (const t of [take, recorded]) {
      const v = voiceShout(0, t, true)
      expect(voiceShout(v.alone, t, true).due).toBeCloseTo(SHOUT.arms + FINISH.alone, 9)
    }
    expect(voiceShout(0, take, true).alone).toBeCloseTo(4.25, 6)
  })

  it('another take fits by itself: the take as recorded, starts 0.10, 0.82, 1.46 and peak 2.08', () => {
    const v = voiceShout(2, recorded, true)
    expect(v.due).toBeCloseTo(3.98, 6)
    expect(v.whole).toBeCloseTo(1.43, 6)
    expect(v.says.map((x) => Math.round(x * 1000) / 1000)).toEqual([2, 2.72, 3.36])
    expect(v.marks.map((m) => Math.round(m * 1000) / 1000)).toEqual([0, 0.72, 1.36])
    expect(voiceLevel(1.43, v)).toBe(1)
  })

  it('a line with no take is timed by its stand-in, its peak the start of its last phrase', () => {
    const v = voiceShout(1, null, true)
    expect(v.due).toBeCloseTo(1 + 4.13 - 0.1, 6)
    expect(v.skip).toBeCloseTo(0.1, 6)
  })
})

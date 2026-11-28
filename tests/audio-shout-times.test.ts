import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSound, type SoundIndex } from '../src/audio/index'
import { spoken } from '../src/audio/cues'
import { scriptStandIns } from '../src/audio/mix'
import { draftFilm, lineTimes, standIns, type KeptLine } from '../src/audio/standin'
import { CAMERA, FINISH, SHOUT } from '../src/boss/tune'
import { riseAfterFire } from '../src/ui/rise'

// The shout of the boss page: its times are the kept take's once one is in the sound index, and the stand-in's of the drafts file until then.
// Every take in this file is a row of numbers made in the test: none is a sound.

const root = process.cwd()
const shipped = JSON.parse(readFileSync(path.join(root, 'public', 'audio', 'index.json'), 'utf8')) as { lines: KeptLine[] }

const KEY = 'boss.finish.0'
const ID = `line.${KEY}`
const draft = draftFilm()['boss.finish']![0]!
const take = (over: Partial<KeptLine> = {}): KeptLine => ({ id: ID, seconds: 5.5, words: draft.text, starts: [0.2, 1.3, 3.9], ...over })
const shout = (takes: KeptLine[]) => lineTimes(KEY, standIns(undefined, undefined, undefined, undefined, takes))!

describe('the shout: its times', () => {
  it('are the stand-in of the drafts file while no take of it is kept, as in this tree', () => {
    const none = shout([])
    expect(none.kept).toBe(false)
    expect(none.starts).toEqual(draft.standIn!.starts)
    expect(none.seconds).toBe(draft.standIn!.seconds)
    const now = lineTimes(KEY)!
    const packed = shipped.lines.find((l) => l.id === ID)
    console.info(`MEASURED the pack ${packed ? 'holds' : 'holds no'} ${ID}; the shout is ${now.kept ? 'kept' : 'a stand-in'}: starts ${now.starts.join(', ')}, ${now.seconds} s`)
    if (!packed) expect(now).toEqual(none)
  })

  it('are the take\'s once a take of its words is in the index: its length, and the start of each phrase the index names', () => {
    expect(spoken[KEY]!.steps).toBeDefined()
    expect(shout([take()])).toEqual({ starts: [0.2, 1.3, 3.9], seconds: 5.5, kept: true })
  })

  it('are spread over the file by the words when the index names no starts for the take, as for any other line', () => {
    const bare = shout([take({ starts: undefined })])
    expect([bare.kept, bare.seconds, bare.starts.length]).toEqual([true, 5.5, 3])
    expect(bare.starts[0]).toBe(0)
    expect(bare.starts[2]!).toBeLessThan(5.5)
  })

  it('stay the stand-in for a take of other words and for a take of no length', () => {
    const none = shout([])
    for (const t of [take({ words: 'other words' }), take({ seconds: 0 })]) expect(shout([t])).toEqual(none)
  })

  it('make the mix lay the shout when its take is kept and leave it a silent stand-in when it is not', () => {
    expect(scriptStandIns([]).get(ID)).toBe(draft.standIn!.seconds)
    expect(scriptStandIns([take({ starts: undefined })]).has(ID)).toBe(false)
    expect(scriptStandIns([take({ words: 'other words' })]).get(ID)).toBe(draft.standIn!.seconds)
  })

  // Since the finish's camera holds the blast for the boss to leave in groups (merge 81), the body is gone later than the last word ends: the two are no longer one number.
  it('are the marks of the boss page: the first two charge marks and the fire mark are the starts the sound code uses, and the body is gone no sooner than the last word ends', () => {
    const now = lineTimes(KEY)!
    const peak = (now as { peak?: number }).peak ?? now.starts[2]!
    expect(SHOUT.fire).toBeCloseTo(SHOUT.lead + peak, 3)
    expect((SHOUT.beats[0] * peak) / SHOUT.fire).toBeCloseTo(now.starts[0]!, 2)
    expect((SHOUT.beats[1] * peak) / SHOUT.fire).toBeCloseTo(now.starts[1]!, 2)
    if (SHOUT.lead === 0 && peak === now.starts[2]) expect([SHOUT.beats[0], SHOUT.beats[1], SHOUT.fire]).toEqual(now.starts)
    expect(SHOUT.gone).toBeGreaterThanOrEqual(SHOUT.lead + now.seconds)
  })
})

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
  stopped: number | null = null
  onended: (() => void) | null = null
  offset = 0
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

// The live site's shout has two paths behind FINISH.onVoice of src/boss/tune.ts. Off: the file runs from the arms mark and the words step with the page's marks, as it was built.
// On: the file waits for the first charge mark, the visitor's press, and the words follow the file.
const sw = FINISH as { onVoice: boolean }

describe.each([[false, 'with the switch off, the path as it was built'], [true, 'with the switch on']])('the shout on the site (FINISH.onVoice %s: %s)', (on) => {
  beforeEach(() => {
    contexts = []
    sw.onVoice = on
    vi.stubGlobal('window', { AudioContext: FakeContext, setTimeout, clearTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    sw.onVoice = true
  })

  const site = async (lines: KeptLine[]) => {
    const enc = new TextEncoder()
    const index: SoundIndex = { version: 1, pack: { file: 'sfx.bin', bytes: 0 }, sfx: [], loops: [{ id: 'room-tone', file: 'room-tone.flac', seconds: 2, mime: 'audio/flac' }], lines: lines.map((l) => ({ ...l, file: `${l.id}.mp3`, mime: 'audio/mpeg' })) }
    const asked: string[] = []
    vi.stubGlobal('fetch', async (url: string) => {
      const name = url.replace('./audio/', '')
      asked.push(name)
      if (name === 'sfx.bin') return { ok: false, status: 404 }
      const bytes = enc.encode(name.replace(/\.(mp3|flac)$/, ''))
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) }
    })
    const s = makeSound({ base: './audio/', index })
    s.page('step4')
    await s.unlock()
    const ctx = contexts[contexts.length - 1]!
    const send = (name: string) => s.event({ name, x: 960, y: 540, hitsCursor: false, page: 'step4' }, 'live')
    const shown = () => s.said().lines.filter((l) => l.line === ID && l.start <= ctx.currentTime && ctx.currentTime < l.end).length
    return { s, ctx, send, shown, asked, voice: () => ctx.sources.filter((x) => x.buffer?.id === ID) }
  }

  // The marks of the page, sent at the starts the sound code holds for the line, from a start at 100 s.
  const run = async (lines: KeptLine[]) => {
    const x = await site(lines)
    const t = lineTimes(KEY, standIns(undefined, undefined, undefined, undefined, lines))!
    x.ctx.currentTime = 100
    x.send('finish-arms')
    for (const [k, at] of t.starts.entries()) {
      x.ctx.currentTime = 100 + at
      x.send(k < t.starts.length - 1 ? 'finish-charge' : 'finish-fire')
    }
    return { ...x, t }
  }

  // The shout's row has hidesOnRise (merge 82): its panel leaves when the camera's rise begins, riseAfterFire() after the fire mark, or when the line ends if that is sooner. The voice is not cut by it.
  const leaves = (t: { starts: number[]; seconds: number }) => Math.min(t.seconds, t.starts[t.starts.length - 1]! + riseAfterFire())

  it.runIf(!on)('with no take asks for no file of the shout, plays none, and holds the last phrase until the camera\'s rise begins after the fire mark, sooner than the stand-in ends', async () => {
    const { ctx, shown, asked, voice, t } = await run([])
    expect(t.kept).toBe(false)
    expect(asked).not.toContain(`${ID}.mp3`)
    expect(voice()).toEqual([])
    expect(leaves(t)).toBeLessThan(t.seconds)
    ctx.currentTime = 100 + leaves(t) - 0.01
    expect(shown()).toBe(1)
    ctx.currentTime = 100 + leaves(t) + 0.01
    expect(shown()).toBe(0)
  })

  it.runIf(on)('with a kept take plays nothing on the arms mark: the file starts once on the first charge mark, from the start of its first phrase, and each phrase is shown as the file reaches it', async () => {
    const x = await site([take({ peak: 4 })])
    const t = { starts: [0.2, 1.3, 3.9], peak: 4 }
    const run = t.peak - t.starts[0]!
    x.ctx.currentTime = 100
    x.send('finish-arms')
    x.ctx.currentTime = 102
    expect(x.voice()).toEqual([])
    expect(x.shown()).toBe(0)
    x.ctx.currentTime = 103
    x.send('finish-charge')
    expect(x.voice().map((v) => [v.started, v.offset])).toEqual([[103, t.starts[0]]])
    const words = () => x.s.said().lines.filter((l) => l.line === ID && l.start <= x.ctx.currentTime && x.ctx.currentTime < l.end).map((l) => l.step?.k)
    for (const [k, at] of t.starts.entries()) {
      x.ctx.currentTime = 103 + at - t.starts[0]! - 0.01
      expect(words()).toEqual(k === 0 ? [] : [k - 1])
      x.ctx.currentTime = 103 + at - t.starts[0]! + 0.01
      expect(words()).toEqual([k])
    }
    x.ctx.currentTime = 103.5
    x.send('finish-charge')
    x.ctx.currentTime = 103 + run
    x.send('finish-fire')
    expect(x.voice().map((v) => [v.started, v.offset, v.stopped])).toEqual([[103, t.starts[0], null]])
    expect(x.voice()[0]!.started! + t.peak - x.voice()[0]!.offset).toBeCloseTo(103 + run, 9)
    x.ctx.currentTime = 103 + run + riseAfterFire() - 0.01
    expect(x.shown()).toBe(1)
    x.ctx.currentTime = 103 + run + riseAfterFire() + 0.01
    expect(x.shown()).toBe(0)
    expect(x.s.log().filter((l) => l.line === ID).map((l) => l.what)).toEqual(['spoken'])
  })

  it.runIf(on)('with a kept take pressed as the arms come out waits for the camera: the file starts whole and its peak comes no sooner than the turn can end', async () => {
    const x = await site([take({ starts: [0.1, 0.66, 1.3], seconds: 4.01, peak: 1.85 })])
    const floor = SHOUT.arms + CAMERA.down[1] + CAMERA.stay + CAMERA.roundLive
    x.ctx.currentTime = 100
    x.send('finish-arms')
    x.send('finish-charge')
    const v = x.voice()
    expect(v.length).toBe(1)
    expect(v[0]!.started! + 1.85 - v[0]!.offset).toBeCloseTo(100 + Math.max(floor, 1.75), 9)
    expect(v[0]!.offset).toBeLessThanOrEqual(0.1)
    expect(v[0]!.started).toBeGreaterThanOrEqual(100)
  })

  it.runIf(on)('with no take shows the stand-in\'s phrases from the first charge mark on the stand-in\'s own times and plays no file', async () => {
    const x = await site([])
    const t = lineTimes(KEY, standIns(undefined, undefined, undefined, undefined, []))!
    x.ctx.currentTime = 100
    x.send('finish-arms')
    x.ctx.currentTime = 101
    x.send('finish-charge')
    expect(x.voice()).toEqual([])
    const words = () => x.s.said().lines.filter((l) => l.line === ID && l.start <= x.ctx.currentTime && x.ctx.currentTime < l.end).map((l) => l.step?.k)
    for (const [k, at] of t.starts.entries()) {
      x.ctx.currentTime = 101 + at - t.starts[0]! + 0.01
      expect(words()).toEqual([k])
    }
  })

  it.runIf(on)('in the film the shout is left as it was: the file runs from the arms mark', async () => {
    const x = await site([take()])
    x.ctx.currentTime = 100
    x.s.event({ name: 'finish-arms', x: 960, y: 540, hitsCursor: false, page: 'step4' }, 'film')
    expect(x.voice().map((v) => [v.started, v.offset])).toEqual([[100, 0]])
  })

  it.runIf(!on)('with a kept take plays its file from the arms mark and holds the last phrase until the rise begins after the take\'s own fire mark, not the stand-in\'s', async () => {
    const { ctx, shown, asked, voice, t } = await run([take()])
    expect(t).toEqual({ starts: [0.2, 1.3, 3.9], seconds: 5.5, kept: true })
    expect(asked).toContain(`${ID}.mp3`)
    expect(voice().map((v) => v.started)).toEqual([100])
    expect(leaves(t)).toBeLessThan(5.5)
    ctx.currentTime = 100 + leaves(t) - 0.01
    expect(shown()).toBe(1)
    ctx.currentTime = 100 + leaves(t) + 0.01
    expect(shown()).toBe(0)
    expect(leaves(t)).not.toBe(leaves({ starts: draft.standIn!.starts, seconds: draft.standIn!.seconds }))
  })

  it.runIf(!on)('with a kept take whose last phrase ends before the rise holds it to the end of the file, not of the stand-in', async () => {
    const seconds = 3.9 + riseAfterFire() / 2
    const { ctx, shown, voice, t } = await run([take({ seconds })])
    expect(t).toEqual({ starts: [0.2, 1.3, 3.9], seconds, kept: true })
    expect(voice().map((v) => v.started)).toEqual([100])
    expect(leaves(t)).toBe(seconds)
    ctx.currentTime = 100 + seconds - 0.01
    expect(shown()).toBe(1)
    ctx.currentTime = 100 + seconds + 0.01
    expect(shown()).toBe(0)
    expect(seconds).not.toBe(draft.standIn!.seconds)
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { changeCue } from '../src/audio/change'
import { LIVE } from '../src/audio/levels'
import { frameSample, mixFilm } from '../src/audio/mix'
import { SHOUT } from '../src/boss/tune'
import { config } from '../src/config'

// The one swell of the finish in the film's mix (the Builder's order of 28 November): where it is laid, from the events and the kept length alone.
// No sound is made or heard here. The swell is a file of three stretches of one sign each, so the place in the file can be read from the mix whatever the mix's level:
// a head of 0.1 s below zero, the rest of the body above zero, the tail below zero. The body ends where the sign turns from above to below.

const ID = 'finish-charge'
const ROW = changeCue(ID)!
const cut: { fps: number; events: { name: string; frame: number; x: number }[] } = JSON.parse(fs.readFileSync(path.join('cut', 'CUTLIST.json'), 'utf8'))
const sr = 48000
const fps = cut.fps
const tail = Math.round(ROW.lands!.tail * sr)
const head = Math.round(0.1 * sr)
const fade = Math.round(LIVE.loopFadeSeconds * sr)

const file = (seconds: number) => {
  const n = Math.round(seconds * sr)
  return { sampleRate: sr, channels: [Float32Array.from({ length: n }, (_, k) => (k < head || k >= n - tail ? -0.2 : 0.2))] }
}
const film = (events: { name: string; frame: number; x?: number }[], seconds: number, kept = ROW.seconds, has = true) => mixFilm({
  sampleRate: sr, fps, seconds, events: events.map((e) => ({ name: e.name, frame: e.frame, x: e.x ?? 960, page: 'step4' })), lines: [],
  sounds: new Map(has ? [[ID, file(kept)]] : []), sfx: config.audio.sfx as { id: string; seconds: number }[], duckDb: config.audio.duckDb, holdMusicSeconds: config.audio.holdMusicSeconds,
  targetLufs: config.audio.filmLoudnessLufs, truePeakDb: config.audio.truePeakDb, standIns: new Map()
})
type Mix = ReturnType<typeof mixFilm>
const sign = (r: Mix, i: number): number => Math.sign(r.sound.channels[0]![i]!)
const swells = (r: Mix) => r.placed.filter((p) => p.cue === ID)
const at = (frame: number): number => frameSample(frame, fps, sr)

describe('the swell in the film\'s mix', () => {
  const finish = cut.events.filter((e) => e.name.startsWith('finish-') || e.name === 'boss-gone')
  const shift = finish[0]!.frame - 30
  const own = finish.map((e) => ({ name: e.name, frame: e.frame - shift, x: e.x }))
  const arms = own.find((e) => e.name === 'finish-arms')!
  const fire = own.find((e) => e.name === 'finish-fire')!
  const n = Math.round(ROW.seconds * sr)
  const body = n - tail

  it('lays it once in the cut list\'s finish, the end of its body on the frame of the fire and its tail under the fire, and the charge marks lay nothing', () => {
    const r = film(own, (fire.frame + 120) / fps)
    const room = at(fire.frame) - at(arms.frame)
    const p = swells(r)
    console.info(`MEASURED film, the cut list: arms at frame ${arms.frame + shift}, fire at ${fire.frame + shift}, ${own.filter((e) => e.name === 'finish-charge').length} charge marks, ${Math.round((room / sr) * 1000) / 1000} s from the arms to the fire, body ${body / sr} s; the swell starts ${Math.round(((p[0]!.sample - at(arms.frame)) / sr) * 1000) / 1000} s after the arms (frame ${p[0]!.frame + shift}), ${Math.max(0, body - room) / sr} s into its file, lasts ${p[0]!.seconds} s`)
    expect(own.filter((e) => e.name === 'finish-charge').length).toBeGreaterThanOrEqual(1)
    expect(p.length).toBe(1)
    expect(r.placed.filter((x) => x.event === 'finish-charge' || x.event === 'finish-gather')).toEqual([])
    expect(p[0]!.event).toBe('finish-fire')
    expect(p[0]!.sample).toBe(at(fire.frame) - Math.min(body, room))
    expect(p[0]!.sample).toBeGreaterThanOrEqual(at(arms.frame))
    expect(sign(r, p[0]!.sample - 1)).toBe(0)
    expect(sign(r, at(fire.frame) - 1)).toBe(1)
    expect(sign(r, at(fire.frame))).toBe(-1)
    expect(sign(r, at(fire.frame) + tail - 1)).toBe(-1)
    expect(sign(r, at(fire.frame) + tail)).toBe(0)
    if (room >= body) {
      expect(sign(r, p[0]!.sample)).toBe(-1)
      expect(sign(r, p[0]!.sample + head)).toBe(1)
      expect(p[0]!.seconds).toBeCloseTo(n / sr, 9)
    }
  })

  it('holds the cut list to the mark the film on the site goes by: its fire is within one picture of SHOUT.fire after its arms', () => {
    const a = cut.events.find((e) => e.name === 'finish-arms')!
    const f = cut.events.find((e) => e.name === 'finish-fire')!
    console.info(`MEASURED the cut list has the fire ${Math.round(((f.frame - a.frame) / fps) * 1000) / 1000} s after the arms; SHOUT has it ${Math.round((SHOUT.fire - SHOUT.arms) * 1000) / 1000} s after`)
    expect(Math.abs((f.frame - a.frame) / fps - (SHOUT.fire - SHOUT.arms))).toBeLessThanOrEqual(1 / fps)
  })

  it('takes its start from the events and the kept length, whatever they are: every length of charge and of file puts the body\'s end on the fire', () => {
    for (const [gap, kept] of [[170, 3], [247, 3], [168, 3], [169, 3], [100, 3], [30, 3], [170, 2], [100, 4.5]] as const) {
      const why = `${gap} frames, ${kept} s`
      const a = 40
      const f = a + gap
      const r = film([{ name: 'finish-arms', frame: a }, { name: 'finish-charge', frame: a + 5 }, { name: 'finish-charge', frame: a + 20 }, { name: 'finish-fire', frame: f }], (f + 60) / fps, kept)
      const b = Math.round(kept * sr) - tail
      const p = swells(r)
      expect(p.length, why).toBe(1)
      expect(p[0]!.sample, why).toBe(Math.max(at(a), at(f) - b))
      expect(sign(r, p[0]!.sample - 1), why).toBe(0)
      expect(sign(r, at(f) - 1), why).toBe(1)
      expect(sign(r, at(f)), why).toBe(-1)
      expect(sign(r, at(f) + tail - 1), why).toBe(-1)
      expect(sign(r, at(f) + tail), why).toBe(0)
      expect(p[0]!.seconds, why).toBeCloseTo((Math.min(b, at(f) - at(a)) + tail) / sr, 9)
    }
  })

  it('starts later into itself when the charge is shorter than its body, coming in over the short fade, and never before the arms', () => {
    const a = 40
    const f = a + 100
    const r = film([{ name: 'finish-arms', frame: a }, { name: 'finish-fire', frame: f }], (f + 60) / fps)
    const skip = body - (at(f) - at(a))
    expect(skip).toBeGreaterThan(head)
    expect(swells(r)[0]!.sample).toBe(at(a))
    expect(sign(r, at(a) - 1)).toBe(0)
    expect(sign(r, at(a))).toBe(0)
    expect(sign(r, at(a) + 1)).toBe(1)
    const c = r.sound.channels[0]!
    expect(Math.abs(c[at(a) + fade / 4]!)).toBeLessThan(Math.abs(c[at(a) + fade / 2]!))
    expect(Math.abs(c[at(a) + fade / 2]!)).toBeLessThan(Math.abs(c[at(a) + fade]!))
    expect(sign(r, at(f) - 1)).toBe(1)
    expect(sign(r, at(f))).toBe(-1)
    expect(sign(r, at(f) + tail)).toBe(0)
  })

  it('is laid once for each finish, not at all for a fire with no arms before it, and not at all while its sound is not kept', () => {
    const two = film([{ name: 'finish-arms', frame: 30 }, { name: 'finish-fire', frame: 230 }, { name: 'finish-arms', frame: 500 }, { name: 'finish-charge', frame: 510 }, { name: 'finish-fire', frame: 600 }, { name: 'finish-fire', frame: 700 }], 14)
    expect(swells(two).map((p) => p.sample)).toEqual([at(230) - body, at(500)])
    expect(swells(film([{ name: 'finish-charge', frame: 20 }, { name: 'finish-fire', frame: 230 }], 6))).toEqual([])
    const none = film(own, (fire.frame + 120) / fps, ROW.seconds, false)
    expect(none.placed.filter((p) => p.kind === 'cue')).toEqual([])
    expect(none.missingCues).not.toContain(ID)
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { chain, decodeWav, encodeWav, fadeTimes, findHits, loudness, makeLoop, peak, repitch, rms, seam, truePeakDb, type Sound } from '../src/audio/dsp'
import { CHAIN, CLASS_LEVEL, db, toDb } from '../src/audio/levels'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const SR: number = cfg.audio.sampleRate

function noise(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2147483648 - 1
  }
}

function thud(seconds: number, lead: number, tail: number, seed = 7, level = 0.5): Sound {
  const n = Math.round((lead + seconds + tail) * SR)
  const x = new Float32Array(n)
  const from = Math.round(lead * SR)
  const len = Math.round(seconds * SR)
  const r = noise(seed)
  for (let i = 0; i < len; i++) {
    const t = i / SR
    x[from + i] = level * Math.exp(-t * (5 / seconds)) * (0.6 * Math.sin(2 * Math.PI * 180 * t) + 0.4 * r())
  }
  return { sampleRate: SR, channels: [x] }
}

function hum(seconds: number, seed = 3): Sound {
  const n = Math.round(seconds * SR)
  const x = new Float32Array(n)
  const r = noise(seed)
  let low = 0
  for (let i = 0; i < n; i++) {
    low += 0.02 * (r() - low)
    x[i] = 0.3 * low + 0.05 * Math.sin((2 * Math.PI * 97 * i) / SR + (i / n) * 3)
  }
  return { sampleRate: SR, channels: [x] }
}

describe('the chain every kept sound goes through', () => {
  it('trims the silence before and after', () => {
    const { sound, record } = chain(thud(0.3, 0.5, 0.8), { seconds: 0.4, cls: 'hit' })
    const length = sound.channels[0]!.length / SR
    expect(record.trimStart).toBeGreaterThan(0.49)
    expect(record.trimStart).toBeLessThanOrEqual(0.5)
    expect(length).toBeLessThan(0.32)
    expect(length).toBeGreaterThan(0.1)
  })

  it('gives a short fade in and a fade out, by the numbers of the chain', () => {
    const { sound, record } = chain(thud(0.3, 0.2, 0.2), { seconds: 0.4, cls: 'mechanism' })
    const x = sound.channels[0]!
    const length = x.length / SR
    expect(record.fadeInMs).toBe(CHAIN.fadeInMs)
    expect(record.fadeOutMs).toBeCloseTo(Math.max(CHAIN.fadeOutMinMs, Math.min(CHAIN.fadeOutMaxMs, length * 1000 * CHAIN.fadeOutShare)), 1)
    expect(Math.abs(x[0]!)).toBe(0)
    expect(Math.abs(x[x.length - 1]!)).toBe(0)
    expect(Math.abs(x[1]!)).toBeLessThan(0.01)
    expect(Math.abs(x[x.length - 2]!)).toBeLessThan(0.001)
  })

  it('keeps the fades inside a very short sound', () => {
    expect(fadeTimes(0.004)).toEqual({ inMs: 2, outMs: 2 })
    expect(fadeTimes(1).inMs).toBe(CHAIN.fadeInMs)
    expect(fadeTimes(1).outMs).toBe(CHAIN.fadeOutMaxMs)
    expect(fadeTimes(0.02).outMs).toBe(CHAIN.fadeOutMinMs)
  })

  it('cuts the lows', () => {
    const n = SR
    const x = new Float32Array(n)
    for (let i = 0; i < n; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 20 * i) / SR) + 0.05 * Math.sin((2 * Math.PI * 1000 * i) / SR)
    const { sound, record } = chain({ sampleRate: SR, channels: [x] }, { seconds: 1, cls: 'tone', loop: false })
    expect(record.lowCutHz).toBe(CHAIN.lowCutHz)
    const y = sound.channels[0]!
    const g = db(record.gainDb)
    const before = rms(x, SR / 4, (3 * SR) / 4)
    const after = rms(y, SR / 4, (3 * SR) / 4) / g
    expect(toDb(after / before)).toBeLessThan(-12)
  })

  it('sets each class to its level, room tone quietest, hits loudest', () => {
    const levelOf = (cls: 'tick' | 'mechanism' | 'hit' | 'music') => {
      const { sound, record } = chain(thud(0.3, 0.1, 0.1), { seconds: 0.4, cls })
      expect(record.levelDb).toBe(CLASS_LEVEL[cls].db)
      return toDb(peak(sound.channels[0]!))
    }
    expect(levelOf('tick')).toBeCloseTo(CLASS_LEVEL.tick.db, 3)
    expect(levelOf('mechanism')).toBeCloseTo(CLASS_LEVEL.mechanism.db, 3)
    expect(levelOf('hit')).toBeCloseTo(CLASS_LEVEL.hit.db, 3)
    expect(levelOf('music')).toBeCloseTo(CLASS_LEVEL.music.db, 3)
    const tone = chain(hum(6), { seconds: 5, cls: 'tone', loop: true })
    expect(toDb(rms(tone.sound.channels[0]!))).toBeCloseTo(CLASS_LEVEL.tone.db, 3)
    expect(toDb(peak(tone.sound.channels[0]!))).toBeLessThan(CLASS_LEVEL.tick.db)
    expect(CLASS_LEVEL.tick.db).toBeLessThan(CLASS_LEVEL.mechanism.db)
    expect(CLASS_LEVEL.mechanism.db).toBeLessThan(CLASS_LEVEL.hit.db)
    expect(CLASS_LEVEL.hit.db).toBeLessThan(0)
  })

  it('levels a line of the narrator by its loudness', () => {
    const n = 3 * SR
    const x = new Float32Array(n)
    const r = noise(11)
    for (let i = 0; i < n; i++) x[i] = 0.2 * Math.sin((2 * Math.PI * 220 * i) / SR) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 3 * i) / SR)) + 0.01 * r()
    const { sound, record } = chain({ sampleRate: SR, channels: [x] }, { seconds: 4, cls: 'voice' })
    expect(record.lowCutHz).toBe(CHAIN.voiceLowCutHz)
    expect(loudness(sound)).toBeCloseTo(CLASS_LEVEL.voice.db, 1)
  })

  it('holds a sound to the length its cue allows', () => {
    const { sound, record } = chain(thud(2, 0, 0), { seconds: 0.4, cls: 'hit' })
    expect(record.cutToSeconds).toBe(0.4)
    expect(sound.channels[0]!.length).toBe(Math.round(0.4 * SR))
    expect(Math.abs(sound.channels[0]![sound.channels[0]!.length - 1]!)).toBe(0)
  })

  it('is the same arithmetic every time', () => {
    const a = chain(thud(0.3, 0.2, 0.2), { seconds: 0.4, cls: 'hit' })
    const b = chain(thud(0.3, 0.2, 0.2), { seconds: 0.4, cls: 'hit' })
    expect(Buffer.from(encodeWav(a.sound)).equals(Buffer.from(encodeWav(b.sound)))).toBe(true)
    expect(a.record).toEqual(b.record)
  })
})

describe('a loop', () => {
  it('is crossfaded end into start and its seam holds by number', () => {
    const { sound, record } = chain(hum(7), { seconds: 5, cls: 'tone', loop: true })
    expect(record.loop).not.toBeNull()
    expect(record.loop!.crossMs).toBeCloseTo(Math.min(CHAIN.loopCrossMaxMs, 5000 * CHAIN.loopCrossShare), 0)
    expect(sound.channels[0]!.length).toBe(5 * SR)
    expect(record.loop!.seamStepDb).toBeLessThanOrEqual(CHAIN.loopSeamMaxStepDb)
    expect(Math.abs(record.loop!.seamLevelDb)).toBeLessThanOrEqual(CHAIN.loopSeamMaxLevelDb)
    expect(record.loop!.holds).toBe(true)
    expect(record.fadeInMs).toBe(0)
    expect(record.fadeOutMs).toBe(0)
  })

  it('has a seam that the number catches when it is not crossfaded', () => {
    const n = SR
    const x = new Float32Array(n)
    for (let i = 0; i < n; i++) x[i] = 0.4 * Math.sin((2 * Math.PI * 50.25 * i) / SR)
    expect(seam(x, SR).stepDb).toBeGreaterThan(CHAIN.loopSeamMaxStepDb)
    const made = makeLoop(x, SR)
    expect(seam(made.out, SR).stepDb).toBeLessThanOrEqual(CHAIN.loopSeamMaxStepDb)
    expect(made.out.length).toBe(n - made.cross)
  })
})

describe('the variants of one take', () => {
  it('are found as separate hits', () => {
    const parts = [thud(0.12, 0.2, 0.3, 1), thud(0.12, 0, 0.3, 2), thud(0.12, 0, 0.3, 3), thud(0.12, 0, 0.2, 4)]
    const total = parts.reduce((s, p) => s + p.channels[0]!.length, 0)
    const x = new Float32Array(total)
    let at = 0
    for (const p of parts) {
      x.set(p.channels[0]!, at)
      at += p.channels[0]!.length
    }
    const hits = findHits(x, SR)
    expect(hits.length).toBe(4)
    for (let i = 1; i < hits.length; i++) expect(hits[i]!.start).toBeGreaterThan(hits[i - 1]!.end)
    const cut = hits.map((h) => chain({ sampleRate: SR, channels: [x] }, { seconds: 0.15, cls: 'tick', from: h.start, to: h.end }))
    for (const c of cut) expect(toDb(peak(c.sound.channels[0]!))).toBeCloseTo(CLASS_LEVEL.tick.db, 3)
  })

  it('shift in pitch by a small fixed amount', () => {
    const x = thud(0.3, 0, 0).channels[0]!
    expect(repitch(x, 0)).toBe(x)
    expect(Math.abs(repitch(x, 35).length - x.length / Math.pow(2, 35 / 1200))).toBeLessThanOrEqual(1)
    expect(repitch(x, -45).length).toBeGreaterThan(x.length)
  })
})

describe('the sound files', () => {
  it('are read back as they were written', () => {
    const s = thud(0.2, 0.01, 0.01)
    const back = decodeWav(encodeWav(s, 24))
    expect(back.sampleRate).toBe(SR)
    expect(back.channels.length).toBe(1)
    expect(back.channels[0]!.length).toBe(s.channels[0]!.length)
    let worst = 0
    for (let i = 0; i < s.channels[0]!.length; i++) worst = Math.max(worst, Math.abs(back.channels[0]![i]! - s.channels[0]![i]!))
    expect(worst).toBeLessThan(1 / 8000000)
    expect(Buffer.from(encodeWav(back, 24)).equals(Buffer.from(encodeWav(s, 24)))).toBe(true)
  })

  it('measure a full scale sine as the standard says', () => {
    const n = 5 * SR
    const l = new Float32Array(n)
    for (let i = 0; i < n; i++) l[i] = Math.sin((2 * Math.PI * 997 * i) / SR)
    const s = { sampleRate: SR, channels: [l, Float32Array.from(l)] }
    expect(loudness(s)).toBeCloseTo(0, 1)
    expect(loudness({ sampleRate: SR, channels: [l] })).toBeCloseTo(-3.01, 1)
    expect(truePeakDb(s)).toBeGreaterThan(-0.1)
    expect(truePeakDb(s)).toBeLessThan(0.1)
  })
})

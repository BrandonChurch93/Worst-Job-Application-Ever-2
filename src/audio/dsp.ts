// The arithmetic of sound, with no browser and no file system: it runs the same in the tools, in the tests and nowhere on the site.
import type { CueClass } from './cues'
import { CHAIN, CLASS_LEVEL, MIX, db, toDb } from './levels'

export interface Sound { sampleRate: number; channels: Float32Array[] }

export const seconds = (s: Sound): number => (s.channels[0]?.length ?? 0) / s.sampleRate
export const silence = (sampleRate: number, length: number, channels = 1): Sound => ({ sampleRate, channels: Array.from({ length: channels }, () => new Float32Array(length)) })

export function toMono(s: Sound): Float32Array {
  const a = s.channels[0]!
  if (s.channels.length === 1) return a
  const out = new Float32Array(a.length)
  for (const c of s.channels) for (let i = 0; i < out.length; i++) out[i]! += c[i]! / s.channels.length
  return out
}

export function peak(x: Float32Array, from = 0, to = x.length): number {
  let p = 0
  for (let i = from; i < to; i++) {
    const v = Math.abs(x[i]!)
    if (v > p) p = v
  }
  return p
}

export function rms(x: Float32Array, from = 0, to = x.length): number {
  if (to <= from) return 0
  let sum = 0
  for (let i = from; i < to; i++) sum += x[i]! * x[i]!
  return Math.sqrt(sum / (to - from))
}

export function decodeWav(bytes: Uint8Array): Sound {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const tag = (o: number) => String.fromCharCode(bytes[o]!, bytes[o + 1]!, bytes[o + 2]!, bytes[o + 3]!)
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Not a WAV file')
  let format = 1
  let channels = 1
  let sampleRate = 48000
  let bits = 16
  let at = 12
  while (at + 8 <= bytes.length) {
    const id = tag(at)
    const size = v.getUint32(at + 4, true)
    const body = at + 8
    if (id === 'fmt ') {
      format = v.getUint16(body, true)
      channels = v.getUint16(body + 2, true)
      sampleRate = v.getUint32(body + 4, true)
      bits = v.getUint16(body + 14, true)
      if (format === 0xfffe && size >= 26) format = v.getUint16(body + 24, true)
    } else if (id === 'data') {
      const width = bits / 8
      const length = Math.floor(Math.min(size, bytes.length - body) / (width * channels))
      const out = Array.from({ length: channels }, () => new Float32Array(length))
      for (let i = 0; i < length; i++) {
        for (let c = 0; c < channels; c++) {
          const o = body + (i * channels + c) * width
          let s = 0
          if (format === 3) s = bits === 64 ? v.getFloat64(o, true) : v.getFloat32(o, true)
          else if (bits === 16) s = v.getInt16(o, true) / 32768
          else if (bits === 24) s = ((v.getInt8(o + 2) << 16) | (v.getUint8(o + 1) << 8) | v.getUint8(o)) / 8388608
          else if (bits === 32) s = v.getInt32(o, true) / 2147483648
          else if (bits === 8) s = (v.getUint8(o) - 128) / 128
          else throw new Error(`WAV with ${bits} bits is not read`)
          out[c]![i] = s
        }
      }
      return { sampleRate, channels: out }
    }
    at = body + size + (size % 2)
  }
  throw new Error('WAV file with no sound in it')
}

export function encodeWav(s: Sound, bits: number = MIX.bitsPerSample): Uint8Array {
  const channels = s.channels.length
  const length = s.channels[0]?.length ?? 0
  const width = bits / 8
  const size = length * channels * width
  const bytes = new Uint8Array(44 + size)
  const v = new DataView(bytes.buffer)
  const put = (o: number, t: string) => { for (let i = 0; i < 4; i++) bytes[o + i] = t.charCodeAt(i) }
  put(0, 'RIFF')
  v.setUint32(4, 36 + size, true)
  put(8, 'WAVE')
  put(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, channels, true)
  v.setUint32(24, s.sampleRate, true)
  v.setUint32(28, s.sampleRate * channels * width, true)
  v.setUint16(32, channels * width, true)
  v.setUint16(34, bits, true)
  put(36, 'data')
  v.setUint32(40, size, true)
  const full = bits === 16 ? 32767 : 8388607
  let o = 44
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      const q = Math.max(-full - 1, Math.min(full, Math.round(s.channels[c]![i]! * (full + 1))))
      if (bits === 16) v.setInt16(o, q, true)
      else {
        bytes[o] = q & 255
        bytes[o + 1] = (q >> 8) & 255
        bytes[o + 2] = (q >> 16) & 255
      }
      o += width
    }
  }
  return bytes
}

interface Biquad { b0: number; b1: number; b2: number; a1: number; a2: number }

function runBiquad(x: Float32Array | Float64Array, q: Biquad): Float64Array {
  const out = new Float64Array(x.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < x.length; i++) {
    const x0 = x[i]!
    const y0 = q.b0 * x0 + q.b1 * x1 + q.b2 * x2 - q.a1 * y1 - q.a2 * y2
    x2 = x1
    x1 = x0
    y2 = y1
    y1 = y0
    out[i] = y0
  }
  return out
}

function passFilter(kind: 'high' | 'low', sampleRate: number, hz: number, q = Math.SQRT1_2): Biquad {
  const w = (2 * Math.PI * hz) / sampleRate
  const alpha = Math.sin(w) / (2 * q)
  const cos = Math.cos(w)
  const a0 = 1 + alpha
  const b1 = kind === 'high' ? -(1 + cos) : 1 - cos
  const b0 = Math.abs(b1) / 2
  return { b0: b0 / a0, b1: b1 / a0, b2: b0 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
}

export const highPass = (x: Float32Array, sampleRate: number, hz: number): Float32Array => Float32Array.from(runBiquad(x, passFilter('high', sampleRate, hz)))
export const lowPass = (x: Float32Array, sampleRate: number, hz: number): Float32Array => Float32Array.from(runBiquad(x, passFilter('low', sampleRate, hz)))

// The two filters of the loudness measure, worked out for any sample rate.
function kWeight(x: Float32Array, sampleRate: number): Float64Array {
  const f0 = 1681.974450955533
  const g = 3.999843853973347
  const q0 = 0.7071752369554196
  const k = Math.tan((Math.PI * f0) / sampleRate)
  const vh = Math.pow(10, g / 20)
  const vb = Math.pow(vh, 0.4996667741545416)
  const a0 = 1 + k / q0 + k * k
  const shelf: Biquad = { b0: (vh + (vb * k) / q0 + k * k) / a0, b1: (2 * (k * k - vh)) / a0, b2: (vh - (vb * k) / q0 + k * k) / a0, a1: (2 * (k * k - 1)) / a0, a2: (1 - k / q0 + k * k) / a0 }
  const f1 = 38.13547087602444
  const q1 = 0.5003270373238773
  const k1 = Math.tan((Math.PI * f1) / sampleRate)
  const d = 1 + k1 / q1 + k1 * k1
  const high: Biquad = { b0: 1, b1: -2, b2: 1, a1: (2 * (k1 * k1 - 1)) / d, a2: (1 - k1 / q1 + k1 * k1) / d }
  return runBiquad(runBiquad(x, shelf), high)
}

// Integrated loudness in LUFS, gated as the broadcast standard says. A sound shorter than one block is measured whole.
export function loudness(s: Sound): number {
  const weighted = s.channels.slice(0, 2).map((c) => kWeight(c, s.sampleRate))
  const length = weighted[0]?.length ?? 0
  const block = Math.round(0.4 * s.sampleRate)
  const hop = Math.round(0.1 * s.sampleRate)
  const energy = (from: number, to: number) => {
    let sum = 0
    for (const c of weighted) for (let i = from; i < to; i++) sum += c[i]! * c[i]!
    return sum / (to - from)
  }
  const lufs = (e: number) => (e > 0 ? -0.691 + 10 * Math.log10(e) : -Infinity)
  if (length === 0) return -Infinity
  if (length < block) return lufs(energy(0, length))
  const blocks: number[] = []
  for (let from = 0; from + block <= length; from += hop) blocks.push(energy(from, from + block))
  const loud = blocks.filter((e) => lufs(e) > -70)
  if (!loud.length) return -Infinity
  const gate = lufs(loud.reduce((a, b) => a + b, 0) / loud.length) - 10
  const kept = loud.filter((e) => lufs(e) > gate)
  if (!kept.length) return -Infinity
  return lufs(kept.reduce((a, b) => a + b, 0) / kept.length)
}

const OVER = 4
const TAPS = 12
let phases: Float64Array[] | null = null

function overFilter(): Float64Array[] {
  if (phases) return phases
  const n = OVER * TAPS
  const mid = (n - 1) / 2
  const out = Array.from({ length: OVER }, () => new Float64Array(TAPS))
  for (let i = 0; i < n; i++) {
    const t = (i - mid) / OVER
    const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / n)
    out[i % OVER]![Math.floor(i / OVER)] = sinc * window
  }
  for (const p of out) {
    const sum = p.reduce((a, b) => a + b, 0)
    for (let i = 0; i < p.length; i++) p[i]! /= sum
  }
  phases = out
  return out
}

// For every sample, the highest level the wave reaches between it and its neighbours, over all channels.
export function peakEnvelope(channels: Float32Array[]): Float32Array {
  const filter = overFilter()
  const length = channels[0]?.length ?? 0
  const out = new Float32Array(length)
  const half = TAPS / 2
  for (const x of channels) {
    for (let i = 0; i < length; i++) {
      let top = Math.abs(x[i]!)
      for (let p = 0; p < OVER; p++) {
        const taps = filter[p]!
        let sum = 0
        for (let k = 0; k < TAPS; k++) {
          const j = i + k - half
          if (j >= 0 && j < length) sum += taps[k]! * x[j]!
        }
        const v = Math.abs(sum)
        if (v > top) top = v
      }
      if (top > out[i]!) out[i] = top
    }
  }
  return out
}

export const truePeakDb = (s: Sound): number => toDb(peak(peakEnvelope(s.channels.slice(0, 2))))

// Holds every peak under the ceiling with a gain that moves ahead of the peak and never jumps.
export function limit(channels: Float32Array[], envelope: Float32Array, ceiling: number, sampleRate: number): void {
  const length = envelope.length
  const half = Math.max(1, Math.round((MIX.limiterLookaheadMs / 1000) * sampleRate))
  const need = new Float32Array(length)
  let any = false
  for (let i = 0; i < length; i++) {
    const e = envelope[i]!
    need[i] = e > ceiling ? ceiling / e : 1
    if (e > ceiling) any = true
  }
  if (!any) return
  const low = new Float32Array(length)
  const queue = new Int32Array(length)
  let head = 0
  let tail = 0
  let next = 0
  for (let i = 0; i < length; i++) {
    const to = Math.min(length - 1, i + half)
    while (next <= to) {
      while (tail > head && need[queue[tail - 1]!]! >= need[next]!) tail--
      queue[tail++] = next++
    }
    while (queue[head]! < i - half) head++
    low[i] = need[queue[head]!]!
  }
  const sums = new Float64Array(length + 1)
  for (let i = 0; i < length; i++) sums[i + 1] = sums[i]! + low[i]!
  for (let i = 0; i < length; i++) {
    const from = Math.max(0, i - half)
    const to = Math.min(length, i + half + 1)
    const g = (sums[to]! - sums[from]!) / (to - from)
    for (const c of channels) c[i]! *= g
    envelope[i]! *= g
  }
}

export interface Mastered { lufs: number; truePeakDb: number; gainDb: number; silent: boolean }

// Levels a mix to the loudness asked for, with its peaks under the ceiling. It changes the channels in place.
export function master(s: Sound, targetLufs: number, ceilingDb: number): Mastered {
  const before = loudness(s)
  if (!Number.isFinite(before)) return { lufs: -Infinity, truePeakDb: -Infinity, gainDb: 0, silent: true }
  const ceiling = db(ceilingDb - MIX.limiterMarginDb)
  const envelope = peakEnvelope(s.channels)
  const scale = (g: number) => {
    for (const c of s.channels) for (let i = 0; i < c.length; i++) c[i]! *= g
    for (let i = 0; i < envelope.length; i++) envelope[i]! *= g
  }
  let total = targetLufs - before
  scale(db(total))
  for (let pass = 0; pass < MIX.levelPasses; pass++) {
    limit(s.channels, envelope, ceiling, s.sampleRate)
    const off = targetLufs - loudness(s)
    if (Math.abs(off) < 0.05) break
    total += off
    scale(db(off))
  }
  limit(s.channels, envelope, ceiling, s.sampleRate)
  let top = truePeakDb(s)
  if (top > ceilingDb) {
    const down = ceilingDb - top - 0.01
    for (const c of s.channels) for (let i = 0; i < c.length; i++) c[i]! *= db(down)
    total += down
    top = truePeakDb(s)
  }
  return { lufs: loudness(s), truePeakDb: top, gainDb: total, silent: false }
}

// Plays a sound faster or slower by a few cents, which is how a variant is varied again.
export function repitch(x: Float32Array, cents: number): Float32Array {
  if (cents === 0) return x
  const rate = Math.pow(2, cents / 1200)
  const length = Math.floor(x.length / rate)
  const out = new Float32Array(length)
  const at = (i: number) => (i < 0 || i >= x.length ? 0 : x[i]!)
  for (let i = 0; i < length; i++) {
    const p = i * rate
    const k = Math.floor(p)
    const t = p - k
    const a = at(k - 1)
    const b = at(k)
    const c = at(k + 1)
    const d = at(k + 2)
    out[i] = b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)))
  }
  return out
}

export interface Span { start: number; end: number }

// Where the sound is: the stretches that rise above a level under the peak, with short dips inside them joined.
export function loudSpans(x: Float32Array, sampleRate: number, underPeakDb: number, gapMs: number, minMs: number): (Span & { peak: number })[] {
  const win = Math.max(1, Math.round(0.002 * sampleRate))
  const top = peak(x)
  if (top === 0) return []
  const floor = top * db(underPeakDb)
  const gap = (gapMs / 1000) * sampleRate
  const out: (Span & { peak: number })[] = []
  for (let from = 0; from < x.length; from += win) {
    const to = Math.min(x.length, from + win)
    const p = peak(x, from, to)
    if (p < floor) continue
    const last = out[out.length - 1]
    if (last && from - last.end <= gap) {
      last.end = to
      if (p > last.peak) last.peak = p
    } else out.push({ start: from, end: to, peak: p })
  }
  return out.filter((s) => s.end - s.start >= (minMs / 1000) * sampleRate)
}

export const findHits = (x: Float32Array, sampleRate: number) => loudSpans(x, sampleRate, CHAIN.hitGapDb, CHAIN.hitGapMs, CHAIN.hitMinMs)

// The pauses inside a spoken line: quiet stretches between the first word and the last.
export function findPauses(x: Float32Array, sampleRate: number): Span[] {
  const spoken = loudSpans(x, sampleRate, CHAIN.pauseDb, 0, 0)
  const out: Span[] = []
  for (let i = 1; i < spoken.length; i++) {
    const a = spoken[i - 1]!
    const b = spoken[i]!
    if (b.start - a.end >= (CHAIN.pauseMinMs / 1000) * sampleRate) out.push({ start: a.end, end: b.start })
  }
  return out
}

export interface Measured {
  seconds: number
  start: number
  end: number
  peakDb: number
  rmsDb: number
  lufs: number
  truePeakDb: number
  low: number
  mid: number
  high: number
  tailDb: number
  hits: number
  hitsAt: { start: number; end: number; peakDb: number }[]
}

const round = (v: number, places = 3): number => (Number.isFinite(v) ? Math.round(v * 10 ** places) / 10 ** places : v)

// The numbers that stand in for ears.
export function measure(s: Sound): Measured {
  const x = toMono(s)
  const sr = s.sampleRate
  const top = peak(x)
  const sounding = loudSpans(x, sr, CHAIN.trimEndDb, 0, 0)
  const start = sounding.length ? sounding[0]!.start : 0
  const end = sounding.length ? sounding[sounding.length - 1]!.end : 0
  const all = rms(x) ** 2
  const low = rms(lowPass(x, sr, 250)) ** 2
  const high = rms(highPass(x, sr, 4000)) ** 2
  const share = (v: number) => (all > 0 ? round(Math.min(1, v / all)) : 0)
  const tailFrom = Math.max(start, Math.floor(end - (end - start) * 0.1))
  const hits = findHits(x, sr)
  return {
    seconds: round(x.length / sr), start: round(start / sr), end: round(end / sr), peakDb: round(toDb(top), 2), rmsDb: round(toDb(rms(x, start, end)), 2),
    lufs: round(loudness(s), 2), truePeakDb: round(truePeakDb(s), 2), low: share(low), mid: share(Math.max(0, all - low - high)), high: share(high),
    tailDb: round(toDb(rms(x, tailFrom, end)) - toDb(top), 2), hits: hits.length, hitsAt: hits.map((h) => ({ start: round(h.start / sr), end: round(h.end / sr), peakDb: round(toDb(h.peak), 2) }))
  }
}

export interface ChainOptions { seconds: number; cls: CueClass | 'voice'; loop?: boolean; from?: number; to?: number }
export interface ChainRecord {
  trimStart: number
  trimEnd: number
  cutToSeconds: number | null
  fadeInMs: number
  fadeOutMs: number
  lowCutHz: number
  levelMeasure: string
  levelDb: number
  gainDb: number
  channels: number
  loop: { crossMs: number; seamStepDb: number; seamLevelDb: number; holds: boolean; pulse?: { seconds: number; strength: number; pulses: number; offBy: number } } | null
}

export function fadeTimes(lengthSeconds: number): { inMs: number; outMs: number } {
  const outMs = Math.max(CHAIN.fadeOutMinMs, Math.min(CHAIN.fadeOutMaxMs, lengthSeconds * 1000 * CHAIN.fadeOutShare))
  return { inMs: Math.min(CHAIN.fadeInMs, lengthSeconds * 500), outMs: Math.min(outMs, lengthSeconds * 500) }
}

function levelOf(s: Sound, measureBy: 'peak' | 'rms' | 'lufs'): number {
  if (measureBy === 'lufs') return loudness(s)
  if (measureBy === 'rms') return toDb(Math.max(...s.channels.map((c) => rms(c))))
  return toDb(Math.max(...s.channels.map((c) => peak(c))))
}

// A loop is made by fading its end into its start, so the place where it repeats is in the middle of a blend.
export const loopCross = (lengthSeconds: number, sampleRate: number): number => Math.round(Math.min(CHAIN.loopCrossMaxMs / 1000, lengthSeconds * CHAIN.loopCrossShare) * sampleRate)

export function makeLoop(x: Float32Array, sampleRate: number, wanted: number = loopCross(x.length / sampleRate, sampleRate)): { out: Float32Array; cross: number } {
  const cross = Math.min(Math.floor(x.length / 2), wanted)
  const length = x.length - cross
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    if (i < cross) {
      const t = ((i + 0.5) / cross) * (Math.PI / 2)
      out[i] = x[length + i]! * Math.cos(t) + x[i]! * Math.sin(t)
    } else out[i] = x[i]!
  }
  return { out, cross }
}

// The seam of a loop by number: the step from the last sample to the first against the usual step, and the level round the seam against the whole.
export function seam(x: Float32Array, sampleRate: number): { stepDb: number; levelDb: number } {
  const n = x.length
  if (n < 4) return { stepDb: 0, levelDb: 0 }
  let sum = 0
  for (let i = 1; i < n; i++) sum += (x[i]! - x[i - 1]!) ** 2
  const usual = Math.sqrt(sum / (n - 1))
  const step = Math.abs(x[0]! - x[n - 1]!)
  const w = Math.min(Math.floor(n / 4), Math.round(0.05 * sampleRate))
  const near = Math.sqrt((rms(x, 0, w) ** 2 + rms(x, n - w, n) ** 2) / 2)
  const whole = rms(x)
  return { stepDb: usual > 0 ? toDb(step / usual) : step > 0 ? Infinity : -Infinity, levelDb: whole > 0 && near > 0 ? toDb(near / whole) : 0 }
}

// The steady pulse of a piece of music: the period, between the two limits, at which its onsets line up best,
// and how well they line up from 0 to 1. Found on the rise of the level, in steps of 2 ms.
export function pulse(x: Float32Array, sampleRate: number): { seconds: number; strength: number } {
  const hop = Math.max(1, Math.round((CHAIN.pulseStepMs / 1000) * sampleRate))
  const win = hop * 5
  const frames = Math.floor((x.length - win) / hop)
  if (frames < 8) return { seconds: 0, strength: 0 }
  const env = new Float64Array(frames)
  for (let f = 0; f < frames; f++) env[f] = rms(x, f * hop, f * hop + win)
  const rise = new Float64Array(frames)
  let total = 0
  for (let f = 1; f < frames; f++) {
    rise[f] = Math.max(0, env[f]! - env[f - 1]!)
    total += rise[f]!
  }
  if (!(total > 0)) return { seconds: 0, strength: 0 }
  const at = (period: number): number => {
    let re = 0
    let im = 0
    const w = (2 * Math.PI * hop) / sampleRate / period
    for (let f = 1; f < frames; f++) {
      re += rise[f]! * Math.cos(w * f)
      im += rise[f]! * Math.sin(w * f)
    }
    return Math.hypot(re, im) / total
  }
  let best = { seconds: 0, strength: 0 }
  for (let p = CHAIN.pulseMinSeconds; p <= CHAIN.pulseMaxSeconds; p += 0.0005) {
    const v = at(p)
    if (v > best.strength) best = { seconds: p, strength: v }
  }
  for (let p = best.seconds - 0.0005; p <= best.seconds + 0.0005; p += 0.00002) {
    const v = at(p)
    if (v > best.strength) best = { seconds: p, strength: v }
  }
  return best
}

// The level round the seam of a pulsed loop against the level at every other pulse of it, so that a rest between two notes is not read as a dip.
export function seamAgainstPulse(x: Float32Array, sampleRate: number, pulseSeconds: number): number {
  const n = x.length
  const w = Math.round(0.05 * sampleRate)
  const period = pulseSeconds * sampleRate
  const count = Math.round(n / period)
  if (count < 2 || n < 4 * w) return 0
  const round2 = (k: number): number => {
    const c = Math.round(k * period)
    let sum = 0
    for (let i = -w; i < w; i++) sum += x[(((c + i) % n) + n) % n]! ** 2
    return sum / (2 * w)
  }
  let others = 0
  for (let k = 1; k < count; k++) others += round2(k)
  const near = Math.sqrt(round2(0))
  const usual = Math.sqrt(others / (count - 1))
  if (!(usual > 0)) return 0
  return near > 0 ? toDb(near / usual) : -Infinity
}

// The one chain every kept sound goes through: trim the silence, a short fade in, a fade out, a low cut, then the level of its class.
export function chain(input: Sound, o: ChainOptions): { sound: Sound; record: ChainRecord } {
  const sr = input.sampleRate
  const stereo = o.cls === 'tone' && input.channels.length > 1
  let channels: Float32Array[] = stereo ? input.channels.slice(0, 2).map((c) => Float32Array.from(c)) : [Float32Array.from(toMono(input))]
  const guide = toMono({ sampleRate: sr, channels })
  const from = o.from ?? 0
  const to = o.to ?? guide.length
  const region = guide.subarray(from, to)
  const top = peak(region)
  let start = 0
  let end = region.length
  if (top > 0) {
    const first = loudSpans(region, sr, CHAIN.trimStartDb, 0, 0)[0]
    const sounding = loudSpans(region, sr, CHAIN.trimEndDb, 0, 0)
    if (first) start = Math.max(0, first.start - Math.round((CHAIN.preRollMs / 1000) * sr))
    if (sounding.length) end = sounding[sounding.length - 1]!.end
  }
  let crossWanted = o.loop ? loopCross(o.seconds, sr) : 0
  let most = Math.round(o.seconds * sr) + crossWanted
  let beat: { seconds: number; strength: number; pulses: number; offBy: number } | null = null
  if (o.loop && o.cls === 'music') {
    const found = pulse(region.subarray(start, end), sr)
    if (found.strength >= CHAIN.pulseMinStrength) {
      const period = found.seconds * sr
      const room = Math.min(end - start, Math.round(o.seconds * sr)) - period
      let pulses = Math.floor(room / period)
      for (const group of CHAIN.pulseGroups) {
        if (pulses >= group) {
          pulses -= pulses % group
          break
        }
      }
      if (pulses >= 1) {
        const length = Math.round(pulses * period)
        crossWanted = Math.round(period)
        most = length + crossWanted
        beat = { seconds: round(found.seconds, 4), strength: round(found.strength, 2), pulses, offBy: round(Math.abs(length / period - pulses), 3) }
      }
    }
  }
  let cut: number | null = null
  if (end - start > most) {
    end = start + most
    cut = beat ? round(beat.pulses * beat.seconds) : o.seconds
  }
  channels = channels.map((c) => c.slice(from + start, from + end))

  const lowCutHz = o.cls === 'voice' ? CHAIN.voiceLowCutHz : CHAIN.lowCutHz
  channels = channels.map((c) => highPass(c, sr, lowCutHz))

  let loop: ChainRecord['loop'] = null
  const length = (channels[0]?.length ?? 0) / sr
  const fades = o.loop ? { inMs: 0, outMs: 0 } : fadeTimes(length)
  if (o.loop) {
    let cross = 0
    channels = channels.map((c) => {
      const made = makeLoop(c, sr, crossWanted)
      cross = made.cross
      return made.out
    })
    const whole = toMono({ sampleRate: sr, channels })
    const at = seam(whole, sr)
    const levelDb = beat ? seamAgainstPulse(whole, sr, beat.seconds) : at.levelDb
    loop = { crossMs: round((cross / sr) * 1000, 1), seamStepDb: round(at.stepDb, 2), seamLevelDb: round(levelDb, 2), holds: at.stepDb <= CHAIN.loopSeamMaxStepDb && Math.abs(levelDb) <= CHAIN.loopSeamMaxLevelDb && (!beat || beat.offBy <= CHAIN.pulseMaxOffBy), ...(beat ? { pulse: beat } : {}) }
  } else {
    const fin = Math.round((fades.inMs / 1000) * sr)
    const fout = Math.round((fades.outMs / 1000) * sr)
    for (const c of channels) {
      for (let i = 0; i < fin && i < c.length; i++) c[i]! *= i / fin
      for (let i = 0; i < fout && i < c.length; i++) c[c.length - 1 - i]! *= i / fout
    }
  }

  const want = CLASS_LEVEL[o.cls]
  const sound: Sound = { sampleRate: sr, channels }
  const now = levelOf(sound, want.measure)
  const gainDb = Number.isFinite(now) ? want.db - now : 0
  const g = db(gainDb)
  for (const c of channels) for (let i = 0; i < c.length; i++) c[i]! *= g
  return {
    sound,
    record: {
      trimStart: round((from + start) / sr), trimEnd: round((from + end) / sr), cutToSeconds: cut, fadeInMs: round(fades.inMs, 2), fadeOutMs: round(fades.outMs, 2), lowCutHz,
      levelMeasure: want.measure, levelDb: want.db, gainDb: round(gainDb, 2), channels: channels.length, loop
    }
  }
}

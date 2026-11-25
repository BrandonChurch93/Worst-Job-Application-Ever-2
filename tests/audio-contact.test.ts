import { describe, expect, it } from 'vitest'
import { chain } from '../src/audio/dsp'
import { CHAIN } from '../src/audio/levels'

const sr = 48000

function lateHit(leadSeconds: number, seconds: number): Float32Array {
  const x = new Float32Array(Math.round(seconds * sr))
  let s = 11
  for (let i = 0; i < x.length; i++) {
    s = (s * 16807) % 2147483647
    x[i] = (s / 2147483647 - 0.5) * 0.02
  }
  const at = Math.round(leadSeconds * sr)
  for (let i = 0; at + i < x.length; i++) x[at + i]! += 0.8 * Math.exp(-i / (0.01 * sr)) * Math.sin((2 * Math.PI * 900 * i) / sr)
  return x
}

const onsetMs = (x: Float32Array): number => {
  let top = 0
  for (const v of x) top = Math.max(top, Math.abs(v))
  let i = 0
  while (i < x.length && Math.abs(x[i]!) < top * 10 ** (CHAIN.contactStartDb / 20)) i++
  return (i / sr) * 1000
}

describe('a short contact starts on its contact', () => {
  it('cuts the quiet lead in of a short tick and of a short hit', () => {
    for (const cls of ['tick', 'hit'] as const) {
      const made = chain({ sampleRate: sr, channels: [lateHit(0.08, 0.3)] }, { seconds: 0.15, cls })
      expect(onsetMs(made.sound.channels[0]!)).toBeLessThanOrEqual(CHAIN.contactLeadMs + 1)
      expect(made.record.trimStart).toBeGreaterThan(0.07)
    }
  })

  it('keeps the lead in of a mechanism and of a long tick', () => {
    const mech = chain({ sampleRate: sr, channels: [lateHit(0.08, 0.3)] }, { seconds: 0.25, cls: 'mechanism' })
    expect(onsetMs(mech.sound.channels[0]!)).toBeGreaterThan(60)
    const long = chain({ sampleRate: sr, channels: [lateHit(0.08, 1.2)] }, { seconds: CHAIN.contactMaxSeconds, cls: 'tick' })
    expect(onsetMs(long.sound.channels[0]!)).toBeGreaterThan(60)
  })
})

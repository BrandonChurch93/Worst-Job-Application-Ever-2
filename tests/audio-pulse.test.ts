import { describe, expect, it } from 'vitest'
import { chain, pulse, seamAgainstPulse } from '../src/audio/dsp'
import { CHAIN } from '../src/audio/levels'

const sr = 48000

function clicks(seconds: number, period: number, tone = 440): Float32Array {
  const x = new Float32Array(Math.round(seconds * sr))
  const hit = Math.round(0.06 * sr)
  for (let k = 0; k * period < seconds; k++) {
    const at = Math.round(k * period * sr)
    for (let i = 0; i < hit && at + i < x.length; i++) x[at + i] = 0.5 * Math.exp(-i / (0.012 * sr)) * Math.sin((2 * Math.PI * tone * (1 + (k % 4) * 0.25) * i) / sr)
  }
  return x
}

describe('the pulse of a loop of music', () => {
  it('finds the period of a steady pulse to a tenth of a millisecond', () => {
    for (const period of [0.2142, 0.25, 0.5]) {
      const p = pulse(clicks(8, period), sr)
      expect(Math.abs(p.seconds - period)).toBeLessThan(0.0002)
      expect(p.strength).toBeGreaterThan(CHAIN.pulseMinStrength)
    }
  })

  it('finds no pulse in silence and none in a steady tone', () => {
    expect(pulse(new Float32Array(sr * 4), sr).strength).toBe(0)
    const tone = new Float32Array(sr * 4)
    for (let i = 0; i < tone.length; i++) tone[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / sr)
    expect(pulse(tone, sr).strength).toBeLessThan(CHAIN.pulseMinStrength)
  })

  it('cuts a loop of music to whole groups of pulses, blended over one pulse', () => {
    const period = 0.2142
    const made = chain({ sampleRate: sr, channels: [clicks(8, period)] }, { seconds: 8, cls: 'music', loop: true })
    const loop = made.record.loop!
    expect(loop.pulse!.pulses).toBe(32)
    expect(loop.pulse!.offBy).toBeLessThanOrEqual(CHAIN.pulseMaxOffBy)
    expect(Math.abs(made.sound.channels[0]!.length / sr - 32 * period)).toBeLessThan(0.01)
    expect(Math.abs(loop.crossMs - period * 1000)).toBeLessThan(1)
    expect(loop.holds).toBe(true)
    const twice = new Float32Array(made.sound.channels[0]!.length * 2)
    twice.set(made.sound.channels[0]!)
    twice.set(made.sound.channels[0]!, made.sound.channels[0]!.length)
    const again = pulse(twice, sr)
    expect(Math.abs(again.seconds - period)).toBeLessThan(0.0003)
    expect(again.strength).toBeGreaterThan(pulse(clicks(8, period), sr).strength - 0.05)
  })

  it('leaves a loop that is not music to the plain blend', () => {
    const noise = new Float32Array(sr * 4)
    let s = 7
    for (let i = 0; i < noise.length; i++) {
      s = (s * 16807) % 2147483647
      noise[i] = (s / 2147483647 - 0.5) * 0.2
    }
    const made = chain({ sampleRate: sr, channels: [noise] }, { seconds: 3, cls: 'mechanism', loop: true })
    expect(made.record.loop!.pulse).toBeUndefined()
    expect(Math.abs(made.sound.channels[0]!.length / sr - 3)).toBeLessThan(0.01)
  })

  it('reads a rest at the seam against the other pulses, not against the whole', () => {
    const x = clicks(32 * 0.25, 0.25)
    expect(Math.abs(seamAgainstPulse(x, sr, 0.25))).toBeLessThan(CHAIN.loopSeamMaxLevelDb)
    const dipped = Float32Array.from(x)
    for (let i = 0; i < 0.05 * sr; i++) dipped[i] = 0
    expect(seamAgainstPulse(dipped, sr, 0.25)).toBeLessThan(-CHAIN.loopSeamMaxLevelDb)
  })
})

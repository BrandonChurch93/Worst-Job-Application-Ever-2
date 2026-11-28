import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { FEEL } from '../src/cursor/act/feel'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

interface Sample { t: number; x: number; y: number; speed: number; squash: number; lean: number; spin: number; acting: string; reaction: string | null }

function trace(): Sample[] {
  const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const out: Sample[] = []
  for (let i = 1; i <= 32 * stepHz; i++) {
    s.advance(1)
    const p = s.cursor.pose()
    out.push({ t: i / stepHz, x: p.x, y: p.y, speed: s.cursor.speed, squash: p.squash, lean: p.lean, spin: p.spin, acting: p.acting, reaction: p.reaction ?? null })
  }
  return out
}

const MAIL_TO = config.film.beats.find((b) => b.id === 'step1.email')!.to
const inMail = (seconds: number): number => seconds - 20 + MAIL_TO
const all = trace()
const span = (from: number, to: number): Sample[] => all.filter((p) => p.t >= from && p.t <= to)
const still = (list: Sample[], within = 4): boolean => list.every((p) => Math.hypot(p.x - list[0]!.x, p.y - list[0]!.y) <= within)

describe('the held poses of step 1 outside the tug', () => {
  it('sits back small and still while the keyboard rises, for 0.25 s before the first key', () => {
    const hold = span(1.85, 2.1)
    expect(still(hold)).toBe(true)
    for (const p of hold) {
      expect(p.reaction).toBe('rear')
      expect(p.squash).toBeLessThan(0.85)
      expect(p.lean + p.spin).toBeLessThan(-0.5)
    }
  })

  it('is squashed in the first frames of the hit and then holds one tall recoil, still, to the dash', () => {
    const blow = span(6.8, 6.84)
    expect(Math.min(...blow.map((p) => p.squash))).toBeLessThan(0.8)
    const hold = span(7.02, 7.27)
    expect(still(hold)).toBe(true)
    for (const p of hold) {
      expect(p.acting).toBe('shocked')
      expect(p.reaction).toBe('recoil')
      expect(p.speed).toBeLessThan(60)
      expect(p.squash).toBeGreaterThan(1.15)
      expect(p.lean).toBeLessThan(-0.4)
      expect(Math.abs(p.spin)).toBeLessThan(0.2)
    }
    const turns = span(6.8, 7.31).map((p) => p.spin)
    let flips = 0
    for (let i = 2; i < turns.length; i++) if ((turns[i]! - turns[i - 1]!) * (turns[i - 1]! - turns[i - 2]!) < -1e-6) flips++
    expect(flips).toBeLessThanOrEqual(2)
  })

  it('stands nervous and still on Enter before the first slab is seen', () => {
    const hold = span(inMail(17.3), inMail(17.39))
    expect(still(hold)).toBe(true)
    for (const p of hold) expect(p.acting).toBe('nervous')
  })

  it('holds a cower under each slab in a different place', () => {
    const first = span(inMail(18.38), inMail(18.57))
    const second = span(inMail(19.1), inMail(19.4))
    for (const hold of [first, second]) {
      expect(still(hold)).toBe(true)
      for (const p of hold) {
        expect(p.acting).toBe('scared')
        expect(p.reaction).toBe('cower')
        expect(p.squash).toBeLessThan(0.75)
      }
    }
    expect(Math.hypot(first[0]!.x - second[0]!.x, first[0]!.y - second[0]!.y)).toBeGreaterThan(300)
  })

  it('asks the form for a sag that stays an arrow: a bend of 0.4 at the most and the melt the form is tuned at', () => {
    expect(FEEL.exhausted.bend).toBeLessThanOrEqual(0.4)
    expect(FEEL.exhausted.melt).toBe(0.6)
    expect(FEEL.exhausted.stretch).toBeGreaterThanOrEqual(0.8)
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EFFECT_MIN_SECONDS, WORST, addRow, allow, effectSeconds, emptyLedger, estimate, limits, sheetOf, totalOf } from '../tools/credits.mjs'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const spent = (n: number): any => {
  const l: any = emptyLedger()
  addRow(l, { time: 't', endpoint: 'e', what: 'w', asked: 'a', answer: 'HTTP 200', cost: n, how: 'h' })
  return l
}

describe('the cap on sound credits', () => {
  it('reads the cap, the reserve and the extras line from the config', () => {
    const L = limits(cfg, emptyLedger())
    expect(L.cap).toBe(cfg.audio.creditCap)
    expect(L.limit).toBe(cfg.audio.creditCap - cfg.audio.creditReserveAfterReview)
    expect(L.extrasStop).toBe(cfg.audio.creditCap * cfg.audio.creditExtrasStopFraction)
    const after: any = emptyLedger()
    after.reviewReached = true
    expect(limits(cfg, after).limit).toBe(cfg.audio.creditCap)
  })

  it('never allows a sound effect without a length', () => {
    const l = emptyLedger()
    expect(allow({ kind: 'effect', what: 'x', prompt: 'a knock' }, l, cfg).ok).toBe(false)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'a knock', seconds: Number.NaN }, l, cfg).ok).toBe(false)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'a knock', seconds: 0 }, l, cfg).ok).toBe(false)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'a knock', seconds: 0.4 }, l, cfg).ok).toBe(true)
  })

  it('asks for a short cue at the shortest length the endpoint makes', () => {
    expect(effectSeconds(0.15)).toBe(EFFECT_MIN_SECONDS)
    expect(effectSeconds(4)).toBe(4)
    expect(estimate({ kind: 'effect', seconds: 0.15 }, emptyLedger())).toBe(Math.ceil(EFFECT_MIN_SECONDS * WORST.effect))
  })

  it('checks a call at the dearest known rate until the rate is measured', () => {
    const l: any = emptyLedger()
    expect(estimate({ kind: 'speech', text: 'x'.repeat(40) }, l)).toBe(40 * WORST.speech)
    l.rates.speech = { perCharacter: 0.5, how: 'measured' }
    expect(estimate({ kind: 'speech', text: 'x'.repeat(40) }, l)).toBe(20)
    l.rates.effect = { perSecond: 20, how: 'measured' }
    expect(estimate({ kind: 'effect', seconds: 2 }, l)).toBe(40)
  })

  it('makes no call that would pass the cap less the reserve', () => {
    const limit = cfg.audio.creditCap - cfg.audio.creditReserveAfterReview
    const near = spent(limit - 10)
    expect(allow({ kind: 'speech', what: 'x', text: 'ten chars.' }, near, cfg).ok).toBe(true)
    expect(allow({ kind: 'speech', what: 'x', text: 'eleven char' }, near, cfg).ok).toBe(false)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'p', seconds: 0.5 }, near, cfg).ok).toBe(false)
    near.reviewReached = true
    expect(allow({ kind: 'effect', what: 'x', prompt: 'p', seconds: 0.5 }, near, cfg).ok).toBe(true)
    expect(allow({ kind: 'speech', what: 'x', text: 'y' }, spent(cfg.audio.creditCap), cfg).ok).toBe(false)
  })

  it('makes nothing extra once the extras line is passed', () => {
    const past: any = spent(cfg.audio.creditCap * cfg.audio.creditExtrasStopFraction + 1)
    past.reviewReached = true
    expect(allow({ kind: 'effect', what: 'x', prompt: 'p', seconds: 0.5, extra: true }, past, cfg).ok).toBe(false)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'p', seconds: 0.5 }, past, cfg).ok).toBe(true)
    expect(allow({ kind: 'effect', what: 'x', prompt: 'p', seconds: 0.5, extra: true }, spent(100), cfg).ok).toBe(true)
  })

  it('keeps a running total and writes a row for every call', () => {
    const l: any = emptyLedger()
    addRow(l, { time: 't1', endpoint: 'GET /v1/user/subscription', what: 'quota', asked: 'a read', answer: 'ok', cost: 0, how: 'free' })
    addRow(l, { time: 't2', endpoint: 'POST /v1/text-to-speech', what: 'a line | take 1', asked: '40 characters', answer: 'HTTP 200', cost: 20, how: 'reported' })
    addRow(l, { time: 't3', endpoint: 'POST /v1/sound-generation', what: 'cue step', asked: '0.5 s', answer: 'HTTP 200', cost: 6, how: 'reported' })
    expect(totalOf(l)).toBe(26)
    const sheet = sheetOf(l, cfg)
    expect(sheet).toContain(`Running total: 26 of ${cfg.audio.creditCap}. Calls: 3.`)
    expect(sheet.split('\n').filter((x: string) => /^\| \d+ \|/.test(x)).length).toBe(3)
    expect(sheet).toContain('| 3 | t3 | POST /v1/sound-generation | cue step | 0.5 s | HTTP 200 | 6 | reported | 26 |')
    expect(sheet).toContain('a line / take 1')
    expect(sheet).not.toMatch(/\u2014/)
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { approveReview, continueBuild, elapsed, markStatus, newState, start, tickExtension, tickPhase, tickReviewRound, totals } from '../tools/lib/clock-core.mjs'

const cfg: any = JSON.parse(readFileSync(path.join(process.cwd(), 'config', 'showcase.json'), 'utf8'))
const budget = cfg.budget
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const T0 = Date.UTC(2026, 10, 24, 12, 0, 0)
const BOOT = 'boot-one'
const OTHER_BOOT = 'boot-two'
const phaseKeys = Object.keys(budget.phaseHours).sort((a, b) => Number(a) - Number(b))
const lastBuildPhase = Number(phaseKeys[phaseKeys.length - 1])
const hours = (h: number) => Math.round(h * HOUR)
const fmt = (h: number) => h.toFixed(2)
const fresh = (): any => newState()
const quiet = { status: true }
const without = (state: any, ...keys: string[]) => {
  const copy = structuredClone(state)
  for (const k of keys) delete copy[k]
  return copy
}
const line = (lines: string[], head: string) => lines.find((l) => l.startsWith(head))
const boxesBefore = (n: number) => phaseKeys.filter((k) => Number(k) < n).reduce((s, k) => s + budget.phaseHours[k], 0)

function started(): { state: any; t: number } {
  const state = fresh()
  start(state, cfg, T0, BOOT)
  return { state, t: T0 }
}

function fillBefore(state: any, n: number, from: number): number {
  let t = from
  for (const k of phaseKeys) {
    if (Number(k) >= n) break
    t += hours(budget.phaseHours[k])
    tickPhase(state, cfg, Number(k), t, BOOT, quiet)
  }
  return t
}

function reviewed(): { state: any; t: number } {
  const { state, t: t0 } = started()
  let t = fillBefore(state, lastBuildPhase, t0)
  t += HOUR
  tickPhase(state, cfg, lastBuildPhase, t, BOOT, quiet)
  t += 5 * HOUR
  approveReview(state, cfg, t, BOOT)
  return { state, t }
}

describe('the config the clock reads', () => {
  it('has the budget numbers these tests are built on', () => {
    expect(phaseKeys.length).toBeGreaterThan(1)
    expect(lastBuildPhase).toBe(5)
    expect(phaseKeys.reduce((s, k) => s + budget.phaseHours[k], 0)).toBeCloseTo(budget.runHours, 9)
    expect(budget.reserveHours['5']).toBeGreaterThan(0)
    expect(budget.reserveHours['5']).toBeLessThan(budget.phaseHours['5'])
    expect(budget.reserveHours['6']).toBeGreaterThan(0)
    expect(budget.reserveHours['6']).toBeLessThan(budget.afterReviewHours)
    expect(budget.statusMaxGapMinutes).toBeGreaterThan(0)
  })
})

describe('--start', () => {
  it('adds nothing on a new clock', () => {
    const state = fresh()
    const lines = start(state, cfg, T0, BOOT)
    expect(lines).toContain('no time added')
    const t = totals(state, cfg)
    expect(t.beforeReviewUsed).toBe(0)
    expect(t.afterReviewUsed).toBe(0)
    expect(t.reviewRoundsUsed).toBe(0)
    expect(t.extensionsUsed).toBe(0)
    expect(t.beforeReviewAllowed).toBe(budget.runHours)
    expect(t.afterReviewAllowed).toBe(budget.afterReviewHours)
  })

  it('adds nothing for the time since the last tick, and the next tick counts from it', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + 20 * MINUTE, BOOT)
    const before = totals(state, cfg)
    const phaseBefore = structuredClone(state.phaseSeconds)
    start(state, cfg, T0 + 9 * HOUR, BOOT)
    expect(totals(state, cfg)).toEqual(before)
    expect(state.phaseSeconds).toEqual(phaseBefore)
    tickPhase(state, cfg, 0, T0 + 9 * HOUR + 10 * MINUTE, BOOT)
    expect(state.phaseSeconds['0']).toBe(30 * 60)
    expect(totals(state, cfg).beforeReviewUsed).toBeCloseTo(0.5, 9)
  })
})

describe('a tick on a new machine boot', () => {
  it('adds nothing', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + 10 * MINUTE, BOOT)
    const before = totals(state, cfg)
    tickPhase(state, cfg, 0, T0 + 7 * HOUR, OTHER_BOOT)
    expect(totals(state, cfg)).toEqual(before)
    expect(state.phaseSeconds['0']).toBe(10 * 60)
  })

  it('is the mark the next tick on that boot counts from', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + 10 * MINUTE, BOOT)
    tickPhase(state, cfg, 0, T0 + 7 * HOUR, OTHER_BOOT)
    tickPhase(state, cfg, 0, T0 + 7 * HOUR + 25 * MINUTE, OTHER_BOOT)
    expect(state.phaseSeconds['0']).toBe(35 * 60)
  })

  it('adds nothing to a review round or an extension either', () => {
    const { state } = started()
    tickReviewRound(state, cfg, 1, T0 + MINUTE, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 3 * HOUR, OTHER_BOOT)
    expect(totals(state, cfg).reviewRoundsUsed).toBe(0)
    tickExtension(state, cfg, 1, T0 + 4 * HOUR, OTHER_BOOT)
    tickExtension(state, cfg, 1, T0 + 9 * HOUR, BOOT)
    expect(totals(state, cfg).extensionsUsed).toBe(0)
  })

  it('counts nothing when there is no mark at all', () => {
    const state = fresh()
    expect(elapsed(state, T0, BOOT)).toBe(0)
    tickPhase(state, cfg, 0, T0, BOOT)
    expect(totals(state, cfg).beforeReviewUsed).toBe(0)
  })

  it('reads a gap as zero on another boot and in full on the same one', () => {
    const { state } = started()
    expect(elapsed(state, T0 + 90 * SECOND, OTHER_BOOT)).toBe(0)
    expect(elapsed(state, T0 + 90 * SECOND, BOOT)).toBe(90)
  })
})

describe('every other gap', () => {
  it('is counted in full, short or long, to the phase that ticks', () => {
    const { state } = started()
    const gaps: [number, number][] = [[0, 1 * SECOND], [0, 17 * MINUTE], [0, 11 * HOUR], [1, 3 * MINUTE], [2, 2 * HOUR + 1 * SECOND], [1, 45 * SECOND]]
    let t = T0
    const perPhase: Record<string, number> = {}
    let all = 0
    for (const [phase, gap] of gaps) {
      t += gap
      tickPhase(state, cfg, phase, t, BOOT)
      perPhase[String(phase)] = (perPhase[String(phase)] ?? 0) + gap / 1000
      all += gap / 1000
    }
    expect(state.phaseSeconds).toEqual(perPhase)
    expect(totals(state, cfg).beforeReviewUsed).toBeCloseTo(all / 3600, 9)
    expect(state.epochs[0].seconds).toBe(all)
  })

  it('is counted from a review round tick to the next phase tick', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + 10 * MINUTE, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 20 * MINUTE, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 50 * MINUTE, BOOT)
    tickPhase(state, cfg, 0, T0 + 55 * MINUTE, BOOT)
    expect(state.phaseSeconds['0']).toBe(15 * 60)
    expect(totals(state, cfg).reviewRoundsUsed).toBeCloseTo(0.5, 9)
  })

  it('is counted from the moment of --review to the next tick of phase 6', () => {
    const { state, t } = reviewed()
    tickPhase(state, cfg, 6, t + 40 * MINUTE, BOOT)
    expect(totals(state, cfg).afterReviewUsed).toBeCloseTo(40 / 60, 9)
  })

  it('is counted from the moment of --continue to the next tick', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + HOUR, BOOT)
    continueBuild(state, cfg, 1, [], T0 + 3 * HOUR, BOOT)
    tickPhase(state, cfg, 0, T0 + 3 * HOUR + 12 * MINUTE, BOOT)
    expect(state.epochs[1].seconds).toBe(12 * 60)
    expect(state.phaseSeconds['0']).toBe(72 * 60)
  })
})

describe('--review', () => {
  it('starts the second allowance, counted from zero, with phase 6 holding all of it', () => {
    const { state, t: t0 } = started()
    let t = fillBefore(state, lastBuildPhase, t0)
    t += HOUR
    tickPhase(state, cfg, lastBuildPhase, t, BOOT, quiet)
    const before = totals(state, cfg)
    t += 4 * HOUR
    const said = approveReview(state, cfg, t, BOOT)
    expect(said.join('\n')).toContain(`${fmt(budget.afterReviewHours)} h after the review`)
    expect(state.reviewApproved).toBe(true)
    const after = totals(state, cfg)
    expect(after.beforeReviewUsed).toBe(before.beforeReviewUsed)
    expect(after.afterReviewUsed).toBe(0)
    expect(after.afterReviewAllowed).toBe(budget.afterReviewHours)
    const epoch = state.epochs[state.epochs.length - 1]
    expect(epoch.allowedHours).toBe(budget.afterReviewHours)
    expect(epoch.boxes).toEqual({ 6: budget.afterReviewHours })

    t += 30 * MINUTE
    const lines = tickPhase(state, cfg, 6, t, BOOT, quiet)
    expect(lines).toContain(`time used under the allowance in force: ${fmt(0.5)} h of ${fmt(budget.afterReviewHours)} h allowed`)
    expect(lines).toContain(`time used: ${fmt(0.5)} of ${fmt(budget.afterReviewHours)} hours after the review`)
    expect(line(lines, 'time used in this phase:')).toContain(`${fmt(0.5)} h of its box of ${fmt(budget.afterReviewHours)} h`)
    expect(totals(state, cfg).beforeReviewUsed).toBe(before.beforeReviewUsed)
  })

  it('changes nothing the second time', () => {
    const { state, t } = reviewed()
    tickPhase(state, cfg, 6, t + 2 * HOUR, BOOT, quiet)
    const before = without(state, 'lastPrint')
    const said = approveReview(state, cfg, t + 6 * HOUR, BOOT)
    expect(said).toContain('nothing changed')
    expect(without(state, 'lastPrint')).toEqual(before)
    const lines = tickPhase(state, cfg, 6, t + 6 * HOUR + 15 * MINUTE, BOOT, quiet)
    expect(lines).toContain(`time used under the allowance in force: ${fmt(6.25)} h of ${fmt(budget.afterReviewHours)} h allowed`)
    expect(state.epochs.filter((e: any) => e.kind === 'after').length).toBe(1)
  })
})

describe('a review round', () => {
  it('opens with budget.reviewRoundHours on its first tick', () => {
    const { state } = started()
    const lines = tickReviewRound(state, cfg, 1, T0 + 10 * MINUTE, BOOT)
    expect(lines).toContain(`time used in this review round: ${fmt(0)} h of ${fmt(budget.reviewRoundHours)} h allowed`)
    expect(lines).toContain('extra rounds: yes')
    expect(state.reviewRounds['1'].allowedHours).toBe(budget.reviewRoundHours)
  })

  it('touches neither allowance before the review is approved', () => {
    const { state } = started()
    tickPhase(state, cfg, 2, T0 + HOUR, BOOT)
    const before = totals(state, cfg)
    const epochs = structuredClone(state.epochs)
    const phases = structuredClone(state.phaseSeconds)
    tickReviewRound(state, cfg, 1, T0 + HOUR + MINUTE, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 2 * HOUR, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 3 * HOUR, BOOT)
    const after = totals(state, cfg)
    expect(after.beforeReviewUsed).toBe(before.beforeReviewUsed)
    expect(after.afterReviewUsed).toBe(before.afterReviewUsed)
    expect(after.reviewRoundsUsed).toBeCloseTo(2 - 1 / 60, 9)
    expect(state.epochs).toEqual(epochs)
    expect(state.phaseSeconds).toEqual(phases)
  })

  it('touches neither allowance after the review is approved', () => {
    const { state, t } = reviewed()
    tickPhase(state, cfg, 6, t + HOUR, BOOT)
    const before = totals(state, cfg)
    const epochs = structuredClone(state.epochs)
    tickReviewRound(state, cfg, 2, t + HOUR + MINUTE, BOOT)
    tickReviewRound(state, cfg, 2, t + 2 * HOUR, BOOT)
    const after = totals(state, cfg)
    expect(after.beforeReviewUsed).toBe(before.beforeReviewUsed)
    expect(after.afterReviewUsed).toBe(before.afterReviewUsed)
    expect(state.epochs).toEqual(epochs)
  })

  it('keeps each round apart from the others', () => {
    const { state } = started()
    tickReviewRound(state, cfg, 1, T0 + MINUTE, BOOT)
    tickReviewRound(state, cfg, 1, T0 + 31 * MINUTE, BOOT)
    tickReviewRound(state, cfg, 2, T0 + 40 * MINUTE, BOOT)
    const lines = tickReviewRound(state, cfg, 2, T0 + 55 * MINUTE, BOOT)
    expect(state.reviewRounds['1'].seconds).toBe(30 * 60)
    expect(state.reviewRounds['2'].seconds).toBe(15 * 60)
    expect(lines).toContain(`time used in this review round: ${fmt(0.25)} h of ${fmt(budget.reviewRoundHours)} h allowed`)
  })

  it('switches extra rounds to no once its hours are used, and not a second sooner', () => {
    const { state } = started()
    tickReviewRound(state, cfg, 1, T0, BOOT, quiet)
    const justBefore = tickReviewRound(state, cfg, 1, T0 + hours(budget.reviewRoundHours) - SECOND, BOOT, quiet)
    expect(justBefore).toContain('extra rounds: yes')
    const at = tickReviewRound(state, cfg, 1, T0 + hours(budget.reviewRoundHours), BOOT, quiet)
    expect(at).toContain('extra rounds: no')
  })

  it('never prints the budget report line, even far past every allowance', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, lastBuildPhase + 1, t0)
    expect(tickPhase(state, cfg, lastBuildPhase, t + SECOND, BOOT, quiet)).toContain('budget report: due')
    const all: string[] = []
    all.push(...tickReviewRound(state, cfg, 1, t + MINUTE, BOOT, quiet))
    all.push(...tickReviewRound(state, cfg, 1, t + hours(budget.reviewRoundHours) * 4, BOOT, quiet))
    expect(all).toContain('extra rounds: no')
    expect(all.some((l) => l.includes('budget report'))).toBe(false)
  })
})

describe('an extension', () => {
  it('is kept apart from the build and measured against budget.extendHours', () => {
    const { state, t } = reviewed()
    tickPhase(state, cfg, 6, t + HOUR, BOOT, quiet)
    const before = totals(state, cfg)
    tickExtension(state, cfg, 1, t + 2 * HOUR, BOOT, quiet)
    const lines = tickExtension(state, cfg, 1, t + 3 * HOUR, BOOT, quiet)
    const after = totals(state, cfg)
    expect(lines).toContain(`time used in this extension: ${fmt(1)} h of ${fmt(budget.extendHours)} h allowed`)
    expect(after.beforeReviewUsed).toBe(before.beforeReviewUsed)
    expect(after.afterReviewUsed).toBe(before.afterReviewUsed)
    expect(after.extensionsUsed).toBeCloseTo(1, 9)
  })

  it('switches extra rounds to no once its hours are used, and not a second sooner', () => {
    const { state } = started()
    tickExtension(state, cfg, 1, T0, BOOT, quiet)
    expect(tickExtension(state, cfg, 1, T0 + hours(budget.extendHours) - SECOND, BOOT, quiet)).toContain('extra rounds: yes')
    expect(tickExtension(state, cfg, 1, T0 + hours(budget.extendHours), BOOT, quiet)).toContain('extra rounds: no')
  })

  it('never prints the budget report line', () => {
    const { state } = started()
    const all: string[] = []
    all.push(...tickExtension(state, cfg, 1, T0, BOOT, quiet))
    all.push(...tickExtension(state, cfg, 1, T0 + hours(budget.extendHours) * 5, BOOT, quiet))
    expect(all).toContain('extra rounds: no')
    expect(all.some((l) => l.includes('budget report'))).toBe(false)
  })
})

describe('the reserve', () => {
  const reserve5 = budget.reserveHours['5']
  const reserve6 = budget.reserveHours['6']

  it('leaves extra rounds on in phase 5 while the time left is the reserve or more', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 5, t0)
    const atReserve = t0 + hours(budget.runHours - reserve5)
    expect(atReserve).toBeGreaterThan(t)
    const justBefore = tickPhase(state, cfg, 5, atReserve - SECOND, BOOT, quiet)
    expect(justBefore).toContain('extra rounds: yes')
    const at = tickPhase(state, cfg, 5, atReserve, BOOT, quiet)
    expect(at).toContain('extra rounds: yes')
  })

  it('switches extra rounds off in phase 5 the moment the time left is under the reserve', () => {
    const { state, t: t0 } = started()
    fillBefore(state, 5, t0)
    const atReserve = t0 + hours(budget.runHours - reserve5)
    tickPhase(state, cfg, 5, atReserve, BOOT, quiet)
    const past = tickPhase(state, cfg, 5, atReserve + SECOND, BOOT, quiet)
    expect(past).toContain('extra rounds: no')
    expect(past).toContain('budget report: not due')
  })

  it('is what switches it, since the sum of the boxes is not yet reached', () => {
    const { state, t: t0 } = started()
    fillBefore(state, 5, t0)
    const used = budget.runHours - reserve5 + 0.25
    const lines = tickPhase(state, cfg, 5, t0 + hours(used), BOOT, quiet)
    expect(used).toBeLessThan(boxesBefore(6))
    expect(lines).toContain('extra rounds: no')
  })

  it('does not apply to a phase before phase 5', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 3, t0)
    const lines = tickPhase(state, cfg, 4, t + 3 * HOUR, BOOT, quiet)
    expect(line(lines, 'time used in this phase:')).not.toContain('reserve')
    expect(lines).toContain('extra rounds: yes')
  })

  it('switches extra rounds in phase 6 at the same kind of moment', () => {
    const { state, t } = reviewed()
    const atReserve = t + hours(budget.afterReviewHours - reserve6)
    expect(tickPhase(state, cfg, 6, atReserve - SECOND, BOOT, quiet)).toContain('extra rounds: yes')
    expect(tickPhase(state, cfg, 6, atReserve, BOOT, quiet)).toContain('extra rounds: yes')
    expect(tickPhase(state, cfg, 6, atReserve + SECOND, BOOT, quiet)).toContain('extra rounds: no')
  })
})

describe('--continue', () => {
  it('gives each unfinished phase a new box in proportion to its old one, before the review', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 4, t0)
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    const open = phaseKeys.filter((k) => !done.includes(Number(k)))
    const openTotal = open.reduce((s, k) => s + budget.phaseHours[k], 0)
    const said = continueBuild(state, cfg, 1, done, t + HOUR, BOOT)
    const epoch = state.epochs[state.epochs.length - 1]
    expect(said).toContain(`${fmt(budget.continueHours)} h added`)
    expect(epoch.kind).toBe('build')
    expect(epoch.allowedHours).toBe(budget.continueHours)
    expect(Object.keys(epoch.boxes).sort()).toEqual(open.slice().sort())
    for (const k of open) expect(epoch.boxes[k]).toBeCloseTo((budget.continueHours * budget.phaseHours[k]) / openTotal, 9)
    expect(Object.values(epoch.boxes as Record<string, number>).reduce((s, v) => s + v, 0)).toBeCloseTo(budget.continueHours, 9)
    for (const n of done) expect(epoch.boxes[String(n)]).toBeUndefined()
  })

  it('adds no time itself and measures the next ticks from its own start against the new boxes', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 5, t0)
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    const before = totals(state, cfg)
    continueBuild(state, cfg, 1, done, t + 8 * HOUR, BOOT)
    expect(totals(state, cfg).beforeReviewUsed).toBe(before.beforeReviewUsed)
    const epoch = state.epochs[state.epochs.length - 1]
    const lines = tickPhase(state, cfg, 4, t + 8 * HOUR + 30 * MINUTE, BOOT, quiet)
    expect(lines[0]).toContain('allowance: continuation 1')
    expect(lines).toContain(`time used in this phase: ${fmt(0.5)} h of its box of ${fmt(epoch.boxes['4'])} h`)
    expect(lines).toContain(`time used under the allowance in force: ${fmt(0.5)} h of ${fmt(budget.continueHours)} h allowed`)
    expect(lines).toContain('extra rounds: yes')
    expect(lines).toContain('budget report: not due')
    expect(totals(state, cfg).beforeReviewUsed).toBeCloseTo(before.beforeReviewUsed + 0.5, 9)
  })

  it('lets a phase that had reached its half point keep saying so, and no other', () => {
    const { state, t: t0 } = started()
    let t = fillBefore(state, 4, t0)
    t += hours(budget.phaseHours['4'] / 2)
    const lines = tickPhase(state, cfg, 4, t, BOOT, quiet)
    expect(lines).toContain('half point: reached')
    expect(lines).toContain('box end: not reached')
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    continueBuild(state, cfg, 1, done, t + HOUR, BOOT)
    const four = tickPhase(state, cfg, 4, t + HOUR + SECOND, BOOT, quiet)
    expect(four).toContain('half point: reached')
    expect(four).toContain('box end: not reached')
    const five = tickPhase(state, cfg, 5, t + HOUR + 2 * SECOND, BOOT, quiet)
    expect(five).toContain('half point: not reached')
    expect(five).toContain('box end: not reached')
  })

  it('lets a phase that had reached its box end keep saying so', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 5, t0)
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    continueBuild(state, cfg, 1, done, t + HOUR, BOOT)
    const four = tickPhase(state, cfg, 4, t + HOUR + SECOND, BOOT, quiet)
    expect(four).toContain('half point: reached')
    expect(four).toContain('box end: reached')
  })

  it('switches every line of phase 5 against its new box, measured from the continuation', () => {
    const { state, t: t0 } = started()
    let t = fillBefore(state, 5, t0)
    t += 30 * MINUTE
    tickPhase(state, cfg, 5, t, BOOT, quiet)
    const done = phaseKeys.map(Number).filter((n) => n < 5)
    t += 2 * HOUR
    continueBuild(state, cfg, 1, done, t, BOOT)
    const epoch = state.epochs[state.epochs.length - 1]
    expect(epoch.boxes).toEqual({ 5: budget.continueHours })
    const box = budget.continueHours - budget.reserveHours['5']

    const beforeHalf = tickPhase(state, cfg, 5, t + hours(box / 2) - SECOND, BOOT, quiet)
    expect(beforeHalf).toContain('half point: not reached')
    const atHalf = tickPhase(state, cfg, 5, t + hours(box / 2), BOOT, quiet)
    expect(atHalf).toContain('half point: reached')
    expect(atHalf).toContain('box end: not reached')

    const beforeEnd = tickPhase(state, cfg, 5, t + hours(box) - SECOND, BOOT, quiet)
    expect(beforeEnd).toContain('box end: not reached')
    const atEnd = tickPhase(state, cfg, 5, t + hours(box), BOOT, quiet)
    expect(atEnd).toContain('box end: reached')
    expect(atEnd).toContain('extra rounds: yes')
    expect(atEnd).toContain('budget report: not due')

    const pastReserve = tickPhase(state, cfg, 5, t + hours(box) + SECOND, BOOT, quiet)
    expect(pastReserve).toContain('extra rounds: no')

    const beforeDue = tickPhase(state, cfg, 5, t + hours(budget.continueHours) - SECOND, BOOT, quiet)
    expect(beforeDue).toContain('budget report: not due')
    const atDue = tickPhase(state, cfg, 5, t + hours(budget.continueHours), BOOT, quiet)
    expect(atDue).toContain('budget report: due')
  })

  it('gives phase 6 all of budget.continueHours after the review', () => {
    const { state, t } = reviewed()
    tickPhase(state, cfg, 6, t + hours(budget.afterReviewHours), BOOT, quiet)
    const before = totals(state, cfg)
    const at = t + hours(budget.afterReviewHours) + HOUR
    continueBuild(state, cfg, 1, [], at, BOOT)
    const epoch = state.epochs[state.epochs.length - 1]
    expect(epoch.kind).toBe('after')
    expect(epoch.boxes).toEqual({ 6: budget.continueHours })
    expect(epoch.allowedHours).toBe(budget.continueHours)
    expect(totals(state, cfg).afterReviewUsed).toBe(before.afterReviewUsed)
    const lines = tickPhase(state, cfg, 6, at + 15 * MINUTE, BOOT, quiet)
    expect(line(lines, 'time used in this phase:')).toContain(`${fmt(0.25)} h of its box of ${fmt(budget.continueHours)} h`)
    expect(lines).toContain(`time used under the allowance in force: ${fmt(0.25)} h of ${fmt(budget.continueHours)} h allowed`)
    expect(lines).toContain('budget report: not due')
    expect(lines).toContain('extra rounds: yes')
  })

  it('changes nothing when the same continuation is recorded twice', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 4, t0)
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    continueBuild(state, cfg, 1, done, t + HOUR, BOOT)
    tickPhase(state, cfg, 4, t + 2 * HOUR, BOOT, quiet)
    const before = without(state, 'lastPrint')
    const said = continueBuild(state, cfg, 1, done, t + 5 * HOUR, BOOT)
    expect(said).toContain('nothing changed')
    expect(without(state, 'lastPrint')).toEqual(before)
  })

  it('records a second continuation as a new allowance', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 4, t0)
    const done = phaseKeys.map(Number).filter((n) => n < 4)
    continueBuild(state, cfg, 1, done, t + HOUR, BOOT)
    continueBuild(state, cfg, 2, done, t + 2 * HOUR, BOOT)
    expect(state.epochs.filter((e: any) => e.continuation !== undefined).length).toBe(2)
    expect(totals(state, cfg).beforeReviewAllowed).toBe(budget.runHours + 2 * budget.continueHours)
  })
})

describe('each printed line switches at the right moment', () => {
  it('extra rounds: no once the time used reaches the sum of the boxes up to this phase', () => {
    const { state } = started()
    const first = hours(budget.phaseHours[phaseKeys[0]!])
    expect(tickPhase(state, cfg, 0, T0 + first - SECOND, BOOT, quiet)).toContain('extra rounds: yes')
    expect(tickPhase(state, cfg, 0, T0 + first, BOOT, quiet)).toContain('extra rounds: no')
  })

  it('extra rounds: unused time passes forward to a later phase', () => {
    const { state } = started()
    tickPhase(state, cfg, 0, T0 + HOUR, BOOT, quiet)
    const upTo2 = hours(boxesBefore(3))
    expect(tickPhase(state, cfg, 2, T0 + upTo2 - SECOND, BOOT, quiet)).toContain('extra rounds: yes')
    expect(tickPhase(state, cfg, 2, T0 + upTo2, BOOT, quiet)).toContain('extra rounds: no')
    expect(tickPhase(state, cfg, 3, T0 + upTo2 + SECOND, BOOT, quiet)).toContain('extra rounds: yes')
  })

  it('extra rounds: an overrun eats the extra rounds of the next phase', () => {
    const { state } = started()
    const over = hours(boxesBefore(2)) + MINUTE
    tickPhase(state, cfg, 0, T0 + over, BOOT, quiet)
    const lines = tickPhase(state, cfg, 1, T0 + over + SECOND, BOOT, quiet)
    expect(lines).toContain('extra rounds: no')
    expect(lines).toContain('half point: not reached')
  })

  it('half point: reached once the phase has itself used half of its own box', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 3, t0)
    const half = hours(budget.phaseHours['3'] / 2)
    expect(tickPhase(state, cfg, 3, t + half - SECOND, BOOT, quiet)).toContain('half point: not reached')
    const at = tickPhase(state, cfg, 3, t + half, BOOT, quiet)
    expect(at).toContain('half point: reached')
    expect(at).toContain('box end: not reached')
  })

  it('half point: counted against the phase alone, whatever the earlier phases used', () => {
    const { state } = started()
    const over = hours(boxesBefore(3) + 2)
    tickPhase(state, cfg, 2, T0 + over, BOOT, quiet)
    const half = hours(budget.phaseHours['3'] / 2)
    expect(tickPhase(state, cfg, 3, T0 + over + half - SECOND, BOOT, quiet)).toContain('half point: not reached')
    expect(tickPhase(state, cfg, 3, T0 + over + half, BOOT, quiet)).toContain('half point: reached')
  })

  it('box end: reached once the phase has itself used all of its own box', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 3, t0)
    const box = hours(budget.phaseHours['3'])
    expect(tickPhase(state, cfg, 3, t + box - SECOND, BOOT, quiet)).toContain('box end: not reached')
    expect(tickPhase(state, cfg, 3, t + box, BOOT, quiet)).toContain('box end: reached')
  })

  it('half point and box end stay reached on every later tick', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 3, t0)
    tickPhase(state, cfg, 3, t + hours(budget.phaseHours['3']), BOOT, quiet)
    const later = tickPhase(state, cfg, 3, t + hours(budget.phaseHours['3']) + HOUR, BOOT, quiet)
    expect(later).toContain('half point: reached')
    expect(later).toContain('box end: reached')
  })

  it('budget report: due once the time used reaches the time allowed', () => {
    const { state, t: t0 } = started()
    fillBefore(state, 5, t0)
    const end = t0 + hours(budget.runHours)
    const justBefore = tickPhase(state, cfg, 5, end - SECOND, BOOT, quiet)
    expect(justBefore).toContain('budget report: not due')
    const at = tickPhase(state, cfg, 5, end, BOOT, quiet)
    expect(at).toContain('budget report: due')
    expect(at).toContain(`time used under the allowance in force: ${fmt(budget.runHours)} h of ${fmt(budget.runHours)} h allowed`)
  })

  it('budget report: due in phase 6 once the second allowance is used', () => {
    const { state, t } = reviewed()
    const end = t + hours(budget.afterReviewHours)
    expect(tickPhase(state, cfg, 6, end - SECOND, BOOT, quiet)).toContain('budget report: not due')
    expect(tickPhase(state, cfg, 6, end, BOOT, quiet)).toContain('budget report: due')
  })

  it('phase 5: half point and box end are counted against the box less the reserve', () => {
    const { state, t: t0 } = started()
    const t = fillBefore(state, 5, t0)
    const box = budget.phaseHours['5'] - budget.reserveHours['5']
    const first = tickPhase(state, cfg, 5, t + hours(box / 2) - SECOND, BOOT, quiet)
    expect(first).toContain('half point: not reached')
    expect(line(first, 'time used in this phase:')).toContain(`of which ${fmt(budget.reserveHours['5'])} h is the reserve`)
    expect(tickPhase(state, cfg, 5, t + hours(box / 2), BOOT, quiet)).toContain('half point: reached')
    expect(tickPhase(state, cfg, 5, t + hours(box) - SECOND, BOOT, quiet)).toContain('box end: not reached')
    const atEnd = tickPhase(state, cfg, 5, t + hours(box), BOOT, quiet)
    expect(atEnd).toContain('box end: reached')
    expect(atEnd).toContain('budget report: not due')
  })

  it('phase 5: box end: reached is printed before budget report: due', () => {
    const { state, t: t0 } = started()
    let t = fillBefore(state, 5, t0)
    const seen: { boxEnd: boolean; due: boolean }[] = []
    const stop = t0 + hours(budget.runHours) + 10 * MINUTE
    while (t < stop) {
      t += 5 * MINUTE
      const lines = tickPhase(state, cfg, 5, t, BOOT, quiet)
      seen.push({ boxEnd: lines.includes('box end: reached'), due: lines.includes('budget report: due') })
    }
    const firstBoxEnd = seen.findIndex((s) => s.boxEnd)
    const firstDue = seen.findIndex((s) => s.due)
    expect(firstBoxEnd).toBeGreaterThanOrEqual(0)
    expect(firstDue).toBeGreaterThan(firstBoxEnd)
    expect(seen.filter((s) => s.due).every((s) => s.boxEnd)).toBe(true)
  })

  it('phase 6: half point and box end are counted against the box less the reserve, ahead of the budget report', () => {
    const { state, t } = reviewed()
    const box = budget.afterReviewHours - budget.reserveHours['6']
    expect(tickPhase(state, cfg, 6, t + hours(box / 2) - SECOND, BOOT, quiet)).toContain('half point: not reached')
    expect(tickPhase(state, cfg, 6, t + hours(box / 2), BOOT, quiet)).toContain('half point: reached')
    expect(tickPhase(state, cfg, 6, t + hours(box) - SECOND, BOOT, quiet)).toContain('box end: not reached')
    const atEnd = tickPhase(state, cfg, 6, t + hours(box), BOOT, quiet)
    expect(atEnd).toContain('box end: reached')
    expect(atEnd).toContain('budget report: not due')
  })

  it('status overdue: printed once the minutes since the last status pass budget.statusMaxGapMinutes', () => {
    const { state } = started()
    const max = budget.statusMaxGapMinutes
    const at = tickPhase(state, cfg, 0, T0 + max * MINUTE, BOOT)
    expect(at).toContain(`minutes since the last status: ${max}`)
    expect(at).not.toContain('status overdue')
    const past = tickPhase(state, cfg, 0, T0 + (max + 1) * MINUTE, BOOT)
    expect(past).toContain(`minutes since the last status: ${max + 1}`)
    expect(past).toContain('status overdue')
  })

  it('status overdue: a tick made with a status starts the count again', () => {
    const { state } = started()
    const max = budget.statusMaxGapMinutes
    expect(tickPhase(state, cfg, 0, T0 + (max + 5) * MINUTE, BOOT)).toContain('status overdue')
    const withStatus = tickPhase(state, cfg, 0, T0 + (max + 6) * MINUTE, BOOT, { status: true })
    expect(withStatus).toContain('minutes since the last status: 0')
    expect(withStatus).not.toContain('status overdue')
    const next = tickPhase(state, cfg, 0, T0 + (2 * max + 6) * MINUTE, BOOT)
    expect(next).not.toContain('status overdue')
    expect(tickPhase(state, cfg, 0, T0 + (2 * max + 7) * MINUTE, BOOT)).toContain('status overdue')
  })

  it('status overdue: markStatus starts the count again', () => {
    const { state } = started()
    const max = budget.statusMaxGapMinutes
    tickPhase(state, cfg, 0, T0 + (max + 5) * MINUTE, BOOT)
    markStatus(state, T0 + (max + 5) * MINUTE)
    const lines = tickPhase(state, cfg, 0, T0 + (max + 10) * MINUTE, BOOT)
    expect(lines).toContain('minutes since the last status: 5')
    expect(lines).not.toContain('status overdue')
  })

  it('status overdue: printed in a review round and in an extension too', () => {
    const { state } = started()
    const max = budget.statusMaxGapMinutes
    expect(tickReviewRound(state, cfg, 1, T0 + max * MINUTE, BOOT)).not.toContain('status overdue')
    expect(tickReviewRound(state, cfg, 1, T0 + (max + 1) * MINUTE, BOOT)).toContain('status overdue')
    expect(tickExtension(state, cfg, 1, T0 + (max + 2) * MINUTE, BOOT)).toContain('status overdue')
  })

  it('prints the eight lines of a phase tick in a fixed order', () => {
    const { state } = started()
    const lines = tickPhase(state, cfg, 0, T0 + MINUTE, BOOT)
    const heads = ['clock: phase 0', 'time used in this phase:', 'time used under the allowance in force:', 'time used:', 'extra rounds:', 'half point:', 'box end:', 'budget report:', 'minutes since the last status:']
    heads.forEach((head, i) => expect(lines[i]!.startsWith(head)).toBe(true))
    expect(state.lastPrint).toEqual(lines)
  })
})

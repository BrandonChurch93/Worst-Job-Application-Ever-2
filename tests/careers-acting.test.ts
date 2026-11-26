import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { FLIP_SECONDS } from '../src/pages/marketing'
import { CUES, path, PRESS_AT, TOUCH, TURN_AT, VISITS } from '../src/pages/marketing/script'
import { filmFlow, filmOptions, ScriptDriver, Stage, TURN_HALF } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const marks = { start: { x: 0, y: 0 }, corner: { x: 100, y: 100 }, cards: [{ x: 200, y: 200 }, { x: 300, y: 300 }, { x: 400, y: 400 }], round: { x: 450, y: 450 }, lane: { x: 500, y: 500 }, medal: { x: 600, y: 600 }, stand: { x: 700, y: 700 }, perch: { x: 800, y: 800 }, press: { x: 900, y: 900 } }
const LASTS = { anticipate: 0.35, jump: 0.5, startle: 0.42 } as Record<string, number>
const SEEN = 6 / 60
const KEY = config.film.beats.find((b) => b.id === 'marketing.apply')!.from
const UNIT = config.film.units.find((u) => u.id === 'marketing')!.seconds

describe('careers acting', () => {
  const s = film()
  const poses: { t: number; x: number; y: number; z: number; squash: number; reaction: string | null; acting: string }[] = []
  for (let i = 0; i < Math.round(UNIT * stepHz); i++) {
    s.advance(1)
    const p = s.cursor.pose()
    poses.push({ t: (i + 1) / stepHz, x: p.x, y: p.y, z: p.z, squash: p.squash, reaction: p.reaction, acting: p.acting })
  }
  const at = (name: string): number[] => s.events.filter((e) => e.name === name).map((e) => e.step)
  const pose = (t: number): (typeof poses)[number] => poses[Math.round(t * stepHz) - 1]!

  it('keeps the page events of the film on their steps', () => {
    expect(at('card-flip')).toEqual([498, 1180, 1684])
    expect(at('button-press')).toEqual([3007])
    expect(at('page-turn')).toEqual([Math.round(TURN_AT * stepHz)])
    expect(TURN_AT).toBe(UNIT - TURN_HALF)
  })

  it('answers each card on the step it starts to turn, from the page under its edge, and lets it seat before it moves on', () => {
    at('card-flip').forEach((step, i) => {
      const v = VISITS[i]!
      const t = step / stepHz
      expect(poses[step + 1]!.reaction, `card ${i}`).toBe('startle')
      expect(t).toBeGreaterThan(v.poke)
      expect(t).toBeLessThan(v.back + TOUCH.out)
      const back = pose(t + 0.3)
      expect(Math.hypot(back.x - pose(t).x, back.y - pose(t).y), `card ${i} steps back`).toBeGreaterThan(30)
      expect(v.till, `card ${i} seats`).toBeGreaterThanOrEqual(t + FLIP_SECONDS)
      expect(v.leave - v.home, `card ${i} stands`).toBeGreaterThanOrEqual(SEEN * 3)
    })
  })

  it('does one held double take at the first card and none at the others', () => {
    const shocked = poses.filter((p) => p.acting === 'shocked' && p.t < KEY)
    expect(shocked.length / stepHz).toBeGreaterThanOrEqual(0.7)
    expect(shocked[0]!.t).toBeGreaterThan(VISITS[0]!.take - 0.05)
    expect(shocked[shocked.length - 1]!.t).toBeLessThan(VISITS[0]!.till)
    expect(poses.filter((p) => p.reaction === 'doubleTake' && p.t > VISITS[0]!.leave).length).toBe(0)
  })

  it('stands still before the key picture and holds each pose long enough to be seen', () => {
    const keys = path(marks)
    const stand = keys.filter((p) => p.x === marks.stand.x && p.y === marks.stand.y)
    expect(stand[0]!.t).toBeLessThanOrEqual(KEY - 0.5)
    expect(stand[stand.length - 1]!.t).toBeGreaterThan(KEY)
    for (const c of CUES) expect(c.at <= KEY - 0.5 || c.at > KEY, `cue at ${c.at}`).toBe(true)
    const a = pose(KEY - 0.4)
    const b = pose(KEY)
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1)
    const acts = CUES.filter((c) => c.act && c.at < TURN_AT)
    acts.forEach((c, i) => {
      const next = acts[i + 1]
      if (next) expect(next.at - c.at, `${c.act} at ${c.at}`).toBeGreaterThanOrEqual(SEEN * 3)
    })
    expect(VISITS[2]!.leave - VISITS[2]!.home, 'the stand over the ticker').toBeGreaterThanOrEqual(1)
  })

  it('never starts a move before the one before it has ended', () => {
    const reacts = CUES.filter((c) => c.react)
    reacts.forEach((c, i) => {
      const next = reacts[i + 1]
      if (next) expect(c.at + LASTS[c.react!]!, c.react).toBeLessThanOrEqual(next.at + 1e-9)
    })
  })

  it('winds up, jumps on the button, squashes on it, and the cap comes back before the page turns', () => {
    const press = at('button-press')[0]! / stepHz
    expect(press).toBeGreaterThan(PRESS_AT + 0.6)
    const up = poses.filter((p) => p.t > PRESS_AT && p.t < press)
    expect(Math.max(...up.map((p) => p.z))).toBeGreaterThan(90)
    expect(Math.min(...up.filter((p) => p.t < PRESS_AT + 0.3).map((p) => p.squash))).toBeLessThan(0.8)
    const down = poses.filter((p) => p.t > press && p.t < press + 0.4)
    expect(Math.min(...down.map((p) => p.squash))).toBeLessThan(0.75)
    expect(Math.min(...down.map((p) => p.z))).toBeLessThan(7)
    const rest = pose(TURN_AT - 0.25)
    expect(rest.z).toBeGreaterThan(12)
    expect(Math.abs(pose(TURN_AT - 0.45).z - rest.z)).toBeLessThan(0.5)
  })
})

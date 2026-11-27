import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { stream } from '../src/core/random'
import { pages } from '../src/pages'
import { seatIndex, seats } from '../src/pages/step1/keyboard'
import { BLAST, BOLT, TURRET } from '../src/pages/step1/turrets'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { Driver, DriverView, Pointer } from '../src/stage/types'

const LETTERS = 'etaoinshrdlucmfwypvbgkqjxz'

export class Clumsy implements Driver {
  readonly name = 'bot' as const
  private x = 960
  private y = 540
  private speed: number
  private word: string[]
  private wait = 0
  private hold = 0
  private seen = 0
  private rng
  constructor(seed: number, readonly dodges: boolean) {
    this.rng = stream('b-step1:clumsy', seed)
    this.speed = this.rng.range(380, 700)
    const n = 3 + Math.floor(this.rng.next() * 8)
    this.word = Array.from({ length: n }, () => LETTERS[Math.floor(this.rng.next() ** 1.6 * LETTERS.length)]!)
  }
  input(v: DriverView): Pointer {
    const out: Pointer = { x: this.x, y: this.y, down: false }
    if (v.turning) return out
    const hint = v.page.hint()
    const st = v.page.save() as { phase: string; values: { name: string } }
    if (!hint) return out
    let aim = { x: hint.x, y: hint.y }
    const typing = st.phase === 'name'
    if (typing) {
      const n = st.values.name.length
      const want = n < this.word.length ? this.word[n]! : 'enter'
      const seat = seats[seatIndex[want]!]!
      aim = { x: seat.cx, y: seat.cy }
      if (this.dodges && hint.dodge) {
        this.seen++
        if (this.seen > 0.4 * stepHz) aim = hint.dodge
      } else this.seen = 0
    }
    const max = this.speed / stepHz
    const d = Math.hypot(aim.x - this.x, aim.y - this.y)
    if (d <= max) {
      if (this.wait === 0 && this.hold === 0) this.wait = Math.round(this.rng.range(0.12, 0.9) * stepHz)
      this.x = aim.x
      this.y = aim.y
    } else {
      this.x += ((aim.x - this.x) / d) * max
      this.y += ((aim.y - this.y) / d) * max
    }
    out.x = this.x
    out.y = this.y
    if (d > max) return out
    if (this.wait > 0) {
      this.wait--
      if (this.wait === 0) this.hold = Math.round(0.12 * stepHz)
      return out
    }
    if (typing) {
      if (this.hold > 0) {
        this.hold--
        out.down = true
      }
    } else out.down = hint.down
    return out
  }
}

interface Run { fired: number; hits: number; seconds: number; done: boolean; letters: number; sensed: number; room: number }

function run(seed: number, dodges: boolean): Run {
  const s = new Stage({ mode: 'live', flow: [{ page: 'step1' }, { page: 'step2' }], pages, driver: new Clumsy(seed, dodges), seed })
  let up = -1
  let done = -1
  let seen = 0
  for (let i = 0; i < 120 * 60 && done < 0; i++) {
    s.advance(stepHz / 60)
    for (const e of s.events.slice(seen)) {
      if (e.name === 'keyboard-rise' && up < 0) up = e.step / stepHz
      if (e.name === 'field-done' && done < 0) done = e.step / stepHz
    }
    seen = s.events.length
  }
  const fired = s.events.filter((e) => e.name === 'bolt-fire').length
  const hits = s.events.filter((e) => e.name === 'bolt-hit-cursor').length
  const st = s.page.save() as { values: { name: string } }
  const sensed = s.events.filter((e) => e.name === 'candidate-sensed')
  return { fired, hits, seconds: done < 0 ? -1 : done - up, done: done >= 0, letters: st.values.name.length, sensed: sensed.length, room: sensed.length > 0 ? done - sensed[0]!.step / stepHz : -1 }
}

const pick = (list: number[], share: number): number => [...list].sort((a, b) => a - b)[Math.min(list.length - 1, Math.floor(list.length * share))]!

describe('step 1: the blasts can be seen and dodged', () => {
  it('flies at 520 page px a second where the bolt flew at 1500, one blast every 1.5 s where a bolt came every 0.45 s', () => {
    expect(TURRET.boltSpeed).toBe(1500)
    expect(BOLT.boltSpeed).toBe(1500)
    expect(BLAST.boltSpeed).toBe(520)
    expect(BOLT.stagger).toBe(0.45)
    expect(BLAST.stagger).toBe(1.5)
    expect(BLAST.period).toBe(BLAST.stagger * 2)
    expect(BLAST.windup).toBe(0.7)
    expect(BOLT.windup).toBe(0.35)
  })

  it('gives a visitor 0.85 s from the tell to the blast on the letter key nearest a turret, and 1.9 s on a key of the middle', () => {
    const letters = seats.filter((k) => k.letter)
    const far = (k: { cx: number; cy: number }): number => Math.min(...[0, 1].map((i) => Math.hypot(k.cx - (i === 0 ? 228 : 1692), k.cy - 892) - TURRET.barrel))
    const near = Math.min(...letters.map(far))
    const mid = Math.max(...letters.map(far))
    const before = { near: BOLT.windup + near / BOLT.boltSpeed, mid: BOLT.windup + mid / BOLT.boltSpeed }
    const after = { near: BLAST.windup + near / BLAST.boltSpeed, mid: BLAST.windup + mid / BLAST.boltSpeed }
    console.log(`tell to landing: nearest letter key ${near.toFixed(0)} px from a muzzle, before ${before.near.toFixed(2)} s, after ${after.near.toFixed(2)} s; farthest letter key ${mid.toFixed(0)} px, before ${before.mid.toFixed(2)} s, after ${after.mid.toFixed(2)} s`)
    expect(after.near).toBeGreaterThan(0.8)
    expect(after.mid).toBeGreaterThan(1.9)
  })

  for (const dodges of [false, true]) {
    it(`lets a clumsy visitor ${dodges ? 'who steps off a marked key 0.4 s after the tell' : 'who never looks at the turrets'} finish the Name on each of 200 seeds`, () => {
      const runs = Array.from({ length: 200 }, (_, i) => run(i + 1, dodges))
      const fired = runs.reduce((a, r) => a + r.fired, 0)
      const hits = runs.reduce((a, r) => a + r.hits, 0)
      const secs = runs.filter((r) => r.done).map((r) => r.seconds)
      console.log(`clumsy visitor, ${dodges ? 'dodging' : 'not dodging'}, 200 seeds: ${runs.filter((r) => r.done).length} finished the Name; ${fired} blasts, ${hits} hit, ${(100 * (1 - hits / fired)).toFixed(1)}% missed; Name took median ${pick(secs, 0.5).toFixed(1)} s, 90th ${pick(secs, 0.9).toFixed(1)} s, longest ${Math.max(...secs).toFixed(1)} s; hits a run: median ${pick(runs.map((r) => r.hits), 0.5)}, most ${Math.max(...runs.map((r) => r.hits))}; runs with no hit ${runs.filter((r) => r.hits === 0).length}; letters ${Math.min(...runs.map((r) => r.letters))} to ${Math.max(...runs.map((r) => r.letters))}`)
      expect(runs.every((r) => r.done)).toBe(true)
      expect(Math.max(...runs.map((r) => r.hits))).toBeLessThanOrEqual(config.live.step1.hitsBeforeTurretsOverheat + 1)
      expect(hits / fired).toBeLessThan(0.5)
    })
  }
})

const LINE = 5.6

describe('step 1: the one event of the narrator\'s line', () => {
  it('fires candidate-sensed once in the film, on the step the turrets begin to rise, and leaves the line its 5.6 s before the Name is done', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    s.advance(32 * stepHz)
    const mine = s.events.filter((e) => e.page === 'step1')
    const sensed = mine.filter((e) => e.name === 'candidate-sensed')
    const rise = mine.filter((e) => e.name === 'turret-rise')
    const done = mine.filter((e) => e.name === 'field-done')
    console.log(`film: candidate-sensed at ${(sensed[0]!.step / stepHz).toFixed(2)} s of the unit, the line over at ${(sensed[0]!.step / stepHz + LINE).toFixed(2)} s, the Name done at ${(done[0]!.step / stepHz).toFixed(2)} s`)
    expect(sensed.length).toBe(1)
    expect(rise.length).toBe(2)
    expect(sensed[0]!.step).toBe(rise[0]!.step)
    expect(done[0]!.step / stepHz - sensed[0]!.step / stepHz).toBeGreaterThan(LINE)
    expect(sensed[0]!.step / stepHz + LINE).toBeLessThan(15)
  })

  it('fires it once on each of 200 live visits', () => {
    const runs = Array.from({ length: 200 }, (_, i) => run(i + 1, false))
    const room = runs.map((r) => r.room)
    console.log(`live, 200 seeds: candidate-sensed once on ${runs.filter((r) => r.sensed === 1).length}; from it to the Name done: least ${pick(room, 0).toFixed(1)} s, median ${pick(room, 0.5).toFixed(1)} s; ${runs.filter((r) => r.room < LINE).length} of 200 visits have the Name done before a line of ${LINE} s is over`)
    for (const r of runs) expect(r.sensed).toBe(1)
  })
})

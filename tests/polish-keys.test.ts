import * as THREE from 'three'
import { beforeAll, describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { seatIndex, seats, SINK, TRAVEL } from '../src/pages/step1/keyboard'
import { turrets as turretLook } from '../src/pages/step1/real/turrets'
import { HOOD, PILE } from '../src/pages/step1/script'
import { STAY, TURRET, Turrets } from '../src/pages/step1/turrets'
import type { Emitter, RealContext } from '../src/real/types'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList, Shape } from '../src/stage/types'
import { type Row, visit } from './polish-keys-run'

// What the same visitor met on step 1 before this work, MEASURED on commit 664bedb5 with tests/polish-keys-measure.test.ts.
const BEFORE = { takenFrames: 255, shreddedToFree: 193, shreddedToFollows: 194, riseBeforeRelease: 9 }

let rows: Row[] = []
const at = (i: number): Row => rows.find((r) => r.i === i)!
const first = (from: number, test: (r: Row) => boolean): Row => rows.find((r) => r.i >= from && test(r))!

beforeAll(() => {
  rows = visit()
})

describe('polish keys: a key pressed on the live site', () => {
  const press = (): { down: Row; up: Row; name: string } => {
    const down = first(0, (r) => r.gag === 'step1.firstName' && r.down && r.events.includes('key-press'))
    const up = first(down.i, (r) => !r.down)
    return { down, up, name: down.keys.find((k) => k.sink > 0)!.name }
  }

  it('goes down on the press and is at the bottom on the next frame', () => {
    const { down, name } = press()
    expect(at(down.i - 1).all.get(name)!.sink).toBe(0)
    expect(down.all.get(name)!.sink).toBeGreaterThanOrEqual(0.5)
    const next = at(down.i + 1).all.get(name)!
    expect(next.sink).toBe(1)
    expect(next.depth).toBe(1)
    expect(next.top).toBeCloseTo(config.scale.heights.keycap - TRAVEL, 5)
  })

  it('is drawn sunk in the plane of the page, cap and label together, by a travel seen at 1920 by 1080', () => {
    const { down, name } = press()
    const rest = at(down.i - 1).all.get(name)!
    const sunk = at(down.i + 1).all.get(name)!
    expect(Math.hypot(SINK.x, SINK.y)).toBeGreaterThanOrEqual(5)
    expect(Math.hypot(SINK.x, SINK.y)).toBeLessThan(config.scale.grid.keyGap)
    expect(sunk.wordX - rest.wordX).toBeCloseTo(SINK.x, 5)
    expect(sunk.wordY - rest.wordY - (sunk.y - rest.y)).toBeCloseTo(SINK.y - 12 * sunk.tipY, 5)
    expect(SINK.shade).toBeLessThanOrEqual(0.2)
  })

  it('stays at the bottom on every frame the button is held, and before this work it rose 9 frames sooner', () => {
    const { down, up, name } = press()
    expect(up.i - down.i).toBeGreaterThan(BEFORE.riseBeforeRelease)
    for (let i = down.i + 1; i < up.i; i++) expect(at(i).all.get(name)!.sink, `frame ${i}`).toBe(1)
  })

  it('springs back on the release: at its neighbours height within three frames, a short overshoot, at rest inside nine', () => {
    const { up, name } = press()
    const sink = (n: number): number => at(up.i + n).all.get(name)!.sink
    expect(sink(0)).toBeLessThan(1)
    expect(sink(0)).toBeGreaterThan(0.4)
    expect(sink(2)).toBeLessThanOrEqual(0.05)
    const least = Math.min(...[2, 3, 4, 5, 6, 7].map(sink))
    expect(least).toBeLessThan(-0.1)
    expect(least).toBeGreaterThan(-0.3)
    expect(Math.abs(sink(9))).toBeLessThan(0.01)
    expect(at(up.i + 9).all.get(name)!.top).toBeCloseTo(config.scale.heights.keycap, 1)
  })

  it('has no turret winding up beside it while it is held', () => {
    const { down, up } = press()
    expect(Math.max(...at(down.i - 1).charge)).toBeGreaterThan(0.2)
    for (let i = down.i; i < up.i; i++) expect(Math.max(...at(i).charge), `frame ${i}`).toBe(0)
    const again = first(up.i, (r) => Math.max(...r.charge) > 0)
    expect(again.i - up.i).toBeLessThanOrEqual(2)
  })

  it('types one letter for one press however long it is held', () => {
    const { down, up } = press()
    expect(rows.filter((r) => r.i >= down.i && r.i < up.i && r.events.includes('key-press')).length).toBe(1)
  })
})

describe('polish keys: the turrets keep firing under held keys', () => {
  it('hold one shot back by STAY at most', () => {
    const t = new Turrets([{ x: 0, y: 0 }, { x: 1000, y: 0 }], 0, 99, () => 0)
    const fired: number[] = []
    t.raise(() => {})
    const dt = 1 / stepHz
    for (let n = 0; n < 6 * stepHz; n++) {
      t.wait(dt)
      t.step(dt, { x: 500, y: 300 }, false, (name) => {
        if (name === 'bolt-fire') fired.push(n * dt)
      })
    }
    expect(fired.length).toBeGreaterThanOrEqual(2 * Math.floor((6 - TURRET.riseSeconds - TURRET.firstShot - STAY) / (TURRET.period + STAY)))
    const gaps = fired.slice(2).map((time, n) => time - fired[n]!)
    expect(Math.max(...gaps)).toBeLessThanOrEqual(TURRET.period + STAY + 2 * dt)
  })

  it('fire as they did when no key is held', () => {
    const run = (held: boolean): number[] => {
      const t = new Turrets([{ x: 0, y: 0 }, { x: 1000, y: 0 }], 0, 99, () => 0)
      const fired: number[] = []
      t.raise(() => {})
      for (let n = 0; n < 4 * stepHz; n++) {
        if (held && n % 7 === 99) t.wait(1 / stepHz)
        t.step(1 / stepHz, { x: 500, y: 300 }, false, (name) => {
          if (name === 'bolt-fire') fired.push(n)
        })
      }
      return fired
    }
    expect(run(true)).toEqual(run(false))
    expect(run(false).length).toBeGreaterThanOrEqual(6)
  })
})

describe('polish keys: a bolt hits the arrow on the live site', () => {
  const hit = (): Row => first(0, (r) => r.events.includes('bolt-hit-cursor'))
  const thrown = (r: Row, was: Row): { far: number; name: string }[] => [...r.all.values()].map((k) => ({ name: k.name, far: Math.hypot(k.x - was.all.get(k.name)!.x, k.y - r.deckY - (was.all.get(k.name)!.y - was.deckY)) }))

  it('presses no key', () => {
    const h = hit()
    for (let i = h.i; i <= h.i + 12; i++) {
      const r = at(i)
      if (r.events.includes('key-press') || (r.events.includes('bolt-hit') && !r.events.includes('bolt-hit-cursor'))) break
      for (const k of r.all.values()) {
        expect(k.depth, `key ${k.name} frame ${i}`).toBe(0)
        expect(k.sink, `key ${k.name} frame ${i}`).toBe(0)
        expect(Math.abs(k.tipY), `key ${k.name} frame ${i}`).toBe(0)
      }
    }
  })

  it('lets a bolt that lands on a cap tap that cap, and the tap types no letter', () => {
    let taps = 0
    for (const r of rows) {
      if (!r.events.includes('bolt-hit') || r.events.includes('bolt-hit-cursor') || r.i < 1) continue
      const before = at(r.i - 1)
      const tapped = r.keys.filter((k) => k.depth > 0.5 && k.sink === 0 && !before.keys.some((b) => b.name === k.name))
      if (tapped.length === 0) continue
      taps++
      if (!(r.down && !before.down)) expect(r.events, `frame ${r.i}`).not.toContain('key-press')
    }
    expect(taps).toBeGreaterThan(0)
  })

  it('throws the caps round the strike outward on the frame of the hit, and the deck with them', () => {
    const h = hit()
    const was = at(h.i - 1)
    const moved = thrown(h, was).filter((k) => k.far > 2)
    expect(moved.length).toBeGreaterThanOrEqual(6)
    expect(Math.max(...moved.map((k) => k.far))).toBeGreaterThanOrEqual(5)
    expect(Math.max(...moved.map((k) => k.far))).toBeLessThanOrEqual(config.scale.grid.keyGap)
    expect(Math.abs(h.deckY - was.deckY)).toBeGreaterThan(2)
    const struck = { x: was.x + 14, y: was.y + 26 }
    for (const k of h.all.values()) {
      const seat = was.all.get(k.name)!
      const size = seats[seatIndex[k.name]!]!
      const push = { x: k.x - seat.x, y: k.y - h.deckY - seat.y + was.deckY }
      if (Math.hypot(push.x, push.y) > 1) expect(push.x * (seat.x + size.w / 2 - struck.x) + push.y * (seat.y + size.h / 2 - struck.y), `key ${k.name}`).toBeGreaterThan(0)
    }
  })

  it('has them back within a few frames, so the arrow thrown back is what is seen after', () => {
    const h = hit()
    const was = at(h.i - 1)
    const most = (n: number): number => Math.max(...thrown(at(h.i + n), was).map((k) => k.far))
    expect(most(2)).toBeLessThan(most(0) * 0.6)
    expect(most(4)).toBeLessThan(1.5)
    expect(most(8)).toBeLessThan(0.3)
    expect(most(15)).toBe(0)
    expect(Math.abs(at(h.i + 11).deckY - was.deckY)).toBe(0)
    const flown = at(h.i + 6)
    expect(Math.hypot(flown.x - was.x, flown.y - was.y)).toBeGreaterThan(20)
  })

  it('throws a light on the caps and the deck that is strongest on the frame of the hit and out within seven frames', () => {
    const h = hit()
    const mark = (r: Row): Shape => r.list.find((x) => /^scorch-9000\d$/.test(x.id))!
    expect(mark(h).v![3]).toBe(1)
    const lights: Emitter[] = []
    const ctx = { list: [] as DrawList, byId: new Map<string, Shape>(), time: 0, light: (e: Emitter) => lights.push(e) } as unknown as RealContext
    const o: THREE.Object3D = turretLook.make(mark(h), ctx)
    const power = (n: number): number => {
      lights.length = 0
      turretLook.pose!(o, mark(at(h.i + n)), ctx)
      return lights.reduce((sum, e) => sum + e.power, 0)
    }
    const lit = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(power)
    expect(lit[0]).toBeGreaterThan(0.6)
    expect(lights.length).toBe(0)
    for (let n = 1; n < lit.length; n++) expect(lit[n]!).toBeLessThanOrEqual(lit[n - 1]!)
    expect(lit[2]!).toBeLessThan(lit[0]! * 0.6)
    expect(lit[4]!).toBeLessThan(lit[0]! * 0.25)
    expect(lit[7]).toBe(0)
  })
})

describe('polish keys: the page gives the arrow back on the live site', () => {
  const moment = (): { pile: Row; snap: Row; free: Row; follows: Row; shredded: Row } => {
    const shredded = first(0, (r) => r.gag === 'step1.shredded')
    const pile = first(shredded.i, (r) => r.damage.includes('shredded'))
    const snap = first(pile.i + 1, (r) => Math.abs(r.y - at(r.i - 1).y) > 0.5)
    const free = first(snap.i, (r) => !r.taken)
    const follows = first(free.i, (r) => Math.hypot(r.px - at(r.i - 1).px, r.py - at(r.i - 1).py) > 5 && Math.hypot(r.x - at(r.i - 1).x, r.y - at(r.i - 1).y) > 0.5)
    return { pile, snap, free, follows, shredded }
  }

  it('shows the arrow held: its tip under the hood, still for half a second, drawn out long toward the hood', () => {
    const { snap } = moment()
    for (let i = snap.i - 30; i < snap.i; i++) {
      const r = at(i)
      expect(r.taken, `frame ${i}`).toBe(true)
      expect(Math.hypot(r.x - at(i - 1).x, r.y - at(i - 1).y), `frame ${i}`).toBeLessThanOrEqual(0.2)
      expect(r.y).toBeLessThan(HOOD.y)
      expect(r.y).toBeGreaterThan(HOOD.y - 12)
    }
    expect(at(snap.i - 1).squash).toBeGreaterThan(1.2)
    expect(at(snap.i - 30).squash).toBeLessThan(at(snap.i - 1).squash)
    expect(at(snap.i - 1).damage).not.toContain('shredded')
  })

  it('lets go as a release: the cassette kicks, the arrow is thrown back short to where the pile lay and swings', () => {
    const { snap } = moment()
    expect(snap.slotY - at(snap.i - 1).slotY).toBeGreaterThan(10)
    expect(at(snap.i + 6).slotY - at(snap.i - 1).slotY).toBeLessThan(snap.slotY - at(snap.i - 1).slotY)
    expect(Math.min(snap.squash, at(snap.i + 1).squash)).toBeLessThan(0.75)
    expect(at(snap.i + 5).y - at(snap.i - 1).y).toBeGreaterThan(25)
    const landed = first(snap.i, (r) => Math.abs(r.y - PILE.y) < 3)
    expect(landed.i - snap.i).toBeLessThanOrEqual(9)
    const swing = [1, 2, 3, 4, 5, 6].map((n) => at(snap.i + n).turn - at(snap.i - 1).turn)
    expect(Math.max(...swing.map(Math.abs))).toBeGreaterThan(0.1)
  })

  it('stands for a short beat and then follows the visitor', () => {
    const { snap, free, follows } = moment()
    const still = rows.filter((r) => r.i > snap.i && r.i < follows.i && Math.hypot(r.x - at(r.i - 1).x, r.y - at(r.i - 1).y) < 1.5)
    expect(still.length).toBeGreaterThanOrEqual(3)
    expect(free.i - snap.i).toBeGreaterThanOrEqual(8)
    expect(free.i - snap.i).toBeLessThanOrEqual(10)
    const later = at(follows.i + 6)
    expect(Math.hypot(later.x - follows.x, later.y - follows.y)).toBeGreaterThan(40)
  })

  it('keeps the arrow from the visitor no longer than before, and inside the longest the page may hold it', () => {
    const { snap, free, follows, shredded } = moment()
    const taken = rows.filter((r) => r.i < free.i && r.taken)
    let from = free.i
    while (at(from - 1) && at(from - 1).taken) from--
    expect(taken.length).toBeGreaterThan(0)
    expect(free.i - from).toBeLessThanOrEqual(BEFORE.takenFrames)
    expect((free.i - from) / 60).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
    expect(free.i - shredded.i).toBeLessThanOrEqual(BEFORE.shreddedToFree)
    expect(follows.i - shredded.i).toBeLessThanOrEqual(BEFORE.shreddedToFollows)
    expect(snap.i).toBeLessThan(free.i)
  })
})

describe('polish keys: the film of step 1 is left as it was', () => {
  it('draws no held key, no thrown light, and its pile where it lay', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    let pile = false
    let struck = 0
    while (s.time < 32) {
      s.advance(stepHz / 60)
      const list: DrawList = []
      s.page.draw(list)
      for (const x of list) {
        if (x.id.startsWith('key-') && x.kind !== 'text' && x.v) expect(x.v.length).toBe(6)
        if (/^scorch-9000\d$/.test(x.id)) {
          expect(x.v!.length).toBe(3)
          struck++
        }
      }
      const c = s.cursor.pose()
      if (s.page.gag() === 'step1.shredded' && c.damage.includes('shredded')) {
        expect(c.y).toBeCloseTo(PILE.y, 5)
        pile = true
      }
    }
    expect(pile).toBe(true)
    expect(struck).toBeGreaterThan(0)
  })
})

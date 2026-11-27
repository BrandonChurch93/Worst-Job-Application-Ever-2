import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { SINK, TRAVEL } from '../src/pages/step1/keyboard'
import { keyboard } from '../src/pages/step1/real/keyboard'
import { turrets } from '../src/pages/step1/real/turrets'
import { RECOIL, recoilOf, TURRET } from '../src/pages/step1/turrets'
import type { RealContext } from '../src/real/types'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList, Shape } from '../src/stage/types'
import { type Row, visit } from './polish-keys-run'

interface FilmRow { n: number; list: DrawList; events: string[] }
let live: Row[] | null = null
let reel: FilmRow[] | null = null
const rows = (): Row[] => (live ??= visit())
const film = (): FilmRow[] => {
  if (reel) return reel
  const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
  const per = stepHz / 60
  reel = []
  let seen = 0
  let n = 0
  let events: string[] = []
  while (s.time < 32) {
    s.advance(1)
    n++
    events.push(...s.events.slice(seen).map((e) => e.name))
    seen = s.events.length
    if (n % per !== 0) continue
    const list: DrawList = []
    s.page.draw(list)
    reel.push({ n: n / per, list, events })
    events = []
  }
  return reel
}
const at = (i: number): Row => rows().find((r) => r.i === i)!
const shape = (list: DrawList, id: string): Shape | undefined => list.find((x) => x.id === id)
const sha = (lines: string[]): string => crypto.createHash('sha1').update(lines.map((l) => l + '\n').join('')).digest('hex')
const heard = (all: { n: number; events: string[] }[]): string[] => all.filter((r) => r.events.length > 0).map((r) => `${r.n}\t${r.events.join(',')}`)
const SHOT = 870
const PRESSED = 1479
const LET_GO = 1491
const HIT = 898
const FILM_SHOT = 248

describe('polish keys 2: a turret draws back, is thrown back by its shot and rings down', () => {
  const frame = 1 / 60

  it('creeps over the wind-up and is cocked over its last five frames, in px along its line', () => {
    const back = (framesBefore: number): number => recoilOf(1 - (framesBefore * frame) / TURRET.windup, 1)
    expect(back(0)).toBeCloseTo(RECOIL.creep + RECOIL.cock, 6)
    expect(back(5)).toBeLessThan(RECOIL.creep)
    expect(back(0) - back(5)).toBeGreaterThan(8)
    for (let n = 0; n < 4; n++) expect(back(n) - back(n + 1), `frame ${n} before the shot`).toBeGreaterThan(0.9)
    for (let n = 5; n < 20; n++) expect(back(n) - back(n + 1)).toBeLessThan(0.15)
  })

  it('is thrown back on the step of the shot and is still again inside nine frames', () => {
    expect(recoilOf(0, 0)).toBe(RECOIL.kick)
    expect(recoilOf(0, 0.012)).toBe(RECOIL.kick)
    expect(recoilOf(0, 0) - recoilOf(1, 1)).toBeGreaterThan(10)
    expect(recoilOf(0, frame)).toBeLessThan(RECOIL.kick * 0.45)
    expect(recoilOf(0, 2 * frame)).toBeLessThan(0)
    expect(Math.min(...[2, 3, 4].map((n) => recoilOf(0, n * frame)))).toBeGreaterThan(-RECOIL.kick * 0.4)
    for (let n = 5; n < 9; n++) expect(Math.abs(recoilOf(0, n * frame))).toBeLessThan(1.5)
    for (let n = 9; n < 60; n++) expect(recoilOf(0, n * frame)).toBe(0)
    expect(recoilOf(0, 1)).toBe(0)
  })

  it('shows it on the live site, frame by frame of the shot the visitor is hit by', () => {
    const back = (i: number): number => shape(at(i).list, 'turret-0')!.v![5]!
    expect(at(SHOT).events).toContain('bolt-fire')
    expect([865, 866, 867, 868, 869].map((i) => Math.round(back(i) * 10) / 10)).toEqual([1.6, 2.9, 5.2, 7.6, 9.4])
    expect([870, 871, 872, 873, 874, 875, 876, 877, 878, 879].map((i) => Math.round(back(i) * 10) / 10)).toEqual([22, 8.5, -3, -6, -3.4, -0, 1.4, 0.7, 0, 0])
    expect(back(SHOT) - back(SHOT - 1)).toBeGreaterThan(9)
  })

  it('shows it in the film too', () => {
    const back = (n: number): number => shape(film()[n - 1]!.list, 'turret-0')!.v![5]!
    expect(film()[FILM_SHOT - 1]!.events).toContain('bolt-fire')
    expect(back(FILM_SHOT - 1) - back(FILM_SHOT - 6)).toBeGreaterThan(7)
    expect(back(FILM_SHOT)).toBe(RECOIL.kick)
    expect(back(FILM_SHOT) - back(FILM_SHOT - 1)).toBeGreaterThan(10)
    expect(back(FILM_SHOT + 2)).toBeLessThan(0)
    expect(back(FILM_SHOT + 9)).toBe(0)
  })
})

describe('polish keys 2: a bolt flies as it flew', () => {
  const centre = (list: DrawList, id: string): { x: number; y: number; z: number } => {
    const b = shape(list, id)!
    return { x: b.x + b.w / 2, y: b.y + b.h / 2, z: b.z0 }
  }

  it('goes 1500 px a second on the same line on the live site: 28 frames from the muzzle to the arrow', () => {
    expect(TURRET.boltSpeed).toBe(1500)
    const flown = rows().filter((r) => shape(r.list, 'bolt-0')).map((r) => r.i)
    expect(flown[0]).toBe(SHOT)
    expect(flown[flown.length - 1]).toBe(HIT - 1)
    expect(flown.length).toBe(28)
    const first = centre(at(SHOT).list, 'bolt-0')
    const last = centre(at(HIT - 1).list, 'bolt-0')
    expect([first.x, first.y, first.z].map((n) => Math.round(n * 10) / 10)).toEqual(LIVE_PATH.first)
    expect([last.x, last.y, last.z].map((n) => Math.round(n * 10) / 10)).toEqual(LIVE_PATH.last)
    for (let i = SHOT + 1; i < HIT; i++) {
      const a = centre(at(i - 1).list, 'bolt-0')
      const b = centre(at(i).list, 'bolt-0')
      expect(Math.hypot(b.x - a.x, b.y - a.y), `frame ${i}`).toBeCloseTo(25, 6)
    }
    expect(at(HIT).events).toContain('bolt-hit-cursor')
  })

  it('goes the same way in the film', () => {
    const flown = film().filter((r) => shape(r.list, 'bolt-0')).map((r) => r.n)
    expect([flown[0], flown[flown.length - 1], flown.length]).toEqual([FILM_SHOT, 272, 25])
    const first = centre(film()[FILM_SHOT - 1]!.list, 'bolt-0')
    const last = centre(film()[271]!.list, 'bolt-0')
    expect([first.x, first.y, first.z].map((n) => Math.round(n * 10) / 10)).toEqual(FILM_PATH.first)
    expect([last.x, last.y, last.z].map((n) => Math.round(n * 10) / 10)).toEqual(FILM_PATH.last)
    for (let n = FILM_SHOT + 1; n <= 272; n++) {
      const a = centre(film()[n - 2]!.list, 'bolt-0')
      const b = centre(film()[n - 1]!.list, 'bolt-0')
      expect(Math.hypot(b.x - a.x, b.y - a.y), `frame ${n}`).toBeCloseTo(25, 6)
    }
  })
})

const LIVE_PATH = { first: [288.2, 894, 69.8], last: [962.8, 916.6, 44.3] }
const FILM_PATH = { first: [300.5, 886.6, 69.2], last: [898.9, 841.8, 44.3] }

describe('polish keys 2: what is heard on step 1 is what was heard', () => {
  it('holds the same events at the same frames on the live site', () => {
    const list = heard(rows().map((r) => ({ n: r.i, events: r.events })))
    expect(list.length).toBe(178)
    expect(sha(list)).toBe('b50cfa60ed098d43f489ebacede64bcebbba1ade')
  })

  it('holds the same events at the same frames in the film', () => {
    const list = heard(film())
    expect(list.length).toBe(311)
    expect(sha(list)).toBe('8d251c75bbb7c6f8f7d17f1e79cfbbd83e0cab61')
    expect(list.filter((l) => l.includes('bolt-hit-cursor'))).toEqual(['349\tbolt-hit,bolt-hit-cursor,sizzle'])
    expect(list.filter((l) => l.includes('bolt-fire')).slice(0, 6).map((l) => Number(l.split('\t')[0]))).toEqual([248, 275, 302, 329, 356, 383])
  })
})

describe('polish keys 2: the page answers a hit on the arrow', () => {
  const thrown = (i: number, name: string): number => {
    const was = at(HIT - 1)
    const k = at(i).all.get(name)!
    const seat = was.all.get(name)!
    return Math.hypot(k.x - seat.x, k.y - at(i).deckY - seat.y + was.deckY)
  }

  it('throws the caps round the strike outward for two frames, the near ones more than the far ones, and has them back in five', () => {
    for (const name of ['f', 'g', 'h', 'v', 'b']) {
      expect(thrown(HIT, name), name).toBeGreaterThan(3)
      expect(thrown(HIT + 1, name) / thrown(HIT, name), name).toBeGreaterThan(0.95)
      expect(thrown(HIT + 2, name) / thrown(HIT, name), name).toBeLessThan(0.5)
      expect(thrown(HIT + 4, name), name).toBeLessThan(1.5)
      expect(thrown(HIT + 8, name), name).toBeLessThan(0.3)
      expect(thrown(HIT + 13, name), name).toBe(0)
    }
    expect(thrown(HIT, 'g')).toBeGreaterThan(thrown(HIT, 't'))
    expect(thrown(HIT, 't')).toBeGreaterThan(thrown(HIT, 'q'))
  })

  it('jolts the deck on the frame of the hit and stills it inside eleven frames', () => {
    const was = at(HIT - 1).deckY
    expect(Math.abs(at(HIT).deckY - was)).toBeGreaterThan(2.5)
    expect(Math.abs(at(HIT + 11).deckY - was)).toBe(0)
  })

  it('presses no key, as round 23 ruled, and leaves no key hot that the bolt did not strike', () => {
    for (let i = HIT; i < HIT + 13; i++) {
      for (const k of at(i).all.values()) {
        expect(k.depth, `${k.name} on ${i}`).toBe(0)
        expect(k.sink, `${k.name} on ${i}`).toBe(0)
        expect(k.heat, `${k.name} on ${i}`).toBe(0)
      }
    }
  })
})

describe('polish keys 2: a key the visitor presses goes to a bottom, stands there and springs back', () => {
  const sink = (i: number): number => Math.round(at(i).all.get('a')!.sink * 100) / 100 + 0

  it('is at its bottom on the second frame, stands eleven frames, and is over its seat for five frames after it is let go', () => {
    expect(sink(PRESSED - 1)).toBe(0)
    expect([PRESSED, PRESSED + 1].map(sink)).toEqual([0.71, 1])
    for (let i = PRESSED + 1; i < LET_GO; i++) expect(sink(i), `frame ${i}`).toBe(1)
    expect([0, 1, 2, 3, 4, 5, 6].map((n) => sink(LET_GO + n))).toEqual([0.29, -0.42, -0.29, -0.17, -0.08, -0.02, 0])
    for (let i = LET_GO + 6; i < LET_GO + 30; i++) expect(sink(i), `frame ${i}`).toBe(0)
    expect(at(PRESSED + 1).all.get('a')!.depth).toBe(1)
    expect(TRAVEL).toBe(6)
    expect([SINK.x, SINK.y]).toEqual([5.5, 5.5])
  })

  it('throws the barrel back inside a sleeve that stays where it stands at rest, so no more of its rear end shows over the dome', () => {
    const gun = (i: number): { sleeve: THREE.Mesh; barrel: THREE.Group; back: number } => {
      const list = at(i).list
      const t = shape(list, 'turret-0')!
      const ctx = { page: 'step1', list, byId: new Map(list.map((x) => [x.id, x])), time: i / 60, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} } as unknown as RealContext
      const o = turrets.make(t, ctx)
      turrets.pose!(o, t, ctx)
      const d = o.userData.turret as { sleeve: THREE.Mesh; barrel: THREE.Group }
      return { sleeve: d.sleeve, barrel: d.barrel, back: t.v![5]! }
    }
    const rest = gun(SHOT + 12)
    expect(rest.back).toBe(0)
    for (const i of [SHOT - 3, SHOT, SHOT + 1, SHOT + 3]) {
      const g = gun(i)
      expect(g.sleeve.position.toArray(), `frame ${i}`).toEqual(rest.sleeve.position.toArray())
      expect(g.sleeve.rotation.y, `frame ${i}`).toBe(rest.sleeve.rotation.y)
      const lift = -g.barrel.rotation.y
      expect(rest.barrel.position.x - g.barrel.position.x, `frame ${i}`).toBeCloseTo(g.back * Math.cos(lift), 6)
      expect(rest.barrel.position.z - g.barrel.position.z, `frame ${i}`).toBeCloseTo(g.back * Math.sin(lift), 6)
    }
    expect(gun(SHOT).back).toBeCloseTo(RECOIL.kick, 6)
    expect(Math.min(...[1, 2, 3, 4, 5].map((n) => gun(SHOT + n).back))).toBeGreaterThan(-8)
  })

  interface Deck { caps: Map<string, { start: number; count: number }>; body: THREE.Mesh; shades: THREE.InstancedMesh }
  const posed = (i: number): { data: Deck; deck: Shape; cap: Shape } => {
    const list = at(i).list
    const deck = shape(list, 'keyboard-deck')!
    const ctx = { page: 'step1', list, byId: new Map(list.map((x) => [x.id, x])), time: i / 60, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} } as unknown as RealContext
    const o = keyboard.make(deck, ctx)
    keyboard.pose!(o, deck, ctx)
    return { data: o.userData.deck as Deck, deck, cap: shape(list, 'key-a')! }
  }
  const tones = (d: Deck, cap: Shape): { upperLeft: number; lowerRight: number; all: number[] } => {
    const slot = d.caps.get('key-a')!
    const p = d.body.geometry.getAttribute('position')
    const c = d.body.geometry.getAttribute('color')
    let ul = { far: -Infinity, tone: 0 }
    let lr = { far: -Infinity, tone: 0 }
    const all: number[] = []
    for (let n = slot.start; n < slot.start + slot.count; n++) {
      all.push(c.getX(n))
      if (-p.getX(n) + p.getY(n) > ul.far) ul = { far: -p.getX(n) + p.getY(n), tone: c.getX(n) }
      if (p.getX(n) - p.getY(n) > lr.far) lr = { far: p.getX(n) - p.getY(n), tone: c.getX(n) }
    }
    expect(cap.w).toBeGreaterThan(0)
    return { upperLeft: ul.tone, lowerRight: lr.tone, all }
  }

  it('shades the sunk cap along its upper and left edges and darkens the bed round its seat, and neither is there at rest', () => {
    const rest = posed(PRESSED - 2)
    const down = posed(PRESSED + 4)
    const up = posed(LET_GO + 8)
    const flat = tones(rest.data, rest.cap)
    expect(Math.min(...flat.all)).toBe(1)
    const sunk = tones(down.data, down.cap)
    expect(sunk.lowerRight).toBeGreaterThan(0.75)
    expect(sunk.lowerRight).toBeLessThanOrEqual(0.76)
    expect(sunk.upperLeft).toBeGreaterThanOrEqual(0.26 - 1e-6)
    expect(sunk.upperLeft).toBeLessThan(0.4)
    expect(Math.min(...tones(up.data, up.cap).all)).toBe(1)
    expect(down.data.shades.count).toBe(rest.data.shades.count + 2)
    expect(up.data.shades.count).toBe(rest.data.shades.count)
    const seatX = down.cap.x + down.cap.w / 2 - (down.deck.x + down.deck.w / 2)
    const seatY = -(down.cap.y + down.cap.h / 2 - (down.deck.y + down.deck.h / 2))
    const m = new THREE.Matrix4()
    const where = new THREE.Vector3()
    const size = new THREE.Vector3()
    const hits: { x: number; y: number; w: number; h: number }[] = []
    for (let n = 0; n < down.data.shades.count; n++) {
      down.data.shades.getMatrixAt(n, m)
      m.decompose(where, new THREE.Quaternion(), size)
      if (Math.abs(where.x - seatX) < 0.01 && Math.abs(where.y - seatY) < 0.01) hits.push({ x: where.x, y: where.y, w: size.x, h: size.y })
    }
    expect(hits.length).toBe(2)
    for (const h of hits) {
      expect(h.w).toBeCloseTo(down.cap.w + 16, 2)
      expect(h.h).toBeCloseTo(down.cap.h + 16, 2)
    }
  })
})

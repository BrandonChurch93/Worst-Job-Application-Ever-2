import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { healNext, leadAim, newFight, shielded, stepFight, weakSide, type Arena, type Fight } from '../src/boss/fight'
import { BODY, DART, HOME } from '../src/boss/plan'
import { BIG, CORNER, FLAT, GUARD, GUN, HEAL, MERCY, REAL_DART, SOLID, TOP } from '../src/boss/tune'
import { HOLD, UNIT_SECONDS } from '../src/pages/step4/script'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, isHeader, ScriptDriver, Stage, type Driver, type DriverView, type FlowEntry, type Pointer } from '../src/stage/stage'
import type { Shape, StepIo } from '../src/stage/types'

const SCREEN = { w: 1920, h: 1080 } as const
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const live = (driver: Driver): Stage => new Stage({ mode: 'live', flow, pages, driver, seed: config.seed })
const arena: Arena = { popups: [] }
const FIGHT = /^boss\.(slabs|popups|lastStand)$/

const io = (pressed: boolean, cursor: { x: number; y: number }, events: string[], mode = 'live'): StepIo =>
  ({ dt: 1 / stepHz, time: 0, mode, pressed, pointer: { ...cursor, down: pressed }, cursor: { ...cursor, damaged: false, act: () => undefined, react: () => undefined, hurt: () => undefined, knock: () => undefined }, emit: (name: string) => void events.push(name) }) as unknown as StepIo

const volley = (f: Fight, at: { x: number; y: number }, events: string[]): void => {
  stepFight(f, io(true, at, events), arena)
  for (let i = 0; i < stepHz * 1.2; i++) stepFight(f, io(false, at, events), arena)
}

// The box a shape can reach on the screen, whatever way it is turned.
const reach = (s: Shape): { x0: number; y0: number; x1: number; y1: number } => {
  if (!s.rot) return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h }
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const c = Math.abs(Math.cos(s.rot))
  const n = Math.abs(Math.sin(s.rot))
  const hx = (s.w * c + s.h * n) / 2
  const hy = (s.w * n + s.h * c) / 2
  return { x0: cx - hx, y0: cy - hy, x1: cx + hx, y1: cy + hy }
}
// How far a shape stays from a box: the least distance between the sides of the two, with the shape turned as it is drawn, so that a long line that is turned counts by where it lies and not by the box round it. Below zero when they overlap.
const gapTo = (s: Shape, box: readonly [number, number, number, number]): number => {
  const b = reach(s)
  const flat = Math.max(box[0] - b.x1, b.x0 - box[2], box[1] - b.y1, b.y0 - box[3])
  if (!s.rot) return flat
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  const c = Math.cos(s.rot)
  const n = Math.sin(s.rot)
  const mine = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [cx + (i! * s.w * c - j! * s.h * n) / 2, cy + (i! * s.w * n + j! * s.h * c) / 2])
  const its = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]]
  const local = its.map(([x, y]) => [(x! - cx) * c + (y! - cy) * n, -(x! - cx) * n + (y! - cy) * c])
  const apart = (i: number, half: number): boolean => local.every((k) => k[i]! > half) || local.every((k) => k[i]! < -half)
  if (flat <= 0 && !apart(0, s.w / 2) && !apart(1, s.h / 2)) return flat
  const toSide = (p: number[], a: number[], z: number[]): number => {
    const dx = z[0]! - a[0]!
    const dy = z[1]! - a[1]!
    const u = Math.min(1, Math.max(0, ((p[0]! - a[0]!) * dx + (p[1]! - a[1]!) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(p[0]! - a[0]! - dx * u, p[1]! - a[1]! - dy * u)
  }
  let least = Infinity
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) least = Math.min(least, toSide(mine[i]!, its[j]!, its[(j + 1) % 4]!), toSide(its[i]!, mine[j]!, mine[(j + 1) % 4]!))
  return least
}
const onScreen = (s: Shape): boolean => {
  const b = reach(s)
  return b.x1 > 0 && b.x0 < SCREEN.w && b.y1 > 0 && b.y0 < SCREEN.h
}
const OF_THE_FIGHT = /^(boss-|solid-|break-|guard-wing-|weak-lamp|gun-tell|corner-|bullet-|big-|scorch-|popup-up-|banner-up|muzzle-|dart-|spark-|health-|socket-open|rim-socket-open|power-|arrow-flat|finish-|smoke)/
const OF_THE_VISITOR = /^(muzzle-|dart-)/

interface Seen { time: number; list: Shape[]; fight: Fight }

function watch(stage: Stage, every: number, until: number): { frames: Seen[]; all: Seen[] } {
  const frames: Seen[] = []
  const all: Seen[] = []
  let since = -1
  while (stage.page.id === 'step4' && stage.time < until) {
    stage.advance(every)
    if (stage.page.id !== 'step4') break
    const gag = stage.page.gag() ?? ''
    if (!FIGHT.test(gag)) {
      since = -1
      continue
    }
    if (since < 0) since = stage.time
    const seen = { time: stage.time, list: stage.frameAt(stage.time).list as Shape[], fight: (stage.page.save() as { fight: Fight }).fight }
    all.push(seen)
    if (stage.time - since >= TOP.move + 0.1) frames.push(seen)
  }
  return { frames, all }
}

const runs: [string, () => Stage, number][] = [
  ['the film', film, 2],
  ['a keen visitor', () => live(new BotDriver('keen', config.seed)), 4],
  ['a clumsy visitor', () => live(new BotDriver('clumsy', config.seed)), 4]
]

describe('how the boss plays (change 002, item 15)', () => {
  it('A. lets a volley on the shield take almost nothing and a volley that got round it take its full worth', () => {
    const front = newFight(HOME.x, HOME.y)
    const a: string[] = []
    volley(front, { x: 450, y: 900 }, a)
    expect(a.filter((e) => e === 'shield-glance').length).toBe(DART.volley)
    expect(a.filter((e) => e === 'shot-round').length).toBe(0)
    expect(100 - front.health).toBeCloseTo(GUARD.chip * DART.volley, 6)
    expect(100 - front.health).toBeLessThan(0.05)
    const flank = newFight(HOME.x, HOME.y)
    flank.face = Math.PI
    const b: string[] = []
    volley(flank, { x: HOME.x + 290, y: HOME.y - 60 }, b)
    expect(b.filter((e) => e === 'shot-round').length).toBe(DART.volley)
    expect(b.filter((e) => e === 'shield-glance').length).toBe(0)
    expect(100 - flank.health).toBeCloseTo(REAL_DART[0] * DART.volley, 6)
    expect((100 - flank.health) / (100 - front.health)).toBeGreaterThan(50)
  })

  it('A. moves the health bar by less than a pixel for a whole volley on the shield', () => {
    const stage = film()
    const drops: number[] = []
    let was = -1
    let glanced = 0
    while (stage.time < 11.4 + HOLD && !stage.events.some((e) => e.name === 'shot-round')) {
      stage.advance(1)
      const now = stage.events.filter((e) => e.name === 'shield-glance').length
      const fill = (stage.frameAt(stage.time).list as Shape[]).find((s) => s.id === 'health-fill')
      if (fill && was >= 0 && now > glanced) drops.push(was - fill.w)
      if (fill) was = fill.w
      glanced = now
    }
    expect(drops.length).toBeGreaterThanOrEqual(5)
    expect(drops.reduce((x, y) => x + y, 0)).toBeLessThan(1)
  })

  it('A. shows the open side after six darts in a row have glanced off, and again every few seconds, on the flank away from the shield', () => {
    const f = newFight(HOME.x, HOME.y)
    const events: string[] = []
    const at = { x: 450, y: 700 }
    let first = -1
    const tells: number[] = []
    for (let i = 0; i < stepHz * 12; i++) {
      const before = events.length
      stepFight(f, io(i % Math.round(stepHz / 4) === 0, at, events), arena)
      if (events.slice(before).includes('weak-tell')) {
        if (first < 0) first = events.filter((e) => e === 'shield-glance').length
        tells.push(i / stepHz)
        const w = weakSide(f)
        expect(shielded(f, w.x, w.y)).toBe(false)
        expect(Math.hypot(w.x - at.x, w.y - at.y)).toBeGreaterThan(Math.hypot(f.x - at.x, f.y - at.y))
      }
    }
    expect(first).toBeGreaterThanOrEqual(GUARD.tellAfter)
    expect(first).toBeLessThanOrEqual(GUARD.tellAfter + DART.volley)
    expect(tells.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < tells.length; i++) expect(tells[i]! - tells[i - 1]!).toBeGreaterThanOrEqual(GUARD.tellEvery - 0.01)
    expect(events.filter((e) => e === 'shot-round').length).toBeLessThan(events.filter((e) => e === 'shield-glance').length / 20)
  })

  it('C. sets the four cannons in the four corners of the whole screen, aside of the box round the health bar', () => {
    expect(CORNER.at.length).toBe(4)
    for (const [x, y] of CORNER.at) {
      expect(Math.min(x, SCREEN.w - x)).toBeLessThanOrEqual(CORNER.base * 2)
      expect(Math.min(y, SCREEN.h - y)).toBeLessThanOrEqual(CORNER.base * 2.1)
      expect(y - CORNER.base).toBeGreaterThanOrEqual(0)
      expect(y + CORNER.base).toBeLessThanOrEqual(SCREEN.h)
      expect(x - CORNER.base).toBeGreaterThanOrEqual(0)
      expect(x + CORNER.base).toBeLessThanOrEqual(SCREEN.w)
      expect(x + CORNER.base <= SOLID.bar[0] - TOP.clear || x - CORNER.base >= SOLID.bar[2] + TOP.clear).toBe(true)
    }
    expect(new Set(CORNER.at.map(([x, y]) => `${x < SCREEN.w / 2}${y < SCREEN.h / 2}`)).size).toBe(4)
  })

  it('C. aims its shots ahead of a moving arrow, and never the whole way', () => {
    const f = newFight(HOME.x, HOME.y)
    const from = { x: 84, y: 996 }
    const c = { x: 700, y: 600 }
    f.vel = { x: 0, y: 0 }
    expect(leadAim(f, from, c, CORNER.speed)).toEqual(c)
    f.vel = { x: 300, y: 0 }
    const to = leadAim(f, from, c, CORNER.speed)
    const flight = Math.hypot(c.x - from.x, c.y - from.y) / CORNER.speed
    expect(to.x - c.x).toBeGreaterThan(0)
    expect(to.x - c.x).toBeCloseTo(Math.min(GUN.leadMost, 300 * flight * GUN.lead), 3)
    expect(to.x - c.x).toBeLessThan(300 * flight)
    f.vel = { x: 4000, y: 0 }
    const far = leadAim(f, from, c, CORNER.speed)
    expect(Math.hypot(far.x - c.x, far.y - c.y)).toBeLessThanOrEqual(GUN.leadMost + 1e-6)
  })

  it('D. gives back less with each hit, so that all the heals together stay under fifteen points', () => {
    let sum = 0
    for (let n = 0; n < 200; n++) {
      if (n > 0) expect(healNext(n)).toBeLessThan(healNext(n - 1))
      sum += healNext(n)
    }
    expect(healNext(0)).toBe(HEAL.first)
    expect(sum).toBeLessThan(15)
    expect(FLAT.down).toBeLessThan(1)
    expect(FLAT.safe).toBeGreaterThan(FLAT.life)
  })

  it('D. flattens a visitor who stands and clicks again and again, gives the boss back under fifteen points in all, and never ends his visit', () => {
    let at: { x: number; y: number } | null = null
    const bot = new BotDriver('keen', config.seed)
    const stand: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        if (!FIGHT.test(v.page.gag() ?? '')) return bot.input(v)
        at ??= { x: v.cursor.x, y: v.cursor.y }
        return { ...at, down: Math.floor(v.time * 8) % 2 === 0 }
      }
    }
    const stage = live(stand)
    const clock = (): number => (stage.page.save() as { fight: Fight | null }).fight?.clock ?? 0
    while (stage.page.id === 'step4' && clock() < MERCY.from - 1) stage.advance(12)
    expect(stage.page.id).toBe('step4')
    const f = (stage.page.save() as { fight: Fight }).fight
    const flat = stage.events.filter((e) => e.name === 'flatten').length
    expect(flat).toBeGreaterThan(4)
    expect(stage.events.filter((e) => e.name === 'peel-up').length).toBeGreaterThanOrEqual(flat - 1)
    expect(f.healed).toBeLessThan(15)
    expect(f.health).toBeGreaterThan(50)
    expect(stage.events.some((e) => e.name === 'power-down')).toBe(false)
    expect(stage.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it.each(runs)('note of 21:27. in %s nothing of the header, the rail or the form is inside the screen during the fight', (_name, make, every) => {
    const { frames } = watch(make(), every, 120)
    expect(frames.length).toBeGreaterThan(200)
    const inside = new Set<string>()
    for (const f of frames) {
      for (const s of f.list) {
        if (isHeader(s.id)) {
          if (s.y + s.h > 0) inside.add(s.id)
        } else if (!OF_THE_FIGHT.test(s.id) && onScreen(s)) inside.add(s.id.replace(/\d+/g, 'N'))
      }
    }
    expect([...inside]).toEqual([])
  })

  it.each(runs)('note of 21:27. in %s the health bar stands alone at the top, and the boss, its shield, its turret, the cannons, the bullets and every flash keep the band under it clear', (name, make, every) => {
    const { frames } = watch(make(), every, 120)
    const [fx0, fy0, fx1, fy1] = SOLID.frame
    let least = Infinity
    let who = ''
    for (const f of frames) {
      const track = f.list.find((s) => s.id === 'health-track')!
      expect(track.y).toBeCloseTo(TOP.bar, 3)
      for (const s of f.list) {
        if (!s.id.startsWith('health-')) continue
        expect(s.x, s.id).toBeGreaterThanOrEqual(fx0)
        expect(s.x + s.w, s.id).toBeLessThanOrEqual(fx1)
        expect(s.y, s.id).toBeGreaterThanOrEqual(fy0)
        expect(s.y + s.h, s.id).toBeLessThanOrEqual(fy1)
      }
      for (const s of f.list) {
        if (s.id.startsWith('health-') || isHeader(s.id)) continue
        if (name !== 'the film' && OF_THE_VISITOR.test(s.id)) continue
        const gap = gapTo(s, SOLID.frame)
        if (gap < least) {
          least = gap
          who = `${s.id} at ${f.time.toFixed(2)}`
        }
        expect(gap, `${s.id} at ${f.time.toFixed(2)}`).toBeGreaterThanOrEqual(TOP.clear)
      }
    }
    expect(who).not.toBe('')
    expect(least).toBeGreaterThanOrEqual(TOP.clear)
  })

  it('note of 21:27. keeps the stand-in boss no larger than the boss of the build before', () => {
    const { all } = watch(film(), 2, 28)
    for (const f of all) {
      const far = f.list.filter((s) => /^(boss-|guard-wing-)/.test(s.id) && s.id !== 'boss-shade' && !s.id.startsWith('boss-turret')).map((s) => {
        const b = reach(s)
        return Math.max(Math.hypot(b.x0 - f.fight.x, b.y0 - f.fight.y), Math.hypot(b.x1 - f.fight.x, b.y1 - f.fight.y))
      })
      expect(Math.max(...far), `at ${f.time.toFixed(2)}`).toBeLessThanOrEqual(GUARD.radius + GUARD.thick + 240)
    }
    expect(BODY.rx).toBe(196)
    expect(BODY.ry).toBe(118)
  })

  it('note of 21:47. fires bullets and no validation slab: about 28 px across, each gun after its tell, slow enough to leave their way', () => {
    for (const [name, make, every] of runs) {
      const stage = make()
      const { all } = watch(stage, every, 120)
      const ids = new Set(all.flatMap((f) => f.list.map((s) => s.id.replace(/\d+/g, 'N'))))
      expect(ids.has('bullet-N'), name).toBe(true)
      expect(ids.has('bullet-N-trail'), name).toBe(true)
      expect([...ids].filter((id) => /^(fired-|slab-)/.test(id)), name).toEqual([])
      expect(stage.events.some((e) => e.page === 'step4' && e.name === 'slab-drop'), name).toBe(false)
      const at = (n: string): number[] => stage.events.filter((e) => e.page === 'step4' && e.name === n).map((e) => e.step / stepHz)
      const tells = at('cannon-tell')
      const fires = at('cannon-fire')
      expect(fires.length, name).toBeGreaterThanOrEqual(1)
      for (const t of fires) expect(tells.some((x) => Math.abs(t - x - CORNER.tell) < 0.02), `${name} cannon at ${t}`).toBe(true)
      const big = at('big-fire')
      for (const t of big) expect(at('big-tell').some((x) => Math.abs(t - x - BIG.tell) < 0.02), `${name} blast at ${t}`).toBe(true)
      expect(at('arena-break'), name).toEqual(big)
    }
    expect(GUN.r * 2).toBe(28)
    expect(Math.max(...GUN.speed, CORNER.speed)).toBeLessThanOrEqual(600)
    expect(GUN.tell).toBeGreaterThanOrEqual(0.5)
    expect(CORNER.tell).toBeGreaterThanOrEqual(0.8)
    expect(BIG.tell).toBeGreaterThanOrEqual(1.5)
  })

  it('note of 21:47. raises the big turret only when the body is whole, leaves the word Submit in its place on the button the whole time, and blows the turret off when the boss falls', () => {
    const stage = film()
    const offsets: { time: number; dx: number; dy: number; w: number; h: number; turret: boolean; over: boolean }[] = []
    let label: Shape | null = null
    while (stage.page.id === 'step4' && stage.time < UNIT_SECONDS - 0.6) {
      stage.advance(2)
      const list = stage.frameAt(stage.time).list as Shape[]
      label ??= list.find((s) => s.id === 'submit-label') ?? null
      const cap = list.find((s) => s.id === 'boss-cap')
      const word = list.find((s) => s.id === 'boss-cap-word')
      const turret = list.find((s) => s.id === 'boss-turret')
      if (!cap) continue
      expect(word, `the word at ${stage.time.toFixed(2)}`).toBeDefined()
      const over = !!turret && turret.x < word!.x + word!.w && turret.x + turret.w > word!.x && turret.y < word!.y + word!.h && turret.y + turret.h > word!.y
      offsets.push({ time: stage.time, dx: word!.x - cap.x, dy: word!.y - cap.y, w: word!.w, h: word!.h, turret: !!turret, over })
    }
    const at = (n: string): number => stage.events.find((e) => e.name === n)!.step / stepHz
    const rise = at('turret-rise')
    const lock = at('turret-lock')
    const off = at('turret-off')
    expect(at('unfold')).toBeLessThan(rise)
    expect(lock - rise).toBeGreaterThan(0.6)
    expect(off).toBe(at('power-down'))
    expect(label).not.toBeNull()
    for (const o of offsets) {
      expect(Math.abs(o.dx - offsets[0]!.dx), `across at ${o.time.toFixed(2)}`).toBeLessThan(1.5)
      expect(Math.abs(o.dy - offsets[0]!.dy), `down at ${o.time.toFixed(2)}`).toBeLessThan(1.5)
      expect(o.w).toBeCloseTo(label!.w, 3)
      expect(o.h).toBeCloseTo(label!.h, 3)
      if (o.time < rise) expect(o.turret, `no turret at ${o.time.toFixed(2)}`).toBe(false)
      if (o.time < rise + BIG.up - BIG.rise) expect(o.over, `the word clear at ${o.time.toFixed(2)}`).toBe(false)
      if (o.time > lock + 0.05 && o.time < off) expect(o.over, `the turret over the word at ${o.time.toFixed(2)}`).toBe(true)
      if (o.time > off + BIG.off + 0.05) expect(o.turret, `the turret gone at ${o.time.toFixed(2)}`).toBe(false)
    }
    expect(offsets.some((o) => o.time > off + BIG.off + 0.05)).toBe(true)
    expect(stage.events.some((e) => e.name === 'button-press')).toBe(true)
  })

  it('emits every event of the rules in the film, each inside the time the film gives step 4', () => {
    const stage = film()
    stage.advance(Math.round((UNIT_SECONDS - 1) * stepHz))
    const names = new Set(stage.events.map((e) => e.name))
    for (const n of ['shield-glance', 'shot-round', 'weak-tell', 'cannon-tell', 'cannon-fire', 'slab-fire', 'flatten', 'peel-up', 'boss-heal', 'boss-move', 'turret-rise', 'turret-lock', 'big-tell', 'big-fire', 'arena-break', 'power-down', 'turret-off', 'boss-formed', 'boss-turn', 'boss-music', 'power-up', 'boss-fall', 'finish-arms', 'finish-charge', 'finish-fire', 'boss-gone', 'button-down']) expect(names.has(n), n).toBe(true)
    const flat = stage.events.filter((e) => e.name === 'flatten')
    expect(flat.length).toBe(1)
    expect(flat[0]!.hitsCursor).toBe(true)
    expect(stage.events.filter((e) => e.hitsCursor).length).toBe(1)
  })

  it('E. ends on the skip link at any moment of the fight, with the header and the rail off the screen', () => {
    for (const at of [22, 30, 45]) {
      let skip = false
      const stand: Driver = { name: 'bot', input: (v: DriverView): Pointer => ({ x: 96 + 40 * Math.sin(v.time * 3), y: 620 + 30 * Math.cos(v.time * 2), down: Math.floor(v.time * 5) % 2 === 0, skip: skip && v.skipOffered }) }
      const tick = new BotDriver('keen', config.seed)
      const stage = live({ name: 'bot', input: (v: DriverView): Pointer => (FIGHT.test(v.page.gag() ?? '') ? stand.input(v) : { ...tick.input(v), skip: false }) })
      while (stage.page.id === 'step4' && stage.time < at) stage.advance(6)
      expect(stage.page.id).toBe('step4')
      expect(stage.page.gag()).toMatch(FIGHT)
      expect(stage.skipOffered).toBe(true)
      expect(stage.page.chrome!()!.header).toBe(0)
      skip = true
      const from = stage.time
      while (stage.page.id === 'step4' && stage.time < from + 10) stage.advance(1)
      expect(stage.events.some((e) => e.name === 'skip')).toBe(true)
      expect(stage.page.id, `skip at ${at}`).not.toBe('step4')
      expect(stage.time - from).toBeLessThan(4)
    }
  })
})

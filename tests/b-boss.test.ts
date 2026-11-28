import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { earlyEnd } from '../src/audio/cues'
import { healNext, leadAim, newFight, shielded, stepFight, weakSide, type Arena, type Fight } from '../src/boss/fight'
import { ARENA as GROUND } from '../src/arena/layout'
import { barDrop, clamp01 } from '../src/arena/change'
import { WISP_CLEAR, wispsOf } from '../src/arena/finish'
import { scorchFrom, scorchOf } from '../src/arena/scorch'
import { FIRE, finishState, POWER, powerPlan } from '../src/boss/finish/acting'
import { BEAM } from '../src/boss/finish/fx'
import { drawnBoxes, figureBox } from '../src/boss/spot'
import { bigMuzzleOf, muzzleOf, poseOf, SIZE } from '../src/boss/look1/pose'
import { BODY, DART, FALLEN, HOME, SOCKET, UNFOLD, WAKE_AFTER_TICK } from '../src/boss/plan'
import { BIG, CLOSE, CORNER, FINISH, FLAT, GUARD, GUN, HEAL, LAST, LINE6, LINE7, LOOK1_ON, MERCY, RAISE, REAL_DART, SHOUT, SOLID, TOP } from '../src/boss/tune'
import type { BossView } from '../src/boss/view'
import { finishNow, viewNow } from '../src/boss/viewof'
import { SHIFT, UNIT_SECONDS } from '../src/pages/step4/script'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { project, toWorld } from '../src/stage/camera'
import { filmFlow, filmOptions, isHeader, ScriptDriver, Stage, type Driver, type DriverView, type FlowEntry, type Pointer } from '../src/stage/stage'
import type { Shape, StepIo } from '../src/stage/types'

const SCREEN = { w: 1920, h: 1080 } as const
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const live = (driver: Driver): Stage => new Stage({ mode: 'live', flow, pages, driver, seed: config.seed })
const arena: Arena = { popups: [] }
const FIGHT = /^boss\.(slabs|popups|lastStand)$/

const io = (pressed: boolean, cursor: { x: number; y: number }, events: string[], mode = 'live'): StepIo =>
  ({ dt: 1 / stepHz, time: 0, mode, pressed, pointer: { ...cursor, down: pressed }, cursor: { ...cursor, damaged: false, act: () => undefined, react: () => undefined, hurt: () => undefined, knock: () => undefined, press: () => undefined, spread: () => undefined }, emit: (name: string) => void events.push(name) }) as unknown as StepIo

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
const OF_THE_FIGHT = /^(boss-|solid-|break-|guard-wing-|weak-lamp|gun-tell|corner-|bullet-|big-|scorch-|popup-up-|banner-up|muzzle-|dart-|spark-|health-|socket-open|rim-socket-open|power-|arrow-dent|arrow-crack-|arrow-dust-|finish-|smoke|arena$|arena-well$)/
// How long the health bar's fill is, px: the stand-in's own shape, or with the look the arena's bar, whose fill is its whole length times the health the view gives (`poseBar`).
const BAR_FULL = GROUND.bar.x1 - GROUND.bar.x0 - GROUND.bar.trackInset * 2 - 17
const fillOf = (list: Shape[]): number | null => {
  if (!LOOK1_ON) return list.find((s) => s.id === 'health-fill')?.w ?? null
  const v = viewNow()
  return v ? BAR_FULL * Math.min(1, Math.max(0, v.boss.health)) : null
}
// What the look draws of the boss, as boxes on the page: the hull with its wings, the shield's glass, the feet's reach, the muzzles of the two guns and of the big cannon.
const lookBoxes = (v: BossView): Shape[] => {
  const b = v.boss
  const box = (id: string, cx: number, cy: number, w: number, h: number, rot = 0): Shape => ({ id, part: 'boss-look1', kind: 'slab', x: cx - w / 2, y: cy - h / 2, w, h, z0: 0, z1: 0, rot }) as unknown as Shape
  const out = [box('look-hull', b.x, b.y, SIZE.hull.long, SIZE.wings.wide, b.heading), box('look-feet', b.x, b.y, SIZE.feet.long, SIZE.feet.wide, b.heading)]
  const ahead = SIZE.shield.ahead
  out.push(box('look-shield', b.x + Math.cos(b.heading) * ahead, b.y + Math.sin(b.heading) * ahead, 2 * GUARD.thick, 2 * SIZE.shield.half, b.heading))
  for (const i of [0, 1] as const) {
    const m = muzzleOf(v, i)
    out.push(box(`look-gun-${i}`, m.x, m.y, 2, 2))
  }
  if (b.turret > 0 && v.phase !== 'beaten') {
    const m = bigMuzzleOf(v)
    out.push(box('look-big', m.x, m.y, 2, 2))
  }
  return out
}
// With the look the word rides the button on the hull, which rocks with each step and is thrown back by the big cannon's shot (22.4 px in the film): px it may move against the boss's centre.
const WORD_ROAMS = 30
const SETTLES = 0.5
const OF_THE_VISITOR = /^(muzzle-|dart-|arrow-dent|arrow-crack-|arrow-dust-)/

interface Seen { time: number; list: Shape[]; fight: Fight; view: BossView | null }

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
    const list = stage.frameAt(stage.time).list as Shape[]
    const seen = { time: stage.time, list, fight: (stage.page.save() as { fight: Fight }).fight, view: viewNow() }
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
    while (stage.time < 11.4 + SHIFT && !stage.events.some((e) => e.name === 'shot-round')) {
      stage.advance(1)
      const now = stage.events.filter((e) => e.name === 'shield-glance').length
      const fill = fillOf(stage.frameAt(stage.time).list as Shape[])
      if (fill !== null && was >= 0 && now > glanced) drops.push(was - fill)
      if (fill !== null) was = fill
      glanced = now
    }
    expect(drops.length).toBeGreaterThanOrEqual(5)
    expect(drops.reduce((x, y) => x + y, 0)).toBeLessThan(1)
  })

  it('A. shows the open side after six darts in a row have glanced off, and again every few seconds, on the flank away from the shield', () => {
    const f = newFight(HOME.x, HOME.y)
    const events: string[] = []
    const at = { x: HOME.x - GUARD.radius - 228, y: 700 }
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
      if (LOOK1_ON) {
        expect(f.view, `the view at ${f.time.toFixed(2)}`).not.toBeNull()
        expect(barDrop(f.view!.time)).toEqual({ lift: expect.closeTo(0, 1), shown: 1 })
        expect([GROUND.bar.x0, GROUND.bar.y0, GROUND.bar.x1, GROUND.bar.y1]).toEqual([fx0, fy0, fx1, fy1])
        const label = f.list.find((s) => s.id === 'health-label')!
        expect(label.x).toBeGreaterThanOrEqual(fx0)
        expect(label.x + label.w).toBeLessThanOrEqual(fx1)
        expect(label.y).toBeGreaterThanOrEqual(0)
        expect(label.y + label.h).toBeLessThanOrEqual(fy0)
      } else expect(f.list.find((s) => s.id === 'health-track')!.y).toBeCloseTo(TOP.bar, 3)
      for (const s of f.list) {
        if (LOOK1_ON || !s.id.startsWith('health-')) continue
        expect(s.x, s.id).toBeGreaterThanOrEqual(fx0)
        expect(s.x + s.w, s.id).toBeLessThanOrEqual(fx1)
        expect(s.y, s.id).toBeGreaterThanOrEqual(fy0)
        expect(s.y + s.h, s.id).toBeLessThanOrEqual(fy1)
      }
      for (const s of LOOK1_ON ? [...f.list, ...lookBoxes(f.view!)] : f.list) {
        if (s.id.startsWith('health-') || isHeader(s.id)) continue
        if (LOOK1_ON && (s.kind === 'anchor' || s.kind === 'well')) continue
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
      const far = f.list.filter((s) => /^(boss-|guard-wing-)/.test(s.id) && s.id !== 'boss-look' && s.id !== 'boss-shade' && !s.id.startsWith('boss-turret')).map((s) => {
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
      const v = viewNow()
      if (LOOK1_ON) {
        if (!v || (v.boss.gone ?? 0) > 0) continue
        expect(list.some((s) => s.id === 'boss-word'), `the word drawn when the look shows it at ${stage.time.toFixed(2)}`).toBe(poseOf(v).word.show)
        const pose = poseOf(v)
        const lain = v.boss.beaten > 0 && offsets.length > 0
        if (!pose.cannon.show) expect(pose.word.show, `the word in the open at ${stage.time.toFixed(2)}`).toBe(true)
        offsets.push({ time: stage.time, dx: lain ? offsets[0]!.dx : pose.word.x - v.boss.x, dy: lain ? offsets[0]!.dy : pose.word.y - v.boss.y, w: 0, h: 0, turret: pose.cannon.show, over: pose.cannon.show && v.boss.locked })
        continue
      }
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
      expect(Math.abs(o.dx - offsets[0]!.dx), `across at ${o.time.toFixed(2)}`).toBeLessThan(LOOK1_ON ? WORD_ROAMS : 1.5)
      expect(Math.abs(o.dy - offsets[0]!.dy), `down at ${o.time.toFixed(2)}`).toBeLessThan(LOOK1_ON ? WORD_ROAMS : 1.5)
      if (!LOOK1_ON) {
        expect(o.w).toBeCloseTo(label!.w, 3)
        expect(o.h).toBeCloseTo(label!.h, 3)
      }
      if (o.time < rise) expect(o.turret, `no turret at ${o.time.toFixed(2)}`).toBe(false)
      if (o.time < rise + BIG.up - BIG.rise) expect(o.over, `the word clear at ${o.time.toFixed(2)}`).toBe(false)
      if (o.time > lock + 0.05 && o.time < off) expect(o.over, `the turret over the word at ${o.time.toFixed(2)}`).toBe(true)
      if (o.time > off + BIG.off + 0.05) expect(o.turret, `the turret gone at ${o.time.toFixed(2)}`).toBe(false)
    }
    expect(offsets.some((o) => o.time > off + BIG.off + 0.05)).toBe(true)
    expect(stage.events.some((e) => e.name === 'button-press')).toBe(true)
  })

  it('mail of 01:00. starts line 7 no sooner than line 6 has ended: in the film the boss is formed that long after the tick, and for a visitor the clock of line 7 waits for it while the pointer stays his', () => {
    const at = (stage: Stage, n: string): number => stage.events.find((e) => e.name === n)!.step / stepHz
    const f = film()
    f.advance(Math.round(40 * stepHz))
    const whole = Math.max(LINE6.after, WAKE_AFTER_TICK.film + UNFOLD.end)
    expect(at(f, 'boss-formed') - at(f, 'checkbox')).toBeGreaterThanOrEqual(whole - 1e-6)
    expect(at(f, 'boss-formed') - at(f, 'checkbox')).toBeLessThan(whole + 0.05)
    for (const kind of ['keen', 'clumsy'] as const) {
      const stage = live(new BotDriver(kind, config.seed))
      let taken = 0
      while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'turret-lock') && stage.time < 120) {
        stage.advance(1)
        const formed = stage.events.find((e) => e.name === 'boss-formed')
        const tick = stage.events.find((e) => e.name === 'checkbox')
        if (formed && tick && stage.time < tick.step / stepHz + LINE6.after && stage.cursor.taken) taken++
      }
      const tick = at(stage, 'checkbox')
      const start = Math.max(LINE6.after, at(stage, 'boss-formed') - tick)
      expect(taken, kind).toBe(0)
      expect(at(stage, 'boss-turn') - tick, kind).toBeGreaterThanOrEqual(start)
      expect(at(stage, 'boss-music') - tick, kind).toBeGreaterThanOrEqual(start + LINE7.ends[0] + LINE7.gap + LINE7.music - 0.01)
      expect(at(stage, 'turret-lock') - tick, kind).toBeGreaterThanOrEqual(start + LINE7.ends[0] + LINE7.gap + LINE7.part1 + LINE7.gap + LINE7.rise - 0.01)
    }
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

  it('mail of 23:13. runs the finish on the marks of the shout in the film: the arms, one finish-charge on each beat, the blast let go on the last word and held for its length', () => {
    const stage = film()
    stage.advance(Math.round((UNIT_SECONDS - 1) * stepHz))
    const at = (n: string): number[] => stage.events.filter((e) => e.name === n).map((e) => e.step / stepHz)
    const fall = at('boss-fall')[0]! + FINISH.fall
    expect(at('finish-arms')[0]! - fall).toBeCloseTo(SHOUT.arms, 1)
    const beats = at('finish-charge').map((t) => t - fall)
    expect(beats.length).toBe(SHOUT.beats.length)
    beats.forEach((t, i) => expect(t).toBeCloseTo(SHOUT.beats[i]!, 1))
    expect(at('finish-fire').length).toBe(1)
    expect(at('finish-fire')[0]! - fall).toBeCloseTo(SHOUT.fire, 1)
    expect(at('boss-gone')[0]! - fall).toBeCloseTo(SHOUT.gone, 1)
    expect(at('button-down')[0]! - fall).toBeCloseTo(SHOUT.gone + FINISH.settle, 1)
  })

  const grown = (held: number, steps: number): number => FINISH.steady * (held / (SHOUT.fire - SHOUT.beats[0])) + ((1 - FINISH.steady) * steps) / SHOUT.beats.length

  it.each([
    ['who presses nothing', (): boolean => false, FINISH.alone, 4, 1],
    ['who holds the button and never lets go', (): boolean => true, SHOUT.fire - SHOUT.beats[0] + FINISH.late, 4, 1],
    ['who holds for a second and a half and lets go', (u: number): boolean => u >= 0.5 && u < 2, 2, 2, grown(1.5, 2)],
    ['who clicks once and lets go', (u: number): boolean => u >= 0.5 && u < 0.7, 0.7, 1, FINISH.small],
    ['who presses while the arrow charges by itself and lets go', (u: number): boolean => u >= 3.5 && u < 4.2, 4.2, 3, grown(4.2 - FINISH.alone + SHOUT.fire - SHOUT.beats[0], 3)]
  ])('mail of 23:38, item 4. on the live site the finish of a visitor %s fires once, destroys the body and leaves the button, and he goes on, on every seed tried', (name, down, fires, charges, power) => {
    for (const seed of [config.seed, 7, 1234]) {
      const bot = new BotDriver('keen', seed)
      let since = -1
      const driver: Driver = {
        name: 'bot',
        input(v: DriverView): Pointer {
          if (v.page.gag() !== 'boss.collapse' && v.page.gag() !== 'boss.finish') return bot.input(v)
          if (since < 0) since = v.time
          return { x: v.cursor.x, y: v.cursor.y, down: down(v.time - since - FINISH.fall) }
        }
      }
      const stage = new Stage({ mode: 'live', flow, pages, driver, seed })
      let wide = 0
      let gap: number | null = null
      while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'button-down') && stage.time < 140) {
        stage.advance(1)
        const q = (stage.frameAt(stage.time).list as Shape[]).find((x) => x.id === 'finish-blast')
        if (q) wide = Math.max(wide, q.h / 2 / FINISH.wide)
        const told = finishNow()
        if (LOOK1_ON && told?.marks?.fire !== undefined) wide = Math.max(wide, told.shot ?? 0)
        if (told?.marks?.fire !== undefined && told.marks.thrust !== undefined) gap = told.marks.fire - told.marks.thrust
      }
      const at = (n: string): number[] => stage.events.filter((e) => e.name === n).map((e) => e.step / stepHz)
      const fall = at('boss-fall')[0]! + FINISH.fall
      expect(at('finish-arms').length, `seed ${seed}`).toBe(1)
      expect(at('finish-fire').length, `seed ${seed}`).toBe(1)
      expect(at('finish-fire')[0]! - fall, `seed ${seed}`).toBeCloseTo(fires, 1)
      expect(at('finish-charge').length, `seed ${seed}`).toBe(charges)
      expect(wide, `seed ${seed}`).toBeCloseTo(power, 2)
      if (LOOK1_ON) {
        if (power === FINISH.small) expect(gap, `seed ${seed}`).toBeNull()
        else if (name.startsWith('who holds')) expect(gap, `seed ${seed}`).toBe(0)
        else expect(gap ?? -1, `seed ${seed}`).toBeGreaterThanOrEqual(0)
      }
      expect(at('boss-gone')[0]! - at('finish-fire')[0]!).toBeCloseTo(SHOUT.gone - SHOUT.fire, 1)
      expect(at('button-down').length).toBe(1)
      expect(stage.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      while (stage.page.id === 'step4' && stage.time < 160) stage.advance(1)
      expect(stage.page.id, `seed ${seed}`).not.toBe('step4')
    }
  })

  it.each([
    ['who leads the arrow straight to the button and clicks it', 'leads'],
    ['who does nothing more', 'nobody'],
    ['who leads it about the floor and never clicks', 'strays']
  ])('mail of 00:01, the last moment. after the blast the arrow of a visitor %s walks to the button, kneels, raises its fist and strikes it, and the blow is the press, on every seed tried', (_name, how) => {
    for (const seed of [config.seed, 7, 1234]) {
      const bot = new BotDriver('keen', seed)
      let gone = -1
      let clicked = -1
      const button = { x: 960 + (FALLEN.x - (CLOSE.x + CLOSE.w / 2)) * 2, y: 540 + (FALLEN.y - (CLOSE.y + CLOSE.h / 2)) * 2 }
      const driver: Driver = {
        name: 'bot',
        input(v: DriverView): Pointer {
          const g = v.page.gag()
          if (g !== 'boss.collapse' && g !== 'boss.finish' && g !== 'boss.press') return bot.input(v)
          if (gone < 0) return { x: v.cursor.x, y: v.cursor.y, down: false }
          const u = v.time - gone
          if (how === 'nobody') return { x: 400, y: 300, down: false }
          if (how === 'strays') return { x: 960 + 900 * Math.sin(u * 1.3), y: 540 + 500 * Math.cos(u * 0.9), down: false }
          const down = u >= LAST.wait + LAST.most + 0.2 && u < LAST.wait + LAST.most + 0.3
          if (down && clicked < 0) clicked = v.time
          return { x: button.x, y: button.y, down }
        }
      }
      const stage = new Stage({ mode: 'live', flow, pages, driver, seed })
      let out = 0
      let fast = 0
      let off = 0
      let was: { x: number; y: number } | null = null
      while (stage.page.id === 'step4' && stage.time < 200) {
        stage.advance(1)
        if (gone < 0 && stage.events.some((e) => e.name === 'boss-gone')) gone = stage.time
        if (gone < 0 || stage.page.id !== 'step4' || stage.events.some((e) => e.name === 'finish-press')) continue
        const c = { x: stage.cursor.x, y: stage.cursor.y }
        if (c.x < CLOSE.x || c.x > CLOSE.x + CLOSE.w || c.y < CLOSE.y || c.y > CLOSE.y + CLOSE.h) out++
        if (was) fast = Math.max(fast, Math.hypot(c.x - was.x, c.y - was.y) * stepHz)
        was = c
        if (how === 'leads' && stage.events.some((e) => e.name === 'finish-kneel') && off === 0) {
          const p = project(stage.page.view()!, toWorld(FALLEN.x, FALLEN.y, 0))
          off = Math.hypot(p.x - button.x, p.y - button.y) + 0.001
        }
      }
      const at = (n: string): number[] => stage.events.filter((e) => e.name === n).map((e) => e.step / stepHz)
      for (const n of ['finish-walk', 'finish-kneel', 'finish-fist', 'finish-press', 'button-press']) expect(at(n).length, `${n}, seed ${seed}`).toBe(1)
      expect(at('finish-walk')[0]! - at('boss-gone')[0]!).toBeCloseTo(LAST.wait, 1)
      expect(at('finish-kneel')[0]!).toBeGreaterThanOrEqual(at('button-down')[0]!)
      expect(at('finish-fist')[0]! - at('finish-kneel')[0]!).toBeCloseTo(LAST.knees + LAST.pause, 1)
      expect(at('finish-press')[0]! - at('finish-fist')[0]!).toBeCloseTo(LAST.fist + LAST.blow, 1)
      expect(at('button-press')[0]!).toBe(at('finish-press')[0]!)
      expect(out, `steps outside the close view, seed ${seed}`).toBe(0)
      expect(fast, `seed ${seed}`).toBeLessThanOrEqual(Math.hypot(CLOSE.w, CLOSE.h) / LAST.most * 1.6)
      if (how === 'leads') {
        expect(at('finish-kneel')[0]! - at('boss-gone')[0]!, `seed ${seed}`).toBeLessThanOrEqual(LAST.wait + LAST.most + 0.3)
        expect(at('finish-press')[0]! - clicked, `seed ${seed}`).toBeLessThanOrEqual(LAST.knees + LAST.pause + LAST.fist + LAST.blow + 0.1)
        expect(off).toBeGreaterThan(0)
        expect(off, 'the button lies under the hand that points at it').toBeLessThan(3)
      } else {
        expect(at('finish-kneel')[0]! - at('boss-gone')[0]!, `seed ${seed}`).toBeLessThanOrEqual((how === 'nobody' ? LAST.alone + 0.5 : LAST.led) + LAST.wait + LAST.most + 0.1)
      }
      expect(stage.longestIgnored.pointer, `seed ${seed}`).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      expect(stage.page.id, `seed ${seed}`).not.toBe('step4')
    }
  })

  it('E. ends on the skip link at any moment of the fight, with the header and the rail off the screen', () => {
    for (const at of [26, 30, 45]) {
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

  const upNow = (): boolean => {
    const i = finishNow()
    return LOOK1_ON && i !== null && finishState(i).up
  }

  it.each([
    ['the film', (): Stage => film()],
    ['a keen visitor', (): Stage => live(new BotDriver('keen', config.seed))]
  ])('mail of 03:02, item 4a. in %s the plain arrow is off the page for as long as the standing figure is up, and on it at every other moment', (_name, make) => {
    const stage = make()
    let ups = 0
    let plain = 0
    while (stage.page.id === 'step4' && stage.time < 140) {
      stage.advance(2)
      if (stage.page.id !== 'step4' || stage.events.some((e) => e.name === 'page-turn')) break
      const frame = stage.frameAt(stage.time)
      const up = upNow()
      expect(frame.cursor.onPage, `at ${stage.time.toFixed(2)}`).toBe(!up)
      if (up) {
        ups++
        expect((frame.list as Shape[]).some((x) => x.id === 'finish-figure'), `the figure's part at ${stage.time.toFixed(2)}`).toBe(true)
      } else plain++
    }
    expect(plain).toBeGreaterThan(0)
    if (LOOK1_ON) expect(ups / (stepHz / 2)).toBeGreaterThan(POWER.held + POWER.burst + SHOUT.gone)
    else expect(ups).toBe(0)
  })

  it.runIf(LOOK1_ON)('mail of 03:02, item 2. in the film both fists are raised for a second or more inside the power-up, and the figure is down before the turret locks', () => {
    const stage = film()
    let raised = 0
    let lastUp = -1
    let power = -1
    while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'turret-lock')) {
      stage.advance(1)
      stage.frameAt(stage.time)
      const i = finishNow()
      if (!i || !finishState(i).up) continue
      lastUp = stage.time
      if (!i.power) continue
      const plan = powerPlan(i.power)
      const now = i.time - i.power.at
      if (now >= POWER.up[1] * plan.quick && now < plan.end) raised++
    }
    power = stage.events.find((e) => e.name === 'power-up')!.step / stepHz
    const lock = stage.events.find((e) => e.name === 'turret-lock')!.step / stepHz
    expect(raised / stepHz).toBeGreaterThanOrEqual(1)
    expect(lastUp).toBeGreaterThan(power)
    expect(lastUp).toBeLessThan(lock)
    expect(lock - lastUp).toBeGreaterThanOrEqual(RAISE.early - 2 / stepHz)
  })

  it.runIf(LOOK1_ON)('mail of 03:02, item 4b. a visitor who throws the pointer about cannot move the standing figure off its spot in the power-up, once it has stepped clear, nor in the finish once it has run to its stand and until it fires', () => {
    const bot = new BotDriver('keen', config.seed)
    let away = false
    const driver: Driver = {
      name: 'bot',
      input(v: DriverView): Pointer {
        if (!away) return bot.input(v)
        const turn = v.time * 9
        return { x: 960 + 700 * Math.cos(turn), y: 560 + 380 * Math.sin(turn), down: false }
      }
    }
    const stage = live(driver)
    const seen = (n: string): boolean => stage.events.some((e) => e.name === n)
    const spots: Record<'power' | 'finish', { x: number; y: number }[]> = { power: [], finish: [] }
    while (stage.page.id === 'step4' && !seen('finish-walk') && stage.time < 140) {
      stage.advance(1)
      stage.frameAt(stage.time)
      const i = finishNow()
      const up = i !== null && finishState(i).up
      away = up && !seen('finish-fire')
      if (!up || seen('finish-fire')) continue
      spots[seen('boss-fall') ? 'finish' : 'power'].push({ ...finishState(i).feet })
    }
    expect(seen('finish-walk')).toBe(true)
    for (const k of ['power', 'finish'] as const) {
      const list = spots[k]
      expect(list.length / stepHz, k).toBeGreaterThan(0.9)
      const rest = list.slice(Math.round((k === 'power' ? RAISE.near : SETTLES) * stepHz))
      const end = rest[rest.length - 1]!
      for (const f of rest) expect(Math.hypot(f.x - end.x, f.y - end.y), k).toBeLessThanOrEqual(1)
    }
  })

  const posed = (): { at: { x: number; y: number }; held: boolean } | null => {
    const i = finishNow()
    if (!i || !i.power || !finishState(i).up) return null
    const plan = powerPlan(i.power)
    const now = i.time - i.power.at
    return { at: i.arrow, held: now >= POWER.up[1] * plan.quick && now < plan.end }
  }
  const standsAt = (spot: readonly [number, number], clicks = false): Stage => {
    const bot = new BotDriver('keen', config.seed)
    let formed = false
    const stage: Stage = live({
      name: 'bot',
      input(v: DriverView): Pointer {
        formed = formed || stage.events.some((e) => e.name === 'boss-formed')
        if (!formed) return bot.input(v)
        return { x: spot[0], y: spot[1], down: clicks && Math.floor(v.time * 12) % 2 === 0 }
      }
    })
    return stage
  }
  const SPOTS12: [number, number][] = [[563, 925], [540, 880], [185, 372], [577, 352], [372, 550], [1397, 722], [1592, 400], [1802, 712], [89, 82], [1831, 82], [960, 300], [1000, 1000]]

  it.runIf(LOOK1_ON)('rulings of 03:27, item 1. wherever of 12 spots a visitor stands at the power-up, pillar.3 among them, nothing of the arena as it is drawn overlaps the figure while its fists are up, and it gets there without a jump', () => {
    const things = drawnBoxes()
    for (const spot of SPOTS12) {
      const stage = standsAt(spot)
      let held = 0
      let last: { x: number; y: number } | null = null
      while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'turret-lock') && stage.time < 60) {
        stage.advance(1)
        stage.frameAt(stage.time)
        const p = posed()
        if (!p) continue
        if (last) expect(Math.hypot(p.at.x - last.x, p.at.y - last.y), `a jump from ${spot}`).toBeLessThan(RAISE.most / (RAISE.near * stepHz) * 2)
        last = { ...p.at }
        if (!p.held) continue
        held++
        const b = figureBox(p.at)
        for (const t of things) expect(b.x0 < t.box.x1 && b.x1 > t.box.x0 && b.y0 < t.box.y1 && b.y1 > t.box.y0, `${t.id} over the figure of a visitor at ${spot}, figure at ${p.at.x.toFixed(0)}, ${p.at.y.toFixed(0)}`).toBe(false)
      }
      expect(held / stepHz, `${spot}`).toBeGreaterThanOrEqual(1)
    }
  })

  it.runIf(LOOK1_ON)('rulings of 03:27, item 2. the view comes close on the figure for the power-up, in the film and for a visitor, and is the whole page again before the turret locks', () => {
    for (const stage of [film(), standsAt([563, 925])]) {
      let close = 0
      let widest = 0
      let after = -1
      while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'turret-lock') && stage.time < 60) {
        stage.advance(1)
        stage.frameAt(stage.time)
        const view = stage.page.view()
        const p = posed()
        if (!view) {
          if (stage.events.some((e) => e.name === 'power-up') && after < 0 && close > 0) after = stage.time
          expect(p?.held ?? false).toBe(false)
          continue
        }
        close++
        const a = project(view, toWorld(0, 0, 0))
        const b = project(view, toWorld(100, 0, 0))
        const z = Math.hypot(b.x - a.x, b.y - a.y) / 100
        widest = Math.max(widest, z)
        if (!p?.held) continue
        expect(z).toBeCloseTo(RAISE.zoom, 2)
        const box = figureBox(p.at)
        for (const c of [[box.x0, box.y0], [box.x1, box.y1]] as const) {
          const q = project(view, toWorld(c[0], c[1], 0))
          expect(q.x).toBeGreaterThanOrEqual(0)
          expect(q.x).toBeLessThanOrEqual(1920)
          expect(q.y).toBeGreaterThanOrEqual(0)
          expect(q.y).toBeLessThanOrEqual(1080)
        }
      }
      const power = stage.events.find((e) => e.name === 'power-up')!.step / stepHz
      const lock = stage.events.find((e) => e.name === 'turret-lock')!.step / stepHz
      expect(widest).toBeCloseTo(RAISE.zoom, 2)
      expect(after - power).toBeLessThanOrEqual(RAISE.back[1] + 2 / stepHz)
      expect(after).toBeLessThan(lock)
    }
  })

  it.runIf(LOOK1_ON)('rulings of 03:27, item 7. no click fires a dart from the power-up to the lock of the turret, and clicks fire again after it', () => {
    const stage = standsAt([960, 880], true)
    const seen = (n: string): boolean => stage.events.some((e) => e.name === n)
    while (stage.page.id === 'step4' && !seen('turret-lock') && stage.time < 60) stage.advance(1)
    const lock = stage.events.find((e) => e.name === 'turret-lock')!.step
    const power = stage.events.find((e) => e.name === 'power-up')!.step
    expect(lock).toBeGreaterThan(power)
    expect(stage.events.filter((e) => e.name === 'dart-fire' && e.step >= power && e.step <= lock)).toEqual([])
    stage.advance(stepHz)
    expect(stage.events.filter((e) => e.name === 'dart-fire' && e.step > lock).length).toBeGreaterThan(0)
  })

  it.runIf(LOOK1_ON)('rulings of 04:17, B. from the walk to the turn of the page no wisp of smoke stronger than 0.05 lies over the box of the figure, in the film, and smoke still stands beside it', () => {
    const stage = film()
    let seen = 0
    let strong = 0
    let would = 0
    while (stage.page.id === 'step4' && stage.time < 120) {
      stage.advance(2)
      if (!stage.events.some((e) => e.name === 'finish-walk')) continue
      stage.frameAt(stage.time)
      const view = viewNow()
      const burnt = view ? scorchOf(view) : null
      if (!view || !view.last || !burnt) continue
      seen++
      const fig = view.last
      const s = scorchFrom(burnt.line)
      const k = clamp01((burnt.share - 0.35) / 0.4)
      const over = (w: { x: number; y: number; size: number }): boolean => {
        const r = w.size * 0.95
        return w.x + r > fig.x + WISP_CLEAR.x0 && w.x - r < fig.x + WISP_CLEAR.x1 && w.y + r > fig.y + WISP_CLEAR.y0 && w.y - r < fig.y + WISP_CLEAR.y1
      }
      wispsOf(s, config.seed, view.time, k, fig, (w) => {
        if (w.thick <= 0.05) return
        strong++
        expect(over(w)).toBe(false)
      })
      wispsOf(s, config.seed, view.time, k, null, (w) => {
        if (w.thick > 0.05 && over(w)) would++
      })
    }
    expect((seen * 2) / stepHz).toBeGreaterThan(4)
    expect(strong).toBeGreaterThan(seen)
    expect(would).toBeGreaterThan(0)
  })

  it.runIf(LOOK1_ON)('rulings of 04:17, A. in the film the hands thrust the ball forward 0.45 s before the blast is let go', () => {
    const stage = film()
    while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'finish-fire') && stage.time < 120) stage.advance(1)
    stage.advance(1)
    stage.frameAt(stage.time)
    const m = finishNow()!.marks!
    expect(m.fire).toBeDefined()
    expect(m.thrust).toBeDefined()
    expect(Math.abs(m.fire! - m.thrust! - FIRE.ahead)).toBeLessThanOrEqual(2 / stepHz)
  })

  it.runIf(LOOK1_ON)('rulings of 04:46, 1a. nothing burns and nothing of the boss comes off before the beam has left the hands and its front has reached the boss: in the film, for a plain click and for a charged shot let go', () => {
    const visitor = (down: (u: number) => boolean): Stage => {
      const bot = new BotDriver('keen', config.seed)
      let since = -1
      return new Stage({
        mode: 'live',
        flow,
        pages,
        seed: config.seed,
        driver: {
          name: 'bot',
          input(v: DriverView): Pointer {
            if (v.page.gag() !== 'boss.collapse' && v.page.gag() !== 'boss.finish') return bot.input(v)
            if (since < 0) since = v.time
            return { x: v.cursor.x, y: v.cursor.y, down: down(v.time - since - FINISH.fall) }
          }
        }
      })
    }
    const runs: [string, Stage][] = [['film', film()], ['plain click', visitor((u) => u >= 0.5 && u < 0.7)], ['charged', visitor((u) => u >= 0.5 && u < 2)]]
    for (const [name, stage] of runs) {
      while (stage.page.id === 'step4' && !stage.events.some((e) => e.name === 'finish-fire') && stage.time < 200) stage.advance(1)
      const fire = stage.time
      let beamAt = -1
      let burnAt = -1
      while (stage.time < fire + 0.8) {
        stage.advance(1)
        stage.frameAt(stage.time)
        const view = viewNow()!
        const beam = finishState(finishNow()!).fx.beam
        if (beam && beamAt < 0) beamAt = stage.time
        const burns = !!view.finish || (view.boss.gone ?? 0) > 0 || (scorchOf(view)?.share ?? 0) > 0
        if (burnAt < 0 && burns) {
          burnAt = stage.time
          expect(beam, name).not.toBeNull()
          const far = Math.hypot(FALLEN.x - beam!.x, FALLEN.y - beam!.y)
          expect(beam!.age * BEAM.speed, name).toBeGreaterThanOrEqual(far - (2 * BEAM.speed) / stepHz)
          expect(beam!.age * BEAM.speed - far, name).toBeLessThan(BEAM.speed * 0.05)
        }
      }
      expect(beamAt, name).toBeGreaterThan(0)
      expect(beamAt - fire, name).toBeGreaterThanOrEqual(FIRE.lead - 2 / stepHz)
      expect(beamAt - fire, name).toBeLessThan(FIRE.lead + 0.05)
      expect(burnAt, name).toBeGreaterThanOrEqual(beamAt)
      expect(burnAt - beamAt, name).toBeLessThan(0.2)
    }
  })
  it.runIf(LOOK1_ON)('rulings of 04:46, 2. in every course of the fight nothing the boss is drawn with comes nearer than the clear band under the frame of the health bar: five kinds of visitor on ten seeds each, twenty looks a second', () => {
    const after = (seed: number, where: (time: number) => [number, number]): Stage => {
      const bot = new BotDriver('keen', seed)
      let formed = false
      const stage: Stage = live({
        name: 'bot',
        input(v: DriverView): Pointer {
          formed = formed || stage.events.some((e) => e.name === 'boss-formed')
          if (!formed) return bot.input(v)
          const [x, y] = where(v.time)
          return { x, y, down: Math.floor(v.time * 12) % 2 === 0 }
        }
      })
      return stage
    }
    const leg = (time: number): number => Math.floor(time / 1.5)
    const kinds: [string, (seed: number) => Stage, number][] = [
      ['keen', (seed) => live(new BotDriver('keen', seed)), 1000],
      ['clumsy', (seed) => live(new BotDriver('clumsy', seed)), 1000],
      ['one who keeps under the bar', (seed) => after(seed, (t) => [600 + ((seed * 97 + leg(t) * 211) % 720), 180 + ((seed * 31 + leg(t) * 17) % 90)]), 1000],
      ['one who runs round the boss', (seed) => after(seed, (t) => [960 + 620 * Math.cos(t * 0.9 + seed), 540 + 400 * Math.sin(t * 0.9 + seed)]), 1000],
      ['one who stands in one place', (seed) => after(seed, () => [200 + ((seed * 131) % 1520), 150 + ((seed * 71) % 800)]), 1000],
      ['random', (seed) => live(new BotDriver('random', seed)), 0],
      ['skipper', (seed) => live(new BotDriver('skipper', seed)), 0]
    ]
    let least = Infinity
    let who = ''
    for (const [kind, make, enough] of kinds) {
      let looks = 0
      let mine = Infinity
      for (let n = 0; n < 10; n++) {
        const stage = make(config.seed + n)
        while (stage.page.id === 'step4' && stage.time < 400) {
          stage.advance(12)
          if (stage.page.id !== 'step4') break
          if (!FIGHT.test(stage.page.gag() ?? '')) continue
          stage.frameAt(stage.time)
          const v = viewNow()
          if (!v) continue
          looks++
          for (const b of lookBoxes(v)) {
            const gap = gapTo(b, SOLID.frame)
            mine = Math.min(mine, gap)
            if (gap < least) {
              least = gap
              who = `${b.id} of ${kind}, seed ${n}, at ${stage.time.toFixed(2)}`
            }
          }
        }
      }
      expect(looks, kind).toBeGreaterThanOrEqual(enough)
      expect(mine, kind).toBeGreaterThanOrEqual(TOP.clear)
    }
    expect(who).not.toBe('')
    expect(least).toBeGreaterThanOrEqual(TOP.clear)
  }, 240000)
  it('rulings of 04:46, 3. the boss never turns before line 6 has been said to its end: a press between the forming and the first tenth of a second of line 7 is kept and acts then, so that the first sentence of line 7 is said whole, a later one acts at once, and line 7 always ends at the end of a sentence, on the near path and the self-tick path, for six kinds of visitor', () => {
    const kinds: [string, (sinceStart: number, sinceFormed: number, wait: number) => boolean, number][] = [
      ['who presses as soon as the boss is formed', (_t, f) => f >= 0.02 && f < 0.1, LINE7.lead],
      ['who presses half way between the forming and the start of line 7', (_t, f, wait) => f >= wait / 2 && f < wait / 2 + 0.08, LINE7.lead],
      ['who presses a tenth of a second before line 7 starts, or as the boss is formed when that is later', (_t, f, wait) => f >= Math.max(0, wait - 0.1) && f < Math.max(0, wait - 0.1) + 0.08, LINE7.lead],
      ['who presses as line 7 starts', (t) => t >= 0 && t < 0.03, LINE7.lead],
      ['who presses a second after line 7 has started', (t) => t >= 1 && t < 1.08, 1],
      ['who never presses', () => false, LINE7.part0]
    ]
    let longest = 0
    let early = Infinity
    for (const self of [false, true]) {
      for (const [kind, press, due] of kinds) {
        const name = `${self ? 'the self-tick path' : 'the near path'}, one ${kind}`
        const bot = new BotDriver('keen', config.seed)
        let own = false
        let last = { x: 300, y: 700 }
        const when = (n: string): number => {
          const e = stage.events.find((k) => k.name === n)
          return e ? e.step / stepHz : -1
        }
        const stage: Stage = live({
          name: 'bot',
          input(v: DriverView): Pointer {
            const tick = when('checkbox')
            if (tick < 0) {
              const h = v.page.hint()
              return self || !h ? { x: 300, y: 700, down: false } : { x: h.x, y: h.y, down: h.down }
            }
            if (when('turret-lock') >= 0) {
              if (!own) bot.moveTo(last.x, last.y)
              own = true
              return bot.input(v)
            }
            const formed = when('boss-formed')
            last = self ? { x: 300, y: 700 } : { x: SOCKET.x, y: SOCKET.y }
            const wait = formed < 0 ? 0 : Math.max(0, tick + LINE6.after - formed)
            return { ...last, down: formed >= 0 && press(v.time - formed - wait, v.time - formed, wait) }
          }
        })
        while (stage.page.id === 'step4' && stage.time < 300) stage.advance(4)
        expect(stage.page.id, name).not.toBe('step4')
        const tick = when('checkbox')
        const formed = when('boss-formed')
        const turns = stage.events.filter((e) => e.name === 'boss-turn')
        expect(turns.length, name).toBe(1)
        const turn = turns[0]!.step / stepHz - tick
        const end = Math.max(LINE6.after, formed - tick)
        expect(turn, name).toBeGreaterThanOrEqual(LINE6.after - 1e-6)
        expect(turn, name).toBeGreaterThanOrEqual(end + due - 2 / stepHz)
        expect(turn, name).toBeLessThan(end + due + 0.03)
        const said = earlyEnd(LINE7.ends, LINE7.sentences, turn - end)
        expect(turn - end, name).toBeGreaterThanOrEqual(LINE7.lead - 2 / stepHz)
        expect((LINE7.sentences as readonly number[]).includes(said), name).toBe(true)
        expect(Math.abs(when('boss-music') - tick - (end + said + LINE7.gap + LINE7.music)), name).toBeLessThanOrEqual(2 / stepHz + 1 / config.film.fps)
        expect(Math.abs(when('turret-lock') - tick - (end + said + LINE7.gap + LINE7.part1 + LINE7.gap + LINE7.rise)), name).toBeLessThanOrEqual(2 / stepHz + 1 / config.film.fps)
        expect(stage.longestIgnored.pointer, name).toBeLessThan(config.live.controlTakenMaxSeconds)
        longest = Math.max(longest, stage.longestIgnored.pointer)
        early = Math.min(early, turn)
        if (process.env.BOSS_SAY) console.log(name, 'formed', (formed - tick).toFixed(3), 'turn', turn.toFixed(3), 'said', said, 'music', (when('boss-music') - tick).toFixed(3), 'power-up', (when('power-up') - tick).toFixed(3), 'lock', (when('turret-lock') - tick).toFixed(3), 'held', stage.longestIgnored.pointer.toFixed(3))
      }
    }
    expect(early).toBeGreaterThanOrEqual(LINE6.after - 1e-6)
    expect(longest).toBeLessThan(config.live.controlTakenMaxSeconds)
  }, 240000)
})

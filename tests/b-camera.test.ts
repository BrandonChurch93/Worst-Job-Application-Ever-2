import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { makeArena } from '../src/arena'
import { ARENA, EYE, PANES, PILLARS } from '../src/arena/layout'
import { newFight } from '../src/boss/fight'
import { finishState } from '../src/boss/finish/acting'
import { ABOVE, BLOCKS, FEET, LAST_LOW, THIN, facing, fadesOf, finishRig, finishShot, lowOf, marksOf, poseOf, sideOf, type Block, type Marks } from '../src/boss/finish/camera'
import { FALLEN, UNFOLD } from '../src/boss/plan'
import { CAMERA, CLOSE, LAST, LOOK1_ON, SHOUT } from '../src/boss/tune'
import { finishNow, viewOf } from '../src/boss/viewof'
import { config, stepHz } from '../src/config'
import { toPage } from '../src/cursor/stand/rig'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { basis, frame, project, toWorld } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type FlowEntry, type Pointer } from '../src/stage/stage'
import type { CameraPose } from '../src/stage/types'

const FPS = config.film.fps
const PER = stepHz / FPS
const LIMIT = { eye: 130, turn: 12, roll: 9, screen: 140, field: 1.5, edge: 0, pane: 25, rest: 1.5, top: 1.55, thin: 3, pillar: 85 } as const
const WHIP = { eye: 420, turn: 60, roll: 60, screen: 2600, field: 1.5 } as const
const ADDED = 78
const CUTS: number[] = []
const EVENTS = { 'finish-arms': 60, 'finish-fire': 307, 'boss-gone': 435 + ADDED, 'finish-walk': 459 + ADDED, 'finish-kneel': 627 + ADDED, 'finish-fist': 705 + ADDED, 'finish-press': 759 + ADDED } as const
const IGNORED = config.live.controlTakenMaxSeconds

const above = poseOf(ABOVE)
const angle = (a: readonly number[], b: readonly number[]): number => (Math.acos(Math.min(1, Math.max(-1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!))) * 180) / Math.PI
const poseAt = (t: number, m: Marks): CameraPose => finishShot(t, m)?.pose ?? above
const glared = (t: number, m: Marks): boolean => (finishShot(t, m)?.glare ?? 0) >= 1
const steps = (a: CameraPose, b: CameraPose): { eye: number; turn: number; roll: number; screen: number; field: number } => {
  const p = basis(a)
  const q = basis(b)
  const fa = project(a, FEET)
  const fb = project(b, FEET)
  return { eye: Math.hypot(b.eye[0] - a.eye[0], b.eye[1] - a.eye[1], b.eye[2] - a.eye[2]), turn: angle(p.forward, q.forward), roll: angle(p.up, q.up), screen: Math.hypot(fb.x - fa.x, fb.y - fa.y), field: Math.abs(b.fov - a.fov) }
}
const inside = (p: { x: number; y: number; depth: number }, edge = LIMIT.edge): boolean => p.depth > 0 && p.x >= edge && p.x <= 1920 - edge && p.y >= edge && p.y <= 1080 - edge

const WAY = { near: 90, share: 0.03, half: 30, high: 140, step: 0.17 } as const
type P3 = [number, number, number]
const leanOf = (b: Block, low: number): [number, number] => [(1 - low) * (ARENA.leanX - (b.lo[0] + b.hi[0]) / 2 / EYE), (1 - low) * (ARENA.lean - (b.lo[1] + b.hi[1]) / 2 / EYE)]
const inTheWay = (pose: CameraPose, low: number): { covers: string[]; fills: string[] } => {
  const covers: string[] = []
  const fills: string[] = []
  const xs: number[] = []
  const ys: number[] = []
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [0, 1]) {
    const p = project(pose, [FEET[0] + x * WAY.half, FEET[1] + y * WAY.half, z * WAY.high])
    xs.push(p.x)
    ys.push(p.y)
  }
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), depth: project(pose, [FEET[0], FEET[1], WAY.high / 2]).depth }
  for (const b of BLOCKS) {
    const t = leanOf(b, low)
    const eye: P3 = [pose.eye[0] - t[0] * pose.eye[2], pose.eye[1] - t[1] * pose.eye[2], pose.eye[2]]
    const near = Math.hypot(Math.max(0, b.lo[0] - eye[0], eye[0] - b.hi[0]), Math.max(0, b.lo[1] - eye[1], eye[1] - b.hi[1]), Math.max(0, b.lo[2] - eye[2], eye[2] - b.hi[2]))
    const n = [0, 1, 2].map((i) => Math.ceil((b.hi[i]! - b.lo[i]!) / 14) + 1)
    let over = false
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity]
    for (let i = 0; i < n[0]!; i++) for (let j = 0; j < n[1]!; j++) for (let k = 0; k < n[2]!; k++) {
      const z = b.lo[2] + ((b.hi[2] - b.lo[2]) * k) / (n[2]! - 1)
      const p = project(pose, [b.lo[0] + ((b.hi[0] - b.lo[0]) * i) / (n[0]! - 1) + t[0] * z, b.lo[1] + ((b.hi[1] - b.lo[1]) * j) / (n[1]! - 1) + t[1] * z, z])
      if (p.depth <= 0) continue
      if (p.depth < box.depth && p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1 && inside(p)) over = true
      if (!inside(p)) continue
      x0 = Math.min(x0, p.x)
      x1 = Math.max(x1, p.x)
      y0 = Math.min(y0, p.y)
      y1 = Math.max(y1, p.y)
    }
    if (over) covers.push(b.id)
    if (near < WAY.near && x1 > x0 && ((x1 - x0) * (y1 - y0)) / (1920 * 1080) > WAY.share) fills.push(b.id)
  }
  return { covers, fills }
}

const HELD = CAMERA.down[1] + CAMERA.stay
const COURSES: [string, Marks, number][] = [
  ['the film', marksOf(true, 0, 3.68, 4.1167), 8],
  ['a visitor who clicks once at 0.3 s', marksOf(false, 0, HELD, HELD + CAMERA.roundLive), 5.5],
  ['a visitor who lets go at 0.8 s, in the middle of the way down', marksOf(false, 0, HELD, HELD + CAMERA.roundLive), 5.5],
  ['a visitor who holds 2 s and lets go', marksOf(false, 0, 2.3, 2.3 + CAMERA.roundLive), 6.5],
  ['a visitor who holds to the end', marksOf(false, 0, 4.83, 4.83 + CAMERA.roundLive), 9],
  ['a visitor who never presses', marksOf(false, 0, 6 - CAMERA.roundLive, 6), 9.5]
]

describe('the camera of the finishing blast: its path', () => {
  it('is the same thing for the same clock and marks, and reads no clock of the wall and no chance', () => {
    for (const [, m, long] of COURSES) for (let n = 0; n <= long * FPS; n += 7) expect(finishShot(n / FPS, m)).toEqual(finishShot(n / FPS, m))
    const code = fs.readFileSync('src/boss/finish/camera.ts', 'utf8')
    for (const word of ['Math.random', 'Date.now', 'performance.now', 'new Date']) expect(code.includes(word), word).toBe(false)
  })

  it('has no jump between two frames over the named limits, and no cut', () => {
    expect(CUTS).toEqual([])
    const most = { eye: 0, turn: 0, roll: 0, screen: 0, field: 0 }
    for (const [name, m, long] of COURSES) {
      for (let n = -3; n <= long * FPS; n++) {
        const d = steps(poseAt(n / FPS, m), poseAt((n + 1) / FPS, m))
        const whip = glared(n / FPS, m) && glared((n + 1) / FPS, m)
        for (const k of ['eye', 'turn', 'roll', 'screen', 'field'] as const) {
          if (!whip) most[k] = Math.max(most[k], d[k])
          expect(d[k], `${name}, frame ${n}, ${k}`).toBeLessThanOrEqual(whip ? WHIP[k] : LIMIT[k])
        }
      }
    }
    console.log('most between two frames', JSON.stringify(most))
  })

  it('never goes through the pane behind the arrow: under the top of the pane the lens stays in front of it', () => {
    const pane = PANES[0]!
    for (const [name, m, long] of COURSES) {
      for (let n = 0; n < long * FPS; n += 1) {
        const shot = finishShot(n / FPS, m)
        if (!shot) continue
        const [x, y, z] = [shot.pose.eye[0] + 960, 540 - shot.pose.eye[1], shot.pose.eye[2]]
        if (y < pane.y0 - LIMIT.pane || y > pane.y1 + LIMIT.pane || z > ARENA.pane.high + LIMIT.pane) continue
        expect(x - pane.x, `${name}, frame ${n}`).toBeGreaterThanOrEqual(LIMIT.pane)
      }
    }
  })

  it('the figure is never seen edge on: its plane is crossed in at most 3 frames, under the full glare of the ball, and from behind the lens stands well off the plane', () => {
    expect(THIN[0]).toBeLessThan(THIN[1])
    for (const [name, m, long] of COURSES) {
      let thin = 0
      for (let n = 0; n <= long * FPS; n++) {
        const r = finishRig(n / FPS, m)
        if (lowOf(r.rig) <= 0.5 || n / FPS >= m.fire + CAMERA.rise[0]) continue
        if (Math.abs(sideOf(r.rig)) >= CAMERA.thin - 0.5) continue
        thin++
        expect(r.glare, `${name}, frame ${n}`).toBe(1)
      }
      expect(thin, name).toBeLessThanOrEqual(LIMIT.thin)
      expect(sideOf(finishRig(m.fire, m).rig), name).toBeLessThan(-40)
      expect(sideOf(finishRig(m.fire + CAMERA.rise[0], m).rig), name).toBeLessThan(-40)
    }
    const m = COURSES[0]![1]
    const off = (t: number): string => sideOf(finishRig(t, m).rig).toFixed(1)
    const crossed: string[] = []
    for (let n = Math.round((m.fire - 1.2) * FPS); n <= (m.fire + CAMERA.rise[1]) * FPS; n++) {
      const r = finishRig(n / FPS, m)
      if (lowOf(r.rig) > 0.5 && Math.abs(sideOf(r.rig)) < CAMERA.thin) crossed.push(`${(n / FPS - m.fire).toFixed(3)} s: ${sideOf(r.rig).toFixed(1)}, glare ${r.glare.toFixed(2)}`)
    }
    console.log('degrees off the plane of the figure', JSON.stringify({ charge: off(m.fire - 1.5), fire: off(m.fire), held: off(m.fire + CAMERA.rise[0]), under: crossed }))
  })

  it('goes round no faster than the top limit once it is straight above: the picture comes round to the lie of the page slowly', () => {
    for (const [name, m] of COURSES) {
      for (let n = 0; n < (LAST_LOW - CAMERA.rise[1]) * FPS + 2; n++) {
        const t = m.fire + CAMERA.rise[1] + n / FPS
        const d = steps(poseAt(t, m), poseAt(t + 1 / FPS, m))
        expect(d.roll, `${name}, frame ${n}`).toBeLessThanOrEqual(LIMIT.top)
      }
    }
  })

  it('from above shows nothing past the floor of the arena: the four corners of every frame lie on the page', () => {
    let least = Infinity
    for (const [name, m, long] of COURSES) {
      for (let n = 0; n < long * FPS; n++) {
        const shot = finishShot(n / FPS, m)
        if (!shot || shot.low > 0) continue
        const b = basis(shot.pose)
        const h = Math.tan((shot.pose.fov * Math.PI) / 360)
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
          const d = [0, 1, 2].map((i) => b.forward[i]! + b.right[i]! * sx * h * (16 / 9) + b.up[i]! * sy * h)
          const t = -shot.pose.eye[2] / d[2]!
          const [x, y] = [shot.pose.eye[0] + d[0]! * t, shot.pose.eye[1] + d[1]! * t]
          least = Math.min(least, 960 - Math.abs(x), 540 - Math.abs(y))
          expect(Math.abs(x), `${name}, frame ${n}, x`).toBeLessThanOrEqual(960)
          expect(Math.abs(y), `${name}, frame ${n}, y`).toBeLessThanOrEqual(540)
        }
      }
    }
    console.log('from above, the nearest a corner of the frame comes to the edge of the floor, px', least.toFixed(1))
  })

  it('passes no pillar close: the lens keeps its distance from the body of every pillar', () => {
    let least = Infinity
    let where = ''
    for (const [name, m, long] of COURSES) {
      for (let n = 0; n < long * FPS; n++) {
        const shot = finishShot(n / FPS, m)
        if (!shot) continue
        const [x, y, z] = [shot.pose.eye[0] + 960, 540 - shot.pose.eye[1], shot.pose.eye[2]]
        for (const p of PILLARS) {
          const half = ARENA.pillar.side / 2
          const d = Math.hypot(Math.max(0, Math.abs(x - p.x) - half), Math.max(0, Math.abs(y - p.y) - half), Math.max(0, z - ARENA.pillar.high))
          if (d < least) [least, where] = [d, `${name}, frame ${n}, ${p.id}`]
        }
      }
    }
    console.log('nearest body of a pillar to the lens, px', least.toFixed(1), where)
    expect(least, where).toBeGreaterThanOrEqual(LIMIT.pillar)
  })

  it('fades out a pillar or a pane that stands in the way of the low lens before the fire: none covers the figure in the facing view, none nearer than 90 px fills over 3 percent of the frame, and each comes and goes over 0.15 s', () => {
    const told: Record<string, string> = {}
    for (const [name, m, long] of COURSES) {
      let was: Record<string, number> = {}
      const span: Record<string, [number, number]> = {}
      for (let n = 0; n < long * FPS; n++) {
        const t = n / FPS
        const shot = finishShot(t, m)
        const now = fadesOf(t, m) ?? {}
        for (const b of BLOCKS) {
          expect(Math.abs((now[b.id] ?? 0) - (was[b.id] ?? 0)), `${name}, frame ${n}, ${b.id}`).toBeLessThanOrEqual(WAY.step)
          if ((now[b.id] ?? 0) > 0) span[b.id] = [span[b.id]?.[0] ?? n, n]
        }
        was = now
        if (!shot || shot.low <= 0 || t > m.fire) {
          if (!shot || t > m.fire + CAMERA.fade.over) expect(now, `${name}, frame ${n}`).toEqual({})
          continue
        }
        const way = inTheWay(shot.pose, shot.low)
        for (const id of way.fills) expect(now[id], `${name}, frame ${n}, ${id} fills the frame`).toBe(1)
        if (shot.view === 'charge' && t >= m.arms + CAMERA.down[1]) for (const id of way.covers) expect(now[id], `${name}, frame ${n}, ${id} covers the figure`).toBe(1)
      }
      expect(fadesOf(37 / FPS, m)?.['pillar.3'], name).toBe(1)
      told[name] = JSON.stringify(span)
    }
    console.log('blocks faded, first and last frame of each', told)
  })

  it('eases in and out of every move: it starts and ends each course at rest, from above', () => {
    for (const [name, m, long] of COURSES) {
      expect(finishShot(0, m), name).toBeNull()
      expect(finishShot(long, m), name).toBeNull()
      expect(steps(above, poseAt(1 / stepHz, m)).eye, name).toBeLessThan(LIMIT.rest)
      const end = m.fire + LAST_LOW
      expect(steps(poseAt(end - 1 / stepHz, m), above).eye, name).toBeLessThan(LIMIT.rest)
    }
  })

  it('keeps the horizon level: the picture never rolls about the line of sight', () => {
    for (const [name, m, long] of COURSES) {
      for (let n = 1; n <= long * FPS; n++) {
        const s = finishShot(n / FPS, m)
        if (!s) continue
        const b = basis(s.pose)
        expect(Math.abs(b.right[2]), `${name}, frame ${n}`).toBeLessThan(1e-9)
        expect(s.pose.eye[2], `${name}, frame ${n}`).toBeGreaterThan(20)
      }
    }
  })

  it('from above is the close view of the finish to the last digit, and low only between the arms and the end of the rise', () => {
    const old = frame({ x: CLOSE.x, y: CLOSE.y, w: CLOSE.w, h: CLOSE.h })
    for (let i = 0; i < 3; i++) {
      expect(above.eye[i]).toBeCloseTo(old.eye[i]!, 9)
      expect(above.target[i]).toBeCloseTo(old.target[i]!, 9)
    }
    expect(above.fov).toBe(old.fov)
    expect(lowOf(ABOVE)).toBe(0)
    for (const [name, m] of COURSES) {
      const s = finishShot(m.fire + LAST_LOW - 0.02, m)!
      expect(s.low, name).toBe(0)
      expect(s.tip, name).toBe(0)
    }
  })

  it('the four views are there in the film, each held: the charge 2 s and more, the fire, the blast, and from above for the larger share of the burn', () => {
    const m = COURSES[0]![1]
    const held = (t: number): number => steps(poseAt(t, m), poseAt(t + 1 / FPS, m)).turn
    const view = (t: number): string => finishRig(t, m).view
    expect(view(2)).toBe('charge')
    expect(view(m.fire)).toBe('fire')
    expect(view(m.fire + CAMERA.back[1])).toBe('blast')
    expect(view(m.fire + CAMERA.rise[0] + 0.1)).toBe('end')
    expect(held(2)).toBeLessThan(0.05)
    expect(m.turn - CAMERA.down[1]).toBeGreaterThanOrEqual(2)
    expect(m.turn + m.round).toBeLessThanOrEqual(m.fire)
    const burn = SHOUT.gone - SHOUT.fire
    expect(burn - CAMERA.rise[1]).toBeGreaterThan(burn / 2)
  })

  it('the facing view can be had for the power-up from one switch, and the switch is off', () => {
    expect(CAMERA.powerUp).toBe(false)
    const from = { ...ABOVE, tall: 1080 / 1.6 }
    expect(facing(from, FEET, 0)).toBeNull()
    const s = facing(from, FEET, 1)!
    expect(s.low).toBe(1)
    expect(s.rig.az).toBe(CAMERA.charge.az)
    expect(inside(project(s.pose, FEET))).toBe(true)
  })
})

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
const live = (driver: Driver): Stage => new Stage({ mode: 'live', flow, pages, driver, seed: config.seed })
const seen = (stage: Stage, name: string): number => stage.events.find((e) => e.name === name)?.step ?? -1

interface Look { step: number; view: CameraPose | null; low: boolean; arrow: boolean; boss: boolean; name: string }
const look = (stage: Stage, filmed = false): Look => {
  const f = stage.frameAt(stage.time)
  const i = finishNow()
  const view = f.view
  const pose = view ?? above
  const low = view !== null && view.up !== undefined
  let arrow = true
  if (i) {
    const s = finishState(i)
    if (s.up) arrow = [[0, 0], [0, 60]].every(([x, y]) => { const p = toPage(s.pose, x!, y!, 0); return inside(project(pose, toWorld(p.x, p.y, p.z))) })
  }
  const arms = seen(stage, 'finish-arms')
  const fire = seen(stage, 'finish-fire')
  const t = (stage.step - arms) / stepHz
  const name = arms < 0 || !low ? 'above' : finishRig(t, marksOf(filmed, 0, -1, fire < 0 ? -1 : (fire - arms) / stepHz)).view
  return { step: stage.step, view, low, arrow, boss: inside(project(pose, toWorld(FALLEN.x, FALLEN.y, 0))), name }
}

const framedOnBoss = (l: Look): boolean => l.low && (l.name === 'end' || l.name === 'above')

const jumps = (looks: Look[], name: string): void => {
  const over: number[] = []
  for (let n = 1; n < looks.length; n++) {
    const d = steps(looks[n - 1]!.view ?? above, looks[n]!.view ?? above)
    for (const k of ['eye', 'turn', 'roll', 'field'] as const) expect(d[k], `${name}: step ${looks[n]!.step}, ${k}`).toBeLessThanOrEqual(WHIP[k])
    if ((['eye', 'turn', 'roll', 'field'] as const).some((k) => d[k] > LIMIT[k])) over.push(n)
  }
  expect(over.length, name).toBeLessThanOrEqual(4)
  if (over.length) expect(over[over.length - 1]! - over[0]!, name).toBeLessThanOrEqual(4)
}

describe.runIf(LOOK1_ON)('the camera of the finishing blast: in the film', () => {
  const stage = film()
  const looks: Look[] = []
  while (stage.page.id === 'step4' && seen(stage, 'boss-fall') < 0 && stage.time < 200) stage.advance(PER)
  const fall = seen(stage, 'boss-fall')
  const before = look(stage, true)
  while (stage.page.id === 'step4' && seen(stage, 'finish-press') < 0 && stage.time < 260) {
    stage.advance(PER)
    looks.push(look(stage, true))
  }

  it("the film's events are where they were, in frames after the boss's fall", () => {
    for (const [name, frames] of Object.entries(EVENTS)) expect(Math.floor(seen(stage, name) / PER) - Math.floor(fall / PER), name).toBe(frames)
  })

  it('the view is from above, as it was, before the arms come out and from the end of the rise on', () => {
    expect(before.low).toBe(false)
    const arms = seen(stage, 'finish-arms')
    const fire = seen(stage, 'finish-fire')
    const old = frame({ x: CLOSE.x, y: CLOSE.y, w: CLOSE.w, h: CLOSE.h })
    for (const l of looks) {
      const lowTime = l.step > arms && l.step < fire + LAST_LOW * stepHz
      if (!lowTime) {
        expect(l.low, `step ${l.step}`).toBe(false)
        if (l.step >= fire) expect(l.view, `step ${l.step}`).toEqual(old)
      }
    }
    expect(looks.some((l) => l.low)).toBe(true)
  })

  it('the arrow is inside the frame in every frame, and the fallen boss from the fire view on', () => {
    for (const l of looks) {
      if (!framedOnBoss(l)) expect(l.arrow, `arrow, step ${l.step}, ${l.name}`).toBe(true)
      if (l.name === 'blast' || framedOnBoss(l)) expect(l.boss, `boss, step ${l.step}, ${l.name}`).toBe(true)
    }
    const fire = seen(stage, 'finish-fire')
    expect(looks.find((l) => l.step >= fire)!.boss).toBe(true)
  })

  it('no two frames of the film jump over the named limits, but the three of the whip', () => {
    jumps(looks, 'the film')
  })
})

type Act = (since: number) => boolean
const VISITORS: [string, Act | null][] = [
  ['one who holds 2 s and lets go', (t) => t >= 0.3 && t < 2.3],
  ['one who clicks once', (t) => t >= 0.3 && t < 0.38],
  ['one who never presses', () => false],
  ['one who holds and never lets go', (t) => t >= 0.3],
  ['the keen bot', null]
]

describe.runIf(LOOK1_ON)('the camera of the finishing blast: on the live site', () => {
  const runs = VISITORS.map(([name, act]) => {
    const bot = new BotDriver('keen', config.seed)
    let arms = -1
    const stage: Stage = live({
      name: 'bot',
      input(v: DriverView): Pointer {
        const p = bot.input(v)
        if (!act) return p
        if (arms < 0 && seen(stage, 'finish-arms') >= 0) arms = v.time
        if (arms < 0 || seen(stage, 'boss-gone') >= 0) return p
        return { ...p, down: act(v.time - arms) }
      }
    })
    const looks: Look[] = []
    while (stage.page.id === 'step4' && seen(stage, 'finish-arms') < 0 && stage.time < 400) stage.advance(PER)
    while (stage.page.id === 'step4' && seen(stage, 'finish-press') < 0 && stage.time < 500) {
      stage.advance(PER)
      if (stage.page.id === 'step4') looks.push(look(stage))
    }
    while (stage.page.id === 'step4' && stage.time < 520) stage.advance(PER)
    return { name, stage, looks }
  })

  it('five kinds of visitor: the pointer is never ignored longer than the limit, and the events come in their order', () => {
    const table: Record<string, unknown> = {}
    for (const r of runs) {
      const at = (n: string): number => seen(r.stage, n)
      table[r.name] = { ignored: r.stage.longestIgnored.pointer, armsToFire: (at('finish-fire') - at('finish-arms')) / stepHz, fireToGone: (at('boss-gone') - at('finish-fire')) / stepHz, low: r.looks.filter((l) => l.low).length / FPS }
      expect(r.stage.longestIgnored.pointer, r.name).toBeLessThanOrEqual(IGNORED)
      const order = ['finish-arms', 'finish-fire', 'boss-gone', 'finish-walk', 'finish-kneel', 'finish-fist', 'finish-press'].map(at)
      for (let i = 0; i < order.length; i++) expect(order[i]!, `${r.name}, ${i}`).toBeGreaterThan(i ? order[i - 1]! : 0)
    }
    console.log('live visitors', JSON.stringify(table))
  })

  it('five kinds of visitor: the arrow is in the frame in every frame, the boss from the blast on, the view is from above again by the time the boss is gone, and no two frames jump', () => {
    for (const r of runs) {
      const gone = seen(r.stage, 'boss-gone')
      for (let n = 0; n < r.looks.length; n++) {
        const l = r.looks[n]!
        if (!framedOnBoss(l)) expect(l.arrow, `${r.name}: arrow, step ${l.step}, ${l.name}`).toBe(true)
        if (l.name === 'blast' || framedOnBoss(l)) expect(l.boss, `${r.name}: boss, step ${l.step}`).toBe(true)
        if (l.step >= gone) expect(l.low, `${r.name}: step ${l.step}`).toBe(false)
      }
      jumps(r.looks, r.name)
      expect(r.looks.some((l) => l.low), r.name).toBe(true)
    }
  })
})

describe.runIf(LOOK1_ON)('the low lens and the blocks of the arena, with the visitor at five places', () => {
  const PLACES: [string, [number, number] | null][] = [['the place of the proof', null], ['upper left', [480, 270]], ['upper right', [1440, 270]], ['lower left', [480, 810]], ['lower right', [1440, 810]]]
  const STOOD = 40
  const EARLY = 0.05
  const PATHS: [string, Act][] = [['click', (t) => t >= 0.3 && t < 0.38], ['hold', (t) => t >= 0.3 && t < 2.3]]

  it('on the click path and the hold path the arrow stands at the same place for the arms, no block covers the figure in the facing view, and none nearer than 90 px fills over 3 percent of the frame', () => {
    const told: Record<string, unknown> = {}
    let fall = -1
    for (const [path, act] of PATHS) {
      for (const [where, place] of PLACES) {
        const bot = new BotDriver('keen', config.seed)
        let arms = -1
        const stage: Stage = live({
          name: 'bot',
          input(v: DriverView): Pointer {
            const p = bot.input(v)
            const q = place && fall > 0 && v.time >= fall - EARLY ? { ...p, x: place[0], y: place[1] } : p
            if (seen(stage, 'boss-fall') < 0) return q
            if (arms < 0 && seen(stage, 'finish-arms') >= 0) arms = v.time
            return arms < 0 ? q : { ...q, down: act(v.time - arms) }
          }
        })
        const name = `${path}, ${where}`
        while (seen(stage, 'boss-fall') < 0 && stage.time < 400) stage.advance(PER)
        expect(seen(stage, 'boss-fall'), name).toBeGreaterThan(0)
        if (fall < 0) fall = stage.time
        const stood = [Math.round(stage.cursor.x), Math.round(stage.cursor.y)]
        while (stage.page.id === 'step4' && seen(stage, 'finish-arms') < 0 && stage.time < 400) stage.advance(PER)
        const at = stage.events.find((e) => e.name === 'finish-arms')!
        expect(Math.hypot(at.x - LAST.stand[0], at.y - LAST.stand[1]), name).toBeLessThan(STOOD)
        let faded = 0
        let facing = 0
        let off = 0
        while (stage.page.id === 'step4' && seen(stage, 'finish-fire') < 0 && stage.time < 500) {
          stage.advance(PER)
          const view = stage.frameAt(stage.time).view
          const i = finishNow()
          if (!view || view.up === undefined || !i) continue
          const way = inTheWay(view, i.low ?? 0)
          const still = (i.fade?.['pillar.3'] ?? 0) === 0 && (i.low ?? 0) >= 1
          for (const id of way.fills) expect(i.fade?.[id], `${name}, step ${stage.step}, ${id} fills the frame`).toBe(1)
          if (still) {
            facing++
            off = Math.max(off, Math.hypot(stage.cursor.x - LAST.stand[0], stage.cursor.y - LAST.stand[1]))
            expect(way.covers, `${name}, step ${stage.step}`).toEqual([])
          }
          if ((i.fade?.['pillar.3'] ?? 0) >= 1) faded++
        }
        expect(seen(stage, 'finish-fire'), name).toBeGreaterThan(0)
        expect(faded, name).toBeGreaterThan(5)
        expect(facing, name).toBeGreaterThan(5)
        expect(off, name).toBeLessThan(2)
        told[name] = { stood, arms: [Math.round(at.x), Math.round(at.y)], off: Math.round(off * 10) / 10, faded, facing }
      }
    }
    console.log('five places', JSON.stringify(told))
  }, 240000)
})

describe('a block of the arena faded for a low lens (NEEDS)', () => {
  const view = viewOf({ clock: UNFOLD.end + 40, unfold: UNFOLD.end, fight: newFight(), base: UNFOLD.end, fell: -1, pressed: false, arrow: { x: 500, y: 500 } })!
  const read = (root: THREE.Object3D): { drawn: number; ghosts: number[]; panes: number } => {
    const one = root.getObjectByName('arena-pillars') as THREE.Mesh
    const ghosts: number[] = []
    let panes = 0
    root.traverse((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined
      if (!m || !m.isMeshPhysicalMaterial) return
      let seenNow = true
      for (let o: THREE.Object3D | null = c; o; o = o.parent) if (!o.visible) seenNow = false
      if (seenNow && m.transparent && m.metalness > 0.5 && m.opacity < 1) ghosts.push(m.opacity)
      if (seenNow && (c as THREE.Mesh).renderOrder === 4) panes++
    })
    const count = one.geometry.drawRange.count
    return { drawn: Number.isFinite(count) ? count : one.geometry.getIndex()!.count, ghosts, panes }
  }

  it('with nothing said it is the arena as it was; a faded pillar leaves the one body and is drawn thin by itself, at 1 it is not drawn; a pane likewise; and all of it comes back', () => {
    const plain = makeArena()
    plain.pose(view)
    const was = read(plain.object)
    let f: Record<string, number> | null = null
    const told = makeArena({ fade: () => f })
    told.pose(view)
    expect(read(told.object)).toEqual(was)
    expect(was.ghosts).toEqual([])
    expect(was.panes).toBe(2)
    f = { 'pillar.3': 0.25, 'pane.0': 0.5 }
    told.pose(view)
    let now = read(told.object)
    expect(now.drawn).toBe((was.drawn * 7) / 8)
    expect(now.ghosts).toEqual([0.75])
    expect(now.panes).toBe(2)
    f = { 'pillar.3': 1, 'pane.0': 1 }
    told.pose(view)
    now = read(told.object)
    expect(now.drawn).toBe((was.drawn * 7) / 8)
    expect(now.ghosts).toEqual([])
    expect(now.panes).toBe(1)
    f = null
    told.pose(view)
    expect(read(told.object)).toEqual(was)
    plain.dispose()
    told.dispose()
  })
})

const digest = (root: THREE.Object3D): { n: number; sum: number } => {
  root.updateMatrixWorld(true)
  let n = 0
  let sum = 0
  const v = new THREE.Vector3()
  root.traverse((o) => {
    const m = o as THREE.Mesh
    for (const e of o.matrixWorld.elements) sum += e * ((n++ % 97) + 1)
    const p = m.geometry?.getAttribute?.('position')
    if (!p) return
    for (let i = 0; i < p.count; i += 7) {
      v.fromBufferAttribute(p as THREE.BufferAttribute, i).applyMatrix4(o.matrixWorld)
      sum += (v.x * 3 + v.y * 5 + v.z * 7) * ((n++ % 89) + 1)
    }
  })
  return { n, sum }
}

describe('the arena stood upright for a low lens (NEEDS)', () => {
  const BEFORE = { n: 14721, sum: 61108466.590976 }
  const view = viewOf({ clock: UNFOLD.end + 40, unfold: UNFOLD.end, fight: newFight(), base: UNFOLD.end, fell: -1, pressed: false, arrow: { x: 500, y: 500 } })!

  it('at 0, and with nothing said, every body of the arena is where the code before the change had it', () => {
    const plain = makeArena()
    plain.pose(view)
    expect(digest(plain.object)).toEqual(BEFORE)
    let k = 0
    const told = makeArena({ upright: () => k })
    told.pose(view)
    expect(digest(told.object)).toEqual(BEFORE)
    k = 1
    told.pose(view)
    expect(digest(told.object).sum).not.toBe(BEFORE.sum)
    k = 0
    told.pose(view)
    expect(digest(told.object)).toEqual(BEFORE)
    plain.dispose()
    told.dispose()
  })

  it('at 1 the top of a pillar stands over its foot', () => {
    const arena = makeArena({ upright: () => 1 })
    arena.pose(view)
    arena.object.updateMatrixWorld(true)
    const [x, y] = [563 - 960, 540 - 925]
    const top = new THREE.Vector3(x + (ARENA.leanX - x / EYE) * ARENA.pillar.high, y + (ARENA.lean - y / EYE) * ARENA.pillar.high, ARENA.pillar.high)
    const holder = arena.object.children.find((c) => c.matrixWorld.elements[11] !== 0)!
    top.applyMatrix4(holder.matrixWorld)
    expect(top.x).toBeCloseTo(x, 6)
    expect(top.y).toBeCloseTo(y, 6)
    arena.dispose()
  })
})

describe('the arena\'s pillars in shade for a low lens (NEEDS)', () => {
  const view = viewOf({ clock: UNFOLD.end + 40, unfold: UNFOLD.end, fight: newFight(), base: UNFOLD.end, fell: -1, pressed: false, arrow: { x: 500, y: 500 } })!
  const metalOf = (root: THREE.Object3D): { standing: THREE.MeshPhysicalMaterial; others: THREE.MeshPhysicalMaterial[] } => {
    const standing = (root.getObjectByName('arena-pillars') as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    const others: THREE.MeshPhysicalMaterial[] = []
    root.traverse((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined
      if (m && m !== standing && m.isMeshPhysicalMaterial && !others.includes(m)) others.push(m)
    })
    return { standing, others }
  }

  it('at 0, and with nothing said, the pillars keep their colour and mirrored light; at 1 they keep 0.4 of both, and no other material of the arena changes', () => {
    const plain = makeArena()
    plain.pose(view)
    const was = metalOf(plain.object)
    const colour = was.standing.color.clone()
    const mirrored = was.standing.envMapIntensity
    let k = 0
    const told = makeArena({ shade: () => k })
    told.pose(view)
    const now = metalOf(told.object)
    const rest = now.others.map((m) => [m.color.getHex(), m.envMapIntensity])
    expect(now.others.length).toBeGreaterThan(3)
    expect(now.standing.color.equals(colour)).toBe(true)
    expect(now.standing.envMapIntensity).toBe(mirrored)
    k = 1
    told.pose(view)
    expect(now.standing.color.r).toBeCloseTo(colour.r * 0.4, 9)
    expect(now.standing.color.b).toBeCloseTo(colour.b * 0.4, 9)
    expect(now.standing.envMapIntensity).toBeCloseTo(mirrored * 0.4, 9)
    expect(now.others.map((m) => [m.color.getHex(), m.envMapIntensity])).toEqual(rest)
    k = 0
    told.pose(view)
    expect(now.standing.color.equals(colour)).toBe(true)
    expect(now.standing.envMapIntensity).toBe(mirrored)
    plain.dispose()
    told.dispose()
  })
})

import fs from 'node:fs'
import { afterAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { makeArena } from '../src/arena'
import { ARENA, EYE, PANES, PILLARS } from '../src/arena/layout'
import { newFight } from '../src/boss/fight'
import { finishState } from '../src/boss/finish/acting'
import { ABOVE, BLOCKS, FEET, LAST_LOW, THIN, facing, fadesOf, feetFor, finishRig, finishShot, lowOf, marksOf, poseOf, sideOf, type Block, type Marks } from '../src/boss/finish/camera'
import { FALLEN, UNFOLD } from '../src/boss/plan'
import { lineTimes } from '../src/audio/standin'
import { CAMERA, CLOSE, FINISH, LAST, LOOK1_ON, SHOUT, SHOUT_LINE, SHOUT_RULE, shoutFloor, shoutOf, type ShoutMarks } from '../src/boss/tune'
import { finishNow, viewOf } from '../src/boss/viewof'
import { config, stepHz } from '../src/config'
import { makeStand } from '../src/cursor/stand/figure'
import { POSES, at, toPage } from '../src/cursor/stand/rig'
import { pages } from '../src/pages'
import { BotDriver } from '../src/stage/bots'
import { basis, frame, project, toWorld } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type FlowEntry, type Pointer } from '../src/stage/stage'
import type { CameraPose } from '../src/stage/types'

const FPS = config.film.fps
const PER = stepHz / FPS
const LIMIT = { eye: 130, turn: 12, roll: 9, screen: 140, field: 1.5, edge: 0, pane: 25, rest: 1.5, top: 1.55, thin: 3, pillar: 85 } as const
const WHIP = { eye: 420, turn: 60, roll: 60, screen: 2600, field: 1.5 } as const
const CUTS: number[] = []
const TYPED = { 'finish-arms': 60, 'finish-fire': 307, 'boss-gone': 513, 'finish-walk': 537, 'finish-kneel': 705, 'finish-fist': 783, 'finish-press': 837 } as const
const eventsOf = (m: ShoutMarks): Record<keyof typeof TYPED, number> => {
  const walk = m.gone + LAST.wait
  const kneel = walk + LAST.far / LAST.speed
  const fist = kneel + LAST.knees + LAST.breath
  return { 'finish-arms': m.arms, 'finish-fire': m.fire, 'boss-gone': m.gone, 'finish-walk': walk, 'finish-kneel': kneel, 'finish-fist': fist, 'finish-press': fist + LAST.fist + LAST.blow }
}
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

const FEET0 = FEET
const TALL = 150
const WAY = { near: 90, share: 0.03, half: 30, high: 140, step: 0.17 } as const
type P3 = [number, number, number]
const leanOf = (b: Block, low: number): [number, number] => [(1 - low) * (ARENA.leanX - (b.lo[0] + b.hi[0]) / 2 / EYE), (1 - low) * (ARENA.lean - (b.lo[1] + b.hi[1]) / 2 / EYE)]
const inTheWay = (pose: CameraPose, low: number, FEET: readonly number[] = FEET0): { covers: string[]; fills: string[] } => {
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
const TO_END = SHOUT.fire - SHOUT.beats[0] + FINISH.late
const COURSES: [string, Marks, number][] = [
  ['the film', marksOf(true, 0, SHOUT.fire - 0.45, Math.floor(SHOUT.fire * FPS) / FPS), 8],
  ['a visitor who clicks once at 0.3 s', marksOf(false, 0, HELD, HELD + CAMERA.roundLive), 5.5],
  ['a visitor who lets go at 0.8 s, in the middle of the way down', marksOf(false, 0, HELD, HELD + CAMERA.roundLive), 5.5],
  ['a visitor who holds 2 s and lets go', marksOf(false, 0, 2.3, 2.3 + CAMERA.roundLive), 6.5],
  ['a visitor who holds to the end', marksOf(false, 0, TO_END, TO_END + CAMERA.roundLive), 9],
  ['a visitor who never presses', marksOf(false, 0, FINISH.alone - CAMERA.roundLive, FINISH.alone), 9.5]
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

  // The charge view rests 1 s and more, not 2: the Builder set CAMERA.rest to 1 on 28 November, because every part is built to its short end with no padding, and with 2 s the view rested over a second with no word.
  it('the four views are there in the film, each held: the charge 1 s and more, the fire, the blast, and from above for the larger share of the burn', () => {
    const m = COURSES[0]![1]
    const rests = (CAMERA.down[1] + m.turn) / 2
    const held = (t: number): number => steps(poseAt(t, m), poseAt(t + 1 / FPS, m)).turn
    const view = (t: number): string => finishRig(t, m).view
    expect(view(rests)).toBe('charge')
    expect(view(m.fire)).toBe('fire')
    expect(view(m.fire + CAMERA.back[1])).toBe('blast')
    expect(view(m.fire + CAMERA.rise[0] + 0.1)).toBe('end')
    expect(held(rests)).toBeLessThan(0.05)
    expect(m.turn - CAMERA.down[1]).toBeGreaterThanOrEqual(1)
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

  it("the film's events are where the marks of the shout put them, in frames after the boss's fall; with the stand-in's marks they are where they were", () => {
    const standIn = shoutOf(null)
    const same = SHOUT.lead === standIn.lead && SHOUT.fire === standIn.fire && SHOUT.gone === standIn.gone && SHOUT.beats.every((b, i) => b === standIn.beats[i])
    for (const [name, s] of Object.entries(eventsOf(SHOUT))) {
      const frames = (seen(stage, name) - fall) / PER
      expect(Math.abs(frames - (FINISH.fall + s) * FPS), name).toBeLessThanOrEqual(0.75)
      if (same) expect(Math.floor(frames), name).toBe(TYPED[name as keyof typeof TYPED])
    }
    const first = eventsOf(shoutOf(null))
    for (const [name, frames] of Object.entries(TYPED)) expect(Math.floor((FINISH.fall + first[name as keyof typeof TYPED]) * FPS), name).toBe(frames)
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

describe.runIf(LOOK1_ON)('the view that faces the arrow at the power-up of line 7, an option', () => {
  interface Run { events: string[]; views: (CameraPose | null)[]; lows: number[]; feet: (P3 | null)[]; fades: (Readonly<Record<string, number>> | null)[]; up: number; lock: number }
  const run = (on: boolean): Run => {
    const sw = CAMERA as unknown as { powerUp: boolean }
    const was = sw.powerUp
    sw.powerUp = on
    try {
      const stage = film()
      const out: Run = { events: [], views: [], lows: [], feet: [], fades: [], up: -1, lock: -1 }
      while (stage.page.id === 'step4' && stage.time < 400 && seen(stage, 'finish-press') < 0) {
        stage.advance(PER)
        const f = stage.frameAt(stage.time)
        const i = finishNow()
        out.views.push(f.view)
        out.lows.push(f.view && f.view.up !== undefined ? i?.low ?? 0 : 0)
        const at = i && i.power ? feetFor(i.arrow) : null
        out.feet.push(at ? toWorld(at.x, at.y, 0) : null)
        out.fades.push(i?.fade ?? null)
        if (out.up < 0 && seen(stage, 'power-up') >= 0) out.up = out.views.length - 1
        if (out.up >= 0 && out.lock < 0 && !i?.power) out.lock = out.views.length - 1
      }
      out.events = stage.events.map((e) => `${e.name} ${e.step} ${Math.round(e.x)} ${Math.round(e.y)}`)
      return out
    } finally {
      sw.powerUp = was
    }
  }

  it('on the live site moves no event and keeps the pointer no longer: the stretch round the power-up is the same with the option on, and under the limit', () => {
    const sw = CAMERA as unknown as { powerUp: boolean }
    const was = sw.powerUp
    const told: Record<string, unknown> = {}
    const got: string[][] = []
    try {
      for (const on of [false, true]) {
        sw.powerUp = on
        const stage = live(new BotDriver('keen', config.seed))
        let taken = 0
        let run = 0
        let from = -1
        let low = 0
        let up = -1
        while (stage.page.id === 'step4' && stage.time < 400 && (up < 0 || stage.time < up + 8)) {
          stage.advance(PER)
          if (up < 0 && seen(stage, 'power-up') >= 0) up = stage.time
          const f = stage.frameAt(stage.time)
          if (f.view && f.view.up !== undefined && seen(stage, 'finish-arms') < 0) low++
          if (stage.cursor.taken) {
            if (run === 0) from = stage.time
            run++
          } else {
            if (up >= 0 && from <= up && run > taken) taken = run
            run = 0
          }
        }
        expect(up).toBeGreaterThan(0)
        expect(stage.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
        got.push(stage.events.map((e) => `${e.name} ${e.step} ${Math.round(e.x)} ${Math.round(e.y)}`))
        told[on ? 'on' : 'off'] = { takenRoundThePowerUp: Math.round((taken / FPS) * 1000) / 1000, longestIgnored: stage.longestIgnored.pointer, lowFrames: low }
      }
    } finally {
      sw.powerUp = was
    }
    expect(got[1]).toEqual(got[0])
    console.log('the rise live', JSON.stringify(told))
  }, 120000)

  it('is off as committed', () => {
    expect(CAMERA.powerUp).toBe(false)
  })

  it('comes down from the fists up, holds, and is the view of today again when the figure lies; no event of the page moves; no step over the limits; no block before the figure', () => {
    const off = run(false)
    const on = run(true)
    expect(on.events).toEqual(off.events)
    expect(on.events.length).toBeGreaterThan(100)
    expect(on.views.length).toBe(off.views.length)
    expect(on.up).toBe(off.up)
    expect(on.lock).toBe(off.lock)
    expect(on.up).toBeGreaterThan(0)
    expect(on.lock).toBeGreaterThan(on.up)
    const lows = on.lows.slice(0, on.lock + 60)
    const first = lows.findIndex((l) => l > 0)
    const last = lows.length - 1 - [...lows].reverse().findIndex((l) => l > 0)
    let begins = 0
    while (begins < on.views.length && JSON.stringify(on.views[begins]) === JSON.stringify(off.views[begins])) begins++
    expect(begins).toBeGreaterThanOrEqual(on.up)
    expect(begins - on.up).toBeLessThan(4)
    for (let n = on.lock; n < on.views.length; n++) expect(on.views[n], `frame ${n}`).toEqual(off.views[n])
    expect(off.lows.slice(0, off.lock + 60).every((l) => l === 0)).toBe(true)
    const most = { eye: 0, turn: 0, roll: 0, screen: 0, field: 0 }
    let held = 0
    const share: number[] = []
    for (let n = Math.max(1, on.up - 60); n < Math.min(on.views.length, on.lock + 60); n++) {
      const a = on.views[n - 1] ?? poseOf({ ...ABOVE, at: [0, 0, 0], tall: 1080 })
      const b = on.views[n] ?? poseOf({ ...ABOVE, at: [0, 0, 0], tall: 1080 })
      const feet = on.feet[n] ?? on.feet[n - 1]
      const p = basis(a)
      const q = basis(b)
      const d = { eye: Math.hypot(b.eye[0] - a.eye[0], b.eye[1] - a.eye[1], b.eye[2] - a.eye[2]), turn: angle(p.forward, q.forward), roll: angle(p.up, q.up), screen: 0, field: Math.abs(b.fov - a.fov) }
      if (feet && on.feet[n - 1]) {
        const fa = project(a, on.feet[n - 1]!)
        const fb = project(b, feet)
        d.screen = Math.hypot(fb.x - fa.x, fb.y - fa.y)
      }
      for (const k of ['eye', 'turn', 'roll', 'screen', 'field'] as const) {
        most[k] = Math.max(most[k], d[k])
        expect(d[k], `frame ${n - on.up} after the fists, ${k}`).toBeLessThanOrEqual(LIMIT[k])
      }
      if (on.lows[n]! > 0 && feet) {
        const way = inTheWay(b, on.lows[n]!, feet)
        for (const id of way.covers) expect(on.fades[n]?.[id], `frame ${n - on.up}, ${id} before the figure`).toBe(1)
        for (const id of way.fills) expect(on.fades[n]?.[id], `frame ${n - on.up}, ${id} fills the frame`).toBe(1)
        expect(inside(project(b, feet)), `frame ${n - on.up}, the feet`).toBe(true)
        expect(inside(project(b, [feet[0], feet[1], TALL])), `frame ${n - on.up}, the head`).toBe(true)
      }
      if (on.lows[n]! >= 1 && feet) {
        held++
        share.push(Math.abs(project(b, [feet[0], feet[1], TALL]).y - project(b, feet).y) / 1080)
      }
    }
    expect(held).toBeGreaterThan(40)
    const afterLock = on.events.filter((e) => Number(e.split(' ')[1]) >= (on.lock * PER)).length
    const faded = [...new Set(on.fades.slice(on.up, on.lock + 1).flatMap((f) => Object.keys(f ?? {})))]
    console.log('the rise', JSON.stringify({ events: on.events.length, frames: on.views.length, afterLock, faded, fistsUp: on.up, firstLow: first - on.up, lastLow: last - on.up, lock: on.lock - on.up, held, share: [Math.min(...share), Math.max(...share)].map((v) => Math.round(v * 1000) / 1000), most }))
  }, 120000)
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

describe('the standing arrow drawn in pieces of the film', () => {
  const centres = (o: THREE.Object3D): string[] => {
    const out: string[] = []
    o.traverse((x) => {
      const m = x as THREE.Mesh
      if (!m.isMesh) return
      const inst = m as unknown as THREE.InstancedMesh
      if (inst.isInstancedMesh) {
        if (inst.boundingSphere === null) inst.computeBoundingSphere()
        out.push(inst.boundingSphere!.center.toArray().map((v) => v.toFixed(3)).join(','))
      } else {
        if (m.geometry.boundingSphere === null) m.geometry.computeBoundingSphere()
        out.push(m.geometry.boundingSphere!.center.toArray().map((v) => v.toFixed(3)).join(','))
      }
    })
    return out
  }

  it('the middles its see-through pieces are put in order by are the same whether an earlier pose was drawn first or not', () => {
    const early = at(POSES.set, 300, 400)
    const late = at(POSES.ready, 520, 610)
    const run = makeStand()
    run.apply(early, 1)
    centres(run.object)
    run.apply(late, 2)
    const alone = makeStand()
    alone.apply(late, 2)
    const a = centres(alone.object)
    const b = centres(run.object)
    expect(a.length).toBeGreaterThan(10)
    expect(b).toEqual(a)
    run.dispose()
    alone.dispose()
  })
})

describe('the marks of the shout, worked out from the line', () => {
  const STAND_IN = { arms: 0, lead: 0, beats: [0.1, 1.04, 2.09, 2.9], fire: 4.13, gone: 7.56 }
  const TAKE = { starts: [0.2, 1.3, 3.9], seconds: 5.5 }
  const MOVED = { arms: 0, lead: 0, beats: [0.2, 1.3, 2.183, 2.865], fire: 3.9, gone: 7.33 }
  const LEVEL = LAST_LOW + SHOUT_RULE.level
  const FLOOR = CAMERA.down[1] + CAMERA.rest + CAMERA.ahead
  const INDEX = '../public/audio/index.json'
  afterAll(() => { vi.doUnmock(INDEX); vi.resetModules() })

  it('with the stand-in of the drafts file every mark is the number that was typed here before', () => {
    expect(shoutOf({ starts: [0.1, 1.04, 4.13], seconds: 6.26 })).toEqual(STAND_IN)
    expect(shoutOf(null)).toEqual(STAND_IN)
    expect(shoutOf({ starts: [0.5], seconds: 2 })).toEqual(STAND_IN)
    expect(shoutOf({ starts: [0.1, 1.04, 4.13], peak: 4.13, seconds: 6.26 })).toEqual(STAND_IN)
    expect(shoutOf({ starts: [0.1, 1.04, 3.6], peak: 4.13, seconds: 6.26 })).toEqual(STAND_IN)
    expect(shoutOf({ starts: [0.1, 0.54, 1.46], peak: 2.08, seconds: 3.52 }, 2.85)).toEqual({ arms: 0, lead: 0.77, beats: [0.137, 0.74, 1.457, 2.01], fire: 2.85, gone: 6.28 })
    expect(shoutOf({ starts: [0.1, 0.66, 1.3], peak: 1.85, seconds: 4.01 }, 3.85)).toEqual({ arms: 0, lead: 2, beats: [0.208, 1.374, 2.215, 2.864], fire: 3.85, gone: 7.31 })
    expect(shoutFloor()).toBe(2.85)
    expect(SHOUT_RULE.standIn).toEqual({ starts: [0.1, 1.04, 4.13], seconds: 6.26 })
    const now = lineTimes(SHOUT_LINE)!
    expect({ arms: SHOUT.arms, lead: SHOUT.lead, beats: SHOUT.beats, fire: SHOUT.fire, gone: SHOUT.gone }).toEqual(shoutOf(now))
    if (!now.kept) expect({ arms: SHOUT.arms, lead: SHOUT.lead, beats: SHOUT.beats, fire: SHOUT.fire, gone: SHOUT.gone }).toEqual(STAND_IN)
  })

  it('a take whose last phrase starts at the floor or later is laid on the arms: the two middle marks keep their share of the gap; the body is gone 1.3 s after the line ends, and no sooner than the camera is level with the page again after the fire mark', () => {
    expect(shoutFloor()).toBeCloseTo(FLOOR, 9)
    expect(shoutOf(TAKE)).toEqual(MOVED)
    const m = shoutOf({ starts: [0, 0.6, 4.2], seconds: 5.5 })
    expect(m.lead).toBe(0)
    expect(m.beats[2] - m.beats[1]).toBeCloseTo(0.3398 * 3.6, 3)
    expect(m.beats[3] - m.beats[1]).toBeCloseTo(0.6019 * 3.6, 3)
    expect(m.gone).toBeCloseTo(4.2 + LEVEL, 6)
    expect(shoutOf({ starts: [0, 0.6, 4.2], seconds: 4.2 + 2.5 }).gone).toBeCloseTo(4.2 + 2.5 + SHOUT_RULE.held, 6)
    for (const last of [1.2, 1.7, 2.1, 2.5]) expect(shoutOf({ starts: [0.1, 1, 4], seconds: 4 + last }).gone - (4 + last + SHOUT_RULE.held), `a last phrase of ${last} s`).toBeCloseTo(Math.max(0, LEVEL - SHOUT_RULE.held - last), 6)
  })

  it('a take whose last phrase starts sooner than the floor is shouted that much after the arms: the fire mark is the floor, the charge marks are stretched with it, and the charge view rests as long as with the stand-in or longer', () => {
    const takes: [string, { starts: number[]; seconds: number; peak?: number }, ShoutMarks][] = [
      ['4.0 s', { starts: [0.05, 0.7, 1.8], seconds: 4.0 }, { arms: 0, lead: 1.05, beats: [0.079, 1.108, 1.7, 2.157], fire: 2.85, gone: 6.35 }],
      ['3.3 s', { starts: [0.05, 0.6, 1.5], seconds: 3.3 }, { arms: 0, lead: 1.35, beats: [0.095, 1.14, 1.721, 2.169], fire: 2.85, gone: 6.28 }],
      ['the take as recorded, 3.52 s with its peak at 2.08 s', { starts: [0.1, 0.82, 1.46], peak: 2.08, seconds: 3.52 }, { arms: 0, lead: 0.77, beats: [0.137, 1.124, 1.71, 2.163], fire: 2.85, gone: 6.28 }],
      ['the take mended, 4.01 s with its peak at 1.85 s', { starts: [0.1, 0.66, 1.3], peak: 1.85, seconds: 4.01 }, { arms: 0, lead: 1, beats: [0.154, 1.017, 1.64, 2.12], fire: 2.85, gone: 6.31 }]
    ]
    for (const [name, take, want] of takes) {
      const m = shoutOf(take)
      const peak = take.peak ?? take.starts[2]!
      expect(m, name).toEqual(want)
      expect(m.lead + peak, name).toBeCloseTo(m.fire, 6)
      expect(m.fire, name).toBeCloseTo(FLOOR, 6)
      expect(m.beats[0] / m.fire, name).toBeCloseTo(take.starts[0]! / peak, 2)
      expect(m.beats[1] / m.fire, name).toBeCloseTo(take.starts[1]! / peak, 2)
      expect((m.beats[2] - m.beats[1]) / (m.fire - m.beats[1]), name).toBeCloseTo(SHOUT_RULE.between[0], 2)
      expect((m.beats[3] - m.beats[1]) / (m.fire - m.beats[1]), name).toBeCloseTo(SHOUT_RULE.between[1], 2)
      expect(m.gone, name).toBeCloseTo(Math.max(m.lead + take.seconds + SHOUT_RULE.held, m.fire + LEVEL), 6)
      expect(m.fire - CAMERA.ahead - CAMERA.down[1], name).toBeGreaterThanOrEqual(CAMERA.rest - 1e-9)
    }
  })

  const played = async (take: { starts: number[]; seconds: number }) => {
    vi.resetModules()
    vi.doMock(INDEX, async (real: () => Promise<{ default: { lines: { id: string }[] } }>) => {
      const was = (await real()).default
      return { default: { ...was, lines: [...was.lines.filter((l) => l.id !== `line.${SHOUT_LINE}`), { id: `line.${SHOUT_LINE}`, seconds: take.seconds, words: 'I have / five years / of experience', starts: take.starts }] } }
    })
    const tune = await import('../src/boss/tune')
    const sound = await import('../src/audio/standin')
    const cues = await import('../src/audio/cues')
    const cam = await import('../src/boss/finish/camera')
    const st = await import('../src/stage/stage')
    const metrics = await import('../src/shell/metrics')
    for (const name of metrics.FONTS) metrics.registerFont(name, JSON.parse(fs.readFileSync(`public/fonts/${name}.json`, 'utf8')))
    const { pages: fresh, preparePages } = await import('../src/pages')
    await preparePages()
    const { riseAfterFire } = await import('../src/ui/rise')
    const stage = new st.Stage({ mode: 'film', flow: st.filmFlow('boss'), pages: fresh, driver: new st.ScriptDriver(), film: st.filmOptions('boss') })
    const views: { step: number; view: CameraPose | null }[] = []
    while (stage.page.id === 'step4' && seen(stage, 'boss-fall') < 0 && stage.time < 200) stage.advance(PER)
    while (stage.page.id === 'step4' && seen(stage, 'finish-press') < 0 && stage.time < 260) {
      stage.advance(PER)
      views.push({ step: stage.step, view: stage.frameAt(stage.time).view })
    }
    return { tune, sound, cues, cam, stage, views, riseAfterFire }
  }
  const isLow = (v: { view: CameraPose | null }): boolean => v.view !== null && v.view.up !== undefined

  it.runIf(LOOK1_ON)('with a take whose last phrase is short the view is level with the page from the step the body is gone, before the arrow walks', async () => {
    const short = { starts: [0.05, 0.6, 2.3], seconds: 3.5 }
    const { tune, stage, views } = await played(short)
    expect(tune.SHOUT.lead).toBeCloseTo(FLOOR - 2.3, 6)
    expect(tune.SHOUT.fire).toBeCloseTo(FLOOR, 6)
    expect(tune.SHOUT.gone).toBeCloseTo(FLOOR + LEVEL, 6)
    expect(tune.SHOUT.gone).toBeGreaterThan(tune.SHOUT.lead + short.seconds + SHOUT_RULE.held + 0.8)
    const gone = seen(stage, 'boss-gone')
    const walk = seen(stage, 'finish-walk')
    expect(gone).toBeGreaterThan(0)
    expect(walk).toBeGreaterThan(gone)
    expect(views.some(isLow)).toBe(true)
    for (const v of views) if (v.step >= gone) expect(isLow(v), `step ${v.step}, ${v.step - gone} steps after the body is gone`).toBe(false)
    const last = Math.max(...views.filter(isLow).map((v) => v.step))
    expect((walk - last) / stepHz).toBeGreaterThanOrEqual(tune.LAST.wait - 2 / FPS)
  })

  it.runIf(LOOK1_ON)('with a made-up take in the sound index the page\'s events, the camera, the caption of the shouted words and the sound cues all stand on the take\'s times', async () => {
    const { tune, sound, cues, cam, stage, views, riseAfterFire } = await played(TAKE)
    expect(sound.lineTimes(SHOUT_LINE)).toEqual({ ...TAKE, kept: true })
    expect({ arms: tune.SHOUT.arms, lead: tune.SHOUT.lead, beats: tune.SHOUT.beats, fire: tune.SHOUT.fire, gone: tune.SHOUT.gone }).toEqual(MOVED)

    const steps = (n: string): number[] => stage.events.filter((e) => e.name === n).map((e) => e.step)
    const arms = steps('finish-arms')[0]!
    const fire = steps('finish-fire')[0]!
    const after = (step: number): number => (step - arms) / stepHz
    const near = 2.5 / stepHz

    expect(after(steps('boss-fall')[0]!)).toBeCloseTo(-tune.FINISH.fall, 1)
    const charges = steps('finish-charge').map(after)
    expect(charges.length).toBe(4)
    charges.forEach((t, k) => expect(Math.abs(t - MOVED.beats[k]!), `charge mark ${k}`).toBeLessThanOrEqual(near))
    expect(Math.abs(after(fire) - MOVED.fire)).toBeLessThanOrEqual(near)
    expect(Math.abs(after(steps('boss-gone')[0]!) - MOVED.gone)).toBeLessThanOrEqual(near)

    const low = views.filter(isLow)
    expect(low.length).toBeGreaterThan((MOVED.fire + LAST_LOW) * FPS - 6)
    const off = (marks: Marks): number => Math.max(...low.map((v) => { const e = v.view!.eye; const w = cam.finishShot(after(v.step), marks)?.pose.eye ?? [1e6, 1e6, 1e6]; return Math.hypot(e[0] - w[0]!, e[1] - w[1]!, e[2] - w[2]!) }))
    const grid = [-3, -2, -1, 0, 1, 2, 3].map((d) => d / stepHz)
    const best = (turn: number): number => Math.min(...grid.flatMap((a) => grid.map((f) => off({ arms: a, turn: a + turn, fire: after(fire) + f, round: CAMERA.round }))))
    expect(best(TAKE.starts[2]! - CAMERA.ahead)).toBeLessThan(1e-6)
    expect(best(STAND_IN.fire - CAMERA.ahead)).toBeGreaterThan(50)

    const frameOf = (step: number): number => Math.floor(step / PER)
    const shown = sound.filmCaptions([{ id: `line.${SHOUT_LINE}`, frame: frameOf(arms) }], FPS, sound.standIns(), stage.events.map((e) => ({ name: e.name, frame: frameOf(e.step) })))
    const marked = [steps('finish-charge')[0]!, steps('finish-charge')[1]!, fire].map(frameOf)
    expect(shown.map((c) => c.words)).toEqual(['I have', 'I have five years', 'I have five years of experience'])
    shown.forEach((c, k) => expect(Math.abs(c.first - marked[k]!), `phrase ${k}`).toBeLessThanOrEqual(1))
    expect(shown[2]!.last).toBe(frameOf(fire) + Math.round(riseAfterFire() * FPS) - 1)

    expect(cues.spoken[SHOUT_LINE]!.event).toBe('finish-arms')
    const laid = await import('../src/audio/change')
    for (const n of ['finish-arms', 'finish-fire', 'boss-gone']) expect(laid.changeCuesOf(n, 'step4').map((c) => c.id), n).toContain(n)
    expect(laid.changeCuesOf('finish-charge', 'step4').map((c) => c.id)).toEqual([])
    expect(laid.changeCue('finish-charge')!.lands).toMatchObject({ on: 'finish-fire', from: 'finish-arms' })
    expect(after(fire) - STAND_IN.fire).toBeLessThan(-0.2)
  })
})

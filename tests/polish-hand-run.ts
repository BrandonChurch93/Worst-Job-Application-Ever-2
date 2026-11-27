import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { homeDistance } from '../src/stage/camera'
import { liveFlow, MouseDriver, Stage } from '../src/stage/stage'
import type { Driver, Pointer } from '../src/stage/types'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'

export const PER = stepHz / 60
const DEG = 180 / Math.PI
const D = homeDistance()

export interface Row { i: number; time: number; page: string; index: number; phase: string; turn: number; px: number; py: number; scroll: number; x: number; y: number; z: number; sx: number; sy: number; squash: number; angle: number; state: string; hit: boolean; down: boolean }

// Where a point of the page is on the screen while the slab stands turned by `turn` about the line across the middle of the view.
export function onScreen(x: number, y: number, z: number, scroll: number, turn: number): { x: number; y: number } {
  const u = x - 960
  const v = 540 - (y - scroll)
  const vy = v * Math.cos(turn) - z * Math.sin(turn)
  const vz = v * Math.sin(turn) + z * Math.cos(turn)
  const k = D / (D - vz)
  return { x: 960 + u * k, y: 540 - vy * k }
}

// Every input the stage asked for, kept by step, so that a second stage can be given the same hand up to a step and another hand from there.
export class Kept implements Driver {
  readonly name = 'mouse' as const
  log: Pointer[] = []
  constructor(private inner: Driver) {}
  input(v: Parameters<Driver['input']>[0]): Pointer {
    const p = this.inner.input(v)
    this.log[v.step] = { ...p }
    return p
  }
}

export class Forked implements Driver {
  readonly name = 'mouse' as const
  constructor(private log: Pointer[], private from: number, private own: (step: number, last: Pointer) => Pointer) {}
  input(v: Parameters<Driver['input']>[0]): Pointer {
    if (v.step < this.from) return { ...this.log[v.step]! }
    return this.own(v.step - this.from, this.log[this.from - 1]!)
  }
}

export function rowOf(s: Stage, i: number, raw: { x: number; y: number; down?: boolean }, hit: boolean): Row {
  const c = s.cursor.pose()
  const turn = (s as unknown as { turnAt(): number }).turnAt()
  const scroll = s.page.scroll()
  const phase = (s as unknown as { phase: string }).phase
  const at = onScreen(c.x, c.y, c.z, scroll, c.rides ? turn : 0)
  const state = [c.acting, c.reaction ?? '', s.cursor.inAir ? 'air' : '', c.rides ? 'rides' : '', c.taken ? 'taken' : '', c.inBall ? 'ball' : ''].filter(Boolean).join('+')
  return { i, time: s.time, page: s.page.id, index: s.entryIndex, phase: phase === 'play' ? '' : phase, turn: turn * DEG, px: raw.x, py: raw.y, scroll, x: c.x, y: c.y, z: c.z, sx: at.x, sy: at.y, squash: c.squash, angle: -(c.lean + c.spin) * DEG, state, hit, down: raw.down === true }
}

export interface Visit { rows: Row[]; log: Pointer[]; stage: Stage; finished: boolean }

// The pack's own visitor on the stepped live stage, with no browser: one row for each frame of 60, taken after the frame's four steps.
export function visit(seconds: number, untilIndex = 99): Visit {
  const d = new MouseDriver()
  const kept = new Kept(d)
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: kept })
  const v = makeVisitor(1, VISITOR, keyBlock(config))
  const rows: Row[] = []
  let seen = 0
  let quiet = 0
  for (let i = 0; i < seconds * 60 && !s.finished; i++) {
    const pose = s.cursor.pose()
    const t = { time: s.time, page: s.page.id, gags: s.gagsReached, finished: s.finished, turning: s.turning, scroll: s.page.scroll(), hint: s.page.hint(), hero: { x: pose.x, y: pose.y }, hits: s.events.filter((e) => e.hitsCursor).map((e) => ({ name: e.name, page: e.page, x: e.x, y: e.y })) }
    let left = d.pointer.flipLeft === true
    let right = d.pointer.flipRight === true
    for (const a of v.act(t) as Record<string, unknown>[]) {
      if (a.move) Object.assign(d.pointer, { x: (a.move as number[])[0]!, y: (a.move as number[])[1]! })
      if (a.down) d.pointer.down = true
      if (a.up) d.pointer.down = false
      if (a.wheel) d.pulse({ wheel: a.wheel as number })
      if (a.press) d.pulse({ key: a.press === 'Space' ? ' ' : (a.press as string) })
      if (a.keyDown === 'ShiftLeft') left = true
      if (a.keyUp === 'ShiftLeft') left = false
      if (a.keyDown === 'ShiftRight') right = true
      if (a.keyUp === 'ShiftRight') right = false
    }
    if (left && !d.pointer.flipLeft) d.pulse({ flipLeft: true })
    if (right && !d.pointer.flipRight) d.pulse({ flipRight: true })
    d.pointer.flipLeft = left
    d.pointer.flipRight = right
    s.advance(PER)
    const hit = s.events.slice(seen).some((e) => e.hitsCursor)
    seen = s.events.length
    rows.push(rowOf(s, i, d.pointer, hit))
    if (s.entryIndex >= untilIndex && !s.turning && ++quiet > 40) break
  }
  return { rows, log: kept.log, stage: s, finished: s.finished }
}

// A second stage that had the kept hand up to the frame `from` and has `own` from there. Rows run from `lead` frames before `from` for `frames` frames after it.
export function fork(v: Visit, from: number, frames: number, own: (step: number, last: Pointer) => Pointer, lead = 0): Row[] {
  const at = from * PER
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new Forked(v.log, at, own) })
  const first = (from - lead) * PER
  let best = 0
  for (const k of v.stage.checkpointSteps()) if (k <= first && k > best) best = k
  if (best > 0) s.restore(v.stage.checkpoint(best))
  s.goto(first)
  const rows: Row[] = []
  let seen = s.events.length
  for (let i = from - lead; i < from + frames; i++) {
    s.advance(PER)
    const hit = s.events.slice(seen).some((e) => e.hitsCursor)
    seen = s.events.length
    const k = s.step - 1
    rows.push(rowOf(s, i, k < at ? v.log[k]! : own(k - at, v.log[at - 1]!), hit))
  }
  return rows
}

// A hand that lies still where it was, and one that strokes `by` over `frames` frames from where it was.
export const resting = (_step: number, last: Pointer): Pointer => ({ x: last.x, y: last.y, down: false })
export const stroking = (frames: number, by = { x: 500, y: 250 }) => (step: number, last: Pointer): Pointer => {
  const u = Math.min(1, (step + 1) / (frames * PER))
  const e = u * u * (3 - 2 * u)
  return { x: last.x + (last.x < 960 ? by.x : -by.x) * e, y: last.y + (last.y < 540 ? by.y : -by.y) * e, down: false }
}

export interface Turn { start: number; half: number; flat: number; from: string; to: string }

// The page turns of a run: the first frame the stage says it turns, the first frame of the arriving page, and the first frame it is given to play.
export function turnsOf(rows: Row[]): Turn[] {
  const out: Turn[] = []
  for (let k = 1; k < rows.length; k++) {
    if (rows[k]!.phase !== 'leave' || rows[k - 1]!.phase !== '') continue
    let half = k
    while (half < rows.length && rows[half]!.phase === 'leave') half++
    let flat = half
    while (flat < rows.length && rows[flat]!.phase === 'arrive') flat++
    if (flat >= rows.length) break
    out.push({ start: k, half, flat, from: rows[k]!.page, to: rows[flat]!.page })
  }
  return out
}

const n = (v: number, w: number, d = 0): string => v.toFixed(d).padStart(w)

export const table = (rows: Row[], mark: Record<number, string> = {}): string => ['frame    time page   phase    turn  ptrX  ptrY  tipX  tipY    z  scrX  scrY   off  move squash  angle state', ...rows.map((r, k) => {
  const b = k > 0 ? rows[k - 1]! : r
  const off = Math.hypot(r.sx - r.px, r.sy - r.py)
  const move = Math.hypot(r.sx - b.sx, r.sy - b.sy)
  return `${n(r.i, 5)} ${n(r.time, 7, 3)} ${r.page.padEnd(6)} ${r.phase.padEnd(6)} ${n(r.turn, 6, 1)} ${n(r.px, 5)} ${n(r.py, 5)} ${n(r.x, 5)} ${n(r.y, 5)} ${n(r.z, 4)} ${n(r.sx, 5)} ${n(r.sy, 5)} ${n(off, 5, 1)} ${n(move, 5, 1)} ${n(r.squash, 6, 2)} ${n(r.angle, 6, 1)} ${r.state}${r.down ? ' down' : ''}${r.hit ? ' HIT' : ''}${mark[r.i] ? ` <- ${mark[r.i]}` : ''}`
})].join('\n')

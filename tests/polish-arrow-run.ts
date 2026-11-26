import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { liveFlow, MouseDriver, Stage } from '../src/stage/stage'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'
import { config } from '../src/config'

export interface Row { i: number; time: number; page: string; x: number; y: number; z: number; px: number; py: number; lean: number; spin: number; turn: number; squash: number; state: string; speed: number; hit: boolean }
const DEG = 180 / Math.PI
const PER = stepHz / 60

function rowOf(s: Stage, i: number, p: { x: number; y: number }, before: { x: number; y: number }, hit: boolean): Row {
  const c = s.cursor.pose()
  const state = [c.acting, c.reaction ?? '', s.cursor.inAir ? 'air' : '', c.taken ? 'taken' : '', s.turning ? 'turning' : '', c.arms ? 'arms' : '', c.inBall ? 'ball' : ''].filter(Boolean).join('+')
  return { i, time: s.time, page: s.page.id, x: c.x, y: c.y, z: c.z, px: p.x, py: p.y, lean: c.lean * DEG, spin: c.spin * DEG, turn: -(c.lean + c.spin) * DEG, squash: c.squash, state, speed: Math.hypot(c.x - before.x, c.y - before.y) * 60, hit }
}

// The pack's own visitor on the stepped live stage, with no browser: one row per frame of 60.
export function visitorRun(seconds: number): Row[] {
  const d = new MouseDriver()
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
  const v = makeVisitor(1, VISITOR, keyBlock(config))
  const rows: Row[] = []
  let seen = 0
  let at = { x: VISITOR.start[0], y: VISITOR.start[1] }
  for (let i = 0; i < seconds * 60 && !s.finished; i++) {
    const pose = s.cursor.pose()
    const t = { time: s.time, page: s.page.id, gags: s.gagsReached, finished: s.finished, turning: s.turning, scroll: s.page.scroll(), hint: s.page.hint(), hero: { x: pose.x, y: pose.y }, hits: s.events.filter((e) => e.hitsCursor).map((e) => ({ name: e.name, page: e.page, x: e.x, y: e.y })) }
    for (const a of v.act(t) as Record<string, unknown>[]) {
      if (a.move) {
        at = { x: (a.move as number[])[0]!, y: (a.move as number[])[1]! }
        Object.assign(d.pointer, { x: at.x, y: at.y })
      }
      if (a.down) d.pointer.down = true
      if (a.up) d.pointer.down = false
      if (a.wheel) d.pulse({ wheel: a.wheel as number })
      if (a.press) d.pulse({ key: a.press === 'Space' ? ' ' : (a.press as string) })
    }
    const before = { x: pose.x, y: pose.y }
    s.advance(PER)
    const hit = s.events.slice(seen).some((e) => e.hitsCursor)
    seen = s.events.length
    rows.push(rowOf(s, i, at, before, hit))
  }
  return rows
}

// A hand's fast strokes with dead stops between them, laid over whatever page the visit is on from the frame `from`.
export function strokeRun(untilPage: string, strokes: { to: [number, number]; seconds: number; rest: number }[], settle = 0): Row[] {
  const d = new MouseDriver()
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
  const v = makeVisitor(1, VISITOR, keyBlock(config))
  let at = { x: VISITOR.start[0] as number, y: VISITOR.start[1] as number }
  let i = 0
  const feed = (a: Record<string, unknown>): void => {
    if (a.move) {
      at = { x: (a.move as number[])[0]!, y: (a.move as number[])[1]! }
      Object.assign(d.pointer, { x: at.x, y: at.y })
    }
    if (a.down) d.pointer.down = true
    if (a.up) d.pointer.down = false
    if (a.wheel) d.pulse({ wheel: a.wheel as number })
  }
  while (s.page.id !== untilPage && i < 60 * 60) {
    const pose = s.cursor.pose()
    const t = { time: s.time, page: s.page.id, gags: s.gagsReached, finished: s.finished, turning: s.turning, scroll: s.page.scroll(), hint: s.page.hint(), hero: { x: pose.x, y: pose.y }, hits: [] }
    for (const a of v.act(t) as Record<string, unknown>[]) feed(a)
    s.advance(PER)
    i++
  }
  for (const a of v.end() as Record<string, unknown>[]) feed(a)
  for (let k = 0; k < settle; k++, i++) s.advance(PER)
  const rows: Row[] = []
  let seen = s.events.length
  const one = (): void => {
    const pose = s.cursor.pose()
    s.advance(PER)
    const hit = s.events.slice(seen).some((e) => e.hitsCursor)
    seen = s.events.length
    rows.push(rowOf(s, i++, at, pose, hit))
  }
  for (const k of strokes) {
    const from = { ...at }
    const n = Math.max(1, Math.round(k.seconds * 60))
    for (let j = 1; j <= n; j++) {
      const u = j / n
      const e = u * u * (3 - 2 * u)
      at = { x: from.x + (k.to[0] - from.x) * e, y: from.y + (k.to[1] - from.y) * e }
      Object.assign(d.pointer, { x: at.x, y: at.y })
      one()
    }
    for (let j = 0; j < Math.round(k.rest * 60); j++) one()
  }
  return rows
}

export const table = (rows: Row[]): string => ['frame   time page       ptrX ptrY  tipX tipY    z  speed   lean   spin   turn  dTurn squash state', ...rows.map((r, k) => {
  const dTurn = k > 0 ? r.turn - rows[k - 1]!.turn : 0
  return `${String(r.i).padStart(5)} ${r.time.toFixed(3).padStart(6)} ${r.page.padEnd(9)} ${r.px.toFixed(0).padStart(5)} ${r.py.toFixed(0).padStart(4)} ${r.x.toFixed(0).padStart(5)} ${r.y.toFixed(0).padStart(4)} ${r.z.toFixed(0).padStart(4)} ${r.speed.toFixed(0).padStart(6)} ${r.lean.toFixed(1).padStart(6)} ${r.spin.toFixed(1).padStart(6)} ${r.turn.toFixed(1).padStart(6)} ${dTurn.toFixed(1).padStart(6)}${Math.abs(dTurn) > 12 ? '*' : ' '} ${r.squash.toFixed(2)} ${r.state}${r.hit ? ' HIT' : ''}`
})].join('\n')

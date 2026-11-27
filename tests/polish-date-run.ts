import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { FX, ROWS, rowY, TRAY_H, TRAY_Z } from '../src/pages/step2/layout'
import { filmFlow, filmOptions, ScriptDriver, Stage, StillDriver, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'

// The parts of each machine that stand up out of the tray's floor, and the dial's wheel, which lies in the floor until it rises.
export const BODY: string[][] = [['dial-wheel'], ['slot-cabinet', 'slot-knob', 'slot-payout', 'slot-mount', 'slot-arm'], ['crank-base', 'crank-hub', 'crank-arm', 'crank-grip', 'meter-1', 'meter-10']]
// A part under this share of its full height is not drawn by its maker (`rise` in real/slot-kit.ts).
export const DRAWN = 0.02
// The share of its height at which a machine counts as whole.
export const WHOLE = 0.995

export interface Row { step: number; open: number; phase: string; spring: number; lift: number; tall: number; least: number; most: number; top: number; legends: number }
interface Saved { open: number; phase: string; spring: number[]; lift: number; done: boolean[] }

const saved = (s: Stage): Saved => s.page.save() as Saved

// A visitor who opens the rows in one order and then does what the page asks of the pointer, at once.
export function visitor(order: number[], wait = 0): Driver {
  let idle = 0
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const st = v.page.save() as Saved
      const hint = v.page.hint()
      if (st.open < 0) {
        idle++
        const next = order.find((i) => !st.done[i])
        if (next === undefined) return hint ? { x: hint.x, y: hint.y, down: v.step % 2 === 0 } : { x: 300, y: 900, down: false }
        return { x: FX + 40, y: rowY(next) + 12, down: idle > wait && idle % 2 === 0 }
      }
      idle = 0
      if (!hint) return { x: 300, y: 900, down: false }
      return { x: hint.dodge ? hint.dodge.x : hint.x, y: hint.dodge ? hint.dodge.y : hint.y, down: hint.down }
    }
  }
}

export const still = (): Driver => new StillDriver({ x: 300, y: 900 })

export function heights(): Map<string, number> {
  const s = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: visitor([0, 1, 2]), seed: config.seed })
  const full = new Map<string, number>()
  for (let i = 0; i < 200 * stepHz && s.page.id === 'step2'; i++) {
    s.advance(1)
    const st = saved(s)
    if (st.open < 0 || st.phase !== 'ready') continue
    const list: Shape[] = []
    s.page.draw(list)
    for (const shape of list) if (BODY[st.open]!.includes(shape.id) && !full.has(shape.id)) full.set(shape.id, shape.z1 - shape.z0)
  }
  return full
}

// One row of the table for every step of the page: how far the open row's tray is open and how much of its machine stands in it.
export function visit(driver: Driver | 'film', full: Map<string, number>, seconds = 200): Row[] {
  const s = driver === 'film' ? new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }) : new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed: config.seed })
  const rows: Row[] = []
  for (let i = 0; i < seconds * stepHz && s.page.id === 'step2'; i++) {
    s.advance(1)
    if (s.page.id !== 'step2') break
    const st = saved(s)
    const shown = st.spring.findIndex((v) => v > 0.004)
    if (shown < 0) {
      rows.push({ step: i + 1, open: -1, phase: st.phase, spring: 0, lift: 0, tall: 0, least: 0, most: 0, top: 0, legends: 0 })
      continue
    }
    const list: Shape[] = []
    s.page.draw(list)
    const tray = list.find((shape) => shape.id === `${ROWS[shown]}-tray`)
    const body = BODY[shown]!.map((id) => list.find((x) => x.id === id))
    const shares = body.map((shape) => (shape ? (shape.z1 - shape.z0) / full.get(shape.id)! : 0))
    const top = Math.max(...body.map((shape) => (shape ? shape.z1 : TRAY_Z)))
    const legends = list.filter((x) => x.kind === 'text' && x.id.startsWith('reel-') && x.z0 > TRAY_Z).length
    rows.push({ step: i + 1, open: shown, phase: st.phase, spring: st.spring[shown]!, lift: st.lift, tall: tray ? tray.h : 0, least: Math.min(...shares), most: Math.max(...shares), top, legends })
  }
  return rows
}

export interface Opening { row: number; from: number; sliver: number; full: number; first: number; whole: number; ready: number; empty: number; emptyFrom: number; emptyTo: number }

// The openings of a visit. `open` is the share of the tray's height past which it is more than a sliver.
export function openings(rows: Row[], open: number): Opening[] {
  const out: Opening[] = []
  for (let n = 0; n < rows.length; n++) {
    const r = rows[n]!
    if (r.phase !== 'opening' || (n > 0 && rows[n - 1]!.phase === 'opening')) continue
    let end = n
    while (end < rows.length && rows[end]!.phase === 'opening') end++
    const span = rows.slice(n, Math.min(rows.length, end + 1))
    const at = (test: (x: Row) => boolean): number => span.find(test)?.step ?? -1
    const bare = span.filter((x) => x.tall > open * TRAY_H && x.least <= DRAWN)
    out.push({
      row: r.open >= 0 ? r.open : span.find((x) => x.open >= 0)!.open,
      from: r.step,
      sliver: at((x) => x.tall > open * TRAY_H),
      full: at((x) => x.tall >= TRAY_H - 1),
      first: at((x) => x.most > DRAWN),
      whole: at((x) => x.least >= WHOLE),
      ready: at((x) => x.phase === 'ready'),
      empty: bare.length,
      emptyFrom: bare[0]?.step ?? -1,
      emptyTo: bare.at(-1)?.step ?? -1
    })
  }
  return out
}

// The steps of a visit on which a tray is open by more than `open` of its height while a part of its machine is not drawn, counted by row and by what the row was doing.
export function bare(rows: Row[], open: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) {
    if (r.open < 0 || r.tall <= open * TRAY_H || r.least > DRAWN) continue
    const key = `row ${r.open + 1} ${r.phase}`
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

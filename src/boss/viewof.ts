import type { FinishInput } from './finish/acting'
import { smooth } from './body'
import { blastLine, cornerAt, cursorCentre, muzzle, newFight, SPARK_SECONDS, weakSide, type Fight } from './fight'
import { COLLAPSE_SECONDS, DART, FALLEN, HOME, SOCKET, UNFOLD } from './plan'
import { ringReaches } from './rise'
import { BIG, CORNER, FLAT, GUARD, GUN } from './tune'
import type { BossView, ViewCorner, ViewGun, ViewLast, ViewPhase } from './view'

// What the page knows when it fills the view. `clock` runs from the page's first step of the break-out; `base` is that clock at the fight's first step and `fell` at the boss's fall, each -1 until then.
export interface ViewInput { clock: number; unfold: number; fight: Fight | null; base: number; fell: number; pressed: boolean; arrow: { x: number; y: number }; fall?: number; gone?: number; power?: number; arms?: number; charge?: number; blast?: { power: number; since: number } | null; last?: ViewLast | null; close?: number; pressedFor?: number; scorch?: { x: number; y: number } | null; burst?: { at: number; x: number; y: number } | null }

// The view's clock: 0 at `button-crack`. The body is whole at FORMED, and the fight's own clock starts there.
export const LEAD = UNFOLD.crack
export const FORMED = UNFOLD.end - UNFOLD.crack
// The shares of the forming between which the body travels from the socket to its place on the slab (agreed with the look).
export const TRAVEL = [0.06, 0.34] as const

let now: BossView | null = null
export const viewNow = (): BossView | null => now
export const setView = (v: BossView | null): void => { now = v }

// What the page says to the standing arrow of the power-up and the finish at its last drawing, for the part that draws it and for the arena's beam.
let figure: FinishInput | null = null
export const finishNow = (): FinishInput | null => figure
export const setFinish = (i: FinishInput | null): void => { figure = i }

export function viewOf(i: ViewInput): BossView | null {
  if (i.clock < 0) return null
  const time = i.clock - LEAD
  const f = i.fight
  const b = f ?? newFight()
  const at = (c: number): number | null => (f && c >= 0 ? i.base - LEAD + c : null)
  const formed = f !== null
  const phase: ViewPhase = i.pressed ? 'submitted' : i.fell >= 0 ? 'beaten' : !formed ? 'form' : b.turret < 1 ? 'turret' : 'fight'
  const form = formed ? 1 : Math.min(1, Math.max(0, time / FORMED))
  const go = smooth(Math.min(1, Math.max(0, (form - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0]))))
  const place = formed ? { x: b.x, y: b.y } : { x: SOCKET.x + (HOME.x - SOCKET.x) * go, y: SOCKET.y + (HOME.y - SOCKET.y) * go }
  const c = cursorCentre(i.arrow)
  // The ring of the power-up's burst passes the shield's glass: the glass flashes as it does when a dart glances off it.
  const pass = i.burst ? ringReaches(Math.hypot(place.x - i.burst.x, place.y - i.burst.y) - GUARD.radius) : null
  const passed = i.burst && pass !== null && time >= i.burst.at + pass ? i.burst.at + pass : null
  const gun = (n: 0 | 1): ViewGun => ({ aim: muzzle({ ...b, x: place.x, y: place.y }, n).rot, tell: b.windup >= 0 && b.cannon === n ? Math.min(1, b.windup / GUN.tell) : 0, firedAt: at(b.at.gun[n]) })
  const line = blastLine(b, b.big.a)
  const corner = (n: 0 | 1 | 2 | 3): ViewCorner => {
    const p = cornerAt(n)
    return { id: n, x: p.x, y: p.y, aim: Math.atan2(c.y - p.y, c.x - p.x), tell: b.tell && b.tell.i === n ? Math.min(1, b.tell.t / CORNER.tell) : 0, firedAt: at(b.at.corner[n]) }
  }
  const flatAt = at(b.at.flat)
  return {
    time,
    phase,
    boss: {
      x: place.x, y: place.y, vx: b.speed.x, vy: b.speed.y, heading: b.face, walked: b.walked,
      form,
      turret: i.fell >= 0 ? 0 : b.turret, locked: i.fell < 0 && b.turret >= 1, lockedAt: b.turret >= 1 ? at(BIG.lock) : null,
      health: Math.max(0, b.shown) / 100, stage: b.phase,
      shield: { glancedAt: at(b.at.glance) ?? passed, half: GUARD.cover },
      guns: [gun(0), gun(1)],
      big: b.big.t >= 0 || b.big.beam > 0 ? { tell: b.big.t >= 0 ? Math.min(1, b.big.t / BIG.tell) : 1, aim: b.big.a, firedAt: b.big.t >= 0 ? null : at(b.at.big), x0: line.x0, y0: line.y0, x1: line.x1, y1: line.y1, width: BIG.wide * 2 } : null,
      weak: b.weak > 0 ? { ...weakSide(b), shownAt: at(b.at.weak) } : null,
      healedAt: at(b.at.heal), hitAt: at(b.at.hit),
      beaten: i.fell < 0 ? 0 : Math.min(1, (i.clock - i.fell) / (i.fall ?? COLLAPSE_SECONDS)),
      gone: i.gone ?? 0,
      pressedAt: i.pressedFor !== undefined && i.pressedFor >= 0 ? time - i.pressedFor : null
    },
    bullets: b.balls.map((k) => ({ id: k.n, x: k.x, y: k.y, vx: k.dx * k.v, vy: k.dy * k.v, r: GUN.r, from: k.i === 4 ? 'gun' as const : 'corner' as const })),
    darts: b.darts.filter((d) => d.t >= 0 && (d.dx !== 0 || d.dy !== 0)).map((d) => ({ id: d.n, x: d.x, y: d.y, vx: d.dx * DART.speed, vy: d.dy * DART.speed })),
    hits: b.sparks.filter((k) => k.t < SPARK_SECONDS).map((k) => ({ id: k.n, at: time - k.t, x: k.x, y: k.y, kind: k.k ?? 'round' })),
    corners: [corner(0), corner(1), corner(2), corner(3)],
    arrow: { x: c.x, y: c.y, flat: b.flat > 0 ? 1 : flatAt !== null ? Math.max(0, 1 - (time - flatAt - FLAT.down) / (FLAT.life - FLAT.down)) : 0, flatAt, power: i.power ?? 0, arms: i.arms ?? 0, charge: i.charge ?? 0 },
    breaks: b.breaks.map((k) => ({ id: k.n, at: i.base - LEAD + k.at, x0: k.x0, y0: k.y0, x1: k.x1, y1: k.y1, width: k.width })),
    finish: i.blast ? { x0: c.x, y0: c.y, x1: FALLEN.x, y1: FALLEN.y, power: i.blast.power, firedAt: time - i.blast.since } : null,
    scorch: i.scorch ? { x0: cursorCentre(i.scorch).x, y0: cursorCentre(i.scorch).y, x1: FALLEN.x, y1: FALLEN.y } : null,
    last: i.last ?? null,
    close: i.close ?? 0
  }
}

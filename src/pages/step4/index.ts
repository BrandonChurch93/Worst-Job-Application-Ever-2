import { earlyEnd } from '../../audio/cues'
import { config } from '../../config'
import { collapseRig, drawRig, drawRim, drawSmoke, drawSocket, fightRig, label, restRig, unfoldRig, prog, bossPlaceAt, CANNON_FROM, type Rig } from '../../boss/body'
import { bearing, clearSpot, newFight, SPARK_SECONDS, standing, stepFight, threat, turn, type Arena, type Fight } from '../../boss/fight'
import { COLLAPSE_SECONDS, DOUBT_SECONDS, FALLEN, GAG_MAX, HOME, SOCKET, UNFOLD, WAKE_AFTER_TICK } from '../../boss/plan'
import { drawFinish, drawPancake, drawPower, finishHands } from '../../boss/finish'
import { BIG, CAMERA, CHANGE, CLOSE, FINISH, FLAT, GUARD, LAST, LINE6, LINE7, LOOK1_ON, RAISE, SHOUT, SOLID, STANDS, TOP } from '../../boss/tune'
import { ARENA as GROUND } from '../../arena/layout'
import { STANDS as GROUND_STANDS } from '../../arena/solids'
import { FIRE, finishState, kneelSpot, type FinishInput } from '../../boss/finish/acting'
import { ABOVE, facing, feetFor, finishShot, marksOf, underOf, type Shot } from '../../boss/finish/camera'
import { BEAM } from '../../boss/finish/fx'
import { clearSpot as clearOf } from '../../boss/spot'
import { BREAKS, buttonAt, SIZE, WORD, wordAt } from '../../boss/look1/pose'
import { LEAD, setFinish, setView, viewOf } from '../../boss/viewof'
import { drawArena, drawRules, drawTurretOff, drawWeapons } from '../../boss/weapons'
import { frame, toWorld } from '../../stage/camera'
import { drawLayout, type DrawOptions } from '../../shell/layout'
import { SCREEN_H, TYPE } from '../../shell/parts'
import type { CameraPose, DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo } from '../../stage/types'
import { makeLayout } from './layout'
import { makeScript, STAND } from './script'
import { TICK_Z } from './real/verify-card'

const CAP_LANDS = 1.2
const CAP_CLEARS = 0.6
const SAG_AT = 1.7
type StageName = 'verify' | 'unfold' | 'hold' | 'fight' | 'finish' | 'collapse' | 'press'

interface State {
  mode: Mode
  time: number
  stage: StageName
  t: number
  ticked: number
  since: number
  selfTick: boolean
  cracked: boolean
  opened: boolean
  fight: Fight | null
  from: Rig | null
  inSocket: boolean
  pressed: number
  struck: number
  skipping: boolean
  damaged: boolean
  done: boolean
  cue: number
  busy: number
  mad: number
  last: number
  cx: number
  cy: number
  away: number
  clock: number
  base: number
  fell: number
  turned: number
  asked: boolean
  alone: number
  drifted: number
  led: boolean
  px: number
  py: number
  gold: number
  charge: number
  own: boolean
  due: number
  round: number
  fired: number
  lag: number
  shot: number
  blown: boolean
  gainFrom: number
  gainT: number
  fig: { x: number; y: number } | null
  fin: Record<'power' | 'arms' | 'charge' | 'thrust' | 'fire' | 'walk' | 'kneel' | 'fist', number> & { walked: number; pace: number; x: number; y: number; tx: number; ty: number; held: boolean }
  dash: number
  close: number
  burn: { x: number; y: number } | null
  end: { phase: 'walk' | 'kneel' | 'fist' | 'blow' | 'pressed'; t: number; idle: number; go: boolean; want: boolean; alone: boolean; px: number; py: number } | null
}

const heights = config.scale.heights
const REALLY = [0.56, 1.64] as const
const REALLY_TAKE = 0.04
const HORROR = { thrown: UNFOLD.crack + 0.06, start: UNFOLD.open + 0.04, scared: UNFOLD.legs[0] } as const
const PRIDE = 1.2
const SQUARE_UP = 0.8
const SHAKE = 1.2
const LOOKS = { first: [0.56, 0.9], second: [1.12, 1.64], take: 1.02, at: [-10, -80] } as const
const KICK = { shot: 150, popup: 200 } as const
const RELIEF = { pose: 0.42, hold: 1.5 } as const
const PRESS = { down: 0.03, deep: 12, hold: 0.06, back: 0.07, over: 0.4, ring: 0.5, stand: 16, shove: [7, -10], rock: -0.07 } as const
const TIP_AT_REST = 1.965
const AIM_LIFT = 0.72
const STRUCK_GLOW = 0.14
const HEAL_STEP = 0.7
const GOLD_OUT = 0.4
const GAIN = { from: 25, glow: [1.0, 1.6] } as const
const SEAT = 0.2
const LIFT = 7
const FILL_GAP = 4
const FILL_TOP = 3.4
// The body takes a sixth argument for the shield's flash and the cap's soot once the modeller's body is in; until then it is ignored.
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t)
const easeIn = (t: number): number => t * t
const STAGES = { w: 1920, h: 1080, y: 505, x: [232, 600, 1012, 1580], tuck: 30, reach: 125, crouch: 0.9, side: 54, seated: 0.001 } as const
const PHASE_GAG = ['boss.slabs', 'boss.popups', 'boss.lastStand'] as const
const SPOTS: [number, number][] = [[560, 800], [430, 640], [330, 900], [760, 900], [1150, 940], [1420, 950], [1690, 960]]
const STAND_GRID: [number, number][] = []
for (let y = 220; y <= 1000; y += 130) for (let x = 140; x <= 1780; x += 205) STAND_GRID.push([x, y])
const FORM_OFF = UNFOLD.crack
const BAR = { x: 604, right: 1320, label: 6 } as const
const KEPT = ['health', 'submit', 'defeated', 'fight-type']
const ofHeader = (id: string): boolean => id === 'header-title' || id === 'header-rule' || id.startsWith('progress-')

const fresh = (mode: Mode): State => ({ mode, time: 0, stage: 'verify', t: 0, ticked: -1, since: -1, selfTick: false, cracked: false, opened: false, fight: null, from: null, inSocket: false, pressed: -1, struck: -1, skipping: false, damaged: false, done: false, cue: 0, busy: 0, mad: -1, last: -9, cx: 700, cy: 820, away: 0, turned: -1, asked: false, alone: 0, drifted: 0, led: false, px: 0, py: 0, gold: -1, charge: -1, own: false, due: -1, round: -1, fired: -1, lag: 0, shot: 0, blown: false, gainFrom: 0, gainT: -1, fig: null, fin: { power: -1, arms: -1, charge: -1, thrust: -1, fire: -1, walk: -1, kneel: -1, fist: -1, walked: 0, pace: 0, x: 0, y: 0, tx: 0, ty: 0, held: false }, dash: 0, close: 0, end: null, burn: null, clock: -1, base: -1, fell: -1 })

export function makePage(): PageLogic {
  const L = makeLayout()
  const film = makeScript(L)
  const beats = config.film.beats.filter((b) => b.unit === 'boss')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const arena: Arena = { popups: L.weapons.popups.map((p) => ({ box: p.box, buttons: p.buttons.map((b) => b.box) })) }
  if (LOOK1_ON) arena.walls = GROUND_STANDS.map((w) => ({ id: w.id, kind: w.kind, x0: w.box.x0, y0: w.box.y0, x1: w.box.x1, y1: w.box.y1 }))
  const solidsNow = (): { kind: string; x0: number; y0: number; x1: number; y1: number }[] => (arena.walls ? arena.walls.filter((w) => !(s.fight?.fallen ?? []).includes(w.id)) : standing(s.fight ?? NONE))
  let s = fresh('live')
  const kept = new Set<string>([L.tree.id])
  const keepAll = (n: { id: string; children?: unknown[] }): void => {
    kept.add(n.id)
    for (const c of (n.children ?? []) as { id: string; children?: unknown[] }[]) keepAll(c)
  }
  for (const c of L.tree.children ?? []) if (KEPT.includes(c.id)) keepAll(c)
  const gone = (): number => easeOut(Math.min(1, Math.max(0, s.away)))
  const barLift = (): number => (TOP.bar - L.track.y) * gone()
  const labelBox = L.tree.children!.find((c) => c.id === 'health')!.children![0]!.box
  const barShift = (): number => (BAR.x - labelBox[0]!) * gone()
  const barTrack = (): { x: number; w: number } => {
    const x = L.track.x + barShift()
    return { x, w: L.track.w + (BAR.right - (L.track.x + BAR.x - labelBox[0]!) - L.track.w) * gone() }
  }

  const BLAST = SHOUT.gone - SHOUT.fire
  const steps = (held: number): number => SHOUT.beats.filter((b) => b - SHOUT.beats[0]! <= held + 1e-6).length / SHOUT.beats.length
  const gone2 = (): number => (s.blown ? 1 : s.stage === 'finish' && s.fired >= 0 ? Math.min(1, Math.max(0, (s.fired - s.lag) / (BLAST - s.lag))) : 0)
  const power = (): number => (s.gold < 0 ? 0 : Math.min(1, s.gold / LINE7.glow))
  const arms = (): number => {
    if (s.stage !== 'finish') return 0
    if (s.fired >= BLAST) return 1 - prog(s.fired, BLAST, BLAST + FINISH.settle * 0.5)
    return prog(s.t, FINISH.fall + SHOUT.arms, FINISH.fall + SHOUT.arms + FINISH.arms)
  }
  const WHOLE = SHOUT.fire - SHOUT.beats[0]!
  const level = (held: number): number => FINISH.steady * Math.min(1, held / WHOLE) + (1 - FINISH.steady) * steps(held)
  const armsOut = (): boolean => (s.stage === 'finish' && s.t >= FINISH.fall + SHOUT.arms && s.fired < BLAST) || fist() !== null
  const charged = (): number => (s.stage !== 'finish' || s.charge < 0 ? 0 : s.fired >= BLAST ? 0 : s.fired >= 0 ? s.shot : level(s.charge))
  const KNEEL = LOOK1_ON ? kneelSpot({ x: FALLEN.x, y: FALLEN.y, w: SIZE.button.w }) : { x: FALLEN.x - LAST.reach, y: FALLEN.y }
  const near = (): { x: number; y: number; z: number } => {
    const k = s.close * s.close * (3 - 2 * s.close)
    const w = 1920 + (CLOSE.w - 1920) * k
    return { x: 960 + (CLOSE.x + CLOSE.w / 2 - 960) * k, y: 540 + (CLOSE.y + CLOSE.h / 2 - 540) * k, z: 1920 / w }
  }
  const ground = (p: { x: number; y: number }): { x: number; y: number } => {
    const n = near()
    return { x: n.x + (p.x - 960) / n.z, y: n.y + (p.y - 540) / n.z }
  }
  const screen = (p: { x: number; y: number }): { x: number; y: number } => {
    const n = near()
    return { x: 960 + (p.x - n.x) * n.z, y: 540 + (p.y - n.y) * n.z }
  }
  const walk = (to: { x: number; y: number }, speed: number, dt: number): boolean => {
    const f = s.fig!
    const d = Math.hypot(to.x - f.x, to.y - f.y)
    const step = speed * dt
    s.fin.pace = d > 0.01 ? 1 : 0
    s.fin.walked += Math.min(d, step)
    if (d <= step) {
      f.x = to.x
      f.y = to.y
      return true
    }
    f.x += ((to.x - f.x) / d) * step
    f.y += ((to.y - f.y) / d) * step
    return false
  }
  // The view's time at which a thing of the power-up or the finish began, kept for the figure that acts it.
  const stamp = (k: 'power' | 'arms' | 'charge' | 'thrust' | 'fire' | 'walk' | 'kneel' | 'fist'): void => {
    if (s.fin[k] < 0) s.fin[k] = s.clock - LEAD
  }
  const mark = (v: number): number | undefined => (v < 0 ? undefined : v)
  // What the standing arrow is told: the look's figure of the power-up and of the finish stands in the arrow's place for as long as it is up.
  const RAISED = LINE7.part2 - LINE7.power - RAISE.early
  const raising = (): number => (s.fin.power < 0 || s.fin.arms >= 0 || s.clock - LEAD - s.fin.power >= RAISED ? -1 : s.clock - LEAD - s.fin.power)
  const ease = (u: number): number => {
    const k = Math.min(1, Math.max(0, u))
    return k * k * (3 - 2 * k)
  }
  const spot = (r: number): { x: number; y: number } => {
    const k = ease(r / RAISE.near)
    return { x: s.fin.x + (s.fin.tx - s.fin.x) * k, y: s.fin.y + (s.fin.ty - s.fin.y) * k }
  }
  const closer = (): { x: number; y: number; z: number } | null => {
    const r = raising()
    if (!LOOK1_ON || r < 0 || r >= RAISE.back[1]) return null
    const k = r < RAISE.back[0] ? ease(r / RAISE.near) : 1 - ease((r - RAISE.back[0]) / (RAISE.back[1] - RAISE.back[0]))
    const z = 1 + (RAISE.zoom - 1) * k
    const at = spot(r)
    const w = 1920 / z
    const h = 1080 / z
    const cx = Math.min(1920 - w / 2, Math.max(w / 2, at.x + (RAISE.box.x0 + RAISE.box.x1) / 2))
    const cy = Math.min(1080 - h / 2, Math.max(h / 2, at.y + (RAISE.box.y0 + RAISE.box.y1) / 2))
    return { x: 960 + (cx - 960) * k, y: 540 + (cy - 540) * k, z }
  }
  const shotNow = (): Shot | null => {
    if (!LOOK1_ON || s.inSocket || s.clock < 0) return null
    if (s.fin.arms >= 0) return finishShot(s.clock - LEAD, marksOf(s.mode === 'film', s.fin.arms, s.round >= 0 ? s.round : s.fin.thrust, s.fin.fire))
    if (!CAMERA.powerUp) return null
    const c = closer()
    const r = raising()
    if (!c || r < 0) return null
    const at = feetFor(spot(r))
    return facing({ ...ABOVE, at: toWorld(c.x, c.y, 0), tall: 1080 / c.z }, toWorld(at.x, at.y, 0), (c.z - 1) / (RAISE.zoom - 1))
  }
  const figure = (): FinishInput | null => {
    const v = view()
    const low = shotNow()
    const r = raising()
    if (!LOOK1_ON || !v || (r < 0 && s.fin.arms < 0)) return null
    const m = s.fin
    const b = buttonAt(v)
    const under = m.arms < 0 ? 0 : underOf(s.clock - LEAD, marksOf(s.mode === 'film', m.arms, s.round >= 0 ? s.round : m.thrust, m.fire))
    return {
      time: v.time,
      arrow: r < 0 ? { x: s.cx, y: s.cy } : spot(r),
      power: r < 0 ? null : { at: m.power, until: m.power + RAISED },
      marks: { arms: mark(m.arms), charge: mark(m.charge), thrust: mark(m.thrust), fire: mark(m.fire), end: m.fire < 0 ? undefined : m.fire + BLAST, walk: mark(m.walk), kneel: mark(m.kneel), fist: mark(m.fist), press: m.fist < 0 ? undefined : m.fist + LAST.fist + LAST.blow },
      charge: s.charge < 0 ? 0 : level(s.charge),
      shot: s.shot,
      walk: s.end && s.fig ? { x: s.fig.x, y: s.fig.y, walked: m.walked, pace: s.end.phase === 'walk' ? m.pace : 0 } : null,
      button: { x: b.x, y: b.y, w: b.w, h: b.h, top: b.top },
      ...(low && low.low > 0 ? { tip: low.tip, low: low.low, eye: low.pose.eye, glare: low.glare } : {}),
      ...(under > 0 ? { under } : {})
    }
  }
  const stands = (): boolean => {
    const i = figure()
    return i !== null && finishState(i).up
  }
  const fist = (): [{ x: number; y: number; z: number }, { x: number; y: number; z: number }] | null => {
    const e = s.end
    if (!e || !s.fig || e.phase === 'walk' || e.phase === 'kneel') return null
    const from = { x: s.fig.x + 30, y: s.fig.y + 20, z: 30 }
    const up = { x: s.fig.x + 26, y: s.fig.y - 84, z: 120 }
    const hit = { x: FALLEN.x - 60, y: FALLEN.y, z: 30 }
    const k = e.phase === 'fist' ? prog(e.t, 0, LAST.fist) : 1
    const down = e.phase === 'blow' ? prog(e.t, 0, LAST.blow) ** 2 : e.phase === 'pressed' ? 1 : 0
    const mix = (a: number, b: number, u: number): number => a + (b - a) * u
    const raised = { x: mix(from.x, up.x, k), y: mix(from.y, up.y, k), z: mix(from.z, up.z, k) }
    return [{ x: s.fig.x - 34, y: s.fig.y + 30, z: 30 }, { x: mix(raised.x, hit.x, down), y: mix(raised.y, hit.y, down), z: mix(raised.z, hit.z, down) }]
  }
  const strip = (rig: Rig, k: number): Rig => ({ ...rig, plate: { ...rig.plate, k: rig.plate.k * k }, sides: rig.sides.map((q) => ({ ...q, k: q.k * k })), legs: rig.legs.map((q) => ({ ...q, k: q.k * k })), cannons: rig.cannons.map((q) => ({ ...q, k: q.k * k })), shield: { ...rig.shield, k: rig.shield.k * k } })
  const raised = (): number => (s.clock < 0 || s.inSocket ? 0 : prog(s.clock, UNFOLD.crack + SOLID.rise[0], UNFOLD.crack + SOLID.rise[1]))
  const NONE = { breaks: [], fallen: [] as string[] }
  const view = (): ReturnType<typeof viewOf> => (s.inSocket ? null : viewOf({ clock: s.clock, unfold: s.stage === 'unfold' ? s.t : UNFOLD.end, fight: s.fight, base: s.base, fell: s.fell, pressed: s.pressed >= 0, arrow: { x: s.cx, y: s.cy }, fall: s.stage === 'collapse' || (s.stage === 'press' && !s.blown) ? COLLAPSE_SECONDS : FINISH.fall, gone: gone2(), power: power(), arms: arms(), charge: charged(), blast: s.stage === 'finish' && s.fired >= s.lag && s.fired < BLAST ? { power: s.shot, since: s.fired - s.lag } : null, last: s.end && s.fig ? { phase: s.end.phase, since: s.end.t, x: s.fig.x, y: s.fig.y, to: { x: FALLEN.x, y: FALLEN.y }, led: !s.end.go } : null, close: s.close, pressedFor: s.end ? s.pressed : -1, scorch: s.burn }))
  const inBox = (b: { x: number; y: number; w: number; h: number }, p: { x: number; y: number }, grow = 0): boolean => p.x >= b.x - grow && p.x <= b.x + b.w + grow && p.y >= b.y - grow && p.y <= b.y + b.h + grow
  const fallenBox = { x: FALLEN.x - 150, y: FALLEN.y - 62, w: 300, h: 124 }
  const wake = (): number => (s.mode === 'film' ? Math.max(WAKE_AFTER_TICK.film, LINE6.after - UNFOLD.end) : s.selfTick ? WAKE_AFTER_TICK.near : WAKE_AFTER_TICK.live)
  const card = (): string => {
    if (s.ticked < 0.3) return 'rest'
    if (s.mode === 'film') return 'confirmed-film'
    return s.ticked < 0.3 + DOUBT_SECONDS ? 'doubt' : 'confirmed-live'
  }
  const shut = (): number => L.fold * (1 - (s.ticked < 0 ? 0 : prog(s.ticked, 0.02, 0.3)))
  const feetOf = (f: Fight): { x: number; y: number; z: number }[] => f.feet.map((foot) => ({ x: foot.x, y: foot.y, z: foot.t >= 0 ? Math.sin(Math.PI * Math.min(1, foot.t)) * 16 : 0 }))
  const rigNow = (): Rig | null => {
    if (s.stage === 'unfold') return unfoldRig(s.t)
    if ((s.stage === 'fight' || s.stage === 'hold') && s.fight) {
      const f = s.fight
      const rig = fightRig(f.x, f.y, feetOf(f), f.recoil, Math.sin(f.clock * 7) * 1.6, { aim: f.look, flash: Math.max(0, f.flash) / 0.12, hurt: 1 - f.shown / 100 })
      rig.shield.x = f.x + Math.cos(f.face) * GUARD.radius
      rig.shield.y = f.y + Math.sin(f.face) * GUARD.radius
      rig.shield.rot = f.face - Math.PI
      return rig
    }
    if (s.stage === 'collapse' && s.from) return collapseRig(s.from, s.t)
    if (s.stage === 'finish' && s.from) return strip(collapseRig(s.from, Math.min(1, s.t / FINISH.fall) * COLLAPSE_SECONDS), 1 - gone2())
    if (s.stage === 'press' && s.from) return strip(collapseRig(s.from, COLLAPSE_SECONDS), s.blown ? 0 : 1)
    return null
  }
  const sunk = (): number => {
    if (s.pressed < 0) return 0
    const lets = s.pressed - PRESS.hold
    if (lets <= 0) return prog(s.pressed, 0, PRESS.down)
    const u = lets / PRESS.back
    if (u < 1) return 1 - u
    return u < 1 + PRESS.ring ? -PRESS.over * Math.sin((Math.PI * (u - 1)) / PRESS.ring) : 0
  }
  const groundAt = (x: number, y: number): number => {
    const p = { x, y }
    let z = s.away < 0.5 && inBox({ x: L.card.x, y: L.card.y, w: L.card.w, h: L.card.h - shut() }, p) ? heights.card : 0
    if ((s.stage === 'verify' || s.inSocket) && inBox(L.cap, p)) z = heights.button
    if (s.stage === 'press' && !s.inSocket && inBox(fallenBox, p, -24)) z = PRESS.stand - PRESS.deep * sunk()
    if (raised() >= 1) {
      for (const w of solidsNow()) if (p.x >= w.x0 && p.x <= w.x1 && p.y >= w.y0 && p.y <= w.y1) z = Math.max(z, w.kind === 'pane' ? SOLID.tall.pane : SOLID.tall.pillar)
    }
    if (s.stage === 'fight' && s.fight) {
      for (const up of s.fight.popups) if (up.closing < 0 && up.t > 0.14 && inBox(L.weapons.popups[up.slot]!.box, p)) z = Math.max(z, heights.card)
    }
    return z
  }
  const aimAt = (io: StepIo, eye: { x: number; y: number }): void => {
    const to = TIP_AT_REST - AIM_LIFT - Math.atan2(io.cursor.y - eye.y, eye.x - io.cursor.x)
    io.cursor.aim(Math.atan2(Math.sin(to), Math.cos(to)))
  }
  const letGo = (io: StepIo): void => {
    if (s.led) io.cursor.release()
    s.led = false
  }
  const toCollapse = (io: StepIo, from: Rig, blast = false): void => {
    letGo(io)
    s.from = from
    s.fell = s.clock
    s.stage = blast ? 'finish' : 'collapse'
    s.t = 0
    if (s.fight) {
      s.fight.over = true
      s.fight.health = 0
      s.fight.balls = []
      s.fight.popups = []
      s.fight.darts = []
      s.fight.sparks = []
      s.fight.flashes = []
    }
    io.emit('power-down', from.cap.x, from.cap.y, false)
    io.emit('turret-off', from.cap.x, from.cap.y, false)
    io.cursor.heal()
    if (blast) {
      io.emit('boss-fall', from.cap.x, from.cap.y, false)
      io.cursor.act('angry')
      s.fig = { x: io.cursor.x, y: io.cursor.y }
      s.dash = Math.hypot(LAST.stand[0] - s.fig.x, LAST.stand[1] - s.fig.y) / FINISH.fall
      return
    }
    io.cursor.hurt('scorched')
    io.cursor.act('plain')
    io.cursor.aim(null)
  }

  const lead = (io: StepIo): void => {
    if (!s.fig) return
    if (!io.cursor.taken) io.cursor.take('boss')
    io.cursor.drive(s.fig.x, s.fig.y)
  }
  const last = (io: StepIo): void => {
    const e = s.end!
    const dt = io.dt
    const press = (): void => {
      e.phase = 'pressed'
      e.t = 0
      s.pressed = 0
      io.emit('finish-press', FALLEN.x, FALLEN.y, false)
      io.emit('button-press', FALLEN.x, FALLEN.y, false)
    }
    if (e.phase === 'pressed') {
      e.t += dt
      s.pressed += dt
      if (s.pressed >= (s.mode === 'film' ? LAST.hold : LAST.held)) {
        s.done = true
        io.cursor.release()
      }
      return
    }
    if (s.skipping && s.blown) {
      press()
      return
    }
    if (e.phase === 'walk') {
      const waited = e.t >= 0
      e.t += dt
      if (e.t < 0) return
      if (!waited) {
        io.emit('finish-walk', io.cursor.x, io.cursor.y, false)
        const now = figure()
        if (now) s.fig = { ...finishState(now).feet }
        s.fin.walked = 0
        stamp('walk')
      }
      const at = ground(io.pointer)
      if (!e.go) {
        const moved = Math.hypot(io.pointer.x - e.px, io.pointer.y - e.py) > 2
        e.idle = moved || io.pointer.down ? 0 : e.idle + dt
        e.px = io.pointer.x
        e.py = io.pointer.y
        if (io.pressed && inBox(fallenBox, at, 4)) e.want = true
        if (moved || io.pointer.down) e.alone = false
        else if (e.idle >= LAST.alone && !e.alone) {
          e.alone = true
          s.dash = Math.max(LAST.speed, Math.hypot(KNEEL.x - s.fig!.x, KNEEL.y - s.fig!.y) / LAST.most)
        }
        if (e.t >= LAST.led) {
          e.go = true
          s.dash = Math.max(LAST.speed, Math.hypot(KNEEL.x - s.fig!.x, KNEEL.y - s.fig!.y) / LAST.most)
        }
      } else if (!waited) s.dash = LAST.speed
      const sure = e.go || e.alone
      const home = sure || inBox(fallenBox, at, LAST.reach - fallenBox.w / 2)
      const to = home ? KNEEL : { x: Math.min(CLOSE.x + CLOSE.w - CLOSE.edge, Math.max(CLOSE.x + CLOSE.edge, at.x)), y: Math.min(CLOSE.y + CLOSE.h - CLOSE.edge, Math.max(CLOSE.y + CLOSE.edge, at.y)) }
      const there = walk(to, sure ? s.dash : LAST.speed, dt)
      if (home && (sure || e.want) && there && s.blown) {
        e.go = true
        e.phase = 'kneel'
        e.t = 0
        io.emit('finish-kneel', KNEEL.x, KNEEL.y, false)
        stamp('kneel')
        io.cursor.aim(0)
      }
      return
    }
    e.t += dt
    if (e.phase === 'kneel' && e.t >= LAST.knees + (s.mode === 'film' ? LAST.breath : LAST.pause)) {
      e.phase = 'fist'
      e.t = 0
      io.emit('finish-fist', KNEEL.x, KNEEL.y, false)
      stamp('fist')
    } else if (e.phase === 'fist' && e.t >= LAST.fist) {
      e.phase = 'blow'
      e.t = 0
    } else if (e.phase === 'blow' && e.t >= LAST.blow) press()
    const hands = fist()
    if (hands && !LOOK1_ON) io.cursor.setArms(true, hands)
  }

  const page: PageLogic = {
    id: 'step4', unit: 'boss', width: 1920, height: SCREEN_H, layout: L.tree, gags, start: { x: 700, y: 820 }, control: 'pointer',
    reset(ctx: PageContext) {
      s = fresh(ctx.mode)
    },
    step(io: StepIo) {
      const dt = io.dt
      s.time = io.time
      s.t += dt
      s.damaged = io.cursor.damaged
      s.cx = io.cursor.x
      s.cy = io.cursor.y
      if (s.mode === 'film') {
        while (s.cue < film.reactions.length && s.time >= film.reactions[s.cue]!.at) io.cursor.react(film.reactions[s.cue++]!.name)
      }
      if (s.clock >= 0) {
        const was = s.clock - UNFOLD.crack
        s.clock += dt
        const now = s.clock - UNFOLD.crack
        for (const [name, at] of [['arena-split', CHANGE.split], ['arena-rise', CHANGE.rise], ['healthbar-drop', CHANGE.bar]] as const) if (now >= at && was < at && !s.inSocket) io.emit(name, SOCKET.x, SOCKET.y, false)
      }
      const off = s.cracked && !s.inSocket && s.stage !== 'verify'
      s.away = Math.min(1, Math.max(0, s.away + ((off ? 1 : -1) * dt) / TOP.move))
      if (s.fight && s.stage !== 'fight') s.fight.shown += (s.fight.health - s.fight.shown) * Math.min(1, dt * 12)
      if (s.skipping && (s.stage === 'verify' || (s.stage === 'unfold' && s.t < UNFOLD.crack))) {
        s.inSocket = true
        s.stage = 'press'
        s.t = 0
        io.cursor.act('plain')
      } else if (s.skipping && s.stage === 'unfold') toCollapse(io, unfoldRig(s.t))
      else if (s.skipping && (s.stage === 'fight' || s.stage === 'hold')) toCollapse(io, rigNow()!)
      if (s.gold >= 0) s.gold += dt
      if (s.gainT >= 0) s.gainT += dt
      if (s.since >= 0) s.since += dt

      if (s.stage === 'verify') {
        if (s.ticked < 0) {
          const self = s.t >= GAG_MAX
          if ((io.pressed && inBox(L.checkRow, io.pointer, 8)) || self) {
            s.ticked = 0
            s.since = 0
            s.selfTick = self
            io.emit('checkbox', L.checkbox.cx, L.checkbox.cy, false)
            io.cursor.act(self ? 'plain' : 'proud')
          } else io.cursor.act(Math.hypot(io.pointer.x - L.checkbox.cx, io.pointer.y - L.checkbox.cy) < STAND.near ? 'nervous' : 'plain')
        } else {
          s.ticked += dt
          if (!s.selfTick && s.ticked >= PRIDE && s.ticked - dt < PRIDE) io.cursor.act('confident')
          const near = s.mode === 'live' && s.ticked >= WAKE_AFTER_TICK.near && (inBox(L.cap, io.pointer, 70) || inBox(L.cap, io.cursor, 70))
          if (s.ticked >= wake() || near) {
            s.stage = 'unfold'
            s.t = 0
            s.clock = 0
          }
        }
      } else if (s.stage === 'unfold') {
        if (!s.cracked && s.t >= UNFOLD.crack) {
          s.cracked = true
          io.emit('button-crack', SOCKET.x, SOCKET.y, false)
          io.cursor.act('shocked')
        }
        if (s.t >= HORROR.thrown && s.t - dt < HORROR.thrown) io.cursor.react('recoil')
        if (!s.opened && s.t >= UNFOLD.open) {
          s.opened = true
          const at = bossPlaceAt(s.t)
          io.emit('unfold', at.x, at.y, false)
        }
        if (s.t >= HORROR.start && s.t - dt < HORROR.start) io.cursor.react('startle')
        if (s.t >= HORROR.scared && s.t < UNFOLD.end) io.cursor.act('scared')
        if (s.t >= UNFOLD.end) {
          s.fight = newFight(HOME.x, HOME.y)
          s.base = s.clock
          io.emit('boss-formed', HOME.x, HOME.y, false)
          s.stage = 'hold'
          s.t = 0
          s.px = io.pointer.x
          s.py = io.pointer.y
        }
      } else if (s.stage === 'hold' && s.fight && s.since < LINE6.after - 1e-6) {
        if (s.mode === 'live' && io.pressed) s.asked = true
        s.t = 0
        s.px = io.pointer.x
        s.py = io.pointer.y
      } else if (s.stage === 'hold' && s.fight) {
        const was = s.t - dt
        const stirred = Math.hypot(io.pointer.x - s.px, io.pointer.y - s.py) > 0.5 || io.pointer.down
        s.px = io.pointer.x
        s.py = io.pointer.y
        s.alone = stirred ? 0 : s.alone + dt
        if (s.mode === 'live' && io.pressed) s.asked = true
        if (s.turned < 0 && ((s.asked && s.t >= LINE7.lead - 1e-6) || s.t >= LINE7.part0)) {
          s.turned = earlyEnd(LINE7.ends, LINE7.sentences, s.t)
          io.emit('boss-turn', io.cursor.x, io.cursor.y, false)
        }
        const one = s.turned >= 0 ? s.turned + LINE7.gap : Infinity
        const two = one + LINE7.part1 + LINE7.gap
        const at = (t: number): boolean => s.t >= t && was < t
        if (s.t < one) {
          const droop = s.mode === 'film' || s.alone >= LINE7.alone
          io.cursor.act(droop ? 'exhausted' : 'plain')
          if (droop) aimAt(io, { x: LINE7.to[0], y: LINE7.to[1] })
          else io.cursor.aim(null)
          if (s.mode === 'live' && droop && s.turned < 0 && s.drifted < LINE7.most) {
            if (!s.led) {
              io.cursor.take('boss')
              s.led = true
            }
            s.drifted += dt
            const d = Math.hypot(LINE7.to[0] - io.cursor.x, LINE7.to[1] - io.cursor.y) || 1
            io.cursor.drive(io.cursor.x + ((LINE7.to[0] - io.cursor.x) / d) * LINE7.drift, io.cursor.y + ((LINE7.to[1] - io.cursor.y) / d) * LINE7.drift)
          } else letGo(io)
        } else {
          letGo(io)
          if (at(one)) {
            io.cursor.act('plain')
            io.cursor.aim(null)
          }
          if (at(one + LINE7.music)) io.emit('boss-music', io.cursor.x, io.cursor.y, false)
          if (at(two)) {
            io.cursor.act('confident')
            io.cursor.react('snap')
          }
          if (s.t >= two) aimAt(io, s.fight)
          if (at(two + LINE7.power)) {
            s.gold = 0
            io.emit('power-up', io.cursor.x, io.cursor.y, false)
            stamp('power')
            s.fin.x = io.cursor.x
            s.fin.y = io.cursor.y
            const to = LOOK1_ON && s.mode === 'live' ? clearOf({ x: s.fin.x, y: s.fin.y }) : { x: s.fin.x, y: s.fin.y }
            s.fin.tx = to.x
            s.fin.ty = to.y
            io.cursor.act('angry')
          }
          if (s.t >= two + LINE7.part2 - BIG.lock) {
            s.base = s.clock
            s.stage = 'fight'
            s.t = 0
          }
        }
      } else if (s.stage === 'fight' && s.fight) {
        const f = s.fight
        const before = f.phase
        const hits = f.hits
        const ups = f.popupCount
        const health = f.health
        stepFight(f, io, arena, LOOK1_ON && f.turret < 1)
        if (f.health < health) s.struck = 0
        else if (s.struck >= 0) s.struck += dt
        if (f.health > health + 0.01 && !(f.phase === 2 && f.expired >= 0 && f.expired < GAIN.glow[1])) {
          s.gainFrom = health
          s.gainT = 0
        }
        s.busy = Math.max(0, s.busy - dt)
        const calm = (): void => { io.cursor.act(f.phase === 0 ? 'confident' : 'angry') }
        if (f.hits > hits) {
          s.busy = SHAKE
          s.mad = -1
          io.cursor.act('shocked')
        } else if (s.busy > 0 && s.busy - dt <= 0 && !(f.phase === 2 && f.expired < REALLY[1])) calm()
        if (f.popupCount > ups && s.busy <= 0) {
          io.cursor.react(f.popupCount === 1 ? 'flinch' : 'fume')
          s.busy = 0.7
        }
        if (io.pressed && !f.over && (!LOOK1_ON || f.turret >= 1)) {
          const dx = f.x - io.cursor.x
          const dy = f.y - io.cursor.y
          const d = Math.hypot(dx, dy) || 1
          io.cursor.knock((-dx / d) * KICK.shot, (-dy / d) * KICK.shot)
          s.last = s.time
        }
        const e = f.phase === 2 ? f.expired : -1
        const atBar = (e >= LOOKS.first[0] && e < LOOKS.first[1]) || (e >= LOOKS.second[0] && e < LOOKS.second[1])
        const eye = atBar ? { x: io.cursor.x + LOOKS.at[0], y: io.cursor.y + LOOKS.at[1] } : f
        aimAt(io, eye)
        if (f.phase !== before) {
          s.t = 0
          s.busy = 0
          if (f.phase === 1) {
            s.mad = 0
            io.cursor.act('proud')
          }
        }
        if (s.mad >= 0) {
          s.mad += dt
          if (s.mad >= SQUARE_UP) {
            s.mad = -1
            io.cursor.act('angry')
            io.cursor.react('fume')
          }
        }
        if (f.phase === 2 && f.expired >= 0) {
          const was = f.expired - io.dt
          if (f.expired >= REALLY_TAKE && was < REALLY_TAKE) {
            io.cursor.react('startle')
            io.cursor.act('shocked')
          }
          if (f.expired >= LOOKS.take && was < LOOKS.take) io.cursor.react('doubleTake')
          if (f.expired >= REALLY[1] && was < REALLY[1]) {
            io.cursor.act('angry')
            io.cursor.react('fume')
          }
        }
        if (f.over) toCollapse(io, rigNow()!, true)
      } else if (s.stage === 'finish') {
        const u = s.t - FINISH.fall
        s.close = Math.min(1, s.close + dt / FINISH.fall)
        if (!s.end) walk({ x: LAST.stand[0], y: LAST.stand[1] }, s.dash, dt)
        lead(io)
        if (u >= SHOUT.arms && u - dt < SHOUT.arms) {
          io.emit('finish-arms', io.cursor.x, io.cursor.y, false)
          stamp('arms')
        }
        if (!s.end) aimAt(io, FALLEN)
        if (s.fired < BLAST && armsOut() && !LOOK1_ON) io.cursor.setArms(true, finishHands(io.cursor, FALLEN, charged(), s.fired >= 0).hands)
        if (s.fired < 0 && u >= SHOUT.arms) {
          const down = io.pointer.down
          const whole = WHOLE
          const had = s.charge < 0 ? 0 : steps(s.charge)
          const fire = (): void => {
            s.shot = Math.max(FINISH.small, s.charge < 0 ? 0 : level(s.charge))
            s.fired = 0
            s.burn = { x: io.cursor.x, y: io.cursor.y }
            s.lag = LOOK1_ON ? FIRE.lead + Math.hypot(FALLEN.x - io.cursor.x, FALLEN.y - io.cursor.y) / BEAM.speed : 0
            io.emit('finish-fire', io.cursor.x, io.cursor.y, false)
            if (s.shot > FINISH.small) stamp('thrust')
            stamp('fire')
            const d = Math.hypot(FALLEN.x - io.cursor.x, FALLEN.y - io.cursor.y) || 1
            io.cursor.knock(((io.cursor.x - FALLEN.x) / d) * KICK.popup * s.shot, ((io.cursor.y - FALLEN.y) / d) * KICK.popup * s.shot)
          }
          if (s.charge < 0) {
            if (down || u >= SHOUT.arms + FINISH.alone - whole) {
              s.charge = 0
              s.own = down
              io.cursor.react('anticipate')
            }
          } else {
            const kept = LOOK1_ON && CAMERA.on && s.mode !== 'film'
            if (s.due < 0 || !s.own) s.charge += dt
            if (s.mode === 'film' ? u >= SHOUT.fire - FIRE.ahead : !kept && !s.own && !down && s.charge >= whole - FIRE.ahead) stamp('thrust')
            if (s.due >= 0) {
              if (u >= s.due - FIRE.ahead && level(s.charge) > FINISH.small) stamp('thrust')
              if (u >= s.due) fire()
            } else if (!s.own && down) s.own = true
            else if (!kept) {
              if (s.own ? !down || s.charge >= whole + FINISH.late : s.charge >= whole) fire()
            } else if (s.own ? !down || s.charge >= whole + FINISH.late : s.charge >= whole - CAMERA.roundLive) {
              s.due = Math.max(u, SHOUT.arms + CAMERA.down[1] + CAMERA.stay) + CAMERA.roundLive
              s.round = s.clock - LEAD + s.due - CAMERA.roundLive - u
            }
          }
          if (s.fired < 0 && s.charge >= 0 && steps(s.charge) > had) {
            io.emit('finish-charge', io.cursor.x, io.cursor.y, false)
            stamp('charge')
          }
        } else if (s.fired >= 0) {
          const was = s.fired
          s.fired += dt
          if (LOOK1_ON) {
            if (s.fired >= FIRE.lead && was < FIRE.lead) io.emit('finish-beam', io.cursor.x, io.cursor.y, false)
            for (const b of BREAKS) if (s.fired - s.lag >= b * (BLAST - s.lag) && was - s.lag < b * (BLAST - s.lag)) io.emit('finish-break', FALLEN.x, FALLEN.y, false)
          }
          if (s.fired >= BLAST && was < BLAST) {
            io.emit('boss-gone', FALLEN.x, FALLEN.y, false)
            io.cursor.act('exhausted')
            io.cursor.aim(null)
            io.cursor.setArms(false)
            s.end = { phase: 'walk', t: -LAST.wait, idle: 0, go: s.mode === 'film', want: false, alone: false, px: io.pointer.x, py: io.pointer.y }
          }
          if (s.end) last(io)
          if (s.fired >= BLAST + FINISH.settle && s.stage === 'finish') {
            io.emit('button-down', FALLEN.x, FALLEN.y, false)
            s.blown = true
            s.stage = 'press'
            s.t = 0
          }
        }
      } else if (s.stage === 'collapse') {
        if (s.t >= COLLAPSE_SECONDS) {
          s.stage = 'press'
          s.t = 0
        } else if (s.t >= SAG_AT && s.t - dt < SAG_AT) io.cursor.act('exhausted')
      } else if (s.stage === 'press' && s.end) {
        lead(io)
        last(io)
      } else if (s.stage === 'press') {
        if (s.pressed < 0) {
          const target = s.inSocket ? L.cap : fallenBox
          const self = s.t >= GAG_MAX || (s.skipping && s.t >= 0.5)
          if ((io.pressed && inBox(target, io.pointer, 4)) || self) {
            s.pressed = 0
            io.emit('button-press', s.inSocket ? SOCKET.x : FALLEN.x, s.inSocket ? SOCKET.y : FALLEN.y, false)
            io.cursor.react('stamp')
          }
        } else {
          s.pressed += dt
          if (s.pressed >= RELIEF.pose && s.pressed - dt < RELIEF.pose) {
            io.cursor.act('proud')
            io.cursor.react('dustOff')
          }
          if (s.pressed >= (s.mode === 'film' ? RELIEF.hold : 0.35) && (!s.damaged || s.mode === 'film')) s.done = true
        }
      }
      io.cursor.setGround(groundAt(io.cursor.x, io.cursor.y))
      if (LOOK1_ON && s.fin.power >= 0 && !s.fig) {
        if (raising() >= 0) {
          if (!io.cursor.taken) io.cursor.take('boss')
          const at = spot(raising())
          io.cursor.drive(at.x, at.y)
          s.fin.held = true
        } else if (s.fin.held) {
          s.fin.held = false
          io.cursor.release()
        }
      }
      if (LOOK1_ON) io.cursor.setOnPage(!stands())
    },
    save: () => JSON.parse(JSON.stringify(s)) as State,
    load(state) {
      s = JSON.parse(JSON.stringify(state)) as State
    },
    draw(out: DrawList) {
      const over: Record<string, Partial<Shape> | null> = { 'fight-type': null }
      const loose = s.stage !== 'verify' && !s.inSocket
      if (loose) over['submit-cap'] = null
      if (s.cracked && !s.inSocket) over.submit = null
      else if (s.pressed >= 0) over['submit-cap'] = { z1: heights.button - heights.keyTravel }
      if (loose) {
        const u = s.stage === 'unfold' ? s.t : UNFOLD.end
        CANNON_FROM.forEach((n, i) => {
          if (u >= UNFOLD.cannons[0] + i * 0.18) over[`progress-${n}`] = null
        })
      }
      if (s.ticked >= 0) over['verify-box'] = { tone: 'accent', v: [s.ticked] }
      const states = page.states()
      const u = s.stage === 'unfold' ? s.t : 9
      const slide = (1 - easeOut(prog(u, UNFOLD.bar[0], UNFOLD.bar[1] - SEAT))) * -1760
      const lift = (1 - easeIn(prog(u, UNFOLD.bar[1] - SEAT, UNFOLD.bar[1]))) * LIFT
      if (lift > 0) {
        const label = L.tree.children!.find((c) => c.id === 'health')!.children![0]!
        over['health-label'] = { x: label.box[0]! + slide, moved: true }
        over['health-track'] = slide !== 0 ? { x: L.track.x + slide, moved: true, pocket: false, v: [lift] } : { moved: true, v: [lift] }
      }
      const options: DrawOptions = { states, over }
      const first = out.length
      drawLayout(out, L.tree, options)
      if (states.includes('fight')) {
        const fine = out.findIndex((shape, i) => i >= first && shape.id === 'verify-fine-open')
        if (fine >= 0) out.splice(fine, 1)
      }
      const open = L.fold - shut()
      for (let i = first; i < out.length; i++) if (out[i]!.id === 'verify-rule') out[i]!.v = [L.rule.w]
      if (open > 0 && states[0] === 'rest') {
        for (let i = first; i < out.length; i++) {
          const shape = out[i]!
          if (shape.id === 'verify-card') {
            shape.h += open
            shape.moved = true
          } else if (shape.id === 'verify-fine') {
            shape.y += open
            shape.moved = true
          }
        }
        out.push({ id: 'verify-rule', part: 'verify-card', kind: 'box', x: L.rule.x, y: L.rule.y, w: L.rule.w * (open / L.fold), h: L.rule.h, z0: heights.card, z1: heights.card + heights.rule, tone: 'metal', moved: true, v: [L.rule.w] })
      }
      if (s.ticked >= 0) {
        const b = L.checkbox
        const k = prog(s.ticked, 0.04, 0.3)
        if (k > 0.01) out.push({ id: 'verify-tick', part: 'verify-card', kind: 'box', x: b.x, y: b.y, w: b.w, h: b.h, z0: TICK_Z, z1: TICK_Z + 0.7, tone: 'inkLight', v: [k, s.ticked] })
      }
      const up = barLift()
      if (s.away > 0) {
        const far = gone() * SCREEN_H
        for (let i = out.length - 1; i >= first; i--) {
          const shape = out[i]!
          if (shape.id.startsWith('health-')) {
            shape.y += up
            if (shape.id === 'health-track') {
              const t = barTrack()
              shape.x = t.x + (shape.x - L.track.x)
              shape.w = t.w
            } else shape.x += barShift()
            shape.moved = true
          } else if (!kept.has(shape.id) && !shape.id.startsWith('submit') && !ofHeader(shape.id)) {
            if (s.away >= 1) out.splice(i, 1)
            else {
              shape.y -= far
              shape.moved = true
            }
          }
        }
      }
      const track = barTrack()
      const fillAt = (w: number): Shape => ({ id: 'health-fill', part: 'health-bar', kind: 'capsule', x: track.x + FILL_GAP + slide, y: L.track.y + FILL_GAP + up, w, h: L.track.h - FILL_GAP * 2, z0: heights.progressRail + lift, z1: FILL_TOP + lift, tone: 'accent', v: [L.track.w - FILL_GAP * 2], moved: lift > 0 || up !== 0 })
      if (states.includes('fight')) {
        const full = track.w - FILL_GAP * 2
        const w = s.fight ? Math.max(0, full * (s.fight.shown / 100)) : full
        if (w >= L.track.h - FILL_GAP * 2) out.push(fillAt(w))
        const f = s.fight
        const h0 = L.track.h - FILL_GAP * 2
        if (f && s.stage === 'fight' && s.struck >= 0 && s.struck < STRUCK_GLOW && w >= h0 && !(f.phase === 2 && f.expired >= 0 && f.expired < GAIN.glow[1])) out.push({ ...fillAt(h0), id: 'health-gain', x: track.x + FILL_GAP + w - h0 * 0.5, z1: FILL_TOP + 0.5, v: [full * 0.16, 1 - s.struck / STRUCK_GLOW] })
        if (f && s.stage === 'fight' && s.gainT >= 0 && s.gainT < HEAL_STEP && w >= h0) {
          const won = Math.max(h0, (full * Math.max(0, f.shown - s.gainFrom)) / 100)
          out.push({ ...fillAt(Math.min(w, won)), id: 'health-gain', x: track.x + FILL_GAP + w - Math.min(w, won), z1: FILL_TOP + 0.5, v: [full * 0.16, 1 - s.gainT / HEAL_STEP] })
        }
        if (f && s.stage === 'fight' && f.phase === 2 && f.expired >= 0 && f.expired < GAIN.glow[1]) {
          const gained = Math.min(w, (full * Math.max(0, f.shown - GAIN.from)) / 100)
          const h = L.track.h - FILL_GAP * 2
          if (gained >= h) out.push({ ...fillAt(gained), id: 'health-gain', x: track.x + FILL_GAP + w - gained, z1: FILL_TOP + 0.5, v: [full * 0.16, 1 - prog(f.expired, GAIN.glow[0], GAIN.glow[1])] })
        }
      }
      if (s.cracked && !s.inSocket) drawSocket(out, SOCKET.x, SOCKET.y, prog(s.stage === 'unfold' ? s.t : 9, UNFOLD.crack, UNFOLD.crack + 0.25), 'socket-open', undefined, s.stage === 'unfold' && s.t < UNFOLD.lift + CAP_CLEARS ? 'dark' : 'ink')
      const v = view()
      const look = LOOK1_ON && v !== null
      const rig = rigNow()
      const give = s.inSocket || s.stage !== 'press' ? 0 : sunk()
      if (rig && !look) drawRig(out, give === 0 ? rig : { ...rig, cap: { ...rig.cap, x: rig.cap.x + PRESS.shove[0] * give, y: rig.cap.y + PRESS.shove[1] * give, rot: rig.cap.rot + PRESS.rock * give } }, 'boss', s.inSocket ? (s.pressed >= 0 ? heights.keyTravel : 0) : PRESS.deep * give)
      setView(v)
      setFinish(figure())
      if (look && v) {
        const whole = { x: 0, y: 0, w: 1920, h: SCREEN_H, z1: 0, tone: 'dark' as const }
        if (v.time >= GROUND.clearAt) out.push({ ...whole, id: 'arena-well', part: 'boss-arena', kind: 'well', z0: -GROUND.wellDepth })
        out.push({ ...whole, id: 'arena', part: 'boss-arena', kind: 'anchor', z0: 0 })
        out.push({ ...whole, id: 'boss-look', part: 'boss-look1', kind: 'anchor', z0: 0 })
        out.push({ ...whole, id: 'finish-figure', part: 'boss-finish', kind: 'anchor', z0: 0 })
        for (let i = out.length - 1; i >= first; i--) if (out[i]!.id.startsWith('health-')) out.splice(i, 1)
        if (v.time >= GROUND.barLands) out.push(label('health-label', 'type', 'copy:step4.bossHealthLabel', GROUND.label.x, GROUND.label.y, { font: GROUND.label.font, px: GROUND.label.px }, 0, 'ink'))
        const w = wordAt(v)
        if (w.show) out.push(label('boss-word', 'boss-body', 'copy:step4.submit', w.x, w.y, WORD as typeof TYPE.button, w.z, 'inkLight', w.rot))
      }
      if (s.clock >= 0 && !s.inSocket && !look) drawArena(out, s.fight ?? NONE, raised())
      if ((s.stage === 'fight' || s.stage === 'hold') && s.fight) {
        drawRules(out, s.fight, look)
        drawWeapons(out, s.fight, L.weapons)
        const f = s.fight
        if (f.at.flat >= 0 && f.mark) drawPancake(out, f.mark.x, f.mark.y, f.clock - f.at.flat)
      }
      const lit = LINE7.part2 - LINE7.power
      if (!look && s.gold >= 0 && s.gold < lit + GOLD_OUT && (s.stage === 'hold' || s.stage === 'fight')) drawPower(out, s.cx, s.cy, power() * (1 - prog(s.gold, lit, lit + GOLD_OUT)))
      if (s.stage === 'finish' && !look) drawFinish(out, finishHands({ x: s.cx, y: s.cy }, FALLEN, charged(), s.fired >= 0).ball, FALLEN, charged(), s.fired >= 0 && s.fired < BLAST ? { power: s.shot, u: s.fired / BLAST } : null)
      if (s.stage === 'collapse' && s.from) {
        const sparks = [0, 1, 2, 3, 4, 5].map((i) => ({ n: 900 + i, x: s.from!.cap.x + [-120, 90, -30, 150, -160, 40][i]!, y: s.from!.cap.y + [-40, 50, 70, -60, 30, -80][i]!, t: s.t - i * 0.1 })).filter((k) => k.t >= 0 && k.t < SPARK_SECONDS)
        if (sparks.length) drawWeapons(out, { ...newFight(), sparks }, L.weapons)
        if (s.fight && !look) drawTurretOff(out, s.from.cap.x, s.from.cap.y, s.fight.face, s.t)
      }
      if ((s.stage === 'collapse' && s.t > CAP_LANDS) || (s.stage === 'finish' && s.t > FINISH.fall) || (s.stage === 'press' && !s.inSocket)) drawSmoke(out, FALLEN.x, FALLEN.y, s.time)
    },
    scroll: () => 0,
    view(): CameraPose | null {
      const low = shotNow()
      if (low) return low.pose
      const c = s.close <= 0 ? closer() : null
      if (c) return frame({ x: c.x - 960 / c.z, y: c.y - 540 / c.z, w: 1920 / c.z, h: 1080 / c.z })
      if (s.close <= 0) return null
      const n = near()
      return frame({ x: n.x - 960 / n.z, y: n.y - 540 / n.z, w: 1920 / n.z, h: 1080 / n.z })
    },
    camera: () => null,
    script: (time: number): Pointer => film.pointer(time),
    chrome: () => ({ header: 1 - gone() }),
    arms: () => !LOOK1_ON && armsOut(),
    led: () => s.fig !== null && !page.ignoring(),
    hint(): Hint | null {
      const blink = Math.floor(s.time * 6) % 2 === 0
      if (s.stage === 'verify' && s.ticked < WAKE_AFTER_TICK.near) return { x: L.checkbox.cx, y: L.checkbox.cy, down: s.ticked < 0 && blink }
      if (s.stage === 'verify') return { x: SOCKET.x, y: SOCKET.y, down: blink }
      if (s.stage === 'unfold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: false }
      if (s.stage === 'hold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: s.turned < 0 && blink }
      if (s.stage === 'finish') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: s.t >= FINISH.fall + SHOUT.arms && s.fired < 0 && blink }
      if (s.stage === 'fight' && s.fight) {
        const f = s.fight
        const near = (list: [number, number][]): [number, number] | null => {
          let best: [number, number] | null = null
          let d = Infinity
          for (const c of list) {
            const k = Math.hypot(c[0] - s.cx, c[1] - s.cy)
            if (k < d) {
              d = k
              best = c
            }
          }
          return best
        }
        const from = (x: number, y: number): number => Math.hypot(x - f.x, y - f.y)
        const reach = (c: [number, number]): boolean => from(c[0], c[1]) >= STANDS.near && from(c[0], c[1]) <= STANDS.far
        const open = (c: [number, number]): boolean => Math.abs(turn(bearing(f, c[0], c[1]) - f.face)) > GUARD.cover + STANDS.margin
        const safe = (c: [number, number]): boolean => !threat(f, arena, c[0], c[1])
        const hot = threat(f, arena, s.cx, s.cy) !== null
        const free = (c: [number, number]): boolean => {
          const dx = c[0] - s.cx
          const dy = c[1] - s.cy
          const u = Math.min(1, Math.max(0, ((f.x - s.cx) * dx + (f.y - s.cy) * dy) / (dx * dx + dy * dy || 1)))
          return Math.hypot(s.cx + dx * u - f.x, s.cy + dy * u - f.y) >= STANDS.round
        }
        const stands = STAND_GRID.filter((c) => reach(c) && safe(c) && free(c))
        const clear = stands.filter((c) => open(c) && clearSpot(f, arena, c[0], c[1]))
        const walled = near(stands.filter(open))
        const handy = near(clear)
        const best = handy && (!walled || Math.hypot(handy[0] - s.cx, handy[1] - s.cy) <= Math.hypot(walled[0] - s.cx, walled[1] - s.cy) + STANDS.detour) ? handy : walled
        if (best) {
          const out: Hint = { x: best[0], y: best[1], down: blink && f.flat <= 0 }
          if (hot) out.dodge = { x: best[0], y: best[1] }
          return out
        }
        let behind: [number, number] | null = null
        let most = -1
        for (const c of stands) {
          const k = Math.abs(turn(bearing(f, c[0], c[1]) - f.face)) - Math.hypot(c[0] - s.cx, c[1] - s.cy) / 2000
          if (k > most) {
            most = k
            behind = c
          }
        }
        const spot = behind ?? near(STAND_GRID.filter(safe)) ?? SPOTS[0]!
        const out: Hint = { x: spot[0], y: spot[1], down: false }
        if (hot) out.dodge = { x: spot[0], y: spot[1] }
        return out
      }
      const at = s.inSocket ? SOCKET : s.end ? screen(FALLEN) : FALLEN
      return { x: at.x, y: at.y, down: s.stage === 'press' && s.pressed < 0 && blink }
    },
    skip() {
      s.skipping = true
    },
    done: () => s.done,
    gag(): string | null {
      if (s.stage === 'verify') return 'boss.verify'
      if (s.stage === 'unfold' || s.stage === 'hold') return 'boss.unfold'
      if (s.stage === 'fight') return PHASE_GAG[s.fight ? s.fight.phase : 0]!
      if (s.stage === 'finish' && s.t >= FINISH.fall + SHOUT.arms) return 'boss.finish'
      if (s.stage === 'collapse' || s.stage === 'finish') return 'boss.collapse'
      return 'boss.press'
    },
    ignoring(): boolean {
      if (s.stage === 'fight') return s.fight !== null && s.fight.flat > 0
      if (!s.fig) return false
      if (s.end) return s.end.go || s.end.phase !== 'walk' || s.end.t < 0
      return s.t < FINISH.fall + SHOUT.arms || s.fired >= 0
    },
    states(): string[] {
      const out = [card()]
      const bar = (s.stage === 'unfold' && s.t >= UNFOLD.bar[0]) || s.stage === 'hold' || s.stage === 'fight' || s.stage === 'finish' || ((s.stage === 'collapse' || s.stage === 'press') && !s.inSocket)
      if (bar) out.push('fight')
      if (s.stage === 'press' && !s.inSocket) out.push('down')
      return out
    },
    sheet(id: string): SheetFrame | null {
      if (id !== 'boss-stages') return null
      const list: DrawList = []
      const [x0, x1, x2, x3] = STAGES.x
      const y = STAGES.y
      drawRim(list, x0, y, STAGES.seated, 'stage-0-socket')
      drawRig(list, restRig(x0, y), 'stage-0')
      drawSocket(list, x1, y + 14, 1, 'stage-1-socket', undefined, 'dark')
      const loose = restRig(x1, y)
      loose.cap.lift = 0.5
      loose.cap.rot = -0.11
      loose.cap.x += 14
      loose.cap.y -= 12
      drawRig(list, loose, 'stage-1')
      drawSocket(list, x2, y, 1, 'stage-2-socket')
      const half = fightRig(x2, y, null)
      half.legs.forEach((l, i) => {
        const sx = i % 2 === 0 ? -1 : 1
        l.fx = l.hx - sx * STAGES.tuck
        l.fy = l.hy + (i < 2 ? -1 : 1) * STAGES.reach
        l.crouch = STAGES.crouch
      })
      half.sides.forEach((side, i) => { side.y = y + (i === 0 ? -1 : 1) * STAGES.side })
      for (const c of half.cannons) c.k = 0
      half.shield.k = 0
      drawRig(list, half, 'stage-2')
      drawRig(list, fightRig(x3, y, null), 'stage-3')
      return { list, cursors: [], view: frame({ x: 0, y: 0, w: STAGES.w, h: STAGES.h }), width: STAGES.w, height: STAGES.h }
    }
  }
  return page
}

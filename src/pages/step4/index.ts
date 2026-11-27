import { config } from '../../config'
import { collapseRig, drawRig, drawRim, drawSmoke, drawSocket, fightRig, restRig, unfoldRig, prog, bossPlaceAt, CANNON_FROM, type Rig } from '../../boss/body'
import { bearing, clearSpot, newFight, SPARK_SECONDS, standing, stepFight, threat, turn, type Arena, type Fight } from '../../boss/fight'
import { COLLAPSE_SECONDS, DOUBT_SECONDS, FALLEN, GAG_MAX, HOME, SOCKET, UNFOLD, WAKE_AFTER_TICK } from '../../boss/plan'
import { drawFinish, drawPancake, drawPower } from '../../boss/finish'
import { BIG, CHANGE, FINISH, FLAT, GUARD, LINE7, SOLID, STANDS, TOP } from '../../boss/tune'
import { setView, viewOf } from '../../boss/viewof'
import { drawArena, drawRules, drawTurretOff, drawWeapons } from '../../boss/weapons'
import { frame } from '../../stage/camera'
import { drawLayout, type DrawOptions } from '../../shell/layout'
import { SCREEN_H } from '../../shell/parts'
import type { DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo } from '../../stage/types'
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
  alone: number
  drifted: number
  led: boolean
  px: number
  py: number
  gold: number
  charge: number
  auto: boolean
  fired: number
  shot: number
  blown: boolean
  gainFrom: number
  gainT: number
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

const fresh = (mode: Mode): State => ({ mode, time: 0, stage: 'verify', t: 0, ticked: -1, selfTick: false, cracked: false, opened: false, fight: null, from: null, inSocket: false, pressed: -1, struck: -1, skipping: false, damaged: false, done: false, cue: 0, busy: 0, mad: -1, last: -9, cx: 700, cy: 820, away: 0, turned: -1, alone: 0, drifted: 0, led: false, px: 0, py: 0, gold: -1, charge: -1, auto: false, fired: -1, shot: 0, blown: false, gainFrom: 0, gainT: -1, clock: -1, base: -1, fell: -1 })

export function makePage(): PageLogic {
  const L = makeLayout()
  const film = makeScript(L)
  const beats = config.film.beats.filter((b) => b.unit === 'boss')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const arena: Arena = { popups: L.weapons.popups.map((p) => ({ box: p.box, buttons: p.buttons.map((b) => b.box) })) }
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

  const gone2 = (): number => (s.blown ? 1 : s.stage === 'finish' && s.fired >= 0 ? Math.min(1, s.fired / FINISH.fire) : 0)
  const power = (): number => (s.gold < 0 ? 0 : Math.min(1, s.gold / LINE7.glow))
  const arms = (): number => {
    if (s.stage !== 'finish') return 0
    if (s.fired >= FINISH.fire) return 1 - prog(s.fired, FINISH.fire, FINISH.fire + FINISH.settle * 0.5)
    return prog(s.t, FINISH.fall, FINISH.fall + FINISH.arms)
  }
  const charged = (): number => (s.stage !== 'finish' || s.charge < 0 ? 0 : s.fired >= 0 ? s.shot : Math.min(1, s.charge / FINISH.full))
  const strip = (rig: Rig, k: number): Rig => ({ ...rig, plate: { ...rig.plate, k: rig.plate.k * k }, sides: rig.sides.map((q) => ({ ...q, k: q.k * k })), legs: rig.legs.map((q) => ({ ...q, k: q.k * k })), cannons: rig.cannons.map((q) => ({ ...q, k: q.k * k })), shield: { ...rig.shield, k: rig.shield.k * k } })
  const raised = (): number => (s.clock < 0 || s.inSocket ? 0 : prog(s.clock, UNFOLD.crack + SOLID.rise[0], UNFOLD.crack + SOLID.rise[1]))
  const NONE = { breaks: [], fallen: [] as string[] }
  const view = (): ReturnType<typeof viewOf> => (s.inSocket ? null : viewOf({ clock: s.clock, unfold: s.stage === 'unfold' ? s.t : UNFOLD.end, fight: s.fight, base: s.base, fell: s.fell, pressed: s.pressed >= 0, arrow: { x: s.cx, y: s.cy }, fall: s.stage === 'collapse' || (s.stage === 'press' && !s.blown) ? COLLAPSE_SECONDS : FINISH.fall, gone: gone2(), power: power(), arms: arms(), charge: charged(), blast: s.stage === 'finish' && s.fired >= 0 && s.fired < FINISH.fire ? { power: s.shot, since: s.fired } : null }))
  const inBox = (b: { x: number; y: number; w: number; h: number }, p: { x: number; y: number }, grow = 0): boolean => p.x >= b.x - grow && p.x <= b.x + b.w + grow && p.y >= b.y - grow && p.y <= b.y + b.h + grow
  const fallenBox = { x: FALLEN.x - 150, y: FALLEN.y - 62, w: 300, h: 124 }
  const wake = (): number => (s.mode === 'film' ? WAKE_AFTER_TICK.film : s.selfTick ? WAKE_AFTER_TICK.near : WAKE_AFTER_TICK.live)
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
      for (const w of standing(s.fight ?? NONE)) if (p.x >= w.x0 && p.x <= w.x1 && p.y >= w.y0 && p.y <= w.y1) z = Math.max(z, w.kind === 'pane' ? SOLID.tall.pane : SOLID.tall.pillar)
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
      return
    }
    io.cursor.hurt('scorched')
    io.cursor.act('plain')
    io.cursor.aim(null)
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

      if (s.stage === 'verify') {
        if (s.ticked < 0) {
          const self = s.t >= GAG_MAX
          if ((io.pressed && inBox(L.checkRow, io.pointer, 8)) || self) {
            s.ticked = 0
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
      } else if (s.stage === 'hold' && s.fight) {
        const was = s.t - dt
        const stirred = Math.hypot(io.pointer.x - s.px, io.pointer.y - s.py) > 0.5 || io.pointer.down
        s.px = io.pointer.x
        s.py = io.pointer.y
        s.alone = stirred ? 0 : s.alone + dt
        if (s.turned < 0 && ((s.mode === 'live' && io.pressed) || s.t >= LINE7.part0)) {
          s.turned = LINE7.ends.find((e) => e >= s.t - 1e-6) ?? LINE7.part0
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
        stepFight(f, io, arena)
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
        if (io.pressed && !f.over) {
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
        const armed = FINISH.fall + FINISH.arms
        if (s.t >= FINISH.fall && s.t - dt < FINISH.fall) io.emit('finish-arms', io.cursor.x, io.cursor.y, false)
        aimAt(io, FALLEN)
        if (s.fired < 0 && s.t >= armed) {
          const down = io.pointer.down
          if (s.charge < 0) {
            if (down || s.t >= armed + FINISH.idle) {
              s.charge = 0
              s.auto = !down
              io.emit('finish-charge', io.cursor.x, io.cursor.y, false)
              io.cursor.react('anticipate')
            }
          } else {
            s.charge += dt
            if (s.auto ? s.charge >= FINISH.full : !down || s.charge >= FINISH.charge) {
              s.shot = Math.max(FINISH.small, Math.min(1, s.charge / FINISH.full))
              s.fired = 0
              io.emit('finish-fire', io.cursor.x, io.cursor.y, false)
              const d = Math.hypot(FALLEN.x - io.cursor.x, FALLEN.y - io.cursor.y) || 1
              io.cursor.knock(((io.cursor.x - FALLEN.x) / d) * KICK.popup * s.shot, ((io.cursor.y - FALLEN.y) / d) * KICK.popup * s.shot)
            }
          }
        } else if (s.fired >= 0) {
          const was = s.fired
          s.fired += dt
          if (s.fired >= FINISH.fire && was < FINISH.fire) {
            io.emit('boss-gone', FALLEN.x, FALLEN.y, false)
            io.cursor.act('exhausted')
            io.cursor.aim(null)
          }
          if (s.fired >= FINISH.fire + FINISH.settle) {
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
      const rig = rigNow()
      const give = s.inSocket || s.stage !== 'press' ? 0 : sunk()
      if (rig) drawRig(out, give === 0 ? rig : { ...rig, cap: { ...rig.cap, x: rig.cap.x + PRESS.shove[0] * give, y: rig.cap.y + PRESS.shove[1] * give, rot: rig.cap.rot + PRESS.rock * give } }, 'boss', s.inSocket ? (s.pressed >= 0 ? heights.keyTravel : 0) : PRESS.deep * give)
      setView(view())
      if (s.clock >= 0 && !s.inSocket) drawArena(out, s.fight ?? NONE, raised())
      if ((s.stage === 'fight' || s.stage === 'hold') && s.fight) {
        drawRules(out, s.fight)
        drawWeapons(out, s.fight, L.weapons)
        const f = s.fight
        if (f.at.flat >= 0 && f.clock - f.at.flat < FLAT.life) drawPancake(out, s.cx, s.cy, f.flat > 0 ? 1 : 1 - prog(f.clock - f.at.flat, FLAT.down, FLAT.life))
      }
      const lit = LINE7.part2 - LINE7.power
      if (s.gold >= 0 && s.gold < lit + GOLD_OUT && (s.stage === 'hold' || s.stage === 'fight')) drawPower(out, s.cx, s.cy, power() * (1 - prog(s.gold, lit, lit + GOLD_OUT)))
      if (s.stage === 'finish') drawFinish(out, { x: s.cx, y: s.cy }, FALLEN, arms(), charged(), s.fired >= 0 && s.fired < FINISH.fire ? { power: s.shot, u: s.fired / FINISH.fire } : null)
      if (s.stage === 'collapse' && s.from) {
        const sparks = [0, 1, 2, 3, 4, 5].map((i) => ({ n: 900 + i, x: s.from!.cap.x + [-120, 90, -30, 150, -160, 40][i]!, y: s.from!.cap.y + [-40, 50, 70, -60, 30, -80][i]!, t: s.t - i * 0.1 })).filter((k) => k.t >= 0 && k.t < SPARK_SECONDS)
        if (sparks.length) drawWeapons(out, { ...newFight(), sparks }, L.weapons)
        if (s.fight) drawTurretOff(out, s.from.cap.x, s.from.cap.y, s.fight.face, s.t)
      }
      if ((s.stage === 'collapse' && s.t > CAP_LANDS) || (s.stage === 'finish' && s.t > FINISH.fall) || (s.stage === 'press' && !s.inSocket)) drawSmoke(out, FALLEN.x, FALLEN.y, s.time)
    },
    scroll: () => 0,
    view: () => null,
    camera: () => null,
    script: (time: number): Pointer => film.pointer(time),
    chrome: () => ({ header: 1 - gone() }),
    hint(): Hint | null {
      const blink = Math.floor(s.time * 6) % 2 === 0
      if (s.stage === 'verify' && s.ticked < WAKE_AFTER_TICK.near) return { x: L.checkbox.cx, y: L.checkbox.cy, down: s.ticked < 0 && blink }
      if (s.stage === 'verify') return { x: SOCKET.x, y: SOCKET.y, down: blink }
      if (s.stage === 'unfold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: false }
      if (s.stage === 'hold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: s.turned < 0 && blink }
      if (s.stage === 'finish') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: s.t >= FINISH.fall + FINISH.arms && s.fired < 0 && blink }
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
      const at = s.inSocket ? SOCKET : FALLEN
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
      if (s.stage === 'collapse' || s.stage === 'finish') return 'boss.collapse'
      return 'boss.press'
    },
    ignoring: () => s.stage === 'fight' && s.fight !== null && s.fight.flat > 0,
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

import { config } from '../../config'
import { collapseRig, drawRig, drawSmoke, drawSocket, fightRig, restRig, unfoldRig, prog, bossPlaceAt, CANNON_FROM, type Rig } from '../../boss/body'
import { clearSpot, newFight, SPARK_SECONDS, stepFight, threat, type Arena, type Fight } from '../../boss/fight'
import { ARENA, COLLAPSE_SECONDS, DOUBT_SECONDS, FALLEN, GAG_MAX, HOME, SOCKET, UNFOLD, WAKE_AFTER_TICK } from '../../boss/plan'
import { drawWeapons } from '../../boss/weapons'
import { frame } from '../../stage/camera'
import { drawLayout, type DrawOptions } from '../../shell/layout'
import { SCREEN_H } from '../../shell/parts'
import type { DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo } from '../../stage/types'
import { makeLayout } from './layout'
import { makeScript } from './script'
import { TICK_Z } from './real/verify-card'

type StageName = 'verify' | 'unfold' | 'fight' | 'collapse' | 'press'

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
  skipping: boolean
  damaged: boolean
  done: boolean
  cue: number
  cx: number
  cy: number
}

const heights = config.scale.heights
const REALLY = [0.7, 1.5] as const
const REALLY_TAKE = 0.04
const HORROR = { rear: UNFOLD.open + 0.04, cower: UNFOLD.cannons[0] + 0.2, scared: 2.3 } as const
const SEAT = 0.2
const LIFT = 7
const FILL_GAP = 4
const FILL_TOP = 3.4
// The body takes a sixth argument for the shield's flash and the cap's soot once the modeller's body is in; until then it is ignored.
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t)
const easeIn = (t: number): number => t * t
const STAGES = { w: 2240, h: 1260, y: 630, x: [235, 667, 1216, 1863] } as const
const PHASE_GAG = ['boss.slabs', 'boss.popups', 'boss.lastStand'] as const
const SPOTS: [number, number][] = [[560, 800], [430, 640], [330, 900], [760, 900], [1150, 940], [1420, 950], [1690, 960]]

const fresh = (mode: Mode): State => ({ mode, time: 0, stage: 'verify', t: 0, ticked: -1, selfTick: false, cracked: false, opened: false, fight: null, from: null, inSocket: false, pressed: -1, skipping: false, damaged: false, done: false, cue: 0, cx: 700, cy: 820 })

export function makePage(): PageLogic {
  const L = makeLayout()
  const film = makeScript(L)
  const beats = config.film.beats.filter((b) => b.unit === 'boss')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const arena: Arena = { slabs: L.weapons.slabs.map((s) => ({ w: s.w, h: s.h })), popups: L.weapons.popups.map((p) => ({ box: p.box, buttons: p.buttons.map((b) => b.box) })), keep: L.card }
  let s = fresh('live')

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
    if (s.stage === 'fight' && s.fight) return fightRig(s.fight.x, s.fight.y, feetOf(s.fight), s.fight.recoil, Math.sin(s.fight.clock * 7) * 1.6, { aim: s.fight.look, flash: Math.max(0, s.fight.flash) / 0.12, hurt: 1 - s.fight.shown / 100 })
    if (s.stage === 'collapse' && s.from) return collapseRig(s.from, s.t)
    if (s.stage === 'press' && s.from) return collapseRig(s.from, COLLAPSE_SECONDS)
    return null
  }
  const groundAt = (x: number, y: number): number => {
    const p = { x, y }
    let z = inBox({ x: L.card.x, y: L.card.y, w: L.card.w, h: L.card.h - shut() }, p) ? heights.card : 0
    if ((s.stage === 'verify' || s.inSocket) && inBox(L.cap, p)) z = heights.button
    if (s.stage === 'press' && !s.inSocket && inBox(fallenBox, p, -24)) z = 16
    if (s.stage === 'fight' && s.fight) {
      for (const up of s.fight.popups) if (up.closing < 0 && up.t > 0.14 && inBox(L.weapons.popups[up.slot]!.box, p)) z = Math.max(z, heights.card)
      for (const slab of s.fight.slabs) {
        const size = L.weapons.slabs[slab.m]!
        if (slab.state === 1 && Math.abs(x - slab.x) < size.w / 2 && Math.abs(y - slab.y) < size.h / 2) z = Math.max(z, heights.slab)
      }
    }
    return z
  }
  const toCollapse = (io: StepIo, from: Rig): void => {
    s.from = from
    s.stage = 'collapse'
    s.t = 0
    if (s.fight) {
      s.fight.over = true
      s.fight.health = 0
      s.fight.slabs = []
      s.fight.popups = []
      s.fight.darts = []
      s.fight.sparks = []
      s.fight.flashes = []
    }
    io.emit('power-down', from.cap.x, from.cap.y, false)
    io.cursor.act('plain')
    io.cursor.aim(null)
  }

  const TIP_AT_REST = 1.965

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
      if (s.fight && s.stage !== 'fight') s.fight.shown += (s.fight.health - s.fight.shown) * Math.min(1, dt * 12)
      if (s.skipping && (s.stage === 'verify' || (s.stage === 'unfold' && s.t < UNFOLD.crack))) {
        s.inSocket = true
        s.stage = 'press'
        s.t = 0
        io.cursor.act('plain')
      } else if (s.skipping && s.stage === 'unfold') toCollapse(io, unfoldRig(s.t))
      else if (s.skipping && s.stage === 'fight') toCollapse(io, rigNow()!)

      if (s.stage === 'verify') {
        if (s.ticked < 0) {
          const self = s.t >= GAG_MAX
          if ((io.pressed && inBox(L.checkRow, io.pointer, 8)) || self) {
            s.ticked = 0
            s.selfTick = self
            io.emit('checkbox', L.checkbox.cx, L.checkbox.cy, false)
            io.cursor.act(self ? 'plain' : 'confident')
          } else io.cursor.act(Math.hypot(io.pointer.x - L.checkbox.cx, io.pointer.y - L.checkbox.cy) < 150 ? 'nervous' : 'plain')
        } else {
          s.ticked += dt
          const near = s.mode === 'live' && s.ticked >= WAKE_AFTER_TICK.near && (inBox(L.cap, io.pointer, 70) || inBox(L.cap, io.cursor, 70))
          if (s.ticked >= wake() || near) {
            s.stage = 'unfold'
            s.t = 0
          }
        }
      } else if (s.stage === 'unfold') {
        if (!s.cracked && s.t >= UNFOLD.crack) {
          s.cracked = true
          io.emit('button-crack', SOCKET.x, SOCKET.y, false)
          io.cursor.react('recoil')
          io.cursor.act('shocked')
        }
        if (!s.opened && s.t >= UNFOLD.open) {
          s.opened = true
          const at = bossPlaceAt(s.t)
          io.emit('unfold', at.x, at.y, false)
        }
        if (s.t >= HORROR.rear && s.t - dt < HORROR.rear) io.cursor.react('rear')
        if (s.t >= HORROR.cower && s.t - dt < HORROR.cower) io.cursor.react('cower')
        if (s.t >= HORROR.scared && s.t < UNFOLD.end) io.cursor.act('scared')
        if (s.t >= UNFOLD.end) {
          s.fight = newFight(HOME.x, HOME.y)
          s.stage = 'fight'
          s.t = 0
          io.cursor.act('confident')
        }
      } else if (s.stage === 'fight' && s.fight) {
        const f = s.fight
        const before = f.phase
        stepFight(f, io, arena)
        const to = TIP_AT_REST - Math.atan2(io.cursor.y - f.y, f.x - io.cursor.x)
        io.cursor.aim(Math.atan2(Math.sin(to), Math.cos(to)))
        if (f.phase !== before) {
          s.t = 0
          io.cursor.act('angry')
        }
        if (f.phase === 2 && f.expired >= 0) {
          const was = f.expired - io.dt
          if (f.expired >= REALLY_TAKE && was < REALLY_TAKE) io.cursor.react('doubleTake')
          if (f.expired >= REALLY[0] && was < REALLY[0]) io.cursor.act('exhausted')
          if (f.expired >= REALLY[1] && was < REALLY[1]) {
            io.cursor.act('angry')
            io.cursor.react('fume')
          }
        }
        if (f.over) toCollapse(io, rigNow()!)
      } else if (s.stage === 'collapse') {
        if (s.t >= COLLAPSE_SECONDS) {
          s.stage = 'press'
          s.t = 0
          io.cursor.act('exhausted')
        }
      } else if (s.stage === 'press') {
        if (s.pressed < 0) {
          const target = s.inSocket ? L.cap : fallenBox
          const self = s.t >= GAG_MAX || (s.skipping && s.t >= 0.5)
          if ((io.pressed && inBox(target, io.pointer, 4)) || self) {
            s.pressed = 0
            io.emit('button-press', s.inSocket ? SOCKET.x : FALLEN.x, s.inSocket ? SOCKET.y : FALLEN.y, false)
          }
        } else {
          s.pressed += dt
          if (s.pressed >= 0.35 && !s.damaged) s.done = true
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
      const fillAt = (w: number): Shape => ({ id: 'health-fill', part: 'health-bar', kind: 'capsule', x: L.track.x + FILL_GAP + slide, y: L.track.y + FILL_GAP, w, h: L.track.h - FILL_GAP * 2, z0: heights.progressRail + lift, z1: FILL_TOP + lift, tone: 'accent', v: [L.track.w - FILL_GAP * 2], moved: lift > 0 })
      if (states.includes('fight')) {
        const full = L.track.w - FILL_GAP * 2
        const w = s.fight ? Math.max(0, full * (s.fight.shown / 100)) : full
        if (w >= L.track.h - FILL_GAP * 2) out.push(fillAt(w))
      }
      if (s.cracked && !s.inSocket) drawSocket(out, SOCKET.x, SOCKET.y, prog(s.stage === 'unfold' ? s.t : 9, UNFOLD.crack, UNFOLD.crack + 0.25), 'socket-open')
      const rig = rigNow()
      if (rig) drawRig(out, rig, 'boss', s.pressed >= 0 ? heights.keyTravel : 0)
      if (s.stage === 'fight' && s.fight) drawWeapons(out, s.fight, L.weapons)
      if (s.stage === 'collapse' && s.from) {
        const sparks = [0, 1, 2, 3, 4, 5].map((i) => ({ n: 900 + i, x: s.from!.cap.x + [-120, 90, -30, 150, -160, 40][i]!, y: s.from!.cap.y + [-40, 50, 70, -60, 30, -80][i]!, t: s.t - i * 0.1 })).filter((k) => k.t >= 0 && k.t < SPARK_SECONDS)
        if (sparks.length) drawWeapons(out, { ...newFight(), sparks }, L.weapons)
      }
      if ((s.stage === 'collapse' && s.t > 1.2) || (s.stage === 'press' && !s.inSocket)) drawSmoke(out, FALLEN.x, FALLEN.y, s.time)
    },
    scroll: () => 0,
    view: () => null,
    camera: () => null,
    script: (time: number): Pointer => film.pointer(time),
    hint(): Hint | null {
      const blink = Math.floor(s.time * 6) % 2 === 0
      if (s.stage === 'verify' && s.ticked < WAKE_AFTER_TICK.near) return { x: L.checkbox.cx, y: L.checkbox.cy, down: s.ticked < 0 && blink }
      if (s.stage === 'verify') return { x: SOCKET.x, y: SOCKET.y, down: blink }
      if (s.stage === 'unfold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: false }
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
        const clear = SPOTS.filter(([x, y]) => clearSpot(f, arena, x, y))
        const safe = SPOTS.filter(([x, y]) => !threat(f, arena, x, y))
        const both = near(clear.filter((c) => safe.includes(c)))
        if (both) {
          const out: Hint = { x: both[0], y: both[1], down: blink }
          if (threat(f, arena, s.cx, s.cy)) out.dodge = { x: both[0], y: both[1] }
          return out
        }
        const spot = near(clear) ?? near(safe) ?? SPOTS[0]!
        const out: Hint = { x: spot[0], y: spot[1], down: blink }
        const hit = threat(f, arena, spot[0], spot[1])
        if (hit) out.dodge = { x: Math.min(ARENA.x1 - 60, Math.max(ARENA.x0 + 20, spot[0] + hit.dx * 190)), y: Math.min(ARENA.y1 - 90, Math.max(ARENA.y0 + 20, spot[1] + hit.dy * 190)) }
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
      if (s.stage === 'unfold') return 'boss.unfold'
      if (s.stage === 'fight') return PHASE_GAG[s.fight ? s.fight.phase : 0]!
      if (s.stage === 'collapse') return 'boss.collapse'
      return 'boss.press'
    },
    ignoring: () => false,
    states(): string[] {
      const out = [card()]
      const bar = (s.stage === 'unfold' && s.t >= UNFOLD.bar[0]) || s.stage === 'fight' || ((s.stage === 'collapse' || s.stage === 'press') && !s.inSocket)
      if (bar) out.push('fight')
      if (s.stage === 'press' && !s.inSocket) out.push('down')
      return out
    },
    sheet(id: string): SheetFrame | null {
      if (id !== 'boss-stages') return null
      const list: DrawList = []
      const [x0, x1, x2, x3] = STAGES.x
      const y = STAGES.y
      drawSocket(list, x0, y, 0, 'stage-0-socket')
      drawRig(list, restRig(x0, y), 'stage-0')
      drawSocket(list, x1, y + 14, 1, 'stage-1-socket')
      const loose = restRig(x1, y)
      loose.cap.lift = 0.5
      loose.cap.rot = -0.11
      loose.cap.x += 14
      loose.cap.y -= 12
      drawRig(list, loose, 'stage-1')
      drawSocket(list, x2, y + 8, 1, 'stage-2-socket')
      const half = fightRig(x2, y, null)
      for (const l of half.legs) l.k = 0.5
      for (const c of half.cannons) c.k = 0
      half.shield.k = 0
      drawRig(list, half, 'stage-2')
      drawRig(list, fightRig(x3, y, null), 'stage-3')
      return { list, cursors: [], view: frame({ x: 0, y: 0, w: STAGES.w, h: STAGES.h }), width: STAGES.w, height: STAGES.h }
    }
  }
  return page
}

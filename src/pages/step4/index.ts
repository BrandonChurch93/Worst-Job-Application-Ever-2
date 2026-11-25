import { config } from '../../config'
import { collapseRig, drawRig, drawSmoke, drawSocket, fightRig, restRig, unfoldRig, prog, bossPlaceAt, CANNON_FROM, type Rig } from '../../boss/body'
import { clearSpot, newFight, stepFight, threat, type Arena, type Fight } from '../../boss/fight'
import { ARENA, COLLAPSE_SECONDS, DOUBT_SECONDS, FALLEN, GAG_MAX, HOME, SOCKET, UNFOLD, WAKE_AFTER_TICK } from '../../boss/plan'
import { drawWeapons } from '../../boss/weapons'
import { homePose } from '../../stage/camera'
import { drawLayout, type DrawOptions } from '../../shell/layout'
import { SCREEN_H } from '../../shell/parts'
import type { DrawList, GagInfo, Hint, Mode, PageContext, PageLogic, Pointer, Shape, SheetFrame, StepIo } from '../../stage/types'
import { makeLayout } from './layout'
import { makeScript } from './script'

type StageName = 'verify' | 'unfold' | 'fight' | 'collapse' | 'press'

interface State {
  mode: Mode
  time: number
  stage: StageName
  t: number
  ticked: number
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
}

const heights = config.scale.heights
const PHASE_GAG = ['boss.slabs', 'boss.popups', 'boss.lastStand'] as const
const SPOTS: [number, number][] = [[560, 800], [640, 1010], [1420, 1012], [1700, 990]]

const fresh = (mode: Mode): State => ({ mode, time: 0, stage: 'verify', t: 0, ticked: -1, cracked: false, opened: false, fight: null, from: null, inSocket: false, pressed: -1, skipping: false, damaged: false, done: false, cue: 0 })

export function makePage(): PageLogic {
  const L = makeLayout()
  const film = makeScript(L)
  const beats = config.film.beats.filter((b) => b.unit === 'boss')
  const gags: GagInfo[] = beats.map((b) => ({ id: b.id, event: (b as { event?: string }).event ?? null }))
  const arena: Arena = { slabs: L.weapons.slabs.map((s) => ({ w: s.w, h: s.h })), popups: L.weapons.popups.map((p) => ({ box: p.box, buttons: p.buttons.map((b) => b.box) })) }
  let s = fresh('live')

  const inBox = (b: { x: number; y: number; w: number; h: number }, p: { x: number; y: number }, grow = 0): boolean => p.x >= b.x - grow && p.x <= b.x + b.w + grow && p.y >= b.y - grow && p.y <= b.y + b.h + grow
  const fallenBox = { x: FALLEN.x - 150, y: FALLEN.y - 62, w: 300, h: 124 }
  const wake = (): number => (s.mode === 'film' ? WAKE_AFTER_TICK.film : WAKE_AFTER_TICK.live)
  const card = (): string => {
    if (s.ticked < 0.3) return 'rest'
    if (s.mode === 'film') return 'confirmed-film'
    return s.ticked < 0.3 + DOUBT_SECONDS ? 'doubt' : 'confirmed-live'
  }
  const feetOf = (f: Fight): { x: number; y: number; z: number }[] => f.feet.map((foot) => ({ x: foot.x, y: foot.y, z: foot.t >= 0 ? Math.sin(Math.PI * Math.min(1, foot.t)) * 16 : 0 }))
  const rigNow = (): Rig | null => {
    if (s.stage === 'unfold') return unfoldRig(s.t)
    if (s.stage === 'fight' && s.fight) return fightRig(s.fight.x, s.fight.y, feetOf(s.fight), s.fight.recoil, Math.sin(s.fight.clock * 7) * 1.6)
    if (s.stage === 'collapse' && s.from) return collapseRig(s.from, s.t)
    if (s.stage === 'press' && s.from) return collapseRig(s.from, COLLAPSE_SECONDS)
    return null
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
    }
    io.emit('power-down', from.cap.x, from.cap.y, false)
    io.cursor.act('exhausted')
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
            io.emit('checkbox', L.checkbox.cx, L.checkbox.cy, false)
            io.cursor.act(self ? 'plain' : 'confident')
          } else io.cursor.act(Math.hypot(io.pointer.x - L.checkbox.cx, io.pointer.y - L.checkbox.cy) < 150 ? 'nervous' : 'plain')
        } else {
          s.ticked += dt
          if (s.ticked >= wake()) {
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
        if (s.t >= 2.3 && s.t < UNFOLD.end) io.cursor.act('scared')
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
        if (f.phase !== before) {
          s.t = 0
          io.cursor.act('angry')
        }
        if (f.over) toCollapse(io, rigNow()!)
      } else if (s.stage === 'collapse') {
        if (s.t >= COLLAPSE_SECONDS) {
          s.stage = 'press'
          s.t = 0
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
    },
    save: () => JSON.parse(JSON.stringify(s)) as State,
    load(state) {
      s = JSON.parse(JSON.stringify(state)) as State
    },
    draw(out: DrawList) {
      const over: Record<string, Partial<Shape> | null> = { 'fight-type': null }
      const loose = s.stage !== 'verify' && !s.inSocket
      if (loose) over['submit-cap'] = null
      else if (s.pressed >= 0) over['submit-cap'] = { z1: heights.button - heights.keyTravel }
      if (loose) {
        const u = s.stage === 'unfold' ? s.t : UNFOLD.end
        CANNON_FROM.forEach((n, i) => {
          if (u >= UNFOLD.cannons[0] + i * 0.18) over[`progress-${n}`] = null
        })
      }
      if (s.ticked >= 0) over['verify-box'] = { tone: 'accent' }
      const states = page.states()
      const slide = s.stage === 'unfold' ? (1 - prog(s.t, UNFOLD.bar[0], UNFOLD.bar[1])) * -1760 : 0
      if (slide !== 0) {
        const label = L.tree.children!.find((c) => c.id === 'health')!.children![0]!
        over['health-label'] = { x: label.box[0]! + slide }
        over['health-track'] = { x: L.track.x + slide }
      }
      const options: DrawOptions = { states, over }
      drawLayout(out, L.tree, options)
      if (s.ticked >= 0) {
        const b = L.checkbox
        const z = heights.card + 4
        const a = prog(s.ticked, 0.02, 0.12)
        const c = prog(s.ticked, 0.12, 0.28)
        const stroke = (id: string, x0: number, y0: number, x1: number, y1: number, k: number): void => {
          if (k <= 0.01) return
          const ex = x0 + (x1 - x0) * k
          const ey = y0 + (y1 - y0) * k
          const len = Math.hypot(ex - x0, ey - y0) + 5
          out.push({ id, part: 'verify-card', kind: 'box', x: b.x + (x0 + ex) / 2 - len / 2, y: b.y + (y0 + ey) / 2 - 2.75, w: len, h: 5.5, z0: z, z1: z + 1, tone: 'inkLight', rot: Math.atan2(ey - y0, ex - x0), r: 2 })
        }
        stroke('verify-tick-a', 10, 23, 18.5, 31.5, a)
        stroke('verify-tick-b', 18.5, 31.5, 34, 13, c)
      }
      if (states.includes('fight') && s.fight) {
        const t = L.track
        const w = Math.max(0, (t.w - 6) * (s.fight.shown / 100))
        if (w > 1) out.push({ id: 'health-fill', part: 'health-bar', kind: 'capsule', x: t.x + 3 + slide, y: t.y + 3, w: Math.max(t.h - 6, w), h: t.h - 6, z0: heights.progressRail, z1: 2.5, tone: 'accent' })
      } else if (states.includes('fight')) {
        const t = L.track
        out.push({ id: 'health-fill', part: 'health-bar', kind: 'capsule', x: t.x + 3 + slide, y: t.y + 3, w: t.w - 6, h: t.h - 6, z0: heights.progressRail, z1: 2.5, tone: 'accent' })
      }
      if (s.cracked && !s.inSocket) drawSocket(out, SOCKET.x, SOCKET.y, prog(s.stage === 'unfold' ? s.t : 9, UNFOLD.crack, UNFOLD.crack + 0.25), 'socket-open')
      const rig = rigNow()
      if (rig) drawRig(out, rig, 'boss', s.pressed >= 0 ? heights.keyTravel : 0)
      if (s.stage === 'fight' && s.fight) drawWeapons(out, s.fight, L.weapons)
      if (s.stage === 'collapse' && s.from) {
        const sparks = [0, 1, 2, 3, 4, 5].map((i) => ({ n: 900 + i, x: s.from!.cap.x + [-120, 90, -30, 150, -160, 40][i]!, y: s.from!.cap.y + [-40, 50, 70, -60, 30, -80][i]!, t: s.t - i * 0.1 })).filter((k) => k.t >= 0 && k.t < 0.22)
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
      if (s.stage === 'verify') return { x: L.checkbox.cx, y: L.checkbox.cy, down: s.ticked < 0 && blink }
      if (s.stage === 'unfold') return { x: SPOTS[0]![0], y: SPOTS[0]![1], down: false }
      if (s.stage === 'fight' && s.fight) {
        const f = s.fight
        const spot = SPOTS.find(([x, y]) => clearSpot(f, arena, x, y)) ?? SPOTS[2]!
        const out: Hint = { x: spot[0], y: spot[1], down: blink }
        const hit = threat(f, arena, spot[0], spot[1])
        if (hit) out.dodge = { x: Math.min(ARENA.x1 - 60, Math.max(ARENA.x0 + 20, spot[0] + hit.dx * 170)), y: Math.min(ARENA.y1 - 50, Math.max(ARENA.y0 + 20, spot[1] + hit.dy * 170)) }
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
      const y = 520
      drawSocket(list, 250, y, 0, 'stage-0-socket')
      drawRig(list, restRig(250, y), 'stage-0')
      drawSocket(list, 650, y + 14, 1, 'stage-1-socket')
      const loose = restRig(650, y)
      loose.cap.lift = 0.5
      loose.cap.rot = -0.11
      loose.cap.x += 14
      loose.cap.y -= 12
      drawRig(list, loose, 'stage-1')
      drawSocket(list, 1090, y + 8, 1, 'stage-2-socket')
      const half = fightRig(1090, y, null)
      for (const l of half.legs) l.k = 0.5
      for (const c of half.cannons) c.k = 0
      half.shield.k = 0
      drawRig(list, half, 'stage-2')
      drawRig(list, fightRig(1610, y, null), 'stage-3')
      return { list, cursors: [], view: homePose(0) }
    }
  }
  return page
}

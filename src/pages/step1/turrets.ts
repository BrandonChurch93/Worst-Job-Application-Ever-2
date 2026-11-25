import { config } from '../../config'
import type { DrawList, Emit } from '../../stage/types'

const heights = config.scale.heights

export const TURRET = {
  riseSeconds: 0.5, period: 0.9, firstShot: 0.6, stagger: 0.45, windup: 0.35, boltSpeed: 1500, aimLag: 0.16, hitRadius: 42, scorchSeconds: 2.4, body: 92, barrel: 84, scorch: 24, bolt: 60, hatchShare: 0.3, scorchFade: 0.4,
  muzzleHeight: heights.turret - 18
}

const ease = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

export interface Place { x: number; y: number }
export interface Bolt { id: number; from: number; x0: number; y0: number; tx: number; ty: number; age: number; flight: number; z: number }
export interface Scorch { id: number; x: number; y: number; z: number; left: number }
export interface Hit { x: number; y: number; dx: number; dy: number }

export interface TurretsState {
  wanted: boolean
  overheated: boolean
  up: number
  clock: number
  aim: Place
  angle: [number, number]
  lock: [Place | null, Place | null]
  next: [number, number]
  bolts: Bolt[]
  scorches: Scorch[]
  nextId: number
  hits: number
  heat: number
}

const fresh = (at: [Place, Place]): TurretsState => ({
  wanted: false, overheated: false, up: 0, clock: 0, aim: { x: (at[0].x + at[1].x) / 2, y: at[0].y }, angle: [0, Math.PI], lock: [null, null],
  next: [TURRET.firstShot, TURRET.firstShot + TURRET.stagger], bolts: [], scorches: [], nextId: 0, hits: 0, heat: 0
})

export class Turrets {
  s: TurretsState

  constructor(readonly at: [Place, Place], readonly base: number, readonly maxHits: number, readonly surface: (x: number, y: number) => number) {
    this.s = fresh(at)
  }

  reset(): void {
    this.s = fresh(this.at)
  }

  raise(emit: Emit): void {
    if (this.s.wanted) return
    this.s.wanted = true
    this.s.clock = 0
    this.s.next = [TURRET.firstShot, TURRET.firstShot + TURRET.stagger]
    for (const p of this.at) emit('turret-rise', p.x, p.y, false)
  }

  retract(): void {
    this.s.wanted = false
    this.s.lock = [null, null]
  }

  get firing(): boolean {
    return this.s.wanted && !this.s.overheated && this.s.up >= 1
  }

  threats(): Place[] {
    const out: Place[] = []
    for (const l of this.s.lock) if (l) out.push(l)
    for (const b of this.s.bolts) out.push({ x: b.tx, y: b.ty })
    return out
  }

  step(dt: number, target: Place, exposed: boolean, emit: Emit): Hit[] {
    const s = this.s
    const hits: Hit[] = []
    s.up = Math.min(1, Math.max(0, s.up + ((s.wanted ? 1 : -1) * dt) / TURRET.riseSeconds))
    const k = Math.min(1, dt / TURRET.aimLag)
    s.aim.x += (target.x - s.aim.x) * k
    s.aim.y += (target.y - s.aim.y) * k
    if (s.overheated) s.heat += dt
    for (let i = 0; i < 2; i++) {
      const p = this.at[i]!
      const to = s.lock[i] ?? s.aim
      if (!s.overheated) s.angle[i] = Math.atan2(to.y - p.y, to.x - p.x)
    }
    if (this.firing) {
      s.clock += dt
      for (let i = 0; i < 2; i++) {
        const p = this.at[i]!
        if (s.lock[i] === null && s.clock >= s.next[i]! - TURRET.windup) s.lock[i] = { x: s.aim.x, y: s.aim.y }
        if (s.clock >= s.next[i]!) {
          const l = s.lock[i] ?? { x: s.aim.x, y: s.aim.y }
          const a = Math.atan2(l.y - p.y, l.x - p.x)
          const x0 = p.x + Math.cos(a) * TURRET.barrel
          const y0 = p.y + Math.sin(a) * TURRET.barrel
          const d = Math.hypot(l.x - x0, l.y - y0)
          s.bolts.push({ id: s.nextId++, from: i, x0, y0, tx: l.x, ty: l.y, age: 0, flight: Math.max(0.08, d / TURRET.boltSpeed), z: this.surface(l.x, l.y) })
          emit('bolt-fire', x0, y0, false)
          s.lock[i] = null
          s.next[i] = s.next[i]! + TURRET.period
        }
      }
    }
    for (const b of s.bolts) b.age += dt
    const landed = s.bolts.filter((b) => b.age >= b.flight)
    s.bolts = s.bolts.filter((b) => b.age < b.flight)
    for (const b of landed) {
      const d = Math.hypot(target.x - b.tx, target.y - b.ty)
      const n = Math.hypot(b.tx - b.x0, b.ty - b.y0) || 1
      if (exposed && d <= TURRET.hitRadius) {
        emit('bolt-hit', target.x, target.y, true)
        hits.push({ x: target.x, y: target.y, dx: (b.tx - b.x0) / n, dy: (b.ty - b.y0) / n })
        s.hits++
        if (s.hits >= this.maxHits) {
          s.overheated = true
          s.lock = [null, null]
        }
      } else {
        emit('bolt-hit', b.tx, b.ty, false)
        s.scorches.push({ id: b.id, x: b.tx, y: b.ty, z: b.z, left: TURRET.scorchSeconds })
      }
    }
    if (!s.wanted) for (const c of s.scorches) c.left = Math.min(c.left, TURRET.scorchFade)
    for (const c of s.scorches) c.left -= dt
    s.scorches = s.scorches.filter((c) => c.left > 0)
    return hits
  }

  save(): TurretsState {
    return JSON.parse(JSON.stringify(this.s)) as TurretsState
  }

  load(state: TurretsState): void {
    this.s = JSON.parse(JSON.stringify(state)) as TurretsState
  }

  draw(out: DrawList, lift = 0): void {
    const s = this.s
    for (const c of s.scorches) {
      const d = TURRET.scorch * Math.min(1, c.left / (TURRET.scorchSeconds * 0.5))
      out.push({ id: `scorch-${c.id}`, part: 'turrets', kind: 'disc', x: c.x - d / 2, y: c.y - d / 2, w: d, h: d, z0: c.z + lift, z1: c.z + lift + 0.5, tone: 'dark', v: [c.left / TURRET.scorchSeconds] })
    }
    if (s.up > 0) {
      const open = ease(s.up / TURRET.hatchShare)
      const rise = ease((s.up - TURRET.hatchShare) / (1 - TURRET.hatchShare))
      for (let i = 0; i < 2; i++) {
        const p = this.at[i]!
        const top = this.base + (heights.turret - this.base) * rise + lift
        const tone = s.overheated ? 'danger' : 'metal'
        const stands = top >= heights.machineMinTop
        const winding = s.lock[i] !== null
        const charge = winding ? Math.min(1, (TURRET.windup - (s.next[i]! - s.clock)) / TURRET.windup) : 0
        const back = charge * 14
        const a = s.overheated ? (i === 0 ? 0.5 : Math.PI - 0.5) : s.angle[i]!
        const first = TURRET.firstShot + (i === 0 ? 0 : TURRET.stagger)
        const since = this.firing && s.next[i]! > first + 1e-9 ? Math.min(1, s.clock - (s.next[i]! - TURRET.period)) : 1
        const shots = Math.round((s.next[i]! - first) / TURRET.period)
        const heat = s.overheated ? Math.min(1, s.heat / 0.6) : 0
        out.push({
          id: `turret-${i}`, part: 'turrets', kind: 'disc', x: p.x - TURRET.body / 2, y: p.y - TURRET.body / 2, w: TURRET.body, h: TURRET.body, z0: this.base + lift, z1: top, tone, mechanism: stands,
          v: [Math.cos(a), Math.sin(a), charge, since, heat, back, open, shots]
        })
        const reach = TURRET.barrel / 2 + 14 - back
        const cx = p.x + Math.cos(a) * reach
        const cy = p.y + Math.sin(a) * reach
        out.push({ id: `turret-${i}-barrel`, part: 'turrets', kind: 'box', x: cx - TURRET.barrel / 2, y: cy - 10, w: TURRET.barrel, h: 20, z0: top - 28, z1: top - 4, r: 3, rot: a, tone: 'dark', mechanism: stands })
        const tip = TURRET.barrel + 8 - back
        out.push({ id: `turret-${i}-muzzle`, part: 'turrets', kind: 'box', x: p.x + Math.cos(a) * tip - 7, y: p.y + Math.sin(a) * tip - 15, w: 14, h: 30, z0: top - 32, z1: top, r: 3, rot: a, tone: 'raised', mechanism: stands })
        out.push({ id: `turret-${i}-head`, part: 'turrets', kind: 'disc', x: p.x - 30, y: p.y - 30, w: 60, h: 60, z0: top - 2, z1: top, tone: s.overheated ? 'danger' : 'dark', mechanism: stands })
        if (winding) {
          const mx = p.x + Math.cos(a) * (TURRET.barrel + 26 - back)
          const my = p.y + Math.sin(a) * (TURRET.barrel + 26 - back)
          const g = 10 + back
          out.push({ id: `turret-${i}-charge`, part: 'turrets', kind: 'ball', x: mx - g / 2, y: my - g / 2, w: g, h: g, z0: top - 17 - g / 2, z1: top - 17 + g / 2, tone: 'light' })
        }
        if (s.overheated) {
          for (let j = 0; j < 3; j++) {
            const u = (s.heat * 0.6 + j / 3) % 1
            const d = 16 + 26 * u
            out.push({ id: `turret-${i}-steam-${j}`, part: 'turrets', kind: 'ball', x: p.x - d / 2 + (j - 1) * 14, y: p.y - d / 2 - u * 50, w: d, h: d, z0: top + 10 + u * 90, z1: top + 10 + u * 90 + d, tone: 'glass' })
          }
        }
      }
    }
    for (const b of s.bolts) {
      const u = Math.min(1, b.age / b.flight)
      const x = b.x0 + (b.tx - b.x0) * u
      const y = b.y0 + (b.ty - b.y0) * u
      const z = TURRET.muzzleHeight + (b.z + 10 - TURRET.muzzleHeight) * u + lift
      const a = Math.atan2(b.ty - b.y0, b.tx - b.x0)
      const len = TURRET.bolt
      const cx = x - Math.cos(a) * len * 0.5
      const cy = y - Math.sin(a) * len * 0.5
      const tx = x - Math.cos(a) * (len + 14)
      const ty = y - Math.sin(a) * (len + 14)
      out.push({ id: `bolt-${b.id}-edge`, part: 'turrets', kind: 'capsule', x: cx - len / 2 - 5, y: cy - 13, w: len + 10, h: 26, z0: z - 10, z1: z + 6, rot: a, tone: 'dark' })
      out.push({ id: `bolt-${b.id}-tail`, part: 'turrets', kind: 'capsule', x: tx - 18, y: ty - 4, w: 36, h: 8, z0: z - 6, z1: z + 2, rot: a, tone: 'dark' })
      out.push({ id: `bolt-${b.id}`, part: 'turrets', kind: 'capsule', x: cx - len / 2, y: cy - 8, w: len, h: 16, z0: z - 8, z1: z + 9, rot: a, tone: 'light', v: [u, Math.min(1, b.age / 0.05)] })
    }
  }
}

import type { BossView, ViewPoint } from '../view'
import { hash01 } from '../../core/random'
import { BTN, CANNON, FEET, GUN, HATCH, HIPS, HULL, LEG, PAGE_BTN, SHIELD } from './numbers'

// The pose of every part as plain numbers, a pure function of the view and a seed. No three.js here, so the tests read it in Node.
// Lengths are model units (px of the target sheets) unless a name says page; K turns units into page px.

export const K = 226 / 590

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
export const smooth = (t: number): number => { const u = clamp01(t); return u * u * (3 - 2 * u) }
export const lin = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a))
export const prog = (t: number, a: number, b: number): number => smooth(lin(t, a, b))
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t
export const outBack = (t: number, s = 1.7): number => { const u = clamp01(t) - 1; return 1 + u * u * ((s + 1) * u + s) }
export const outCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3)
export const inQuad = (t: number): number => clamp01(t) * clamp01(t)
export const bump = (t: number, a: number, b: number): number => { const u = lin(t, a, b); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) }
// A blow that starts at once and dies away: 1 at 0, 0 from `life` on.
export const kick = (age: number, life: number): number => (age < 0 || age >= life ? 0 : Math.pow(1 - age / life, 2))
const since = (now: number, at: number | null): number => (at === null ? -1 : now - at)

export interface LookOptions {
  seed: number
  // Where the Submit button sits in the form, page px.
  socket: ViewPoint
  // Where he stands when formed and which way he faces there: the footholds are laid so that his feet stand exactly as in the target there.
  home: { x: number; y: number; heading: number }
  // The cracks under his feet and hull where he lands.
  ground: boolean
  // The broken socket itself. Off in the site, where the arena draws the collar, the pit and its cracks; on for a picture of the boss alone.
  pit: boolean
}

export const DEFAULTS: LookOptions = { seed: 20261127, socket: { x: 960, y: 960 }, home: { x: 960, y: 548, heading: Math.PI }, ground: true, pit: false }

// The stages of the forming, as shares of boss.form.
export const FORM = {
  crack: [0, 0.06], launch: 0.06, clamp: [0.1, 0.19], press: [0.15, 0.2], land: 0.34, wingA: [0.38, 0.46], wingB: [0.43, 0.51], guns: [0.47, 0.58],
  legs: [0.52, 0.6, 0.68, 0.76], legTime: 0.1, stand: [0.82, 0.93], shield: [0.84, 0.97], arc: 480
} as const

// The stages of the turret beat, as shares of boss.turret.
export const TURRET = { hatch: [0.02, 0.16], rise: [0.14, 0.44], swing: [0.46, 0.94], lock: 0.94, kick: 0.16, glow: [0.9, 1] } as const

export const WALK = { pitch: 40, band: 0.14, lift: 38, bob: 5 }
// The fall when he is beaten, as shares of boss.beaten: the cannon leaves, the glass bursts, the body drops on its belly.
export const FALL = { off: [0, 0.4], glass: [0.05, 0.3], drop: [0.3, 0.7] } as const
// The finishing blast, as shares of boss.gone: when each part leaves, when the hull comes apart, when the bare button comes down on the ground, when the last pieces land.
export const GONE = { shield: [0.02, 0.6], wings: [[0.08, 0.7], [0.14, 0.76]], guns: [[0.05, 0.65], [0.1, 0.7]], legs: [[0.2, 0.8], [0.26, 0.86], [0.3, 0.9], [0.36, 0.96]], bay: [0.22, 0.8], hull: [0.28, 0.98], plate: [0.06, 0.34], button: [0.5, 0.9], left: [0.4, 0.92], land: [[0.44, 0.92], [0.5, 0.93], [0.56, 0.95], [0.52, 0.94]] } as const
// How a piece leaves in the blast, in model units: far down the beam, wide to its own side, up from the ground.
export const FLY = { far: 2700, wide: 420, fan: 0.42, least: 0.6, high: 120, burst: [400, 250] }
// Where the button lies when all else is gone (the fight's FALLEN), level on the page; and what the blast leaves, all of it downrange. Places are [along the blast, across it] in page px from the button's middle. `lie`: a claw, a bent plate, two bolts, each with its turn. `plates`: torn pieces of the hull (which piece, along, across, turn, size, tilt about x, tilt about y). `shards`: the small burnt ones, from `near` to `far` along the blast in a fan of `fan` px across per px along, `sides` of them beside the button.
export const LEFT = { x: 960, y: 650, slide: [0.02, 0.92], lie: [[30, 104, 2.5], [182, 70, -0.5], [92, -86, 0.9], [250, -30, 2.2]], plates: [[3, 236, -122, -0.9, 0.92, 0.3, -0.16], [0, 412, 96, 0.5, 0.6, -0.26, 0.22], [4, 588, -48, 1.9, 0.44, 0.2, 0.3], [2, 760, 170, 1.4, 0.3, -0.34, 0.1]], shards: { near: 136, far: 780, fan: 0.5, sides: 0.16 }, sunk: 0.45 } as const
// The fist on the button that is left: it goes down in `down` seconds and stays down while the fist is on it; when the fist leaves it springs back in `back` seconds with a small overshoot. `deep` is in model units, `squash` a share of its size.
export const PRESS = { down: 0.07, back: 0.38, deep: 9, squash: 0.045 }
// The floor of light his parts keep inside the beam, as a share of their own colour: a tilted plate stays light grey.
export const BEAMLIT = 0.42
// The floor of light the legs keep always, so a leg that leans away from the key does not go dark.
export const LEGLIT = 0.65
export const WORD = { font: 'inter-400', px: 25 }
export const BENT = { yaw: 0.26, droop: 0.2 }
export const TIMES = { form: 2.9, turret: 1.6, beaten: 1, gone: 2.13, gunKick: 0.25, glance: 0.3, hit: 0.35, heal: 0.6, beam: 0.3, recoil: 0.45, after: 1.2, weak: 1.2 }

export interface LegPose { hip: [number, number, number]; knee: [number, number, number]; foot: [number, number, number]; yaw: number; up: number; yaw2: number; down: number; footYaw: number; lift: number; show: number; planted: [number, number] }
export interface GunPose { yaw: number; recoil: number; spin: number; lamp: number; flash: number; rise: number }
export interface Pose {
  // The boss's centre in world px (x right, y up the page) and the scale of the whole figure.
  x: number
  y: number
  shown: boolean
  body: { x: number; y: number; z: number; yaw: number; pitch: number; roll: number }
  hull: { x: number; y: number; z: number; show: boolean }
  button: { z: number; sx: number; sy: number; jx: number; jy: number; glow: number }
  wings: [number, number]
  hatch: { x: number; z: number; seam: number; gone: number }
  shield: { rise: number; slide: number; flash: number; broken: number; show: boolean }
  guns: [GunPose, GunPose]
  legs: LegPose[]
  cannon: { show: boolean; x: number; z: number; elev: number; yaw: number; ribs: number; sleeve: number; barrel: number; window: number; bore: number; slits: number; heat: number; off: number }
  weak: number
  // 0 to 1: how far the lids of the hatch have parted over the open flank.
  weakOpen: number
  // Seconds since the cannon came down on its rest; below 0 before, large when it can no longer be told.
  lockAge: number
  // 0 whole, 1 and 2 the stages of the fight, 3 beaten.
  damage: number
  hurt: number
  heal: number
  sag: number
  // The finishing blast: how far he is gone (0 to 1), how far each part has left (0 to 1), and the way the blast blows, in the look's own plane (y up).
  gone: number
  away: { shield: number; wings: [number, number]; guns: [number, number]; legs: [number, number, number, number]; bay: number; hull: number; plates: number[] }
  // The pieces that stay: 0 in the body, 1 lying where they are left.
  left: number
  // The four pieces of the hull that stay: 0 on the body, 1 lying flat where they are left. And how much of the beam's light is on his parts, 0 to 1.
  landed: number[]
  lit: number
  // 0 to 1: how far the button is down under the fist; a little below 0 on the spring back when the fist leaves.
  press: number
  blow: [number, number]
  // The middle of the word on the button, page px and height, and the turn of the button on the page.
  word: { x: number; y: number; z: number; rot: number; show: boolean }
}

const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]

// One axis of a foothold: the foot holds a point of a row of points `pitch` apart and steps to the next one while the body crosses a band between two. The band lies a quarter of the way on for one pair of legs and three quarters for the other (q), so the pairs step in turn and all four stand at rest.
function hold(p: number, pitch: number, off: number, q: number): { at: number; lift: number } {
  const g = p / pitch - off + 0.5 - q
  const i = Math.floor(g)
  const t = g - i
  const w = WALK.band
  let s = 0
  let u = 0
  if (t > 1 - w) { u = (t - 1 + w) / (2 * w); s = smooth(u) } else if (t < w) { u = (t + w) / (2 * w); s = smooth(u) - 1 }
  return { at: (i + s + off) * pitch, lift: u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0 }
}

// Where foot i stands on the ground, world px, for a body at (x, y) facing `yaw` (world, counter clockwise).
export function footAt(i: number, x: number, y: number, yaw: number, o: LookOptions): { x: number; y: number; lift: number } {
  const [fx, fy] = rot(FEET[i]![0] * K, FEET[i]![1] * K, yaw)
  const hy = -(o.home.heading)
  const [ox, oy] = rot(FEET[i]![0] * K, FEET[i]![1] * K, hy)
  const offX = (o.home.x - 960 + ox) / WALK.pitch
  const offY = (540 - o.home.y + oy) / WALK.pitch
  const q = i === 0 || i === 3 ? -0.25 : 0.25
  const a = hold(x + fx, WALK.pitch, offX - Math.floor(offX), q)
  const b = hold(y + fy, WALK.pitch, offY - Math.floor(offY), q)
  return { x: a.at, y: b.at, lift: Math.max(a.lift, b.lift) }
}

// Two links from the hip to the ankle. The knee is found in the upright plane through both and then leaned to one side about the line between them, so the leg reads bent from above.
function legIk(hip: [number, number, number], foot: [number, number, number], lean: number): { knee: [number, number, number]; yaw: number; up: number; yaw2: number; down: number } {
  const ankle: [number, number, number] = [foot[0], foot[1], foot[2] + LEG.ankle]
  const dx = ankle[0] - hip[0]
  const dy = ankle[1] - hip[1]
  const dz = ankle[2] - hip[2]
  const d = Math.max(1, Math.hypot(dx, dy))
  const full = Math.max(1, Math.hypot(d, dz))
  const D = Math.min(LEG.a + LEG.b - 2, Math.max(Math.abs(LEG.a - LEG.b) + 2, full))
  const ax: [number, number, number] = [dx / full, dy / full, dz / full]
  const inner = Math.acos(Math.min(1, Math.max(-1, (LEG.a * LEG.a + D * D - LEG.b * LEG.b) / (2 * LEG.a * D))))
  // The upright direction square to the line, and the level one square to both.
  const hx = dx / d
  const hy = dy / d
  const up0: [number, number, number] = [-hx * ax[2], -hy * ax[2], d / full]
  const side: [number, number, number] = [ax[1] * up0[2] - ax[2] * up0[1], ax[2] * up0[0] - ax[0] * up0[2], ax[0] * up0[1] - ax[1] * up0[0]]
  const along = LEG.a * Math.cos(inner)
  const off = LEG.a * Math.sin(inner)
  const c = Math.cos(lean)
  const sn = Math.sin(lean)
  const knee: [number, number, number] = [
    hip[0] + ax[0] * along + (up0[0] * c + side[0] * sn) * off,
    hip[1] + ax[1] * along + (up0[1] * c + side[1] * sn) * off,
    hip[2] + ax[2] * along + (up0[2] * c + side[2] * sn) * off
  ]
  const ux = knee[0] - hip[0]
  const uy = knee[1] - hip[1]
  const lx = ankle[0] - knee[0]
  const ly = ankle[1] - knee[1]
  return { knee, yaw: Math.atan2(uy, ux), up: Math.atan2(knee[2] - hip[2], Math.hypot(ux, uy)), yaw2: Math.atan2(ly, lx), down: Math.atan2(ankle[2] - knee[2], Math.hypot(lx, ly)) }
}

export function poseOf(view: BossView, o: LookOptions = DEFAULTS): Pose {
  const b = view.boss
  const now = view.time
  const f = clamp01(b.form)
  const t = clamp01(b.turret)
  const beaten = clamp01(b.beaten)
  // Beaten, he is thrown to where the button will lie and skids to rest there, turned level: the blast is aimed there.
  const slide = outCubic(lin(beaten, LEFT.slide[0], LEFT.slide[1]))
  const turn = Math.atan2(Math.sin(Math.PI - b.heading), Math.cos(Math.PI - b.heading))
  const yaw = -b.heading - turn * slide
  const wx = mix(b.x, LEFT.x, slide) - 960
  const wy = 540 - mix(b.y, LEFT.y, slide)

  // The forming.
  const u = lin(f, FORM.launch, FORM.land)
  const flying = f >= FORM.launch && f < FORM.land
  const low = -(HULL.belly - 28)
  const stand = f >= 1 ? 1 : outBack(lin(f, FORM.stand[0], FORM.stand[1]), 2.2)
  const landed = f >= FORM.land
  const bounce = landed ? 26 * Math.abs(Math.sin(lin(f, FORM.land, FORM.land + 0.09) * Math.PI * 2)) * (1 - lin(f, FORM.land, FORM.land + 0.09)) : 0
  let bodyZ = landed ? mix(low, 0, stand) + bounce : 0
  const buttonRest = 14 / K - BTN.tall
  let buttonZ = BTN.z
  if (!landed) {
    const zb = f < FORM.launch ? buttonRest - 5 * prog(f, 0, FORM.launch) : mix(buttonRest, BTN.z + low, u) + FORM.arc * 4 * u * (1 - u)
    bodyZ = zb - BTN.z
    buttonZ = BTN.z
  }
  const press = prog(f, FORM.press[0], FORM.press[1])
  const sx = mix(PAGE_BTN.w / K / BTN.w, 1, press)
  const sy = mix(PAGE_BTN.h / K / BTN.h, 1, press)
  const shake = f > 0 && f < FORM.launch ? (0.3 + 0.7 * f / FORM.launch) * 7 : 0
  const jx = shake * (hash01(Math.floor(now * 60), 1, o.seed) - 0.5)
  const jy = shake * (hash01(Math.floor(now * 60), 2, o.seed) - 0.5)
  const clamp = outCubic(lin(f, FORM.clamp[0], FORM.clamp[1]))
  const toSocket: [number, number] = rot((o.socket.x - b.x) / K, -(o.socket.y - b.y) / K, -yaw)
  const hull = { x: toSocket[0] * (1 - clamp), y: toSocket[1] * (1 - clamp), z: -(bodyZ + HULL.top + 40) * (1 - clamp), show: f >= FORM.clamp[0] }
  const flightPitch = 0
  void flying
  const wingA = f >= 1 ? 1 : outBack(lin(f, FORM.wingA[0], FORM.wingA[1]), 2.4)
  const wingB = f >= 1 ? 1 : outBack(lin(f, FORM.wingB[0], FORM.wingB[1]), 2.4)
  const gunsUp = f >= 1 ? 1 : outBack(lin(f, FORM.guns[0], FORM.guns[1]), 2)
  const shieldUp = f >= 1 ? 1 : outBack(lin(f, FORM.shield[0] + 0.05, FORM.shield[1]), 1.6)
  const shieldOut = f >= 1 ? 1 : outCubic(lin(f, FORM.shield[0], FORM.shield[0] + 0.07))

  // The turret beat.
  const hatchOpen = smooth(lin(t, TURRET.hatch[0], TURRET.hatch[1]))
  const rise = outCubic(lin(t, TURRET.rise[0], TURRET.rise[1]))
  const sw = lin(t, TURRET.swing[0], TURRET.swing[1])
  const swing = inQuad(sw)
  const lockedAt = (b as { lockedAt?: number | null }).lockedAt
  const lockAge = t < TURRET.lock ? -1 : t < 1 ? (t - TURRET.lock) * TIMES.turret : typeof lockedAt === 'number' ? now - lockedAt + (1 - TURRET.lock) * TIMES.turret : 99
  const lockU = clamp01(lockAge / TURRET.kick)
  const lockKick = lockAge >= 0 && lockAge < TURRET.kick ? Math.sin(Math.PI * Math.sqrt(lockU)) * (1 - lockU) : 0
  const stow = 150 - 597
  const cannonZ = mix(stow, CANNON.z + 60, rise) - 60 * swing
  const elev = (Math.PI / 2) * (1 - swing) + (t >= TURRET.lock ? -0.035 * lockKick : 0)
  const glowUp = prog(t, TURRET.glow[0], TURRET.glow[1])

  // The fight: guns, the big cannon, hits.
  const big = b.big
  const charge = big ? clamp01(big.tell) : 0
  const blastAge = big ? since(now, big.firedAt) : -1
  const blast = kick(blastAge, TIMES.recoil)
  const beamOn = blastAge >= 0 && blastAge < TIMES.beam
  const brace = charge * 10 + (beamOn ? 6 : 0)
  const hitAge = since(now, b.hitAt)
  const hurt = kick(hitAge, TIMES.hit)
  const heal = hitAge >= 0 && b.healedAt !== null && b.healedAt > (b.hitAt ?? -1e9) ? 0 : bump(since(now, b.healedAt), 0, TIMES.heal)
  const healNow = bump(since(now, b.healedAt), 0, TIMES.heal)
  void heal
  const fall = lin(beaten, FALL.drop[0], FALL.drop[1])
  const sagPart = fall * fall
  const settle = Math.sin(Math.PI * lin(beaten, FALL.drop[1], FALL.drop[1] + 0.2))
  const tremble = charge > 0 && !beamOn && blastAge < 0 ? charge * charge * 2.2 : 0
  const tj = (k: number): number => tremble * (hash01(Math.floor(now * 60), k, o.seed + 9) - 0.5)
  const walkBob = WALK.bob * Math.sin((b.walked / WALK.pitch) * Math.PI) * Math.sin((b.walked / WALK.pitch) * Math.PI)
  const recoilBack = 64 * blast
  const hurtShove = 9 * hurt

  const gone = clamp01(b.gone ?? 0)
  const formed = f >= 1
  const body = {
    x: -recoilBack - hurtShove + tj(1), y: tj(2),
    z: bodyZ - brace - 16 * lockKick - (formed ? walkBob : 0) - 84 * sagPart + 9 * settle - 14 * blast,
    yaw, pitch: flightPitch + 0.05 * blast - 0.012 * charge, roll: formed && beaten <= 0 ? 0.012 * Math.sin((b.walked / WALK.pitch) * Math.PI) : 0
  }

  if (gone > 0) {
    const down = lin(gone, GONE.button[0], GONE.button[1])
    buttonZ = mix(buttonZ, -body.z, down * down) 
  }
  // The fist is on the button from boss.pressedAt for as long as that is set; boss.releasedAt, if the view carries it, is the moment the fist leaves.
  const upAt = (b as { releasedAt?: number | null }).releasedAt ?? null
  const downAge = since(now, b.pressedAt ?? null)
  const upAge = since(now, upAt)
  const fist = downAge < 0 ? 0 : upAge >= 0 ? 1 - outBack(lin(upAge, 0, PRESS.back), 2.4) : clamp01(downAge / PRESS.down)
  buttonZ -= PRESS.deep * fist
  const span = (r: readonly [number, number]): number => lin(gone, r[0], r[1])
  const away = {
    shield: span(GONE.shield), wings: [span(GONE.wings[0]), span(GONE.wings[1])] as [number, number], guns: [span(GONE.guns[0]), span(GONE.guns[1])] as [number, number],
    legs: [span(GONE.legs[0]), span(GONE.legs[1]), span(GONE.legs[2]), span(GONE.legs[3])] as [number, number, number, number], bay: span(GONE.bay), hull: span(GONE.hull),
    plates: Array.from({ length: 7 }, (_, i) => lin(gone, GONE.hull[0] + GONE.plate[0] * i, GONE.hull[0] + GONE.plate[0] * i + GONE.plate[1]))
  }
  const fin = view.finish ?? view.scorch
  const from = fin ? [fin.x0, fin.y0] : [view.arrow.x, view.arrow.y]
  const to = fin ? [fin.x1, fin.y1] : [wx + 960, 540 - wy]
  const bl = Math.hypot(to[0]! - from[0]!, to[1]! - from[1]!) || 1
  const blow: [number, number] = fin || gone < 1 ? [(to[0]! - from[0]!) / bl, -(to[1]! - from[1]!) / bl] : [1, 0]

  // Legs.
  const legs: LegPose[] = HIPS.map(([hx, hy], i) => {
    const start = FORM.legs[i]!
    const out = f >= 1 ? 1 : lin(f, start, start + FORM.legTime)
    const show = f >= 1 ? 1 : f >= start ? 1 : 0
    const [rx, ry] = rot(hx + body.x, hy + body.y, yaw)
    const hip: [number, number, number] = [rx, ry, LEG.hipZ + body.z]
    const p = footAt(i, wx, wy, yaw, o)
    const planted: [number, number] = [p.x, p.y]
    let foot: [number, number, number] = [(p.x - wx) / K, (p.y - wy) / K, p.lift * WALK.lift]
    if (out < 1) {
      const [tx, ty] = rot(hx * 1.25, hy * 1.5, yaw)
      const reach = outCubic(lin(out, 0, 0.7))
      const drop = lin(out, 0.7, 1)
      foot = [mix(tx, foot[0], reach), mix(ty, foot[1], reach), mix(60 + body.z + 40, 0, 0) + (1 - drop * drop) * (150 + 120 * Math.sin(Math.PI * lin(out, 0, 0.7)))]
    }
    if (sagPart > 0) foot = [foot[0] * (1 + 0.16 * sagPart), foot[1] * (1 + 0.16 * sagPart), foot[2]]
    const ik = legIk(hip, foot, (hx * hy > 0 ? 1 : -1) * LEG.lean)
    return { hip, knee: ik.knee, foot, yaw: ik.yaw, up: ik.up, yaw2: ik.yaw2, down: ik.down, footYaw: Math.atan2(foot[1] - hip[1], foot[0] - hip[0]), lift: p.lift, show, planted }
  })

  const guns = b.guns.map((g, i) => {
    const age = since(now, g.firedAt)
    const k = kick(age, TIMES.gunKick)
    const idle = f < 1 ? (gunsUp >= 1 ? 0.5 * Math.sin(lin(f, FORM.guns[1], 1) * Math.PI * 2) * (i === 0 ? 1 : -1) : 0) : 0
    return {
      yaw: (formed ? -g.aim - yaw : idle), recoil: 16 * k + 7 * clamp01(g.tell), spin: (age >= 0 ? Math.min(age, 0.6) * 38 : 0) + g.tell * g.tell * 9 + (f < 1 ? gunsUp * 12 : 0),
      lamp: g.tell > 0 ? 0.6 + 3.4 * g.tell * (0.5 + 0.5 * Math.sin(now * 38)) : 0.15, flash: age >= 0 && age < 0.07 ? 1 - age / 0.07 : 0, rise: gunsUp
    }
  }) as [GunPose, GunPose]

  const off = lin(beaten, FALL.off[0], FALL.off[1])
  const cannon = {
    show: t > TURRET.rise[0] && off < 1, x: mix(CANNON.bayX, CANNON.pivotX, smooth(sw)), z: cannonZ, elev, yaw: 0,
    ribs: -225 * (1 - prog(t, 0.44, 0.6)), sleeve: -295 * (1 - prog(t, 0.5, 0.68)), barrel: -640 * (1 - (t >= 1 ? 1 : outBack(lin(t, 0.6, 0.92), 1.2))) - 46 * blast - 20 * charge,
    window: 0.2 + 1.15 * glowUp + 2.2 * charge + (beamOn ? 5 : 0) + 1.5 * kick(blastAge, TIMES.after), bore: 0.05 + 1.2 * kick(lockAge, 0.4) + 0.5 * glowUp + 7 * charge * charge + (beamOn ? 14 : 0),
    slits: 0.2 + 1.3 * prog(t, 0.92, 1) + 2 * charge, heat: clamp01(kick(blastAge, TIMES.after) * 1.4), off
  }

  const cw = Math.cos(yaw)
  const sw2 = Math.sin(yaw)
  const wxm = body.x * K
  const wym = body.y * K
  const word = {
    x: 960 + wx + (wxm * cw - wym * sw2), y: 540 - (wy + (wxm * sw2 + wym * cw)), z: (body.z + buttonZ + BTN.tall) * K + 0.3,
    rot: -yaw - Math.PI, show: !(cannon.show && sw > 0.55) || off >= 0.3
  }

  return {
    x: wx, y: wy, shown: f > 0 || view.phase !== 'form', body, hull,
    button: { z: buttonZ, sx: sx * (1 - PRESS.squash * fist), sy: sy * (1 - PRESS.squash * fist), jx, jy, glow: bump(f, 0, FORM.launch + 0.02) },
    wings: [wingA, wingB],
    hatch: { x: HATCH.cx - HATCH.slide * hatchOpen, z: HATCH.top + 7 * bump(t, TURRET.hatch[0], TURRET.hatch[0] + 0.06) + (hatchOpen > 0 ? 3 * hatchOpen : 0), seam: 1.4 + 3 * bump(t, 0, 0.2) + 0.6 * Math.sin(now * 3) * 0.3, gone: off },
    shield: { rise: shieldUp, slide: shieldOut, flash: kick(since(now, b.shield.glancedAt), TIMES.glance), broken: lin(beaten, FALL.glass[0], FALL.glass[1]), show: f >= FORM.shield[0] },
    guns, legs, cannon,
    weak: b.weak ? (b.weak.shownAt === null ? 0 : 2.2 + 3 * (0.5 + 0.5 * Math.sin((now - b.weak.shownAt) * 16))) : 0,
    weakOpen: b.weak && b.weak.shownAt !== null && beaten <= 0 ? smooth(lin(now - b.weak.shownAt, 0, 0.18)) : 0,
    damage: f < 1 ? 0 : beaten > 0.02 ? 3 : b.stage, hurt, heal: healNow, sag: sagPart, gone, away, left: span(GONE.left), landed: GONE.land.map((r) => span(r)), lit: gone > 0 && gone < 1 ? smooth(lin(gone, 0, 0.06)) * (1 - smooth(lin(gone, 0.9, 1))) : 0, press: fist, blow, lockAge, word
  }
}

// Where the muzzle of gun i is, page px.
export function muzzleOf(view: BossView, i: 0 | 1): { x: number; y: number; z: number; aim: number } {
  const b = view.boss
  const side = i === 0 ? 1 : -1
  const [gx, gy] = rot(GUN.x * K, side * GUN.y * K, -b.heading)
  const aim = b.guns[i]!.aim
  return { x: b.x + gx + Math.cos(aim) * GUN.reach * K, y: b.y - gy + Math.sin(aim) * GUN.reach * K, z: (GUN.z - 3 + GUN.axis) * K, aim }
}

// Where the mouth of the big cannon is when locked, page px.
export function bigMuzzleOf(view: BossView): { x: number; y: number; z: number; aim: number } {
  const b = view.boss
  const reach = (CANNON.pivotX + CANNON.brake[1]) * K
  return { x: b.x + Math.cos(b.heading) * reach, y: b.y + Math.sin(b.heading) * reach, z: CANNON.z * K, aim: b.heading }
}

// The open flank, page px: the rear of the hull, behind the hatch.
export function weakOf(view: BossView): { x: number; y: number } {
  const b = view.boss
  const back = (HATCH.cx - HATCH.hx) * K
  return { x: b.x + Math.cos(b.heading) * back, y: b.y + Math.sin(b.heading) * back }
}

export const wordAt = (view: BossView, o: LookOptions = DEFAULTS): Pose['word'] => poseOf(view, o).word

// His size in the fight, page px, measured in the targets and scaled.
export const SIZE = {
  scale: K,
  hull: { long: 2 * HULL.hx * K, wide: 2 * HULL.hy * K },
  wings: { wide: 2 * (HULL.hy + 151) * K },
  hatch: { from: (HATCH.cx + HATCH.hx) * K, to: (HATCH.cx - HATCH.hx) * K },
  shield: { ahead: SHIELD.mid * K, half: SHIELD.half * K, cover: Math.atan2(SHIELD.half, SHIELD.mid - 38) },
  feet: { long: 2 * 445 * K, wide: 2 * 435 * K },
  guns: { x: GUN.x * K, y: GUN.y * K, reach: GUN.reach * K },
  big: { muzzle: (CANNON.pivotX + CANNON.brake[1]) * K, pivot: CANNON.pivotX * K, height: CANNON.z * K },
  button: { w: BTN.w * K, h: BTN.h * K },
  tall: { deck: HULL.top * K, knee: 250 * K, cannon: (CANNON.z + 79) * K }
} as const

// For the arrow's fist: where the button is on the page, its size and its turn, and how far it is down (0 to 1).
export function buttonAt(view: BossView, o: LookOptions = DEFAULTS): { x: number; y: number; w: number; h: number; rot: number; top: number; press: number } {
  const p = poseOf(view, o)
  return { x: p.word.x, y: p.word.y, w: BTN.w * K * p.button.sx, h: BTN.h * K * p.button.sy, rot: p.word.rot, top: p.word.z, press: p.press }
}

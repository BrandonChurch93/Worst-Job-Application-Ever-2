// The acting of the standing arrow in the power-up, the finishing blast and the last moment, as plain numbers.
// Everything is a pure function of the marks (view times at which a thing began) and the view time. No clock, no random.
import { POSES, STAND, WALK, at, clamp01, feetFor, inCubic, mixPose, outBack, outCubic, smooth, span, stepsBy, toPage, walkPose, type StandPose, type V3 } from '../../cursor/stand/rig'

export interface FinishMarks {
  // The arms come out. The arrow starts to get up `LEAD` before, or at `stand` when it is given.
  arms?: number
  stand?: number
  // The charge begins: the hands go to the hip.
  charge?: number
  // The hands thrust the ball forward, toward the target, and hold it there until the beam leaves (`FIRE.ahead` before `fire` is what the film uses). Left out, the thrust plays after `fire`, as the visitor's own shot does: nobody knows ahead when a visitor lets go.
  thrust?: number
  // The blast is let go.
  fire?: number
  // The beam ends.
  end?: number
  // It sets off for the button.
  walk?: number
  // It falls to its knees.
  kneel?: number
  // The right fist starts to rise.
  fist?: number
  // The fist lands on the button: the press of Submit.
  press?: number
}

export interface FinishInput {
  // The view time, seconds.
  time: number
  // Where the tip of the lying arrow is when it gets up, page px.
  arrow: { x: number; y: number }
  // The power-up: when it gets up, and when the flame lets go and it lies down again. Without `end` it lets go `POWER.hold` after `at`.
  // `until`, when given, is the view time by which it must lie on the page again: the whole power-up is fitted between `at` and `until`, its moves played quicker so the fists are held for `POWER.held` at least. It takes the place of `end`.
  power?: { at: number; end?: number; until?: number } | null
  marks?: FinishMarks
  // How full the charge is now, 0 to 1, and how full it was when it was let go.
  charge?: number
  shot?: number
  // On the walk: where the middle of the feet is, how far it has walked in px, and 0 to 1 how much it is moving (1 when left out).
  walk?: { x: number; y: number; walked: number; pace?: number } | null
  // The Submit button as it lies on the ground: its middle, its width and the height of its top.
  button?: { x: number; y: number; w?: number; h?: number; top?: number } | null
  // Where the blast goes: the fallen boss. Without it the blast goes to the button, or to the right.
  target?: { x: number; y: number } | null
  // The figure's size during the power-up and the finish: `SCALE` when left out (1 is the cursor's own size).
  scale?: number
  // 0 to 1: the warm rim of ember light on the legs, the arms and the gloves. Left out, the figure has it from the end of the beam on (see `emberOf`).
  ember?: number
}

export interface Fx {
  // The gold flame, 0 to 1 and a little over at the burst, and where it stands.
  aura: number
  burst: number
  // The ring of flame on the ground, 0 to 1.
  ring: number
  // The gold crackle round the figure while it charges and fires, 0 to 1.
  crackle: number
  // The ball between the hands: its place, its size in px and how bright, 0 to 1.
  ball: { x: number; y: number; z: number; size: number; glow: number } | null
  // The beam: from the wrists, its heading on the page, how open it is (0 to 1), how full, and the seconds since it left the hands.
  // `keep` is the button the beam parts round: its middle, width and height on the page.
  beam: { x: number; y: number; z: number; aim: number; open: number; power: number; age: number; keep: { x: number; y: number; w: number; h: number } | null } | null
  // The skid of each shoe: from where it stood to where it stands, and how dark.
  skid: { x0: number; y0: number; x1: number; y1: number; k: number }[]
  // A wisp at each hand: where, how much, and its age in seconds.
  smoke: { x: number; y: number; z: number; k: number; age: number }[]
  // Dust: where, how old in seconds, how big.
  dust: { x: number; y: number; age: number; size: number }[]
  // The scuff each landed step left: page px, and how long.
  scuffs: { x: number; y: number; long: number }[]
}

export interface FinishState {
  // True while the figure is drawn: the ordinary arrow is hidden for as long.
  up: boolean
  pose: StandPose
  fx: Fx
  // The middle of the feet now, page px: where a walk starts from.
  feet: { x: number; y: number }
  // 0 to 1: how far the button is pressed down under the fist.
  press: number
}

// The figure's size when the fight gives none: with the close view (twice the film size) it stands about 210 film px tall, as in the approved pictures.
export const SCALE = 1.5
export const GETUP = 0.95
export const LEAD = 0
export const LIEDOWN = 0.8
export const POWER = {
  hold: 3.4, // s from getting up to the burst when no end is given
  dip: [0.95, 1.22] as const, // s: the dip before the fists go up
  up: [1.22, 1.6] as const, // s: the fists go up
  burst: 0.5, // s from the burst to the start of lying down
  lead: 0.75, // s after getting up at which the flame starts to build
  held: 1.1, // s the fists are held when the power-up is fitted to `until`
  quickest: 0.55 // the moves are never played in less than this share of their own time, unless the window is shorter than they are
} as const
export const CHARGE = { sweep: 0.45, ball: 21, least: 0.25, aura: 0.3 } as const
export const FIRE = {
  coil: 0.1, // s the figure coils before the thrust
  lead: 0.2, // s after the mark at which the beam leaves the hands
  ahead: 0.45, // s before the fire mark at which the film's thrust starts
  reach: 0.2, // s the thrust with the ball takes, after the coil
  snap: 0.06, // s from the held thrust to the hands furthest out, as the beam leaves
  thrust: 0.25, // s after the mark at which the hands are furthest out
  settle: 0.48,
  open: 0.1, // s the beam takes to open
  shove: 38, // px a full blast shoves the figure back
  slide: 0.24, // s, the time constant of the skid
  close: 0.32, // s the beam takes to die after its end
  hang: 0.12, // s after the end the arms stay out
  drop: 0.6, // s the arms take to fall
  smoke: 3.6 // s the hands smoke
} as const
export const LAST = {
  sway: 0.1, // s it sways before the knees give
  land: 0.4, // s after the mark at which the knees land
  down: 0.68, // s after the mark at which it has settled on its knees
  breath: 0.6, // s one breath takes
  dip: 0.1, // s it dips before the fist goes up
  up: 0.42, // s after the fist mark at which the fist is high
  back: 0.3, // s before the press at which the fist draws back a last time
  blow: 0.14, // s the fist takes to come down
  follow: 0.1, // s after the fist lands in which the body is thrown down after it
  sag: 0.35, // s the body takes to sink over the fist after that
  // What a helper who sets the marks should leave between them: kneel to fist, fist to press.
  gaps: [1.3, 0.9] as const
} as const

const inQuad = (v: number): number => clamp01(v) * clamp01(v)
const none = (): Fx => ({ aura: 0, burst: 0, ring: 0, crackle: 0, ball: null, beam: null, skid: [], smoke: [], dust: [], scuffs: [] })

function getUp(t: number): StandPose {
  const a = mixPose(POSES.lying, POSES.set, outBack(span(t, 0, 0.22)))
  const b = mixPose(a, { ...POSES.set, hip: [0, 25], stretch: 0.92, rise: 0.06 }, smooth(span(t, 0.2, 0.4)))
  const c = mixPose(b, { ...POSES.ready, arms: 0, hip: [0, 35], stretch: 1.06, rise: 1.08, lean: -0.02 }, outCubic(span(t, 0.4, 0.68)))
  return mixPose(c, POSES.ready, smooth(span(t, 0.62, GETUP)))
}

function lieDown(from: StandPose, t: number): StandPose {
  const a = mixPose(from, { ...POSES.ready, arms: 0, rise: 1.05, hip: [0, 34], lean: 0, stretch: 1.03 }, smooth(span(t, 0, 0.26)))
  const b = mixPose(a, { ...POSES.set, stretch: 0.93 }, inCubic(span(t, 0.2, 0.52)))
  const c = mixPose(b, { ...POSES.set, stretch: 1.03 }, smooth(span(t, 0.52, 0.62)))
  return mixPose(c, POSES.lying, smooth(span(t, 0.58, LIEDOWN)))
}

const breathe = (p: StandPose, time: number, much = 1): StandPose => {
  const b = Math.sin(time * 2.6)
  return { ...p, hip: [p.hip[0], p.hip[1] + 0.7 * b * much], stretch: p.stretch + 0.008 * b * much }
}

function handsMid(p: StandPose): V3 {
  return [(p.hands[0][0] + p.hands[1][0]) / 2, (p.hands[0][1] + p.hands[1][1]) / 2, (p.hands[0][2] + p.hands[1][2]) / 2 + 3]
}

// The knees stay `clear` px off the button's near end (its dark rim is about 19 px); the fist lands `on` px in from that end, at most `reach` px ahead of the feet.
// `hand`: how far short of the button's near end a hanging hand stays while the figure walks up to it and stands there.
export const KNEEL = { clear: 36, on: 27, reach: 60, below: 6, hand: 10 } as const
const fistX = (button: { x: number; w?: number }, feetX: number, scale = SCALE): number => Math.min(feetX + KNEEL.reach * scale, button.x - (button.w ?? 110) / 2 + KNEEL.on)

// Where the feet's middle should be for the fist to land on the button: before its near end, never on it.
export function kneelSpot(button: { x: number; y: number; w?: number }, scale = SCALE): { x: number; y: number } {
  return { x: button.x - (button.w ?? 110) / 2 - KNEEL.clear * scale, y: button.y + KNEEL.below * scale }
}

// The ember rim on the rubber: what the fight says, or by itself from the end of the beam on, when the ground under the figure is burnt.
export function emberOf(i: FinishInput): number {
  if (i.ember !== undefined) return clamp01(i.ember)
  const end = i.marks?.end
  return end === undefined ? 0 : smooth(span(i.time - end, 0, 0.5))
}

// How a power-up is laid out in time, in seconds after `at`: `quick` is the share of their own time its moves take (1 as written), `end` is when the flame lets go, `over` is when it lies on the page again.
export function powerPlan(pw: { at: number; end?: number; until?: number }): { quick: number; end: number; over: number } {
  const tail = POWER.burst + LIEDOWN
  if (pw.until === undefined) {
    const end = (pw.end ?? pw.at + POWER.hold) - pw.at
    return { quick: 1, end, over: end + tail }
  }
  const whole = Math.max(0.3, pw.until - pw.at)
  const moves = POWER.up[1] + tail
  const quick = Math.min(1, Math.max((whole - POWER.held) / moves, Math.min(POWER.quickest, whole / moves)))
  return { quick, end: whole - tail * quick, over: whole }
}

function powerUp(i: FinishInput, feet: { x: number; y: number }): FinishState | null {
  const pw = i.power
  if (!pw) return null
  const plan = powerPlan(pw)
  const end = plan.end
  const now = i.time - pw.at
  if (now < 0 || now >= plan.over) return null
  // The moves run on their own time; the hold between them runs on the view's.
  const t = now / plan.quick
  let pose = getUp(t)
  pose = mixPose(pose, POSES.powerDip, smooth(span(t, POWER.dip[0], POWER.dip[1])))
  pose = mixPose(pose, POSES.power, outBack(span(t, POWER.up[0], POWER.up[1]), 2.2))
  const build = smooth(span(now, POWER.lead * plan.quick, end))
  const held = span(now, POWER.up[1] * plan.quick, end)
  if (t >= POWER.up[1]) pose = { ...pose, tremble: 0.15 + 0.5 * held, hip: [0, pose.hip[1] - 2.5 * held], puff: 0.35 + 0.3 * held }
  const fx = none()
  fx.ring = 1
  const u = (now - end) / plan.quick
  if (u < 0) fx.aura = 0.12 + 0.88 * build
  else {
    // The burst: everything flung open for a moment, then let go.
    const open: StandPose = { ...POSES.power, hip: [0, 33], stretch: 1.09, hands: [[-52, 70, 6], [54, 72, 6]], puff: 0.8, tremble: 0.2 }
    pose = mixPose(pose, open, outCubic(span(u, 0, 0.12)))
    pose = mixPose(pose, POSES.ready, smooth(span(u, 0.2, POWER.burst)))
    pose = lieDown(pose, u - POWER.burst)
    fx.aura = (1 - smooth(span(u, 0.1, 0.75))) * 1.0
    fx.burst = u < 0.6 ? u / 0.6 : 0
  }
  return { up: true, pose: { ...at(pose, feet.x, feet.y), scale: 1 + ((i.scale ?? SCALE) - 1) * clamp01(pose.legs) }, fx, feet, press: 0 }
}

// What the figure looks like and what burns round it at one moment.
export function finishState(i: FinishInput): FinishState {
  const home = feetFor(i.arrow)
  const m = i.marks ?? {}
  const t = i.time
  const sc = i.scale ?? SCALE
  const rise0 = m.arms === undefined ? undefined : m.stand ?? m.arms - LEAD
  if (rise0 === undefined || t < rise0) {
    const p = powerUp(i, home)
    if (p) return p
    return { up: false, pose: at(POSES.lying, home.x, home.y), fx: none(), feet: home, press: 0 }
  }
  const fx = none()
  const shot = clamp01(i.shot ?? i.charge ?? 1)
  // The rise plays under whatever follows it. A blast let go before it is over quickens what is left of it to end as the beam leaves.
  let risen = t - rise0
  if (m.fire !== undefined && t >= m.fire && m.fire - rise0 < GETUP) risen = m.fire - rise0 + ((t - m.fire) / FIRE.lead) * (GETUP - (m.fire - rise0))
  const rising = getUp(risen)
  let pose = breathe(rising, t, smooth(span(risen, GETUP, GETUP + 0.5)))
  let feet = { ...home }
  let press = 0

  if (m.charge !== undefined && t >= m.charge) {
    const c = t - m.charge
    const share = m.fire !== undefined && t >= m.fire ? shot : clamp01(i.charge ?? 0)
    const reach: StandPose = { ...POSES.ready, hands: [[-30, 40, 8], [44, 42, 8]], hip: [0, 32], lean: -0.14 }
    const cup = mixPose(POSES.charge0, POSES.charge1, share)
    cup.tremble = 0.1 + 0.55 * share
    pose = mixPose(pose, reach, smooth(span(c, 0, 0.1)))
    pose = mixPose(pose, cup, outBack(span(c, 0.08, CHARGE.sweep), 1.3))
    const grown = smooth(span(c, 0.22, CHARGE.sweep + 0.25))
    const fired = m.fire !== undefined ? t - m.fire : -1
    const held = m.thrust !== undefined ? t - m.thrust : -1
    if (fired < FIRE.lead) {
      const hot = fired >= 0 ? 1 + 0.5 * (fired / FIRE.lead) : 1
      const pulse = 1 + 0.05 * Math.sin(t * 31) * share
      const size = sc * CHARGE.ball * (CHARGE.least + (1 - CHARGE.least) * share) * grown * pulse
      if (held >= 0) {
        // The ball goes forward with both hands and is held there: the beam leaves from in front of the figure.
        pose = mixPose(pose, POSES.coil, outCubic(span(held, 0, FIRE.coil)))
        pose = mixPose(pose, POSES.aim, outBack(span(held, FIRE.coil, FIRE.coil + FIRE.reach), 1.2))
        pose.tremble = 0.1 + 0.45 * share
      } else if (fired >= 0) {
        pose = mixPose(pose, POSES.coil, outCubic(span(fired, 0, FIRE.coil)))
        pose = mixPose(pose, POSES.fireOver, inQuad(span(fired, FIRE.coil, FIRE.thrust)))
      }
      const h = handsMid(pose)
      const b = toPage({ x: feet.x, y: feet.y, ground: 0, rise: pose.rise, scale: sc }, h[0], h[1], h[2])
      if (size > 1) fx.ball = { x: b.x, y: b.y, z: b.z, size, glow: clamp01((0.35 + 0.65 * share) * grown) * hot }
      fx.aura = CHARGE.aura * share * grown
      fx.crackle = share * grown
    }
    if (fired >= FIRE.lead && m.fire !== undefined) {
      const over = m.end !== undefined ? t - m.end : -1
      // The shove: the feet skid back while the beam stands.
      const pushed = (over >= 0 ? m.end! : t) - m.fire - FIRE.lead
      const back = sc * FIRE.shove * shot * (1 - Math.exp(-pushed / FIRE.slide))
      feet = { x: home.x - back, y: home.y }
      pose = held >= 0 ? mixPose(POSES.aim, POSES.fireOver, outCubic(span(fired, FIRE.lead, FIRE.lead + FIRE.snap))) : mixPose(POSES.coil, POSES.fireOver, inQuad(span(fired, FIRE.coil, FIRE.thrust)))
      pose = mixPose(pose, POSES.fire, smooth(span(fired, held >= 0 ? FIRE.lead + FIRE.snap : FIRE.thrust, FIRE.settle)))
      const push = over < 0 ? 1 : 1 - smooth(span(over, 0, FIRE.close))
      pose.tremble = 0.55 * shot * push
      // The beam's kick runs up the arms.
      pose.hands = [[pose.hands[0][0] - 2.5 * push * Math.sin(t * 47), pose.hands[0][1], pose.hands[0][2]], [pose.hands[1][0] - 2.5 * push * Math.sin(t * 47 + 1.3), pose.hands[1][1], pose.hands[1][2]]]
      const h = handsMid(pose)
      const b = toPage({ x: feet.x, y: feet.y, ground: 0, rise: pose.rise, scale: sc }, h[0] + 9, h[1], h[2])
      const to = i.target ?? i.button ?? { x: b.x + 800, y: b.y }
      const aim = Math.atan2(to.y - b.y, to.x - b.x)
      const open = smooth(span(fired, FIRE.lead, FIRE.lead + FIRE.open)) * push
      // The ball does not go out before the beam is there: it is spent into the beam as it opens.
      const opening = smooth(span(fired, FIRE.lead, FIRE.lead + FIRE.open))
      if (opening < 1) fx.ball = { x: b.x, y: b.y, z: b.z, size: sc * CHARGE.ball * (CHARGE.least + (1 - CHARGE.least) * shot) * (1 - 0.4 * opening), glow: clamp01(0.35 + 0.65 * shot) * 1.5 * (1 - opening) }
      if (open > 0.002) fx.beam = { x: b.x, y: b.y, z: b.z, aim, open, power: shot, age: fired - FIRE.lead, keep: i.button ? { x: i.button.x, y: i.button.y, w: i.button.w ?? 110, h: i.button.h ?? (i.button.w ?? 110) * 0.36 } : null }
      fx.aura = CHARGE.aura * shot * push
      fx.crackle = shot * push
      for (let k = 0; k < 2; k++) {
        const f = POSES.fire.feet[k]!
        const long = back / sc + (k === 0 ? 10 : 4)
        fx.skid.push({ x0: feet.x + sc * (f[0] + long), y0: feet.y + sc * (k === 0 ? 2 : -3), x1: feet.x + sc * (f[0] - 3), y1: feet.y + sc * (k === 0 ? 2 : -3), k: clamp01(back / (12 * sc)) })
      }
      if (over >= 0) {
        const hang = mixPose(POSES.fire, { ...POSES.fire, strain: 0.2, hip: [7, 23], lean: -0.26, hands: [[55, 27, 14], [57, 19, 15]] }, smooth(span(over, 0, FIRE.hang)))
        const d = span(over, FIRE.hang, FIRE.hang + FIRE.drop)
        pose = mixPose(hang, POSES.spent, outBack(d, 1.1))
        // The arms swing out their fall.
        const swing = 5 * Math.sin((over - FIRE.hang) * 9) * Math.exp(-(over - FIRE.hang) * 2.6) * (over > FIRE.hang ? 1 : 0)
        pose.hands = [[pose.hands[0][0] + swing, pose.hands[0][1], pose.hands[0][2]], [pose.hands[1][0] + swing * 0.8, pose.hands[1][1], pose.hands[1][2]]]
        pose = breathe(pose, t, 2.2 * smooth(span(over, FIRE.hang + FIRE.drop, FIRE.hang + FIRE.drop + 0.4)))
      }
    }
  }

  if (risen < GETUP) pose = { ...pose, rise: rising.rise, legs: rising.legs, arms: rising.arms, stretch: pose.stretch * rising.stretch }

  let dir = 1
  if (m.walk !== undefined && t >= m.walk) {
    const w = i.walk ?? { x: feet.x, y: feet.y, walked: 0 }
    dir = i.button && i.button.x < w.x ? -1 : 1
    const stride = walkPose(w.walked / sc, dir)
    const moving = smooth(span(t - m.walk, 0, 0.4)) * clamp01(w.pace ?? 1)
    const falling = pose.hands
    pose = mixPose({ ...pose, toes: [dir, dir], knees: [dir, dir] }, stride, moving)
    // The arms go on dropping through the first step.
    const own = smooth(span(t - m.walk, 0.25, 0.85))
    pose.hands = [0, 1].map((n) => falling[n]!.map((v, a) => v + (stride.hands[n]![a]! - v) * own)) as unknown as StandPose['hands']
    feet = { x: w.x, y: w.y }
    // The button is not walked into: a hand that hangs ahead of the body is held back from its near end.
    if (i.button) {
      const room = (dir * (i.button.x - feet.x) - (i.button.w ?? 110) / 2) / sc - KNEEL.hand
      pose.hands = pose.hands.map((h) => [dir * Math.min(dir * h[0], Math.max(room, 12)), h[1], h[2]]) as unknown as StandPose['hands']
    }
    const landed = stepsBy(w.walked / sc)
    for (let n = Math.max(1, landed - 7); n <= landed; n++) {
      const gone = w.walked - (n - 0.5) * WALK.step * sc
      fx.scuffs.push({ x: w.x - dir * (gone - WALK.reach * sc), y: w.y + sc * (n % 2 === 0 ? 3 : -3), long: 9 * sc })
    }
  }

  if (m.kneel !== undefined && t >= m.kneel) {
    const k = t - m.kneel
    const sway: StandPose = { ...pose, hip: [pose.hip[0] - 2, pose.hip[1] + 2.5], lean: pose.lean + 0.12, stretch: 1.03 }
    let p = mixPose(pose, sway, smooth(span(k, 0, LAST.sway)))
    p = mixPose(p, POSES.kneesLand, inCubic(span(k, LAST.sway, LAST.land)))
    p = mixPose(p, POSES.knees, outBack(span(k, LAST.land, LAST.down), 2))
    // The arms come down after the body, and swing.
    const late = Math.sin((k - LAST.land) * 10) * Math.exp(-(k - LAST.land) * 3) * (k > LAST.land ? 4 : 0)
    p.hands = [[p.hands[0][0] + late, p.hands[0][1] + (k < LAST.land ? 6 * smooth(span(k, LAST.sway, LAST.land)) : 6 * (1 - smooth(span(k, LAST.land, LAST.land + 0.2)))), p.hands[0][2]], [p.hands[1][0] + late, p.hands[1][1] + (k < LAST.land ? 6 * smooth(span(k, LAST.sway, LAST.land)) : 6 * (1 - smooth(span(k, LAST.land, LAST.land + 0.2)))), p.hands[1][2]]]
    // One breath.
    const b = span(k, LAST.down, LAST.down + LAST.breath)
    const air = Math.sin(Math.PI * b) * (b < 0.5 ? 1 : 1) * Math.sin(Math.PI * b)
    p = { ...p, hip: [p.hip[0] - 1.5 * air, p.hip[1] + 3.2 * air], stretch: p.stretch + 0.05 * air, puff: p.puff + 0.25 * air, lean: p.lean + 0.07 * air }
    pose = p
    if (k >= LAST.land) fx.dust.push({ x: feet.x + 4 * sc, y: feet.y, age: k - LAST.land, size: 30 * sc })

    if (m.fist !== undefined && t >= m.fist) {
      const room = m.press !== undefined ? Math.min(1, (m.press - m.fist) / (LAST.up + LAST.back)) : 1
      const f = (t - m.fist) / Math.max(0.2, room)
      const btn = i.button ?? { x: feet.x + POSES.blow.hands[1][0], y: feet.y - 12 }
      const top = btn.top ?? 8
      const a = STAND.rise * POSES.knees.rise
      const dy = feet.y - btn.y
      // The button's top in the figure's plane, a hand's thickness above it.
      const fistAt: V3 = [(fistX(btn, feet.x, sc) - feet.x) / sc, (dy * Math.cos(a) + (top + 4) * Math.sin(a)) / sc, ((top + 4) * Math.cos(a) - dy * Math.sin(a)) / sc]
      const down: StandPose = { ...POSES.blow, hands: [POSES.blow.hands[0], fistAt] }
      let q = mixPose(pose, POSES.fistDip, smooth(span(f, 0, LAST.dip)))
      q = mixPose(q, POSES.fistUp, outBack(span(f, LAST.dip, LAST.up), 1.8))
      if (m.press !== undefined) {
        const r = t - m.press
        const high: StandPose = { ...POSES.fistUp, hands: [POSES.fistUp.hands[0], [34, 101, 12]], stretch: 1.1, lean: 0.17, hip: [2, 19] }
        q = { ...q, tremble: 0.2 * smooth(span(f, LAST.up, LAST.up + 0.3)) * (r < -LAST.blow ? 1 : 0) }
        q = mixPose(q, high, smooth(span(r, -LAST.back, -LAST.blow)))
        // The fist comes down first and fast. The body is thrown after it: it starts a frame before the fist lands and takes `follow` to come down.
        const fist = mixPose(q, down, inCubic(span(r, -LAST.blow, 0)))
        q = mixPose(q, down, smooth(span(r, -1 / 60, LAST.follow)))
        q.hands = [q.hands[0], fist.hands[1]]
        q.grip = fist.grip
        if (r >= 0) {
          const sag: StandPose = { ...down, hip: [11, 8], lean: -0.62, stretch: 0.86, hands: [[2, 2, 6], fistAt] }
          q = mixPose(q, sag, outBack(span(r, LAST.follow, LAST.follow + LAST.sag), 2.4))
          q = breathe(q, t, 2 * smooth(span(r, LAST.follow + LAST.sag, LAST.follow + LAST.sag + 0.5)))
          q.hands = [q.hands[0], fistAt]
          press = outCubic(span(r, 0, 0.05))
          fx.dust.push({ x: fistX(btn, feet.x, sc), y: btn.y, age: r, size: 46 * sc })
        }
      }
      pose = q
    }
  }
  if (m.end !== undefined && m.fire !== undefined && t >= m.end) {
    const over = t - m.end
    const k = smooth(span(over, 0.05, 0.5)) * (1 - smooth(span(over, FIRE.smoke - 1.2, FIRE.smoke)))
    if (k > 0.01) {
      for (let n = 0; n < 2; n++) {
        const hand = pose.hands[n]!
        const w = toPage({ x: feet.x, y: feet.y, ground: 0, rise: pose.rise, scale: sc }, hand[0], hand[1] - 2, hand[2])
        fx.smoke.push({ x: w.x, y: w.y, z: w.z, k, age: over })
      }
    }
  }
  return { up: true, pose: { ...at(pose, feet.x, feet.y), scale: 1 + ((i.scale ?? SCALE) - 1) * clamp01(pose.legs) }, fx, feet, press }
}

export interface FinishEvent { name: string; x: number; y: number }

// The moments a sound belongs to that fall between two steps: after `a.time`, up to `b.time`.
export function finishEvents(a: FinishInput, b: FinishInput): FinishEvent[] {
  const out: FinishEvent[] = []
  const s = finishState(b)
  const hit = (name: string, when: number | undefined, x = s.feet.x, y = s.feet.y): void => {
    if (when !== undefined && a.time < when && b.time >= when) out.push({ name, x, y })
  }
  const pw = b.power
  if (pw) {
    const plan = powerPlan(pw)
    hit('finish-standup', pw.at)
    hit('power-up-rise', pw.at + POWER.lead * plan.quick)
    hit('power-up-burst', pw.at + plan.end)
    hit('finish-liedown', pw.at + plan.end + POWER.burst * plan.quick)
  }
  const m = b.marks ?? {}
  hit('finish-standup', m.arms === undefined ? undefined : m.stand ?? m.arms - LEAD)
  hit('finish-charge', m.charge)
  hit('finish-fire', m.fire === undefined ? undefined : m.fire + FIRE.lead)
  hit('finish-beam-end', m.end)
  if (m.walk !== undefined && b.time >= m.walk && b.walk) {
    const before = a.walk ? stepsBy(a.walk.walked / (b.scale ?? SCALE)) : 0
    for (let n = before; n < stepsBy(b.walk.walked / (b.scale ?? SCALE)); n++) out.push({ name: 'finish-step', x: b.walk.x, y: b.walk.y })
  }
  hit('finish-knees', m.kneel === undefined ? undefined : m.kneel + LAST.land)
  hit('finish-fist', m.fist)
  hit('finish-press', m.press, b.button?.x, b.button?.y)
  return out
}

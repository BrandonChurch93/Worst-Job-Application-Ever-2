// The standing arrow as plain numbers: no three.js, no clock. A pose is what the figure looks like at one moment.
// The figure's own plane: x to the right, y up from the ground under its feet, z out of the white face, in page px.
// Lying on the page the plane is the page itself; standing, the plane is tipped up about the line of the feet by `rise`.
import { config } from '../../config'
import { OUTLINE_BOX } from '../contract'

const UNIT = config.cursor.heightPxAt1080 / OUTLINE_BOX.h

export type V2 = [number, number]
export type V3 = [number, number, number]

export const STAND = {
  // How far the figure's plane is tipped up off the ground when it stands, in radians. The site's camera looks straight down, so a figure at a right angle to the ground would show only its top edge.
  rise: 0.62,
  // The point of the outline the body is carried by: low in the middle, between the hips. Outline units.
  pivot: [4.7, 16.5] as V2,
  // Where each leg leaves the body, in outline units: left, right.
  hips: [[1.3, 14.4], [7.9, 17.3]] as [V2, V2],
  // Where each arm leaves the body, in outline units: left, right.
  shoulders: [[1.6, 10.6], [7.0, 10.6]] as [V2, V2],
  // How high the pivot stands over the ground at rest, and the longest a leg can be.
  hip: 31,
  leg: 40,
  // The shoe: half its length, its height, half its depth, and how high the ankle is over the sole.
  shoe: [8, 7.5, 5.5] as V3,
  ankle: 5,
  // The hose of a leg, in px across.
  hose: 3.3,
  // The long shadow: how far it runs for each px of height, as a share of what the key's own direction gives, and how dark it is at the feet.
  shadow: 0.62,
  shade: 0.3,
  // Where the tip of the lying arrow is, from the middle of the feet: the pointer's hot spot.
  tip: [-4.7 * UNIT, 31 + 16.5 * UNIT] as V2
}

export interface StandPose {
  // The feet's middle on the page, page px, and the height of the ground there.
  x: number
  y: number
  ground: number
  // 0 lying on the page, 1 standing.
  rise: number
  // 0 the legs are in the body, 1 out. The same for the arms.
  legs: number
  arms: number
  // The pivot's place in the figure's plane.
  hip: V2
  // The turn of the body about the pivot, radians, counter-clockwise as seen from the front.
  lean: number
  // The body's own acting: length along the arrow, puff, tremble.
  stretch: number
  puff: number
  tremble: number
  // The hands in the figure's plane, and how closed each is, and how hard the arms pull.
  hands: [V3, V3]
  grip: V2
  strain: number
  // The soles of the feet in the figure's plane (the ankle is over it), which way each shoe points (1 right, -1 left), its pitch in radians (toe down positive) and which way each knee bows (1 right, -1 left).
  feet: [V2, V2]
  toes: V2
  pitch: V2
  knees: V2
}

const P = (hip: V2, lean: number, hands: [V3, V3], grip: V2, feet: [V2, V2], o: Partial<StandPose> = {}): StandPose => ({
  x: 0, y: 0, ground: 0, rise: 1, legs: 1, arms: 1, hip, lean, stretch: 1, puff: 0, tremble: 0, hands, grip, strain: 0, feet, toes: [-1, 1], pitch: [0, 0], knees: [-1, 1], ...o
})

// The poses the acting is cut from. Each is the pose sheet's figure, or a moment between two of them.
export const POSES = {
  // Lying on the page as the pointer does: legs and arms in.
  lying: P([0, 31], 0, [[-12, 44, 3], [12, 44, 3]], [1, 1], [[-6, 22], [6, 22]], { rise: 0, legs: 0, arms: 0 }),
  // Lying with the legs out and the shoes set.
  set: P([0, 31], 0, [[-12, 44, 3], [12, 44, 3]], [1, 1], [[-13, 0], [13, 0]], { rise: 0, arms: 0 }),
  // Standing, at ease: arms out to the sides, hands open and low.
  ready: P([0, 31], -0.1, [[-34, 34, 5], [36, 36, 5]], [0.15, 0.15], [[-15, 0], [17, 0]]),
  // The pose sheet's first figure: legs wide, both fists raised.
  power: P([0, 27], -0.14, [[-33, 61, 6], [36, 63, 6]], [1, 1], [[-27, 0], [29, 0]], { puff: 0.35, strain: 0.5 }),
  // The dip before the fists go up.
  powerDip: P([0, 21], -0.06, [[-30, 30, 6], [32, 30, 6]], [1, 1], [[-24, 0], [26, 0]], { stretch: 0.93 }),
  // The pose sheet's second figure: crouched, both hands cupped at the hip. `charge0` is the first cup, `charge1` the deepest.
  charge0: P([4, 26], 0.1, [[-26, 30, 12], [-13, 21, 13]], [0.3, 0.3], [[-24, 0], [28, 0]], { knees: [-1, 1] }),
  charge1: P([6, 21], 0.2, [[-36, 33, 13], [-17, 14, 14]], [0.22, 0.22], [[-29, 0], [33, 0]], { strain: 0.3, stretch: 0.96 }),
  // The coil before the thrust: everything drawn back a little further.
  coil: P([2, 20], 0.3, [[-42, 34, 13], [-24, 16, 14]], [0.3, 0.3], [[-29, 0], [33, 0]], { strain: 0.6, stretch: 0.93 }),
  // The pose sheet's third figure: back leg stretched, both open hands pushed forward, wrists together.
  fire: P([10, 25], -0.2, [[58, 44, 14], [60, 35, 15]], [0, 0], [[-39, 0], [24, 0]], { strain: 1, stretch: 1.04, knees: [-1, 1], pitch: [0.25, 0] }),
  // The thrust a hand's width too far, for the overshoot.
  fireOver: P([15, 25], -0.3, [[66, 45, 14], [68, 36, 15]], [0, 0], [[-39, 0], [24, 0]], { strain: 1, stretch: 1.08, pitch: [0.3, 0] }),
  // After the beam: arms hanging, body slumped.
  spent: P([2, 27], -0.2, [[-27, 22, 8], [37, 21, 8]], [0, 0], [[-13, 0], [15, 0]], { stretch: 0.97 }),
  // On its knees: the shins lie on the ground behind.
  knees: P([4, 15], -0.12, [[-8, 6, 6], [26, 5, 6]], [0, 0], [[-30, 0], [-17, 0]], { toes: [-1, -1], pitch: [1.2, 1.2], knees: [1, 1], stretch: 0.95 }),
  // The same, as it lands: lower, and squashed.
  kneesLand: P([5, 10], -0.2, [[-4, 3, 6], [30, 3, 6]], [0, 0], [[-30, 0], [-17, 0]], { toes: [-1, -1], pitch: [1.2, 1.2], knees: [1, 1], stretch: 0.88 }),
  // The fist high: the right hand is a fist over the head, the body stretched after it.
  fistUp: P([3, 18], 0.1, [[-10, 6, 6], [40, 96, 12]], [0, 1], [[-30, 0], [-17, 0]], { toes: [-1, -1], pitch: [1.2, 1.2], knees: [1, 1], stretch: 1.07, strain: 0.4 }),
  // The dip before the fist goes up.
  fistDip: P([5, 12], -0.2, [[-6, 4, 6], [30, 12, 8]], [0, 1], [[-30, 0], [-17, 0]], { toes: [-1, -1], pitch: [1.2, 1.2], knees: [1, 1], stretch: 0.9 }),
  // The blow: the fist is down on the button, the body thrown after it.
  blow: P([9, 11], -0.5, [[-2, 3, 6], [50, 6, 12]], [0, 1], [[-30, 0], [-17, 0]], { toes: [-1, -1], pitch: [1.2, 1.2], knees: [1, 1], stretch: 0.9, strain: 1 })
} satisfies Record<string, StandPose>

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
export const smooth = (v: number): number => { const t = clamp01(v); return t * t * (3 - 2 * t) }
export const outCubic = (v: number): number => 1 - Math.pow(1 - clamp01(v), 3)
export const inCubic = (v: number): number => Math.pow(clamp01(v), 3)
// Past the goal and back: 1 at the end, about 1 + `over` on the way.
export const outBack = (v: number, over = 1.6): number => { const t = clamp01(v) - 1; return 1 + (over + 1) * t * t * t + over * t * t }
// How far through a span a time is, 0 to 1.
export const span = (t: number, from: number, to: number): number => (to <= from ? (t >= to ? 1 : 0) : clamp01((t - from) / (to - from)))

const mix2 = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

// One pose on the way to another. `t` may run a little past 1: that is the overshoot.
export function mixPose(a: StandPose, b: StandPose, t: number): StandPose {
  const s = clamp01(t)
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), ground: lerp(a.ground, b.ground, t),
    rise: lerp(a.rise, b.rise, t), legs: lerp(a.legs, b.legs, s), arms: lerp(a.arms, b.arms, s),
    hip: mix2(a.hip, b.hip, t), lean: lerp(a.lean, b.lean, t),
    stretch: lerp(a.stretch, b.stretch, t), puff: lerp(a.puff, b.puff, s), tremble: lerp(a.tremble, b.tremble, s),
    hands: [mix3(a.hands[0], b.hands[0], t), mix3(a.hands[1], b.hands[1], t)],
    grip: [clamp01(lerp(a.grip[0], b.grip[0], t)), clamp01(lerp(a.grip[1], b.grip[1], t))], strain: clamp01(lerp(a.strain, b.strain, t)),
    feet: [mix2(a.feet[0], b.feet[0], s), mix2(a.feet[1], b.feet[1], s)],
    toes: [lerp(a.toes[0], b.toes[0], s), lerp(a.toes[1], b.toes[1], s)],
    pitch: [lerp(a.pitch[0], b.pitch[0], s), lerp(a.pitch[1], b.pitch[1], s)],
    knees: [lerp(a.knees[0], b.knees[0], s), lerp(a.knees[1], b.knees[1], s)]
  }
}

export const at = (p: StandPose, x: number, y: number, ground = 0): StandPose => ({ ...p, x, y, ground })

// A point of the figure's plane on the page: page px and the height over the page.
export function toPage(p: { x: number; y: number; ground: number; rise: number }, fx: number, fy: number, fz: number): { x: number; y: number; z: number } {
  const a = STAND.rise * p.rise
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x + fx, y: p.y - (fy * c - fz * s), z: p.ground + fy * s + fz * c }
}

// Where the middle of the feet is for an arrow that lies with its tip at a place of the page.
export const feetFor = (tip: { x: number; y: number }): { x: number; y: number } => ({ x: tip.x - STAND.tip[0], y: tip.y + STAND.tip[1] })

// The walk of a spent figure, by how far it has come: which foot is in the air and how high, how far each foot is from the middle, and the body's dip.
// One stride is two steps. A foot is on the ground for `stance` of its cycle and is dragged, toe down, for the rest: it never clears the ground by more than `lift`.
export const WALK = { step: 54, stance: 0.52, lift: 3, dip: 4.2, sway: 0.08, reach: 27, surge: 5 }
export function walkPose(walked: number, dir: number): StandPose {
  const stride = WALK.step * 2
  const feet: [V2, V2] = [[0, 0], [0, 0]]
  const pitch: V2 = [0, 0]
  let dip = 0
  for (let i = 0; i < 2; i++) {
    const u = ((walked / stride + i * 0.5) % 1 + 1) % 1
    let fx: number
    if (u < WALK.stance) fx = lerp(WALK.reach, -WALK.reach, u / WALK.stance)
    else {
      const v = (u - WALK.stance) / (1 - WALK.stance)
      fx = lerp(-WALK.reach, WALK.reach, smooth(v))
      feet[i]![1] = WALK.lift * Math.sin(Math.PI * v)
      pitch[i] = 0.55 * Math.sin(Math.PI * Math.min(1, v * 1.4))
    }
    feet[i]![0] = fx * dir + (i === 0 ? -5 : 5)
    // The body drops onto each foot as it takes the weight.
    dip += Math.pow(Math.max(0, Math.cos(Math.PI * 2 * (u - 0.12))), 4)
  }
  const swing = Math.sin((walked / stride) * Math.PI * 2 - 0.9)
  const surge = WALK.surge * Math.sin((walked / WALK.step) * Math.PI * 2 - 1.2)
  return P([(4 + surge) * dir, 25 - WALK.dip * dip], -0.24 * dir - WALK.sway * swing, [[-25 - 5 * swing, 21 + 1.5 * dip, 8], [36 - 5 * swing, 20 + 1.5 * dip, 8]], [0, 0], feet, { toes: [dir, dir], pitch, knees: [dir, dir], stretch: 0.97 - 0.015 * dip })
}

// How many steps have landed by a distance walked: a footstep sounds when this number grows.
export const stepsBy = (walked: number): number => Math.max(0, Math.floor(walked / WALK.step + 0.5))

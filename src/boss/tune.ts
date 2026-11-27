import { config } from '../config'

// Every number of the boss's rules (change note 002, item 15) that is tuned. One line each.

// A. The shield.
export const GUARD = {
  radius: 282, // px from the boss's centre to the shield's glass
  cover: 0.92, // rad to each side of where the shield faces that it covers
  chip: 0.005, // points of health a dart on the shield takes, whatever the phase
  thick: 46, // px, half the thickness of the glass as drawn, for its bounds
  wing: 0.6, // rad from the middle plate to each of the two side plates as drawn
  tellAfter: 6, // darts in a row on the shield before the open side shows itself
  tellEvery: 3, // s between two such tells while the darts go on glancing
  tellSeconds: 1.2 // s the lamp on the open flank is lit
} as const

// What a dart that reaches the body takes from the boss, by phase.
export const REAL_DART = [0.4, 0.21, 0.23] as const

// The boss wears out: from this second of the fight on a real dart does more, and twice as much again after each `double` seconds.
export const WEAR = { from: 35, double: 25 } as const

// B. How the boss tracks and moves.
export const TRACK = {
  turn: 1.05, // rad/s the shield turns toward the arrow when the boss is fresh
  least: 0.4, // share of that rate left when the boss is tired
  tire: 60, // s of fight over which the rate falls to that share
  stall: 0.95 // s the shield holds still from the wind-up of each of the boss's own shots
} as const
export const MOVE = {
  first: 1.2, // s into the fight before the boss first sets off
  every: 3.4, // s from one set-off to the next
  leg: 1.5, // s the boss walks at most on one leg
  speed: 190, // px/s it walks
  least: 60, // px: a place nearer than this is not worth a leg
  short: 340, // px from the arrow at which the boss stops when it closes in
  touch: 34, // px round the body's ellipse inside which the arrow is run over
  back: 430, // px from the arrow to where the boss steps back to after it ran the arrow over
  fence: { x0: 1250, y0: 480, x1: 1580, y1: 800 } // where the boss's centre may be: under the band below the bar, and right of where the pop-ups stand
} as const

// C. Bullets. Every gun fires them: the boss's own two guns and the four corner cannons.
export const GUN = {
  first: 1.5, // s into the fight before the boss's own guns first wind up; like every first shot and the first set-off it comes after the turret has locked
  tell: 0.6, // s a gun pulls back and its lamp blinks before it fires
  every: [2.6, 3.2, 2.6] as const, // s from one pattern to the next, by phase
  late: 2, // s into the last phase before the first pattern
  least: 0.9, // s at least into the second phase before a pattern
  speed: [520, 560, 600] as const, // px/s of a bullet of the boss's own guns, by phase
  r: 14, // px, a bullet's radius: 28 px across
  reach: 16, // px added to that radius for a hit on the arrow's centre
  berth: 34, // px more that a careful visitor keeps from a bullet's line
  lead: 0.4, // share of the arrow's own travel during the bullet's flight that an aimed shot allows for
  leadMost: 180, // px at most that an aimed shot leads
  follow: 6, // 1/s, how fast the guns' reading of the arrow's speed follows it
  fan: 0.2, // rad between the bullets of a fan of three
  fanGap: 0.11, // s between them
  line: 4, // bullets in a burst along a line
  lineGap: 0.16, // s between them
  ring: 10, // bullets in a ring
  life: 5, // s a bullet flies at most
  trail: 44 // px, the trail behind a bullet as drawn
} as const

// The four corner cannons.
export const CORNER = {
  at: [[84, 176], [1836, 176], [84, 996], [1836, 996]] as const, // their places, in the corners of the whole screen, the upper two under the band
  order: [2, 1, 0, 3] as const, // which fires next
  first: 4.5, // s into the fight before the first tell
  every: 5, // s from one tell to the next
  tell: 0.9, // s a cannon shows that it will fire; it aims at the arrow the whole time and locks at the end
  speed: 540, // px/s of its bullet
  base: 48, // px, the radius of the cannon as drawn
  band: 112 // px from the top: a bullet, a line or a mark that would come above this line is cut off there
} as const

// The big turret on the boss's back.
export const BIG = {
  rise: 0.15, // s into the fight at which it starts to rise out of the back
  up: 0.7, // s into the fight at which it is up and starts to slide over the button
  lock: 1.05, // s into the fight at which it locks over the button
  back: 150, // px behind the button, on the side away from the shield, where it comes up
  first: 11, // s into the fight before its first tell
  every: 13, // s from one blast to the next tell
  tell: 1.6, // s the line of the blast lies on the ground before the blast; the boss and its shield hold still
  wide: 64, // px to each side of the line that the blast takes
  beam: 0.3, // s the blast stands
  scorch: { w: 240, h: 150 }, // px, the mark where the arrow stood when the line was laid
  scorchLife: 9, // s the mark stays
  off: 0.7 // s the turret takes to fly off when the boss is beaten
} as const

// D. Being hit.
export const FLAT = {
  down: 0.7, // s the arrow lies flat and cannot shoot
  life: 1.4, // s of the whole wound, peel included
  safe: 2.1, // s after a hit in which nothing can hit again
  heal: 0.35 // s after the hit at which the boss wins health back
} as const
export const HEAL = {
  first: 6, // points of health the first hit gives back
  shrink: 0.6 // each later heal is this share of the one before, so all heals together stay under first / (1 - shrink) = 15 points
} as const

// E. The visitor who does nothing: the old rule that the boss tires by the clock, kept for him alone.
export const IDLE = {
  after: config.live.idleSeconds, // s without a shot before the boss starts to give up
  ramp: 5 // s in which a phase then runs out
} as const

// In the film a dart that reaches the body does this many times as much, by phase: the film gives the whole fight 18 s, half of what a keen visitor needs.
export const FILM = { dart: [2.4, 2, 3.4] as const } as const

// The right edge of the pop-ups, which stand left of the boss's fence.
export const POPUP_RIGHT = 1040
export const RACK_GAP = 36 // page px between the old validation slabs in the layout tree, where their words are still registered and never drawn in the fight; wide enough for the last one to lie under the lowest pop-up

// The top of the screen during the fight.
export const TOP = {
  bar: 40, // px from the top to the health bar's track
  clear: 24, // px kept clear under the bar: nothing of the boss comes nearer
  move: 0.5 // s the form takes to leave and to come back, and the bar to go up and down
} as const

// Where a visitor may stand to fire, for the hint the bots follow.
export const STANDS = {
  near: 330, // px from the boss's centre at least
  far: 760, // px at most
  margin: 0.3, // rad outside the shield's cover before a stand counts as open
  round: 262, // px from the boss's centre that the way to a stand must keep
  detour: 380 // px further that a stand with no pop-up in the way may be and still be chosen over one behind a pop-up
} as const

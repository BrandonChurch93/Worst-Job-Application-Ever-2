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
  touch: 34, // px round the body's ellipse inside which the arrow is run over
  back: 430, // px from the arrow to where the boss steps back to after it ran the arrow over
  fence: { x0: 1250, y0: 480, x1: 1580, y1: 800 } // where the boss's centre may be: under the band below the bar, and right of where the pop-ups stand
} as const

// C. The four corner cannons.
export const CORNER = {
  at: [[84, 176], [1836, 176], [84, 996], [1836, 996]] as const, // their places, in the corners of the whole screen, the upper two under the band
  order: [2, 1, 0, 3] as const, // which fires next
  first: 4.5, // s into the fight before the first tell
  every: 5, // s from one tell to the next
  tell: 0.9, // s a cannon shows that it will fire; it aims at the arrow the whole time and locks at the end
  speed: 540, // px/s of its ball
  ball: 26, // px, the ball's radius
  reach: 24, // px added to that radius for a hit on the arrow's centre
  life: 4.5, // s a ball flies at most
  base: 48, // px, the radius of the cannon as drawn
  band: 112 // px from the top: a ball that would fly above this line is gone
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

// In the film a dart that reaches the body does this many times as much: the film gives the whole fight 18 s, half of what a keen visitor needs.
export const FILM = { dart: 3 } as const

// The right edge of the pop-ups, which stand left of the boss's fence.
export const POPUP_RIGHT = 1040

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

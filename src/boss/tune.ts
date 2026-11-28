import { config } from '../config'

// Every number of the boss's rules (change note 002, item 15) that is tuned. One line each.

// The one switch between the plain stand-in and LOOK 1 (mail of 22:19). false draws the stand-in and uses its measures.
export const LOOK1_ON = false

// The one switch that brings the three pop-ups back into the fight (mail of 22:19, rule e).
export const POPUPS_ON = false

// The boss's own measures, which differ between the stand-in and LOOK 1. The second set is the look helper's, measured from the picked pictures.
export const SHAPE = LOOK1_ON
  ? {
      guard: 120, // px from the boss's centre to the shield's glass
      thick: 14, // px, half the thickness of the glass, for its bounds
      rx: 116, // px, half the hull along the page's x, for a dart that reaches the body
      ry: 116, // px, half the hull along the page's y
      gun: 79, // px from the centre to each small gun, across the way he faces
      barrel: 75, // px from a small gun's pivot to its muzzle
      big: 274, // px from the centre to the big cannon's muzzle, along the way he faces
      cover: 0.5, // rad to each side of where the shield faces that it covers
      top: 330 // px from the top: the least y of his centre
    }
  : {
      guard: 282,
      thick: 46,
      rx: 196,
      ry: 118,
      gun: 116,
      barrel: 106,
      big: 250,
      cover: 0.6,
      top: 512
    }

// A. The shield.
export const GUARD = {
  radius: SHAPE.guard, // px from the boss's centre to the shield's glass
  cover: SHAPE.cover, // rad to each side of where the shield faces that it covers
  chip: 0.005, // points of health a dart on the shield takes, whatever the phase
  thick: SHAPE.thick, // px, half the thickness of the glass as drawn, for its bounds
  wing: 0.36, // rad from the middle plate to each of the two side plates as drawn on the stand-in
  tellAfter: 6, // darts in a row on the shield before the open side shows itself
  tellEvery: 3, // s between two such tells while the darts go on glancing
  tellSeconds: 1.2 // s the lamp on the open flank is lit
} as const

// What a dart that reaches the body takes from the boss, by phase.
export const REAL_DART = [0.35, 0.18, 0.2] as const

// The boss wears out: from this second of the fight on a real dart does more, and twice as much again after each `double` seconds.
export const WEAR = { from: 35, double: 20 } as const

// B. How the boss tracks and moves.
export const TRACK = {
  turn: 1.05, // rad/s the shield turns toward the arrow when the boss is fresh
  least: 0.4, // share of that rate left when the boss is tired
  tire: 60, // s of fight over which the rate falls to that share
  stall: 0.95 // s the shield holds still from the wind-up of each of the boss's own shots
} as const
export const MOVE = {
  first: 2, // s into the fight before the boss first sets off, after the turret has locked
  every: 3.4, // s from one set-off to the next
  leg: 1.5, // s the boss walks at most on one leg
  speed: 190, // px/s it walks
  least: 60, // px: a place nearer than this is not worth a leg
  short: 340, // px from the arrow at which the boss stops when it closes in
  touch: 34, // px round the body's ellipse inside which the arrow is run over
  back: 430, // px from the arrow to where the boss steps back to after it ran the arrow over
  fence: { x0: 640, y0: SHAPE.top, x1: 1280, y1: 770 } // where the boss's centre may be: on the middle slab, and so low that his shield stays out of the band under the bar
} as const

// C. Bullets. Every gun fires them: the boss's own two guns and the four corner cannons.
export const GUN = {
  first: 2.4, // s into the fight before the boss's own guns first wind up; like every first shot and the first set-off it comes after the turret has locked
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
  at: [[89, 82], [1831, 82], [82, 987], [1824, 981]] as const, // their places in the four corners of the whole screen, as in the picked picture
  order: [2, 1, 0, 3] as const, // which fires next
  first: 4.5, // s into the fight before the first tell
  every: 5, // s from one tell to the next
  tell: 0.9, // s a cannon shows that it will fire; it aims at the arrow the whole time and locks at the end
  speed: 540, // px/s of its bullet
  base: 48 // px, the radius of the cannon as drawn on the stand-in
} as const

// The big turret on the boss's back.
export const BIG = {
  rise: 0.15, // s after the body is whole at which the hatch opens and it starts to rise
  up: 1.1, // s after the body is whole at which it is up and starts to slide over the button (stand-in)
  lock: 1.75, // s after the body is whole at which it locks over the button: 1.6 s from rise to lock
  back: 150, // px behind the button, on the side away from the shield, where it comes up
  first: 7.4, // s into the fight before its first tell
  every: 13, // s from one blast to the next tell
  last: 0.6, // s after the banner of the last stand at which it tells once more, whatever is left of `every` (not in the film)
  tell: 1.6, // s the line of the blast lies on the ground before the blast; the boss and its shield hold still
  wide: 65, // px to each side of the line that the blast takes: 130 px across
  beam: 0.3, // s the blast stands
  muzzle: SHAPE.big, // px ahead of his centre where the blast starts
  swing: 0.04, // rad, the step in which an aim that would cross the health bar's box is turned away from it
  turn: 2.5, // rad/s he turns to that aim during the tell
  wary: 0.4, // s before a tell in which a careful visitor already leaves the way he faces
  off: 0.7 // s the turret takes to fly off when the boss is beaten
} as const

// D. Being hit.
export const FLAT = {
  down: 0.7, // s the arrow lies flat and cannot shoot
  life: 1.4, // s of the whole wound, peel included
  safe: 2.1, // s after a hit in which nothing can hit again
  heal: 0.35, // s after the hit at which the boss wins health back
  spread: 1.35, // times its size, in both directions, that the flat arrow is drawn at while it lies
  mark: 2.6, // s the dent, its cracks and the dust stay on the ground after a hit
  dent: 190, // px across of the dent
  dust: 0.55 // s the ring of dust takes to leave
} as const
export const HEAL = {
  first: 6, // points of health the first hit gives back
  shrink: 0.6 // each later heal is this share of the one before, so all heals together stay under first / (1 - shrink) = 15 points
} as const

// The mercy rule (mail of 22:45, item 5): from this long into a fight a dart that meets the shield starts to count, by steps, so that the visitor who stands and clicks does win.
export const MERCY = {
  from: 60, // s into the fight before the shield lets anything through
  every: 15, // s from one step to the next
  share: [0.05, 0.1, 0.2, 0.35, 0.6, 1] as const // by step, the share of a dart that got round that a dart on the shield is worth
} as const

// Line 7 of the narrator, said between the forming and the fight (change note 003). Lengths are the Builder's of 22:45 and the shell's of 22:48; they move the day the voice is recorded.
export const LINE7 = {
  part0: 18.125, // s of `boss.unfold.0`, from `boss-formed`
  ends: [1.25, 4.375, 7.5, 8.75, 10, 13.125, 15, 18.125] as const, // s at which its phrases end: where the shell stops it after a `boss-turn`
  gap: 0.3, // s of silence the shell leaves before the next part
  part1: 4.375, // s of `boss.unfold.1`
  music: 2.5, // s into part 1 at which "their student loans." and the music start (`boss-music`)
  part2: 3.75, // s of `boss.unfold.2`; the turret locks on its last word
  power: 0.6, // s into part 2 at which the gold starts to build (`power-up`), after the arrow has turned round
  glow: 2, // s the gold builds
  alone: 1.5, // s without a move or a press after which the arrow droops and starts to drift (live)
  drift: 26, // px/s it drifts toward the top right while it is left alone
  most: 6, // s at most that the drift holds the arrow on the live site
  to: [1790, 150] as const // page px it drifts toward: where a tab would be closed
} as const

// The finishing blast (mail of 22:45, item 3). Plain stand-ins; the look is the Builder's picture round.
// The finishing blast runs on the marks of the shout, one table that is swapped when the take is picked. These are the stand-in's.
export const SHOUT = {
  arms: 0, // s after the fall at which the arrow's arms come out (`finish-arms`)
  beats: [0.1, 1.04, 2.09, 2.9], // s at which each charge word or syllable starts; the glow steps up on each (`finish-charge` on each)
  fire: 4.13, // s at which the last word starts: the blast is let go there (`finish-fire`)
  gone: 6.26 // s at which the last word ends: the blast has held that long and the body is gone (`boss-gone`)
} as const

export const FINISH = {
  fall: 1, // s the beaten boss takes to fall (`boss-fall`); the marks of the shout count from its end
  arms: 0.6, // s the arrow's arms take to come out
  late: 0.8, // s past the whole charge that a held button is waited for before the blast goes by itself
  alone: 6, // s after the arms come out at which the blast goes by itself, fully charged, when nobody has pressed
  small: 0.25, // share of a full blast that a plain click fires
  steady: 0.5, // share of the charge that grows all the time from the first press to the fire mark; the rest comes in one step on each mark
  settle: 1.4, // s the button takes to settle on the ground after the body is gone (`button-down`)
  wide: 90, // px to each side of the full blast's line as drawn
  ball: 120 // px across of the full charge as drawn
} as const

// The close view of the finish: the part of the floor the picture shows from the boss's fall to the press of Submit.
export const CLOSE = {
  x: 300, // px, left edge
  y: 270, // px, top edge
  w: 960, // px across
  h: 540, // px down
  edge: 40 // px inside the edge that the arrow keeps to when it is led
} as const

// The last moment: when the body is gone the arrow walks to the button that is left, drops to its knees and strikes it with its right fist.
export const LAST = {
  stand: [440, 650], // px, where the arrow stands for the charge and the blast
  reach: 200, // px left of the button's middle at which it kneels
  speed: 178, // px/s of its walk: 1.8 s from where it stood to the button
  alone: 6, // s without a move or a press after which it walks there and strikes by itself, live site
  led: 20, // s of being led about after which it walks there and strikes by itself, live site
  most: 2, // s at most that its walk to the button takes when it goes by itself
  knees: 0.7, // s to drop to its knees (`finish-kneel`)
  breath: 0.6, // s it breathes on its knees, film only
  fist: 0.6, // s the right fist takes to go up (`finish-fist`)
  blow: 0.3, // s from the top of the fist to the blow on the button (`finish-press`)
  hold: 0.5, // s the film holds after the blow before the page turns
  held: 0.35 // s the live site holds after the blow
} as const

// E. The visitor who does nothing: the old rule that the boss tires by the clock, kept for him alone.
export const IDLE = {
  after: config.live.idleSeconds, // s without a shot before the boss starts to give up
  ramp: 5 // s in which a phase then runs out
} as const

// The film's fight is shorter than any visitor's: a dart that reaches the body does `dart` times as much, by phase, and a phase may end in `floor` of its least length.
// `ends`: the second of the fight at which each phase ends in the film at the latest, whatever the darts did, so the film's marks do not move with the boss's shape.
export const FILM = { dart: [2.8, 9, 5] as const, floor: [1, 0.35, 0.5] as const, ends: [9.83, 11.02, 13.69] as const } as const

// The right edge of the pop-ups, which stand left of the boss's fence.
export const POPUP_RIGHT = 1040
export const BANNER_LEFT = 1080 // page px of the left edge of the banner's place in the layout tree, right of the pop-ups; in the fight it is drawn over the boss
export const RACK_GAP = 36 // page px between the old validation slabs in the layout tree, where their words are still registered and never drawn in the fight; wide enough for the last one to lie under the lowest pop-up

// The top of the screen during the fight.
export const TOP = {
  bar: 86, // px from the top to the health bar's track: inside the frame of the picked picture (y 66 to 137)
  clear: 24, // px kept clear under the bar's box: nothing of the boss comes nearer
  move: 0.6 // s the form takes to leave and to come back, and the bar to go up and down
} as const

// The arena's change after the crack, for the events the arena's sounds hang on (the arena's module has the same times).
export const CHANGE = {
  split: 0.7, // s after the crack at which the floor splits (`arena-split`)
  rise: 1, // s after the crack at which the slabs, pillars and panes start to rise (`arena-rise`)
  bar: 1.7 // s after the crack at which the health bar's frame starts to drop (`healthbar-drop`); it lands at 2.12 in the arena
} as const

// Where a visitor may stand to fire, for the hint the bots follow.
export const STANDS = {
  near: 330, // px from the boss's centre at least
  far: 760, // px at most
  margin: 0.3, // rad outside the shield's cover before a stand counts as open
  round: 262, // px from the boss's centre that the way to a stand must keep
  detour: 380 // px further that a stand with no pop-up in the way may be and still be chosen over one behind a pop-up
} as const

// The arena of the picked picture (mail of 22:19), in page px by eye, until the arena's own module gives its solids.
export const SOLID = {
  side: 62, // px, the side of a pillar
  tall: { pillar: 90, pane: 120 }, // px, how high they stand on the stand-in; the arrow rides over the top
  rise: [1, 2], // s after the crack between which they come up, as the arena's change does
  pillars: [[165, 322], [569, 302], [130, 672], [553, 679], [1351, 302], [1755, 326], [1364, 679], [1783, 672]] as const, // the centres of the eight pillars
  panes: [[336, 233, 370, 754], [1543, 233, 1625, 754]] as const, // x0, y0, x1, y1 of the two glass panes
  bar: [560, 0, 1360, 170] as const, // x0, y0, x1, y1 of the box round the health bar: it stops every shot and no blast line may cross it
  frame: [590, 66, 1333, 137] as const // x0, y0, x1, y1 of the bar's frame in the picture, for the clear band
} as const

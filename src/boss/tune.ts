import { lineTimes } from '../audio/standin'
import { config } from '../config'

// Every number of the boss's rules (change note 002, item 15) that is tuned. One line each.

// The one switch between the plain stand-in and LOOK 1 (mail of 22:19). false draws the stand-in and uses its measures.
export const LOOK1_ON = true

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

// Line 6 of the narrator starts on the tick. Line 7 starts when the boss is formed, and no sooner than line 6 has ended.
export const LINE6 = {
  after: 4.57 // s from the tick before line 7's clock may start: line 6 without pauses (4.27 s, pipeline/change002/fast-takes.json; the kept take is 8.49 s) plus the gap of 0.3 s; tests/b-boss-fast.test.ts holds it to that file
} as const

// Line 7 of the narrator, said between the forming and the fight (change note 003). The lengths and the phrase ends are those of the lines without pauses in pipeline/change002/fast-takes.json, typed ahead of the takes being kept; the kept takes in public/audio/index.json are longer.
// tests/b-boss-fast.test.ts holds every one of them to that file. tests/takes-timing.test.ts holds them to the index and fails until such takes are kept.
export const LINE7 = {
  part0: 11.325, // s of `boss.unfold.0`, from `boss-formed`
  ends: [0.843, 2.264, 3.986, 5.197, 6.177, 8.319, 9.53, 11.325] as const, // s at which its phrases end (the start of the next one, and the end of the file): where the shell stops it after a `boss-turn`
  sentences: [2.264, 3.986, 8.319, 11.325] as const, // s at which its sentences end, each one of `ends`: a click ends the line there when that is near enough, by `earlyEnd` of src/audio/cues.ts, which the voice reads too
  lead: 0.1, // s of line 7 that are said before a press may turn the boss: a press before that is kept and acts then, so that the turn never reaches the voice before the line has started
  gap: 0.3, // s of silence the shell leaves before the next part
  part1: 2.485, // s of `boss.unfold.1`
  recall: 0.494, // s into part 1 at which "they remember" starts: the arrow lifts its tip
  music: 1.228, // s into part 1 at which "their student loans." and the music start (`boss-music`): the arrow straightens out of its sag
  part2: 1.91, // s of `boss.unfold.2`
  getup: 0.2, // s into part 2, on "They turn back.", at which the figure starts to get up, after the arrow has turned round
  power: 1.057, // s into part 2 at which "One more round." starts: the fists are up and the gold starts to build (`power-up`)
  glow: 0.853, // s the gold builds: to the end of part 2, so that it is full on the last word
  full: 0.8, // s the full gold is held before it bursts and the view goes back
  rise: 3.456, // s from the start of part 2 to the turret's lock: part 2, the hold of the full gold, the 0.696 s in which the figure bursts and lies down again at the pace its fists went up, and `RAISE.early`
  alone: 1.5, // s without a move or a press after which the arrow droops and starts to drift (live)
  drift: 26, // px/s it drifts toward the top right while it is left alone
  most: 6, // s at most that the drift holds the arrow on the live site
  to: [1790, 150] as const // page px it drifts toward: where a tab would be closed
} as const

// The finishing blast (mail of 22:45, item 3). Plain stand-ins; the look is the Builder's picture round.
// The finishing blast runs on the marks of the shout. They are worked out from the line's own times: the kept take's once one is in the sound index, the stand-in's of the drafts file until then.
// The marks of the shout, read from its line. The camera's charge view asks for `floor` s from the arms to the fire mark: its way down, its rest and the turn ahead of the fire.
// peak: s into the line at which the blast is let go: where the take says, and the start of the last phrase where it does not.
// lead: s after the arms at which the line is shouted, so that its peak lands on the fire mark: 0 when the peak is at the floor or later.
// The first two charge marks are the starts of the line's first two phrases, stretched with the fire mark; the two charge marks between keep their share of the gap from the second to the fire mark.
// The body is gone `held` s after the line ends, for the boss to leave in groups (the camera's second pass), and no sooner than the camera is level with the page again after the fire mark: its rise, its hold and its turn back.
export interface ShoutMarks { arms: number; lead: number; beats: readonly [number, number, number, number]; fire: number; gone: number }
export const SHOUT_LINE = 'boss.finish.0'
export const SHOUT_RULE = { between: [0.3398, 0.6019] as const, held: 1.3, standIn: { starts: [0.1, 1.04, 4.13] as const, seconds: 6.26 } } as const
const ms = (t: number): number => Number(t.toFixed(3))
export const shoutFloor = (): number => ms(CAMERA.down[1] + CAMERA.rest + CAMERA.ahead)
export function shoutOf(line: { starts: readonly number[]; seconds: number; peak?: number } | null, floor: number = shoutFloor()): ShoutMarks {
  const t = line && line.starts.length >= 3 && line.seconds > 0 ? line : SHOUT_RULE.standIn
  const peak = line === t && line.peak !== undefined && line.peak > 0 ? line.peak : t.starts[t.starts.length - 1]!
  const lead = ms(Math.max(0, floor - peak))
  const fire = lead > 0 ? floor : peak
  const on = (x: number): number => (lead > 0 ? ms((x * fire) / peak) : x)
  const a = on(t.starts[0]!)
  const b = on(t.starts[1]!)
  const level = CAMERA.rise[1] + CAMERA.hold + CAMERA.turn
  return { arms: 0, lead, beats: [a, b, ms(b + SHOUT_RULE.between[0] * (fire - b)), ms(b + SHOUT_RULE.between[1] * (fire - b))], fire, gone: Math.max(ms(lead + t.seconds + SHOUT_RULE.held), ms(fire + level)) }
}
let marks: ShoutMarks | null = null
const shout = (): ShoutMarks => (marks ??= shoutOf(lineTimes(SHOUT_LINE)))
// Read when first asked for, not when this file loads: the sound code's script reads this file for the camera's rise, so neither may need the other while loading.
export const SHOUT: ShoutMarks = {
  arms: 0, // s after the fall at which the arrow's arms come out (`finish-arms`)
  get lead() { return shout().lead }, // s after the arms at which the line is shouted
  get beats() { return shout().beats }, // s at which each charge word or syllable starts; the glow steps up on each (`finish-charge` on each)
  get fire() { return shout().fire }, // s at which the last word starts: the blast is let go there (`finish-fire`)
  get gone() { return shout().gone } // s at which the body is gone (`boss-gone`): the blast has held that long
}

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
  y: 270, // px, top edge: the arrow, the button and the burn 110 px under mid height, and clean ground over the burn for the words
  w: 960, // px across
  h: 540, // px down
  edge: 40 // px inside the edge that the arrow keeps to when it is led
} as const

// The last moment: when the body is gone the arrow walks to the button that is left, drops to its knees and strikes it with its right fist.
export const LAST = {
  stand: (LOOK1_ON ? [550, 650] : [440, 650]) as readonly [number, number], // px, where the arrow stands for the charge and the blast
  reach: LOOK1_ON ? 144 : 200, // px left of the button's middle at which it kneels: with the look, 31 px left of the end of its 226 px button
  words: -290, // px from the button's middle to the words "Click to submit", so they stand over it: the arena's burn is black to 138 px and sooty to about 230 px from it, and under it lie the cracks of the place the button was torn from
  wait: 0.4, // s after the body is gone before it sets off (`finish-walk`), while its arms go on dropping
  far: 319.5, // px the standing figure walks in the film with the look: from its feet after a whole blast to its own kneeling place, with the step it waits
  speed: LOOK1_ON ? 114.11 : 114.3, // px/s of its walk: 2.8 s from where it stood to its knees, `far` with the look and 320 px without
  alone: 6, // s without a move or a press after which it walks there and strikes by itself, live site
  led: 20, // s of being led about after which it walks there and strikes by itself, live site
  most: 2.8, // s at most that its walk to the button takes when it goes by itself
  knees: 0.7, // s to drop to its knees (`finish-kneel`)
  breath: 0.6, // s it breathes on its knees in the film
  pause: 0.3, // s it stays on its knees on the live site before the fist goes up
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
// `early`: s before the turret locks by which the standing figure of the power-up lies on the page again. Its moves are fitted to that window by the figure's own module.
export const RAISE = {
  early: 0.05,
  near: 0.5, // s from the figure's getting up over which the view comes close (live site) and the figure steps to its clear spot; the view goes back to the whole page from the burst until the figure lies on the page again
  zoom: 1.6, // times: the figure about 200 px tall in the film's frame, as on the walk
  box: { x0: -90, y0: -35, x1: 115, y1: 125 }, // px round the arrow's spot that the figure, its raised fists and its ring of flames fill; read by eye at 03:10Z. The flames of the finish at 739a4e33 measure -92 to 187 across and -127 to 125 down; a box that wide is not kept yet, see the notes on the rulings of 04:17Z
  step: 6, // px between the rings on which a clear spot is looked for
  turns: 72, // spots tried on each ring
  most: 720 // px, the widest ring
} as const
// What the gold of the power-up lights, in step with the flame's level: nothing at `none`, all of it at 1, flickering as the flame does.
export const RISE_LIGHT = {
  none: 0.12, // the flame's level at which nothing is lit
  colour: [1, 0.74, 0.25] as const,
  floor: { reach: 290, most: 0.55 }, // px from the feet to which the floor is warm (three widths of the figure), and how much of the floor's colour is the gold's at the feet
  pool: { most: 0.85, colour: [1, 0.5, 0.1] as const, top: 2 }, // the floor under that light is so bright that it shows pale, so over the same reach no colour of it may be brighter than this gold: wholly so where `most` times the light is 1, not at all (`top`) where it is 0
  near: { hole: 120, soft: 60, reach: 260, most: 0.66, high: 10, colour: [1, 0.45, 0.08] as const }, // the warm lift on what stands near (the boss's claw tips and the near of its plate, the shield's rim): none within `hole` px of the feet, at its most `soft` px further, falling evenly to none at `reach`, so the far ends of the arms keep their steel; on all that stands more than `high` px over the floor, and under the shield's glass, which keeps its green
  lamp: { power: 1.3, reach: 420, off: 110, high: 140 }, // the lift on the near pane's face and on the shield and the boss's near side: a light with no shadow, `off` px before each and `high` px up
  fist: { power: 2, reach: 85, drop: 40, front: 28, in: 1.15 }, // the flames' light on the figure's own rubber: under each fist a light with no shadow, `drop` px toward the feet and `front` px before the fist in the figure's own px, `in` times the fist's way out from the middle (more than 1: outside the fists, away from the arrow's face)
  foot: { power: 0.25, reach: 100, up: 4, front: 34 }, // and one low before the feet for the arrow's lower edge and the legs
  ring: { seconds: 0.35, from: 84, reach: 600, wide: 56, most: 1 }, // the burst's ring on the floor: from the ring of flames out to half the width of the closer view, and fading
  flash: { power: 2.6, reach: 360, near: 150 }, // the shield's glass as the ring passes: at its most when the ring is there, none `near` px before and after
  shake: { seconds: 0.3, px: 3, hz: 27 } // the film's view at the burst
} as const
// `spare` is the health the film keeps over the end of a stage until that stage's time is up, with the look on, so that every stage ends at its time whatever the darts meet.
export const FILM = { dart: [2.8, 9, 5] as const, floor: [1, 0.35, 0.5] as const, ends: [9.83, 11.02, 13.69] as const, spare: 0.5 } as const

// The right edge of the pop-ups, which stand left of the boss's fence.
export const POPUP_RIGHT = 1040
export const BANNER_LEFT = 1080 // page px of the left edge of the banner's place in the layout tree, right of the pop-ups; in the fight it is drawn over the boss
export const RACK_GAP = 36 // page px between the old validation slabs in the layout tree, where their words are still registered and never drawn in the fight; wide enough for the last one to lie under the lowest pop-up

// The top of the screen during the fight.
export const TOP = {
  bar: 86, // px from the top to the health bar's track: inside the frame of the picked picture (y 66 to 137)
  clear: 24, // px kept clear under the bar's box: nothing of the boss comes nearer
  muzzle: 2, // px across the big cannon's muzzle, for the same band
  spare: 0.5, // px more than the band that the boss's own bound on his place keeps
  lift: 16, // px the raised muzzle of the big cannon is drawn higher than its place on the page when it is under the bar (12 to 13 px read off the live picture, and 2 px to spare for the reading)
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

export const CAMERA = {
  on: true,
  powerUp: false,
  power: { down: 0.5, ramp: 0.2, low: 0.5, push: 0.04, dive: [1.2, 2] as const, swing: 1.5, body: [95, 230] as const, face: { knee: 0.5, room: 1.1 }, key: { at: [80, 10, 52], az: -128, el: 0.3, tall: 375, fov: 46 } },
  upright: 0.75,
  lowEl: [30, 80] as const,
  down: [0, 0.95] as const,
  dive: [1.2, 4] as const,
  tear: { life: 0.28, size: [170, 200, 230, 200, 330], z: 60 },
  fade: { near: 95, over: 0.15, body: [36, 150], feet: 1.7 },
  swing: 2,
  push: 0.08,
  pushOver: 6,
  rest: 2,
  ahead: 0.9,
  round: 0.8,
  lead: 2,
  roundLive: 0.55,
  stay: 0.3,
  thin: 30,
  cross: 0.5,
  whip: 2.5,
  glare: [3, 1, 1, 6] as const,
  flash: 160,
  back: [0.08, 0.3] as const,
  rise: [1.1, 1.7] as const,
  lift: 2,
  lag: 2,
  wide: 0,
  top: { at: [397.7, 161.8, 0], az: -180, tall: 500 },
  hold: 0.4,
  turn: 1.3,
  ramp: 0.2,
  sunk: 3,
  over: 1.6,
  wall: { x: 420, top: 600, soft: 350 },
  shake: 5,
  shakeDies: 0.22,
  open: 5,
  dusk: { far: 2800, high: 2600, top: [0.012, 0.013, 0.02], low: [0.15, 0.115, 0.095], reach: 0.22, band: [0.07, 0.04, 0.02], bandHigh: 0.07, finish: { k: 0.7, reach: 0.1 } },
  charge: { at: [-50, 0, 82], az: -120, el: -3, tall: 195, fov: 54 },
  fire: { at: [127, -13, 52], az: -225, el: 7.5, tall: 325, fov: 50 },
  blast: { at: [150, 0, 56], az: -224, el: 9, tall: 380, fov: 54 }
} as const

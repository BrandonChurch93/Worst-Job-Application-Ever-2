import { config } from '../../config'

const f = (frames: number): number => frames / 30

// Seconds of the letter's phase, which starts at `decide`. The stamp's times are whole film frames, so the contact is a frame of its own.
export const AT = {
  music: 0.4,
  decide: 2,
  spin: 0.35,
  sink: [0.35, 0.6],
  drop: [0.45, 0.8],
  slide: [0.8, 1.25],
  panel: [0.85, 1.2],
  // The block comes in high and hangs over the mark; in the last part of the hang it draws back.
  swoop: [f(77), f(86)],
  hang: [f(86), f(99)],
  slam: [f(99), f(103)],
  // The page takes a cursor that is not under the block when the hang begins; the shadow is on it at `loom`.
  pull: f(86),
  loom: f(88),
  pullSeconds: 0.3,
  lift: [f(111), f(119)],
  carry: [f(119), f(128)],
  // Over its place the block gives one sharp shake.
  shake: [f(128), f(133)],
  lower: [f(133), f(140)],
  // In the middle of the shake the flat cursor is thrown off the rubber, clear of the block. The block is set down; the cursor comes down after it, swaying as a thin flat thing does, and ends with a short skid.
  fling: [f(130), f(152)],
  // The cursor's pride in the letter: the seconds of the letter's phase at which it puffs up.
  proud: 1.5,
  letterSeconds: 4,
  count: [0.1, 1],
  button: [0.6, 0.9],
  armed: 1,
  hold: 0.45,
  selfWalk: 1.5,
  selfAfter: config.live.skipLinkAfterSeconds
} as const

// The film only. The narrator's line on the stamp starts at the hit. `SAID` is the seconds after the hit at which each of its five phrases starts, and its end, at the narrator's fastest pace; tests/decision-acting.test.ts holds them to the script.
export const SAID = [0, 1.875, 3.125, 4.375, 6.25, 8.125] as const

const flat = AT.decide + AT.slam[1]
// The press is the first whole frame from which the page turns no sooner than the end of that line and the gap between two lines.
const press = Math.ceil((flat + SAID[5] + config.audio.lineGapSeconds - AT.hold) * 30 - 1e-6) / 30

// `heal` is how long the arrow, landed flat, takes to be whole in the film: it lies flat for half of it. A visitor's arrow takes `STUCK.heal`.
export const FILM = {
  flat,
  landed: AT.decide + AT.fling[1],
  heal: 2.3,
  read: flat + SAID[3],
  sag: flat + SAID[4],
  press,
  leave: press + AT.hold
} as const

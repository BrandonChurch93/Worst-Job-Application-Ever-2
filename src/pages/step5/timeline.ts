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

export const FILM = {
  flat: AT.decide + AT.slam[1],
  landed: AT.decide + AT.fling[1],
  press: 9.3,
  leave: 9.3 + AT.hold
} as const

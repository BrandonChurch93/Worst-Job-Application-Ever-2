import { config } from '../../config'

export const AT = {
  music: 0.4,
  decide: 2,
  spin: 0.35,
  sink: [0.35, 0.6],
  drop: [0.45, 0.8],
  slide: [0.8, 1.25],
  panel: [0.85, 1.2],
  swoop: [1.6, 2.12],
  slam: [2.12, 2.3],
  lift: [2.78, 3.1],
  carry: [3.1, 3.6],
  lower: [3.6, 3.85],
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
  press: 9.3,
  leave: 9.3 + AT.hold
} as const

import * as bossTune from '../boss/tune'

// s after the fire mark at which the shout's panel leaves when the boss's tune file names no CAMERA.rise: the start of the camera's rise.
export const RISE_FALLBACK = 0.8

// The start of the camera's rise, s after the fire mark: the camera's own number where its tune file has one.
export const riseAfterFire = (): number => (bossTune as { CAMERA?: { rise?: readonly number[] } }).CAMERA?.rise?.[0] ?? RISE_FALLBACK

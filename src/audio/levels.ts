// Every number of the sound side that the config does not hold. The chain, the mix and the site all read them here.
import type { CueClass } from './cues'

// The level each class is set to by the chain. Effects are set by their peak, the room tone by its mean level, the voice by its loudness.
export const CLASS_LEVEL: Record<CueClass | 'voice', { measure: 'peak' | 'rms' | 'lufs'; db: number }> = {
  tone: { measure: 'rms', db: -46 },
  tick: { measure: 'peak', db: -16 },
  mechanism: { measure: 'peak', db: -10 },
  hit: { measure: 'peak', db: -5 },
  music: { measure: 'peak', db: -14 },
  voice: { measure: 'lufs', db: -18 }
}

export const CHAIN = {
  // A sound starts where it first rises above this much under its own peak, and ends where it last does.
  trimStartDb: -40,
  trimEndDb: -50,
  preRollMs: 2,
  fadeInMs: 3,
  // The fade out is this share of the sound, held between the two limits.
  fadeOutShare: 0.25,
  fadeOutMinMs: 8,
  fadeOutMaxMs: 120,
  lowCutHz: 60,
  voiceLowCutHz: 80,
  // A loop is crossfaded from its end into its start over this share of itself, at most this long.
  loopCrossShare: 0.2,
  loopCrossMaxMs: 1000,
  // The step at the seam of a loop may be at most this much larger than the usual step from one sample to the next,
  // and the level round the seam at most this far from the level of the whole.
  loopSeamMaxStepDb: 10,
  loopSeamMaxLevelDb: 3,
  // Two hits in one take are separate when the level between them falls this far under the take's peak for at least this long.
  hitGapDb: -30,
  hitGapMs: 60,
  hitMinMs: 20,
  // A pause in a narrator line is a stretch this quiet, under the line's peak, for at least this long.
  pauseDb: -35,
  pauseMinMs: 180
}

export const DUCK = {
  // How fast the effects go down before a line and come back after it.
  attackSeconds: 0.08,
  releaseSeconds: 0.3
}

export const LIVE = {
  // A plain audio element that has not become playable after this long counts as not loaded.
  elementLoadSeconds: 5,
  // A line of a beat may start this late and still be spoken. Later than that it is dropped.
  beatLateSeconds: 1.5,
  // A live line is about what happened just now, so it may wait this long and no longer.
  liveLateSeconds: 0.4,
  // The same cue set off twice within this time sounds once.
  sameCueSeconds: 0.012,
  // A loop that nothing stops ends by itself after this long.
  loopMaxSeconds: 30,
  volumeRampSeconds: 0.03,
  // The sounds of film A's opening are known before they are due, so each is set on the sound clock this long ahead of the picture.
  // It is longer than the longest step the film takes in one drawn frame, so a slow page drops none.
  aheadSeconds: 0.6,
  // How far left or right of the middle a sound at the edge of the page sits, from 0 to 1.
  panWidth: 0.35,
  // Some browsers start sound only at the end of a touch or a click. The sound graph is asked to run again at each of these.
  wakeEvents: ['pointerup', 'touchend', 'click', 'keydown']
}

export const MIX = {
  bitsPerSample: 24,
  // The limiter holds peaks this far under audio.truePeakDb so the measured true peak stays under it.
  limiterMarginDb: 0.4,
  limiterLookaheadMs: 5,
  levelPasses: 4,
  edgeFadeMs: 5
}

export const db = (v: number): number => Math.pow(10, v / 20)
export const toDb = (v: number): number => (v > 0 ? 20 * Math.log10(v) : -Infinity)

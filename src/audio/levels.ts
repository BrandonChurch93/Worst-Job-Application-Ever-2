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
  // A hit, and a tick shorter than the limit, is a contact: it starts this long before its first sample within this much
  // of its peak, measured after the low cut, so that what is heard lands on the frame of the contact. Other sounds keep their lead in.
  contactStartDb: -9,
  contactLeadMs: 4,
  contactMaxSeconds: 0.6,
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
  // A loop of music is cut to whole pulses and blended over one pulse, one loop apart, where a steady pulse is found.
  // The pulse is looked for between these two periods in steps of this size; under this strength there is none.
  pulseStepMs: 2,
  pulseMinSeconds: 0.15,
  pulseMaxSeconds: 0.75,
  pulseMinStrength: 0.3,
  // Whole groups of pulses are kept, the largest of these that fits.
  pulseGroups: [8, 4, 2],
  // The loop's length may be this far from a whole number of pulses, in pulses.
  pulseMaxOffBy: 0.02,
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
  // The wait the narrator's arithmetic allows a live line when it is given none. The script's lines are given no limit: they wait for the line before and the gap.
  liveLateSeconds: 0.4,
  // Whether the effects are held down under a line that is a silent stand-in. Off: nothing is heard to make room for. A line with a voice holds them down always.
  standInDucks: false,
  // A line with a voice that ends sooner than its file, at a pause, on a mark or because it is taken back, goes out over this long.
  voiceFadeSeconds: 0.2,
  // Line 1 belongs to the careers page: when that page's button is pressed or the page is turned while it is being said, it goes out over this long.
  openingFadeSeconds: 0.3,
  // The seconds line 1 waits after sound is allowed, so that a press of Apply by the same gesture is seen first and takes it back.
  openingWaitSeconds: 0.15,
  // The same cue set off twice within this time sounds once.
  sameCueSeconds: 0.012,
  // A loop that nothing stops ends by itself after this long.
  loopMaxSeconds: 30,
  // A loop comes in and goes out over this long, so it neither starts nor stops on a step. The room tone comes in slower.
  loopFadeSeconds: 0.03,
  toneFadeInSeconds: 0.4,
  // The careers page stays on screen this long after the turn away from it begins, and comes on screen this long after the turn to it begins: half a turn.
  // The room tone is out by then on the way in, and starts then on the way out.
  quietTurnSeconds: 0.5,
  volumeRampSeconds: 0.03,
  // One fixed gain after everything, in dB down, so the sum of a line and the effects stays at or under audio.truePeakDb. npm run sound -- --levels measures it.
  headroomDb: 1.5,
  // The engine keeps this many entries of its log of the narrator's lines, the newest.
  logMax: 600,
  // The sounds of film A's opening are known before they are due, so each is set on the sound clock this long ahead of the picture.
  // It is longer than the longest step the film takes in one drawn frame, so a slow page drops none.
  aheadSeconds: 0.6,
  // How far left or right of the middle a sound at the edge of the page sits, from 0 to 1.
  panWidth: 0.35,
  // Some browsers start sound only at the end of a touch or a click. The sound graph is asked to run again at each of these.
  wakeEvents: ['pointerup', 'touchend', 'click', 'keydown']
}

// The room tone as it was made holds a buzz: a 50 Hz cycle with a harmonic at every 50 Hz up to 8 kHz, and a 100 Hz tone that drifts.
// One switch: with dehum on, the engine and the film's mix play the tone with the buzz taken out; with it off they play the file as it is.
export const TONE = {
  dehum: true,
  // The cycle of the buzz, and how much of the comb's memory is kept from one cycle to the next: nearer 1 is a narrower notch at each harmonic.
  humHz: 50,
  combKeep: 0.9,
  // The tones that drift and so pass the comb, each with its own notch.
  notches: [{ hz: 100, q: 6 }, { hz: 200, q: 12 }]
}

export const PACK = {
  // The bit rate of a packed narrator line. At 64 the MP3 comes back up to 3 dB over the peak of its kept sound, over full scale, and a browser's decoder cuts that flat.
  lineKbps: 128
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

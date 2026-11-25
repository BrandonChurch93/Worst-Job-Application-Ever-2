// The table of events to cues: which sound a named event of the stage plays.
// Sound hangs on events, never on frame numbers. Startup fails if a cue here is not in audio.sfx.
// It grows with the pages. An event that is not listed here is silent.
export const eventCues: Record<string, string> = {
  'step': 'step',
  'card-flip': 'card-flip',
  'button-press': 'button-press',
  'page-turn': 'page-turn',
  'keyboard-rise': 'keyboard-rise',
  'key-press': 'key-press',
  'turret-rise': 'turret-rise',
  'bolt-fire': 'bolt-fire',
  'bolt-hit': 'bolt-hit',
  'keys-shuffle': 'keys-shuffle',
  'slab-drop': 'slab-drop'
}

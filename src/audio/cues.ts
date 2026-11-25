// The table of events to cues: which sound a named event of the stage plays.
// Sound hangs on events, never on frame numbers. Startup fails if a cue here is not in audio.sfx.
// This file is data only. The app reads it in every mode, so it may import no audio code.
export const eventCues: Record<string, string> = {
  'room-tone': 'room-tone',
  'step': 'step',
  'card-flip': 'card-flip',
  'button-press': 'button-press',
  'page-turn': 'page-turn',
  'keyboard-rise': 'keyboard-rise',
  'key-press': 'key-press',
  'turret-rise': 'turret-rise',
  'bolt-fire': 'bolt-fire',
  'bolt-hit': 'bolt-hit',
  'bolt-hit-cursor': 'bolt-hit',
  'sizzle': 'sizzle',
  'keys-shuffle': 'keys-shuffle',
  'slab-drop': 'slab-drop',
  'paper-slide': 'paper-slide',
  'shredder': 'shredder',
  'paper-strain': 'paper-strain',
  'arms-out': 'paper-strain',
  'strips-zip': 'strips-zip',
  'row-open': 'row-open',
  'dial-wind': 'dial-wind',
  'dial-return': 'dial-return',
  'dial-fling': 'dial-return',
  'lever-pull': 'lever-pull',
  'reels-spin': 'reels-spin',
  'coins': 'coins',
  'crank-turn': 'crank-turn',
  'crank-runaway': 'crank-runaway',
  'flatten': 'flatten',
  'peel-up': 'peel-up',
  'ball-seal': 'ball-seal',
  'tube-run': 'tube-run',
  'lights-down': 'lights-down',
  'power-on': 'power-on',
  'plunger': 'plunger',
  'bumper': 'bumper',
  'scoop-kick': 'scoop-kick',
  'flasher': 'flasher',
  'ramp-roll': 'ramp-roll',
  'ball-drop': 'ball-drop',
  'flipper': 'flipper',
  'flipper-save': 'flipper',
  'doors-slam': 'doors-slam',
  'drain': 'drain',
  'tier-fall': 'tier-fall',
  'lift': 'lift',
  'spiral': 'spiral',
  'spinner': 'spinner',
  'drop-target': 'drop-target',
  'sling': 'sling',
  'ball-open': 'ball-open',
  'checkbox': 'checkbox',
  'button-crack': 'button-crack',
  'unfold': 'unfold',
  'dart-fire': 'dart-fire',
  'dart-hit': 'dart-hit',
  'slab-fire': 'slab-fire',
  'popup': 'popup',
  'session-expired': 'popup',
  'power-down': 'power-down',
  'hold-music': 'hold-music',
  'letter-drop': 'letter-drop',
  'stamp': 'stamp',
  'share': 'button-press',
  'ui-tick': 'ui-tick',
  'key-tap': 'key-tap',
  'ui-send': 'ui-send'
}

// Events that are left without a sound on purpose.
export const silentEvents: string[] = ['popup-close']

// An event that ends a sound that would otherwise run on. A page turn ends every running loop but the room tone.
export const stopEvents: Record<string, string[]> = {
  'shredder-stop': ['shredder'],
  'tug-lost': ['paper-strain'],
  'strips-zip': ['shredder', 'paper-strain'],
  'hold-music-stop': ['hold-music'],
  'letter-drop': ['hold-music']
}

// Cues that repeat until they are stopped.
export const loopCues: string[] = ['room-tone', 'shredder']

// What sets each live line of the narrator off. The keys are the keys of liveOnly in content/narration.json.
export type LiveTrigger =
  | { on: 'hit' }
  | { on: 'event'; event: string; once?: boolean }
  | { on: 'call' }

export const liveTriggers: Record<string, LiveTrigger> = {
  'idle': { on: 'call' },
  'hit': { on: 'hit' },
  'slowTyping': { on: 'event', event: 'slow-typing' },
  'realKeyboard': { on: 'event', event: 'real-keyboard' },
  'tugLost': { on: 'event', event: 'tug-lost' },
  'pinball.flipper': { on: 'event', event: 'flipper', once: true },
  'boss.verify': { on: 'event', event: 'checkbox' },
  'boss.slow': { on: 'event', event: 'boss-slow' },
  'skip': { on: 'event', event: 'skip' },
  'watchFilm': { on: 'call' }
}

// The live lines an event of the stage sets off, in table order.
export function liveKeysFor(e: { name: string; hitsCursor: boolean }, seen: Set<string>): string[] {
  const out: string[] = []
  for (const [key, t] of Object.entries(liveTriggers)) {
    if (t.on === 'hit' && e.hitsCursor) out.push(key)
    if (t.on === 'event' && t.event === e.name) {
      if (t.once) {
        if (seen.has(key)) continue
        seen.add(key)
      }
      out.push(key)
    }
  }
  return out
}

// The level class of each cue: room tone is quietest, then the walking and the small ticks, then the mechanisms, then the hits and slams.
export type CueClass = 'tone' | 'tick' | 'mechanism' | 'hit' | 'music'

export const cueClass: Record<string, CueClass> = {
  'room-tone': 'tone',
  'step': 'tick',
  'card-flip': 'tick',
  'button-press': 'mechanism',
  'page-turn': 'hit',
  'keyboard-rise': 'mechanism',
  'key-press': 'tick',
  'turret-rise': 'mechanism',
  'bolt-fire': 'mechanism',
  'bolt-hit': 'hit',
  'sizzle': 'tick',
  'keys-shuffle': 'mechanism',
  'slab-drop': 'hit',
  'paper-slide': 'tick',
  'shredder': 'mechanism',
  'paper-strain': 'tick',
  'strips-zip': 'mechanism',
  'row-open': 'mechanism',
  'dial-wind': 'mechanism',
  'dial-return': 'mechanism',
  'lever-pull': 'mechanism',
  'reels-spin': 'mechanism',
  'coins': 'hit',
  'crank-turn': 'mechanism',
  'crank-runaway': 'mechanism',
  'flatten': 'hit',
  'peel-up': 'tick',
  'ball-seal': 'mechanism',
  'tube-run': 'mechanism',
  'lights-down': 'mechanism',
  'power-on': 'mechanism',
  'plunger': 'hit',
  'bumper': 'hit',
  'scoop-kick': 'hit',
  'flasher': 'tick',
  'ramp-roll': 'mechanism',
  'ball-drop': 'hit',
  'flipper': 'hit',
  'doors-slam': 'hit',
  'drain': 'mechanism',
  'tier-fall': 'hit',
  'lift': 'mechanism',
  'spiral': 'mechanism',
  'spinner': 'mechanism',
  'drop-target': 'hit',
  'sling': 'hit',
  'ball-open': 'hit',
  'checkbox': 'tick',
  'button-crack': 'hit',
  'unfold': 'mechanism',
  'dart-fire': 'tick',
  'dart-hit': 'tick',
  'slab-fire': 'hit',
  'popup': 'mechanism',
  'power-down': 'mechanism',
  'hold-music': 'music',
  'letter-drop': 'tick',
  'stamp': 'hit',
  'ui-tick': 'tick',
  'key-tap': 'tick',
  'ui-send': 'tick'
}

// The short fixed list of small pitch offsets laid over the variants, in cents. Its length shares no factor with any variant count, so the pairs repeat late.
export const PITCH_CENTS: number[] = [0, 35, -30, 20, -45, 10, -15]

// Which variant and which pitch offset the nth play of a cue uses, counting from zero. Never random.
export function variantAt(count: number, variants: number): { variant: number; cents: number } {
  const v = Math.max(1, Math.floor(variants))
  return { variant: count % v, cents: v > 1 ? PITCH_CENTS[count % PITCH_CENTS.length]! : 0 }
}

// The file ids of the kept sounds, shared by the tools, the mix and the site.
export const variantId = (cue: string, variant: number, variants: number): string => (variants > 1 ? `${cue}.${variant + 1}` : cue)
export const filmLineId = (beat: string, index: number): string => `line.${beat}.${index}`
export const liveLineId = (key: string, index: number): string => `line.live.${key}.${index}`

// The kept sound the nth play of a cue uses, from the ones that exist, and its pitch offset. Null when the cue has no kept sound.
export function pickVariant(cue: string, count: number, variants: number, has: (id: string) => boolean): { id: string; cents: number } | null {
  const v = Math.max(1, Math.floor(variants))
  const ids: string[] = []
  for (let i = 0; i < v; i++) if (has(variantId(cue, i, v))) ids.push(variantId(cue, i, v))
  if (!ids.length) return null
  const at = variantAt(count, ids.length)
  return { id: ids[at.variant]!, cents: v > 1 ? PITCH_CENTS[count % PITCH_CENTS.length]! : 0 }
}

export interface OpeningPlan {
  prompt: string
  charsPerSecond: number
  levelOpens: number
  levelPicks: number
  sendPressed: number
  linesDone: number[]
}

// The sounds of film A's prompt opening, from its own times: a key tap for each letter as it shows, a tick when the level control opens,
// when the level is picked and as each line of the build screen is ticked off, and the send tone as the send control goes down.
export function openingEvents(o: OpeningPlan, fps: number): { name: string; frame: number; x: number }[] {
  const frame = (t: number) => Math.max(0, Math.ceil(t * fps - 1e-6))
  const out: { name: string; frame: number; x: number }[] = []
  for (let i = 0; i < o.prompt.length; i++) out.push({ name: 'key-tap', frame: frame(i / o.charsPerSecond), x: 960 })
  for (const t of [o.levelOpens, o.levelPicks]) out.push({ name: 'ui-tick', frame: frame(t), x: 960 })
  out.push({ name: 'ui-send', frame: frame(o.sendPressed), x: 960 })
  for (const t of o.linesDone) out.push({ name: 'ui-tick', frame: frame(t), x: 960 })
  return out
}

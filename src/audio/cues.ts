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
  'strips-zip': 'strips-zip',
  'row-open': 'row-open',
  'dial-wind': 'dial-wind',
  'dial-return': 'dial-return',
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
  'boss-loop': 'boss-loop',
  'dart-fire': 'dart-fire',
  'dart-hit': 'dart-hit',
  'slab-fire': 'slab-fire',
  'popup': 'popup',
  'power-down': 'power-down',
  'hold-music': 'hold-music',
  'letter-drop': 'letter-drop',
  'stamp': 'stamp',
  'share': 'button-press',
  'ui-tick': 'ui-tick',
  'key-tap': 'key-tap',
  'ui-send': 'ui-send',
  'tug-lost': 'tug-lost',
  'arms-out': 'arms-out',
  'dial-fling': 'dial-fling',
  'flipper-save': 'flipper-save',
  'session-expired': 'session-expired',
  'popup-close': 'popup-close',
  'carpet-roll': 'carpet-roll',
  'inbox-take': 'inbox-take',
  'firehouse-take': 'firehouse-take',
  'metrics-card': 'metrics-card',
  'skip': 'skip'
}

// Cues the build added, inside audio.extraCuesMax, for contacts that had no sound of their own. Each plays on the event of its own name.
// audio.sfx holds their rows and the table above names them; audio/EXTRA-CUES.json says the same, and a test holds the two together.
export const extraCues: { id: string; seconds: number; event: string }[] = [
  { id: 'tug-lost', seconds: 0.6, event: 'tug-lost' },
  { id: 'arms-out', seconds: 0.5, event: 'arms-out' },
  { id: 'dial-fling', seconds: 0.8, event: 'dial-fling' },
  { id: 'flipper-save', seconds: 0.4, event: 'flipper-save' },
  { id: 'session-expired', seconds: 0.8, event: 'session-expired' },
  { id: 'popup-close', seconds: 0.3, event: 'popup-close' },
  { id: 'carpet-roll', seconds: 1.0, event: 'carpet-roll' },
  { id: 'inbox-take', seconds: 0.6, event: 'inbox-take' },
  { id: 'firehouse-take', seconds: 0.6, event: 'firehouse-take' },
  { id: 'metrics-card', seconds: 0.5, event: 'metrics-card' },
  { id: 'skip', seconds: 0.3, event: 'skip' }
]

export const cueOfEvent = (name: string): string | undefined => eventCues[name] ?? extraCues.find((x) => x.event === name)?.id

// Every cue with its length and its variants: the rows of audio.sfx, and the added cues that audio.sfx does not hold yet.
export function allCues<T extends { id: string; seconds: number }>(sfx: T[]): (T | { id: string; seconds: number; variants?: number })[] {
  return [...sfx, ...extraCues.filter((x) => !sfx.some((s) => s.id === x.id)).map((x) => ({ id: x.id, seconds: x.seconds }))]
}

// Events that are left without a sound on purpose. count-run has no cue made yet: it carries a line of the narrator.
export const silentEvents: string[] = ['count-run']

// An event that ends a sound that would otherwise run on. A page turn ends every running loop but the room tone.
export const stopEvents: Record<string, string[]> = {
  'shredder-stop': ['shredder'],
  'tug-lost': ['paper-strain'],
  'strips-zip': ['shredder', 'paper-strain'],
  'power-down': ['boss-loop'],
  'hold-music-stop': ['hold-music'],
  'letter-drop': ['hold-music']
}

// An event that starts a second sound beside its own. Addendum 001: the fight music runs under the boss battle from boss.unfold to boss.collapse.
// The boss starts to unfold on the event unfold; power-down, the start of the collapse, stops the loop.
export const alsoStarts: Record<string, string[]> = {
  'unfold': ['boss-loop']
}

// Cues that repeat until they are stopped.
export const loopCues: string[] = ['room-tone', 'shredder', 'boss-loop']

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

// The page each unit of the film is on the live site. An event of the stage carries the page it happened on.
export const unitPage: Record<string, string> = { 'marketing': 'marketing', 'step1': 'step1', 'step2': 'step2', 'pinball': 'step3', 'boss': 'step4', 'decision': 'step5' }

// What sets each line of the film off on the live site, by beat and by the line's place in the beat.
// event: the first event of that name on the line's page. gag: the stage reporting that the line's own beat is reached.
export type FilmLive =
  | { on: 'event'; event: string }
  | { on: 'gag' }

export const filmLive: Record<string, FilmLive> = {
  'marketing.stroll.0': { on: 'event', event: 'step' },
  'marketing.perks.0': { on: 'event', event: 'card-flip' },
  'step1.firstName.0': { on: 'event', event: 'keyboard-rise' },
  'step1.firstName.1': { on: 'event', event: 'bolt-hit-cursor' },
  'step1.email.0': { on: 'event', event: 'slab-drop' },
  'step1.tug.0': { on: 'event', event: 'arms-out' },
  'step2.dial.0': { on: 'gag' },
  'step2.crank.0': { on: 'gag' },
  'pinball.seal.0': { on: 'event', event: 'ball-seal' },
  'pinball.launch.0': { on: 'event', event: 'plunger' },
  'pinball.lobby.0': { on: 'event', event: 'carpet-roll' },
  'pinball.coffee.0': { on: 'event', event: 'bumper' },
  'pinball.replyAll.0': { on: 'event', event: 'inbox-take' },
  'pinball.fired.0': { on: 'event', event: 'firehouse-take' },
  'pinball.drain.0': { on: 'event', event: 'drain' },
  'boss.verify.0': { on: 'event', event: 'checkbox' },
  'boss.slabs.0': { on: 'event', event: 'slab-fire' },
  'boss.lastStand.0': { on: 'event', event: 'session-expired' },
  'decision.letter.0': { on: 'event', event: 'stamp' },
  'decision.metrics.0': { on: 'event', event: 'count-run' }
}

export const filmLiveKey = (beat: string, index: number): string => `${beat}.${index}`

// The lines of the film an event of the stage sets off: those tied to that event whose beat is on the page the event came from.
export function filmKeysForEvent(name: string, page: string, unitOfBeat: (beat: string) => string | undefined): string[] {
  const out: string[] = []
  for (const [key, t] of Object.entries(filmLive)) {
    if (t.on !== 'event' || t.event !== name) continue
    const unit = unitOfBeat(key.slice(0, key.lastIndexOf('.')))
    if (unit !== undefined && unitPage[unit] === page) out.push(key)
  }
  return out
}

// The lines of the film a beat sets off when the stage reports that it is reached.
export function filmKeysForGag(beat: string): string[] {
  return Object.entries(filmLive).filter(([key, t]) => t.on === 'gag' && key.slice(0, key.lastIndexOf('.')) === beat).map(([key]) => key)
}

// Live lines that belong to no page: a page turn does not take them back.
export const pagelessLive: string[] = ['idle', 'skip', 'watchFilm']

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
  'tug-lost': 'mechanism',
  'arms-out': 'mechanism',
  'dial-fling': 'hit',
  'flipper-save': 'hit',
  'session-expired': 'hit',
  'popup-close': 'tick',
  'carpet-roll': 'mechanism',
  'inbox-take': 'hit',
  'firehouse-take': 'hit',
  'metrics-card': 'tick',
  'skip': 'tick',
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
  'boss-loop': 'music',
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

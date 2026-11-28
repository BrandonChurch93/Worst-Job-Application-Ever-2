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

// An event that is named by its own cue before that cue's sound exists: the film's beat boss.finish names finish-fire. The cue is a row of
// audio/CHANGE-CUES.json, which alone holds its length. Nothing plays for it, no check counts it, until that row's sound is kept.
export const cuesToCome: Record<string, string> = { 'finish-fire': 'finish-fire' }

export function cueOfEvent(name: string): string | undefined {
  const known = eventCues[name] ?? extraCues.find((x) => x.event === name)?.id ?? newEventCues[name] ?? cuesToCome[name]
  if (known !== undefined) return known
  for (const p of prefixCues) if (name.startsWith(p.prefix)) return p.cue(name.slice(p.prefix.length))
  return undefined
}

// The one page with no sound effect but the press of its button: the careers page. Change note 002, item 10.
// A turn to it or away from it is silent, and the room tone is not played on it.
export const quietPage = 'marketing'
export const quietPageCues: string[] = ['button-press']
// The page a turn of the live site leads to, by the page it leaves: the order of liveFlow in src/stage/stage.ts.
export const pageAfter: Record<string, string> = { 'marketing': 'step1', 'step1': 'step2', 'step2': 'step3', 'step3': 'step4', 'step4': 'step5', 'step5': 'marketing' }

// Every cue with its length and its variants: the rows of audio.sfx, and the added cues that audio.sfx does not hold yet.
export function allCues<T extends { id: string; seconds: number }>(sfx: T[]): (T | { id: string; seconds: number; variants?: number })[] {
  return [...sfx, ...extraCues.filter((x) => !sfx.some((s) => s.id === x.id)).map((x) => ({ id: x.id, seconds: x.seconds }))]
}

// The events the units of change 002 added, each on the nearest cue of the kit, its stand-in. A name in newSilent plays nothing.
// Where a change note ordered a sound of its own for one, that sound is a row of audio/CHANGE-CUES.json: once it is kept and packed the event
// plays it (cueFor in change.ts), and until then it plays the stand-in here, which the row repeats; a test holds the two together.
export const newEventCues: Record<string, string> = {
  // boss
  'shield-glance': 'bolt-hit',
  'shot-round': 'dart-hit',
  'cannon-fire': 'slab-fire',
  'boss-heal': 'power-on',
  'bullet-fire': 'bolt-fire',
  'turret-lock': 'lever-pull',
  'big-fire': 'slab-fire',
  'arena-break': 'button-crack',
  // step 1
  'turret-load': 'lever-pull',
  'keys-break': 'button-crack',
  'page-crack': 'button-crack',
  // step 2
  'date-key': 'key-press',
  'reel-stop': 'drop-target',
  'date-hit': 'checkbox',
  'date-miss': 'popup-close',
  'crank-full': 'crank-runaway',
  'field-done': 'checkbox',
  // pinball
  'vacuum-slip': 'ball-drop',
  'vacuum-lose': 'scoop-kick',
  'frenzy-on': 'flasher',
  'loot': 'coins',
  // the narrator's script, change note 003: the fight music comes in on a phrase of line 7. A stand-in, the old loop; nothing new is made.
  'boss-music': 'boss-loop',
  'music-in': 'boss-loop'
}

export const newSilent: string[] = [
  'boss-move',
  'cannon-tell',
  'big-tell',
  'turret-off',
  'slab-shadow',
  'volume-sign',
  'field-next',
  'vacuum-on',
  'frenzy-off',
  // the events that only carry a line of the narrator
  'candidate-sensed',
  'resume-received',
  'boss-formed',
  'boss-turn'
]

// Events named by a prefix: strike:<layout id>:<n> beside every strike of the pinball table, n 1 soft, 2 hard, 3 frenzy.
// The old event of the same strike keeps its old cue, so the prefix plays nothing here. Its own sounds are the pin rows of audio/CHANGE-CUES.json,
// each on the strikes of its kind once it is kept.
export const prefixCues: { prefix: string; cue: (rest: string) => string | undefined }[] = [
  { prefix: 'strike:', cue: () => undefined }
]

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

// An event that starts a second sound beside its own. None does now: the fight music comes in on the phrase of the narrator's line 7 that names it
// (change note 003), by the event boss-music of the stage or the narrator's own mark music-in; power-down, the start of the collapse, stops the loop.
export const alsoStarts: Record<string, string[]> = {}

// Cues that repeat until they are stopped.
export const loopCues: string[] = ['room-tone', 'shredder', 'boss-loop']

// No line is only on the live site any more (change note 003). The table is kept, empty, for the tools that read it.
export const liveTriggers: Record<string, { on: string; event?: string }> = {}

// The page each unit of the film is on the live site. An event of the stage carries the page it happened on.
export const unitPage: Record<string, string> = { 'marketing': 'marketing', 'step1': 'step1', 'step2': 'step2', 'pinball': 'step3', 'boss': 'step4', 'decision': 'step5' }

// The narrator's script (change note 003): every line that is spoken, on the live site and in the film, by beat and by the line's place in the beat.
// The page of a line is the page of the unit its key starts with.
// event: the event of the stage, on the line's page, that sets it off; null for the line said when sound is allowed with its page on screen (in the film: at the start of its beat).
// until: the events on that page that end the line's moment. A line that has not started by then is not said. A turn or a skip of its page ends every moment.
// after: the line is a later part of the line named: it is said straight after it, with the gap between two lines of a beat.
// mark: an event the narrator itself gives out when that phrase of the line starts (-1 is the last phrase); the cue of that event is played then.
// jump: an event on the line's page that ends the line early, where earlyEnd says: the rest is dropped, and the parts after it follow at once.
// A line its page's turn waits for (turnWaitsFor) ends at its next pause mark, so that the visitor is not held for a sentence.
// keeps: the line is not taken back when its page is left; it is set off by the turn away from that page.
// loud: the caption shows the line in capitals, large.
// steps.hidesOnRise: the caption leaves when the camera's rise begins, riseAfterFire() of src/ui/rise.ts after the last mark, while the voice goes on.
export interface SpokenRow { event: string | null; until: string[]; after?: string; mark?: { phrase: number; event: string }; jump?: string[]; keeps?: boolean; loud?: boolean; steps?: { next: string; last: string; ends?: string; hidesOnRise?: boolean } }

export const spoken: Record<string, SpokenRow> = {
  'marketing.stroll.0': { event: null, until: ['button-press'] },
  'step1.firstName.0': { event: 'candidate-sensed', until: ['field-done'] },
  'step1.shredded.0': { event: 'resume-received', until: [] },
  'step2.crank.0': { event: 'volume-sign', until: ['field-done'] },
  'step2.crank.1': { event: 'crank-full', until: [] },
  'pinball.seal.0': { event: 'vacuum-on', until: ['ball-seal'] },
  'boss.verify.0': { event: 'checkbox', until: ['boss-formed'] },
  'boss.unfold.0': { event: 'boss-formed', until: ['turret-rise', 'power-down'], jump: ['boss-turn'] },
  'boss.unfold.1': { event: null, after: 'boss.unfold.0', until: ['turret-rise', 'power-down'], mark: { phrase: -1, event: 'music-in' } },
  'boss.unfold.2': { event: null, after: 'boss.unfold.1', until: ['turret-rise', 'power-down'] },
  'boss.finish.0': { event: 'finish-arms', until: ['boss-gone'], steps: { next: 'finish-charge', last: 'finish-fire', hidesOnRise: true } },
  'decision.letter.0': { event: 'stamp', until: [], jump: ['button-press'] },
  'decision.reset.0': { event: 'page-turn', until: [], keeps: true }
}

// The line a page's own way on waits for on the live site: its button cannot be pressed and does not look ready until the line has ended. The skip link does not wait.
export const waitsFor: Record<string, string> = { step2: 'step2.crank.1' }

// The line a page's turn waits for on the live site once that line was ended by a jump on that page: the page may be pressed while the line is said,
// and the narrator owes the page until the line's last phrase is out and the gap after it has passed, so that the line the turn sets off starts on the turn.
export const turnWaitsFor: Record<string, string> = { step5: 'decision.letter.0' }

// The event of the stage that also stands for a mark of the narrator: its cue is played only when the narrator has not booked the line that gives the mark.
export const markStandsFor: Record<string, string> = { 'boss-music': 'music-in' }

// The lines an event of the stage on a page sets off, in table order.
export function spokenKeysFor(name: string, page: string): string[] {
  return Object.entries(spoken).filter(([key, r]) => r.event === name && unitPage[key.slice(0, key.indexOf('.'))] === page).map(([key]) => key)
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
// The page a line of the film is said over: the page of its unit, or, for a line set off by the turn of the page, the page turned to.
export const filmLinePage = (key: string, unit: string): string => {
  const page = unitPage[unit] ?? unit
  return spoken[key]?.event === 'page-turn' ? pageAfter[page] ?? page : page
}
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

// How long a line with a voice takes to go out when it ends sooner than its file, in seconds. It is a number of this table because the page that holds its turn
// for line 8 (step 5) reads it too: a press nearer to the next pause than this is heard out for this long, and the turn waits for that.
export const VOICE_FADE_SECONDS = 0.2
// A phrase that ends a sentence of the script: its words end in a full stop, a question mark or an exclamation mark.
export const endsSentence = (words: string): boolean => /[.?!]$/.test(words.trim())
// The longest a visitor's event waits for the sentence being said to end, in seconds: the first sentence of line 7, "The applicant is ready to give up.",
// ends at 2.264 s in its take (line.boss.unfold.0, 11.325 s in public/audio/index.json), so a click in it is always answered with the whole sentence, and no click waits longer than this.
// tests/b-voice.test.ts and tests/audio-own-times.test.ts hold it to the index.
export const SENTENCE_WAIT_SECONDS = 2.3
// Where a line that a visitor's event ends early stops, in seconds from the line's start: at the end of the sentence being said when that is no more than
// SENTENCE_WAIT_SECONDS after the event, otherwise at its next pause. ends: the end of each phrase; sentenceEnds: those of them that end a sentence; at: when the event came.
// The voice (src/audio/index.ts) and the page that keeps time by the line (step 4) both read this, so they stop at the same moment.
export function earlyEnd(ends: readonly number[], sentenceEnds: readonly number[], at: number): number {
  const pause = ends.find((e) => e >= at - 1e-6) ?? ends[ends.length - 1] ?? 0
  const sentence = sentenceEnds.find((e) => e >= at - 1e-6)
  return sentence !== undefined && sentence - at <= SENTENCE_WAIT_SECONDS ? sentence : pause
}
// A line that jumps on the live site only: in the film it is said whole, so nothing of the film keeps time by its jump.
export const jumpsLiveOnly = (key: string): boolean => Object.values(turnWaitsFor).includes(key)

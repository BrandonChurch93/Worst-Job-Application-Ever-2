// The one typed copy of config/showcase.json, checked at startup.
// No other file holds a number, an id, a name or an approved image path that the config holds.
import raw from '../config/showcase.json'

export type Config = typeof raw
export const config: Config = raw

export interface Checks {
  // Every file under references/approved/, as the build's index lists them. Null where the folder does not exist: the host never gets it.
  approved: string[] | null
  // The table of events to cues, from src/audio/cues.ts.
  eventCues: Record<string, string>
  // The film over film.maxSeconds is carried as a known problem where this is set: the site still starts.
  carryLength?: boolean
}

const TOP_KEYS = ['name', 'slug', 'seed', 'repo', 'host', 'employer', 'table', 'applicant', 'film', 'intro', 'formats', 'platform', 'export', 'previewFilm', 'tiers', 'cursor',
  'cameras', 'layout', 'sim', 'live', 'perf', 'assetSets', 'units', 'lookLockUnit', 'buildOrderAfterLookLock', 'settledAll', 'keys', 'sheets', 'stills', 'references', 'detail',
  'assets', 'audio', 'quality', 'critics', 'status', 'budget', 'sandbox', 'deliver', 'links', 'scale', 'settledUnit']
const DEEP_KEYS = ['film.fps', 'film.previewFps', 'film.shutterDegrees', 'film.maxSeconds', 'film.units', 'film.beats', 'film.unitTuneFraction', 'film.beatToleranceSeconds',
  'formats.master.width', 'formats.master.height', 'formats.hd.width', 'formats.hd.height', 'formats.preview.width', 'formats.preview.height',
  'tiers.draft.samplesPerFrame', 'tiers.review.samplesPerFrame', 'tiers.final.samplesPerFrame', 'cursor.heightPxAt1080', 'cursor.armsOnlyInBeat', 'cameras.home.fovDeg',
  'sim.stepHz', 'sim.checkpointSeconds', 'audio.sfx', 'audio.narratorMaxWordsPerSecond', 'audio.lineGapSeconds', 'budget.runHours', 'budget.phaseHours',
  'deliver.cardLoop.fps', 'deliver.cardLoop.seconds', 'deliver.cardLoop.candidates', 'references.approved', 'quality.passScore', 'critics.maxImageLongEdgePx',
  'budget.afterReviewHours', 'budget.reserveHours', 'budget.reviewRoundHours', 'budget.continueHours', 'budget.extendHours', 'budget.statusMaxGapMinutes', 'export.files',
  'film.hookSeconds', 'status.maxPictures', 'status.minGapMinutes', 'scale.sizes', 'scale.grid', 'scale.heights', 'scale.kinds', 'live.quality', 'lookLockUnit']

const get = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v !== null && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), o)
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9
const whole = (a: number, b: number) => b > 0 && near(a / b, Math.round(a / b))

// Every reason the config cannot be used, in plain words. An empty list means it is sound.
export function configProblems(c: Config, checks: Checks): string[] {
  const out: string[] = []
  for (const k of TOP_KEYS) if (get(c, k) === undefined) out.push(`config: the key "${k}" is missing`)
  for (const k of DEEP_KEYS) if (get(c, k) === undefined) out.push(`config: the key "${k}" is missing`)
  if (out.length) return out

  const filmUnits = new Set(c.film.units.map((u) => u.id))
  const units = new Set(c.units.map((u) => u.id))
  const beats = new Set(c.film.beats.map((b) => b.id))
  const cameras = new Set([...Object.keys(c.cameras), 'film'])
  const keys = new Set(c.keys.map((k) => k.id))

  for (const b of c.film.beats) if (!filmUnits.has(b.unit)) out.push(`config: beat "${b.id}" names the unit "${b.unit}", which film.units does not have`)
  for (const k of c.keys) {
    if (!units.has(k.unit)) out.push(`config: key "${k.id}" names the unit "${k.unit}", which does not exist`)
    if (!beats.has(k.beat)) out.push(`config: key "${k.id}" names the beat "${k.beat}", which does not exist`)
    if (!cameras.has(k.camera)) out.push(`config: key "${k.id}" names the camera "${k.camera}", which does not exist`)
  }
  for (const s of c.sheets as { id: string; unit: string; camera?: string }[]) {
    if (!units.has(s.unit)) out.push(`config: sheet "${s.id}" names the unit "${s.unit}", which does not exist`)
    if (s.camera !== undefined && !cameras.has(s.camera)) out.push(`config: sheet "${s.id}" names the camera "${s.camera}", which does not exist`)
  }
  for (const s of c.stills as { id: string; unit: string; camera: string; beat?: string }[]) {
    if (!units.has(s.unit)) out.push(`config: still "${s.id}" names the unit "${s.unit}", which does not exist`)
    if (s.beat !== undefined && !beats.has(s.beat)) out.push(`config: still "${s.id}" names the beat "${s.beat}", which does not exist`)
    if (!cameras.has(s.camera)) out.push(`config: still "${s.id}" names the camera "${s.camera}", which does not exist`)
  }

  let total = 0
  for (const u of c.film.units) {
    total += u.seconds
    const mine = c.film.beats.filter((b) => b.unit === u.id).sort((a, b) => a.from - b.from)
    if (!mine.length) {
      out.push(`config: the page "${u.id}" has no beats`)
      continue
    }
    if (!near(mine[0]!.from, 0)) out.push(`config: the beats of "${u.id}" do not start at zero`)
    for (let i = 1; i < mine.length; i++) {
      const a = mine[i - 1]!
      const b = mine[i]!
      if (b.from > a.to + 1e-9) out.push(`config: there is a gap between the beats "${a.id}" and "${b.id}"`)
      if (b.from < a.to - 1e-9) out.push(`config: the beats "${a.id}" and "${b.id}" overlap`)
    }
    for (const b of mine) if (!(b.to > b.from)) out.push(`config: the beat "${b.id}" has no length`)
    if (!near(mine[mine.length - 1]!.to, u.seconds)) out.push(`config: the beats of "${u.id}" end at ${mine[mine.length - 1]!.to} s and the page is ${u.seconds} s long`)
  }
  if (total > c.film.maxSeconds + 1e-9 && !checks.carryLength) out.push(`config: film.units adds up to ${total} s, which is more than film.maxSeconds, ${c.film.maxSeconds} s`)

  const phaseTotal = Object.values(c.budget.phaseHours).reduce((s, v) => s + v, 0)
  if (!near(phaseTotal, c.budget.runHours)) out.push(`config: budget.phaseHours adds up to ${phaseTotal} h and budget.runHours is ${c.budget.runHours} h`)

  if (!whole(c.film.fps, c.film.previewFps)) out.push(`config: film.fps, ${c.film.fps}, is not a whole multiple of film.previewFps, ${c.film.previewFps}`)
  if (!whole(c.film.fps, c.deliver.cardLoop.fps)) out.push(`config: film.fps, ${c.film.fps}, is not a whole multiple of deliver.cardLoop.fps, ${c.deliver.cardLoop.fps}`)

  if (!beats.has(c.cursor.armsOnlyInBeat)) out.push(`config: cursor.armsOnlyInBeat, "${c.cursor.armsOnlyInBeat}", is not a beat`)
  for (const id of c.deliver.cardLoop.candidates) if (!keys.has(id)) out.push(`config: deliver.cardLoop.candidates names "${id}", which is not a key`)

  const cues = new Set(c.audio.sfx.map((s) => s.id))
  for (const [event, cue] of Object.entries(checks.eventCues)) if (!cues.has(cue)) out.push(`sound: the event "${event}" names the cue "${cue}", which audio.sfx does not have`)

  if (checks.approved === null) return out
  const approved = new Set(checks.approved)
  const images = [...c.keys.map((k) => k.image), ...c.sheets.map((s) => s.image), ...Object.values(c.references.approved)]
  for (const image of new Set(images)) if (!approved.has(image)) out.push(`config: the approved image "${image}" is missing`)
  return out
}

export function fail(problems: string[]): never {
  throw new Error(`The site cannot start. ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n- ${problems.join('\n- ')}`)
}

// Small readers the rest of the code uses instead of reaching into the config by hand.
export const stepHz = config.sim.stepHz
export const filmSeconds = () => config.film.units.reduce((s, u) => s + u.seconds, 0)
export const unitStart = (id: string) => {
  let t = 0
  for (const u of config.film.units) {
    if (u.id === id) return t
    t += u.seconds
  }
  throw new Error(`No page called "${id}" in film.units`)
}
export const beat = (id: string) => {
  const b = config.film.beats.find((x) => x.id === id)
  if (!b) throw new Error(`No beat called "${id}"`)
  return b
}
export const formatById = (id: string): { id: string; width: number; height: number } => {
  for (const [key, f] of Object.entries(config.formats)) if (f.id === id || key === id) return f
  throw new Error(`No format called "${id}"`)
}
export const tierSamples = (tier: string): number => {
  const t = (config.tiers as Record<string, { samplesPerFrame: number }>)[tier]
  if (!t) throw new Error(`No tier called "${tier}"`)
  return t.samplesPerFrame
}

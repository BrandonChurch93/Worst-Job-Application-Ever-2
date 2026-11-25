import { eventCues } from '../audio/cues'
import { config, filmSeconds, stepHz, unitStart } from '../config'
import { narration, timedLines } from '../copy'
import { basis, homePose } from '../stage/camera'
import { ScriptDriver, Stage, wholeFilmFlow } from '../stage/stage'
import type { CameraPose, PageMaker } from '../stage/types'
import { makeLoop } from './loop'
import { makeOpening } from './opening'

type V3 = [number, number, number]

export interface Span { id: string; first: number; last: number; frames: number }
export interface CutEvent { name: string; frame: number; step: number; seconds: number; unit: string; beat: string; page: string; x: number; y: number; hitsCursor: boolean; cue: string | null }
export interface BeatEvent { name: string; frame: number | null; seconds: number | null; inside: boolean; offByFrames: number | null }
export interface CutBeat extends Span { unit: string; event: BeatEvent | null }
export interface CutLine { id: string; beat: string; index: number; text: string; first: number; startSeconds: number; last: number; endSeconds: number; seconds: number; length: 'estimate' | 'take'; take: string | null; gapToNextSeconds: number | null }
export interface KeptTake { file: string; record: Record<string, unknown> }
export interface Framing { x: number; y: number; w: number; h: number; corners: number[][] | null }
export interface Shot { beat: string; unit: string; first: number; last: number; cameras: string[]; move: string; cuts: number[]; start: Framing; end: Framing; pinball: boolean; lens: { fovDeg: number; equivalentMm: number }[]; focus: { distance: number; aperture: number | null; stated: boolean }[] }
export interface CutList {
  what: string
  fps: number
  frameCount: number
  seconds: number
  beatToleranceSeconds: number
  beatToleranceFrames: number
  units: Span[]
  beats: CutBeat[]
  lines: CutLine[]
  events: CutEvent[]
  opening: { frameCount: number; seconds: number; marks: { typing: number; level: number; build: number } }
  loop: { frameCount: number; seconds: number; scene: string }
}
export interface Cut { list: CutList; shots: Shot[]; problems: string[] }

const fps = config.film.fps
const frameOf = (seconds: number): number => Math.round(seconds * fps)
const round = (v: number, places = 3): number => Number(v.toFixed(places))
const stepsPerFrame = stepHz / fps

export const lineId = (beat: string, index: number): string => `line.${beat}.${index}`

function spans(): { units: Span[]; beats: CutBeat[] } {
  const units = config.film.units.map((u) => {
    const first = frameOf(unitStart(u.id))
    const last = frameOf(unitStart(u.id) + u.seconds) - 1
    return { id: u.id, first, last, frames: last - first + 1 }
  })
  const beats = config.film.beats.map((b) => {
    const first = frameOf(unitStart(b.unit) + b.from)
    const last = frameOf(unitStart(b.unit) + b.to) - 1
    return { id: b.id, unit: b.unit, first, last, frames: last - first + 1, event: null as BeatEvent | null }
  })
  return { units, beats }
}

function takeOf(kept: KeptTake[], id: string, text: string): { seconds: number; file: string } | null {
  const plain = (t: unknown) => String(t ?? '').split(narration.pauseMark).join(' ').replace(/\s+/g, ' ').trim()
  for (const k of kept) {
    const r = k.record
    if (r['id'] !== id && r['line'] !== id && plain(r['text']) !== plain(text)) continue
    for (const key of ['seconds', 'lengthSeconds', 'durationSeconds', 'duration']) {
      const v = r[key]
      if (typeof v === 'number' && v > 0) return { seconds: v, file: k.file }
    }
  }
  return null
}

const length = (a: V3, b: V3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export function framing(pose: CameraPose): Framing {
  const b = basis(pose)
  const d = length(pose.eye, pose.target)
  const t = Math.tan((pose.fov * Math.PI) / 360)
  const h = 2 * d * t
  const w = (h * 16) / 9
  const out: Framing = { x: round(pose.target[0] + 960 - w / 2, 1), y: round(540 - pose.target[1] - h / 2, 1), w: round(w, 1), h: round(h, 1), corners: null }
  const straight = Math.abs(b.forward[2] + 1) < 1e-6
  if (straight) return out
  const floor = pose.target[2]
  const corners: number[][] = []
  for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]] as const) {
    const ray: V3 = [b.forward[0] + b.right[0] * sx * t * (16 / 9) + b.up[0] * sy * t, b.forward[1] + b.right[1] * sx * t * (16 / 9) + b.up[1] * sy * t, b.forward[2] + b.right[2] * sx * t * (16 / 9) + b.up[2] * sy * t]
    const k = (floor - pose.eye[2]) / ray[2]
    if (!(ray[2] < -1e-9) || !Number.isFinite(k) || k <= 0) return out
    corners.push([round(pose.eye[0] + ray[0] * k + 960, 1), round(540 - (pose.eye[1] + ray[1] * k), 1)])
  }
  out.corners = corners
  return out
}

export const equivalentMm = (fovDeg: number): number => round(18 / (Math.tan((fovDeg * Math.PI) / 360) * (16 / 9)), 1)

const same = (a: CameraPose, b: CameraPose, eps = 1e-6): boolean => length(a.eye, b.eye) < eps && length(a.target, b.target) < eps && Math.abs(a.fov - b.fov) < eps

export interface Sample { pose: CameraPose; camera: string; page: string }

const CUT_JUMP = 0.08
const MOVE_LEAST = 0.02

export function moveOf(samples: Sample[]): { move: string; cuts: number[] } {
  const frames = samples.map((s) => framing(s.pose))
  const centre = (f: Framing) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 })
  const apart = (a: Framing, b: Framing) => Math.hypot(centre(b).x - centre(a).x, centre(b).y - centre(a).y) / a.w
  const cuts: number[] = []
  for (let i = 1; i < samples.length; i++) {
    const a = frames[i - 1]!
    const b = frames[i]!
    if (samples[i]!.page === samples[i - 1]!.page && (apart(a, b) > CUT_JUMP || Math.abs(Math.log(b.w / a.w)) > CUT_JUMP)) cuts.push(i)
  }
  const edges = [0, ...cuts, samples.length]
  const seen = { holds: false, follows: false, closer: false, wider: false, shakes: false }
  for (let e = 0; e + 1 < edges.length; e++) {
    const from = edges[e]!
    const to = edges[e + 1]! - 1
    const a = frames[from]!
    const b = frames[to]!
    let still = true
    let furthest = 0
    for (let i = from + 1; i <= to; i++) {
      if (!same(samples[i]!.pose, samples[i - 1]!.pose)) still = false
      furthest = Math.max(furthest, apart(a, frames[i]!))
    }
    if (still) {
      seen.holds = true
      continue
    }
    const closer = b.w < a.w * (1 - MOVE_LEAST)
    const wider = b.w > a.w * (1 + MOVE_LEAST)
    const travels = apart(a, b) > MOVE_LEAST || furthest > CUT_JUMP
    if (closer) seen.closer = true
    if (wider) seen.wider = true
    if (travels) seen.follows = true
    if (!closer && !wider && !travels) {
      seen.holds = true
      if (furthest > 0) seen.shakes = true
    }
  }
  const words: string[] = []
  if (seen.holds) words.push('holds')
  if (seen.shakes) words.push('shakes')
  if (seen.follows) words.push('follows')
  if (seen.closer) words.push('pushes in')
  if (seen.wider) words.push('eases out')
  if (cuts.length) words.push(cuts.length === 1 ? 'cuts once' : `cuts ${cuts.length} times`)
  return { move: words.join(', '), cuts }
}

export function makeCut(pages: Record<string, PageMaker>, kept: KeptTake[] = []): Cut {
  const problems: string[] = []
  const frameCount = frameOf(filmSeconds())
  const { units, beats } = spans()
  const tolerance = Math.round(config.film.beatToleranceSeconds * fps)

  let next = 0
  for (const u of units) {
    if (u.first !== next) problems.push(`the unit ${u.id} starts on frame ${u.first}, and the unit before it ends on frame ${next - 1}`)
    next = u.last + 1
    let at = u.first
    for (const b of beats.filter((x) => x.unit === u.id).sort((a, x) => a.first - x.first)) {
      if (b.first !== at) problems.push(`the beat ${b.id} starts on frame ${b.first}, and the frame before it, ${at - 1}, is not the last of the beat before`)
      at = b.last + 1
    }
    if (at !== u.last + 1) problems.push(`the beats of ${u.id} end on frame ${at - 1}, and the unit ends on frame ${u.last}`)
  }
  if (next !== frameCount) problems.push(`the units end on frame ${next - 1}, and the film has ${frameCount} frames`)

  const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  const cameras = Object.keys(config.cameras).filter((n) => n !== 'home')
  const samples: Sample[] = []
  for (let f = 0; f < frameCount; f++) {
    const page = stage.page
    const time = stage.pageTime
    const film = page.camera('film', time)
    const view = page.view()
    const pose = film ?? view ?? homePose(page.scroll())
    const home = homePose(page.scroll())
    const likeHome = (p: CameraPose) => Math.abs(p.fov - home.fov) < 1e-6 && Math.abs(p.eye[0] - p.target[0]) < 1e-6 && Math.abs(p.eye[1] - p.target[1]) < 1e-6 && Math.abs(p.eye[2] - p.target[2] - (home.eye[2] - home.target[2])) < 1e-6
    let camera = film ? 'film' : view && !likeHome(view) ? 'view' : 'home'
    if (film) {
      for (const n of cameras) {
        const named = page.camera(n, time)
        if (named && same(named, film, 1e-3)) {
          camera = n
          break
        }
      }
      if (camera === 'film' && likeHome(film)) camera = 'home'
    }
    samples.push({ pose, camera, page: page.id })
    stage.advance(stepsPerFrame)
  }

  const beatAt = (frame: number): CutBeat => beats.find((b) => frame >= b.first && frame <= b.last) ?? beats[beats.length - 1]!
  const events: CutEvent[] = stage.events.filter((e) => e.step < frameCount * stepsPerFrame).map((e) => {
    const frame = Math.floor(e.step / stepsPerFrame)
    const b = beatAt(frame)
    return { name: e.name, frame, step: e.step, seconds: round(e.step / stepHz, 4), unit: b.unit, beat: b.id, page: e.page, x: round(e.x, 1), y: round(e.y, 1), hitsCursor: e.hitsCursor, cue: eventCues[e.name] ?? null }
  })

  for (const b of beats) {
    const name = (config.film.beats.find((x) => x.id === b.id) as { event?: string | null }).event
    if (!name) continue
    const named = events.filter((e) => e.name === name)
    const off = (frame: number) => (frame < b.first ? b.first - frame : frame > b.last ? frame - b.last : 0)
    const inBeat = named.find((e) => off(e.frame) === 0) ?? named.find((e) => off(e.frame) <= tolerance)
    const nearest = inBeat ?? named.slice().sort((a, x) => off(a.frame) - off(x.frame))[0]
    if (!nearest) {
      b.event = { name, frame: null, seconds: null, inside: false, offByFrames: null }
      problems.push(`the beat ${b.id} (frames ${b.first} to ${b.last}): its event ${name} was never reported`)
      continue
    }
    const by = off(nearest.frame)
    b.event = { name, frame: nearest.frame, seconds: nearest.seconds, inside: by <= tolerance, offByFrames: by }
    if (by > tolerance) problems.push(`the beat ${b.id} (frames ${b.first} to ${b.last}): its event ${name} fell on frame ${nearest.frame}, ${by} frames outside the beat, more than the ${tolerance} that film.beatToleranceSeconds allows`)
  }

  const timed = timedLines(config, narration)
  const lines: CutLine[] = timed.map((l) => {
    const id = lineId(l.beat, l.index)
    const take = takeOf(kept, id, l.text)
    const end = take ? l.start + take.seconds : l.end
    const first = frameOf(l.start)
    return { id, beat: l.beat, index: l.index, text: l.text, first, startSeconds: round(l.start), last: Math.max(first, frameOf(end) - 1), endSeconds: round(end), seconds: round(end - l.start), length: take ? 'take' as const : 'estimate' as const, take: take ? take.file : null, gapToNextSeconds: null }
  })
  lines.forEach((l, i) => {
    const after = lines[i + 1]
    if (after) l.gapToNextSeconds = round(after.startSeconds - l.endSeconds)
  })

  const pinballPages = new Set(['step3'])
  const shots: Shot[] = beats.map((b) => {
    const part = samples.slice(b.first, b.last + 1)
    const { move, cuts } = moveOf(part)
    const names: string[] = []
    for (const s of part) if (names[names.length - 1] !== s.camera) names.push(s.camera)
    const pinball = b.unit === 'pinball' || part.some((s) => pinballPages.has(s.page))
    const lens: Shot['lens'] = []
    const focus: Shot['focus'] = []
    if (pinball) {
      for (const i of [0, ...cuts, part.length - 1]) {
        const p = part[i]!.pose
        const l = { fovDeg: round(p.fov, 2), equivalentMm: equivalentMm(p.fov) }
        if (!lens.some((x) => x.fovDeg === l.fovDeg)) lens.push(l)
        const f = { distance: round(p.focus ?? length(p.eye, p.target), 0), aperture: p.aperture ?? null, stated: p.focus !== undefined }
        if (!focus.some((x) => x.distance === f.distance && x.aperture === f.aperture)) focus.push(f)
      }
    }
    return { beat: b.id, unit: b.unit, first: b.first, last: b.last, cameras: names, move, cuts: cuts.map((c) => c + b.first), start: framing(part[0]!.pose), end: framing(part[part.length - 1]!.pose), pinball, lens, focus }
  })

  const opening = makeOpening()
  const loop = makeLoop()
  const list: CutList = {
    what: 'The cut list of film B, with the opening of film A and the card loop. Made by npm run cut from film.units, film.beats, the narrator\'s film lines and the events of the whole film run in film mode. Frames are counted from 0 at film.fps.',
    fps,
    frameCount,
    seconds: round(frameCount / fps),
    beatToleranceSeconds: config.film.beatToleranceSeconds,
    beatToleranceFrames: tolerance,
    units,
    beats,
    lines,
    events,
    opening: { frameCount: opening.frameCount, seconds: round(opening.seconds), marks: opening.marks },
    loop: { frameCount: loop.frameCount, seconds: loop.seconds, scene: loop.scene }
  }
  return { list, shots, problems }
}

const seconds = (frame: number): string => (frame / fps).toFixed(3)
const row = (cells: (string | number)[]): string => `| ${cells.join(' | ')} |`
const table = (head: string[], rows: (string | number)[][]): string[] => [row(head), row(head.map(() => '---')), ...rows.map(row)]

export function cuesText(list: CutList): string {
  const out: string[] = []
  out.push('# Cues', '')
  out.push('Made by `npm run cut`. Do not edit by hand.', '')
  out.push(`Film B: ${list.frameCount} frames at ${list.fps} a second, ${list.seconds} s. Times are in seconds from the first frame of the film. A frame is counted from 0.`, '')
  out.push('## Beats', '')
  out.push(...table(['Beat', 'Start s', 'First frame', 'Last frame', 'Event', 'Event s', 'Event frame', 'Inside'], list.beats.map((b) => [`\`${b.id}\``, seconds(b.first), b.first, b.last, b.event ? `\`${b.event.name}\`` : 'none', b.event && b.event.seconds !== null ? b.event.seconds.toFixed(3) : '', b.event && b.event.frame !== null ? b.event.frame : '', b.event ? (b.event.inside ? 'yes' : 'NO') : ''])))
  const cued = list.events.filter((e) => e.cue !== null)
  out.push('', '## Events with a cue', '')
  out.push(`${cued.length} of the film's ${list.events.length} events have a cue in the table of events to cues. A cue starts on the frame of its event.`, '')
  out.push(...table(['Time s', 'Frame', 'Beat', 'Event', 'Cue', 'Hits the cursor'], cued.map((e) => [e.seconds.toFixed(3), e.frame, `\`${e.beat}\``, `\`${e.name}\``, `\`${e.cue}\``, e.hitsCursor ? 'yes' : 'no'])))
  out.push('', '## Narrator lines', '')
  const takes = list.lines.filter((l) => l.length === 'take').length
  out.push(`${list.lines.length} lines, ${takes} with a kept take. The end of a line with no kept take is the soonest it can end at audio.narratorMaxWordsPerSecond, marked "estimate".`, '')
  out.push(...table(['Line', 'Beat', 'Start s', 'Start frame', 'End s', 'Last frame', 'Length', 'Gap to next s', 'Text'], list.lines.map((l) => [`\`${l.id}\``, `\`${l.beat}\``, l.startSeconds.toFixed(3), l.first, l.endSeconds.toFixed(3), l.last, l.length, l.gapToNextSeconds === null ? '' : l.gapToNextSeconds.toFixed(3), l.text])))
  return out.join('\n') + '\n'
}

const box = (f: Framing): string => (f.corners ? `floor corners ${f.corners.map((c) => `(${c[0]}, ${c[1]})`).join(' ')}` : `x ${f.x}, y ${f.y}, ${f.w} by ${f.h}`)

export function shotsText(list: CutList, shots: Shot[]): string {
  const out: string[] = []
  out.push('# Shots', '')
  out.push('Made by `npm run cut` from the film camera of each page (`page.camera(\'film\', time)`), and `home` where a page has none. Do not edit by hand.', '')
  out.push('- Camera: `home` is the page straight on, filling the frame. A name from `cameras` is given when the film camera sits exactly on it, `film` when it is somewhere of its own.')
  out.push('- Move: holds, shakes (it moves a little and comes back), follows (the centre of the framing travels), pushes in (the framing gets narrower), eases out (it gets wider), cuts (the framing jumps between two frames of the same page).')
  out.push('- Framing: the part of the page the frame shows, in page pixels, as x and y of its top left corner and its width by its height, at the height the camera looks at. For a camera that is not straight on: the four corners of the frame on that floor, top left, top right, bottom right, bottom left.')
  out.push('- Lens, for the pinball shots: the vertical field of view, and the focal length that gives the same horizontal view on a 36 mm wide frame. Focus: the distance in page pixels from the camera to what is sharp, the camera\'s own when it states one, and else its distance to the point it looks at.', '')
  for (const u of list.units) {
    out.push(`## ${u.id}`, '', `Frames ${u.first} to ${u.last}.`, '')
    const mine = shots.filter((s) => s.unit === u.id)
    const pin = mine.some((s) => s.pinball)
    const head = ['Beat', 'Frames', 'Camera', 'Move', 'Framing at the start', 'Framing at the end']
    if (pin) head.push('Lens', 'Focus')
    out.push(...table(head, mine.map((s) => {
      const cells: (string | number)[] = [`\`${s.beat}\``, `${s.first} to ${s.last}`, s.cameras.map((c) => `\`${c}\``).join(', then '), s.cuts.length ? `${s.move} (on frame ${s.cuts.join(', ')})` : s.move, box(s.start), box(s.end)]
      if (pin) cells.push(s.lens.map((l) => `${l.fovDeg} degrees, ${l.equivalentMm} mm`).join('; then '), s.focus.map((f) => `${f.distance} px${f.stated ? '' : ', the point it looks at'}${f.aperture === null ? '' : `, aperture ${f.aperture}`}`).join('; then '))
      return cells
    })), '')
  }
  return out.join('\n')
}

// The judged list: the fixed list the critics score, computed as kit/07-QUALITY-BAR.md says.
import fs from 'node:fs'
import { at, config, readJson } from './paths.mjs'

const pageName = { marketing: 'the careers page', step1: 'step 1', step2: 'step 2', pinball: 'step 3', boss: 'step 4', decision: 'step 5' }

// Items 1 to 4: the keys, the sheets, the stills and the six pages through the live site's path.
export function judgedPages(c = config()) {
  const out = []
  for (const k of c.keys) out.push({ id: `key:${k.id}`, unit: k.unit, what: `the key ${k.id}: ${pageName[k.unit]} at ${k.at} of the beat ${k.beat}, from the camera ${k.camera}, in ${c.formats.hd.id}` })
  for (const s of c.sheets) out.push({ id: `sheet:${s.id}`, unit: s.unit, what: `the build's version of the sheet ${s.id}, from the camera ${s.camera ?? 'sheet'}${s.width ? ` at ${s.width} by ${s.height}` : ''}` })
  for (const s of c.stills) {
    const bits = [s.unit === 'site' ? 'the live screen' : pageName[s.unit]]
    if (s.beat) bits.push(`at ${s.at} of the beat ${s.beat}`)
    else bits.push('at rest')
    if (s.scroll !== undefined) bits.push(`scrolled to ${s.scroll}`)
    if (s.interface) bits.push('with the controls on')
    if (s.touchOnly) bits.push('as a touch screen sees it')
    out.push({ id: `still:${s.id}`, unit: s.unit, what: `${bits.join(', ')}, from ${s.camera}` })
  }
  for (const u of c.film.units) out.push({ id: `site:${u.id}`, unit: 'site', what: `${pageName[u.id]} at rest, drawn through the live site's own path at the high level, from home, in ${c.formats.hd.id}` })
  return out
}

// Item 5: the frames of the film, of the opening of film A and of the loop. Needs the frame interface (tools/lib/state.mjs).
export function judgedFilm(showcase, c = config()) {
  const out = []
  const film = showcase.film()
  const fps = c.film.fps
  const tolerance = Math.round(c.film.beatToleranceSeconds * fps)
  out.push({ id: 'film:first', unit: 'film', frame: 0, what: 'film B, frame 0' })
  out.push({ id: 'film:hook', unit: 'film', frame: Math.round(c.film.hookSeconds * fps), what: `film B, the frame at film.hookSeconds (${c.film.hookSeconds} s)` })
  for (const b of c.film.beats) {
    const span = film.beats.find((x) => x.id === b.id)
    let frame = Math.round((span.first + span.last) / 2)
    let how = 'its middle frame'
    if (b.event) {
      how = `its middle frame, because the event ${b.event} was not reported in it`
      for (let i = Math.max(0, span.first - tolerance); i <= Math.min(film.frameCount - 1, span.last + tolerance); i++) {
        if (showcase.filmState(i).events.some((e) => e.name === b.event)) {
          frame = i
          how = `the frame of its event, ${b.event}`
          break
        }
      }
    }
    out.push({ id: `film:${b.id}`, unit: 'film', frame, what: `film B, the beat ${b.id}: ${how}` })
  }
  out.push({ id: 'film:last', unit: 'film', frame: film.frameCount - 1, what: 'film B, the last frame' })
  let opening = null
  try {
    opening = showcase.opening()
  } catch {
    opening = null
  }
  const marks = opening?.marks
  out.push({ id: 'opening:typing', unit: 'film', frame: marks?.typing ?? null, what: 'the opening of film A, a frame in the middle of the typing' })
  out.push({ id: 'opening:level', unit: 'film', frame: marks?.level ?? null, what: 'the opening of film A, a frame with the reasoning level control open' })
  out.push({ id: 'opening:build', unit: 'film', frame: marks?.build ?? null, what: 'the opening of film A, a frame in the middle of the build screen' })
  const loopFrames = c.deliver.cardLoop.seconds * fps
  for (const [name, share] of [['first', 0], ['quarter', 0.25], ['half', 0.5], ['three-quarters', 0.75]]) out.push({ id: `loop:${name}`, unit: 'film', frame: Math.round(loopFrames * share), what: `the card loop, ${share === 0 ? 'frame 0' : `the frame ${name.replace('-', ' ')} of the way through`}` })
  return out
}

const HEAD = '| Id | Unit | What | Frame |\n| --- | --- | --- | --- |'
const row = (e) => `| \`${e.id}\` | \`${e.unit}\` | ${e.what} | ${e.frame === undefined || e.frame === null ? '' : e.frame} |`

// The ids listed in kit/PROGRESS.md under "Judged list".
export function listedIds(text = fs.readFileSync(at('kit', 'PROGRESS.md'), 'utf8')) {
  const start = text.indexOf('\n## Judged list')
  if (start < 0) return []
  const end = text.indexOf('\n## ', start + 5)
  const section = text.slice(start, end < 0 ? undefined : end)
  return [...section.matchAll(/^\| `([^`]+)` \|/gm)].map((m) => m[1])
}

// The section's new text: what is listed stays, what is missing is added. Nothing is ever removed.
export function mergedSection(entries, { replaceFilm = false, note = '' } = {}) {
  const text = fs.readFileSync(at('kit', 'PROGRESS.md'), 'utf8')
  const start = text.indexOf('\n## Judged list')
  const end = text.indexOf('\n## ', start + 5)
  const section = text.slice(start, end < 0 ? undefined : end)
  const old = new Map()
  for (const m of section.matchAll(/^\| `([^`]+)` \| `([^`]+)` \| (.*?) \| (.*?) \|$/gm)) old.set(m[1], { id: m[1], unit: m[2], what: m[3], frame: m[4] === '' ? null : Number(m[4]) })
  const isFilm = (id) => /^(film|opening|loop):/.test(id)
  const all = new Map()
  for (const [id, e] of old) if (!(replaceFilm && isFilm(id))) all.set(id, e)
  for (const e of entries) if (!all.has(e.id) || (isFilm(e.id) && replaceFilm) || (isFilm(e.id) && all.get(e.id).frame === null && e.frame !== null)) all.set(e.id, e)
  for (const [id, e] of old) if (!all.has(id)) all.set(id, e)
  const pages = [...all.values()].filter((e) => !isFilm(e.id))
  const film = [...all.values()].filter((e) => isFilm(e.id))
  const lines = ['Kept by `npm run judged -- --write`. Check G6 compares its ids with the computed list.', '', `${pages.length} stills and sheets:`, '', HEAD, ...pages.map(row)]
  if (film.length) lines.push('', `${film.length} frames of the films and the loop. ${note}`.trim(), '', HEAD, ...film.map(row))
  else lines.push('', 'The film\'s part is added when `cut/CUTLIST.json` first exists.')
  return { text: lines.join('\n'), added: [...all.keys()].filter((id) => !old.has(id)), count: all.size }
}

export const cutListExists = () => fs.existsSync(at('cut', 'CUTLIST.json'))
export const readCutList = () => readJson(at('cut', 'CUTLIST.json'))

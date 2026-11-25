// The packs of a page's look: what R1, R3, R4, R8, R9 and the R2 jury receive for one unit, and how those pictures are drawn.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at, readJson } from './paths.mjs'
import { openSession, readCanvas, stillFrom } from './capture.mjs'
import { around, filmPlan, spread, stepOf, timeLabel } from './film-plan.mjs'
import { cursorBox } from './image.mjs'
import { cut, out, riskyType, strip, windowRound } from './pack-build.mjs'

const GROUND = '#1b1b1d'
const GAP = 8
const LANDS = /(^|-)(drop|land|slam)$/
// A sheet at a hit gives half its frames to the approach, so what falls is seen falling.
const HIT_LEAD = 2
const ACTING_LEAST_SECONDS = 0.25
const ACTING_SHOWN_SECONDS = 1.5
const TURN_BEFORE = 6
const TURN_AFTER = 78
// Seconds from the event page-turn to the knock of the slab on its seat: TURN_HALF * (1 + TURN.seat) of src/stage. A test holds the two together.
export const TURN_SEATS = 0.8
// Where the sheet of the seat looks: the step counter and the slab's top edge, which every page of the form has.
const TURN_WINDOW = [1500, 0]
const CROP = { columns: 3, tileH: 340 }
const TEXT = { columns: 2, tileH: 270 }
const ACT = { columns: 3, tileH: 320 }
const HEAD_ROOM = 90
const LABEL_ROOM = 26

const range = (frames, fps) => `${timeLabel(frames[0], fps)} to ${timeLabel(frames[frames.length - 1], fps)}`
const tileWidth = (edge, columns) => Math.floor((edge - GAP * (columns - 1)) / columns)

// What the film says of a page, frame by frame: the hits, the page turn that ends it and the longest run of each acting state.
export function factsOf(cfg, u, rows) {
  const hits = []
  for (const r of rows) {
    if (r.events.some((e) => e.hitsCursor)) hits.push({ frame: r.frame, name: 'hit on the arrow' })
    else for (const name of [...new Set(r.events.filter((e) => LANDS.test(e.name)).map((e) => e.name))]) hits.push({ frame: r.frame, name })
  }
  const turn = rows.find((r) => r.events.some((e) => e.name === 'page-turn'))
  const runs = new Map()
  let run = null
  for (const r of rows) {
    const state = r.onPage ? r.acting : null
    if (run && run.state === state && r.frame === run.last + 1) run.last = r.frame
    else {
      run = { state, first: r.frame, last: r.frame }
      if (state) runs.set(state, [...(runs.get(state) || []), run])
    }
  }
  const least = Math.round(ACTING_LEAST_SECONDS * cfg.film.fps)
  const states = [...runs.entries()]
    .map(([state, list]) => ({ state, ...[...list].sort((a, b) => b.last - b.first - (a.last - a.first) || a.first - b.first)[0] }))
    .filter((s) => s.last - s.first + 1 >= least)
    .sort((a, b) => a.first - b.first)
  return { unit: u.id, hits, turn: turn ? turn.frame : null, states: states.map((s) => ({ state: s.state, first: s.first, last: s.last })) }
}

export async function lookFacts(cfg, unit, cache = null) {
  const u = filmPlan(cfg).units.find((x) => x.id === unit)
  if (!u) return { unit, hits: [], turn: null, states: [] }
  const file = cache ? path.join(cache, `facts-${unit}.json`) : null
  if (file && fs.existsSync(file)) return readJson(file)
  const session = await openSession({ format: cfg.formats.hd.id, assets: 'full' })
  let facts
  try {
    const rows = []
    for (let from = u.first; from <= u.last; from += 240) {
      rows.push(
        ...(await session.page.evaluate(([first, last]) => {
          const list = []
          for (let i = first; i <= last; i++) {
            const s = window.showcase.filmState(i)
            list.push({ frame: i, acting: s.cursor.acting, onPage: s.cursor.onPage, events: s.events.map((e) => ({ name: e.name, hitsCursor: Boolean(e.hitsCursor) })) })
          }
          return list
        }, [from, Math.min(u.last, from + 239)]))
      )
    }
    facts = factsOf(cfg, u, rows)
  } finally {
    await session.close()
  }
  if (file) {
    fs.mkdirSync(cache, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(facts, null, 2) + '\n')
  }
  return facts
}

const keysOf = (cfg, unit) => cfg.keys.filter((k) => k.unit === unit)
const sheetsOf = (cfg, unit) => cfg.sheets.filter((s) => s.unit === unit)
const restsOf = (cfg, unit) => cfg.stills.filter((s) => s.unit === unit && !s.interface)

// A key seen through any camera but home shows part of its page, and its heading says so.
const momentWords = (k) => (k.camera === 'home' ? 'The page at one moment' : 'Part of the page at one moment, seen close')

// The judged stills of a unit, in the list's order: keys, sheets, stills.
export function judgedOf(cfg, unit) {
  return [
    ...keysOf(cfg, unit).map((k) => ({ from: { key: k.id }, words: momentWords(k) })),
    ...sheetsOf(cfg, unit).map((s) => ({ from: { sheet: s.id }, words: `A sheet of parts: ${s.shows}` })),
    ...restsOf(cfg, unit).map((s) => ({ from: { id: s.id }, words: s.scroll ? 'The page at rest, scrolled' : 'The page at rest' }))
  ]
}

function matchGroups(cfg, unit) {
  const settled = (own) => [...cfg.settledAll, ...((cfg.settledUnit || {})[unit] || []), ...(own || [])]
  const groups = []
  for (const k of keysOf(cfg, unit)) {
    groups.push({
      id: `key:${k.id}`,
      items: [
        { kind: 'pair', side: 'a', from: { key: k.id }, image: k.image, heading: '', settled: settled(k.settled) },
        { kind: 'pair', side: 'b', from: { key: k.id }, heading: '' },
        { kind: 'pair-crops', side: 'a', from: { key: k.id }, image: k.image, heading: 'Parts of the picture before this one, each at its real size', settled: settled(k.settled) },
        { kind: 'pair-crops', side: 'b', from: { key: k.id }, heading: 'Parts of the picture before this one, each at its real size' }
      ]
    })
  }
  for (const s of sheetsOf(cfg, unit)) {
    groups.push({
      id: `sheet:${s.id}`,
      items: [
        { kind: 'pair', side: 'a', from: { sheet: s.id }, image: s.image, heading: '', settled: settled(s.settled) },
        { kind: 'pair', side: 'b', from: { sheet: s.id }, heading: '' }
      ]
    })
  }
  return groups
}

function surfaceGroups(cfg, unit) {
  const judged = judgedOf(cfg, unit)
  const stills = judged.map((j, i) => ({ kind: 'judged', from: j.from, heading: `Picture ${i + 1} of ${judged.length}. ${j.words}` }))
  const crops = judged.filter((j) => !j.from.sheet).map((j) => ({ kind: 'surface-crops', from: j.from, heading: `Surfaces and objects at their real size, cut from a picture of this set: ${j.words.toLowerCase()}` }))
  return [{ id: 'stills', items: stills }, { id: 'crops', items: crops }]
}

function motionGroups(cfg, unit, facts) {
  const plan = filmPlan(cfg)
  const fps = cfg.film.fps
  const count = cfg.critics.contactSheetFrames
  const step = stepOf(fps, cfg.film.previewFps)
  const u = plan.units.find((x) => x.id === unit)
  const beats = plan.beats.filter((b) => b.unit === unit)
  const across = beats.map((b, i) => {
    const frames = spread(b.first, b.last, count, step)
    return { kind: 'look-sheet', unit, beat: b.id, frames, heading: `Beat ${i + 1} of ${beats.length} of the page, frames spread across it: ${range(frames, fps)}` }
  })
  const hits = facts.hits.map((h, i) => {
    const frames = around(h.frame, count, step, u.first, u.last, HIT_LEAD)
    return { kind: 'hit-sheet', unit, hit: h.name, at: h.frame, frames, heading: `Consecutive frames at a hit, ${i + 1} of ${facts.hits.length}, the part of the picture round the hit at its real size: ${range(frames, fps)}` }
  })
  const start = facts.turn === null ? u.last - Math.round(fps / 2) : facts.turn
  const frames = spread(Math.max(0, start - TURN_BEFORE), Math.min(plan.frameCount - 1, start + TURN_AFTER), count, step)
  const turn = [{ kind: 'look-sheet', unit, turn: start, frames, heading: `The page turn that ends the page: ${range(frames, fps)}` }]
  if (facts.turn !== null) {
    const seat = Math.min(plan.frameCount - 1, start + Math.round(TURN_SEATS * fps))
    const landing = around(seat, count, step, start, plan.frameCount - 1)
    turn.push({ kind: 'hit-sheet', unit, hit: 'slab seats', at: seat, window: TURN_WINDOW, frames: landing, heading: `Consecutive frames as the turned slab seats at ${timeLabel(seat, fps)}, the top right of the picture at its real size: ${range(landing, fps)}` })
  }
  return [{ id: 'beats', items: across }, { id: 'hits', items: hits }, { id: 'turn', items: turn }]
}

function pageGroups(cfg, unit) {
  const rests = restsOf(cfg, unit).map((s) => ({ kind: 'judged', from: { id: s.id }, heading: s.scroll ? 'The page at rest, scrolled' : 'The page at rest' }))
  const keys = keysOf(cfg, unit).map((k, i) => ({ kind: 'judged', from: { key: k.id }, heading: `${momentWords(k)}, ${i + 1} of ${keysOf(cfg, unit).length}` }))
  const crops = restsOf(cfg, unit).filter((s) => !s.scroll).map((s) => ({ kind: 'text-crops', from: { id: s.id }, heading: 'Text and controls of the page at rest, at their real size' }))
  return [{ id: 'page', items: [...rests, ...keys, ...crops] }]
}

function actingGroups(cfg, unit, facts) {
  const plan = filmPlan(cfg)
  const fps = cfg.film.fps
  const count = cfg.critics.contactSheetFrames
  const step = stepOf(fps, cfg.film.previewFps)
  const u = plan.units.find((x) => x.id === unit)
  const beats = plan.beats.filter((b) => b.unit === unit).map((b) => ({ kind: 'plain-sheet', unit, beat: b.id, frames: spread(b.first, b.last, count, step), heading: '' }))
  const states = facts.states.map((s) => ({ kind: 'acting-sheet', unit, state: s.state, frames: spread(Math.max(u.first, s.first - 2 * step), Math.min(s.last, s.first + Math.round(ACTING_SHOWN_SECONDS * fps)), count, step), heading: '' }))
  return [{ id: 'beats', items: beats }, { id: 'states', items: states }]
}

// The jury's images: up to quality.jury.stillsPerUnit judged stills, keys first, then the rest in list order, and the unit's approved key images as controls.
// A sheet of parts has no control of a like kind unless it is a picture of the whole page.
export function juryList(cfg, unit) {
  const whole = (j) => !j.from.sheet || /page/.test(j.from.sheet)
  const first = judgedOf(cfg, unit).slice(0, cfg.quality.jury.stillsPerUnit)
  return { judged: first.filter(whole), leftOut: first.filter((j) => !whole(j)), controls: keysOf(cfg, unit).map((k) => ({ image: k.image, key: k.id })) }
}

function juryGroups(cfg, unit) {
  const list = juryList(cfg, unit)
  return [
    { id: 'judged', items: list.judged.map((j) => ({ kind: 'jury', from: j.from, judged: true, heading: '' })) },
    { id: 'controls', items: list.controls.map((c) => ({ kind: 'jury', image: c.image, control: c.key, judged: false, heading: '' })) }
  ]
}

export const lookRoles = {
  R1: { critic: 'R1', section: 'R1 · Match', groups: matchGroups },
  R2: { critic: 'R2', section: 'R2 · Jury', groups: juryGroups },
  R3: { critic: 'R3', section: 'R3 · Surface and detail', groups: surfaceGroups },
  R4: { critic: 'R4', section: 'R4 · Motion', groups: motionGroups, facts: true },
  R8: { critic: 'R8', section: 'R8 · The page', groups: pageGroups },
  R9: { critic: 'R9', section: 'R9 · Acting', groups: actingGroups, facts: true }
}

// A hit sheet carries a heading and a time under every tile: its tiles are as tall as the long edge leaves room for.
export function hitTileHeight(edge, count) {
  const rows = Math.ceil(count / ACT.columns)
  const room = Math.floor((edge - HEAD_ROOM - rows * LABEL_ROOM - GAP * rows) / rows)
  return Math.min(ACT.tileH, room - (room % 2))
}

export const LOOK_KINDS = ['pair', 'pair-crops', 'judged', 'surface-crops', 'text-crops', 'look-sheet', 'hit-sheet', 'plain-sheet', 'acting-sheet', 'jury']

// Tiles in a grid. A heading and labels are drawn only when given, and a tile keeps its own pixels.
async function sheetOf(tiles, { edge, columns, tileW, tileH, heading = '', labels = true, exact = true }) {
  const rows = Math.ceil(tiles.length / columns)
  const width = columns * tileW + GAP * (columns - 1)
  const head = heading ? await strip(heading, width) : null
  const names = []
  if (labels) for (const t of tiles) names.push(await strip(t.label, tileW, 13))
  const labelH = labels ? Math.max(...names.map((l) => l.height)) : 0
  const top = head ? head.height + GAP : 0
  const height = top + rows * (tileH + labelH) + GAP * (rows - 1)
  if (width > edge || height > edge) throw new Error(`pack: a sheet of ${tiles.length} pictures of ${tileW} by ${tileH} is ${width} by ${height}, over ${edge} px`)
  const parts = head ? [{ input: head.png, left: 0, top: 0 }] : []
  for (let i = 0; i < tiles.length; i++) {
    const x = (i % columns) * (tileW + GAP)
    const y = top + Math.floor(i / columns) * (tileH + labelH + GAP)
    const m = await sharp(tiles[i].png).metadata()
    if (exact && (m.width !== tileW || m.height !== tileH)) throw new Error(`pack: a crop of ${m.width} by ${m.height} would be resized to ${tileW} by ${tileH}`)
    const pic = exact ? await sharp(tiles[i].png).removeAlpha().png().toBuffer() : await sharp(tiles[i].png).removeAlpha().resize(tileW, tileH, { fit: 'contain', background: GROUND }).png().toBuffer()
    parts.push({ input: pic, left: x, top: y })
    if (labels) parts.push({ input: names[i].png, left: x, top: y + tileH })
  }
  return out(parts, width, height)
}

// A picture alone, made smaller only to fit, under its heading when it has one.
async function alone(png, heading, edge, size = null) {
  const m = await sharp(png).metadata()
  let scale = size ? size[0] / m.width : Math.min(1, edge / m.width, edge / m.height)
  let w = size ? size[0] : Math.round(m.width * scale)
  let h = size ? size[1] : Math.round(m.height * scale)
  let head = heading ? await strip(heading, w) : null
  while (head && h + head.height + GAP > edge) {
    scale -= 0.005
    w = Math.round(m.width * scale)
    h = Math.round(m.height * scale)
    head = await strip(heading, w)
  }
  const pic = await sharp(png).removeAlpha().resize(w, h, { fit: size ? 'contain' : 'fill', background: GROUND }).png().toBuffer()
  if (!head) return { png: pic, scale, width: w, height: h }
  return { png: await out([{ input: head.png, left: 0, top: 0 }, { input: pic, left: 0, top: head.height + GAP }], w, h + head.height + GAP), scale, width: w, height: h }
}

const centre = (b) => [b[0] + b[2] / 2, b[1] + b[3] / 2]
const point = (x, y) => [x - 1, y - 1, 2, 2]
const join = (a, b) => {
  const x = Math.min(a[0], b[0])
  const y = Math.min(a[1], b[1])
  return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y]
}
const seen = (b, width, height) => b && b[0] < width - 8 && b[0] + b[2] > 8 && b[1] < height - 8 && b[1] + b[3] > 8

// Where a named thing lies in a still of the build, in the picture's own pixels. Null when the still does not show it.
export function finder(state, width, height) {
  const kind = (k, n = 0) => state.layout.filter((p) => p.kind === k)[n]
  const box = (k, n = 0) => (kind(k, n) ? kind(k, n).screen : null)
  const corner = (b, which) => (b ? point(b[0] + (which.includes('right') ? b[2] : 0), b[1] + (which.includes('bottom') ? b[3] : 0)) : null)
  const run = (test) => {
    const t = state.type.find(test)
    return t ? t.screen : null
  }
  const small = () => {
    const list = [...state.type].filter((t) => seen(t.screen, width, height)).sort((a, b) => a.px - b.px || a.screen[1] - b.screen[1] || a.screen[0] - b.screen[0])
    return list.length ? list[0].screen : null
  }
  const things = {
    cursor: () => cursorBox(state.cursor),
    type: small,
    progressButton: () => (box('progressButtonCurrent') && box('progressButton') ? join(box('progressButtonCurrent'), box('progressButton')) : box('progressButtonCurrent') || box('progressButton')),
    'card.corner': () => corner(box('card'), 'top-left'),
    'card.glass': () => corner(box('card'), 'bottom-right'),
    'card.contact': () => corner(box('card'), 'bottom-left'),
    'keyboardDeck.corner': () => corner(box('keyboardDeck'), 'top-left'),
    'keyboardDeck.front': () => (box('keyboardDeck') ? point(box('keyboardDeck')[0] + box('keyboardDeck')[2] / 2, box('keyboardDeck')[1] + box('keyboardDeck')[3] - 40) : null),
    'hatch.other': () => box('hatch', 1),
    enter: () => run((t) => /keys\.enter$/.test(t.key)),
    'paper.below': () => (box('paper') ? point(box('paper')[0] + box('paper')[2] / 2, box('paper')[1] + box('paper')[3] + 70) : null),
    surface: () => (box('rule') && box('field') ? point(box('field')[0] + box('field')[2] * 0.72, (box('rule')[1] + box('field')[1]) / 2) : null),
    'surface.low': () => (box('card') ? point(box('card')[0] + 200, Math.min(height - 150, box('card')[1] + box('card')[3] + 180)) : null),
    header: () => (box('rule') ? [box('rule')[0], box('rule')[1] - 110, 600, 120] : null),
    heading: () => (box('rule') && box('card') ? [box('rule')[0], box('rule')[1] + 20, 600, Math.max(60, box('card')[1] - box('rule')[1] - 20)] : null),
    'field.start': () => (box('field') ? [box('field')[0], box('field')[1] - 20, 400, box('field')[3] + 40] : null),
    keys: () => (box('keyboardDeck') ? point(box('keyboardDeck')[0] + box('keyboardDeck')[2] * 0.4, box('keyboardDeck')[1] + box('keyboardDeck')[3] * 0.35) : null),
    'field.whole': () => (box('field') ? [box('field')[0], box('field')[1] - 44, box('field')[2], box('field')[3] + 88] : null),
    progress: () => {
      const all = state.layout.filter((p) => /^progressButton/.test(p.kind)).map((p) => p.screen)
      return all.length ? all.reduce(join) : null
    }
  }
  return (name) => {
    const b = things[name] ? things[name]() : box(name)
    return seen(b, width, height) ? b : null
  }
}

const SURFACES = {
  rest: [
    ['surface', 'the page surface'],
    ['card.glass', 'glass at its edge, with what lies under it'],
    ['progressButton', 'metal rims'],
    ['button', 'the coloured button and its socket'],
    ['type', 'the smallest text', true],
    ['cursor', 'the arrow, its edge and its shadow'],
    ['card.contact', 'a shadow where a part meets the page'],
    ['field', 'a field', true],
    ['header', 'the title and the rule', true]
  ],
  moment: [
    ['cursor', 'the arrow'],
    ['keycap', 'keys'],
    ['keyboardDeck.corner', "the deck's edge and its shadow"],
    ['hatch', 'a turret'],
    ['hatch.other', 'the other turret'],
    ['enter', 'the coloured key'],
    ['keyboardDeck.front', "the deck's front edge"],
    ['paper', 'the paper'],
    ['paper.below', 'the machine under the paper'],
    ['chip', 'the button on the glass'],
    ['card.glass', 'glass at its edge'],
    ['field', 'a field', true],
    ['surface.low', 'the page surface']
  ]
}

const TEXTS = [
  ['header', 'the title', true],
  ['progress', 'the progress bar', true],
  ['heading', 'the heading and the line under it', true],
  ['type', 'the smallest text', true],
  ['chip', 'the drop zone'],
  ['field.whole', 'a field with its label and helper', true],
  ['button', 'the button'],
  ['card.corner', 'a corner of the drop zone']
]

// Draws the pictures of a look pack into `built`, with what the key file says of each in `about`.
export async function buildLook({ cfg, session, files, built, about, tier, log, cache }) {
  const edge = cfg.critics.maxImageLongEdgePx
  const hd = cfg.formats.hd
  const preview = cfg.formats.preview
  const fps = cfg.film.fps
  const filmTier = tier === 'draft' ? 'draft' : 'review'
  if (cache) fs.mkdirSync(cache, { recursive: true })
  let format = hd.id
  const use = async (f) => {
    if (format === f.id) return
    await session.page.evaluate((id) => window.showcase.setFormat(id), f.id)
    format = f.id
  }
  const stills = new Map()
  const stillOf = async (from) => {
    const { spec, name } = stillFrom({ ...from, tier })
    if (stills.has(name)) return stills.get(name)
    const file = cache ? path.join(cache, `${name}-${hd.id}-${tier}.png`) : null
    let png = file && fs.existsSync(file) ? fs.readFileSync(file) : null
    await use(hd)
    if (!png) {
      await session.page.evaluate(async (s) => {
        window.showcase.setDiagnostic('beauty')
        await window.showcase.renderStill(s)
      }, spec)
      png = await readCanvas(session.page)
      if (file) fs.writeFileSync(file, png)
      log(`still ${name}, ${tier} tier`)
    }
    const state = await session.page.evaluate((s) => window.showcase.stillState(s), spec)
    const m = await sharp(png).metadata()
    const got = { png, spec, state, name, width: m.width, height: m.height }
    stills.set(name, got)
    return got
  }
  let drawn = 0
  const frameOf = async (frame, f, t) => {
    const file = cache ? path.join(cache, `film-${String(frame).padStart(6, '0')}-${f.id}-${t}.png`) : null
    if (file && fs.existsSync(file)) return fs.readFileSync(file)
    await use(f)
    await session.page.evaluate(async ([i, tt]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(i, tt)
    }, [frame, t])
    const png = await readCanvas(session.page)
    if (file) fs.writeFileSync(file, png)
    drawn += 1
    if (drawn % 12 === 0) log(`film frames drawn: ${drawn}`)
    return png
  }
  const sizeOfPair = (w, h) => {
    const k = Math.min(1, edge / w, edge / h)
    return [Math.round(w * k), Math.round(h * k)]
  }
  const boxes = readJson(at('tools', 'assets', 'approved-boxes.json'))
  const cropW = tileWidth(edge, CROP.columns)

  for (const f of files.filter((x) => x.kind === 'pair')) {
    const s = await stillOf(f.from)
    const size = sizeOfPair(s.width, s.height)
    const png = f.side === 'a' ? fs.readFileSync(at(f.image)) : s.png
    built.set(f.name, (await alone(png, '', edge, size)).png)
    about.set(f.name, f.side === 'a' ? { pair: f.from, side: 'a', image: f.image, size } : { pair: f.from, side: 'b', still: s.spec, format: hd.id, tier, size })
    log(`${f.name}: ${f.side === 'a' ? f.image : `the still ${s.name}`}`)
  }

  for (const f of files.filter((x) => x.kind === 'pair-crops')) {
    const s = await stillOf(f.from)
    const id = f.from.key || f.from.sheet
    const want = boxes[id] || {}
    const find = finder(s.state, s.width, s.height)
    const image = f.side === 'a' ? fs.readFileSync(at(f.image)) : s.png
    const m = await sharp(image).metadata()
    const tiles = []
    const crops = []
    for (const [name, entry] of Object.entries(want)) {
      const b = find(name)
      if (!b) continue
      const fr = entry.box || entry
      const box = f.side === 'a' ? [fr[0] * m.width, fr[1] * m.height, fr[2] * m.width, fr[3] * m.height] : b
      const win = windowRound(box, cropW, CROP.tileH, m.width, m.height)
      tiles.push({ png: await cut(image, win), label: entry.label || name })
      crops.push({ part: name, window: win })
    }
    if (!tiles.length) throw new Error(`pack: tools/assets/approved-boxes.json names no part of ${id} that the still shows`)
    built.set(f.name, await sheetOf(tiles, { edge, columns: CROP.columns, tileW: cropW, tileH: CROP.tileH, heading: f.heading }))
    about.set(f.name, { pair: f.from, side: f.side, crops, ...(f.side === 'a' ? { image: f.image } : { still: s.spec, format: hd.id, tier }) })
    log(`${f.name}: ${tiles.length} crops of ${f.side === 'a' ? f.image : `the still ${s.name}`}`)
  }

  for (const f of files.filter((x) => x.kind === 'judged')) {
    const s = await stillOf(f.from)
    const shown = Math.round(Math.min(1, edge / s.width) * 100)
    const got = await alone(s.png, `${f.heading}, shown at ${shown}% of its size`, edge)
    built.set(f.name, got.png)
    about.set(f.name, { still: s.spec, from: f.from, format: hd.id, tier, scale: Number(got.scale.toFixed(4)) })
    log(`${f.name}: the still ${s.name}`)
  }

  for (const f of files.filter((x) => x.kind === 'surface-crops' || x.kind === 'text-crops')) {
    const s = await stillOf(f.from)
    const text = f.kind === 'text-crops'
    const shape = text ? TEXT : CROP
    const tileW = tileWidth(edge, shape.columns)
    const find = finder(s.state, s.width, s.height)
    const picks = text ? TEXTS : f.from.id ? SURFACES.rest : SURFACES.moment
    const tiles = []
    const crops = []
    const most = text ? 8 : 9
    for (const [name, label, fromLeft] of picks) {
      if (tiles.length === most) break
      const b = find(name)
      if (!b) continue
      const win = windowRound(b, tileW, shape.tileH, s.width, s.height, Boolean(fromLeft))
      tiles.push({ png: await cut(s.png, win), label })
      crops.push({ part: name, window: win })
    }
    if (text) {
      const risky = riskyType(s.state.type.map((t) => ({ ...t, box: t.screen })), tileW, shape.tileH, s.width, s.height)
      if (risky[1] && tiles.length < most) {
        tiles.push({ png: await cut(s.png, risky[1].window), label: 'the text with the least contrast' })
        crops.push({ part: risky[1].run.key, window: risky[1].window })
      }
    }
    built.set(f.name, await sheetOf(tiles, { edge, columns: shape.columns, tileW, tileH: shape.tileH, heading: f.heading }))
    about.set(f.name, { still: s.spec, from: f.from, crops, format: hd.id, tier })
    log(`${f.name}: ${tiles.length} crops of the still ${s.name}`)
  }

  for (const f of files.filter((x) => x.kind === 'jury')) {
    const png = f.image ? fs.readFileSync(at(f.image)) : (await stillOf(f.from)).png
    const m = await sharp(png).metadata()
    const size = sizeOfPair(m.width, m.height)
    built.set(f.name, (await alone(png, '', edge, size)).png)
    about.set(f.name, f.image ? { control: f.control, image: f.image, size } : { judged: f.from, still: (await stillOf(f.from)).spec, format: hd.id, tier, size })
    log(`${f.name}: ${f.image ? `the control ${f.image}` : 'a judged still'}`)
  }

  const actW = tileWidth(edge, ACT.columns)
  for (const f of files.filter((x) => x.kind === 'acting-sheet')) {
    const places = await session.page.evaluate((frames) => frames.map((i) => window.showcase.filmState(i).cursor), f.frames)
    const tall = Math.max(...places.map((c) => c.screenHeightPx))
    const xs = places.map((c) => c.x)
    const ys = places.map((c) => c.y)
    const still = Math.max(...xs) - Math.min(...xs) <= actW - tall * 2.4 && Math.max(...ys) - Math.min(...ys) <= ACT.tileH - tall * 2.4
    const mid = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2]
    const tiles = []
    const windows = []
    for (let i = 0; i < f.frames.length; i++) {
      const png = await frameOf(f.frames[i], hd, 'draft')
      const c = still ? mid : [places[i].x, places[i].y]
      const win = windowRound(point(c[0], c[1]), actW, ACT.tileH, hd.width, hd.height)
      tiles.push({ png: await cut(png, win), label: '' })
      windows.push(win)
    }
    built.set(f.name, await sheetOf(tiles, { edge, columns: ACT.columns, tileW: actW, tileH: ACT.tileH, labels: false }))
    about.set(f.name, { unit: f.unit, state: f.state, frames: f.frames, windows, windowFollowsTheArrow: !still, format: hd.id, tier: 'draft' })
    log(`${f.name}: the acting state ${f.state}`)
  }

  // A hit is a small thing in a whole frame: its sheet is the part of the picture round it, uncut and unscaled, in one fixed window.
  for (const f of files.filter((x) => x.kind === 'hit-sheet')) {
    await use(hd)
    const s = await session.page.evaluate((i) => window.showcase.filmState(i), f.at)
    const e = s.events.find((x) => (f.hit === 'hit on the arrow' ? x.hitsCursor : x.name === f.hit))
    const c = f.window ?? (e ? [e.x, e.y] : [s.cursor.x, s.cursor.y])
    const hitH = hitTileHeight(edge, f.frames.length)
    const win = windowRound(point(c[0], c[1]), actW, hitH, hd.width, hd.height)
    const tiles = []
    for (const frame of f.frames) tiles.push({ png: await cut(await frameOf(frame, hd, filmTier), win), label: timeLabel(frame, fps) })
    built.set(f.name, await sheetOf(tiles, { edge, columns: ACT.columns, tileW: actW, tileH: hitH, heading: f.heading }))
    about.set(f.name, { unit: f.unit, hit: f.hit, at: f.at, frames: f.frames, window: win, format: hd.id, tier: filmTier })
    log(`${f.name}: the ${f.hit} at frame ${f.at}`)
  }

  for (const f of files.filter((x) => x.kind === 'look-sheet' || x.kind === 'plain-sheet')) {
    const plain = f.kind === 'plain-sheet'
    const tileW = tileWidth(edge, 3)
    const tiles = []
    for (const frame of f.frames) tiles.push({ png: await frameOf(frame, preview, filmTier), label: timeLabel(frame, fps) })
    built.set(f.name, await sheetOf(tiles, { edge, columns: 3, tileW, tileH: Math.round((tileW * preview.height) / preview.width), heading: plain ? '' : f.heading, labels: !plain, exact: false }))
    about.set(f.name, { unit: f.unit, beat: f.beat || null, hit: f.hit || null, turn: f.turn ?? null, frames: f.frames, format: preview.id, tier: filmTier })
    log(`${f.name}: ${f.beat ? `the beat ${f.beat}` : f.hit ? `the ${f.hit} at frame ${f.at}` : 'the page turn'}`)
  }
}

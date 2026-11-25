// What a film is made of, with no browser: its frames, the pieces a page is rendered in, the names of the files, the grid of a contact sheet.

export const pad = (n) => String(n).padStart(6, '0')

export const formatOfConfig = (cfg, id) => {
  for (const [key, f] of Object.entries(cfg.formats)) if (f.id === id || key === id) return f
  throw new Error(`No format called "${id}"`)
}

export const tierOfConfig = (cfg, id) => {
  if (!cfg.tiers[id]) throw new Error(`No tier called "${id}"`)
  return id
}

// The film as window.showcase.film() gives it, from the config alone.
export function filmPlan(cfg) {
  const fps = cfg.film.fps
  const frameOf = (seconds) => Math.round(seconds * fps)
  const starts = {}
  let at = 0
  for (const u of cfg.film.units) {
    starts[u.id] = at
    at += u.seconds
  }
  const units = cfg.film.units.map((u) => ({ id: u.id, first: frameOf(starts[u.id]), last: frameOf(starts[u.id] + u.seconds) - 1 }))
  const beats = cfg.film.beats.map((b) => ({ id: b.id, unit: b.unit, event: b.event, first: frameOf(starts[b.unit] + b.from), last: frameOf(starts[b.unit] + b.to) - 1 }))
  return { fps, frameCount: frameOf(at), units, beats }
}

// How many frame indices lie between two rendered frames at a rate.
export function stepOf(fps, rate) {
  const step = fps / rate
  if (!Number.isInteger(step) || step < 1) throw new Error(`${rate} frames a second does not divide ${fps}`)
  return step
}

// Every frame of a range that is rendered at a step: the indices that are multiples of it.
export function framesIn(first, last, step) {
  const out = []
  for (let i = Math.ceil(first / step) * step; i <= last; i += step) out.push(i)
  return out
}

// A range drawn in to the frames that are rendered. Null when it holds none.
export function clip(first, last, step) {
  const a = Math.ceil(first / step) * step
  const b = Math.floor(last / step) * step
  return a <= b ? { first: a, last: b } : null
}

// A page's frames split into pieces of even length, none longer than `maxFrames` rendered frames.
// The split depends only on the page, the step and the limit, so every machine cuts a page at the same places.
export function gridOf(unit, step, maxFrames) {
  const frames = framesIn(unit.first, unit.last, step)
  if (!frames.length) return []
  const count = Math.ceil(frames.length / maxFrames)
  const size = Math.ceil(frames.length / count)
  const out = []
  for (let i = 0; i < frames.length; i += size) out.push({ unit: unit.id, first: frames[i], last: frames[Math.min(frames.length, i + size) - 1] })
  return out
}

// The pieces of a page that a range touches, each cut down to the range.
export function piecesOf(unit, step, maxFrames, range) {
  const grid = gridOf(unit, step, maxFrames)
  if (!range) return grid
  const out = []
  for (const p of grid) {
    const c = clip(Math.max(p.first, range.first), Math.min(p.last, range.last), step)
    if (c) out.push({ unit: unit.id, first: c.first, last: c.last })
  }
  return out
}

export const frameCountOf = (piece, step) => (piece.last - piece.first) / step + 1

// Chooses from the pieces that exist a run that covers a range exactly, with no frame twice. `missing` lists what no piece covers.
export function tile(have, first, last, step) {
  const range = clip(first, last, step)
  const pieces = []
  const missing = []
  if (!range) return { pieces, missing, whole: false }
  const usable = have.filter((p) => p.first % step === 0 && p.last % step === 0 && p.first >= range.first && p.last <= range.last && p.last >= p.first)
  let at = range.first
  while (at <= range.last) {
    const here = usable.filter((p) => p.first === at).sort((a, b) => b.last - a.last)[0]
    if (here) {
      pieces.push(here)
      at = here.last + step
      continue
    }
    const next = usable.filter((p) => p.first > at).sort((a, b) => a.first - b.first)[0]
    const until = next ? next.first - step : range.last
    missing.push({ first: at, last: until })
    at = until + step
  }
  return { pieces, missing, whole: missing.length === 0 }
}

const tail = (format, tier, diag) => `${format}-${tier}${diag && diag !== 'beauty' ? `-${diag}` : ''}`

export const pieceName = (unit, first, last, format, tier, diag) => `${unit}-${pad(first)}-${pad(last)}-${tail(format, tier, diag)}`
export const chunkName = (unit, format, tier, diag) => `${unit}-${tail(format, tier, diag)}`
export const filmName = (which, format, tier, diag, range) => `film-${which}-${tail(format, tier, diag)}${range ? `-${pad(range.first)}-${pad(range.last)}` : ''}`
export const seqName = (frame, format, tier, diag) => `frame-${pad(frame)}-${tail(format, tier, diag)}`
export const loopPieceName = (first, last, format, tier) => `loop-${pad(first)}-${pad(last)}-${tail(format, tier)}`

// Reads the range out of a piece's file name. Null for a name that is not a piece of this unit, format and tier.
export function parsePiece(name, unit, format, tier, diag, ext = 'mp4') {
  const end = `-${tail(format, tier, diag)}.${ext}`
  const start = `${unit}-`
  if (!name.startsWith(start) || !name.endsWith(end)) return null
  const m = /^(\d{6})-(\d{6})$/.exec(name.slice(start.length, name.length - end.length))
  return m ? { unit, first: Number(m[1]), last: Number(m[2]), file: name } : null
}

// The encoder's settings for one piece: the film's final settings, a closed group of pictures every second, nothing that depends on a neighbour.
export function encodeArgs({ rate, mbps, codec = 'h264' }) {
  const colour = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv']
  if (codec === 'prores_422_hq') return ['-vf', 'scale=in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv422p10le', '-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', ...colour, '-video_track_timescale', '90000', '-an']
  if (codec !== 'h264') throw new Error(`No encoder set up for "${codec}"`)
  const g = Math.max(1, Math.round(rate))
  return [
    '-vf', 'scale=in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high',
    '-b:v', `${mbps}M`, '-maxrate', `${mbps * 1.5}M`, '-bufsize', `${mbps * 2}M`,
    '-g', String(g), '-keyint_min', String(g), '-sc_threshold', '0', '-bf', '2', '-flags', '+cgop',
    ...colour, '-video_track_timescale', '90000', '-an'
  ]
}

export const bitrateOf = (cfg, formatId) => (formatId === cfg.formats.preview.id ? cfg.previewFilm.bitrateMbps : cfg.export.bitrateMbps)

// Two records are of one build when everything but the machine is the same: a chunk rendered in another VM joins here.
export function sameBuild(old, record, ignore = ['machine']) {
  if (!old) return false
  for (const k of Object.keys(record)) {
    if (ignore.includes(k)) continue
    if (JSON.stringify(old[k]) !== JSON.stringify(record[k])) return false
  }
  return true
}

// The pages whose hashes a page of the film stands on: the last page ends on the careers page.
export const unitsShown = (cfg, unit) => {
  const last = cfg.film.units[cfg.film.units.length - 1].id
  return unit === last ? [unit, cfg.film.units[0].id] : [unit]
}

// `count` frames spread evenly across a range, the first and the last included, each one a rendered frame.
export function spread(first, last, count, step = 1) {
  const range = clip(first, last, step)
  if (!range) return []
  const n = (range.last - range.first) / step + 1
  if (n <= count) return framesIn(range.first, range.last, step)
  const out = []
  for (let i = 0; i < count; i++) out.push(range.first + Math.round((i * (n - 1)) / (count - 1)) * step)
  return [...new Set(out)]
}

// `count` frames in a row round one frame, kept inside a range.
export function around(frame, count, step, first, last) {
  const range = clip(first, last, step)
  const centre = Math.round(frame / step) * step
  const n = (range.last - range.first) / step + 1
  const size = Math.min(count, n)
  const before = Math.floor((size - 1) / 3)
  let start = centre - before * step
  start = Math.max(range.first, Math.min(start, range.last - (size - 1) * step))
  return Array.from({ length: size }, (_, i) => start + i * step)
}

// A frame's time in the film as m:ss.ff, where ff is hundredths of a second.
export function timeLabel(frame, fps) {
  const total = Math.round((frame / fps) * 100)
  const m = Math.floor(total / 6000)
  const s = Math.floor((total % 6000) / 100)
  const h = total % 100
  return `${m}:${String(s).padStart(2, '0')}.${String(h).padStart(2, '0')}`
}

// The grid of a contact sheet: tiles of one size with a label strip under each, the whole no longer than `edge` on its long edge.
export function sheetGrid(count, pictureWidth, pictureHeight, { edge, gap = 8, labelHeight = 24, columns = 0, head = 0 }) {
  if (count < 1) throw new Error('A sheet needs at least one picture')
  const shape = pictureWidth / pictureHeight
  let best = null
  const tries = columns ? [columns] : Array.from({ length: count }, (_, i) => i + 1)
  for (const cols of tries) {
    const rows = Math.ceil(count / cols)
    let tileW = Math.floor((edge - gap * (cols - 1)) / cols)
    let tileH = Math.round(tileW / shape)
    const high = () => head + rows * (tileH + labelHeight) + gap * (rows - 1) + (head ? gap : 0)
    if (high() > edge) {
      tileH = Math.floor((edge - head - (head ? gap : 0) - gap * (rows - 1)) / rows) - labelHeight
      tileW = Math.round(tileH * shape)
    }
    if (tileW < 8 || tileH < 8) continue
    tileW = Math.min(tileW, pictureWidth)
    tileH = Math.min(tileH, pictureHeight, Math.round(tileW / shape))
    const g = { columns: cols, rows, tileWidth: tileW, tileHeight: tileH, labelHeight, gap, width: cols * tileW + gap * (cols - 1), height: head + (head ? gap : 0) + rows * (tileH + labelHeight) + gap * (rows - 1) }
    if (!best || g.tileWidth > best.tileWidth || (g.tileWidth === best.tileWidth && g.rows * g.columns < best.rows * best.columns)) best = g
  }
  if (!best) throw new Error(`${count} pictures do not fit on a sheet of ${edge} px`)
  return best
}

// Splits a list of pictures over sheets of at most `perSheet`.
export function sheetsOf(list, perSheet) {
  const out = []
  for (let i = 0; i < list.length; i += perSheet) out.push(list.slice(i, i + perSheet))
  return out
}

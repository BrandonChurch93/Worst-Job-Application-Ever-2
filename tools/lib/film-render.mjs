// Rendering a run of frames in pieces: frames to disk, a piece encoded, its frames deleted, the pieces of a page joined into its chunk.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at, config, readJson, writeJson } from './paths.mjs'
import { readCanvas, recordFor } from './capture.mjs'
import { buildInfo } from './hashes.mjs'
import { addLook } from './looks.mjs'
import { chunkName, filmPlan, frameCountOf, framesIn, parsePiece, pieceName, piecesOf, sameBuild, stepOf, tile, timeLabel, unitsShown } from './film-plan.mjs'
import { clock, encodeFrames, join, probe, seconds, took } from './film-encode.mjs'

// What draws one frame of each kind of run.
export const sources = {
  film: {
    units: (cfg, id) => unitsShown(cfg, id),
    draw: (page, i, tier, diag) => page.evaluate(async ([n, t, d]) => {
      window.showcase.setDiagnostic(d)
      await window.showcase.renderFilmFrame(n, t)
    }, [i, tier, diag])
  },
  opening: {
    units: () => [],
    draw: (page, i, tier) => page.evaluate(async ([n, t]) => {
      window.showcase.setDiagnostic('beauty')
      if (window.showcase.info().tier !== t) await window.showcase.renderFilmFrame(0, t)
      await window.showcase.renderOpeningFrame(n)
    }, [i, tier])
  },
  loop: {
    units: (cfg) => cfg.film.units.map((u) => u.id),
    draw: (page, i, tier) => page.evaluate(async ([n, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderLoopFrame(n, t)
    }, [i, tier])
  }
}

// Asks the page for something that another builder may not have built yet. Gives null, with the page's own sentence, when it is not there.
export async function ask(session, name) {
  try {
    return { value: await session.page.evaluate((n) => window.showcase[n](), name), missing: null }
  } catch (e) {
    const line = String(e && e.message ? e.message : e).split('\n')[0].replace(/^page\.evaluate:\s*/, '').replace(/^Error:\s*/, '')
    return { value: null, missing: line }
  }
}

export function makeContext(o) {
  const cfg = o.cfg || config()
  const rate = o.rate || cfg.film.previewFps
  const area = o.area || 'film'
  const root = o.root || at('out', 'work', area)
  return {
    cfg, plan: filmPlan(cfg), name: o.name || area, session: o.session || null, format: o.format, tier: o.tier, diag: o.diag || 'beauty', assets: o.assets || 'full',
    rate, step: stepOf(cfg.film.fps, rate), codec: o.codec || cfg.export.videoCodec, mbps: o.mbps, ext: o.ext || cfg.export.container,
    maxFrames: Math.min(o.piece || 300, cfg.sandbox.maxFramesOnDisk), by: o.by || 'builder', deadline: o.deadline || null,
    dirs: { chunks: path.join(root, 'chunks'), pieces: path.join(root, 'chunks', 'pieces'), frames: path.join(root, 'frames'), looks: path.join(root, 'looks') },
    lookEvery: (o.lookMinutes || cfg.status.minGapMinutes) * 60, lastLook: clock(), rendered: 0, renderSeconds: 0, reused: 0, stopped: false
  }
}

// The record a piece of this build must carry. With no browser open it names neither the browser nor the machine, and so compares neither.
export function recordOf(ctx, units, what) {
  if (ctx.session) return recordFor(ctx.session, { units, tier: ctx.tier, diagnostic: ctx.diag, what })
  const info = buildInfo(at())
  const pageHashes = {}
  for (const u of units) if (info.pageHashes[u] !== undefined) pageHashes[u] = info.pageHashes[u]
  return { what, engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes, format: ctx.format.id, tier: ctx.tier, assets: ctx.assets, diagnostic: ctx.diag }
}

const recordFile = (file) => file.replace(/\.[a-z0-9]+$/i, '.json')
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

export function matches(file, record) {
  if (!fs.existsSync(file) || !fs.existsSync(recordFile(file))) return false
  let old
  try {
    old = readJson(recordFile(file))
  } catch {
    return false
  }
  return sameBuild(old, record)
}

export function writeOut(file, record, extra) {
  writeJson(recordFile(file), { ...record, ...extra, sha256: sha(file), bytes: fs.statSync(file).size })
}

const whatPiece = (ctx, kind, piece) => ({ [kind]: { unit: piece.unit, first: piece.first, last: piece.last, rate: ctx.rate, step: ctx.step, codec: ctx.codec, mbps: ctx.mbps } })

async function look(ctx, kind, piece, frame, png) {
  if (seconds(ctx.lastLook) < ctx.lookEvery) return
  ctx.lastLook = clock()
  fs.mkdirSync(ctx.dirs.looks, { recursive: true })
  const file = path.join(ctx.dirs.looks, `${pieceName(piece.unit, piece.first, piece.last, ctx.format.id, ctx.tier, ctx.diag)}-at-${frame}.jpg`)
  await sharp(png).jpeg({ quality: 90 }).toFile(file)
  addLook(file, `A frame of the ${ctx.name} render in progress: ${piece.unit}, frame ${frame} at ${timeLabel(frame, ctx.cfg.film.fps)}, ${ctx.tier} tier, ${ctx.format.id}`, ctx.by)
  console.log(`${ctx.name}: look written, ${path.relative(at(), file)}`)
}

// Renders one piece and encodes it. Frames already on disk from a run that was stopped are kept when they are of this build.
export async function renderPiece(ctx, kind, piece) {
  const source = sources[kind]
  const name = pieceName(piece.unit, piece.first, piece.last, ctx.format.id, ctx.tier, ctx.diag)
  const out = path.join(ctx.dirs.pieces, `${name}.${ctx.ext}`)
  const record = recordOf(ctx, source.units(ctx.cfg, piece.unit), whatPiece(ctx, kind, piece))
  if (matches(out, record)) {
    ctx.reused++
    return { file: out, reused: true, frames: frameCountOf(piece, ctx.step) }
  }
  if (!ctx.session) return { file: out, missing: true }
  const frames = framesIn(piece.first, piece.last, ctx.step)
  if (frames.length > ctx.cfg.sandbox.maxFramesOnDisk) throw new Error(`${ctx.name}: a piece of ${frames.length} frames is more than the ${ctx.cfg.sandbox.maxFramesOnDisk} that may wait on disk`)
  const dir = path.join(ctx.dirs.frames, name)
  if (fs.existsSync(ctx.dirs.frames)) for (const other of fs.readdirSync(ctx.dirs.frames)) if (other !== name) fs.rmSync(path.join(ctx.dirs.frames, other), { recursive: true, force: true })
  const note = path.join(dir, 'frames.json')
  if (fs.existsSync(dir) && !(fs.existsSync(note) && sameBuild(readJson(note), record))) fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  writeJson(note, record)
  const t0 = clock()
  let kept = 0
  for (let k = 0; k < frames.length; k++) {
    const file = path.join(dir, `${String(k).padStart(6, '0')}.png`)
    if (fs.existsSync(file)) {
      kept++
      continue
    }
    if (ctx.deadline && clock() > ctx.deadline) {
      ctx.stopped = true
      return { file: out, stopped: true, done: k, of: frames.length }
    }
    const f0 = clock()
    await source.draw(ctx.session.page, frames[k], ctx.tier, ctx.diag)
    const png = await readCanvas(ctx.session.page)
    fs.writeFileSync(`${file}.part`, png)
    fs.renameSync(`${file}.part`, file)
    ctx.rendered++
    ctx.renderSeconds += seconds(f0)
    await look(ctx, kind, piece, frames[k], png)
  }
  const renderSeconds = seconds(t0)
  const e0 = clock()
  const p = encodeFrames(dir, out, { rate: ctx.rate, mbps: ctx.mbps, codec: ctx.codec, frames: frames.length })
  const info = await ctx.session.page.evaluate(() => window.showcase.info())
  writeOut(out, record, { frames: frames.length, framesKept: kept, renderSeconds: Number(renderSeconds.toFixed(2)), encodeSeconds: Number(seconds(e0).toFixed(2)), probe: p, standIns: info.standIns, problems: [...new Set(ctx.session.problems)] })
  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`${ctx.name}: piece ${path.relative(at(), out)}, ${frames.length} frames${kept ? `, ${kept} of them kept from the run before` : ''}, rendered in ${took(renderSeconds)}, encoded in ${took(seconds(e0))}`)
  return { file: out, reused: false, frames: frames.length }
}

// The pieces of one unit that exist on disk and are of this build.
export function piecesOnDisk(ctx, kind, unit) {
  if (!fs.existsSync(ctx.dirs.pieces)) return []
  const out = []
  for (const name of fs.readdirSync(ctx.dirs.pieces)) {
    const p = parsePiece(name, unit.id, ctx.format.id, ctx.tier, ctx.diag, ctx.ext)
    if (!p) continue
    const file = path.join(ctx.dirs.pieces, name)
    if (matches(file, recordOf(ctx, sources[kind].units(ctx.cfg, unit.id), whatPiece(ctx, kind, p)))) out.push({ ...p, file })
  }
  return out
}

const whatChunk = (ctx, kind, unit) => ({ [kind]: { unit: unit.id, first: unit.first, last: unit.last, rate: ctx.rate, step: ctx.step, codec: ctx.codec, mbps: ctx.mbps, chunk: true } })

export const chunkFile = (ctx, unit) => path.join(ctx.dirs.chunks, `${chunkName(unit.id, ctx.format.id, ctx.tier, ctx.diag)}.${ctx.ext}`)

// A page's chunk: reused when it is of this build, joined from its pieces when they cover the page, and otherwise reported as missing.
export function chunkOf(ctx, kind, unit) {
  const file = chunkFile(ctx, unit)
  const record = recordOf(ctx, sources[kind].units(ctx.cfg, unit.id), whatChunk(ctx, kind, unit))
  const frames = framesIn(unit.first, unit.last, ctx.step).length
  if (matches(file, record)) return { unit: unit.id, file, frames, reused: true }
  const t = tile(piecesOnDisk(ctx, kind, unit), unit.first, unit.last, ctx.step)
  if (!t.whole) return { unit: unit.id, file, frames, missing: t.missing }
  const t0 = clock()
  const p = join(t.pieces.map((x) => x.file), file, frames)
  const records = t.pieces.map((x) => readJson(recordFile(x.file)))
  const standIns = new Map()
  for (const r of records) for (const s of r.standIns || []) standIns.set(s.name, s)
  writeOut(file, record, {
    frames, probe: p, pieces: t.pieces.map((x) => path.basename(x.file)), renderSeconds: Number(records.reduce((s, r) => s + (r.renderSeconds || 0), 0).toFixed(2)),
    browser: records[0].browser, machines: [...new Set(records.map((r) => (r.machine ? r.machine.host : 'unknown')))], standIns: [...standIns.values()], problems: [...new Set(records.flatMap((r) => r.problems || []))]
  })
  console.log(`${ctx.name}: chunk ${path.relative(at(), file)}, ${frames} frames from ${t.pieces.length} piece${t.pieces.length === 1 ? '' : 's'}, joined in ${took(seconds(t0))}`)
  return { unit: unit.id, file, frames, reused: false }
}

// Renders what is missing of a unit, inside a range if one is given, then makes its chunk if the whole page is there.
export async function renderUnit(ctx, kind, unit, range = null) {
  const whole = chunkOf(ctx, kind, unit)
  if (!whole.missing) return whole
  const have = piecesOnDisk(ctx, kind, unit)
  const want = range ? { first: Math.max(range.first, unit.first), last: Math.min(range.last, unit.last) } : { first: unit.first, last: unit.last }
  const covered = tile(have, want.first, want.last, ctx.step)
  for (const gap of covered.missing) {
    for (const piece of piecesOf(unit, ctx.step, ctx.maxFrames, gap)) {
      const r = await renderPiece(ctx, kind, piece)
      if (r.stopped) return { unit: unit.id, stopped: true, done: r.done, of: r.of, piece }
    }
  }
  return chunkOf(ctx, kind, unit)
}

// The run of pieces that covers a range that is not a whole page, for a clip.
export function clipPieces(ctx, kind, units, range) {
  const out = []
  for (const unit of units) {
    const first = Math.max(range.first, unit.first)
    const last = Math.min(range.last, unit.last)
    if (first > last) continue
    const chunk = chunkFile(ctx, unit)
    const whole = first === unit.first && last === unit.last
    if (whole && matches(chunk, recordOf(ctx, sources[kind].units(ctx.cfg, unit.id), whatChunk(ctx, kind, unit)))) {
      out.push({ unit: unit.id, first: Math.ceil(first / ctx.step) * ctx.step, last: Math.floor(last / ctx.step) * ctx.step, file: chunk })
      continue
    }
    const t = tile(piecesOnDisk(ctx, kind, unit), first, last, ctx.step)
    if (!t.whole) return { pieces: out, missing: { unit: unit.id, ranges: t.missing } }
    out.push(...t.pieces)
  }
  return { pieces: out, missing: null }
}

export function copyChunks(ctx, to) {
  let n = 0
  const copy = (from, dest) => {
    if (!fs.existsSync(from)) return
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(from)) {
      if (!name.endsWith(`.${ctx.ext}`) || name.includes('.part.')) continue
      const rec = name.replace(/\.[a-z0-9]+$/i, '.json')
      if (!fs.existsSync(path.join(from, rec))) continue
      const same = fs.existsSync(path.join(dest, rec)) && fs.existsSync(path.join(dest, name)) && fs.readFileSync(path.join(dest, rec), 'utf8') === fs.readFileSync(path.join(from, rec), 'utf8')
      if (same) continue
      fs.copyFileSync(path.join(from, name), path.join(dest, name))
      fs.copyFileSync(path.join(from, rec), path.join(dest, rec))
      n++
    }
  }
  return { copy, count: () => n }
}

// Finished chunks and their records out to a folder, with the pieces of pages that are not whole yet.
export function chunksTo(ctx, dir) {
  const c = copyChunks(ctx)
  c.copy(ctx.dirs.chunks, dir)
  const whole = new Set(fs.existsSync(ctx.dirs.chunks) ? fs.readdirSync(ctx.dirs.chunks) : [])
  if (fs.existsSync(ctx.dirs.pieces)) {
    const loose = fs.readdirSync(ctx.dirs.pieces).filter((n) => n.endsWith(`.${ctx.ext}`) && !n.includes('.part.') && !whole.has(n.replace(/-\d{6}-\d{6}-/, '-')))
    if (loose.length) {
      const dest = path.join(dir, 'pieces')
      fs.mkdirSync(dest, { recursive: true })
      for (const name of loose) {
        const rec = name.replace(/\.[a-z0-9]+$/i, '.json')
        if (!fs.existsSync(path.join(ctx.dirs.pieces, rec))) continue
        fs.copyFileSync(path.join(ctx.dirs.pieces, name), path.join(dest, name))
        fs.copyFileSync(path.join(ctx.dirs.pieces, rec), path.join(dest, rec))
      }
      return { chunks: c.count(), pieces: loose.length }
    }
  }
  return { chunks: c.count(), pieces: 0 }
}

// Chunks and pieces rendered elsewhere, taken in. A file is checked against its record's hash before it is believed.
export function chunksFrom(ctx, dir) {
  if (!fs.existsSync(dir)) throw new Error(`${ctx.name}: no folder ${dir} to take chunks from`)
  let taken = 0
  const bad = []
  const take = (from, dest) => {
    if (!fs.existsSync(from)) return
    for (const name of fs.readdirSync(from)) {
      if (!name.endsWith(`.${ctx.ext}`)) continue
      const rec = path.join(from, name.replace(/\.[a-z0-9]+$/i, '.json'))
      if (!fs.existsSync(rec)) {
        bad.push(`${name}: no record beside it`)
        continue
      }
      if (readJson(rec).sha256 !== sha(path.join(from, name))) {
        bad.push(`${name}: the file is not the one its record names`)
        continue
      }
      fs.mkdirSync(dest, { recursive: true })
      fs.copyFileSync(path.join(from, name), path.join(dest, name))
      fs.copyFileSync(rec, path.join(dest, path.basename(rec)))
      taken++
    }
  }
  take(dir, ctx.dirs.chunks)
  take(path.join(dir, 'pieces'), ctx.dirs.pieces)
  return { taken, bad }
}

export { probe }

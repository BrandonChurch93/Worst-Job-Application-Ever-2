// npm run film -- --which b --tier T --format F: a film as out/work/film-<which>-F-T.mp4, rendered a page at a time in chunks that join without being encoded again.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson } from './lib/paths.mjs'
import { openSession } from './lib/capture.mjs'
import { bitrateOf, clip, filmName, formatOfConfig, framesIn, tierOfConfig } from './lib/film-plan.mjs'
import { addSound, checkDisk, clock, ffmpeg, framesOnDisk, join, probe, probeLine, seconds, took } from './lib/film-encode.mjs'
import { ask, chunkOf, chunksFrom, chunksTo, clipPieces, makeContext, matches, recordOf, renderUnit, writeOut } from './lib/film-render.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const stop = (line) => {
  console.error(`film: ${line}`)
  process.exit(1)
}

const which = a.review ? 'b' : a.which === true || !a.which ? 'b' : String(a.which)
if (!['a', 'b'].includes(which)) stop(`--which is a or b, not "${which}"`)
let format
let tier
try {
  format = formatOfConfig(cfg, a.format && a.format !== true ? a.format : 'preview')
  tier = tierOfConfig(cfg, a.tier && a.tier !== true ? a.tier : 'draft')
} catch (e) {
  stop(e.message)
}
const diag = a.diag && a.diag !== true ? a.diag : 'beauty'
const sound = at('audio', 'mix', 'review.wav')
const outDir = at('out', 'work')
const fileOf = (name) => path.join(outDir, `${name}.${cfg.export.container}`)

try {
  checkDisk('film')
} catch (e) {
  stop(e.message.replace(/^film: /, ''))
}

function context(session) {
  return makeContext({
    cfg, name: 'film', area: 'film', session, format, tier, diag, assets: a.assets && a.assets !== true ? a.assets : 'full', mbps: bitrateOf(cfg, format.id),
    rate: a.fps && a.fps !== true ? Number(a.fps) : cfg.film.previewFps, piece: a.piece && a.piece !== true ? Number(a.piece) : undefined, by: a.by && a.by !== true ? a.by : 'builder',
    deadline: a.minutes && a.minutes !== true ? clock() + BigInt(Math.round(Number(a.minutes) * 60e9)) : null
  })
}

function finish(code = 0) {
  console.log(`film: done in ${took(seconds(t0))}`)
  process.exit(code)
}

// Joins the chunks that exist into the film, with its sound if there is any.
function joinFilm(ctx, opening) {
  const units = ctx.plan.units
  const parts = []
  const missing = []
  if (which === 'a') {
    if (!opening) throw new Error('the chunk of the opening of film A does not exist, so film A cannot be joined. Render it with --which a once the opening is built')
    parts.push({ ...opening, opening: true })
  }
  for (const u of units) {
    const c = chunkOf(ctx, 'film', u)
    if (c.missing) missing.push(u.id)
    else parts.push({ ...c, first: u.first, last: u.last })
  }
  if (!parts.some((p) => !p.opening)) throw new Error(`no chunk of this build exists for ${format.id} at the ${tier} tier. Render one with --unit ID, or the film without --join`)
  const name = a.review ? path.basename(cfg.export.files.reviewCut, path.extname(cfg.export.files.reviewCut)) : filmName(which, format.id, tier, diag)
  const out = fileOf(name)
  const frames = parts.reduce((s, p) => s + p.frames, 0)
  const hasSound = fs.existsSync(sound)
  const silent = hasSound ? path.join(ctx.dirs.chunks, `${name}.silent.${cfg.export.container}`) : out
  join(parts.map((p) => p.file), silent, frames)
  let p
  if (hasSound) {
    const fps = cfg.film.fps
    const stretches = []
    for (const part of parts) {
      if (part.opening) stretches.push({ silence: part.frames / ctx.rate })
      else {
        const from = part.first / fps
        const length = (part.last - part.first + 1) / fps
        const before = stretches[stretches.length - 1]
        if (before && before.from !== undefined && Math.abs(before.from + before.seconds - from) < 1e-9) before.seconds += length
        else stretches.push({ from, seconds: length })
      }
    }
    p = addSound(silent, sound, out, stretches, { codec: cfg.export.audioCodec, kbps: cfg.export.audioKbps })
    fs.rmSync(silent, { force: true })
  } else p = probe(out)
  if (p.frames !== frames) throw new Error(`${path.relative(at(), out)} holds ${p.frames} frames, not the ${frames} of its chunks`)
  const record = recordOf(ctx, cfg.film.units.map((u) => u.id), { film: { which, review: Boolean(a.review), rate: ctx.rate, step: ctx.step, codec: ctx.codec, mbps: ctx.mbps } })
  const records = parts.map((x) => readJson(x.file.replace(/\.[a-z0-9]+$/i, '.json')))
  const standIns = new Map()
  for (const r of records) for (const s of r.standIns || []) standIns.set(s.name, s)
  writeOut(out, record, {
    complete: missing.length === 0, units: parts.filter((x) => !x.opening).map((x) => x.unit), missingUnits: missing, opening: which === 'a', frames, probe: p,
    sound: hasSound ? path.relative(at(), sound) : null, chunks: parts.map((x) => path.basename(x.file)), renderSeconds: Number(records.reduce((s, r) => s + (r.renderSeconds || 0), 0).toFixed(2)), standIns: [...standIns.values()]
  })
  console.log(`film: wrote ${path.relative(at(), out)}: ${probeLine(p)}`)
  if (missing.length) console.log(`film: NOT THE WHOLE FILM. No chunk of this build for: ${missing.join(', ')}. The file holds ${parts.filter((x) => !x.opening).map((x) => x.unit).join(', ')}`)
  if (!hasSound) console.log('film: silent, because audio/mix/review.wav does not exist')
  return { out, complete: missing.length === 0 }
}

if (a['from-hd']) {
  const hd = cfg.formats.hd
  const pre = cfg.formats.preview
  const ctxHd = makeContext({ cfg, name: 'film', format: hd, tier, diag, mbps: bitrateOf(cfg, hd.id) })
  const from = fileOf(filmName(which, hd.id, tier, diag))
  const record = recordOf(ctxHd, cfg.film.units.map((u) => u.id), { film: { which, review: false, rate: ctxHd.rate, step: ctxHd.step, codec: ctxHd.codec, mbps: ctxHd.mbps } })
  if (!fs.existsSync(from)) stop(`no ${path.relative(at(), from)} to scale down. Render the film in ${hd.id} first`)
  if (!matches(from, record)) stop(`${path.relative(at(), from)} is not of this build, so no copy is made from it. Render the film in ${hd.id} again`)
  const old = readJson(from.replace(/\.[a-z0-9]+$/i, '.json'))
  const out = fileOf(filmName(which, pre.id, tier, diag))
  const made = out.replace(/\.([a-z0-9]+)$/i, '.part.$1')
  const mbps = bitrateOf(cfg, pre.id)
  ffmpeg(['-i', from, '-vf', `scale=${pre.width}:${pre.height}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high', '-b:v', `${mbps}M`, '-maxrate', `${mbps * 1.5}M`, '-bufsize', `${mbps * 2}M`,
    '-g', String(ctxHd.rate), '-flags', '+cgop', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', ...(old.probe.audio ? ['-c:a', 'copy'] : ['-an']), '-movflags', '+faststart', made], 'scaling the film down')
  fs.renameSync(made, out)
  const p = probe(out)
  if (p.frames !== old.frames) stop(`the copy holds ${p.frames} frames, not the ${old.frames} of the film it was made from`)
  writeOut(out, { ...record, format: pre.id, what: { film: { ...record.what.film, mbps, fromHd: path.relative(at(), from) } } }, { complete: old.complete, units: old.units, missingUnits: old.missingUnits, opening: old.opening, frames: p.frames, probe: p, sound: old.sound, standIns: old.standIns })
  console.log(`film: wrote ${path.relative(at(), out)} from ${path.relative(at(), from)}: ${probeLine(p)}`)
  finish()
}

if (a['chunks-from']) {
  const ctx = context(null)
  const r = chunksFrom(ctx, path.resolve(String(a['chunks-from'])))
  for (const b of r.bad) console.log(`film: not taken in, ${b}`)
  console.log(`film: took in ${r.taken} chunk${r.taken === 1 ? '' : 's'} and piece${r.taken === 1 ? '' : 's'} from ${a['chunks-from']}`)
}

if (a.join) {
  const ctx = context(null)
  let open = null
  if (which === 'a') {
    const note = path.join(ctx.dirs.chunks, `opening-${format.id}-${tier}.json`)
    const rec = fs.existsSync(note) ? readJson(note) : null
    if (rec && rec.what && rec.what.opening) {
      const c = chunkOf(ctx, 'opening', { id: 'opening', first: 0, last: rec.what.opening.last })
      if (!c.missing) open = c
    }
  }
  try {
    joinFilm(ctx, open)
  } catch (e) {
    stop(e.message)
  }
  if (a['chunks-to']) {
    const n = chunksTo(ctx, path.resolve(String(a['chunks-to'])))
    console.log(`film: copied ${n.chunks} chunk${n.chunks === 1 ? '' : 's'} and ${n.pieces} loose piece${n.pieces === 1 ? '' : 's'} to ${a['chunks-to']}`)
  }
  finish()
}

let range = null
if (a.first !== undefined || a.last !== undefined) {
  const plan = makeContext({ cfg, format, tier, mbps: 1 }).plan
  const first = a.first !== undefined && a.first !== true ? Number(a.first) : 0
  const last = a.last !== undefined && a.last !== true ? Number(a.last) : plan.frameCount - 1
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 0 || last < first || last >= plan.frameCount) stop(`--first and --last are frames of the film, from 0 to ${plan.frameCount - 1}, with --first no later than --last`)
  range = { first, last }
}
if (a.unit && a.unit !== true && !cfg.film.units.some((u) => u.id === a.unit)) stop(`no page called "${a.unit}" in the film. The pages are ${cfg.film.units.map((u) => u.id).join(', ')}`)

let session
try {
  session = await openSession({ format: format.id, assets: a.assets && a.assets !== true ? a.assets : 'full' })
} catch (e) {
  stop(e.message)
}
let code = 0
try {
  const ctx = context(session)
  const film = await session.page.evaluate(() => window.showcase.film())
  if (film.frameCount !== ctx.plan.frameCount || JSON.stringify(film.units) !== JSON.stringify(ctx.plan.units)) throw new Error('the film the site reports is not the film the config gives')
  if (range && !clip(range.first, range.last, ctx.step)) throw new Error(`no frame between ${range.first} and ${range.last} is rendered at ${ctx.rate} a second: one frame in ${ctx.step} is`)
  let opening = null
  if (which === 'a') {
    const o = await ask(session, 'opening')
    if (!o.value) throw new Error(`${o.missing}, so film A cannot be made yet. Film B renders with --which b`)
    if (!a.unit && !range) {
      const unit = { id: 'opening', first: 0, last: o.value.frameCount - 1 }
      const r = await renderUnit(ctx, 'opening', unit)
      if (r.stopped) ctx.stopped = true
      else opening = r
    }
  }
  const units = ctx.plan.units.filter((u) => (!a.unit || a.unit === true || u.id === a.unit) && (!range || (u.last >= range.first && u.first <= range.last)))
  const results = []
  for (const unit of units) {
    if (ctx.stopped) break
    const u0 = clock()
    const r = await renderUnit(ctx, 'film', unit, range)
    results.push(r)
    if (r.stopped) console.log(`film: stopped at the time limit in ${unit.id}, ${r.done} of ${r.of} frames of its piece on disk`)
    else if (r.missing) console.log(`film: ${unit.id}, the range asked for is rendered: ${framesIn(Math.max(unit.first, range.first), Math.min(unit.last, range.last), ctx.step).length} frames in ${took(seconds(u0))}`)
    else console.log(`film: ${unit.id} ${r.reused ? 'reused, its chunk is of this build' : `whole, ${r.frames} frames, in ${took(seconds(u0))}`}: ${path.relative(at(), r.file)}`)
  }
  if (ctx.rendered) console.log(`film: ${ctx.rendered} frames rendered at ${(ctx.renderSeconds / ctx.rendered).toFixed(2)} s a frame (${format.id}, ${tier} tier, picture read and written included), ${framesOnDisk()} frames left on disk`)
  if (ctx.stopped) {
    console.log('film: NOT FINISHED. The time given with --minutes is used. Run the same command again to carry on where it stopped')
    code = 2
  } else if (range) {
    const c = clipPieces(ctx, 'film', ctx.plan.units, range)
    if (c.missing) throw new Error(`the range is not whole on disk: ${c.missing.unit} lacks ${c.missing.ranges.map((m) => `${m.first} to ${m.last}`).join(', ')}`)
    const got = clip(range.first, range.last, ctx.step)
    const out = fileOf(filmName(which, format.id, tier, diag, got))
    const frames = framesIn(got.first, got.last, ctx.step).length
    const hasSound = fs.existsSync(sound)
    const silent = hasSound ? path.join(ctx.dirs.chunks, `${path.basename(out, path.extname(out))}.silent.${cfg.export.container}`) : out
    join(c.pieces.map((x) => x.file), silent, frames)
    let p
    if (hasSound) {
      p = addSound(silent, sound, out, [{ from: got.first / cfg.film.fps, seconds: frames / ctx.rate }], { codec: cfg.export.audioCodec, kbps: cfg.export.audioKbps })
      fs.rmSync(silent, { force: true })
    } else p = probe(out)
    writeOut(out, recordOf(ctx, units.map((u) => u.id), { film: { which, first: got.first, last: got.last, rate: ctx.rate, step: ctx.step, codec: ctx.codec, mbps: ctx.mbps } }), { complete: false, frames, probe: p, sound: hasSound ? path.relative(at(), sound) : null, pieces: c.pieces.map((x) => path.basename(x.file)) })
    console.log(`film: wrote ${path.relative(at(), out)}, frames ${got.first} to ${got.last}: ${probeLine(p)}`)
  } else if (a.unit && a.unit !== true) {
    console.log(`film: the chunk of ${a.unit} is in ${path.relative(at(), ctx.dirs.chunks)}. Join the film with --join`)
  } else {
    joinFilm(ctx, opening)
  }
  if (a['chunks-to']) {
    const n = chunksTo(ctx, path.resolve(String(a['chunks-to'])))
    console.log(`film: copied ${n.chunks} chunk${n.chunks === 1 ? '' : 's'} and ${n.pieces} loose piece${n.pieces === 1 ? '' : 's'} to ${a['chunks-to']}`)
  }
} catch (e) {
  console.error(`film: ${String(e.message).replace(/^film: /, '')}`)
  code = 1
} finally {
  await session.close()
}
finish(code)

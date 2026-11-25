// npm run loop -- --tier T --format F: the card loop, its web copy and the card still under out/work/loop/.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson } from './lib/paths.mjs'
import { openSession, readCanvas } from './lib/capture.mjs'
import { difference, rawOf } from './lib/image.mjs'
import { addLook } from './lib/looks.mjs'
import { bitrateOf, clip, formatOfConfig, framesIn, loopPlan, tierOfConfig, webSize } from './lib/film-plan.mjs'
import { checkDisk, clock, ffmpeg, probe, probeLine, seconds, took } from './lib/film-encode.mjs'
import { ask, chunkOf, makeContext, matches, recordOf, renderUnit, sources, writeOut } from './lib/film-render.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const word = (v) => (v === undefined || v === true ? '' : String(v))
const rel = (f) => path.relative(at(), f)
const say = (line) => console.log(`loop: ${line}`)
const stop = (line) => {
  console.error(`loop: ${line}`)
  process.exit(1)
}

const card = cfg.deliver.cardLoop
let format
let tier
let plan
try {
  format = formatOfConfig(cfg, word(a.format) || card.format)
  tier = tierOfConfig(cfg, word(a.tier) || 'draft')
  plan = loopPlan(cfg)
  checkDisk('loop')
} catch (e) {
  stop(e.message.replace(/^loop: /, ''))
}
const unit = { id: 'loop', first: 0, last: plan.frameCount - 1 }
let range = null
if (a.first !== undefined || a.last !== undefined) {
  const first = word(a.first) ? Number(a.first) : 0
  const last = word(a.last) ? Number(a.last) : unit.last
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 0 || last < first || last > unit.last) stop(`--first and --last are frames of the loop, from 0 to ${unit.last}, with --first no later than --last`)
  if (!clip(first, last, plan.step)) stop(`no frame between ${first} and ${last} is rendered at ${card.fps} a second: every ${plan.step}th frame is`)
  range = { first, last }
}
const dir = at('out', 'work', 'loop')
const files = { loop: path.join(dir, cfg.export.files.cardLoop), web: path.join(dir, cfg.export.files.cardLoopWeb), still: path.join(dir, cfg.export.files.cardStill) }
const stillSource = path.join(dir, 'chunks', `card-still-${format.id}-${tier}.png`)
const context = (session) => makeContext({ cfg, name: 'loop', area: 'loop', session, format, tier, assets: word(a.assets) || 'full', rate: card.fps, mbps: bitrateOf(cfg, format.id), piece: word(a.piece) ? Number(a.piece) : undefined, by: word(a.by) || 'builder' })
const units = sources.loop.units(cfg)
const whatStill = { loop: { still: true, frame: 0 } }

// The loop, its web copy and the card still, from the loop's chunk and the picture of frame 0.
function deliver(ctx, chunk, seam) {
  const frames = plan.frames
  fs.copyFileSync(chunk.file, files.loop)
  const p = probe(files.loop)
  if (p.frames !== frames) throw new Error(`${rel(files.loop)} holds ${p.frames} frames, not the ${frames} of ${card.seconds} s at ${card.fps} a second`)
  const chunkRecord = readJson(chunk.file.replace(/\.[a-z0-9]+$/i, '.json'))
  const extra = { frames, seam, standIns: chunkRecord.standIns || [], renderSeconds: chunkRecord.renderSeconds }
  writeOut(files.loop, recordOf(ctx, units, { loop: { file: 'cardLoop', rate: card.fps, step: plan.step, codec: ctx.codec, mbps: ctx.mbps } }), { ...extra, probe: p })
  say(`wrote ${rel(files.loop)}: ${probeLine(p)}`)
  const size = webSize(format.width, format.height, card.webWidth)
  const made = files.web.replace(/\.([a-z0-9]+)$/i, '.part.$1')
  ffmpeg(['-i', files.loop, '-vf', `scale=${size.width}:${size.height}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-b:v', `${card.webBitrateMbps}M`, '-maxrate', `${card.webBitrateMbps * 1.5}M`, '-bufsize', `${card.webBitrateMbps * 2}M`,
    '-g', String(card.fps), '-flags', '+cgop', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-an', '-movflags', '+faststart', made], 'making the web copy of the loop')
  fs.renameSync(made, files.web)
  const w = probe(files.web)
  if (w.frames !== frames) throw new Error(`${rel(files.web)} holds ${w.frames} frames, not ${frames}`)
  writeOut(files.web, recordOf(ctx, units, { loop: { file: 'cardLoopWeb', rate: card.fps, step: plan.step, codec: 'h264', mbps: card.webBitrateMbps, width: size.width } }), { ...extra, probe: w })
  say(`wrote ${rel(files.web)}: ${probeLine(w)}`)
}

async function cardStill(ctx) {
  const record = recordOf(ctx, units, whatStill)
  if (!matches(stillSource, record)) {
    if (!ctx.session) return false
    await sources.loop.draw(ctx.session.page, 0, tier, 'beauty')
    fs.mkdirSync(path.dirname(stillSource), { recursive: true })
    fs.writeFileSync(stillSource, await readCanvas(ctx.session.page))
    writeOut(stillSource, record, {})
  }
  await sharp(stillSource).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toFile(files.still)
  writeOut(files.still, recordOf(ctx, units, { loop: { file: 'cardStill', frame: 0 } }), { width: format.width, height: format.height, from: rel(stillSource) })
  say(`wrote ${rel(files.still)}, frame 0 of the loop, ${format.width} by ${format.height}`)
  return true
}

// The frame one past the last must be frame 0.
async function seamOf(ctx) {
  const tmp = path.join(dir, 'chunks', `seam-${format.id}-${tier}.png`)
  await sources.loop.draw(ctx.session.page, plan.frameCount, tier, 'beauty')
  fs.writeFileSync(tmp, await readCanvas(ctx.session.page))
  const d = difference(await rawOf(stillSource), await rawOf(tmp))
  fs.rmSync(tmp, { force: true })
  return d.pixels === 0 ? 'identical' : `${d.pixels} pixels differ, the largest by ${d.largest}`
}

let session = null
let code = 0
try {
  let ctx = context(null)
  let chunk = a.join ? chunkOf(ctx, 'loop', unit) : { missing: true }
  const needStill = a.join && !chunk.missing && !matches(stillSource, recordOf(ctx, units, whatStill))
  if (!a.join || needStill) {
    session = await openSession({ format: format.id, assets: word(a.assets) || 'full' })
    ctx = context(session)
    const got = await ask(session, 'loop')
    if (!got.value) throw new Error(`${got.missing}, so there is no loop to render yet`)
    if (got.value.frameCount !== plan.frameCount) throw new Error(`the loop reports ${got.value.frameCount} frames, and deliver.cardLoop.seconds times film.fps is ${plan.frameCount}`)
    say(`the scene ${got.value.scene}, ${plan.frames} frames at ${card.fps} a second, every ${plan.step}th of its ${plan.frameCount}, in ${format.id} at the ${tier} tier`)
  }
  if (!a.join) {
    const r = await renderUnit(ctx, 'loop', unit, range)
    if (r.stopped) throw new Error('stopped before the range was whole. Run the same command again to carry on where it stopped')
    if (ctx.rendered) say(`${ctx.rendered} frames rendered at ${(ctx.renderSeconds / ctx.rendered).toFixed(2)} s a frame`)
    chunk = r
  }
  if (chunk.missing) {
    const lacks = chunk.missing.map((m) => `${m.first} to ${m.last}`).join(', ')
    if (a.join) throw new Error(`the loop is not whole on disk for ${format.id} at the ${tier} tier: it lacks frames ${lacks}. Render them with --first and --last`)
    say(`the range ${range.first} to ${range.last} is rendered: ${framesIn(range.first, range.last, plan.step).length} frames. The loop still lacks frames ${lacks}. Join it with --join once they exist`)
  } else {
    await cardStill(ctx)
    const seam = session ? await seamOf(ctx) : 'not checked, no browser was opened'
    deliver(ctx, chunk, seam)
    addLook(files.still, `The card still, frame 0 of the card loop, ${tier} tier, ${format.id}`, word(a.by) || 'builder')
    say(`the frame one past the last against frame 0: ${seam}`)
    if (session && seam !== 'identical') throw new Error('the loop does not close: the frame one past the last is not frame 0')
  }
} catch (e) {
  console.error(`loop: ${String(e.message).split('\n')[0].replace(/^loop: /, '')}`)
  code = 1
} finally {
  if (session) await session.close()
}
say(`done in ${took(seconds(t0))}`)
process.exit(code)

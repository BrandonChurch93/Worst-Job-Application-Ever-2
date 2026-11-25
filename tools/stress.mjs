// npm run stress: half a second of film at four moments in formats.hd, encoded at export.bitrateMbps and at quality.compressionStressMbps, with stills from both.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config } from './lib/paths.mjs'
import { openSession, readCanvas, recordFor, writeRecord } from './lib/capture.mjs'
import { difference, psnrText, rawOf } from './lib/image.mjs'
import { addLook } from './lib/looks.mjs'
import { around, encodeArgs, filmPlan, formatOfConfig, stepOf, tierOfConfig, timeLabel, unitsShown } from './lib/film-plan.mjs'
import { checkDisk, clock, ffmpeg, probe, probeLine, seconds, took } from './lib/film-encode.mjs'
import { sources } from './lib/film-render.mjs'
import { composeSheet } from './lib/film-sheet.mjs'
import { cropBox, stressMoments, stressName } from './lib/film-stress.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const word = (v) => (v === undefined || v === true ? '' : String(v))
const rel = (f) => path.relative(at(), f)
const say = (line) => console.log(`stress: ${line}`)
const stop = (line) => {
  console.error(`stress: ${line}`)
  process.exit(1)
}

let format
let tier
let moments
const plan = filmPlan(cfg)
try {
  format = formatOfConfig(cfg, word(a.format) || 'hd')
  tier = tierOfConfig(cfg, word(a.tier) || 'draft')
  moments = stressMoments(cfg, plan)
  checkDisk('stress')
} catch (e) {
  stop(e.message.replace(/^stress: /, ''))
}
if (word(a.moment)) {
  moments = moments.filter((m) => m.id === a.moment)
  if (!moments.length) stop(`no moment called "${a.moment}". The moments are rest, fire, office, boss`)
}
const rate = word(a.fps) ? Number(a.fps) : cfg.film.previewFps
let step
try {
  step = stepOf(cfg.film.fps, rate)
} catch (e) {
  stop(e.message)
}
const half = word(a.seconds) ? Number(a.seconds) : 0.5
const count = Math.max(2, Math.round(half * rate))
const rates = [cfg.export.bitrateMbps, cfg.quality.compressionStressMbps]
const dir = at('out', 'work', 'stress')
const by = word(a.by) || 'builder'
const edge = cfg.critics.maxImageLongEdgePx

// Two passes, so that half a second really holds the bitrate asked for where the picture can use it.
function encodeTwice(work, out, mbps, frames) {
  const log = path.join(work, `pass-${mbps}`)
  const input = ['-framerate', String(rate), '-start_number', '0', '-i', path.join(work, '%06d.png'), '-frames:v', String(frames), ...encodeArgs({ rate, mbps, codec: cfg.export.videoCodec })]
  ffmpeg([...input, '-pass', '1', '-passlogfile', log, '-f', 'null', '-'], `the first pass of ${path.basename(out)}`)
  ffmpeg([...input, '-pass', '2', '-passlogfile', log, '-movflags', '+faststart', out], `the second pass of ${path.basename(out)}`)
  const p = probe(out)
  if (p.frames !== frames) throw new Error(`${path.basename(out)} came out with ${p.frames} frames, not ${frames}`)
  return p
}

let session
try {
  session = await openSession({ format: format.id, assets: word(a.assets) || 'full' })
} catch (e) {
  stop(e.message)
}
let code = 0
let made = 0
try {
  for (const m of moments) {
    const m0 = clock()
    const frames = around(m.frame, count, step, m.unit.first, m.unit.last)
    const name = stressName(m.id, format.id, tier)
    const work = path.join(dir, 'frames', name)
    fs.rmSync(work, { recursive: true, force: true })
    fs.mkdirSync(work, { recursive: true })
    for (let k = 0; k < frames.length; k++) {
      await sources.film.draw(session.page, frames[k], tier, 'beauty')
      fs.writeFileSync(path.join(work, `${String(k).padStart(6, '0')}.png`), await readCanvas(session.page))
    }
    const state = await session.page.evaluate((i) => window.showcase.filmState(i), m.frame)
    const mid = frames.indexOf(Math.round(m.frame / step) * step) >= 0 ? frames.indexOf(Math.round(m.frame / step) * step) : Math.floor(frames.length / 2)
    const source = path.join(dir, `${name}-source.png`)
    fs.copyFileSync(path.join(work, `${String(mid).padStart(6, '0')}.png`), source)
    const raw = await rawOf(source)
    const sx = format.width / cfg.formats.hd.width
    const cursor = state.cursor && Number.isFinite(state.cursor.x) && Number.isFinite(state.cursor.y) ? { x: state.cursor.x * sx, y: state.cursor.y * sx } : { x: format.width / 2, y: format.height / 2 }
    const tileW = 461
    const box = cropBox(cursor.x, cursor.y, format.width, format.height, tileW, Math.round((tileW * format.height) / format.width))
    const tiles = [{ png: await sharp(source).png().toBuffer(), label: `as rendered, frame ${frames[mid]} at ${timeLabel(frames[mid], cfg.film.fps)}` }]
    const crops = [{ png: await sharp(source).extract(box).png().toBuffer(), label: 'as rendered, its own pixels' }]
    const results = []
    for (const mbps of rates) {
      const film = path.join(dir, `${stressName(m.id, format.id, tier, mbps)}.${cfg.export.container}`)
      const p = encodeTwice(work, film, mbps, frames.length)
      const still = film.replace(/\.[a-z0-9]+$/i, '.png')
      ffmpeg(['-i', film, '-vf', `select=eq(n\\,${mid}),scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24`, '-frames:v', '1', '-update', '1', still], `taking a still from ${path.basename(film)}`)
      const d = difference(raw, await rawOf(still))
      results.push({ mbps, film: rel(film), still: rel(still), probe: p, psnr: d.psnr === Infinity ? 'identical' : Number(d.psnr.toFixed(2)), largestDifference: d.largest })
      tiles.push({ png: await sharp(still).png().toBuffer(), label: `${mbps} Mbps asked, ${p.mbps} got, PSNR ${psnrText(d.psnr)}` })
      crops.push({ png: await sharp(still).extract(box).png().toBuffer(), label: `${mbps} Mbps, its own pixels` })
      say(`${m.id}: ${rel(film)}: ${probeLine(p)}. Still ${rel(still)}, PSNR against the rendered frame ${psnrText(d.psnr)}`)
    }
    fs.rmSync(work, { recursive: true, force: true })
    const sheet = path.join(dir, `${name}.jpg`)
    const g = await composeSheet([...tiles, ...crops], sheet, { edge, columns: 3, heading: `Compression stress, ${m.words}: ${m.beat}, ${frames.length} frames at ${rate} a second, ${format.id}, ${tier} tier` })
    const info = await session.page.evaluate(() => window.showcase.info())
    writeRecord(sheet, recordFor(session, { units: unitsShown(cfg, m.unit.id), tier, diagnostic: 'beauty', what: { stress: { moment: m.id, key: m.key, beat: m.beat, first: frames[0], last: frames[frames.length - 1], rate, step } } }), { source: rel(source), still: frames[mid], crop: box, encodes: results, width: g.width, height: g.height, standIns: info.standIns, problems: [...new Set(session.problems)] })
    addLook(sheet, `Compression stress, ${m.words}: the frame as rendered, at ${rates[0]} Mbps and at ${rates[1]} Mbps, whole and in its own pixels, ${format.id}, ${tier} tier`, by)
    made++
    say(`${m.id}: wrote ${rel(sheet)}, ${g.width} by ${g.height}, in ${took(seconds(m0))}`)
  }
} catch (e) {
  console.error(`stress: ${String(e.message).split('\n')[0].replace(/^stress: /, '')}`)
  code = 1
} finally {
  await session.close()
}
say(`${made} of ${moments.length} moments written under ${rel(dir)}/ in ${took(seconds(t0))}`)
process.exit(code)

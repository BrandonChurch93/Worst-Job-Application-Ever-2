// npm run seq -- --first N --last M --tier T: every film frame from N to M as separate pictures in out/work/seq/.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { openSession, readCanvas, recordFor } from './lib/capture.mjs'
import { addLook } from './lib/looks.mjs'
import { filmPlan, formatOfConfig, framesIn, sameBuild, seqName, seqRunName, tierOfConfig, timeLabel, unitsShown } from './lib/film-plan.mjs'
import { checkDisk, clock, seconds, took } from './lib/film-encode.mjs'
import { ask, sources } from './lib/film-render.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const stop = (line) => {
  console.error(`seq: ${line}`)
  process.exit(1)
}
const word = (v) => (v === undefined || v === true ? '' : String(v))
const whole = (v, name) => {
  if (!/^\d+$/.test(word(v))) stop(`--${name} must be a frame number, a whole number from 0`)
  return Number(v)
}

const kind = a.opening ? 'opening' : a.loop ? 'loop' : 'film'
let format
let tier
try {
  format = formatOfConfig(cfg, word(a.format) || 'preview')
  tier = tierOfConfig(cfg, word(a.tier) || 'draft')
  checkDisk('seq')
} catch (e) {
  stop(e.message.replace(/^seq: /, ''))
}
if (a.first === undefined || a.last === undefined) stop('give the range: --first N --last M, in film frames')
const first = whole(a.first, 'first')
const last = whole(a.last, 'last')
const step = word(a.step) ? whole(a.step, 'step') : 1
if (step < 1) stop('--step must be 1 or more')
if (last < first) stop(`--last ${last} is before --first ${first}`)
const diag = word(a.diag) || 'beauty'
const by = word(a.by) || 'builder'
const dir = at('out', 'work', 'seq')
const plan = filmPlan(cfg)

const session = await openSession({ format: format.id, assets: word(a.assets) || 'full' })
let code = 0
let wrote = 0
let kept = 0
try {
  let count = plan.frameCount
  let fps = cfg.film.fps
  if (kind !== 'film') {
    const got = await ask(session, kind)
    if (got.missing) throw new Error(`${got.missing}, so there are no frames of it to write yet`)
    count = got.value.frameCount
    fps = got.value.fps || fps
  }
  if (last > count - 1) throw new Error(`the ${kind} has frames 0 to ${count - 1}, and --last is ${last}`)
  const frames = framesIn(first, last, step)
  if (!frames.length) throw new Error(`no frame from ${first} to ${last} falls on a step of ${step}`)
  if (frames.length > cfg.sandbox.maxFramesOnDisk) throw new Error(`${frames.length} frames are more than the ${cfg.sandbox.maxFramesOnDisk} that may wait on disk. Give a shorter range, or --step K for every K-th frame`)
  const units = kind === 'film' ? [...new Set(frames.map((f) => plan.units.find((u) => f >= u.first && f <= u.last).id))].flatMap((id) => unitsShown(cfg, id)) : sources[kind].units(cfg)
  const build = recordFor(session, { units: [...new Set(units)], tier, diagnostic: diag, what: { seq: kind } })
  const prefix = kind === 'film' ? '' : `${kind}-`
  const fileOf = (f) => path.join(dir, `${prefix}${seqName(f, format.id, tier, diag)}.png`)
  const noteOf = (f) => fileOf(f).replace(/\.png$/, '.json')
  fs.mkdirSync(dir, { recursive: true })
  const r0 = clock()
  let drawSeconds = 0
  for (const f of frames) {
    const file = fileOf(f)
    if (!a.force && fs.existsSync(file) && fs.existsSync(noteOf(f)) && sameBuild(readJson(noteOf(f)), build)) {
      kept++
      continue
    }
    const d0 = clock()
    await sources[kind].draw(session.page, f, tier, diag)
    const png = await readCanvas(session.page)
    drawSeconds += seconds(d0)
    fs.writeFileSync(`${file}.part`, png)
    fs.renameSync(`${file}.part`, file)
    writeJson(noteOf(f), { ...build, frame: f })
    wrote++
  }
  const info = await session.page.evaluate(() => window.showcase.info())
  const run = path.join(dir, `${prefix}${seqRunName(frames[0], frames[frames.length - 1], format.id, tier, diag)}.json`)
  writeJson(run, { ...build, first: frames[0], last: frames[frames.length - 1], step, frames: frames.length, files: frames.map((f) => path.basename(fileOf(f))), wrote, kept, renderSeconds: Number(seconds(r0).toFixed(2)), secondsAFrame: wrote ? Number((drawSeconds / wrote).toFixed(3)) : null, standIns: info.standIns, problems: [...new Set(session.problems)] })
  const mid = frames[Math.floor(frames.length / 2)]
  const beat = kind === 'film' ? plan.beats.find((b) => mid >= b.first && mid <= b.last) : null
  addLook(fileOf(mid), `Frame ${mid} at ${timeLabel(mid, fps)}${beat ? ` in ${beat.id}` : ''}, the middle one of ${frames.length} ${kind} frames written one by one, ${frames[0]} to ${frames[frames.length - 1]}, ${tier} tier, ${format.id}`, by)
  console.log(`seq: wrote ${wrote} picture${wrote === 1 ? '' : 's'}${kept ? ` and kept ${kept} of this build` : ''} in ${path.relative(at(), dir)}/, ${path.basename(fileOf(frames[0]))} to ${path.basename(fileOf(frames[frames.length - 1]))}${wrote ? `, ${(drawSeconds / wrote).toFixed(2)} s a frame` : ''}`)
  console.log(`seq: record ${path.relative(at(), run)}`)
} catch (e) {
  console.error(`seq: ${String(e.message).split('\n')[0].replace(/^seq: /, '')}`)
  code = 1
} finally {
  await session.close()
}
console.log(`seq: done in ${took(seconds(t0))}`)
process.exit(code)

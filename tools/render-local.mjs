// npm run render:local: the masters, made on a computer with a graphics card. --proof is the same path with software graphics, for one second.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { readCanvas } from './lib/capture.mjs'
import { difference, label, psnrText, rawOf } from './lib/image.mjs'
import { formatOfConfig, framesIn, tierOfConfig, timeLabel } from './lib/film-plan.mjs'
import { addSound, checkDisk, clock, join, probe, probeLine, seconds, took } from './lib/film-encode.mjs'
import { ask, clipPieces, makeContext, recordOf, renderUnit, sources, writeOut } from './lib/film-render.mjs'
import { findMoment } from './lib/film-sheet.mjs'
import { finalMix, openLocal, opener, proofRange } from './lib/film-local.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const word = (v) => (v === undefined || v === true ? '' : String(v))
const rel = (f) => path.relative(at(), f)
const say = (line) => console.log(`render:local: ${line}`)
const stop = (line) => {
  console.error(`render:local: ${line}`)
  process.exit(1)
}

const whats = ['film-b', 'film-a', 'loop']
const mode = a.proof ? 'proof' : a.test ? 'test' : a.go ? 'go' : null
if (!mode) stop('say what to do: --proof, or --what film-b, film-a or loop with --test or --go. Start with --what film-b --test')
if ([a.proof, a.test, a.go].filter(Boolean).length > 1) stop('give one of --proof, --test and --go')
const what = word(a.what) || (mode === 'proof' ? '' : 'film-b')
if (what && !whats.includes(what)) stop(`--what is one of ${whats.join(', ')}, not "${what}"`)
const proof = mode === 'proof'
let format
let tier
try {
  format = formatOfConfig(cfg, word(a.format) || (proof ? 'preview' : 'master'))
  tier = tierOfConfig(cfg, word(a.tier) || (proof ? 'draft' : 'final'))
  checkDisk('render:local')
} catch (e) {
  stop(e.message.replace(/^render:local: /, ''))
}
for (const tool of ['ffmpeg', 'ffprobe']) if (spawnSync(tool, ['-version'], { stdio: 'ignore' }).status !== 0) stop(`${tool} is not installed, and the local render needs it`)
if (word(a.mix) && !fs.existsSync(path.resolve(word(a.mix)))) stop(`no sound file ${word(a.mix)}`)
const software = proof || Boolean(a.software)
const fps = cfg.film.fps
const local = cfg.export.local
const rootDir = at('out', 'work', 'render-local')
const isMaster = format.id === cfg.formats.master.id
const notes = []
const wroteFiles = []

function context(session, name) {
  return makeContext({ cfg, name: 'render:local', session, format, tier, assets: 'full', rate: fps, codec: local.videoCodec, ext: local.container, mbps: null, piece: word(a.piece) ? Number(a.piece) : proof ? 300 : 120, by: word(a.by) || 'builder', root: path.join(rootDir, name) })
}

// Renders a run of segments, each a page of the film, the opening or the loop, up to `limit` frames in all, and gives the pieces that hold them.
async function renderRun(ctx, segs, limit) {
  const files = []
  let left = limit
  let frames = 0
  for (const s of segs) {
    if (left <= 0) break
    const all = framesIn(s.unit.first, s.unit.last, ctx.step)
    const range = s.range || { first: s.unit.first, last: all[Math.min(all.length, left) - 1] }
    const whole = range.first === s.unit.first && range.last === s.unit.last
    const u0 = clock()
    const before = ctx.rendered
    const r = await renderUnit(ctx, s.kind, s.unit, whole ? null : range)
    if (r.stopped) throw new Error(`stopped in ${s.unit.id}. Run the same command again to carry on where it stopped`)
    const c = clipPieces(ctx, s.kind, [s.unit], range)
    if (c.missing) throw new Error(`${s.unit.id} is not whole on disk: it lacks ${c.missing.ranges.map((m) => `${m.first} to ${m.last}`).join(', ')}`)
    const n = framesIn(range.first, range.last, ctx.step).length
    files.push(...c.pieces.map((p) => p.file))
    frames += n
    left -= n
    say(`${s.unit.id}: ${n} frames ${r.reused || ctx.rendered === before ? 'reused, they are of this build' : `in ${took(seconds(u0))}`}`)
  }
  return { files, frames }
}

// Joins pieces into one file, lays the mix under it when there is one, and checks the count of its frames.
function assemble(ctx, run, out, units, whatOf, sound) {
  const silent = sound.mix ? out.replace(/\.([a-z0-9]+)$/i, '.silent.$1') : out
  join(run.files, silent, run.frames)
  let p
  if (sound.mix) {
    p = addSound(silent, sound.mix, out, [{ from: sound.from, seconds: run.frames / ctx.rate }], { codec: 'pcm_s24le', kbps: 2304 })
    fs.rmSync(silent, { force: true })
  } else p = probe(out)
  if (p.frames !== run.frames) throw new Error(`${rel(out)} holds ${p.frames} frames, not the ${run.frames} that were rendered`)
  if (p.width !== format.width || p.height !== format.height) throw new Error(`${rel(out)} is ${p.width} by ${p.height}, not ${format.width} by ${format.height}`)
  if (Math.abs(p.rate - ctx.rate) > 1e-6) throw new Error(`${rel(out)} runs at ${p.rate} a second, not ${ctx.rate}`)
  writeOut(out, recordOf(ctx, units, whatOf), { frames: run.frames, probe: p, sound: sound.mix ? rel(sound.mix) : null, graphics: ctx.session.graphics, softwareGraphics: ctx.session.software, pieces: run.files.map((f) => path.basename(f)) })
  wroteFiles.push(out)
  say(`wrote ${rel(out)}: ${probeLine(p)}`)
  if (!sound.mix && !sound.quiet) notes.push(`${path.basename(out)} is silent, because audio/final/ holds no mix for it`)
  return p
}

const soundOf = (which, from) => ({ mix: word(a.mix) ? path.resolve(word(a.mix)) : finalMix(which, cfg), from })
const allUnits = cfg.film.units.map((u) => u.id)

async function checkFilm(session, ctx) {
  const film = await session.page.evaluate(() => window.showcase.film())
  const length = cfg.film.units.reduce((n, u) => n + u.seconds, 0)
  if (film.frameCount !== length * fps) throw new Error(`the film reports ${film.frameCount} frames, and its ${length} s at ${fps} a second are ${length * fps}`)
  if (film.frameCount !== ctx.plan.frameCount || JSON.stringify(film.units) !== JSON.stringify(ctx.plan.units)) throw new Error('the film the site reports is not the film the config gives')
  return film
}

async function openingUnit(session) {
  const o = await ask(session, 'opening')
  if (!o.value) return { missing: o.missing }
  return { unit: { id: 'opening', first: 0, last: o.value.frameCount - 1 } }
}

async function loopUnit(session) {
  const l = await ask(session, 'loop')
  if (!l.value) return { missing: l.missing }
  const rate = l.value.frameCount / cfg.deliver.cardLoop.seconds
  if (!Number.isInteger(rate)) throw new Error(`the card loop reports ${l.value.frameCount} frames, which is no whole rate over its ${cfg.deliver.cardLoop.seconds} s`)
  return { unit: { id: 'loop', first: 0, last: l.value.frameCount - 1 }, rate, scene: l.value.scene }
}

async function runProof() {
  const session = await openLocal({ format: format.id, software: true })
  const want = Math.round(cfg.export.proofSeconds * fps)
  const results = {}
  let missing = null
  try {
    say(`the proof: ${cfg.export.proofSeconds} s at ${fps} a second in ${format.id} at the ${tier} tier, ${local.videoCodec} in ${local.container}, drawn by ${session.graphics}`)
    const ctx = context(session, 'proof')
    await checkFilm(session, ctx)
    if (!what || what === 'film-b') {
      const unit = ctx.plan.units.find((u) => u.id === 'step1')
      const hit = await findMoment(session, ctx.plan, 'hit', { nth: 1, unit, tolerance: 0 })
      if (!hit) throw new Error('the film reports no hit on the cursor in step 1, so there is no moment for the proof of film B')
      const r = proofRange(hit.frame, fps, cfg.export.proofSeconds, unit.first, unit.last)
      say(`film B: the hit ${hit.name} is at frame ${hit.frame}, ${timeLabel(hit.frame, fps)}. The proof holds frames ${r.first} to ${r.last}`)
      const run = await renderRun(ctx, [{ kind: 'film', unit, range: { first: r.first, last: r.last } }], want)
      const p = assemble(ctx, run, path.join(rootDir, 'proof', `proof-film-b.${local.container}`), ['step1'], { proof: { what: 'film-b', first: r.first, last: r.last, hit: hit.frame, event: hit.name, rate: fps, codec: local.videoCodec } }, soundOf('b', r.first / fps))
      if (p.frames !== want) throw new Error(`the proof of film B holds ${p.frames} frames, not ${want}`)
      results.filmB = { file: `proof-film-b.${local.container}`, first: r.first, last: r.last, hit: hit.frame, probe: p }
    }
    if (!what || what === 'film-a') {
      const o = await openingUnit(session)
      if (o.missing) missing = o.missing
      else {
        const run = await renderRun(ctx, [{ kind: 'opening', unit: o.unit }], want)
        const p = assemble(ctx, run, path.join(rootDir, 'proof', `proof-opening.${local.container}`), [], { proof: { what: 'opening', first: 0, last: run.frames - 1, rate: fps, codec: local.videoCodec } }, soundOf('a', 0))
        if (p.frames !== Math.min(want, o.unit.last + 1)) throw new Error(`the proof of the opening holds ${p.frames} frames, not ${want}`)
        results.opening = { file: `proof-opening.${local.container}`, first: 0, last: run.frames - 1, probe: p }
      }
    }
    if (what === 'loop') throw new Error('the proof is of film B and of the opening of film A. Give --what film-b or --what film-a, or neither for both')
    const record = recordOf(ctx, allUnits, { proof: true })
    const parts = []
    if (results.filmB) parts.push({ what: 'film-b', ...results.filmB, file: rel(path.join(rootDir, 'proof', results.filmB.file)) })
    if (results.opening) parts.push({ what: 'opening', ...results.opening, file: rel(path.join(rootDir, 'proof', results.opening.file)) })
    writeJson(path.join(rootDir, 'proof.json'), { engineHash: record.engineHash, pageHashes: record.pageHashes, parts, sharedHash: record.sharedHash, format: format.id, tier, seconds: cfg.export.proofSeconds, rate: fps, frames: want, codec: local.videoCodec, container: local.container, browser: record.browser, graphics: session.graphics, machine: record.machine, openingMissing: missing })
    say(`record ${rel(path.join(rootDir, 'proof.json'))}`)
  } finally {
    await session.close()
  }
  if (missing) {
    console.error(`render:local: ${missing}, so there is no proof of the opening yet${results.filmB ? '. The proof of film B is written' : ''}`)
    return 1
  }
  return 0
}

// One judged still rendered here beside the kept one, with their PSNR.
async function stillCheck() {
  const kept = at('out', 'stills')
  const pick = cfg.stills.filter((s) => !s.interface).map((s) => {
    const files = fs.existsSync(kept) ? fs.readdirSync(kept).filter((n) => n.startsWith(`still-${s.id}-`) && n.endsWith('.jpg') && fs.existsSync(path.join(kept, n.replace(/\.jpg$/, '.json')))) : []
    return files.length ? { id: s.id, file: path.join(kept, files.sort()[0]) } : null
  }).find(Boolean)
  if (!pick) {
    notes.push('no kept judged still in out/stills/ to compare with, so how this machine draws the scene was not checked')
    say('no kept judged still in out/stills/, so there is nothing to compare with')
    return
  }
  const rec = readJson(pick.file.replace(/\.jpg$/, '.json'))
  if (!rec.what || !rec.what.still) throw new Error(`${rel(pick.file)} has a record without the still it shows`)
  const session = await openLocal({ format: rec.format, assets: rec.assets || 'full', software })
  try {
    await session.page.evaluate(async (s) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderStill(s)
    }, rec.what.still)
    const png = await readCanvas(session.page)
    const dir = path.join(rootDir, 'test')
    fs.mkdirSync(dir, { recursive: true })
    const here = path.join(dir, `${path.basename(pick.file, '.jpg')}-here.jpg`)
    await sharp(png).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).toFile(here)
    const d = difference(await rawOf(pick.file), await rawOf(here))
    const w = 690
    const h = Math.round((w * session.format.height) / session.format.width)
    const side = path.join(dir, `${path.basename(pick.file, '.jpg')}-beside.jpg`)
    const tiles = [{ file: pick.file, words: 'kept in the workspace' }, { file: here, words: `this machine, ${session.graphics}`.slice(0, 80) }]
    const parts = [{ input: await label(`Judged still ${pick.id}: ${d.sameSize ? `PSNR ${psnrText(d.psnr)}` : 'the two pictures differ in size'}`, w * 2 + 8, 28), left: 0, top: 0 }]
    for (let i = 0; i < 2; i++) {
      parts.push({ input: await sharp(tiles[i].file).resize(w, h).png().toBuffer(), left: i * (w + 8), top: 36 })
      parts.push({ input: await label(tiles[i].words, w, 24, { size: 13 }), left: i * (w + 8), top: 36 + h })
    }
    await sharp({ create: { width: w * 2 + 8, height: 36 + h + 24, channels: 3, background: '#1b1b1d' } }).composite(parts).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(side)
    writeJson(side.replace(/\.jpg$/, '.json'), { still: pick.id, kept: rel(pick.file), here: rel(here), psnr: d.psnr === Infinity ? 'identical' : Number(d.psnr.toFixed(2)), pixelsThatDiffer: d.pixels, largestDifference: d.largest, graphics: session.graphics, browser: session.version })
    wroteFiles.push(side)
    const min = cfg.quality.crossMachineMinPsnr
    say(`judged still ${pick.id} beside the kept one: PSNR ${psnrText(d.psnr)}, ${rel(side)}`)
    if (d.psnr < min) {
      notes.push(`this machine draws the judged still ${pick.id} ${psnrText(d.psnr)} away from the kept one, under the ${min} dB of quality.crossMachineMinPsnr: look at ${rel(side)} before a long render`)
      say(`that is under ${min} dB: look at the picture before a long render`)
    }
  } finally {
    await session.close()
  }
}

function takeCheck() {
  if (!allUnits.includes('pinball')) return true
  const r = spawnSync(process.execPath, [at('tools', 'take.mjs'), '--check'], { cwd: at(), encoding: 'utf8' })
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim()
  for (const line of out.split('\n').filter(Boolean)) console.log(`  take: ${line}`)
  if (r.status === 0) {
    say('the pinball take holds on this machine')
    return true
  }
  notes.push(/not built yet/.test(out) ? 'npm run take is not built yet, so the pinball take was not checked on this machine' : 'npm run take -- --check did not pass on this machine. Search for a take here before a long render: see tools/HARNESS-NOTES.md')
  return false
}

function show(file) {
  if (a['no-open'] || software) return
  const [cmd, words] = opener(os.platform())
  try {
    spawn(cmd, [...words, file], { detached: true, stdio: 'ignore' }).unref()
    say(`opened ${rel(file)}`)
  } catch {
    say(`could not open ${rel(file)}: open it by hand`)
  }
}

async function runFilm() {
  let code = 0
  const test = mode === 'test'
  if (test && !a['skip-still']) await stillCheck()
  if (test && !a['skip-take'] && !takeCheck()) code = 1
  const session = await openLocal({ format: format.id, software })
  try {
    say(`${what}, ${test ? `the first ${local.testSeconds} s` : 'every frame'}, at ${fps} a second in ${format.id} (${format.width} by ${format.height}) at the ${tier} tier, ${local.videoCodec} in ${local.container}, drawn by ${session.graphics}`)
    if (session.software && isMaster && !cfg.deliver.sandboxMaster) throw new Error(`this machine draws with software graphics (${session.graphics}), and no master is rendered that way unless deliver.sandboxMaster is true. Run this on the computer with the graphics card`)
    const ctx = context(session, 'film')
    const limit = test ? Math.round(local.testSeconds * fps) : Infinity
    const segs = []
    let name
    let which = 'b'
    let expected
    if (what === 'loop') {
      const l = await loopUnit(session)
      if (l.missing) throw new Error(`${l.missing}, so there is no loop to render yet`)
      if (l.rate !== fps) notes.push(`the card loop reports ${l.rate} frames a second, not the ${fps} of film.fps, and is rendered at its own rate`)
      ctx.rate = l.rate
      ctx.step = 1
      segs.push({ kind: 'loop', unit: l.unit })
      name = path.basename(cfg.export.files.cardLoop, path.extname(cfg.export.files.cardLoop))
      expected = l.unit.last + 1
      which = null
    } else {
      const film = await checkFilm(session, ctx)
      expected = film.frameCount
      if (what === 'film-a') {
        const o = await openingUnit(session)
        if (o.missing) throw new Error(`${o.missing}, so film A cannot be rendered yet. Film B renders with --what film-b`)
        segs.push({ kind: 'opening', unit: o.unit })
        expected += o.unit.last + 1
        which = 'a'
      }
      for (const unit of ctx.plan.units) segs.push({ kind: 'film', unit })
      name = which === 'a' ? cfg.export.files.filmA : cfg.export.files.filmB
    }
    say(`${Math.min(limit, expected)} frames to hold${test ? '' : `, the whole length at ${ctx.rate} a second`}`)
    const run = await renderRun(ctx, segs, limit)
    if (run.frames !== Math.min(limit, expected)) throw new Error(`${run.frames} frames were rendered, not the ${Math.min(limit, expected)} asked for`)
    const out = path.join(rootDir, `${name}${test ? '-test' : ''}.${local.container}`)
    const p = assemble(ctx, run, out, allUnits, { local: { what, test, frames: run.frames, rate: ctx.rate, codec: local.videoCodec } }, which ? soundOf(which, 0) : { mix: null, from: 0, quiet: true })
    if (p.frames !== Math.min(limit, expected)) throw new Error(`${rel(out)} holds ${p.frames} frames, not ${Math.min(limit, expected)}`)
    if (what === 'loop') {
      await sources.loop.draw(session.page, 0, tier, 'beauty')
      const still = path.join(rootDir, cfg.export.files.cardStill)
      await sharp(await readCanvas(session.page)).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toFile(still)
      wroteFiles.push(still)
      say(`wrote ${rel(still)} from frame 0 of the loop`)
    }
    if (ctx.rendered) say(`${ctx.rendered} frames rendered at ${(ctx.renderSeconds / ctx.rendered).toFixed(2)} s a frame`)
    if (test) {
      show(out)
      say(`the test stops here. If the picture and the sound are right, render the whole of it with --what ${what} --go`)
    }
  } finally {
    await session.close()
  }
  return code
}

let code = 0
try {
  code = proof ? await runProof() : await runFilm()
} catch (e) {
  console.error(`render:local: ${String(e.message).split('\n')[0].replace(/^render:local: /, '')}`)
  code = 1
}
say(`${wroteFiles.length} file${wroteFiles.length === 1 ? '' : 's'} written in ${took(seconds(t0))}${notes.length ? `. ${notes.join('. ')}` : ''}`)
process.exit(code)

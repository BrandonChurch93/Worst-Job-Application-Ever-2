// The pinball scene of the live site as a video: the film's own frames between the two joins, encoded, with the record the page plays it by.
//   node tools/pinball-video.mjs                      render, encode, measure, write src/pages/step3/video/
//   node tools/pinball-video.mjs --time               seconds per frame at each tier on this machine (each timed frame follows its neighbour, as in a render), nothing written
//   --tier draft|review|final   --every N (render one frame in N and hold it, a stand-in)   --codec h264,vp9   --quality 16
//   --sound mix.wav (the scene's sound, cut to the span, muxed in)   --keep (use the frames already on disk)
//   --middle preview --ends 3   a stand-in: all but the first and last 3 frames are rendered in the small format and enlarged
//   --edge final   with --middle, the tier of those first and last frames   --keep any (keep whatever frames are on disk)
//   --frames <folder> [--first N]   no render: the film's own frames that already exist (000000.png onward, the film's size and rate). N is the number of the file that holds the join in:
//                                   by default the join's own frame when the folder holds the unit from its first frame, 0 when it holds exactly the span
//   --rate 30                       with --frames: the folder holds the film at this rate (each file is held); a smaller size is enlarged; both make a stand-in. --tier final says what the frames are
// The file is written to out/work/pinball-video/ and cut into pieces under the host's limit for one file (config host.maxFileMb); the pieces are what the site ships and the page joins.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import sharp from 'sharp'
import { openSession, renderJob } from './lib/capture.mjs'
import { machine } from './lib/browser.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { CODECS, compare, encode } from './lib/pinball-video-encode.mjs'
import { scene } from './lib/pinball-video-scene.mjs'

const a = args()
const cfg = config()
const tier = a.tier || 'draft'
const every = Math.max(1, Number(a.every || 1))
const quality = Number(a.quality || 16)
const codecs = String(a.codec || 'h264').split(',')
const out = at('src', 'pages', 'step3', 'video')
const work = at('out', 'work', 'pinball-video')
const given = typeof a.frames === 'string' ? path.resolve(a.frames) : null
const frames = path.join(work, given ? 'frames-given' : 'frames')
const PART_SHARE = 0.8
const partBytes = Math.floor(cfg.host.maxFileMb * PART_SHARE * 1048576)

const sc = await scene()
if (!sc.still) throw new Error('The arrow is already being walked at the join out: the join would not be the same picture twice')
const base = Math.round(sc.unitStart * sc.fps)
console.log(`scene: join in at frame ${sc.from.frame} (${sc.from.time.toFixed(3)} s, hash ${sc.from.hash}), join out at frame ${sc.to.frame} (${sc.to.time.toFixed(3)} s, hash ${sc.to.hash}), ${sc.frames} frames, ${(sc.frames / sc.fps).toFixed(3)} s`)

const ends = Math.max(1, Number(a.ends || 3))
const middle = typeof a.middle === 'string' ? a.middle : null
const edgeTier = middle && typeof a.edge === 'string' ? a.edge : tier
let session = given ? null : await openSession({ format: a.format || 'hd', assets: 'full', mode: 'capture' })
const full = session ? session.format : Object.entries(cfg.formats).map(([key, f]) => (key === (a.format || 'hd') || f.id === (a.format || 'hd') ? f : null)).find(Boolean)
try {
  if (a.time && session) {
    const spots = [sc.from.frame, sc.from.frame + Math.round(sc.frames * 0.3), sc.from.frame + Math.round(sc.frames * 0.6), sc.to.frame]
    const report = { machine: machine(), browser: session.version, format: session.format.id, tiers: {} }
    for (const t of String(a.time === true ? 'draft,review,final' : a.time).split(',')) {
      const list = []
      for (const f of spots) {
        await renderJob(session, { kind: 'film', frame: base + f - 1, tier: 'draft' })
        const t0 = clock()
        await renderJob(session, { kind: 'film', frame: base + f, tier: t })
        list.push(Number(seconds(t0).toFixed(2)))
      }
      const mean = list.reduce((s, v) => s + v, 0) / list.length
      report.tiers[t] = { samples: cfg.tiers[t]?.samplesPerFrame ?? null, secondsPerFrame: list, mean: Number(mean.toFixed(2)), wholeHours: Number(((mean * sc.frames) / 3600).toFixed(2)) }
      console.log(`${t}: ${list.join(', ')} s a frame at frames ${spots.join(', ')}; mean ${mean.toFixed(2)} s; ${sc.frames} frames would take ${took(mean * sc.frames)}`)
    }
    writeJson(path.join(work, 'time.json'), report)
  } else {
    const t0 = clock()
    let rendered = 0
    let first = null
    let taken = null
    if (given) {
      const have = fs.readdirSync(given).filter((f) => /^\d{6}\.png$/.test(f)).sort()
      const hold = Math.max(1, Math.round(sc.fps / Number(a.rate || sc.fps)))
      first = a.first !== undefined ? Number(a.first) : have.length === Math.ceil(sc.frames / hold) ? 0 : Math.floor(sc.from.frame / hold)
      const lead = a.first !== undefined || first === 0 ? 0 : sc.from.frame % hold
      const file = (i) => path.join(given, `${String(first + Math.floor((i + lead) / hold)).padStart(6, '0')}.png`)
      const missing = []
      for (let i = 0; i < sc.frames; i++) if (!fs.existsSync(file(i))) missing.push(path.basename(file(i)))
      if (missing.length) throw new Error(`${given} lacks ${new Set(missing).size} of the files from ${path.basename(file(0))} to ${path.basename(file(sc.frames - 1))} (the first missing: ${missing[0]})`)
      const m = await sharp(file(0)).metadata()
      const n = await sharp(file(sc.frames - 1)).metadata()
      if (m.width !== n.width || m.height !== n.height) throw new Error(`the frames of ${given} are not of one size`)
      const small = m.width !== full.width || m.height !== full.height
      if (small && Math.abs(m.width / m.height - full.width / full.height) > 0.001) throw new Error(`${path.basename(file(0))} is ${m.width} by ${m.height}, not the shape of the film`)
      fs.rmSync(frames, { recursive: true, force: true })
      fs.mkdirSync(frames, { recursive: true })
      for (let i = 0; i < sc.frames; i++) {
        const to = path.join(frames, `${String(i).padStart(6, '0')}.png`)
        if (small) fs.writeFileSync(to, await sharp(file(i)).resize(full.width, full.height, { kernel: 'lanczos3' }).png().toBuffer())
        else fs.symlinkSync(file(i), to)
      }
      taken = { given: path.relative(at(), given), first, files: new Set(Array.from({ length: sc.frames }, (_, i) => file(i))).size, width: m.width, height: m.height, heldFrames: hold, standIn: small || hold > 1 || a.tier !== 'final' }
      console.log(`took ${sc.frames} pictures from ${taken.files} files of ${given}, ${path.basename(file(0))} to ${path.basename(file(sc.frames - 1))}, ${m.width} by ${m.height}${small ? ' enlarged' : ''}${hold > 1 ? `, each held ${hold} frames` : ''}${taken.standIn ? ': a stand-in' : ''}`)
    } else {
      const record = { from: sc.from, to: sc.to, tier, edgeTier, format: session.format.id, every, middle, ends }
      const recordFile = path.join(work, 'record.json')
      const same = a.keep === 'any' || (a.keep && fs.existsSync(recordFile) && JSON.stringify(readJson(recordFile)) === JSON.stringify(record))
      if (!same) fs.rmSync(frames, { recursive: true, force: true })
      fs.mkdirSync(frames, { recursive: true })
      writeJson(recordFile, record)
      const name = (i) => path.join(frames, `${String(i).padStart(6, '0')}.png`)
      let held = -1
      const edge = (i) => !middle || i < ends || i >= sc.frames - ends
      const own = (i) => i % every === 0 || i === sc.frames - 1 || (middle && edge(i))
      const render = async (i, small) => {
        if (fs.existsSync(name(i))) return
        const png = await renderJob(session, { kind: 'film', frame: base + sc.from.frame + i, tier: small ? tier : edgeTier })
        fs.writeFileSync(name(i) + '.part', small ? await sharp(png).resize(full.width, full.height, { kernel: 'lanczos3' }).png().toBuffer() : png)
        fs.renameSync(name(i) + '.part', name(i))
        rendered++
        if (rendered % 10 === 0) console.log(`  frame ${i + 1} of ${sc.frames}, ${took(seconds(t0))}, ${(seconds(t0) / rendered).toFixed(2)} s a frame`)
      }
      for (let i = 0; i < sc.frames; i++) if (own(i) && edge(i)) await render(i, false)
      if (middle) {
        await session.close()
        session = await openSession({ format: middle, assets: 'full', mode: 'capture' })
        for (let i = 0; i < sc.frames; i++) if (own(i) && !edge(i)) await render(i, true)
      }
      for (let i = 0; i < sc.frames; i++) {
        if (own(i)) held = i
        else if (!fs.existsSync(name(i))) fs.copyFileSync(name(held), name(i))
      }
    }
    const renderSeconds = seconds(t0)
    console.log(`rendered ${rendered} frames in ${took(renderSeconds)}`)
    const files = []
    for (const codec of codecs) {
      const file = path.join(work, `pinball.${CODECS[codec].ext}`)
      const p = encode(frames, file, { codec, rate: sc.fps, quality, sound: typeof a.sound === 'string' ? a.sound : null })
      if (p.frames !== sc.frames) throw new Error(`${path.basename(file)} holds ${p.frames} pictures, not ${sc.frames}`)
      const m = compare(file, frames, sc.fps, work)
      const bytes = fs.statSync(file).size
      for (const f of fs.readdirSync(out)) if (f.startsWith(`${path.basename(file)}.`) && f.endsWith('.part')) fs.rmSync(path.join(out, f))
      const whole = fs.readFileSync(file)
      const parts = []
      for (let k = 0; k * partBytes < bytes; k++) {
        parts.push(`${path.basename(file)}.${k}.part`)
        fs.writeFileSync(path.join(out, parts[k]), whole.subarray(k * partBytes, Math.min(bytes, (k + 1) * partBytes)))
      }
      files.push({ file: path.basename(file), parts, codec, mime: CODECS[codec].mime, bytes, mbps: p.mbps, width: p.width, height: p.height, pixelFormat: p.pixelFormat, sound: p.audio ? p.audio.codec : null, against: m })
      console.log(`${path.basename(file)}: ${(bytes / 1048576).toFixed(2)} MB, ${p.mbps} Mbps, ${p.codec} ${p.pixelFormat}; 30 frames: PSNR mean ${m.thirty.psnr.mean} least ${m.thirty.psnr.least} dB, SSIM mean ${m.thirty.ssim.mean} least ${m.thirty.ssim.least}`)
    }
    const shipped = files.reduce((n, f) => n + f.bytes, 0) / 1048576
    console.log(`the site ships ${shipped.toFixed(2)} MB of video in pieces of at most ${(partBytes / 1048576).toFixed(1)} MB; the host takes ${cfg.host.maxFileMb} MB a file and ${cfg.host.maxShippedMb} MB in all`)
    writeJson(path.join(out, 'manifest.json'), {
      unit: sc.unit, fps: sc.fps, stepHz: sc.stepHz, frames: sc.frames, seconds: sc.frames / sc.fps, from: sc.from, to: sc.to, events: sc.events,
      render: taken
        ? { ...taken, tier: typeof a.tier === 'string' ? a.tier : null, format: full.id, quality }
        : { tier, samples: cfg.tiers[tier]?.samplesPerFrame ?? null, format: full.id, every, middle, ends: middle ? ends : null, edgeTier: middle ? edgeTier : null, quality, standIn: tier !== 'final' || every !== 1 || middle !== null, renderSeconds: Number(renderSeconds.toFixed(1)), browser: session.version },
      files
    })
    fs.writeFileSync(path.join(out, 'states.json'), JSON.stringify(sc.states) + '\n')
    const standIn = taken ? taken.standIn : tier !== 'final' || every !== 1 || middle !== null
    fs.writeFileSync(path.join(out, '.gitignore'), standIn ? 'pinball.*.part\n' : '')
    if (standIn) console.log('a stand-in: its pieces are kept out of git by src/pages/step3/video/.gitignore, which the real render empties')
    console.log(`wrote ${path.relative(at(), out)}/manifest.json, states.json and ${files.map((f) => f.parts.join(', ')).join(', ')}`)
  }
} finally {
  if (session) await session.close()
}

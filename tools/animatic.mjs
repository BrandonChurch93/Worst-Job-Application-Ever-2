// npm run animatic: the rough cut, out/roughcut.mp4, made from the approved images. No 3D, no sound.
import { spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { sheet, label as strip } from './lib/image.mjs'
import { addLook } from './lib/looks.mjs'
import { brightnessAt, faults, segmentAt, timeline, viewAt } from './lib/roughcut.mjs'

const a = args()
const cfg = config()
const planFile = at('tools', 'assets', 'roughcut-plan.json')
const plan = readJson(planFile)
const tl = timeline(cfg, plan)
const wrong = faults(cfg, tl)
if (wrong.length) {
  for (const w of wrong) console.error(`animatic: ${w}`)
  process.exit(1)
}
if (a.check) {
  console.log(`animatic: the plan holds, ${tl.total} frames in ${tl.segments.length} parts, ${tl.dips.length} page turns`)
  process.exit(0)
}

const { width, height, fps, total } = tl
const dark = [27, 27, 29]
const pad = 12
const work = at('out', 'work', 'roughcut')
fs.rmSync(work, { recursive: true, force: true })
fs.mkdirSync(path.join(work, 'frames'), { recursive: true })

const images = new Map()
for (const s of tl.segments) {
  if (images.has(s.image)) continue
  const { data, info } = await sharp(at(s.file)).removeAlpha().extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'copy' }).raw().toBuffer({ resolveWithObject: true })
  const W = info.width - pad * 2
  const H = info.height - pad * 2
  if (Math.abs(W / H - width / height) > 0.002) throw new Error(`animatic: ${s.image} is ${W} by ${H}, not the shape of the film`)
  images.set(s.image, { data, w: info.width, h: info.height, W, H })
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const labels = new Map()
for (const b of cfg.film.beats) {
  const size = plan.label.sizePx
  const w = Math.ceil(b.id.length * size * 0.62) + 18
  const h = size + 10
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="5" fill="#1b1b1d" fill-opacity="0.78"/><text x="9" y="${Math.round(h * 0.72)}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="${size}" fill="#ece7dd">${esc(b.id)}</text></svg>`
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  labels.set(b.id, { data, w: info.width, h: info.height })
}

async function frameOf(index) {
  const seg = segmentAt(tl, index)
  const img = images.get(seg.image)
  const [cx, cy, z] = viewAt(seg, index)
  const sw = img.W / z
  const sh = img.H / z
  const x0 = cx * img.W - sw / 2 + pad
  const y0 = cy * img.H - sh / 2 + pad
  const fx = width / sw
  const fy = height / sh
  const X0 = Math.floor(x0) - 2
  const Y0 = Math.floor(y0) - 2
  const CW = Math.min(img.w - X0, Math.ceil(sw) + 8)
  const CH = Math.min(img.h - Y0, Math.ceil(sh) + 8)
  const RW = Math.ceil(CW * fx)
  const RH = Math.ceil(CH * fy)
  const near = await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 3 } })
    .extract({ left: X0, top: Y0, width: CW, height: CH })
    .resize(RW, RH, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer()
  const tx = (X0 - x0) * fx
  const ty = (Y0 - y0) * fy
  const nx = Math.ceil(-tx)
  const ny = Math.ceil(-ty)
  const { data, info } = await sharp(near, { raw: { width: RW, height: RH, channels: 3 } })
    .affine([[fx / (RW / CW), 0], [0, fy / (RH / CH)]], { odx: tx + nx, ody: ty + ny, interpolator: sharp.interpolators.bicubic, background: { r: dark[0], g: dark[1], b: dark[2] } })
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.width < nx + width || info.height < ny + height) throw new Error(`animatic: frame ${index} of ${seg.beat} came out ${info.width} by ${info.height}, too small for ${nx}+${width} by ${ny}+${height}`)
  const out = Buffer.allocUnsafe(width * height * 3)
  const ch = info.channels
  for (let y = 0; y < height; y++) {
    const row = ((y + ny) * info.width + nx) * ch
    if (ch === 3) data.copy(out, y * width * 3, row, row + width * 3)
    else for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) out[(y * width + x) * 3 + c] = data[row + x * ch + c]
  }
  const lab = labels.get(seg.beat)
  const lx = plan.label.marginPx
  const ly = height - plan.label.marginPx - lab.h
  for (let y = 0; y < lab.h; y++) {
    for (let x = 0; x < lab.w; x++) {
      const s = (y * lab.w + x) * 4
      const alpha = lab.data[s + 3] / 255
      if (alpha === 0) continue
      const d = ((ly + y) * width + lx + x) * 3
      for (let c = 0; c < 3; c++) out[d + c] = Math.round(out[d + c] + (lab.data[s + c] - out[d + c]) * alpha)
    }
  }
  const level = brightnessAt(tl.dips, index)
  if (level < 1) for (let i = 0; i < out.length; i++) out[i] = Math.round(dark[i % 3] + (out[i] - dark[i % 3]) * level)
  return out
}

const outFile = at('out', 'roughcut.mp4')
const made = path.join(work, 'roughcut.mp4')
const enc = plan.encode
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${width}x${height}`, '-r', String(fps), '-i', '-', '-an',
  '-vf', 'scale=in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', enc.preset, '-crf', String(enc.crf), '-g', String(fps * 2),
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', made], { stdio: ['pipe', 'inherit', 'inherit'] })
const ended = new Promise((resolve, reject) => {
  ff.on('error', reject)
  ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`animatic: ffmpeg ended with ${code}`))))
})

const mids = new Map()
for (const b of cfg.film.beats) {
  const own = tl.segments.filter((s) => s.beat === b.id)
  for (const s of own) mids.set(Math.floor((s.first + s.last) / 2), { beat: b.id, image: s.image, part: own.length > 1 ? own.indexOf(s) + 1 : 0 })
}
const kept = []
const batch = 4
const started = process.hrtime.bigint()
for (let i = 0; i < total; i += batch) {
  const ids = []
  for (let j = i; j < Math.min(total, i + batch); j++) ids.push(j)
  const frames = await Promise.all(ids.map(frameOf))
  for (let k = 0; k < frames.length; k++) {
    const m = mids.get(ids[k])
    if (m) {
      const file = path.join(work, 'frames', `${String(kept.length + 1).padStart(2, '0')}-${m.beat}${m.part ? `-${m.part}` : ''}.jpg`)
      await sharp(frames[k], { raw: { width, height, channels: 3 } }).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(file)
      kept.push({ ...m, frame: ids[k], file })
    }
    if (!ff.stdin.write(frames[k])) await new Promise((r) => ff.stdin.once('drain', r))
  }
  if (i % 300 === 0) console.log(`animatic: frame ${i} of ${total}`)
}
ff.stdin.end()
await ended
const seconds = Number(process.hrtime.bigint() - started) / 1e9

const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate,codec_name,pix_fmt', '-of', 'json', made], { encoding: 'utf8' }).stdout).streams[0]
const mb = fs.statSync(made).size / 1e6
if (Number(probe.nb_read_frames) !== total || probe.width !== width || probe.height !== height) throw new Error(`animatic: the file holds ${probe.nb_read_frames} frames at ${probe.width} by ${probe.height}, expected ${total} at ${width} by ${height}`)

const per = 4
const tileW = 348
const tileH = Math.round((tileW * height) / width)
const sheets = []
for (let s = 0; s * 16 < kept.length; s++) {
  const group = kept.slice(s * 16, (s + 1) * 16)
  const rows = []
  for (let i = 0; i < group.length; i += per) {
    const line = group.slice(i, i + per)
    const names = []
    const tiles = []
    for (const k of line) {
      names.push({ input: await strip(`${k.beat}, frame ${k.frame}, ${k.image}`, tileW, 22, { size: 11 }), width: tileW, height: 22 })
      tiles.push({ input: await sharp(k.file).resize(tileW, tileH).png().toBuffer(), width: tileW, height: tileH })
    }
    rows.push(names, tiles)
  }
  const file = path.join(work, `roughcut-beats-${s + 1}.jpg`)
  await sheet(rows, file, { gap: 4 })
  sheets.push(path.relative(at(), file))
}

for (const f of sheets) addLook(at(f), `The rough cut, one frame from the middle of each beat: ${f.endsWith('-1.jpg') ? 'the first half' : f.endsWith('-2.jpg') ? 'the second half' : 'the last beats'}`)
if (mb > enc.maxMb) {
  console.error(`animatic: the file is ${mb.toFixed(1)} MB, over the ${enc.maxMb} MB the plan allows. It is left in out/work/roughcut/ and out/roughcut.mp4 is unchanged. Raise encode.crf in the plan`)
  process.exit(1)
}
fs.copyFileSync(made, outFile)
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
writeJson(at('out', 'roughcut.json'), {
  what: 'The rough cut: the film at its planned times, made from the approved images. Silent. Made by npm run animatic.',
  file: 'out/roughcut.mp4',
  sha256: sha(outFile),
  megabytes: Number(mb.toFixed(2)),
  width, height, fps, frames: total, seconds: total / fps,
  codec: probe.codec_name, pixelFormat: probe.pix_fmt, encode: enc,
  planSha256: sha(planFile),
  pageTurns: tl.dips,
  parts: tl.segments.map((s) => ({ beat: s.beat, image: s.image, first: s.first, last: s.last, from: s.from, to: s.to, held: s.held })),
})
console.log(`animatic: out/roughcut.mp4, ${total} frames at ${width} by ${height}, ${fps} a second, ${(total / fps).toFixed(0)} s, ${mb.toFixed(1)} MB, made in ${seconds.toFixed(0)} s`)
console.log(`animatic: one frame from every beat in ${sheets.join(' and ')}, and each one alone in out/work/roughcut/frames/`)

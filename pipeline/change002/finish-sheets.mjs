// Lays the shots of finish-shots.mjs out as the sheets a report carries: each at most 1200 px on its long edge.
// node pipeline/change002/finish-sheets.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const shots = path.join(root, 'out', 'work', 'finish-shots')
const proof = path.join(root, 'pipeline', 'change002', 'proof', 'finish')
const refs = path.join(root, 'references', 'approved-002')
const W = 1200
const GAP = 2

const label = (text) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="22"><rect width="100%" height="100%" fill="#0b0b0c"/><text x="6" y="16" font-family="sans-serif" font-size="14" fill="#e8e8e8">${text}</text></svg>`)

// One strip: the frames of a move, each cut to the same box of its shot (shot px), `per` to a row.
async function rows(name, text, box, per, every = 1, most = 999) {
  const files = fs.readdirSync(shots).filter((f) => new RegExp(`^${name}-\\d\\d\\.png$`).test(f)).sort().filter((_, i) => i % every === 0).slice(0, most)
  const tw = Math.floor((W - GAP * (per - 1)) / per)
  const th = Math.round((tw * box.height) / box.width)
  const tiles = []
  for (const f of files) tiles.push(await sharp(path.join(shots, f)).extract(box).resize(tw, th).png().toBuffer())
  const n = Math.ceil(tiles.length / per)
  const body = await sharp({ create: { width: W, height: n * th + (n - 1) * GAP, channels: 3, background: '#0b0b0c' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % per) * (tw + GAP), top: Math.floor(i / per) * (th + GAP) }))).png().toBuffer()
  return [await sharp(label(`${text} (${files.length} frames)`)).png().toBuffer(), body]
}

async function picture(file, text) {
  return [await sharp(label(text)).png().toBuffer(), await sharp(file).resize(W).png().toBuffer()]
}

async function pair(left, right, text) {
  const w = (W - GAP) / 2
  const a = await sharp(left).resize(w, Math.round((w * 9) / 16), { fit: 'cover' }).png().toBuffer()
  const b = await sharp(right).resize(w, Math.round((w * 9) / 16), { fit: 'cover' }).png().toBuffer()
  const body = await sharp({ create: { width: W, height: Math.round((w * 9) / 16), channels: 3, background: '#0b0b0c' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: w + GAP, top: 0 }]).png().toBuffer()
  return [await sharp(label(text)).png().toBuffer(), body]
}

async function stack(name, parts) {
  const flat = parts.flat()
  const hs = []
  for (const p of flat) hs.push((await sharp(p).metadata()).height)
  const H = hs.reduce((a, b) => a + b + GAP, 0)
  let top = 0
  const comp = flat.map((input, i) => { const at = { input, left: 0, top }; top += hs[i] + GAP; return at })
  const whole = await sharp({ create: { width: W, height: H, channels: 3, background: '#0b0b0c' } }).composite(comp).png().toBuffer()
  const out = path.join(proof, `${name}.png`)
  await sharp(whole).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(out)
  const m = await sharp(out).metadata()
  console.log(name, m.width, m.height)
}

const KNEEL = { left: 615, top: 360, width: 510, height: 435 }
const JOBS = {
  'report-rise': async () => stack('report-rise', [await picture(path.join(refs, 'finish-poses.png'), 'approved: finish-poses.png'), await picture(path.join(proof, 'rise-40-60.png'), 'top row rise 40 degrees, bottom row 60 degrees: film size, three times, the fire pose at three times; camera straight down')]),
  'report-poses': async () => stack('report-poses', [await picture(path.join(proof, 'poses.png'), 'approved pose sheet above; below, the three poses seen at a right angle to the figure'), await picture(path.join(proof, 'poses-above.png'), 'the same three as the film sees them, straight down, at six times')]),
  'report-walk': async () => stack('report-walk', [
    await rows('walk', 'walk: every eighth frame, from 4 frames before the walk mark; 2.8 s', { left: 420, top: 396, width: 990, height: 390 }, 4, 2),
    await rows('knees', 'knees: from 2 frames before the kneel mark, every frame for twelve, then every second', KNEEL, 9)
  ]),
  'report-blow': async () => stack('report-blow', [
    await rows('fist', 'fist: from 2 frames before the fist mark, every frame for twelve, then every second', KNEEL, 9),
    await rows('blow', 'blow: from 12 frames before the press, every frame for twelve, then every second', KNEEL, 9)
  ]),
  'report-stills': async () => stack('report-stills', [
    await pair(path.join(refs, 'finish-charge.png'), path.join(shots, 'charge.png'), 'approved finish-charge.png | the charge, 1920 by 1080, twice the film size'),
    await pair(path.join(refs, 'finish-blast.png'), path.join(shots, 'blast.png'), 'approved finish-blast.png | the blast'),
    await pair(path.join(refs, 'finish-button-left.png'), path.join(shots, 'after.png'), 'approved finish-button-left.png | after the beam, on the first step')
  ]),
  'report-getup': async () => stack('report-getup', [
    await rows('getup', 'getting up under the charge: from 1 frame before the arms mark', { left: 750, top: 366, width: 420, height: 420 }, 12),
    await rows('fire', 'fire: from 2 frames before the fire mark', { left: 450, top: 396, width: 900, height: 360 }, 6),
    await rows('liedown', 'power-up: the burst, then lying down into the arrow: from 2 frames before the end of the power-up', { left: 750, top: 366, width: 420, height: 420 }, 12)
  ])
,
  'report-strips': async () => stack('report-strips', [
    await rows('fire', 'third pass. fire: from 2 frames before the fire mark, every frame for twelve, then every second', { left: 450, top: 396, width: 900, height: 360 }, 8),
    await rows('knees', 'knees: from 2 frames before the kneel mark, every frame for twelve, then every second', KNEEL, 12),
    await rows('blow', 'blow: from 12 frames before the press, every frame for twelve, then every second', KNEEL, 12)
  ]),
  'report-fist': async () => stack('report-fist', [
    await rows('fist', 'third pass, larger. fist: from 2 frames before the fist mark, every second frame of the strip', { left: 660, top: 380, width: 440, height: 380 }, 6, 2),
    await rows('blow', 'blow: from 12 frames before the press, every frame for twelve, then every second; the press is the 13th tile', { left: 660, top: 380, width: 440, height: 380 }, 6, 1, 18)
  ]),
  'report-four': async () => {
    const w = (W - GAP) / 2
    const h = Math.round((w * 9) / 16)
    const cut = { left: 480, top: 270, width: 960, height: 540 }
    const tiles = [
      await sharp(path.join(shots, 'pose-power-above.png')).resize(w, h, { fit: 'cover' }).png().toBuffer(),
      await sharp(path.join(shots, 'charge.png')).extract({ left: 0, top: 150, width: 960, height: 540 }).resize(w, h).png().toBuffer(),
      await sharp(path.join(shots, 'blast.png')).resize(w, h, { fit: 'cover' }).png().toBuffer(),
      await sharp(path.join(shots, 'blow-14.png')).extract(cut).resize(w, h).png().toBuffer()
    ]
    const body = await sharp({ create: { width: W, height: h * 2 + GAP, channels: 3, background: '#0b0b0c' } })
      .composite(tiles.map((input, i) => ({ input, left: (i % 2) * (w + GAP), top: Math.floor(i / 2) * (h + GAP) }))).png().toBuffer()
    return stack('report-four', [[await sharp(label('in my harness, not the real page: power-up | charge (cut in) / blast | the fist on Submit, 2 frames after the press')).png().toBuffer(), body]])
  }
}

const wanted = process.argv.slice(2)
for (const name of wanted.length ? wanted : Object.keys(JOBS)) await JOBS[name]()

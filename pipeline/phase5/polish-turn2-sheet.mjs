// node pipeline/phase5/polish-turn2-sheet.mjs BEFORE_DIR AFTER_DIR KIND FIRST OUT [CUT] [LEAN] [PAIRS] [FROM,TO[,EVERY]]
// Lays pictures of a page turn's first 16 frames side by side, the ones made before the change above and the ones made after it below.
// KIND is live (step-000NNN.png) or film (frame-000NNN-hd-draft.png), FIRST the number of the picture of the turn's first step: frame n of the turn is picture FIRST + n.
// OUT-edge.png: a cut at real size (CUT as x,y,w,h, by default the foot of the page at its left corner), frames 1 to 8 and 9 to 16.
// OUT-whole.png: the whole frames at half size, four to a row. OUT-whole-NN.png: frame NN alone at half size, for each NN of PAIRS.
// OUT-lean.png: frames 0 to 3 at three times (LEAN as x,y,w,h, by default the upper edge of the page).
// With FROM,TO only OUT-edge.png is made, of the frames FROM to TO, eight to a band; with EVERY, of every EVERY-th of them.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [beforeDir, afterDir, kind, firstArg, out, cutArg, leanArg, pairsArg, rangeArg] = process.argv.slice(2)
const first = Number(firstArg)
const box = (s, d) => {
  const [x, y, w, h] = (s && s !== '-' ? s : d).split(',').map(Number)
  return { left: x, top: y, width: w, height: h }
}
const cut = box(cutArg, '30,890,150,190')
const lean = box(leanArg, '900,0,100,30')
const pairs = pairsArg && pairsArg !== '-' ? pairsArg.split(',').map(Number) : []
const range = rangeArg ? rangeArg.split(',').map(Number) : null
const file = (dir, n) => path.join(dir, kind === 'film' ? `frame-${String(first + n).padStart(6, '0')}-hd-draft.png` : `step-${String(first + n).padStart(6, '0')}.png`)
const LABEL = 22
const INK = '#f2efe6'
const GROUND = { r: 58, g: 78, b: 120, alpha: 1 }

const words = (text, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${LABEL}"><text x="4" y="16" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="${INK}">${text}</text></svg>`)
const piece = (dir, n, region, scale, kernel) => {
  let img = sharp(file(dir, n))
  if (region) img = img.extract(region)
  if (scale !== 1) {
    const meta = region ?? { width: 1920, height: 1080 }
    img = img.resize(Math.round(meta.width * scale), Math.round(meta.height * scale), { kernel })
  }
  return img.png().toBuffer()
}

// Bands of frames: each band is a label row, the row made before and the row made after.
async function sheet(name, frames, perRow, region, scale, kernel, title) {
  const w = Math.round((region?.width ?? 1920) * scale)
  const h = Math.round((region?.height ?? 1080) * scale)
  const bands = []
  for (let i = 0; i < frames.length; i += perRow) bands.push(frames.slice(i, i + perRow))
  const width = perRow * w
  const height = LABEL + bands.length * (LABEL + 2 * h)
  const parts = [{ input: words(title, width), left: 0, top: 0 }]
  let y = LABEL
  for (const band of bands) {
    for (const [i, n] of band.entries()) {
      parts.push({ input: words(`frame ${n}`, w), left: i * w, top: y })
      parts.push({ input: await piece(beforeDir, n, region, scale, kernel), left: i * w, top: y + LABEL })
      parts.push({ input: await piece(afterDir, n, region, scale, kernel), left: i * w, top: y + LABEL + h })
    }
    y += LABEL + 2 * h
  }
  await sharp({ create: { width, height, channels: 4, background: GROUND } }).composite(parts).png().toFile(name)
  console.log(`${name}: ${width} by ${height}`)
}

fs.mkdirSync(path.dirname(out), { recursive: true })
const sixteen = Array.from({ length: 16 }, (_, i) => i + 1)
const where = (r) => `x ${r.left} to ${r.left + r.width}, y ${r.top} to ${r.top + r.height}`
if (range) {
  const every = range[2] ?? 1
  const frames = Array.from({ length: Math.floor((range[1] - range[0]) / every) + 1 }, (_, i) => range[0] + i * every)
  await sheet(`${out}-edge.png`, frames, 8, cut, 1, 'nearest', `${kind}, the turn's frames ${range[0]} to ${range[1]}${every > 1 ? `, every ${every}` : ''}, at real size (${where(cut)}): in each band before the change above, after it below`)
} else {
  await sheet(`${out}-edge.png`, sixteen, 8, cut, 1, 'nearest', `${kind}, the turn's frames 1 to 16 at real size (${where(cut)}): in each band before the change above, after it below`)
  await sheet(`${out}-whole.png`, sixteen, 4, null, 0.5, 'lanczos3', `${kind}, the turn's frames 1 to 16, whole at half size: in each band before the change above, after it below`)
  for (const n of pairs) await sheet(`${out}-whole-${String(n).padStart(2, '0')}.png`, [n], 1, null, 0.5, 'lanczos3', `${kind}, frame ${n} at half size: before above, after below`)
  await sheet(`${out}-lean.png`, [0, 1, 2, 3], 4, lean, 3, 'nearest', `${kind}, frames 0 to 3 at three times (${where(lean)}): before above, after below`)
}

// Reading, comparing and laying out pictures for the harness.
import sharp from 'sharp'

export async function rawOf(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

// How two pictures of one size differ: the number of pixels that differ, the largest difference of a channel, and the PSNR in dB.
export function difference(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { sameSize: false, pixels: a.width * a.height, largest: 255, psnr: 0 }
  let pixels = 0
  let largest = 0
  let sum = 0
  const n = a.width * a.height
  for (let i = 0; i < n; i++) {
    let hit = false
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(a.data[i * a.channels + c] - b.data[i * b.channels + c])
      if (d) {
        hit = true
        if (d > largest) largest = d
        sum += d * d
      }
    }
    if (hit) pixels++
  }
  const mse = sum / (n * 3)
  return { sameSize: true, pixels, largest, psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse) }
}

export const psnrText = (v) => (v === Infinity ? 'identical' : `${v.toFixed(2)} dB`)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// A strip of plain text as a picture, for labels on harness sheets.
export function label(text, width, height = 26, { size = 15, fill = '#ece7dd', ground = '#1b1b1d' } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${ground}"/><text x="8" y="${Math.round(height * 0.7)}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="${size}" fill="${fill}">${esc(text)}</text></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// Fits a picture inside a box without changing its shape, on a dark ground.
export async function fit(input, width, height) {
  return sharp(input).resize(width, height, { fit: 'contain', background: '#1b1b1d' }).png().toBuffer()
}

// A crop at native size, clamped to the picture, then set on a tile of a fixed size.
export async function cropTile(file, box, tileW, tileH) {
  const meta = await sharp(file).metadata()
  const w = Math.min(tileW, meta.width)
  const h = Math.min(tileH, meta.height)
  const cx = box[0] + box[2] / 2
  const cy = box[1] + box[3] / 2
  const left = Math.round(Math.min(Math.max(0, cx - w / 2), meta.width - w))
  const top = Math.round(Math.min(Math.max(0, cy - h / 2), meta.height - h))
  const cut = await sharp(file).extract({ left, top, width: w, height: h }).png().toBuffer()
  return sharp({ create: { width: tileW, height: tileH, channels: 3, background: '#1b1b1d' } }).composite([{ input: cut, left: Math.round((tileW - w) / 2), top: Math.round((tileH - h) / 2) }]).png().toBuffer()
}

// Lays tiles out as rows. Each row is a list of { input, width, height }.
export async function sheet(rows, file, { gap = 8, quality = 90, ground = '#1b1b1d' } = {}) {
  const width = Math.max(...rows.map((r) => r.reduce((s, t) => s + t.width, 0) + gap * (r.length - 1)))
  const height = rows.reduce((s, r) => s + Math.max(...r.map((t) => t.height)), 0) + gap * (rows.length - 1)
  const parts = []
  let y = 0
  for (const r of rows) {
    let x = 0
    for (const t of r) {
      parts.push({ input: t.input, left: x, top: y })
      x += t.width + gap
    }
    y += Math.max(...r.map((t) => t.height)) + gap
  }
  await sharp({ create: { width, height, channels: 3, background: ground } }).composite(parts).jpeg({ quality, chromaSubsampling: '4:4:4' }).toFile(file)
  return { width, height }
}

// The box round the cursor in page pixels, from what stillState reports of it.
export function cursorBox(cursor) {
  if (!cursor || !cursor.onPage) return null
  const h = cursor.screenHeightPx * 1.5
  return [cursor.x - h / 2, cursor.y - h / 2, h, h]
}

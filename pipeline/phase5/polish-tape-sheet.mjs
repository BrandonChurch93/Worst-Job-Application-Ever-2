// node pipeline/phase5/polish-tape-sheet.mjs MODE BEFORE_DIR AFTER_DIR KIND FIRST COUNT OUT
// Pictures of the careers page's tape made before the change and after it. KIND is live (step-000NNN.png) or film (frame-000NNN-hd-draft.png), FIRST the first picture's number, COUNT how many in a row.
// MODE strip: the inner end of the frost at the strip's right end (x 1420 to 1620, y 1006 to 1032) at three times, a row a frame, before at the left and after at the right.
// MODE turn: the part of the picture right of the page (x 1380 to 1920, 90 rows that follow the strip) at real size, two frames a row, before above and after below.
// MODE end: the strip's right end (x 1392 to 1792, y 990 to 1048) at three times, before above and after below, a pair a picture.
// MODE where: writes no picture. For every pair: how many pixels differ, how many by 8 or more of a channel, the box that holds them all, and the pixels themselves when there are 8 or fewer.
// MODE diff: writes no picture. For every pair: how many pixels differ in the whole picture, how many of them inside the strip's box at rest (x 128 to 1792, y 990 to 1048), the largest difference of a channel.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [mode, beforeDir, afterDir, kind, firstArg, countArg, out] = process.argv.slice(2)
const first = Number(firstArg)
const count = Number(countArg)
const file = (dir, n) => path.join(dir, kind === 'film' ? `frame-${String(n).padStart(6, '0')}-hd-draft.png` : `step-${String(n).padStart(6, '0')}.png`)
const raw = async (f) => (await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data
const LABEL = 20
const INK = '#f2efe6'
const GROUND = { r: 58, g: 78, b: 120, alpha: 1 }
const words = (text, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${LABEL}"><text x="4" y="15" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" fill="${INK}">${text}</text></svg>`)

if (mode === 'diff') {
  for (let n = first; n < first + count; n++) {
    const [a, b] = [await raw(file(beforeDir, n)), await raw(file(afterDir, n))]
    let all = 0
    let inside = 0
    let most = 0
    for (let i = 0; i < a.length; i += 3) {
      const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]))
      if (d === 0) continue
      all++
      most = Math.max(most, d)
      const p = i / 3
      const [x, y] = [p % 1920, Math.floor(p / 1920)]
      if (x >= 128 && x < 1792 && y >= 990 && y < 1048) inside++
    }
    console.log(`${n}: ${fs.readFileSync(file(beforeDir, n)).equals(fs.readFileSync(file(afterDir, n))) ? 'byte equal' : 'not equal'}, pixels that differ ${all}, of them in the strip's box at rest ${inside}, largest difference ${most}`)
  }
} else if (mode === 'where') {
  for (let n = first; n < first + count; n++) {
    const [p, q] = [await raw(file(beforeDir, n)), await raw(file(afterDir, n))]
    let [x0, x1, y0, y1, c, big] = [Infinity, -1, Infinity, -1, 0, 0]
    const list = []
    for (let i = 0; i < p.length; i += 3) {
      const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]))
      if (d === 0) continue
      const [x, y] = [(i / 3) % 1920, Math.floor(i / 3 / 1920)]
      c++
      if (d >= 8) big++
      ;[x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)]
      if (list.length < 8) list.push(`(${x},${y}) ${p[i]},${p[i + 1]},${p[i + 2]} to ${q[i]},${q[i + 1]},${q[i + 2]}`)
    }
    console.log(c === 0 ? `${n}: no pixel differs` : `${n}: ${c} differ, ${big} by 8 or more, box x ${x0} to ${x1}, y ${y0} to ${y1}${c <= 8 ? ': ' + list.join('; ') : ''}`)
  }
} else if (mode === 'strip') {
  const box = { left: 1420, top: 1006, width: 200, height: 26 }
  const [w, h] = [box.width * 3, box.height * 3]
  const parts = [{ input: words(`${kind}, pictures ${first} to ${first + count - 1}: x 1420 to 1620, y 1006 to 1032 at three times. Before at the left, after at the right`, 1200), left: 0, top: 0 }]
  for (let k = 0; k < count; k++) {
    for (const [j, dir] of [beforeDir, afterDir].entries()) {
      const tile = await sharp(file(dir, first + k)).extract(box).resize(w, h, { kernel: 'nearest' }).png().toBuffer()
      parts.push({ input: tile, left: j * w, top: LABEL + k * h })
    }
  }
  await sharp({ create: { width: 1200, height: LABEL + count * h, channels: 4, background: GROUND } }).composite(parts).png().toFile(out)
  console.log(`${out}: 1200 by ${LABEL + count * h}`)
} else if (mode === 'end') {
  const box = { left: 1392, top: 990, width: 400, height: 58 }
  const [w, h] = [box.width * 3, box.height * 3]
  const parts = [{ input: words(`${kind}, pictures ${first} to ${first + count - 1}: the strip's right end, x 1392 to 1792, y 990 to 1048 at three times. In each pair before above, after below`, 1200), left: 0, top: 0 }]
  for (let k = 0; k < count; k++) {
    const y0 = LABEL + k * (LABEL + 2 * h)
    parts.push({ input: words(`picture ${first + k}`, 1200), left: 0, top: y0 })
    for (const [j, dir] of [beforeDir, afterDir].entries()) {
      const tile = await sharp(file(dir, first + k)).extract(box).resize(w, h, { kernel: 'nearest' }).png().toBuffer()
      parts.push({ input: tile, left: 0, top: y0 + LABEL + j * h })
    }
  }
  await sharp({ create: { width: 1200, height: LABEL + count * (LABEL + 2 * h), channels: 4, background: GROUND } }).composite(parts).png().toFile(out)
  console.log(`${out}: 1200 by ${LABEL + count * (LABEL + 2 * h)}`)
} else {
  const H = 90
  const W = 540
  const rows = Math.ceil(count / 2)
  const parts = [{ input: words(`${kind}, pictures ${first} to ${first + count - 1}: x 1380 to 1920 at real size, the rows of the strip. In each pair before above, after below`, 2 * W), left: 0, top: 0 }]
  for (let k = 0; k < count; k++) {
    const a = await raw(file(afterDir, first + k))
    let y = 1079
    const lum = (yy) => Math.max(a[(yy * 1920 + 1500) * 3], a[(yy * 1920 + 1500) * 3 + 1], a[(yy * 1920 + 1500) * 3 + 2])
    while (y > 0 && lum(y) < 45) y--
    const top = Math.max(0, Math.min(1080 - H, y - 86))
    const [col, row] = [k % 2, Math.floor(k / 2)]
    const y0 = LABEL + row * (LABEL + 2 * H)
    parts.push({ input: words(`picture ${first + k}`, W), left: col * W, top: y0 })
    for (const [j, dir] of [beforeDir, afterDir].entries()) {
      const tile = await sharp(file(dir, first + k)).extract({ left: 1380, top, width: W, height: H }).png().toBuffer()
      parts.push({ input: tile, left: col * W, top: y0 + LABEL + j * H })
    }
  }
  await sharp({ create: { width: 2 * W, height: LABEL + rows * (LABEL + 2 * H), channels: 4, background: GROUND } }).composite(parts).png().toFile(out)
  console.log(`${out}: ${2 * W} by ${LABEL + rows * (LABEL + 2 * H)}`)
}

// Polish date: lays the pictures of one sixtieth, each with one thing off, on one sheet, a fixed window of each, named by what is off.
// node pipeline/phase5/polish-date-offs.mjs OUT DIR COLS ZOOM X Y W H NAME...
import path from 'node:path'
import sharp from 'sharp'

const [, , out, dir, cols, zoom, x, y, w, h, ...names] = process.argv
const C = Number(cols)
const Z = Number(zoom)
const tw = Math.round(Number(w) * Z)
const th = Math.round(Number(h) * Z)
const bar = 16
const layers = []
const marks = []
for (let n = 0; n < names.length; n++) {
  let tile = sharp(path.join(dir, `${names[n]}.png`)).extract({ left: Number(x), top: Number(y), width: Number(w), height: Number(h) })
  if (Z !== 1) tile = tile.resize(tw, th)
  const left = (n % C) * (tw + 2)
  const top = Math.floor(n / C) * (th + bar)
  layers.push({ input: await tile.png().toBuffer(), left, top })
  marks.push(`<text x="${left + 3}" y="${top + th + 12}" font-family="sans-serif" font-size="11" fill="#fff">off: ${names[n]}</text>`)
}
const W = C * (tw + 2)
const H = Math.ceil(names.length / C) * (th + bar)
await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } }).composite([...layers, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${marks.join('')}</svg>`), left: 0, top: 0 }]).png().toFile(out)
console.log(out, W, H)

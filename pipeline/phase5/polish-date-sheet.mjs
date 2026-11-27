// Polish date: lays kept pictures in a row on one sheet, a fixed window of each, one block for each source.
// node pipeline/phase5/polish-date-sheet.mjs OUT COLS ZOOM X Y W H SOURCE...
// SOURCE is TITLE|DIR|PREFIX|FIRST|COUNT|KIND: the files DIR/PREFIX<n>.png from n = FIRST on; KIND live numbers them from 000 and names each by its time from the press, KIND film names each by its film frame, KIND shut names each by its count before the tray is shut (picture 29 of a shutting is the shut one).
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [, , out, cols, zoom, x, y, w, h, ...sources] = process.argv
const C = Number(cols)
const Z = Number(zoom)
const tw = Math.round(Number(w) * Z)
const th = Math.round(Number(h) * Z)
const bar = 14
const head = 18
const layers = []
const marks = []
let top = 0
for (const source of sources) {
  const [title, dir, prefix, first, count, kind] = source.split('|')
  marks.push(`<text x="4" y="${top + 13}" font-family="sans-serif" font-size="12" fill="#fff">${title}</text>`)
  top += head
  let n = 0
  for (let k = Number(first); k < Number(first) + Number(count); k++, n++) {
    const file = path.join(dir, `${prefix}${kind === 'film' ? k : String(k).padStart(3, '0')}.png`)
    if (!fs.existsSync(file)) throw new Error(`No picture ${file}`)
    let tile = sharp(file).extract({ left: Number(x), top: Number(y), width: Number(w), height: Number(h) })
    if (Z !== 1) tile = tile.resize(tw, th)
    const left = (n % C) * (tw + 2)
    const down = top + Math.floor(n / C) * (th + bar)
    layers.push({ input: await tile.png().toBuffer(), left, top: down })
    marks.push(`<text x="${left + 3}" y="${down + th + 11}" font-family="sans-serif" font-size="10" fill="#ddd">${kind === 'live' ? `${((k - 2) / 60).toFixed(3)} s from the press` : kind === 'shut' ? `${29 - k} sixtieths before the tray is shut` : `film frame ${k}`}</text>`)
  }
  top += Math.ceil(n / C) * (th + bar) + 2
}
const W = C * (tw + 2)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${top}">${marks.join('')}</svg>`
await sharp({ create: { width: W, height: top, channels: 3, background: '#18181b' } }).composite([...layers, { input: Buffer.from(svg), left: 0, top: 0 }]).png().toFile(out)
console.log(out, W, top)

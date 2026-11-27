import sharp from 'sharp'
const D = 'out/work/polish-date'
const W = 598, H = 250
const tiles = [
  ['Slot housed, level high, 0.133 s from the press (the rise starts at 0.167 s)', `/tmp/wt-B/${D}/B-2/row2-010.png`, 1004, 543],
  ['Slot housed, level low, 0.133 s', `${D}/shut-2-low/row2-010.png`, 1004, 543],
  ['Crank housed, level high, 0.133 s', `${D}/after-3/row3-010.png`, 1004, 692],
  ['Crank housed, level low, 0.133 s', `${D}/shut-3-low/row3-010.png`, 1004, 692],
]
const layers = []
const marks = []
for (let i = 0; i < tiles.length; i++) {
  const [text, file, x, y] = tiles[i]
  const left = (i % 2) * (W + 4), top = 18 + Math.floor(i / 2) * (H + 18)
  layers.push({ input: await sharp(file).extract({ left: x, top: y, width: W, height: H }).png().toBuffer(), left, top })
  marks.push(`<text x="${left + 3}" y="${top + H + 13}" font-family="sans-serif" font-size="11" fill="#ddd">${text}</text>`)
}
const TW = 2 * (W + 4) - 4, TH = 18 + 2 * (H + 18)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}"><text x="4" y="13" font-family="sans-serif" font-size="12" fill="#fff">HOUSED 0.022 (6c9bfdad), live site, 1920x1080, real size, no scaling: window x 1004 to 1602 of each tray, its full height</text>${marks.join('')}</svg>`
await sharp({ create: { width: TW, height: TH, channels: 3, background: '#18181b' } }).composite([...layers, { input: Buffer.from(svg), left: 0, top: 0 }]).png().toFile(`${D}/housed-crops.png`)
console.log(TW, TH)

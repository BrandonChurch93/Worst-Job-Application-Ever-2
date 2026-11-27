import sharp from 'sharp'
const [, , out, zoom, x, y, w, h, ...files] = process.argv
const Z = +zoom, W = +w * Z, H = +h * Z
const tiles = await Promise.all(files.map((f) => sharp(f).extract({ left: +x, top: +y, width: +w, height: +h }).resize(W, H, { kernel: 'nearest' }).png().toBuffer()))
const cols = Math.min(files.length, Number(process.env.COLS || 2))
const rowsN = Math.ceil(files.length / cols)
await sharp({ create: { width: cols * (W + 6), height: rowsN * (H + 6), channels: 3, background: '#ff00ff' } }).composite(tiles.map((input, i) => ({ input, left: (i % cols) * (W + 6), top: Math.floor(i / cols) * (H + 6) }))).png().toFile(out)

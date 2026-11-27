// A mock of a machine at another size, made from a picture of the page: the round patch of the picture that holds the machine is drawn again, larger, over the same middle, and the two pictures are set side by side.
// node pipeline/change002/step2-mock.mjs <picture.png> <out.jpg> [--cx 960 --cy 684 --r 150 --by 1.5 --cut x,y,w,h]
// cx, cy, r and the cut are in px of the picture. It is a mock: the tray is not made larger, the light is not worked out again.
import sharp from 'sharp'
import { args } from '../../tools/lib/paths.mjs'

const a = args()
const [src, out] = process.argv.slice(2)
const cx = Number(a.cx ?? 960)
const cy = Number(a.cy ?? 684)
const r = Number(a.r ?? 150)
const by = Number(a.by ?? 1.5)
const cut = String(a.cut ?? '464,300,992,640').split(',').map(Number)
const big = Math.round(2 * r * by)
const patch = await sharp(src).extract({ left: Math.round(cx - r), top: Math.round(cy - r), width: 2 * r, height: 2 * r }).resize(big, big, { kernel: 'lanczos3' }).png().toBuffer()
const mask = Buffer.from(`<svg width="${big}" height="${big}"><defs><radialGradient id="g"><stop offset="0.86" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="${big / 2}" cy="${big / 2}" r="${big / 2}" fill="url(#g)"/></svg>`)
const round = await sharp(patch).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
const mock = await sharp(src).composite([{ input: round, left: Math.round(cx - big / 2), top: Math.round(cy - big / 2) }]).png().toBuffer()
const box = { left: cut[0], top: cut[1], width: cut[2], height: cut[3] }
const left = await sharp(src).extract(box).png().toBuffer()
const right = await sharp(mock).extract(box).png().toBuffer()
const gap = 16
await sharp({ create: { width: box.width * 2 + gap, height: box.height, channels: 3, background: '#1b1b1d' } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: box.width + gap, top: 0 }]).resize({ width: 1200 }).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(out)
console.log(`wrote ${out}: as built on the left, the patch of radius ${r} px drawn ${by} times larger on the right`)

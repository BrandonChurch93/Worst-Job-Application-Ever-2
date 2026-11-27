// Polish date: where two pictures differ, drawn red on the first, enlarged.
// node pipeline/phase5/polish-date-diffmap.mjs OUT ZOOM X Y W H A B
import sharp from 'sharp'
const [, , out, zoom, x, y, w, h, A, B] = process.argv
const box = { left: +x, top: +y, width: +w, height: +h }
const a = await sharp(A).removeAlpha().extract(box).raw().toBuffer()
const b = await sharp(B).removeAlpha().extract(box).raw().toBuffer()
const o = Buffer.from(a)
let n = 0
for (let i = 0; i < a.length; i += 3) {
  const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]))
  if (d > 0) { n++; o[i] = 255; o[i + 1] = d > 16 ? 0 : 160; o[i + 2] = 0 }
}
await sharp(o, { raw: { width: +w, height: +h, channels: 3 } }).resize(+w * +zoom, +h * +zoom, { kernel: 'nearest' }).png().toFile(out)
console.log(n)

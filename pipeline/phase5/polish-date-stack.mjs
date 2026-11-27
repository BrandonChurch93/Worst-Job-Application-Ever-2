// Polish date: lays whole pictures one under the other on one sheet, left edges in line.
// node pipeline/phase5/polish-date-stack.mjs OUT FILE...
import sharp from 'sharp'
const [, , out, ...files] = process.argv
const metas = await Promise.all(files.map((f) => sharp(f).metadata()))
const width = Math.max(...metas.map((m) => m.width))
let top = 0
const parts = files.map((input, i) => {
  const at = { input, left: 0, top }
  top += metas[i].height + 6
  return at
})
await sharp({ create: { width, height: top - 6, channels: 3, background: '#101010' } }).composite(parts).png().toFile(out)
console.log(out, width, top - 6)

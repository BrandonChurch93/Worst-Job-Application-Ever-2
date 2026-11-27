// Stacks sheets cut by polish-save-sheet.mjs one above the other, in the order given, and says the size of the whole.
// node pipeline/phase5/polish-save2-pair.mjs --out /tmp/pair.png /tmp/before.png /tmp/after.png
import sharp from 'sharp'

const at = process.argv.indexOf('--out')
const out = at < 0 ? '/tmp/polish-save2-pair.png' : process.argv[at + 1]
const files = process.argv.slice(2).filter((f, i) => i + 2 !== at && i + 2 !== at + 1)
const sizes = []
for (const f of files) sizes.push(await sharp(f).metadata())
const width = Math.max(...sizes.map((m) => m.width))
let top = 0
const parts = []
files.forEach((input, i) => {
  parts.push({ input, left: 0, top })
  top += sizes[i].height + 6
})
await sharp({ create: { width, height: top - 6, channels: 3, background: '#111' } }).composite(parts).png().toFile(out)
console.log(`wrote ${out}: ${width} by ${top - 6} px`)

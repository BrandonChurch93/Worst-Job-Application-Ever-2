// Puts a sweep of the model under the approved sheet it answers, at the same width.
import sharp from 'sharp'
const pairs = { acting: ['references/approved/cursor-acting.png', { left: 0, top: 150, width: 1920, height: 700 }], harm: ['references/approved/cursor-damage.png', { left: 0, top: 120, width: 1920, height: 760 }] }
const set = process.argv[2] ?? 'acting'
const wide = Number(process.argv[3] ?? 1200)
const [approved, box] = pairs[set]
const top = await sharp(approved).extract(box).resize(wide).toBuffer()
const mine = await sharp(`out/work/cursor-model/sweep-${set}.png`).extract({ left: 0, top: 190, width: 1920, height: 700 }).resize(wide).toBuffer()
const a = await sharp(top).metadata()
const b = await sharp(mine).metadata()
const out = `out/work/cursor-model/beside-${set}.jpg`
await sharp({ create: { width: wide, height: a.height + b.height + 6, channels: 3, background: { r: 30, g: 30, b: 32 } } })
  .composite([{ input: top, left: 0, top: 0 }, { input: mine, left: 0, top: a.height + 6 }])
  .jpeg({ quality: 90 })
  .toFile(out)
console.log(`beside: ${out} (approved above, this build below)`)

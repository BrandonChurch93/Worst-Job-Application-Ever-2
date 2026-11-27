// node pipeline/phase5/pack-frames-gap.mjs DIR PX STEP [STEP ...]: on whole pictures of the run kept in DIR (as the pack's cache or pack-frames-look.mjs name them),
// the height in px of the page of the dark gap over the page's upper edge, read down the column COLUMN from the picture's top.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

// The column of the page (px of the 1920 wide page) down which the gap is read, clear of the header's type and of the step row.
const COLUMN = 1400
// A pixel darker than this (mean of red, green and blue, 0 to 255) is the dark behind the page.
const DARK = 40

const [dir, px, ...steps] = process.argv.slice(2)
const k = Number(px)
const names = fs.readdirSync(dir)
for (const s of steps) {
  const tag = String(s).padStart(6, '0')
  const name = names.find((n) => n.includes(tag) && n.endsWith('.png') && (n.includes(`-x${k}`) || k === 1))
  if (!name) {
    console.log(`step ${s}: no picture`)
    continue
  }
  const m = await sharp(path.join(dir, name)).metadata()
  const { data, info } = await sharp(path.join(dir, name)).extract({ left: Math.round((COLUMN * m.width) / 1920), top: 0, width: 1, height: m.height }).raw().toBuffer({ resolveWithObject: true })
  let gap = 0
  while (gap < info.height && (data[gap * info.channels] + data[gap * info.channels + 1] + data[gap * info.channels + 2]) / 3 < DARK) gap++
  console.log(`step ${s}: gap ${Math.round((gap * 1920) / m.width)} px (${name})`)
}

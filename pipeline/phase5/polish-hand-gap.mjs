// Reads the seat from pictures of 1920 by 1080, a row a frame: the height of the dark backing over the slab's upper, free edge (px, down a strip of columns left of the middle),
// and how many px higher than in the last picture given three things stand: the printed title (the page's head), the rule with the step row (loose things, which hop), the button at the page's foot.
// Each is the shift up or down, of 20 px at most, at which its window fits the last picture best. Where the slab stands tilted (a gap at the free edge) no shift is given.
// node pipeline/phase5/polish-hand-gap.mjs DIR FIRST LAST [CONTACT]
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [, , dir, first, last, contact = first] = process.argv
const STRIP = { gap: [600, 700], dark: 90, reach: 20 }
const WINDOWS = { title: [120, 60, 840, 125], rule: [1000, 150, 1800, 180], foot: [1560, 720, 1820, 830] }
const files = fs.readdirSync(dir).filter((n) => n.endsWith('.png'))
const fileOf = (i) => path.join(dir, files.find((n) => Number((n.match(/(\d{4,})/) || [])[1]) === i) || 'none')
const grey = async (i) => {
  const { data, info } = await sharp(fileOf(i)).greyscale().raw().toBuffer({ resolveWithObject: true })
  if (info.width !== 1920 || info.height !== 1080) throw new Error(`${fileOf(i)} is not 1920 by 1080`)
  return (x, y) => data[(y * info.width + x) * info.channels]
}

const frames = []
for (let i = Number(first); i <= Number(last); i++) if (fs.existsSync(fileOf(i))) frames.push(i)
const rest = await grey(frames[frames.length - 1])
const up = (at, [x0, y0, x1, y1]) => {
  let best = { e: Infinity, s: 0 }
  for (let s = -STRIP.reach; s <= STRIP.reach; s++) {
    let e = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x += 2) e += (at(x, y + s) - rest(x, y)) ** 2
    if (e < best.e) best = { e, s }
  }
  return -best.s
}
console.log('frame  from the contact  gap at the free edge  title up  rule and row up  foot up')
for (const i of frames) {
  const at = await grey(i)
  let gap = 0
  const mean = (y) => { let s = 0; for (let x = STRIP.gap[0]; x < STRIP.gap[1]; x++) s += at(x, y); return s / (STRIP.gap[1] - STRIP.gap[0]) }
  while (gap < 400 && mean(gap) < STRIP.dark) gap++
  const shift = (w) => (gap > 0 ? 'tilted' : String(up(at, w)))
  console.log(`${String(i).padStart(5)}  ${String(i - Number(contact)).padStart(16)}  ${String(gap).padStart(20)}  ${shift(WINDOWS.title).padStart(8)}  ${shift(WINDOWS.rule).padStart(15)}  ${shift(WINDOWS.foot).padStart(7)}`)
}

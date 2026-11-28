// node pipeline/change002/careers-differences.mjs
// Crops of the places where the careers page differs from the approved picture on purpose, mine left and the picture right,
// from the pictures the two other commands have drawn: out/work/careers/careers-page.png and careers-top.png.
import fs from 'node:fs'
import sharp from 'sharp'
import { at } from '../../tools/lib/paths.mjs'

const OUT = at('out', 'work', 'careers')
const GAP = 6
const WIDE = 597
const GROUND = '#d81b60'
const page = { mine: `${OUT}/careers-page.png`, theirs: at('references', 'approved-002', 'careers-page.png') }
const top = { mine: `${OUT}/careers-top.png`, theirs: at('references', 'approved-002', 'careers-top.png') }
const MORE = 9

const crops = [
  { name: 'type-headline', from: top, box: [300, 150, 1320, 320], what: 'typeface and scale of the headline, the pill in deeper orange type' },
  { name: 'cursor-button', from: top, box: [560, 440, 800, 230], what: 'the build\'s own arrow, the Apply button in the deeper orange' },
  { name: 'glow', from: top, box: [0, 90, 1920, 860], what: 'one glow behind the hero' },
  { name: 'awards', from: top, box: [180, 790, 1560, 210], what: 'awards with their fine print, simpler wreaths' },
  { name: 'navigation', from: top, box: [1080, 0, 840, 100], what: 'the navigation and its button' },
  { name: 'benefits-heading', from: page, box: [300, 1090, 1320, 250], what: 'kicker pill and section heading' },
  { name: 'cards', from: page, box: [190, 1340, 1540, 400], theirs: [190, 1340, 1540, 400], what: 'cards 27 px taller for three lines of small print at 24 px, no star before it' },
  { name: 'quotes', from: page, box: [300, 2234, 1320, 430], theirs: [300, 2180, 1320, 430], what: 'three quotes in one row, no quotation marks, notes in deeper orange' },
  { name: 'table', from: page, box: [300, 3700, 1320, 420], shift: MORE, what: 'the middle column\'s words in deeper orange' },
  { name: 'steps', from: page, box: [300, 4409, 1320, 400], theirs: [300, 4400, 1320, 400], what: 'step discs in the deeper orange, titles 24' },
  { name: 'closing', from: page, box: [400, 5225, 1120, 300], shift: MORE, what: 'the closing call' }
]

for (const need of [page.mine, top.mine]) if (!fs.existsSync(need)) throw new Error(`${need} is not there. Run careers-page.mjs and careers-proof.mjs --only top first`)
for (const c of crops) {
  const [x, y, w, h] = c.box
  const t = c.theirs ?? [x, y - (c.shift ?? 0), w, h]
  const mine = await sharp(c.from.mine).extract({ left: x, top: y, width: w, height: h }).resize({ width: WIDE }).png().toBuffer()
  const theirs = await sharp(c.from.theirs).extract({ left: t[0], top: t[1], width: t[2], height: t[3] }).resize({ width: WIDE }).png().toBuffer()
  const a = await sharp(mine).metadata()
  const b = await sharp(theirs).metadata()
  const file = `${OUT}/careers-differs-${c.name}.jpg`
  await sharp({ create: { width: WIDE * 2 + GAP, height: Math.max(a.height, b.height), channels: 3, background: GROUND } })
    .composite([{ input: mine, left: 0, top: 0 }, { input: theirs, left: WIDE + GAP, top: 0 }])
    .jpeg({ quality: 90 })
    .toFile(file)
  console.log(`${file}: ${c.what}`)
}

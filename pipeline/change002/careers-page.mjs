// node pipeline/change002/careers-page.mjs [--tier draft]
// Draws the whole careers page as one tall picture, 1920 wide, and lays it beside references/approved-002/careers-page.png:
// once whole, and once for each section, so that the two are judged section by section. Everything goes to out/work/careers/.
import fs from 'node:fs'
import sharp from 'sharp'
import { args, at } from '../../tools/lib/paths.mjs'
import { drawStill, openSession } from '../../tools/lib/capture.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const tier = a.tier || 'draft'
const APPROVED = at('references', 'approved-002', 'careers-page.png')
const OUT = at('out', 'work', 'careers')
const LONG = 1200
const GAP = 12

const site = await logic()
const { careersLayout } = await site.load('/src/pages/marketing/layout.ts')
const { height, sections } = careersLayout()
await site.close()

const tiles = []
const counts = []
const room = height - 1080
const specs = []
for (let top = 0; top < height; top += 1080) {
  const y = Math.min(top, room)
  specs.push({ y, spec: { page: 'marketing', camera: 'home', tier, scroll: y / room } })
}
let session = await openSession({ format: 'hd', assets: a.assets || 'full' })
try {
  for (const { y, spec } of specs) {
    const { png } = await drawStill(session, spec)
    tiles.push({ input: png, left: 0, top: y })
  }
} finally {
  await session.close()
}
for (const { y, spec } of specs) {
  session = await openSession({ format: 'hd', assets: a.assets || 'full' })
  try {
    const told = await session.page.evaluate((x) => window.showcase.countParts(x), spec)
    counts.push(`scrolled ${Math.round(y)} px: ${Math.round(told.renderer.triangles)} triangles, ${told.renderer.drawCalls} draw calls`)
  } catch (e) {
    counts.push(`scrolled ${Math.round(y)} px: not counted (${String(e.message).split('\n')[0]})`)
  } finally {
    await session.close()
  }
}
fs.mkdirSync(OUT, { recursive: true })
const whole = await sharp({ create: { width: 1920, height: Math.round(height), channels: 3, background: '#ff00ff' } }).composite(tiles).png().toBuffer()
fs.writeFileSync(`${OUT}/careers-page.png`, whole)

const approved = await sharp(APPROVED).metadata()
const beside = async (name, mine, theirs) => {
  const tall = Math.max(mine.h, theirs.h)
  const w = Math.min(Math.floor((LONG - GAP) / 2), Math.floor((1920 * LONG) / tall))
  const left = await sharp(whole).extract({ left: 0, top: Math.round(mine.y), width: 1920, height: Math.round(mine.h) }).resize({ width: w }).toBuffer()
  const right = await sharp(APPROVED).extract({ left: 0, top: Math.round(theirs.y), width: 1920, height: Math.round(theirs.h) }).resize({ width: w }).toBuffer()
  const file = `${OUT}/${name}.jpg`
  const rows = await Promise.all([left, right].map(async (b) => (await sharp(b).metadata()).height))
  await sharp({ create: { width: w * 2 + GAP, height: Math.max(...rows), channels: 3, background: '#d81b60' } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: w + GAP, top: 0 }]).jpeg({ quality: 88 }).toFile(file)
  return file
}

// The build holds six staff quotes in two rows where the picture holds three in one, so every section after them lies lower by the same amount.
const lower = height - approved.height
const names = Object.keys(sections)
const made = [await beside('careers-page-beside', { y: 0, h: height }, { y: 0, h: approved.height })]
for (let i = 0; i < names.length; i++) {
  const y = sections[names[i]]
  const end = i + 1 < names.length ? sections[names[i + 1]] : height
  const after = names.indexOf('testimonials')
  const theirY = i > after ? y - lower : y
  const theirEnd = i + 1 < names.length ? (i + 1 > after ? end - lower : end) : approved.height
  made.push(await beside(`careers-section-${i + 1}-${names[i]}`, { y, h: end - y }, { y: theirY, h: theirEnd - theirY }))
}
console.log(`the build: ${OUT}/careers-page.png, 1920 by ${Math.round(height)}; the approved picture: 1920 by ${approved.height}`)
console.log(`left the build, right the approved picture:\n- ${made.join('\n- ')}`)
console.log(`what one frame costs, by the renderer's own count:\n- ${counts.join('\n- ')}`)

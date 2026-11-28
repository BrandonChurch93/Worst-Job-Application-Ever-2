// node pipeline/change002/step1-continue.mjs <name>: the live site, a real mouse walked through step 1 by the page's own hint, then moved over and round Continue with no press; every frame of 60 is kept, cut to the button, and laid in rows.
import fs from 'node:fs'
import sharp from 'sharp'
import { at } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const name = process.argv[2] ?? 'now'
const GO = { x: 1585, y: 743, w: 202, h: 72, cx: 1686, cy: 779 }
const CUT = { left: 1400, top: 640, width: 500, height: 280 }
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: '&clock=steps&step=1' })
const page = session.page
const hand = { x: 960, y: 540, down: false }
const walk = async (x, y, most) => {
  const d = Math.hypot(x - hand.x, y - hand.y)
  const k = d <= most ? 1 : most / d
  hand.x += (x - hand.x) * k
  hand.y += (y - hand.y) * k
  await page.mouse.move(hand.x, hand.y)
}
const press = async (down) => {
  if (down === hand.down) return
  hand.down = down
  if (down) await page.mouse.down()
  else await page.mouse.up()
}
let told = await page.evaluate(() => window.liveRun.told())
let ready = 0
let frames = 0
while (frames < 60 * 150 && ready < 30) {
  const h = told.hint
  if (h) {
    await walk(h.x, h.y - told.scroll, 2600 / 60)
    await press(Boolean(h.down) && Math.hypot(h.x - hand.x, h.y - told.scroll - hand.y) <= 22 && !(Math.abs(h.x - GO.cx) < 2 && Math.abs(h.y - GO.cy) < 2))
    ready = told.page === 'step1' && Math.abs(h.x - GO.cx) < 2 && Math.abs(h.y - GO.cy) < 2 ? ready + 1 : 0
  }
  await page.evaluate(() => window.liveRun.advance(1 / 60, true))
  told = await page.evaluate(() => window.liveRun.told())
  frames++
  if (told.page !== 'step1') break
}
if (ready < 30) {
  console.log(`step1-continue: Continue was not reached in ${frames} frames, the page is ${told.page}, the gag ${told.gag}`)
  await session.close()
  process.exit(1)
}
console.log(`step1-continue: Continue is offered at ${told.time.toFixed(2)} s of the visit, after ${frames} frames`)
await press(false)
const path = []
for (let i = 0; i <= 24; i++) path.push([GO.x - 150 + (i / 24) * (GO.w + 300), GO.cy - 6])
for (let i = 0; i <= 36; i++) {
  const a = Math.PI * 2 * (i / 36)
  path.push([GO.cx + Math.cos(a) * (GO.w / 2 + 14), GO.cy + Math.sin(a) * (GO.h / 2 + 14)])
}
for (let i = 0; i <= 23; i++) {
  const a = Math.PI * 2 * (i / 24)
  path.push([GO.cx + Math.cos(a) * (GO.w / 2 - 30) * (1 - i / 30), GO.cy + Math.sin(a) * (GO.h / 2 - 12) * (1 - i / 30)])
}
const tiles = []
const rows = []
for (let i = 0; i < path.length; i++) {
  await walk(path[i][0], path[i][1], 1e9)
  const s = await page.evaluate(() => window.liveRun.advance(1 / 60))
  const t = await page.evaluate(() => window.liveRun.told())
  rows.push({ frame: i, mouse: [Math.round(path[i][0]), Math.round(path[i][1])], hero: [Math.round(t.hero.x * 10) / 10, Math.round(t.hero.y * 10) / 10], page: t.page })
  tiles.push(await sharp(Buffer.from(s.png.split(',')[1], 'base64')).extract(CUT).resize(250, 140).png().toBuffer())
}
const columns = 12
const lines = Math.ceil(tiles.length / columns)
const sheet = sharp({ create: { width: columns * 252, height: lines * 142, channels: 3, background: '#17181a' } }).composite(tiles.map((input, i) => ({ input, left: (i % columns) * 252 + 1, top: Math.floor(i / columns) * 142 + 1 })))
fs.mkdirSync(at('out', 'work'), { recursive: true })
const file = at('out', 'work', `step1-continue-${name}.jpg`)
await sheet.jpeg({ quality: 88 }).toFile(file)
fs.writeFileSync(at('out', 'work', `step1-continue-${name}.json`), JSON.stringify(rows))
console.log(`step1-continue: wrote ${file}, ${tiles.length} frames in a row, ${columns} a line, each ${CUT.width} by ${CUT.height} page px round Continue`)
await session.close()

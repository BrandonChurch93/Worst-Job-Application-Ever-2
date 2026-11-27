// node pipeline/change002/step1-live.mjs <name>: [px a second] [frames of rest before a press]: the live site, a real mouse walked slowly through the Name and the Email of step 1 by the page's own hint, never dodging; a frame every 0.2 s of the Name and every 1/15 s from the Enter of the Email, in rows
import fs from 'node:fs'
import sharp from 'sharp'
import { at } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const name = process.argv[2] ?? 'now'
const CUT = { left: 100, top: 380, width: 1720, height: 700 }
const TILE = { w: 298, h: 121 }
const SPEED = Number(process.argv[3] ?? 600)
const DWELL = Number(process.argv[4] ?? 14)
const ENTER = { x0: 1440, x1: 1610, y0: 865, y1: 930 }
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
let presses = 0
let enters = 0
const press = async (down, onEnter) => {
  if (down === hand.down) return
  hand.down = down
  if (down) {
    presses++
    if (onEnter) enters++
    await page.mouse.down()
  } else await page.mouse.up()
}
let told = await page.evaluate(() => window.liveRun.told())
const shots = []
const reached = {}
let frames = 0
let dense = -1
let dwell = 0
let end = -1
while (frames < 60 * 120) {
  const h = told.hint
  if (h) {
    await walk(h.x, h.y - told.scroll, SPEED / 60)
    const onEnter = h.x > ENTER.x0 && h.x < ENTER.x1 && h.y > ENTER.y0 && h.y < ENTER.y1
    const there = Math.hypot(h.x - hand.x, h.y - told.scroll - hand.y) <= 22
    dwell = there ? dwell + 1 : 0
    await press(Boolean(h.down) && there && dwell > DWELL, onEnter)
    if (dense < 0 && enters >= 2) dense = frames
  }
  const shoot = dense >= 0 ? (frames - dense) % 4 === 0 && frames - dense < 136 : enters === 0 && presses > 0 && frames % 12 === 0
  const s = await page.evaluate((quiet) => window.liveRun.advance(1 / 60, quiet), !shoot)
  told = await page.evaluate(() => window.liveRun.told())
  frames++
  for (const g of told.gags) reached[g] ??= told.time
  if (shoot) shots.push({ time: told.time, dense: dense >= 0, hero: told.hero, hits: told.hits.length, png: await sharp(Buffer.from(s.png.split(',')[1], 'base64')).extract(CUT).resize(TILE.w * 2, TILE.h * 2).jpeg({ quality: 90 }).toBuffer() })
  if (end < 0 && dense >= 0) end = dense + 140
  if (end >= 0 && frames >= end) break
  if (told.page !== 'step1') break
}
await session.close()
console.log(`step1-live: ${frames} frames, ${presses} presses, ${enters} on Enter, dense from frame ${dense}, gags ${JSON.stringify(reached)}, hits on the arrow ${shots.at(-1)?.hits ?? 0}`)
const label = (text) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="74" height="22"><rect width="74" height="22" rx="4" fill="#17181a"/><text x="37" y="16" font-family="sans-serif" font-size="13" fill="#ffffff" text-anchor="middle">${text}</text></svg>`)
const sheet = async (file, list, columns) => {
  if (!list.length) return console.log(`step1-live: no frame for ${file}`)
  const lines = Math.ceil(list.length / columns)
  const tiles = []
  for (const [i, s] of list.entries()) {
    const left = (i % columns) * (TILE.w + 2) + 1
    const top = Math.floor(i / columns) * (TILE.h + 2) + 1
    tiles.push({ input: await sharp(s.png).resize(TILE.w, TILE.h).png().toBuffer(), left, top })
    tiles.push({ input: label(`${s.time.toFixed(2)} s`), left: left + 3, top: top + 3 })
  }
  await sharp({ create: { width: columns * (TILE.w + 2), height: lines * (TILE.h + 2), channels: 3, background: '#17181a' } }).composite(tiles).jpeg({ quality: 88 }).toFile(file)
  console.log(`step1-live: wrote ${file}, ${list.length} frames, ${columns * (TILE.w + 2)} by ${lines * (TILE.h + 2)}`)
}
fs.mkdirSync(at('out', 'work'), { recursive: true })
const t0 = reached['step1.keyboard'] ?? 0
const sparse = shots.filter((s) => !s.dense)
await sheet(at('out', 'work', `step1-live-${name}-blasts.jpg`), sparse.slice(0, 48), 4)
await sheet(at('out', 'work', `step1-live-${name}-slabs.jpg`), shots.filter((s) => s.dense), 4)
fs.writeFileSync(at('out', 'work', `step1-live-${name}.json`), JSON.stringify({ reached, presses, enters, dense, frames, shots: shots.map((s) => ({ time: s.time, dense: s.dense, hero: s.hero, hits: s.hits })) }))

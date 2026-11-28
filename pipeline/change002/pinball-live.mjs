// node pipeline/change002/pinball-live.mjs [--bot B | --hand X,Y,VX,VY,S] [--seed N] [--from S] [--to S] [--every S] [--name N] [--columns C]: a sheet of the live site on step 3 with a bot's hand, a picture every so many seconds of the page. With --hand a real mouse starts at X,Y of the page and moves VX,VY px a second from S seconds on.
import path from 'node:path'
import { args, at, config } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'
import { composeSheet } from '../../tools/lib/film-sheet.mjs'

const a = args()
const cfg = config()
const hand = a.hand ? String(a.hand).split(',').map(Number) : null
const bot = hand ? 'hand' : String(a.bot ?? 'keen')
const seed = Number(a.seed ?? cfg.seed)
const from = Number(a.from ?? 0.5)
const to = Number(a.to ?? 5)
const every = Number(a.every ?? 0.3)
const session = await openSession({ format: String(a.format ?? 'preview'), assets: 'web', mode: 'live', query: hand ? '&clock=steps&step=3' : `&bot=${bot}&seed=${seed}&clock=steps&step=3` })
const r = await session.page.evaluate(() => {
  const b = document.getElementById('stage').getBoundingClientRect()
  return { left: b.left, top: b.top, width: b.width, height: b.height }
})
const put = (x, y) => session.page.mouse.move(r.left + (x / 1920) * r.width, r.top + (y / 1080) * r.height)
if (hand) await put(hand[0], hand[1])
const tiles = []
const said = []
let now = (await session.page.evaluate(() => window.liveRun.state())).time
const start = now
for (let t = from; t <= to + 1e-9; t += every) {
  if (hand) {
    while (now - start < t - 0.05) {
      const u = Math.max(0, now - start - (hand[4] ?? 1))
      await put(Math.max(40, Math.min(1880, hand[0] + hand[2] * u)), Math.max(40, Math.min(1040, hand[1] + hand[3] * u)))
      now = (await session.page.evaluate(() => window.liveRun.advance(0.05, true))).time
    }
  }
  const s = await session.page.evaluate((dt) => window.liveRun.advance(dt), Math.max(0, start + t - now))
  now = s.time
  tiles.push({ png: Buffer.from(s.png.split(',')[1], 'base64'), label: `${(s.time - start).toFixed(2)} s  ${bot}` })
  const told = await session.page.evaluate(() => window.liveRun.told())
  said.push(JSON.stringify(told).length)
}
const told = await session.page.evaluate(() => window.liveRun.told())
const file = at('out', 'work', 'sheets', `pinball-${String(a.name ?? 'live')}.jpg`)
const g = await composeSheet(tiles, file, { edge: Number(a.edge ?? 1200), heading: `the live site, step 3, the bot ${bot}, seed ${seed}, ${from} s to ${to} s`, columns: Number(a.columns ?? 0) })
console.log(`wrote ${path.relative(at(), file)}: ${tiles.length} pictures, ${g.width} by ${g.height}; problems: ${[...new Set(session.problems)].join(' | ') || 'none'}`)
console.log(JSON.stringify(told).slice(0, 1500))
await session.close()
process.exit(0)

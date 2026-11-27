// Polish date, a measure and no change: the pack's own visitor on the live site up to step 4, then a picture of every sixtieth of a second round one error slab at the lower edge.
// node pipeline/phase5/polish-date-boss.mjs LABEL FIRST LAST CX CY [W H]   FIRST and LAST are sixtieths of a second of the visit (tests/polish-date-boss-measure.test.ts gives them)
// With FIND=EVERY,MOST in the environment it looks instead: from FIRST on a picture every EVERY sixtieths; LEAVES sixtieths after the first one whose lower left differs from the picture at FIRST it takes every sixtieth, until that part is as at FIRST again on 3 pictures or MOST such pictures are kept.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'
import { keyBlock, makeVisitor, VISITOR } from '../../tools/lib/pack-site.mjs'

const [, , label = 'boss', first = '8806', last = '8832', cx = '407', cy = '960', w = '400', h = '240'] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const dir = path.join('out', 'work', 'polish-date', label)
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: '&clock=steps&quality=high' })
await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
const tell = (dt, shot) =>
  session.page.evaluate(([d, s]) => {
    const r = d > 0 ? window.liveRun.advance(d, !s) : null
    const t = window.liveRun.told()
    return { time: t.time, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control, pageTime: t.pageTime, png: r && s ? r.png : '' }
  }, [dt, shot])
const tiles = []
const FIND = process.env.FIND ? process.env.FIND.split(',').map(Number) : null
// the part of the screen a slab lies in: left of the Submit machine, below the card
const PART = { left: 0, top: 600, width: 1200, height: 480 }
// a byte of that part counts as changed past this many levels, and the part as holding a slab past this many changed bytes (the cursor alone changes under 9000)
const LEVELS = 40
const BYTES = 30000
// sixtieths from a slab's first picture to a little before it starts to leave (the stepped measure: drawn from 8699, leaves from 8804)
const LEAVES = 88
let at = 0
let base = null
let found = false
let calm = 0
let kept = 0
const holds = async (png) => {
  const now = await sharp(png).extract(PART).raw().toBuffer()
  if (!base) {
    base = now
    return false
  }
  let n = 0
  for (let k = 0; k < now.length; k++) if (Math.abs(now[k] - base[k]) > LEVELS) n++
  return n > BYTES
}
try {
  const v = makeVisitor(1, VISITOR, keyBlock(cfg))
  let t = await tell(0, false)
  for (let i = 0; i < Number(last) && !t.finished; i++) {
    for (const a of v.act(t)) await send(session.page, a)
    const keep = i + 1 >= Number(first) && (!FIND || (found && i + 1 >= at + LEAVES) || (i + 1 - Number(first)) % FIND[0] === 0)
    t = await tell(1 / VISITOR.hz, keep)
    if (i % 1200 === 0) console.log(`tick ${i + 1}: ${t.page} at ${t.time.toFixed(2)} s`)
    if (!keep) continue
    const png = Buffer.from(t.png.split(',')[1], 'base64')
    fs.writeFileSync(path.join(dir, `${String(i + 1).padStart(6, '0')}.png`), png)
    if (FIND) {
      const slab = await holds(png)
      if (slab && !found) {
        at = i + 1
        console.log(`found at picture ${at}`)
      }
      found = found || slab
      const close = found && i + 1 >= at + LEAVES
      calm = close && !slab ? calm + 1 : 0
      kept += close ? 1 : 0
      console.log(`picture ${i + 1} ${slab ? 'holds' : 'plain'}`)
      if (calm >= 3 || kept >= FIND[1]) break
    }
    const left = Math.max(0, Math.min(1920 - Number(w), Math.round(Number(cx) - Number(w) / 2)))
    const top = Math.max(0, Math.min(1080 - Number(h), Math.round(Number(cy) - Number(h) / 2)))
    tiles.push({ png: await sharp(png).extract({ left, top, width: Number(w), height: Number(h) }).png().toBuffer(), text: `${((i + 1) / 60).toFixed(2)} s, picture ${i + 1}, ${t.page}` })
  }
} finally {
  await session.close()
}
const C = 4
const bar = 18
const W = C * (Number(w) + 4)
const H = bar + Math.ceil(tiles.length / C) * (Number(h) + bar)
const marks = tiles.map((tile, n) => `<text x="${(n % C) * (Number(w) + 4) + 4}" y="${bar + Math.floor(n / C) * (Number(h) + bar) + Number(h) + 13}" font-family="sans-serif" font-size="11" fill="#fff">${tile.text}</text>`).join('')
const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="4" y="13" font-family="sans-serif" font-size="12" fill="#fff">${label}: the pack's visitor on the live site, level high, 1920 by 1080, every sixtieth of a second, real size; the lower edge of each picture is the lower edge of the screen</text>${marks}</svg>`
const out = path.join('out', 'work', 'polish-date', `${label}.png`)
await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
  .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % C) * (Number(w) + 4), top: bar + Math.floor(n / C) * (Number(h) + bar) })), { input: Buffer.from(head), left: 0, top: 0 }])
  .png()
  .toFile(out)
console.log(out, tiles.length)

// The live site under the pack's own visitor, drawn in consecutive frames of 60 a second round chosen frames.
// node pipeline/phase5/polish-tug4-shots.mjs walk LABEL FIRST-LAST [FIRST-LAST ...]     walks once and keeps a picture of every frame in the spans
// node pipeline/phase5/polish-tug4-shots.mjs sheet LABEL NAME FIRST STRIDE COUNT CX CY [W H]   lays COUNT pictures from frame FIRST on one sheet, cut at real size round CX, CY (hd pixels)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'
import { keyBlock, makeVisitor, RUN, VISITOR } from '../../tools/lib/pack-site.mjs'

const [, , what, label = 'run', ...rest] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const dir = path.join('out', 'work', 'polish-tug4', label)
const TILE = { cols: 4, gap: 6, bar: 26 }

const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}

if (what === 'walk') {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const want = new Set()
  for (const span of rest) {
    const [a, b] = span.split('-').map(Number)
    for (let i = a; i <= b; i++) want.add(i)
  }
  const last = Math.max(...want)
  const f = cfg.formats[process.env.POLISH_FORMAT || RUN.format]
  const k = f.width / cfg.formats.hd.width
  const session = await openSession({ format: f.id, assets: RUN.assets, mode: 'live', query: '&clock=steps&quality=high' })
  await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const tell = (dt) =>
    session.page.evaluate((d) => {
      if (d > 0) window.liveRun.advance(d, true)
      const t = window.liveRun.told()
      return { time: t.time, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control, pageTime: t.pageTime }
    }, dt)
  const rows = []
  try {
    const v = makeVisitor(k, VISITOR, keyBlock(cfg))
    let t = await tell(0)
    for (let i = 0; i <= last; i++) {
      const p = v.pointer()
      rows.push([i, Math.round(t.time * 1000) / 1000, t.hero.x, t.hero.y, p.x, p.y, t.scroll, t.control ? 1 : 0])
      if (want.has(i)) {
        const shot = await session.page.evaluate(() => window.liveRun.state().png)
        fs.writeFileSync(path.join(dir, `${String(i).padStart(6, '0')}.png`), Buffer.from(shot.split(',')[1], 'base64'))
      }
      if (t.finished || i === last) break
      for (const a of v.act(t)) await send(session.page, a)
      t = await tell(1 / VISITOR.hz)
    }
  } finally {
    await session.close()
  }
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ rows }) + '\n')
  console.log(`${rows.length} frames walked, ${want.size} kept in ${dir}`)
} else if (what === 'sheet') {
  const [name, first, stride, count, cx, cy, w = 460, h = 290] = rest
  const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'))
  const f = cfg.formats[process.env.POLISH_FORMAT || RUN.format]
  const k = f.width / cfg.formats.hd.width
  const W0 = Number(w)
  const H0 = Number(h)
  const scroll = (i) => (run.rows.find((r) => r[0] === i) || [0, 0, 0, 0, 0, 0, 0])[6]
  const tiles = []
  let at = Number(first)
  for (let n = 0; n < Number(count); n++, at += Number(stride)) {
    const file = path.join(dir, `${String(at).padStart(6, '0')}.png`)
    if (!fs.existsSync(file)) break
    const left = Math.round(Math.min(f.width - W0, Math.max(0, Number(cx) * k - W0 / 2)))
    const top = Math.round(Math.min(f.height - H0, Math.max(0, (Number(cy) - scroll(at)) * k - H0 / 2)))
    const total = Math.round((at / VISITOR.hz) * 100)
    tiles.push({ png: await sharp(file).extract({ left, top, width: W0, height: H0 }).png().toBuffer(), text: `${Math.floor(total / 6000)}:${String(Math.floor((total % 6000) / 100)).padStart(2, '0')}.${String(total % 100).padStart(2, '0')}  frame ${at}` })
  }
  const rowsN = Math.ceil(tiles.length / TILE.cols)
  const W = TILE.cols * W0 + (TILE.cols - 1) * TILE.gap
  const H = TILE.bar + rowsN * (H0 + TILE.bar)
  const marks = tiles.map((tile, n) => `<text x="${(n % TILE.cols) * (W0 + TILE.gap) + 6}" y="${TILE.bar + Math.floor(n / TILE.cols) * (H0 + TILE.bar) + H0 + 17}" font-family="sans-serif" font-size="12" fill="#fff">${tile.text}</text>`).join('')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="6" y="17" font-family="sans-serif" font-size="13" fill="#fff">${label}: ${name}, consecutive pictures every ${Number(stride) === 1 ? 'frame' : `${stride} frames`} of ${VISITOR.hz} a second, real size</text>${marks}</svg>`
  const out = path.join('out', 'work', 'polish-tug4', `${label}-${name}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
    .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % TILE.cols) * (W0 + TILE.gap), top: TILE.bar + Math.floor(n / TILE.cols) * (H0 + TILE.bar) })), { input: Buffer.from(head), left: 0, top: 0 }])
    .png()
    .toFile(out)
  console.log(out)
} else {
  console.log('say walk LABEL SPANS or sheet LABEL NAME FIRST STRIDE COUNT CX CY')
}
